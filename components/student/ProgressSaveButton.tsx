"use client";

import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { showArchivedProgress } from "@/lib/student/cloud";
import type { Course } from "@/lib/student/identity";

export default function ProgressSaveButton({
  onSave,
  course,
  studentId,
}: {
  onSave: () => Promise<boolean>;
  course: Course;
  studentId: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const archive = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (archive.current && studentId)
      showArchivedProgress(archive.current, course, studentId);
  }, [course, studentId]);
  return (
    <>
      <span ref={archive} hidden className="classroom-archive-actions" />
      <button
        type="button"
        className="classroom-save-button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave();
          } finally {
            setSaving(false);
          }
        }}
      >
        <Save size={16} aria-hidden="true" />
        {saving ? "Хадгалж байна…" : "Ахиц хадгалах"}
      </button>
    </>
  );
}
