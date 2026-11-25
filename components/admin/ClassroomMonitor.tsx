"use client";
import AdminSelect from "./AdminSelect";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Download,
  LifeBuoy,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import type { ClassroomOverview } from "@/lib/admin/classroom-types";
import type { Group } from "@/lib/admin/types";
import {
  attendance,
  schoolDay,
  schoolTimeZone,
  type Attendance,
} from "@/lib/student/classroom";
import { type Course } from "@/lib/student/identity";
import { adminRequest, courseLabels, courseOptions, downloadCsv } from "./api";
import StudentSupportDialog from "./StudentSupportDialog";

const attendanceLabels: Record<Attendance, string> = {
  participated: "Оролцсон",
  entered: "Зөвхөн нэвтэрсэн",
  saved: "Зөвхөн ажил хадгалсан",
  unrecorded: "Бүртгэлгүй",
};
const filters = [
  ["all", "Бүх сурагч"],
  ["support", "Дэмжлэг шаардлагатай"],
  ["participated", "Оролцсон"],
  ["entered", "Зөвхөн нэвтэрсэн"],
  ["saved", "Зөвхөн ажил хадгалсан"],
  ["unrecorded", "Бүртгэлгүй"],
] as const;
type ScopeFilter = (typeof filters)[number][0];

const timeFormat = new Intl.DateTimeFormat("mn-MN", {
  timeZone: schoolTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const time = (value: string | undefined) =>
  value ? timeFormat.format(new Date(value)) : "—";

function TargetForm({
  groupId,
  course,
  target,
  max,
  onSaved,
}: {
  groupId: string;
  course: Course;
  target: number;
  max: number;
  onSaved: () => void;
}) {
  const [count, setCount] = useState(String(target || ""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-pace"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await adminRequest("/api/admin/classroom", {
            method: "POST",
            body: JSON.stringify({
              action: "target",
              groupId,
              course,
              completed: Number(count),
            }),
          });
          onSaved();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Зорилтыг хадгалж чадсангүй.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="admin-pace-summary">
        <Target size={20} aria-hidden="true" />
        <div>
          <h3>Ангийн ахицын зорилт</h3>
          <p>
            Зорилтод хүрээгүй сурагчдыг одоогийн бие даан бодсон дасгалын
            тоогоор харуулна.
          </p>
        </div>
      </div>
      <div className="admin-pace-fields">
        <label>
          Хүлээгдэж буй дасгалын тоо
          <input
            type="number"
            min={0}
            max={max}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            placeholder="Зорилтгүй"
          />
        </label>
        <button
          className="admin-secondary"
          disabled={busy || Number(count) === target}
        >
          {busy ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export default function ClassroomMonitor({
  groups,
  group,
  onGroup,
  onOpen,
  loading,
}: {
  groups: Group[];
  group: string;
  onGroup: (id: string) => void;
  onOpen: (id: string, course: Course) => void;
  loading: boolean;
}) {
  const groupId = groups.some((item) => item.id === group)
    ? group
    : groups[0]?.id;
  const [course, setCourse] = useState<Course>("python");
  const [day, setDay] = useState(() => schoolDay(new Date()));
  const [selectedFilter, setFilter] = useState<ScopeFilter>("all");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [supportId, setSupportId] = useState("");
  const [resource, setResource] = useState<{
    key: string;
    data?: ClassroomOverview;
    error?: string;
  }>();
  const scope =
    groupId && day
      ? new URLSearchParams({ groupId, day, course }).toString()
      : "";
  const result = resource?.key === scope ? resource : undefined;
  const data = result?.data;
  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => {
    if (!scope) return;
    const controller = new AbortController();
    const request = () => {
      void adminRequest<ClassroomOverview>(`/api/admin/classroom?${scope}`, {
        signal: controller.signal,
      })
        .then((next) => {
          if (!controller.signal.aborted)
            setResource({ key: scope, data: next });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            const message =
              error instanceof Error
                ? error.message
                : "Мэдээллийг ачаалж чадсангүй.";
            setResource((previous) => ({
              key: scope,
              data: previous?.key === scope ? previous.data : undefined,
              error: message,
            }));
          }
        });
    };
    request();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") request();
    }, 60000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [scope, revision]);

  const target = data?.target ?? 0;
  const filter =
    selectedFilter === "support" && !target ? "all" : selectedFilter;
  const rows = (data?.students ?? []).map((student) => {
    const completed = student.summary?.completed ?? 0;
    return {
      ...student,
      completed,
      state: attendance(student.activity),
      missing: Math.max(0, target - completed),
    };
  });
  const counts = {
    participated: 0,
    entered: 0,
    saved: 0,
    unrecorded: 0,
    support: 0,
  };
  for (const row of rows) {
    counts[row.state]++;
    if (row.missing) counts.support++;
  }
  const search = query.trim().normalize("NFKC").toLocaleLowerCase("mn");
  const visible = rows.filter(
    (row) =>
      (filter === "all" ||
        (filter === "support" ? row.missing > 0 : filter === row.state)) &&
      `${row.id} ${row.name}`
        .normalize("NFKC")
        .toLocaleLowerCase("mn")
        .includes(search),
  );
  if (filter === "support") visible.sort((a, b) => b.missing - a.missing);
  const supportStudent = rows.find((row) => row.id === supportId);
  function exportReport() {
    downloadCsv(
      [
        [
          "Огноо",
          "Анги",
          "Хичээл",
          "Сурагчийн ID",
          "Нэр",
          "Оролцоо",
          "Нэвтэрсэн цаг",
          "Ажил хадгалсан цаг",
          "Тухайн өдрийн эцсийн бодсон дасгал",
          "Одоогийн бодсон дасгал",
          "Одоогийн зорилт",
          "Зорилтод дутуу",
        ],
        ...visible.map((row) => [
          day,
          groups.find((item) => item.id === groupId)?.name ?? "",
          courseLabels[course],
          row.id,
          row.name,
          attendanceLabels[row.state],
          time(row.activity.enteredAt),
          time(row.activity.work?.savedAt),
          row.activity.work?.completed ?? "",
          row.completed,
          target || "",
          target ? row.missing : "",
        ]),
      ],
      `kodlab-classroom-${day}.csv`,
    );
  }

  return (
    <section
      className="admin-monitor"
      aria-labelledby="classroom-monitor-heading"
    >
      <div className="admin-monitor-heading">
        <div>
          <div className="admin-monitor-kicker">
            <CalendarDays size={17} aria-hidden="true" /> Хичээлийн бүртгэл
          </div>
          <h2 id="classroom-monitor-heading">Оролцоо ба ахиц</h2>
          <p>
            Тухайн өдөр хичээлд нэвтэрч, ажилдаа өөрчлөлт хадгалсан сурагчийг
            оролцсонд тооцно.
          </p>
        </div>
        <div className="admin-monitor-actions">
          <button
            type="button"
            className="admin-secondary"
            disabled={!scope}
            onClick={refresh}
            aria-label="Хичээлийн бүртгэл шинэчлэх"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="admin-secondary"
            disabled={!visible.length}
            onClick={exportReport}
          >
            <Download size={16} /> CSV татах
          </button>
        </div>
      </div>
      {!groupId ? (
        <p className="admin-monitor-empty" role="status">
          {loading
            ? "Ангиудыг ачаалж байна…"
            : "Хянах анги алга. Ангийн цэснээс анги нэмнэ үү."}
        </p>
      ) : (
        <>
          <div className="admin-monitor-controls">
            <label>
              Анги
              <AdminSelect
                label="Анги"
                value={groupId}
                options={groups.map(({ id, name }) => ({
                  value: id,
                  label: name,
                }))}
                onValueChange={(value) => {
                  onGroup(value);
                  setFilter("all");
                }}
              />
            </label>
            <label>
              Хичээл
              <AdminSelect
                label="Хичээл"
                value={course}
                options={courseOptions}
                onValueChange={(value) => {
                  setCourse(value);
                  setFilter("all");
                }}
              />
            </label>
            <label>
              Огноо
              <input
                type="date"
                value={day}
                max={schoolDay(new Date())}
                onChange={(event) => setDay(event.target.value)}
              />
            </label>
          </div>
          {result?.error && (
            <p className="admin-monitor-error" role="alert">
              {result.error}
            </p>
          )}
          {!result && (
            <p className="admin-monitor-empty" role="status">
              {day ? "Хичээлийн бүртгэл ачаалж байна…" : "Огноогоо сонгоно уу."}
            </p>
          )}
          {data && (
            <>
              <div className="admin-monitor-stats">
                <button
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  <span>Нийт сурагч</span>
                  <strong>{rows.length}</strong>
                </button>
                <button
                  aria-pressed={filter === "participated"}
                  onClick={() => setFilter("participated")}
                >
                  <span>Оролцсон</span>
                  <strong>
                    {counts.participated}
                    <small> / {rows.length}</small>
                  </strong>
                </button>
                <button
                  aria-pressed={filter === "entered"}
                  onClick={() => setFilter("entered")}
                >
                  <span>Зөвхөн нэвтэрсэн</span>
                  <strong>{counts.entered}</strong>
                </button>
                <button
                  aria-pressed={filter === "support"}
                  onClick={() => setFilter("support")}
                  disabled={!target}
                >
                  <span>Дэмжлэг шаардлагатай</span>
                  <strong>{target ? counts.support : "—"}</strong>
                </button>
              </div>
              <TargetForm
                key={`${groupId}:${course}:${target}`}
                groupId={groupId}
                course={course}
                target={target}
                max={data.exerciseCount}
                onSaved={refresh}
              />
              <div className="admin-monitor-table-tools">
                <label className="admin-search">
                  <Search size={17} aria-hidden="true" />
                  <span className="admin-sr-only">Нэр, ID-аар хайх</span>
                  <Input
                    className="admin-search-input"
                    type="search"
                    placeholder="Нэр, ID-аар хайх"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <AdminSelect
                  className="admin-monitor-status"
                  label="Оролцоо, ахицаар шүүх"
                  value={filter}
                  options={filters.map(([value, label]) => ({
                    value,
                    label,
                    disabled: value === "support" && !target,
                  }))}
                  onValueChange={setFilter}
                />
              </div>
              {visible.length ? (
                <div className="admin-monitor-table-wrap">
                  <table className="admin-monitor-table">
                    <thead>
                      <tr>
                        <th scope="col">Сурагч</th>
                        <th scope="col">Тухайн өдрийн оролцоо</th>
                        <th scope="col">Одоогийн ахиц</th>
                        <th scope="col">
                          <span className="admin-sr-only">
                            Сурагчийн үйлдлүүд
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <tr key={row.id}>
                          <th scope="row">
                            <button
                              className="admin-monitor-name"
                              onClick={() => onOpen(row.id, course)}
                            >
                              <strong>{row.name || row.id}</strong>
                              <small>{row.id}</small>
                            </button>
                          </th>
                          <td>
                            <span
                              className="admin-attendance"
                              data-state={row.state}
                            >
                              {attendanceLabels[row.state]}
                            </span>
                            {row.state !== "unrecorded" && (
                              <small className="admin-monitor-times">
                                {row.activity.enteredAt &&
                                  `Нэвтэрсэн ${time(row.activity.enteredAt)}`}
                                {row.activity.enteredAt &&
                                  row.activity.work &&
                                  " · "}
                                {row.activity.work &&
                                  `Хадгалсан ${time(row.activity.work.savedAt)}`}
                              </small>
                            )}
                          </td>
                          <td>
                            <strong>{row.completed}</strong>
                            <small className="admin-monitor-total">
                              {" "}
                              / {data.exerciseCount} дасгал
                            </small>
                            {row.missing > 0 && (
                              <small className="admin-monitor-gap">
                                Зорилтод {row.missing} дутуу
                              </small>
                            )}
                            {row.activity.work &&
                              row.activity.work.completed !== row.completed && (
                                <small className="admin-monitor-times">
                                  Тухайн өдөр {row.activity.work.completed}{" "}
                                  бодсон
                                </small>
                              )}
                          </td>
                          <td>
                            <button
                              className="admin-secondary admin-support-button"
                              onClick={() => setSupportId(row.id)}
                            >
                              <LifeBuoy size={15} /> <span>Дэмжлэг</span>
                              <ChevronRight size={14} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-monitor-empty">
                  {rows.length
                    ? "Шүүлтэд тохирох сурагч алга."
                    : "Энэ ангид сурагч оноогоогүй байна."}
                </p>
              )}
              <p className="admin-monitor-foot">
                Улаанбаатарын цагаар · Бүртгэлгүй өдөр нь цахим оролцооны баримт
                байхгүйг илэрхийлнэ.
              </p>
            </>
          )}
        </>
      )}
      {supportStudent && (
        <StudentSupportDialog
          key={`${supportId}:${course}`}
          student={supportStudent}
          course={course}
          onClose={() => setSupportId("")}
          onOpenWork={() => {
            setSupportId("");
            onOpen(supportStudent.id, course);
          }}
        />
      )}
    </section>
  );
}
