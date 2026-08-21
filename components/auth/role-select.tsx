"use client";

import type { ChangeEvent } from "react";

import type { Role } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type RoleSelectProps = {
  value: Role;
  onChange: (role: Role) => void;
  className?: string;
};

export function RoleSelect({ value, onChange, className }: RoleSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as Role);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <option value="user">User</option>
      <option value="staff">Staff / Employee</option>
      <option value="admin">Admin</option>
    </select>
  );
}
