"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteGuard({
  children,
  area,
}: {
  children: React.ReactNode;
  area: "admin" | "staff";
}) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const blockedStaffRoute =
    area === "admin" &&
    session?.role === "staff" &&
    ["/dashboard", "/suppliers", "/users", "/approvals", "/profile"].some(
      (route) => pathname === route,
    );
  const blocked = !session || session.role === "user" || blockedStaffRoute;
  useEffect(() => {
    if (blocked) router.replace(blockedStaffRoute ? "/staff" : "/");
  }, [blocked, blockedStaffRoute, router]);
  if (blocked) return <Skeleton className="h-40 w-full" />;
  if (area === "admin" && session.role !== "admin")
    return <Skeleton className="h-40 w-full" />;
  return <>{children}</>;
}
