import { normalizeStudentId } from "../student/identity";
import { membershipChange } from "../student/membership";
import { classroomDatabase } from "../student/database";
import { accountCollection } from "./accounts";
import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "./auth";
import { adminCollections } from "./data";

export type LmsImport = {
  teachers: { id: string; sourceId: string; name: string; email: string }[];
  groups: {
    sourceId: string;
    name: string;
    grade: number;
    teacherIds: string[];
  }[];
  students: {
    id: string;
    sourceId: string;
    name: string;
    classSourceId: string;
    teacherIds: string[];
  }[];
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid LMS object");
  return value as Record<string, unknown>;
};
const list = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw new Error("Invalid LMS list");
  return value;
};
const text = (value: unknown, max = 100): string => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error("Invalid LMS field");
  return value.trim();
};
export function parseLmsImport(value: unknown): LmsImport {
  const root = record(value),
    teachers: LmsImport["teachers"] = [],
    groups = new Map<string, LmsImport["groups"][number]>(),
    students = new Map<string, LmsImport["students"][number]>();
  const usernames = new Set<string>(),
    emails = new Set<string>(),
    classNames = new Map<string, string>();
  for (const item of list(root.teachers)) {
    const t = record(item),
      id = text(t.requestedUsername).toLowerCase(),
      email = text(t.email, 254).toLowerCase();
    if (
      !/^[a-z0-9][a-z0-9._-]*$/.test(id) ||
      !/^[-a-z0-9._]+@oyunlag\.edu\.mn$/.test(email) ||
      usernames.has(id) ||
      emails.has(email)
    )
      throw new Error("Invalid or duplicated teacher login");
    usernames.add(id);
    emails.add(email);
    teachers.push({
      id,
      sourceId: text(t.id),
      name: `${text(t.lastName)} ${text(t.firstName)}`,
      email,
    });
    for (const gradeValue of list(t.grades))
      for (const classValue of list(record(gradeValue).classes)) {
        const c = record(classValue),
          sourceId = text(c.id),
          name = text(c.name, 60),
          grade = c.grade;
        if (typeof grade !== "number" || ![6, 7, 8, 9, 10, 11].includes(grade))
          throw new Error("Unexpected grade");
        const key = name.normalize("NFKC").toLocaleLowerCase("mn");
        if (classNames.has(key) && classNames.get(key) !== sourceId)
          throw new Error("Ambiguous class name");
        classNames.set(key, sourceId);
        let group = groups.get(sourceId);
        if (group && (group.name !== name || group.grade !== grade))
          throw new Error("Conflicting class records");
        if (!group) {
          group = { sourceId, name, grade, teacherIds: [] };
          groups.set(sourceId, group);
        }
        if (!group.teacherIds.includes(id)) group.teacherIds.push(id);
        for (const courseValue of list(c.courses))
          for (const studentValue of list(record(courseValue).students)) {
            const s = record(studentValue),
              studentId = normalizeStudentId(text(s.studentCode, 40)),
              lmsId = text(s.id);
            if (text(s.classId) !== sourceId)
              throw new Error("Student class does not match");
            const name = text(s.displayName, 80),
              previous = students.get(studentId);
            if (
              previous &&
              (previous.sourceId !== lmsId ||
                previous.classSourceId !== sourceId ||
                previous.name !== name)
            )
              throw new Error("Conflicting student records");
            const student = previous || {
              id: studentId,
              sourceId: lmsId,
              name,
              classSourceId: sourceId,
              teacherIds: [],
            };
            if (!student.teacherIds.includes(id)) student.teacherIds.push(id);
            students.set(studentId, student);
          }
      }
  }
  if (teachers.length !== 3) throw new Error("Expected exactly three teachers");
  if (
    new Set([...students.values()].map((s) => s.sourceId)).size !==
    students.size
  )
    throw new Error("One LMS student has multiple codes");
  return {
    teachers,
    groups: [...groups.values()],
    students: [...students.values()],
  };
}
async function prepareLmsImport(plan: LmsImport) {
  const { profiles, groups } = await adminCollections(),
    accounts = await accountCollection();
  const [existingGroups, existingProfiles, existingAccounts] =
    await Promise.all([
      groups.find({}).toArray(),
      profiles.find({}).toArray(),
      accounts.find({}).toArray(),
    ]);
  const classIds = new Map<string, string>();
  for (const group of plan.groups) {
    const key = group.name.normalize("NFKC").toLocaleLowerCase("mn");
    const existing =
      existingGroups.find((g) => g.sourceId === group.sourceId) ||
      existingGroups.find((g) => g.key === key);
    if (existing?.sourceId && existing.sourceId !== group.sourceId)
      throw new Error("Class source conflict");
    classIds.set(
      group.sourceId,
      existing ? existing._id : `lms-${group.sourceId}`,
    );
  }
  const manualLinks: {
    id: string;
    name: string;
    classId: string;
    lmsSourceId: string;
  }[] = [];
  const profileById = new Map(
    existingProfiles.map((profile) => [profile._id, profile]),
  );
  for (const student of plan.students) {
    const existing = profileById.get(student.id);
    if (!existing?.sourceId || existing.sourceId === student.sourceId) continue;
    const classId = classIds.get(student.classSourceId);
    if (
      !existing.manualEnrollment ||
      existing.sourceId !== `manual:${student.id}` ||
      !classId ||
      existing.groupId !== classId ||
      existing.name
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase() !==
        student.name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()
    )
      throw new Error(`Student source conflict for ${student.id}`);
    manualLinks.push({
      id: student.id,
      name: student.name,
      classId,
      lmsSourceId: student.sourceId,
    });
  }
  for (const teacher of plan.teachers) {
    if (
      existingAccounts.some(
        (a) =>
          (a.email === teacher.email && a._id !== teacher.id) ||
          (a._id === teacher.id && a.email !== teacher.email),
      )
    )
      throw new Error("Admin identity conflict");
  }
  return {
    profiles,
    groups,
    accounts,
    existingAccounts,
    classIds,
    manualLinks,
    profileById,
  };
}

export async function previewLmsImport(plan: LmsImport) {
  const { manualLinks } = await prepareLmsImport(plan);
  return { manualLinks };
}

export async function applyLmsImport(
  plan: LmsImport,
  recordSetup: (id: string, secret: string) => Promise<void>,
  approvedManualLinks: readonly string[] = [],
) {
  const {
    profiles,
    groups,
    accounts,
    existingAccounts,
    classIds,
    manualLinks,
    profileById,
  } = await prepareLmsImport(plan);
  const approved = new Set(approvedManualLinks);
  if (manualLinks.some(({ id }) => !approved.has(id)))
    throw new Error(
      "Manual enrollments require explicit --link-manual=<student ID> approval after preview.",
    );
  const linking = new Set(manualLinks.map(({ id }) => id));
  await groups.createIndex({ key: 1 }, { unique: true });
  await accounts.createIndex({ email: 1 }, { unique: true });
  for (const group of plan.groups)
    await groups.updateOne(
      { _id: classIds.get(group.sourceId)! },
      {
        $set: {
          name: group.name,
          key: group.name.normalize("NFKC").toLocaleLowerCase("mn"),
          sourceId: group.sourceId,
          grade: group.grade,
          teacherIds: group.teacherIds,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  for (const teacher of plan.teachers) {
    const existing = existingAccounts.find((a) => a._id === teacher.id);
    const identity = {
      name: teacher.name,
      email: teacher.email,
      sourceId: teacher.sourceId,
    };
    if (
      existing &&
      !(await verifyPassword(existing.email, existing.passwordHash))
    ) {
      await accounts.updateOne({ _id: teacher.id }, { $set: identity });
      continue;
    }
    const secret = randomBytes(24).toString("base64url");
    const passwordHash = await hashPassword(secret);
    // Persist the private handoff before changing an account, including on partial imports.
    await recordSetup(teacher.id, secret);
    if (existing) {
      const changed = await accounts.updateOne(
        { _id: teacher.id, passwordHash: existing.passwordHash },
        { $set: { ...identity, passwordHash, setupRequired: true } },
      );
      if (!changed.matchedCount)
        throw new Error(
          "Teacher credentials changed during import. Retry with a fresh snapshot.",
        );
    } else {
      await accounts.insertOne({
        _id: teacher.id,
        ...identity,
        active: true,
        passwordHash,
        setupRequired: true,
      });
    }
  }
  if (plan.students.length)
    await profiles.bulkWrite(
      plan.students.map((s) => {
        const existing = profileById.get(s.id);
        const now = new Date();
        const membership = membershipChange(
          {
            name: s.name,
            sourceId: s.sourceId,
            groupId: classIds.get(s.classSourceId)!,
            teacherIds: s.teacherIds,
            updatedAt: now,
          },
          now,
          { link: linking.has(s.id) },
        );
        return {
          updateOne: {
            filter: {
              _id: s.id,
              ...(existing?.sourceId
                ? { sourceId: existing.sourceId }
                : { sourceId: { $exists: false } }),
              ...(linking.has(s.id) && {
                manualEnrollment: true,
                name: existing?.name,
                groupId: existing?.groupId,
              }),
            },
            update: [
              ...membership,
              { $set: { notes: { $ifNull: ["$notes", ""] } } },
            ],
            upsert: true,
          },
        };
      }),
    );
  const db = await classroomDatabase();
  // Old shared-password sessions have no account identity and cannot authorize requests.
  return {
    teachers: plan.teachers.length,
    classes: plan.groups.length,
    students: plan.students.length,
    progressRecords: await db.collection("student_progress").countDocuments(),
  };
}
