"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { Toaster } from "@/components/ui/sonner";
import { RouteGuard } from "@/components/auth/route-guard";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSession();
  const customerProfile = pathname === "/profile" && session?.role === "user";

  if (customerProfile) {
    return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-6xl"><RouteGuard area="customer">{children}</RouteGuard></div><Toaster /></main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4">
          <RouteGuard area="admin">{children}</RouteGuard>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
