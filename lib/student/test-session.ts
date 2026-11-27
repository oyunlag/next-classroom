import assert from "node:assert/strict";
import { POST as signIn } from "../../app/api/progress/session/route";

export function lessonLoginRequest(identity: string, credential?: string) {
  return signIn(
    new Request("https://example.test/api/progress/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, credential }),
    }),
  );
}

export async function lessonSession(identity: string, credential?: string) {
  const response = await lessonLoginRequest(identity, credential);
  assert.equal(response.status, 200);
  const result: { id: string; token: string } = await response.json();
  return result;
}

export async function studentSession(id: string) {
  return (await lessonSession(id)).token;
}
