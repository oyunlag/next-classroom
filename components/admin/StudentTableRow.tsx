"use client";
import { FileCode2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Group, StudentRow } from "@/lib/admin/types";
import { courses } from "@/lib/student/identity";
import { courseLabels, dateLabel } from "./api";
export default function StudentTableRow({
  student,
  groups,
  selected,
  onToggle,
  onOpen,
  onDelete,
  disabled,
}: {
  student: StudentRow;
  groups: Group[];
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <tr className={selected ? "admin-row-selected" : ""}>
      <td className="admin-select-cell">
        <label className="admin-select-hit">
          <input
            type="checkbox"
            aria-label={`${student.id} сурагчийг сонгох`}
            checked={selected}
            onChange={onToggle}
          />
        </label>
      </td>
      <td className="admin-identity-cell">
        <button className="admin-student-link" onClick={onOpen}>
          <span className="admin-avatar" aria-hidden="true">
            {(student.name || student.id).slice(0, 1)}
          </span>
          <span>
            <strong>{student.name || student.id}</strong>
            <small>{student.id}</small>
          </span>
        </button>
      </td>
      <td className="admin-class-cell">
        <span
          className={`admin-group-tag ${!student.groupId ? "unassigned" : ""}`}
        >
          {groups.find((g) => g.id === student.groupId)?.name || "Оноогоогүй"}
        </span>
      </td>
      {courses.map((course) => {
        const p = student.courses[course];
        const percentage =
          p && p.total ? Math.round((p.completed / p.total) * 100) : 0;
        return (
          <td className="admin-course-cell" key={course}>
            <span className="admin-mobile-label">{courseLabels[course]}</span>
            {p ? (
              <div className="admin-progress">
                <span>
                  <strong>
                    {p.completed}
                    <span> / {p.total}</span>
                  </strong>
                  <small>{percentage}%</small>
                </span>
                <div
                  role="progressbar"
                  aria-label={`${courseLabels[course]} дасгалын ахиц`}
                  aria-valuemin={0}
                  aria-valuemax={p.total}
                  aria-valuenow={p.completed}
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
              </div>
            ) : (
              <span
                className="admin-course-empty"
                aria-label={`${courseLabels[course]} эхлээгүй`}
              >
                —
              </span>
            )}
          </td>
        );
      })}
      <td className="admin-date">{dateLabel(student.updatedAt)}</td>
      <td className="admin-row-actions">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="admin-row-menu"
              aria-label={`${student.id} сурагчийн үйлдлүүд`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="admin-row-menu-content">
            <DropdownMenuItem onSelect={onOpen}>
              <FileCode2 /> Хадгалсан ажил харах
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              disabled={disabled}
              variant="destructive"
            >
              <Trash2 /> Сурагч устгах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
