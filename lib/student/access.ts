import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { accountCollection, loginIdentifier } from "../admin/accounts";
import { allowLogin, authenticateAdmin } from "../admin/auth";
import { classroomDatabase, studentProfiles } from "./database";
import { normalizeStudentId } from "./identity";
import { teacherIdByName } from "./registry";

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const codePattern = /^[a-f0-9]{32}$/i;
const activeStudent = {
  sourceId: { $type: "string" as const },
  deletedAt: { $exists: false },
};

type LessonSession = {
  _id: string;
  studentId: string;
  kind: "student" | "teacher";
  credentialDigest: string;
  expiresAt: Date;
};

let sessionIndex: Promise<string> | undefined;

async function sessions() {
  return (await classroomDatabase()).collection<LessonSession>(
    "lesson_sessions",
  );
}

export function createStudentAccess() {
  const code = randomBytes(16).toString("hex").toUpperCase();
  return { code, credentialDigest: digest(code) };
}

export async function resetStudentAccess(studentId: string, teacherId: string) {
  const { code, credentialDigest } = createStudentAccess();
  const changed = await (
    await studentProfiles()
  ).updateOne(
    { _id: studentId, teacherIds: teacherId, ...activeStudent },
    { $set: { lessonAccessDigest: credentialDigest } },
  );
  return changed.matchedCount ? code : null;
}

export async function openLessonSession(
  request: Request,
  identity: string,
  credential: string,
) {
  let id: string | undefined;
  try {
    id = normalizeStudentId(identity);
  } catch {
    // A teacher can enter their full name or email address.
  }
  const student = id
    ? await (
        await studentProfiles()
      ).findOne(
        { _id: id, ...activeStudent },
        { projection: { lessonAccessDigest: 1 } },
      )
    : null;
  let owner: Pick<LessonSession, "studentId" | "kind" | "credentialDigest">;
  if (student) {
    const code = credential.trim();
    const expected = student.lessonAccessDigest;
    if (
      !codePattern.test(code) ||
      !expected ||
      !/^[a-f0-9]{64}$/.test(expected) ||
      !timingSafeEqual(
        Buffer.from(digest(code.toUpperCase())),
        Buffer.from(expected),
      )
    )
      return null;
    owner = {
      studentId: student._id,
      kind: "student",
      credentialDigest: expected,
    };
  } else {
    // Student codes are random 128-bit secrets. Rate-limit teacher password checks independently.
    if (id && /^\d{2}S\d{4}$/.test(id)) return null;
    if (!(await allowLogin(request, "lesson")))
      throw Response.json(
        { error: "Олон удаа оролдлоо. 15 минутын дараа дахин оролдоорой." },
        { status: 429 },
      );
    const direct = loginIdentifier(identity);
    let account = direct ? await authenticateAdmin(direct, credential) : null;
    if (!account) {
      const teacherId = await teacherIdByName(identity);
      if (teacherId && teacherId !== direct)
        account = await authenticateAdmin(teacherId, credential);
    }
    if (!account || account.setupRequired) return null;
    owner = {
      studentId: normalizeStudentId(account._id),
      kind: "teacher",
      credentialDigest: digest(account.passwordHash),
    };
  }
  const token = randomBytes(32).toString("base64url");
  const collection = await sessions();
  sessionIndex ??= collection
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    .catch((error: unknown) => {
      sessionIndex = undefined;
      throw error;
    });
  await sessionIndex;
  await collection.insertOne({
    _id: digest(token),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    ...owner,
  });
  return { id: owner.studentId, token };
}

export async function lessonIdentity(request: Request, studentId: string) {
  const token = request.headers.get("Authorization")?.split(" ");
  if (
    token?.length !== 2 ||
    token[0] !== "Bearer" ||
    !tokenPattern.test(token[1])
  )
    return null;
  const session = await (
    await sessions()
  ).findOne({
    _id: digest(token[1]),
    studentId,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  if (session.kind === "teacher") {
    const account = await (
      await accountCollection()
    ).findOne(
      {
        _id: studentId.toLowerCase(),
        active: true,
        setupRequired: { $ne: true },
      },
      { projection: { passwordHash: 1 } },
    );
    return account && digest(account.passwordHash) === session.credentialDigest
      ? { kind: "teacher" as const }
      : null;
  }
  const profile = await (
    await studentProfiles()
  ).findOne(
    {
      _id: studentId,
      ...activeStudent,
      lessonAccessDigest: session.credentialDigest,
    },
    { projection: { name: 1, groupId: 1, teacherIds: 1 } },
  );
  return profile ? { kind: "student" as const, profile } : null;
}
