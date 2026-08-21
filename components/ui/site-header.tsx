// components/site-header.tsx
"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getBreadcrumb } from "@/components/ui/app-sidebar";

export function SiteHeader() {
  const pathname = usePathname();
  const { group, label } = getBreadcrumb(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 transition-colors duration-300">
      <SidebarTrigger className="transition-transform duration-200 hover:scale-105 active:scale-90" />
      <Separator orientation="vertical" className="h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          {group && (
            <>
              <BreadcrumbItem className="hidden md:inline-flex">
                {group}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:inline-flex" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
