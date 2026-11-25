import type { Group } from "./types";

export type SchoolDirectory = {
  classrooms: Group[];
  teachers: { id: string; name: string; active: boolean }[];
  students: {
    id: string;
    name: string;
    groupId: string | null;
    teacherIds: string[];
    completed: number;
    started: boolean;
  }[];
  exerciseCount: number;
};
