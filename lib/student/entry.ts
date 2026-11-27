import { timeoutSignal } from "../http/timeout";
import { messages } from "./cloud";
import { normalizeStudentId } from "./identity";

let lesson: { id: string; token: string } | undefined;

export function lessonToken(id: string) {
  return lesson?.id === id ? lesson.token : undefined;
}

export function clearLessonToken() {
  lesson = undefined;
}

export async function enterLesson(
  identity: string,
  credential: string,
  login: (id: string, token: string) => Promise<unknown>,
) {
  const response = await fetch("/api/progress/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity, credential }),
    signal: timeoutSignal(15000),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw Object.assign(
      new Error(
        result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
          ? result.error
          : messages.offline,
      ),
      { status: response.status },
    );
  if (
    !result ||
    typeof result !== "object" ||
    !("id" in result) ||
    !("token" in result) ||
    typeof result.token !== "string"
  )
    throw new Error(messages.offline);
  const next = { id: normalizeStudentId(result.id), token: result.token };
  lesson = next;
  try {
    return await login(next.id, next.token);
  } catch (error) {
    if (lesson === next) clearLessonToken();
    throw error;
  }
}
