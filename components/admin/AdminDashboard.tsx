"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  Building2,
  ChevronLeft,
  ChevronRight,
  Code2,
  CalendarDays,
  Download,
  ListPlus,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  UserRoundPlus,
  X,
} from "lucide-react";
import type { AdminIdentity } from "@/lib/admin/accounts";
import type { Group, Roster, StudentRow } from "@/lib/admin/types";
import {
  rosterView,
  type RosterSort,
  type RosterStatus,
} from "@/lib/admin/roster-view";
import { courses, type Course } from "@/lib/student/identity";
import {
  adminRequest,
  courseLabels,
  courseOptions,
  dateLabel,
  downloadCsv,
  saveAdmin,
} from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminDialog from "./AdminDialog";
import AdminSelect from "./AdminSelect";
import AddStudentDialog from "./AddStudentDialog";
import AdminNavigation from "./AdminNavigation";
import { GroupEditor, AddStudents } from "./RosterDialogs";
import StudentDetail from "./StudentDetail";
import DeleteStudentDialog from "./DeleteStudentDialog";
import StudentTableRow from "./StudentTableRow";
import TeachersPanel from "./TeachersPanel";
import ClassroomMonitor from "./ClassroomMonitor";
import SchoolDirectory from "./SchoolDirectory";

const statusOptions: { id: RosterStatus; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "working", label: "Хийж буй" },
  { id: "not-started", label: "Эхлээгүй" },
  { id: "complete", label: "Дуусгасан" },
];
const sortOptions: { id: RosterSort; label: string }[] = [
  { id: "recent", label: "Сүүлд ажилласан" },
  { id: "name", label: "Нэрийн дарааллаар" },
  { id: "progress", label: "Ахиц өндөр эхэнд" },
];
const PAGE_SIZE = 25;
export default function AdminDashboard({
  identity,
  schoolDirectoryAccess,
}: {
  identity: AdminIdentity;
  schoolDirectoryAccess: boolean;
}) {
  const [data, setData] = useState<Roster | null>(null),
    [error, setError] = useState(""),
    [refreshing, setRefreshing] = useState(true);
  const [view, setView] = useState<"students" | "teachers">("students"),
    [section, setSection] = useState<"classroom" | "roster" | "directory">(
      "classroom",
    ),
    [group, setGroup] = useState("all"),
    [query, setQuery] = useState(""),
    [course, setCourse] = useState<Course | "all">("all"),
    [status, setStatus] = useState<RosterStatus>("all"),
    [sort, setSort] = useState<RosterSort>("recent"),
    [filtersOpen, setFiltersOpen] = useState(false),
    [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set()),
    [assignGroup, setAssignGroup] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [deletedId, setDeletedId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null),
    [detailCourse, setDetailCourse] = useState<Course>(),
    [pendingDelete, setPendingDelete] = useState<StudentRow | null>(null),
    [groupEditor, setGroupEditor] = useState<Group | null | undefined>(
      undefined,
    ),
    [addStudents, setAddStudents] = useState(false),
    [addingStudent, setAddingStudent] = useState(false),
    [navigationOpen, setNavigationOpen] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(() => {
    const version = ++requestVersion.current;
    return adminRequest<Roster>("/api/admin")
      .then((next) => {
        if (version === requestVersion.current) {
          setData(next);
          setError("");
        }
      })
      .catch((error) => {
        if (version === requestVersion.current)
          setError(
            error instanceof Error
              ? error.message
              : "Холболтоо шалгаад дахин оролдоно уу.",
          );
      })
      .finally(() => {
        if (version === requestVersion.current) setRefreshing(false);
      });
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    return () => {
      clearInterval(timer);
    };
  }, [load]);
  const students = data?.students || [],
    groups = data?.groups || [];
  const showingRoster = view === "students" && section === "roster";
  const { filtered, counts } = rosterView(students, {
    group,
    query,
    course,
    status,
    sort,
  });
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1),
  );
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const allChecked =
    visible.length > 0 && visible.every((s) => selected.has(s.id));
  const groupCounts = new Map<string, number>();
  for (const student of students) {
    const key = student.groupId || "unassigned";
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
  }
  const groupName =
    group === "all"
      ? "Миний сурагчид"
      : group === "unassigned"
        ? "Анги оноогоогүй"
        : `${groups.find((g) => g.id === group)?.name || "Миний"} анги`;
  const openedStudent = students.find((s) => s.id === studentId);
  function selectGroup(id: string) {
    setGroup(id);
    setView("students");
    if (section === "directory") setSection("classroom");
    setPage(0);
    setQuery("");
    setStatus("all");
    setSelected(new Set());
    setNavigationOpen(false);
  }
  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function openStudent(id: string, course?: Course) {
    setDetailCourse(course);
    setStudentId(id);
  }
  function exportRoster() {
    downloadCsv([
      [
        "Сурагчийн ID",
        "Нэр",
        "Анги",
        ...courses.flatMap((course) => [
          `${courseLabels[course]} дууссан`,
          `${courseLabels[course]} нийт`,
        ]),
        "Сүүлд хадгалсан",
      ],
      ...filtered.map((s) => [
        s.id,
        s.name,
        groups.find((g) => g.id === s.groupId)?.name || "",
        ...courses.flatMap((c) => [
          s.courses[c]?.completed || 0,
          s.courses[c]?.total || 0,
        ]),
        s.updatedAt || "",
      ]),
    ]);
  }
  async function signOut() {
    try {
      await adminRequest("/api/admin/session", { method: "DELETE" });
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Дахин оролдоно уу.");
    }
  }
  const navigation = (
    <AdminNavigation
      identity={identity}
      groups={groups}
      counts={groupCounts}
      group={group}
      view={view}
      onGroup={selectGroup}
      onTeachers={() => {
        setView("teachers");
        setNavigationOpen(false);
      }}
      onEdit={(g) => {
        setGroupEditor(g);
        setNavigationOpen(false);
      }}
      onSignOut={signOut}
    />
  );
  return (
    <div className="admin-shell">
      <header className="admin-mobile-header">
        <button
          className="admin-icon"
          aria-label="Ангийн цэс нээх"
          onClick={() => setNavigationOpen(true)}
        >
          <Menu size={21} />
        </button>
        <Link href="/" className="admin-brand">
          <Code2 size={22} />
          <span>КодЛаб.</span>
        </Link>
        <span className="admin-mobile-account">
          {identity.name.split(" ").at(-1)}
        </span>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar">{navigation}</aside>
        <main
          id="main-content"
          className={
            showingRoster ? "admin-main admin-main--roster" : "admin-main"
          }
        >
          <div className="admin-title-row">
            <div>
              {!showingRoster && (
                <p className="admin-breadcrumb">
                  Багшийн орчин <ChevronRight size={13} />{" "}
                  {view === "teachers"
                    ? "Миний бүртгэл"
                    : section === "directory"
                      ? "Сургуулийн бүртгэл"
                      : group === "all"
                        ? "Сурагчдын ахиц"
                        : groups.find((g) => g.id === group)?.name || "Анги"}
                </p>
              )}
              <h1>
                {view === "teachers"
                  ? "Багшийн мэдээлэл"
                  : section === "directory"
                    ? "Сургуулийн бүртгэл"
                    : groupName}
              </h1>
              {!showingRoster && (
                <p className="admin-scope-note">
                  {view === "teachers"
                    ? identity.email
                    : section === "directory"
                      ? "Сургуулийн хэмжээнд КодЛабын бүртгэлийг харах."
                      : "Анги, хичээлээр сурагчдын оролцоо, ахиц, дэмжлэгийг хянана."}
                </p>
              )}
            </div>
            {showingRoster && (
              <div className="admin-title-actions">
                <Button
                  variant="outline"
                  className="admin-assign-button"
                  aria-label="Сурагч хуваарилах"
                  title="Сурагч хуваарилах"
                  onClick={() => setAddStudents(true)}
                >
                  <ListPlus size={16} />
                  <span>Хуваарилах</span>
                </Button>
                <Button
                  aria-label="Сурагч нэмэх"
                  disabled={!data}
                  onClick={() => setAddingStudent(true)}
                >
                  <UserRoundPlus size={16} />
                  <span className="admin-add-label">Сурагч нэмэх</span>
                  <span className="admin-add-short" aria-hidden="true">
                    Нэмэх
                  </span>
                </Button>
              </div>
            )}
          </div>
          {view === "students" && (
            <nav className="admin-section-switch" aria-label="Сурагчдын хяналт">
              <button
                type="button"
                aria-pressed={section === "classroom"}
                onClick={() => setSection("classroom")}
              >
                <CalendarDays size={17} /> Хичээлийн хяналт
              </button>
              <button
                type="button"
                aria-pressed={section === "roster"}
                onClick={() => setSection("roster")}
              >
                <Users size={17} /> Сурагчдын бүртгэл
              </button>
              {schoolDirectoryAccess && (
                <button
                  type="button"
                  aria-pressed={section === "directory"}
                  onClick={() => setSection("directory")}
                >
                  <Building2 size={17} /> Сургуулийн бүртгэл
                </button>
              )}
            </nav>
          )}
          {view === "teachers" ? (
            <TeachersPanel
              teachers={data?.teachers || []}
              groups={groups}
              onSelect={() => selectGroup("all")}
            />
          ) : section === "directory" && schoolDirectoryAccess ? (
            <SchoolDirectory />
          ) : section === "classroom" ? (
            <>
              {error && (
                <p className="admin-monitor-error" role="alert">
                  {error}{" "}
                  <button className="admin-text" onClick={() => void load()}>
                    Дахин оролдох
                  </button>
                </p>
              )}
              <ClassroomMonitor
                groups={groups}
                group={group}
                onGroup={selectGroup}
                onOpen={openStudent}
                loading={refreshing}
              />
            </>
          ) : (
            <>
              <section className="admin-roster" aria-label="Сурагчдын жагсаалт">
                <div className="admin-roster-toolbar">
                  <label className="admin-search admin-roster-search">
                    <Search size={17} />
                    <span className="admin-sr-only">ID эсвэл нэрээр хайх</span>
                    <Input
                      className="admin-search-input"
                      type="search"
                      placeholder="Нэр эсвэл ID"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="admin-roster-filter-toggle"
                    aria-label="Жагсаалт шүүх, эрэмбэлэх"
                    aria-expanded={filtersOpen}
                    data-active={course !== "all" || sort !== "recent"}
                    aria-controls="admin-roster-filters"
                    title="Жагсаалт шүүх, эрэмбэлэх"
                    onClick={() => setFiltersOpen((open) => !open)}
                  >
                    <SlidersHorizontal size={17} />
                  </Button>
                  <div
                    className="admin-roster-filters"
                    id="admin-roster-filters"
                    data-expanded={filtersOpen}
                  >
                    <AdminSelect
                      label="Ангиар шүүх"
                      value={group}
                      onValueChange={selectGroup}
                      options={[
                        { value: "all", label: "Бүх анги" },
                        ...groups.map((g) => ({ value: g.id, label: g.name })),
                        ...((groupCounts.get("unassigned") || 0) > 0
                          ? [{ value: "unassigned", label: "Анги оноогоогүй" }]
                          : []),
                      ]}
                    />
                    <AdminSelect
                      label="Хичээлээр шүүх"
                      value={course}
                      options={[
                        { value: "all", label: "Бүх хичээл" },
                        ...courseOptions,
                      ]}
                      onValueChange={(value) => {
                        setCourse(value);
                        setPage(0);
                      }}
                    />
                    <AdminSelect
                      label="Эрэмбэлэх"
                      className="admin-sort"
                      icon={<ArrowDownUp size={15} />}
                      value={sort}
                      options={sortOptions.map(({ id, label }) => ({
                        value: id,
                        label,
                      }))}
                      onValueChange={(value) => {
                        setSort(value);
                        setPage(0);
                      }}
                    />
                  </div>
                  <div className="admin-roster-tools">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={refreshing ? "admin-refreshing" : undefined}
                      aria-label="Жагсаалт шинэчлэх"
                      title="Жагсаалт шинэчлэх"
                      disabled={refreshing}
                      onClick={() => {
                        setRefreshing(true);
                        void load();
                      }}
                    >
                      <RefreshCw size={17} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="admin-export"
                      aria-label="CSV татах"
                      title="CSV татах"
                      disabled={!filtered.length}
                      onClick={exportRoster}
                    >
                      <Download size={15} />
                      <span>CSV татах</span>
                    </Button>
                  </div>
                </div>
                <div
                  className="admin-status-tabs"
                  role="group"
                  aria-label="Ахицаар шүүх"
                >
                  {statusOptions.map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={status === s.id}
                      onClick={() => {
                        setStatus(s.id);
                        setPage(0);
                      }}
                    >
                      {s.label}
                      <span>{data ? counts[s.id] : "—"}</span>
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="admin-inline-error" role="alert">
                    <p>
                      {error}
                      {data && (
                        <small>
                          Сүүлд шинэчилсэн: {dateLabel(data.fetchedAt)}
                        </small>
                      )}
                    </p>
                    <button
                      className="admin-secondary"
                      disabled={refreshing}
                      onClick={() => {
                        setRefreshing(true);
                        void load();
                      }}
                    >
                      Дахин оролдох
                    </button>
                  </div>
                )}
                {notice && (
                  <div className="admin-notice" role="status">
                    <span>{notice}</span>
                    {deletedId && (
                      <button
                        className="admin-text"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await saveAdmin({
                              action: "restore",
                              studentId: deletedId,
                            });
                            setDeletedId(null);
                            await load();
                            setNotice("Сурагчийг сэргээсэн.");
                          } catch (error) {
                            setError(
                              error instanceof Error ? error.message : "Алдаа",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Сэргээх
                      </button>
                    )}
                    <button
                      className="admin-icon"
                      aria-label="Мэдэгдэл хаах"
                      onClick={() => {
                        setNotice("");
                        setDeletedId(null);
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                {!!selected.size && (
                  <div className="admin-bulk">
                    <strong>{selected.size} сурагч сонгосон</strong>
                    <AdminSelect
                      label="Сонгосон сурагчдад анги оноох"
                      placeholder="Анги сонгох"
                      value={assignGroup}
                      onValueChange={setAssignGroup}
                      options={[
                        ...groups.map((g) => ({ value: g.id, label: g.name })),
                        { value: "unassigned", label: "Анги оноогоогүй" },
                      ]}
                    />
                    <button
                      className="admin-primary"
                      disabled={busy || !assignGroup}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await saveAdmin({
                            action: "assign",
                            studentIds: [...selected],
                            groupId:
                              assignGroup === "unassigned" ? null : assignGroup,
                          });
                          setSelected(new Set());
                          setAssignGroup("");
                          await load();
                          setNotice("Ангийн хуваарилалтыг хадгаллаа.");
                        } catch (error) {
                          setError(
                            error instanceof Error ? error.message : "Алдаа",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Хуваарилах
                    </button>
                    <button
                      className="admin-text"
                      onClick={() => setSelected(new Set())}
                    >
                      Болих
                    </button>
                  </div>
                )}
                {!data && refreshing ? (
                  <div
                    className="admin-skeleton"
                    role="status"
                    aria-label="Сурагчдын ахицыг ачаалж байна"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i}>
                        <span />
                        <span />
                        <span />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="admin-table-scroll">
                      <table className="admin-students-table">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Энэ хуудсын сурагчдыг сонгох"
                                checked={allChecked}
                                onChange={() =>
                                  setSelected((previous) => {
                                    const next = new Set(previous);
                                    visible.forEach((s) =>
                                      allChecked
                                        ? next.delete(s.id)
                                        : next.add(s.id),
                                    );
                                    return next;
                                  })
                                }
                              />
                            </th>
                            <th>Сурагч</th>
                            <th>Анги</th>
                            {courses.map((c) => (
                              <th className="admin-numeric" key={c}>
                                {courseLabels[c]}
                              </th>
                            ))}
                            <th className="admin-numeric">Сүүлд хадгалсан</th>
                            <th>
                              <span className="admin-sr-only">
                                Сурагчийн үйлдлүүд
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((student) => (
                            <StudentTableRow
                              key={student.id}
                              student={student}
                              groups={groups}
                              selected={selected.has(student.id)}
                              onToggle={() => toggle(student.id)}
                              onOpen={() => openStudent(student.id)}
                              disabled={busy}
                              onDelete={() => setPendingDelete(student)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!visible.length && (
                      <div className="admin-empty">
                        <Users size={25} />
                        <h3>
                          {students.length
                            ? "Тохирох сурагч олдсонгүй"
                            : "Одоогоор сурагч алга"}
                        </h3>
                        <p>
                          {students.length
                            ? "Өөр нэр, ID-аар хайх эсвэл шүүлтээ цэвэрлээрэй."
                            : "Сурагч нэмэх товчоор өөрийн ангид шинэ сурагч бүртгээрэй."}
                        </p>
                        {!!students.length && (
                          <button
                            className="admin-secondary"
                            onClick={() => {
                              setQuery("");
                              setStatus("all");
                              setCourse("all");
                            }}
                          >
                            Шүүлт цэвэрлэх
                          </button>
                        )}
                      </div>
                    )}
                    <footer className="admin-table-footer">
                      <span>
                        {filtered.length ? currentPage * PAGE_SIZE + 1 : 0}–
                        {Math.min(
                          (currentPage + 1) * PAGE_SIZE,
                          filtered.length,
                        )}{" "}
                        / {filtered.length} сурагч
                      </span>
                      <div>
                        <button
                          className="admin-secondary"
                          aria-label="Өмнөх хуудас"
                          disabled={currentPage === 0}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          <ChevronLeft size={15} />
                          <span>Өмнөх</span>
                        </button>
                        <span>
                          {currentPage + 1} /{" "}
                          {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
                        </span>
                        <button
                          className="admin-secondary"
                          aria-label="Дараах хуудас"
                          disabled={
                            (currentPage + 1) * PAGE_SIZE >= filtered.length
                          }
                          onClick={() => setPage(currentPage + 1)}
                        >
                          <span>Дараах</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </footer>
                  </>
                )}
              </section>
              <p className="admin-data-note">
                <span className="admin-live-dot" />
                Минут тутам шинэчлэгдэнэ
                {data && <> · Сүүлд {dateLabel(data.fetchedAt)}</>}
                {data?.truncated && " · Жагсаалтын хязгаарт хүрсэн."}
              </p>
            </>
          )}
        </main>
      </div>
      {navigationOpen && (
        <AdminDialog
          title="Миний орчин"
          onClose={() => setNavigationOpen(false)}
        >
          <div className="admin-mobile-navigation">{navigation}</div>
        </AdminDialog>
      )}
      {pendingDelete && (
        <DeleteStudentDialog
          student={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onDeleted={async () => {
            setDeletedId(pendingDelete.id);
            setSelected((previous) => {
              const next = new Set(previous);
              next.delete(pendingDelete.id);
              return next;
            });
            await load();
            setNotice("Сурагчийг жагсаалтаас устгалаа.");
            setPendingDelete(null);
          }}
        />
      )}
      {openedStudent && (
        <StudentDetail
          key={openedStudent.id}
          student={openedStudent}
          groups={groups}
          initialCourse={detailCourse}
          onClose={() => setStudentId(null)}
          onSaved={load}
        />
      )}
      {groupEditor !== undefined && (
        <GroupEditor
          group={groupEditor}
          onClose={() => setGroupEditor(undefined)}
          onSaved={async () => {
            await load();
            setGroupEditor(undefined);
            setNotice("Ангийн мэдээллийг хадгаллаа.");
          }}
        />
      )}
      {addingStudent && (
        <AddStudentDialog
          groups={groups}
          defaultGroup={groups.some((g) => g.id === group) ? group : ""}
          onClose={() => setAddingStudent(false)}
          onSaved={async (student) => {
            selectGroup(student.groupId);
            setSection("roster");
            setCourse("all");
            setQuery(student.id);
            setDeletedId(null);
            setNotice(`${student.name} (${student.id}) сурагчийг нэмлээ.`);
            await load();
            setAddingStudent(false);
          }}
        />
      )}
      {addStudents && (
        <AddStudents
          groups={groups}
          defaultGroup={groups.some((g) => g.id === group) ? group : ""}
          onClose={() => setAddStudents(false)}
          onSaved={async () => {
            await load();
            setAddStudents(false);
            setNotice("Ангийн хуваарилалтыг хадгаллаа.");
          }}
        />
      )}
    </div>
  );
}
