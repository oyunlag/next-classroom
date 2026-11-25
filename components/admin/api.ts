import { timeoutSignal } from "@/lib/http/timeout";
import { schoolDay, schoolTimeZone } from "@/lib/student/classroom";
import { courses } from "@/lib/student/identity";

export async function adminRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    signal: options?.signal || timeoutSignal(15000),
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 401 && path !== "/api/admin/session"
        ? "Нэвтрэх хугацаа дууслаа. Хуудсаа шинэчилж дахин нэвтэрнэ үү."
        : body.error || "Дахин оролдоно уу.",
    );
  return body as T;
}
export const saveAdmin = (body: unknown) =>
  adminRequest("/api/admin", { method: "POST", body: JSON.stringify(body) });
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function downloadCsv(
  rows: (string | number)[][],
  filename = `kodlab-students-${schoolDay(new Date())}.csv`,
) {
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const courseLabels = {
  python: "Python",
  javascript: "JavaScript",
  nextjs: "Next.js",
  htmlcss: "HTML & CSS",
};
export const courseOptions = courses.map((value) => ({
  value,
  label: courseLabels[value],
}));
export const dateLabel = (date: string | null) =>
  date
    ? new Date(date).toLocaleString("mn-MN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: schoolTimeZone,
      })
    : "Хараахан эхлээгүй";
