import type { DailyActivity, Guidance } from "../student/classroom";
import type { CourseSummary } from "./types";

export type ClassroomOverview = {
  day: string;
  exerciseCount: number;
  target: number;
  students: {
    id: string;
    name: string;
    summary: CourseSummary | null;
    activity: DailyActivity;
  }[];
};

export const supportKinds = [
  "instruction",
  "differentiated",
  "extra-time",
  "peer",
  "family",
] as const;
export const supportLabels: Record<(typeof supportKinds)[number], string> = {
  instruction: "Нэмэлт заавар",
  differentiated: "Түвшинд тохирсон даалгавар",
  "extra-time": "Нэмэлт цаг",
  peer: "Үе тэнгийн дэмжлэг",
  family: "Гэр бүлтэй холбогдсон",
};

export type SupportEntry = Guidance & {
  kind: (typeof supportKinds)[number];
  note: string;
  completed: number;
};
export type StudentSupport = {
  activity: (DailyActivity & { day: string })[];
  entries: SupportEntry[];
};
