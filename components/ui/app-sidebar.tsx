// components/ui/app-sidebar.tsx — FULL FILE, replace everything
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronsUpDown,
  LayoutDashboard,
  Users,
  User,
  CreditCard,
  Bell,
  LogOut,
  Warehouse,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { BreadcrumbEntry } from "@/lib/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { logout, useAccounts, useSession } from "@/lib/auth-store";

// Admin's nav is intentionally small: the day-to-day operational screens
// (Sales, Inventory, Warehouse, Procurement) live in the Staff portal at
// /staff/*. This sidebar only covers what's actually an admin's job —
// managing the supplier registry and managing user accounts/approvals.
type NavItem = { title: string; url: string; icon: React.ElementType };

export const platformNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Suppliers", url: "/suppliers", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
];

/** Flat url->label map SiteHeader uses to resolve breadcrumbs on admin routes. */
export const adminBreadcrumbEntries: BreadcrumbEntry[] = platformNav.map(
  (item) => ({ url: item.url, label: item.title }),
);

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const pendingCount = useAccounts().filter(
    (a) => a.status === "pending",
  ).length;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <a href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Warehouse className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">ACAB Admin</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Warehouse Construction IMS
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </a>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    render={
                      <a href={item.url}>
                        <item.icon className="size-4 transition-transform duration-200 ease-out group-hover/menu-button:scale-110 group-active/menu-button:scale-95" />
                        <span>{item.title}</span>
                        {item.title === "Users" && pendingCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-4.5 px-1.5 text-[10px]"
                          >
                            {pendingCount}
                          </Badge>
                        )}
                      </a>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger
                render={
                  <SidebarMenuButton size="lg" className="group/user">
                    <Avatar className="size-8">
                      <AvatarFallback className="rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {session ? (
                          getInitials(session.name)
                        ) : (
                          <User className="size-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.name ?? "Guest"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session?.email ?? "Not signed in"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-popup-open/user:rotate-180" />
                  </SidebarMenuButton>
                }
              />
              <PopoverContent
                side="right"
                align="end"
                sideOffset={12}
                className="w-64 gap-1 p-2"
              >
                {session ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="rounded-full bg-primary text-sm font-medium text-primary-foreground">
                          {getInitials(session.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="truncate text-sm font-semibold">
                          {session.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {session.email}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-1.5" />

                    <a
                      href="/profile"
                      className="group/item flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <User className="size-4 transition-transform duration-200 group-hover/item:scale-110" />
                      Profile
                    </a>

                    {(
                      [
                        { label: "Billing", icon: CreditCard },
                        { label: "Notifications", icon: Bell },
                      ] as const
                    ).map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        className="group/item flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="size-4 transition-transform duration-200 group-hover/item:scale-110" />
                        {label}
                      </button>
                    ))}

                    <Separator className="my-1.5" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group/item flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-4 transition-transform duration-200 group-hover/item:translate-x-0.5" />
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-1">
                    <p className="px-2 pt-1 text-sm text-muted-foreground">
                      You&apos;re not signed in.
                    </p>
                    <SidebarMenuButton
                      render={<a href="/login">Sign in</a>}
                      className="justify-center bg-primary text-primary-foreground hover:bg-primary/80"
                    />
                    <SidebarMenuButton
                      render={<a href="/register">Create account</a>}
                      className="justify-center"
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
