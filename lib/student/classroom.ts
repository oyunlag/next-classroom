import type { CourseSummary } from "../admin/types";

export const schoolTimeZone = "Asia/Ulaanbaatar";
const schoolCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: schoolTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function schoolDay(date: Date) {
  const parts = schoolCalendar.formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

export function isSchoolDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.valueOf()) && date.toISOString().startsWith(value)
  );
}

export type ProgressCounts = Pick<
  CourseSummary,
  "completed" | "attempted" | "assisted"
>;

export type DailyWork<Time = string> = ProgressCounts & { savedAt: Time };
export type DailyActivity<Time = string> = {
  enteredAt?: Time;
  work?: DailyWork<Time>;
};

export type Attendance = "participated" | "entered" | "saved" | "unrecorded";
export function attendance(activity: DailyActivity | undefined): Attendance {
  if (activity?.enteredAt && activity.work) return "participated";
  if (activity?.enteredAt) return "entered";
  if (activity?.work) return "saved";
  return "unrecorded";
}

export type Guidance = { id: string; instruction: string; createdAt: string };
