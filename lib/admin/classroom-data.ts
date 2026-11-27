import {
  classroomDatabase,
  courseEntryCollection,
  progressCollection,
} from "../student/database";
import {
  isSchoolDay,
  schoolDay,
  type DailyActivity,
  type Guidance,
} from "../student/classroom";
import { courses, normalizeStudentId, type Course } from "../student/identity";
import {
  AccessError,
  adminCollections,
  InputError,
  requireStudent,
} from "./data";
import { classroomScope } from "../student/membership";
import type { StudentProfile } from "../student/database";
import {
  catalog,
  parseProgress,
  summarize,
  summaryFields,
  summaryFromRecord,
} from "./progress";
import {
  supportKinds,
  type ClassroomOverview,
  type StudentSupport,
  type SupportEntry,
} from "./classroom-types";

type TargetDocument = { _id: string; completed: number };
type SupportDocument = { _id: string; entries: SupportEntry[] };
const supportKey = (teacherId: string, studentId: string, course: Course) =>
  JSON.stringify([teacherId, studentId, course]);
const targetKey = (teacherId: string, groupId: string, course: Course) =>
  JSON.stringify([teacherId, groupId, course]);

async function targets() {
  return (await classroomDatabase()).collection<TargetDocument>(
    "classroom_targets",
  );
}
async function support() {
  return (await classroomDatabase()).collection<SupportDocument>(
    "student_support",
  );
}
function readCourse(value: unknown) {
  const course = courses.find((course) => course === value);
  if (!course) throw new InputError("Хичээлээ сонгоно уу.");
  return course;
}
function readStudent(value: unknown) {
  try {
    return normalizeStudentId(value);
  } catch {
    throw new InputError("Сурагчийн ID буруу байна.");
  }
}
async function requireGroup(teacherId: string, groupId: unknown) {
  if (typeof groupId !== "string" || !groupId || groupId.length > 64)
    throw new InputError("Ангиа сонгоно уу.");
  const { groups } = await adminCollections();
  const group = await groups.findOne(
    { _id: groupId, teacherIds: teacherId },
    { projection: { _id: 1 } },
  );
  if (!group) throw new AccessError("Энэ ангид хандах эрхгүй байна.");
  return groupId;
}
function activityDto(day: DailyActivity<Date> | undefined): DailyActivity {
  return {
    ...(day?.enteredAt && { enteredAt: day.enteredAt.toISOString() }),
    ...(day?.work && {
      work: { ...day.work, savedAt: day.work.savedAt.toISOString() },
    }),
  };
}

export async function classroomOverview(
  teacherId: string,
  input: {
    groupId: unknown;
    course: unknown;
    day: unknown;
  },
): Promise<ClassroomOverview> {
  const course = readCourse(input.course);
  const day = input.day;
  if (!isSchoolDay(day) || day > schoolDay(new Date()))
    throw new InputError("Ирц харах өдрөө зөв сонгоно уу.");
  const groupId = await requireGroup(teacherId, input.groupId);
  const { profiles } = await adminCollections();
  const scope = classroomScope(groupId, teacherId);
  const current = {
    groupId,
    teacherIds: teacherId,
    deletedAt: { $exists: false },
    $or: [
      { classroomSince: { $exists: false } },
      { classroomSince: { $lte: day } },
    ],
  };
  const historical = {
    classroomHistory: {
      $elemMatch: {
        groupId,
        teacherIds: teacherId,
        until: { $gte: day },
        $or: [{ since: null }, { since: { $lte: day } }],
      },
    },
  };
  type Member = Pick<
    StudentProfile,
    | "_id"
    | "name"
    | "groupId"
    | "teacherIds"
    | "deletedAt"
    | "classroomSince"
    | "classroomHistory"
  >;
  const [people, target] = await Promise.all([
    profiles
      .find<Member>(
        { sourceId: { $type: "string" }, $or: [current, historical] },
        {
          projection: {
            name: 1,
            groupId: 1,
            teacherIds: 1,
            deletedAt: 1,
            classroomSince: 1,
            classroomHistory: 1,
          },
        },
      )
      .toArray(),
    (await targets()).findOne({ _id: targetKey(teacherId, groupId, course) }),
  ]);
  const activeAccess = new Set(
    people
      .filter(
        (person) => !person.deletedAt && person.teacherIds?.includes(teacherId),
      )
      .map((person) => `${course}:${person._id}`),
  );
  const ids = { _id: { $in: people.map(({ _id }) => `${course}:${_id}`) } };
  const [progress, entries] = await Promise.all([
    (await progressCollection())
      .aggregate<{
        _id: string;
        adminSummary?: ReturnType<typeof summaryFromRecord>;
        legacyProgress?: string;
        classroomDays?: Record<string, DailyActivity<Date>["work"]>;
        classroomGroupDays?: Record<
          string,
          Record<string, DailyActivity<Date>["work"]>
        >;
      }>([
        { $match: ids },
        {
          $project: {
            adminSummary: {
              $cond: [
                { $in: ["$_id", [...activeAccess]] },
                "$adminSummary",
                "$$REMOVE",
              ],
            },
            legacyProgress: {
              $cond: [
                { $in: ["$_id", [...activeAccess]] },
                summaryFields.legacyProgress,
                "$$REMOVE",
              ],
            },
            [`classroomDays.${day}`]: 1,
            [`classroomGroupDays.${day}`]: 1,
          },
        },
      ])
      .toArray(),
    (await courseEntryCollection())
      .find(ids, {
        projection: { [`days.${day}`]: 1, [`groupDays.${day}`]: 1 },
      })
      .toArray(),
  ]);
  const workByStudent = new Map(progress.map((doc) => [doc._id, doc]));
  const entryByStudent = new Map(entries.map((doc) => [doc._id, doc]));

  return {
    day,
    exerciseCount: catalog[course].length,
    target: target?.completed ?? 0,
    students: people
      .map((person) => {
        const key = `${course}:${person._id}`;
        const doc = workByStudent.get(key);
        const entry = entryByStudent.get(key);
        const history = person.classroomHistory?.find(
          (item) => (!item.since || item.since <= day) && day <= item.until,
        );
        // Legacy activity predates scoped writes. Attribute it to the earliest known assignment for that day.
        const legacyScope = history
          ? history.groupId === groupId &&
            history.teacherIds.includes(teacherId)
          : person.groupId === groupId &&
            person.teacherIds?.includes(teacherId);
        const dayEntries = entry?.groupDays?.[day];
        const dayWork = doc?.classroomGroupDays?.[day];
        const work = dayWork
          ? dayWork[scope]
          : legacyScope
            ? doc?.classroomDays?.[day]
            : undefined;
        const enteredAt = dayEntries
          ? dayEntries[scope]
          : legacyScope
            ? entry?.days?.[day]
            : undefined;
        const canViewWork = activeAccess.has(key);
        return {
          id: person._id,
          name:
            history?.groupId === groupId &&
            history.teacherIds.includes(teacherId)
              ? history.name
              : person.name,
          canViewWork,
          summary: doc && canViewWork ? summaryFromRecord(course, doc) : null,
          activity: activityDto({ enteredAt, work }),
        };
      })
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, "mn")),
  };
}

export async function studentSupport(
  teacherId: string,
  id: unknown,
  selectedCourse: unknown,
): Promise<StudentSupport> {
  const studentId = readStudent(id);
  const course = readCourse(selectedCourse);
  await requireStudent(studentId, teacherId);
  const [work, interventions] = await Promise.all([
    (await progressCollection()).findOne(
      { _id: `${course}:${studentId}` },
      { projection: { classroomDays: 1 } },
    ),
    (await support()).findOne({
      _id: supportKey(teacherId, studentId, course),
    }),
  ]);
  return {
    activity: Object.entries(work?.classroomDays ?? {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .map(([day, work]) => ({ day, ...activityDto({ work }) })),
    entries: [...(interventions?.entries ?? [])].reverse(),
  };
}

function supportText(value: unknown, max: number) {
  if (typeof value !== "string" || value.length > max)
    throw new InputError(
      `Тэмдэглэл, заавар тус бүр ${max} тэмдэгтээс хэтрэхгүй.`,
    );
  return value.trim();
}

export async function saveClassroom(
  teacherId: string,
  body: Record<string, unknown>,
) {
  const course = readCourse(body.course);
  if (body.action === "target") {
    const groupId = await requireGroup(teacherId, body.groupId);
    const { completed } = body;
    if (
      typeof completed !== "number" ||
      !Number.isInteger(completed) ||
      completed < 0 ||
      completed > catalog[course].length
    )
      throw new InputError("Дасгалын тоог шалгана уу.");
    await (
      await targets()
    ).updateOne(
      { _id: targetKey(teacherId, groupId, course) },
      { $set: { completed } },
      { upsert: true },
    );
    return;
  }
  if (body.action !== "support") throw new InputError("Үйлдлээ сонгоно уу.");
  const studentId = readStudent(body.studentId);
  await requireStudent(studentId, teacherId);
  const { id } = body;
  const kind = supportKinds.find((kind) => kind === body.kind);
  if (typeof id !== "string" || !/^[a-f0-9]{32}$/i.test(id) || !kind)
    throw new InputError("Дэмжлэгийн төрлөө сонгоно уу.");
  const instruction = supportText(body.instruction, 1200);
  const note = supportText(body.note, 1200);
  if (!instruction && !note)
    throw new InputError("Заавар эсвэл дэмжлэгийн тэмдэглэл бичнэ үү.");
  const progress = await (
    await progressCollection()
  ).findOne(
    { _id: `${course}:${studentId}` },
    { projection: { adminSummary: 1, progressJson: 1 } },
  );
  const entry: SupportEntry = {
    id,
    kind,
    instruction,
    note,
    createdAt: new Date().toISOString(),
    completed:
      progress?.adminSummary?.completed ??
      summarize(course, parseProgress(progress?.progressJson ?? "{}"))
        .completed,
  };
  await (
    await support()
  ).updateOne(
    { _id: supportKey(teacherId, studentId, course) },
    [
      {
        $set: {
          entries: {
            $let: {
              vars: { entries: { $ifNull: ["$entries", []] } },
              in: {
                $cond: [
                  {
                    $in: [
                      id,
                      {
                        $map: {
                          input: "$$entries",
                          as: "entry",
                          in: "$$entry.id",
                        },
                      },
                    ],
                  },
                  "$$entries",
                  { $concatArrays: ["$$entries", { $literal: [entry] }] },
                ],
              },
            },
          },
        },
      },
    ],
    { upsert: true },
  );
}

export async function studentGuidance(
  studentId: string,
  course: Course,
): Promise<Guidance[]> {
  const { profiles } = await adminCollections();
  const profile = await profiles.findOne(
    {
      _id: studentId,
      sourceId: { $type: "string" },
      deletedAt: { $exists: false },
    },
    { projection: { teacherIds: 1 } },
  );
  const keys = (profile?.teacherIds ?? []).map((id) =>
    supportKey(id, studentId, course),
  );
  if (!keys.length) return [];
  const docs = await (await support()).find({ _id: { $in: keys } }).toArray();
  return docs
    .flatMap(({ entries }) =>
      entries
        .filter(({ instruction }) => instruction)
        .map(({ id, instruction, createdAt }) => ({
          id,
          instruction,
          createdAt,
        })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
}
