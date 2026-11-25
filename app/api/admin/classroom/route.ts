import {
  classroomOverview,
  saveClassroom,
  studentSupport,
} from "@/lib/admin/classroom-data";
import { adminError, adminJson, requireAdmin } from "@/lib/admin/http";
import { readJsonObject, sameOrigin } from "@/lib/http/request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const studentId = params.get("studentId");
    const course = params.get("course");
    return adminJson(
      studentId
        ? await studentSupport(identity.id, studentId, course)
        : await classroomOverview(identity.id, {
            groupId: params.get("groupId"),
            day: params.get("day"),
            course,
          }),
    );
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminJson({ error: "Forbidden" }, 403);
    const identity = await requireAdmin(request);
    await saveClassroom(identity.id, await readJsonObject(request, 16 * 1024));
    return adminJson({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}
