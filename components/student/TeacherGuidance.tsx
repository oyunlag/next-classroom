"use client";

import { useEffect, useRef } from "react";
import { showGuidance, watchGuidance } from "@/lib/student/guidance";
import type { Course } from "@/lib/student/identity";

export default function TeacherGuidance({
  studentId,
  course,
}: {
  studentId: string;
  course: Course;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const stop = watchGuidance(studentId, course, (entries) =>
      showGuidance(element, entries),
    );
    return () => {
      stop();
      element.replaceChildren();
    };
  }, [studentId, course]);
  return <div className="classroom-guidance-host" ref={host} />;
}
