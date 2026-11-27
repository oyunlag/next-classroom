import { openLessonSession } from "@/lib/student/access";
import { MAX_TEACHER_NAME_LENGTH } from "@/lib/student/identity";
import { readJsonObject, sameOrigin } from "@/lib/http/request";

export const runtime = "nodejs";
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const { identity, credential } = await readJsonObject(request, 8192);
    if (
      typeof identity !== "string" ||
      !identity.trim() ||
      identity.length > MAX_TEACHER_NAME_LENGTH ||
      typeof credential !== "string" ||
      !credential ||
      credential.length > 1024
    )
      return json({ error: "Нэвтрэх мэдээллээ шалгана уу." }, 400);
    const session = await openLessonSession(request, identity, credential);
    return session
      ? json(session)
      : json(
          { error: "Нэвтрэх нэр, хичээлийн код эсвэл нууц үг буруу байна." },
          401,
        );
  } catch (error) {
    if (error instanceof Response) {
      error.headers.set("Cache-Control", "private, no-store");
      return error;
    }
    return json({ error: "Холболт тасарлаа. Дахин оролдоно уу." }, 503);
  }
}
