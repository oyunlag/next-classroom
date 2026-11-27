"use client";

import { useEffect, useState } from "react";
import CourseEntry from "@/components/student/CourseEntry";
import { createCloudProgress, messages } from "@/lib/student/cloud";
import { clearLessonToken } from "@/lib/student/entry";
import { normalizeStudentId } from "@/lib/student/identity";
import {
  initialProgress,
  readProgress,
  type Progress,
} from "@/lib/web-lab/progress";
import Workspace from "./Workspace";

export default function WebLab({ sampleImage }: { sampleImage: string }) {
  const [student, setStudent] = useState("");
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState<keyof typeof messages>("loading");
  const [cloud] = useState(() => createCloudProgress("htmlcss", setStatus));

  useEffect(() => {
    const flush = () => void cloud.flush();
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      cloud.stop();
    };
  }, [cloud]);

  if (!student) {
    return (
      <CourseEntry
        course="htmlcss"
        onLogin={async (value, token) => {
          const id = normalizeStudentId(value);
          const restored = readProgress(await cloud.load(id, initialProgress, token));
          setProgress(restored);
          cloud.save(restored);
          setStudent(id);
        }}
      />
    );
  }

  function update(next: Progress) {
    setProgress(next);
    cloud.save(next);
    if (next.completed.length > progress.completed.length) void cloud.saveNow();
  }

  return (
    <Workspace
      key={student}
      student={student}
      progress={progress}
      status={status}
      sampleImage={sampleImage}
      onChange={update}
      onSave={cloud.saveNow}
      onDownloadConflict={cloud.downloadConflict}
      onOpenServerCopy={cloud.openServerCopy}
      onSwitchStudent={() => {
        cloud.stop();
        clearLessonToken();
        setStudent("");
        setProgress(initialProgress);
      }}
    />
  );
}
