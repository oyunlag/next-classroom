"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option<Value extends string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

const itemKey = (value: string) => `option:${value}`;

export default function AdminSelect<Value extends string>({
  label,
  id,
  value,
  options,
  onValueChange,
  placeholder = "Сонгох",
  disabled,
  required,
  icon,
  className,
}: {
  label: string;
  id?: string;
  value: Value;
  options: readonly Option<Value>[];
  onValueChange: (value: Value) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const [container, setContainer] = useState<HTMLDialogElement | null>(null);
  const attachTrigger = useCallback((element: HTMLButtonElement | null) => {
    setContainer(element?.closest("dialog") ?? null);
  }, []);
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={selected ? itemKey(selected.value) : ""}
      onValueChange={(key) => {
        const next = options.find((option) => itemKey(option.value) === key);
        if (next) onValueChange(next.value);
      }}
      disabled={disabled || !options.length}
      required={required}
    >
      <SelectTrigger
        ref={attachTrigger}
        id={id}
        aria-label={label}
        className={`admin-select${className ? ` ${className}` : ""}`}
      >
        {icon && (
          <span className="admin-select-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        container={container ?? undefined}
        align="start"
        position="popper"
        className="admin-select-content"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={itemKey(option.value)}
            textValue={option.label}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
