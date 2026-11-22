"use client";
import CourseEntry from "@/components/student/CourseEntry";
import { allExercises } from "@/lib/python/course";
import { login } from "@/lib/python/state";
import { grade10Exercises } from "@/lib/python/grade-10-practice";

const grade10 = {
  grade: "10-р анги",
  backHref: "/curriculum/10",
};

const grade10Features = [
  `${grade10Exercises.length} бодлого`,
  "3 түвшин",
  "Хариу шалгах",
];
const pythonFeatures = [
  `Нийт ${allExercises.length} дасгал`,
  `10-р ангийн ${grade10Exercises.length} бодлого`,
  "Мэдлэгийн сорил",
  "Чөлөөт код",
];

export default function StudentLogin({
  grade10Practice,
}: {
  grade10Practice: boolean;
}) {
  return (
    <CourseEntry
      course="python"
      onLogin={login}
      features={grade10Practice ? grade10Features : pythonFeatures}
      placement={grade10Practice ? grade10 : undefined}
    />
  );
}
