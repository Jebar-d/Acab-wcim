"use client";

import type { Role } from "@/lib/auth-store";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleSelectProps = {
  value: Role;
  onChange: (role: Role) => void;
};

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={(value) => onChange(value as Role)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select account type" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="user">User</SelectItem>

        <SelectItem value="staff">Staff / Employee</SelectItem>

        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
