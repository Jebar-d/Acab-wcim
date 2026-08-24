"use client";

import UserCursor from "@/components/originkit/ui/usercursor";
import { useSession } from "@/lib/auth-store";

export function UserCursorProvider() {
  const session = useSession();
  const label =
    session?.role === "admin"
      ? "Admin"
      : session?.role === "staff"
        ? "Staff"
        : (session?.name?.split(" ")[0] ?? "Guest");
  const color =
    session?.role === "admin"
      ? "#2563eb"
      : session?.role === "staff"
        ? "#16a34a"
        : session?.role === "user"
          ? "#2563eb"
          : "#6b7280";
  return (
    <UserCursor
      name={label}
      color={color}
      textColor="#ffffff"
      size={56}
      labelTiltStrength={25}
      showLabel
      offsetX={0}
      offsetY={0}
      labelOffsetUseDefault
      labelOffsetX={25}
      labelOffsetY={12}
      pressScale={0.92}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    />
  );
}
