"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession, useSessionReady } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteGuard({
  children,
  area,
}: {
  children: React.ReactNode;
  area: "admin" | "staff" | "customer";
}) {
  const session = useSession();
  const sessionReady = useSessionReady();
  const pathname = usePathname();
  const router = useRouter();

  const blockedStaffRoute =
    area === "admin" &&
    session?.role === "staff" &&
    ["/dashboard", "/suppliers", "/users", "/approvals", "/profile"].some(
      (route) => pathname === route,
    );

  const blocked =
    !sessionReady ||
    (!session && sessionReady) ||
    (session && area !== "customer" && session.role === "user") ||
    blockedStaffRoute;

  useEffect(() => {
    if (!sessionReady) return;
    if (blocked) router.replace(blockedStaffRoute ? "/staff" : "/");
  }, [blocked, blockedStaffRoute, router, sessionReady]);

  if (!sessionReady || blocked) return <Skeleton className="h-40 w-full" />;
  if (area === "admin" && session?.role !== "admin")
    return <Skeleton className="h-40 w-full" />;
  return <>{children}</>;
}
