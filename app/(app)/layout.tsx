// app/(app)/layout.tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { Toaster } from "@/components/ui/sonner";
import { RouteGuard } from "@/components/auth/route-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
