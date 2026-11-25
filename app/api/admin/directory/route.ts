import { adminError, adminJson, requireAdmin } from "@/lib/admin/http";
import { schoolDirectory } from "@/lib/admin/school-directory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await requireAdmin(request);
    return adminJson(
      await schoolDirectory(
        identity.id,
        new URL(request.url).searchParams.get("course"),
      ),
    );
  } catch (error) {
    return adminError(error);
  }
}
