import { timeoutSignal } from "../http/timeout";
import { schoolTimeZone, type Guidance } from "./classroom";
import type { Course } from "./identity";
import { isProgressSnapshot } from "./protocol";

function isGuidance(value: unknown): value is Guidance {
  return (
    isProgressSnapshot(value) &&
    typeof value.id === "string" &&
    typeof value.instruction === "string" &&
    typeof value.createdAt === "string"
  );
}

export function watchGuidance(
  studentId: string,
  course: Course,
  receive: (guidance: Guidance[]) => void,
) {
  let active = true;
  let loading = false;
  let displayed = "";
  async function refresh() {
    if (loading || document.visibilityState !== "visible") return;
    loading = true;
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "guidance", studentId, course }),
        signal: timeoutSignal(12000),
      });
      if (!active || !response.ok) return;
      const result: unknown = await response.json();
      if (
        active &&
        isProgressSnapshot(result) &&
        Array.isArray(result.guidance)
      ) {
        const entries = result.guidance.filter(isGuidance);
        const next = JSON.stringify(entries);
        if (next !== displayed) receive(entries);
        displayed = next;
      }
    } catch {
      // Keep the last available instructions while the network reconnects.
    } finally {
      loading = false;
    }
  }
  void refresh();
  const timer = setInterval(refresh, 60000);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    active = false;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function showGuidance(host: HTMLElement, entries: Guidance[]) {
  if (!entries.length) {
    host.replaceChildren();
    return;
  }
  const details = document.createElement("details");
  const current = host.querySelector("details");
  const hadFocus = current?.contains(document.activeElement);
  details.open = current?.open ?? false;
  details.className = "classroom-guidance";
  const summary = document.createElement("summary");
  summary.textContent = `Багшийн заавар · ${entries.length}`;
  details.append(summary);
  for (const entry of entries) {
    const article = document.createElement("article");
    const time = document.createElement("time");
    time.dateTime = entry.createdAt;
    time.textContent = new Date(entry.createdAt).toLocaleDateString("mn-MN", {
      timeZone: schoolTimeZone,
    });
    const content = document.createElement("p");
    content.textContent = entry.instruction;
    article.append(time, content);
    details.append(article);
  }
  host.replaceChildren(details);
  if (hadFocus) summary.focus();
}
