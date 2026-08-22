import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { StaffSidebar } from "@/app/(app)/staff-sidebar";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <StaffSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
