import { MongoClient } from "mongodb";
import type { DailyWork } from "./classroom";

export type ProgressDocument = {
  _id: string;
  studentId: string;
  course: string;
  progressJson: string;
  revision: number;
  updatedAt: Date;
  lastWorkAt?: Date | null;
  adminSummaryRevision?: number;
  adminSummary?: import("../admin/types").CourseSummary;
  classroomDays?: Record<string, DailyWork<Date>>;
  classroomGroupDays?: Record<string, Record<string, DailyWork<Date>>>;
};
export type ClassroomMembership = {
  groupId: string;
  teacherIds: string[];
  name: string;
  since: string | null;
  until: string;
};
export type StudentProfile = {
  _id: string;
  name: string;
  notes: string;
  groupId: string | null;
  updatedAt: Date;
  sourceId?: string;
  manualEnrollment?: boolean;
  teacherIds?: string[];
  deletedAt?: Date;
  deletedBy?: string;
  classroomSince?: string;
  classroomHistory?: ClassroomMembership[];
};
type CourseEntryDocument = {
  _id: string;
  days: Record<string, Date>;
  groupDays?: Record<string, Record<string, Date>>;
};
const pool = globalThis as typeof globalThis & {
  classroomMongo?: Promise<MongoClient>;
};
export async function classroomDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured");
  if (!pool.classroomMongo) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
    pool.classroomMongo = client.connect().catch(async (error) => {
      pool.classroomMongo = undefined;
      await client.close();
      throw error;
    });
  }
  const client = await pool.classroomMongo;
  return client.db(process.env.MONGODB_DB || "kodlab");
}
export async function progressCollection() {
  return (await classroomDatabase()).collection<ProgressDocument>(
    "student_progress",
  );
}
export async function courseEntryCollection() {
  return (await classroomDatabase()).collection<CourseEntryDocument>(
    "student_course_entries",
  );
}

export async function studentProfiles() {
  return (await classroomDatabase()).collection<StudentProfile>(
    "student_profiles",
  );
}
