import { lessonIdentity } from "@/lib/student/access";
import { studentExamActive } from "@/lib/exam/access";
import { hasWorkChange, parseProgress, summarize } from "@/lib/admin/progress";
import { studentGuidance } from "@/lib/admin/classroom-data";
import { classroomScopes } from "@/lib/student/membership";
import { schoolDay } from "@/lib/student/classroom";
import { readJsonObject, sameOrigin } from "@/lib/http/request";
import {
  courseEntryCollection,
  progressCollection,
} from "@/lib/student/database";
import { parseProgressRequest } from "@/lib/student/protocol";

export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024;
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function POST(request: Request) {
  // ID-only lesson access for students and teachers; does not create an admin session.
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  let body: ReturnType<typeof parseProgressRequest>;
  try {
    body = parseProgressRequest(await readJsonObject(request, MAX_BYTES));
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Invalid request" }, 400);
  }
  try {
    const { course, studentId } = body;
    const learner = await lessonIdentity(request, studentId);
    if (!learner)
      return json(
        {
          code: "lesson_session_required",
          error: "Хичээлд дахин нэвтэрнэ үү.",
        },
        401,
      );
    if (await studentExamActive(studentId))
      return json(
        {
          code: "exam_active",
          error: "Шалгалт идэвхтэй байна. /exam хуудсанд үргэлжлүүлнэ үү.",
        },
        423,
      );
    if (body.action === "guidance")
      return json({
        guidance:
          learner.kind === "student"
            ? await studentGuidance(studentId, course)
            : [],
      });
    const collection = await progressCollection();
    const _id = `${course}:${studentId}`;
    const now = new Date();
    const day = schoolDay(now);
    const scopes =
      learner.kind === "student" ? classroomScopes(learner.profile) : [];
    if (body.action === "load") {
      const doc = await collection.findOne(
        { _id },
        { projection: { progressJson: 1, revision: 1 } },
      );
      const progress = doc ? JSON.parse(doc.progressJson) : null;
      if (learner.kind === "student")
        await (
          await courseEntryCollection()
        ).updateOne(
          { _id },
          {
            $min: {
              [`days.${day}`]: now,
              ...Object.fromEntries(
                scopes.map((scope) => [`groupDays.${day}.${scope}`, now]),
              ),
            },
          },
          { upsert: true },
        );
      return json({
        progress,
        revision: doc?.revision ?? 0,
      });
    }
    const { revision } = body;
    const summary = summarize(course, body.progress);
    const previous =
      learner.kind === "student"
        ? await collection.findOne(
            { _id, revision },
            { projection: { progressJson: 1 } },
          )
        : null;
    const worked =
      learner.kind === "student" &&
      hasWorkChange(
        course,
        parseProgress(previous?.progressJson || "{}"),
        body.progress,
      );
    const dailyWork = {
      savedAt: now,
      completed: summary.completed,
      attempted: summary.attempted,
      assisted: summary.assisted,
    };
    const result = await collection.updateOne(
      { _id, revision },
      {
        $set: {
          studentId,
          course,
          progressJson: JSON.stringify(body.progress),
          updatedAt: now,
          adminSummary: summary,
          adminSummaryRevision: revision + 1,
          ...(worked && {
            lastWorkAt: now,
            [`classroomDays.${day}`]: dailyWork,
            ...Object.fromEntries(
              scopes.map((scope) => [
                `classroomGroupDays.${day}.${scope}`,
                dailyWork,
              ]),
            ),
          }),
        },
        $inc: { revision: 1 },
      },
      { upsert: revision === 0 },
    );
    if (!result.matchedCount && !result.upsertedCount)
      return json({ error: "Progress changed on another device" }, 409);
    return json({ revision: revision + 1 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    )
      return json({ error: "Progress changed on another device" }, 409);
    // Never expose database credentials or driver errors to students.
    return json({ error: "Progress service unavailable" }, 503);
  }
}
