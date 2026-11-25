"use client";

import { Save } from "lucide-react";
import { useState } from "react";

export default function ProgressSaveButton({
  onSave,
}: {
  onSave: () => Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);
  return (
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
  );
}
