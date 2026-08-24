// app/staff/layout.tsx
"use client";

import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { StaffSidebar } from "@/app/(app)/staff-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { RouteGuard } from "@/components/auth/route-guard";
import { useSession } from "@/lib/auth-store";

export default function StaffLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  return (
    <SidebarProvider>
      {session?.role === "admin" ? <AppSidebar /> : <StaffSidebar />}
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <RouteGuard area="staff">{children}</RouteGuard>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
