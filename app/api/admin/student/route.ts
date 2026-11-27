import { resetStudentAccess } from "@/lib/student/access";
import { normalizeStudentId } from "@/lib/student/identity";
import { readJsonObject, sameOrigin } from "@/lib/http/request";
import { AccessError, InputError, studentDetail } from "@/lib/admin/data";
import { adminError, adminJson, requireAdmin } from "@/lib/admin/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    return adminJson(
      await studentDetail(
        identity.id,
        params.get("studentId"),
        params.get("course"),
        params.get("exerciseId") || undefined,
      ),
    );
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminJson({ error: "Forbidden" }, 403);
    const identity = await requireAdmin(request);
    const body = await readJsonObject(request, 1024);
    let id: string;
    try {
      id = normalizeStudentId(body.studentId);
    } catch {
      throw new InputError("Сурагчийн ID буруу байна.");
    }
    const code = await resetStudentAccess(id, identity.id);
    if (!code) throw new AccessError("Энэ сурагчид хандах эрхгүй байна.");
    return adminJson({ code });
  } catch (error) {
    return adminError(error);
  }
}
