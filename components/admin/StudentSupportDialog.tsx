"use client";
import AdminSelect from "./AdminSelect";

import { useEffect, useState } from "react";
import { BookOpen, LifeBuoy, Plus } from "lucide-react";
import { createRunId } from "@/lib/course/run-id";
import {
  supportKinds,
  supportLabels,
  type StudentSupport,
} from "@/lib/admin/classroom-types";
import type { Course } from "@/lib/student/identity";
import AdminDialog from "./AdminDialog";
import { adminRequest, courseLabels, dateLabel } from "./api";

export default function StudentSupportDialog({
  student,
  course,
  onClose,
  onOpenWork,
}: {
  student: { id: string; name: string; completed: number };
  course: Course;
  onClose: () => void;
  onOpenWork: () => void;
}) {
  const [data, setData] = useState<StudentSupport>();
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [revision, setRevision] = useState(0);
  const [kind, setKind] =
    useState<(typeof supportKinds)[number]>("instruction");
  const [instruction, setInstruction] = useState("");
  const [note, setNote] = useState("");
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ studentId: student.id, course });
    void adminRequest<StudentSupport>(`/api/admin/classroom?${params}`, {
      signal: controller.signal,
    })
      .then((next) => {
        if (!controller.signal.aborted) {
          setData(next);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Түүхийг ачаалж чадсангүй.",
          );
      });
    return () => controller.abort();
  }, [student.id, course, revision]);

  return (
    <AdminDialog wide title={student.name || student.id} onClose={onClose}>
      <div className="admin-support-layout">
        <section className="admin-support-compose">
          <div className="admin-support-heading">
            <LifeBuoy size={21} aria-hidden="true" />
            <div>
              <h3>Сурагчид дэмжлэг өгөх</h3>
              <p>
                {courseLabels[course]} · {student.id}
              </p>
            </div>
          </div>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              setSaveError("");
              setSaved("");
              const operationId = id || createRunId();
              setId(operationId);
              try {
                await adminRequest("/api/admin/classroom", {
                  method: "POST",
                  body: JSON.stringify({
                    action: "support",
                    studentId: student.id,
                    course,
                    id: operationId,
                    kind,
                    instruction,
                    note,
                  }),
                });
                setInstruction("");
                setNote("");
                setId("");
                setSaved(
                  instruction.trim()
                    ? "Дэмжлэгийг бүртгэж, зааврыг сурагчид илгээлээ."
                    : "Дэмжлэгийн тэмдэглэлийг хадгаллаа.",
                );
                setRevision((version) => version + 1);
              } catch (error) {
                setSaveError(
                  error instanceof Error
                    ? error.message
                    : "Дэмжлэгийг хадгалж чадсангүй.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Дэмжлэгийн төрөл
              <AdminSelect
                label="Дэмжлэгийн төрөл"
                value={kind}
                disabled={busy}
                options={supportKinds.map((value) => ({
                  value,
                  label: supportLabels[value],
                }))}
                onValueChange={(value) => {
                  setKind(value);
                  setId("");
                }}
              />
            </label>
            <label>
              Сурагчид харагдах заавар
              <textarea
                value={instruction}
                maxLength={1200}
                rows={3}
                disabled={busy}
                onChange={(event) => {
                  setInstruction(event.target.value);
                  setId("");
                }}
                placeholder="Дараагийн алхам, давтах дасгал эсвэл хийх ажлыг бичнэ үү."
              />
            </label>
            <label>
              Багшийн тэмдэглэл
              <textarea
                value={note}
                maxLength={1200}
                rows={3}
                disabled={busy}
                onChange={(event) => {
                  setNote(event.target.value);
                  setId("");
                }}
                placeholder="Хэрэгжүүлсэн арга, үр дүн эсвэл дахин шалгах зүйл."
              />
            </label>
            <button
              className="admin-primary"
              disabled={busy || (!instruction.trim() && !note.trim())}
            >
              <Plus size={16} /> {busy ? "Хадгалж байна…" : "Дэмжлэг бүртгэх"}
            </button>
            {saveError && (
              <p role="alert" className="admin-error">
                {saveError}
              </p>
            )}
            {saved && (
              <p role="status" className="admin-support-saved">
                {saved}
              </p>
            )}
          </form>
        </section>
        <div className="admin-support-history">
          <section>
            <div className="admin-support-history-head">
              <div>
                <h3>Ахицын түүх</h3>
                <p>Одоогоор {student.completed} дасгал бие даан бодсон</p>
              </div>
              <button className="admin-secondary" onClick={onOpenWork}>
                <BookOpen size={15} /> Хадгалсан ажил
              </button>
            </div>
            {loadError && (
              <p role="alert" className="admin-error">
                {loadError}{" "}
                <button
                  className="admin-text"
                  onClick={() => setRevision((version) => version + 1)}
                >
                  Дахин оролдох
                </button>
              </p>
            )}
            {!data && !loadError && <p role="status">Ачаалж байна…</p>}
            {data?.activity.length ? (
              <ol className="admin-support-days">
                {data.activity.map(
                  ({ day, work }) =>
                    work && (
                      <li key={day}>
                        <time dateTime={day}>{day}</time>
                        <strong>{work.completed} бодсон</strong>
                        <span>{work.assisted} жишээ үзсэн</span>
                      </li>
                    ),
                )}
              </ol>
            ) : (
              data && <p>Өдрөөр бүртгэсэн хадгалсан ажил хараахан алга.</p>
            )}
          </section>
          <section>
            <h3>Өгсөн дэмжлэг</h3>
            {!!data?.entries.length && (
              <ol className="admin-support-log">
                {data.entries.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{supportLabels[entry.kind]}</strong>
                      <time dateTime={entry.createdAt}>
                        {dateLabel(entry.createdAt)}
                      </time>
                    </div>
                    <small>
                      Дэмжлэг өгөх үед {entry.completed} дасгал бодсон
                    </small>
                    {entry.instruction && (
                      <p>
                        <strong>Заавар</strong> {entry.instruction}
                      </p>
                    )}
                    {entry.note && (
                      <p>
                        <strong>Тэмдэглэл</strong> {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {data && !data.entries.length && (
              <p>Энэ хичээлд дэмжлэг бүртгээгүй байна.</p>
            )}
          </section>
        </div>
      </div>
    </AdminDialog>
  );
}
