import { courses } from "../student/identity";
import { progressCollection } from "../student/database";
import { accountCollection, loginIdentifier } from "./accounts";
import { AccessError, adminCollections, InputError } from "./data";
import { catalog, parseProgress, summarize } from "./progress";
import type { SchoolDirectory } from "./school-directory-types";

export function canViewSchoolDirectory(accountId: string) {
  return (process.env.ADMIN_SCHOOL_ROSTER_USERS ?? "")
    .split(",")
    .some((value) => loginIdentifier(value) === accountId);
}

export async function schoolDirectory(
  accountId: string,
  selectedCourse: unknown,
): Promise<SchoolDirectory> {
  if (!canViewSchoolDirectory(accountId))
    throw new AccessError("Сургуулийн нэгдсэн бүртгэл харах эрхгүй байна.");
  const course = courses.find((item) => item === selectedCourse);
  if (!course) throw new InputError("Хичээлээ сонгоно уу.");

  const { profiles, groups } = await adminCollections();
  const [people, classrooms, teachers] = await Promise.all([
    profiles
      .find(
        { sourceId: { $type: "string" }, deletedAt: { $exists: false } },
        { projection: { _id: 1, name: 1, groupId: 1, teacherIds: 1 } },
      )
      .toArray(),
    groups
      .find({}, { projection: { _id: 1, name: 1, grade: 1, teacherIds: 1 } })
      .sort({ grade: 1, name: 1 })
      .toArray(),
    (await accountCollection())
      .find({}, { projection: { _id: 1, name: 1, active: 1 } })
      .sort({ name: 1 })
      .toArray(),
  ]);
  const saved = await (
    await progressCollection()
  )
    .aggregate<{
      _id: string;
      adminSummary?: ReturnType<typeof summarize>;
      legacyProgress?: string;
    }>([
      { $match: { _id: { $in: people.map(({ _id }) => `${course}:${_id}`) } } },
      {
        $project: {
          adminSummary: 1,
          legacyProgress: {
            $cond: [
              { $ifNull: ["$adminSummary", false] },
              "$$REMOVE",
              "$progressJson",
            ],
          },
        },
      },
    ])
    .toArray();
  const summaries = new Map(
    saved.map((doc) => [
      doc._id,
      doc.adminSummary ??
        summarize(course, parseProgress(doc.legacyProgress ?? "{}")),
    ]),
  );
  const validClass = new Set(classrooms.map(({ _id }) => _id));
  return {
    classrooms: classrooms.map(({ _id, name, grade, teacherIds }) => ({
      id: _id,
      name,
      grade,
      teacherIds,
    })),
    teachers: teachers.map(({ _id, name, active }) => ({
      id: _id,
      name,
      active,
    })),
    students: people
      .map(({ _id, name, groupId, teacherIds }) => {
        const summary = summaries.get(`${course}:${_id}`);
        return {
          id: _id,
          name,
          groupId: groupId && validClass.has(groupId) ? groupId : null,
          teacherIds: teacherIds ?? [],
          completed: summary?.completed ?? 0,
          started:
            !!summary &&
            (summary.attempted > 0 ||
              summary.completed > 0 ||
              summary.assisted > 0 ||
              (summary.quizzes?.length ?? 0) > 0),
        };
      })
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, "mn")),
    exerciseCount: catalog[course].length,
  };
}
