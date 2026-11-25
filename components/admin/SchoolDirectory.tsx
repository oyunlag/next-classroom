"use client";
import AdminSelect from "./AdminSelect";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import type { SchoolDirectory as Directory } from "@/lib/admin/school-directory-types";
import { type Course } from "@/lib/student/identity";
import { adminRequest, courseOptions } from "./api";

const pageSize = 25;
const searchKey = (value: string) =>
  value.trim().normalize("NFKC").toLocaleLowerCase("mn");

export default function SchoolDirectory() {
  const [course, setCourse] = useState<Course>("python");
  const [group, setGroup] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{
    course: Course;
    data?: Directory;
    error?: string;
  }>();
  const resource = result?.course === course ? result : undefined;
  const data = resource?.data;

  useEffect(() => {
    const controller = new AbortController();
    void adminRequest<Directory>(`/api/admin/directory?course=${course}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ course, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            course,
            error:
              error instanceof Error
                ? error.message
                : "Бүртгэлийг ачаалж чадсангүй.",
          });
      });
    return () => controller.abort();
  }, [course, refresh]);

  const classrooms = new Map(data?.classrooms.map((item) => [item.id, item]));
  const teachers = new Map(data?.teachers.map((item) => [item.id, item]));
  const students = data?.students ?? [];
  const classCount = new Map<string | null, number>();
  for (const student of students)
    classCount.set(student.groupId, (classCount.get(student.groupId) ?? 0) + 1);

  const classTeachers = classrooms.get(group)?.teacherIds ?? [];
  const scope = students.filter(
    (student) =>
      (group === "all" ||
        (group === "unassigned"
          ? student.groupId === null
          : student.groupId === group)) &&
      (teacher === "all" ||
        (teacher === "unassigned"
          ? !student.teacherIds.some((id) => teachers.get(id)?.active)
          : student.teacherIds.includes(teacher))),
  );
  const search = searchKey(query);
  const matches = scope.filter(({ id, name, teacherIds, groupId }) =>
    searchKey(
      `${id} ${name} ${classrooms.get(groupId ?? "")?.name ?? ""} ${teacherIds.map((id) => teachers.get(id)?.name ?? id).join(" ")}`,
    ).includes(search),
  );
  const total = data?.exerciseCount ?? 0;
  const fullyComplete = scope.filter(
    (student) => student.completed === total && total > 0,
  ).length;
  const started = scope.filter((student) => student.started).length;
  const average =
    scope.length && total
      ? (
          (100 * scope.reduce((sum, student) => sum + student.completed, 0)) /
          (scope.length * total)
        ).toFixed(1)
      : "0.0";
  const numberOfPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, numberOfPages - 1);
  const visible = matches.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  function setClass(id: string) {
    setGroup(id);
    setPage(0);
  }
  function teacherName(id: string) {
    const teacher = teachers.get(id);
    return teacher?.active ? teacher.name : `${teacher?.name ?? id} (идэвхгүй)`;
  }

  return (
    <section
      className="admin-monitor admin-directory"
      aria-labelledby="school-directory-title"
    >
      <div className="admin-monitor-heading">
        <div>
          <h2 id="school-directory-title">Анги, сурагч, багш</h2>
          <p>
            КодЛабт бүртгэлтэй сурагчдын анги, багшийн хуваарилалт, дасгалын
            ахиц.
          </p>
        </div>
        <button
          type="button"
          className="admin-secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={16} /> Шинэчлэх
        </button>
      </div>
      <div className="admin-monitor-controls">
        <label>
          Анги
          <AdminSelect
            label="Анги"
            value={group}
            onValueChange={setClass}
            options={[
              { value: "all", label: "Бүх анги" },
              {
                value: "unassigned",
                label: `Анги оноогоогүй (${classCount.get(null) ?? 0})`,
              },
              ...(data?.classrooms.map((room) => ({
                value: room.id,
                label: `${room.name} (${classCount.get(room.id) ?? 0})`,
              })) ?? []),
            ]}
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
              setPage(0);
            }}
          />
        </label>
        <label>
          Багш
          <AdminSelect
            label="Багш"
            value={teacher}
            onValueChange={(value) => {
              setTeacher(value);
              setPage(0);
            }}
            options={[
              { value: "all", label: "Бүх багш" },
              { value: "unassigned", label: "Идэвхтэй багш оноогоогүй" },
              ...(data?.teachers.map(({ id }) => ({
                value: id,
                label: teacherName(id),
              })) ?? []),
            ]}
          />
        </label>
      </div>
      {resource?.error && (
        <p className="admin-monitor-error" role="alert">
          {resource.error}
        </p>
      )}
      {!resource && (
        <p className="admin-monitor-empty" role="status">
          Сургуулийн бүртгэлийг ачаалж байна…
        </p>
      )}
      {data && (
        <>
          {classrooms.has(group) && (
            <p className="admin-directory-teachers">
              <strong>Ангийн багш нар</strong>{" "}
              {classTeachers.length
                ? classTeachers.map(teacherName).join(", ")
                : "Оноогоогүй"}
            </p>
          )}
          <dl
            className="admin-directory-stats"
            aria-label="Сонгосон хичээлийн ахиц"
          >
            <div>
              <dt>Нийт сурагч</dt>
              <dd>{scope.length}</dd>
            </div>
            <div>
              <dt>Дундаж ахиц</dt>
              <dd>{scope.length ? `${average}%` : "—"}</dd>
            </div>
            <div>
              <dt>Бүрэн дуусгасан</dt>
              <dd>{fullyComplete}</dd>
            </div>
            <div>
              <dt>Эхэлсэн / Эхлээгүй</dt>
              <dd>
                {started} / {scope.length - started}
              </dd>
            </div>
          </dl>
          <div className="admin-monitor-table-tools">
            <label className="admin-search">
              <Search size={17} aria-hidden="true" />
              <span className="admin-sr-only">Сурагч, анги, багшаар хайх</span>
              <Input
                className="admin-search-input"
                type="search"
                placeholder="Сурагч, анги, багшаар хайх"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
              />
            </label>
            <button
              className="admin-secondary"
              type="button"
              aria-pressed={group === "unassigned"}
              onClick={() => {
                setClass(group === "unassigned" ? "all" : "unassigned");
                setTeacher("all");
                setQuery("");
              }}
            >
              Анги оноогоогүй · {classCount.get(null) ?? 0}
            </button>
          </div>
          {visible.length ? (
            <div className="admin-monitor-table-wrap">
              <table className="admin-monitor-table admin-directory-table">
                <thead>
                  <tr>
                    <th scope="col">Сурагч</th>
                    <th scope="col">Анги</th>
                    <th scope="col">Сурагчийн багш нар</th>
                    <th scope="col">Бие даан бодсон</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((student) => (
                    <tr key={student.id}>
                      <th scope="row">
                        <span className="admin-directory-name">
                          <strong>{student.name || student.id}</strong>
                          <small>{student.id}</small>
                        </span>
                      </th>
                      <td>
                        {classrooms.get(student.groupId ?? "")?.name ?? (
                          <span className="admin-directory-missing">
                            Оноогоогүй
                          </span>
                        )}
                      </td>
                      <td>
                        {student.teacherIds.length ? (
                          student.teacherIds.map(teacherName).join(", ")
                        ) : (
                          <span className="admin-directory-missing">
                            Оноогоогүй
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="admin-directory-progress">
                          <progress
                            aria-label={`${student.name || student.id} ахиц`}
                            value={student.completed}
                            max={total || 1}
                          />
                          <span>
                            {student.completed} / {total}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-monitor-empty">Тохирох сурагч олдсонгүй.</p>
          )}
          <footer className="admin-table-footer">
            <span>{matches.length} сурагч</span>
            <div>
              <button
                className="admin-secondary"
                aria-label="Өмнөх хуудас"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <span>
                {currentPage + 1} / {numberOfPages}
              </span>
              <button
                className="admin-secondary"
                aria-label="Дараах хуудас"
                disabled={currentPage + 1 === numberOfPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
