"use client";
import CourseEntry from "@/components/student/CourseEntry";
import { login } from "@/lib/python/state";
import { grade10Exercises } from "@/lib/python/grade-10-practice";

const grade10 = {
  grade: "10-р анги",
  backHref: "/curriculum/10",
  features: [
    `${grade10Exercises.length} шинэ бодлого`,
    "3 түвшин",
    "Хариу шалгах",
  ],
};

export default function StudentLogin({
  grade10Practice,
}: {
  grade10Practice: boolean;
}) {
  return (
    <CourseEntry
      course="python"
      onLogin={login}
      placement={grade10Practice ? grade10 : undefined}
    />
  );
}
