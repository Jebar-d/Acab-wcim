// components/ui/app-sidebar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Inbox,
  ShoppingCart,
  Users,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  Truck,
  Sparkles,
  User,
  CreditCard,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type SubItem = { title: string; url: string };
type NavItem = {
  title: string;
  url?: string;
  icon: React.ElementType;
  items?: SubItem[];
};

export const platformNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Sales",
    icon: ShoppingCart,
    items: [
      { title: "Clients", url: "/clients" },
      { title: "Quotations", url: "/quotations" },
      { title: "Orders", url: "/orders" },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    items: [
      { title: "Materials", url: "/materials" },
      { title: "Categories", url: "/categories" },
      { title: "Checklist", url: "/checklist" },
    ],
  },
  {
    title: "Warehouse",
    icon: Warehouse,
    items: [
      { title: "Stock In", url: "/stock-in" },
      { title: "Stock Out", url: "/stock-out" },
      { title: "Delivery Receipts", url: "/delivery-receipts" },
    ],
  },
  {
    title: "Procurement",
    icon: Inbox,
    items: [
      { title: "Purchase Orders", url: "/purchase-orders" },
      { title: "Suppliers", url: "/suppliers" },
      { title: "Ledger", url: "/ledger" },
    ],
  },
  {
    title: "Users",
    icon: Users,
    items: [
      { title: "Staff", url: "/staff" },
      { title: "Admin", url: "/admin" },
    ],
  },
];

export const quickLinks = [
  { title: "Low Stock Alerts", url: "/alerts", icon: AlertTriangle },
  {
    title: "Pending Orders",
    url: "/purchase-orders?status=pending",
    icon: Clock,
  },
  { title: "Recent Deliveries", url: "/delivery-receipts", icon: Truck },
];

/** Resolves a pathname to a breadcrumb group + label using the nav config above. */
export function getBreadcrumb(pathname: string): {
  group: string | null;
  label: string;
} {
  for (const item of platformNav) {
    if (item.url === pathname) return { group: null, label: item.title };
    const sub = item.items?.find((s) => s.url === pathname);
    if (sub) return { group: item.title, label: sub.title };
  }

  const quick = quickLinks.find((q) => q.url.split("?")[0] === pathname);
  if (quick) return { group: "Quick Links", label: quick.title };

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return { group: null, label: "Dashboard" };

  const label = last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { group: null, label };
}

export function AppSidebar() {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { Sales: true };
    for (const item of platformNav) {
      if (item.items?.some((sub) => sub.url === pathname)) {
        initial[item.title] = true;
      }
    }
    return initial;
  });

  const toggle = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

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
                    <span className="truncate font-semibold">ACAB</span>
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
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNav.map((item) => {
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={pathname === item.url}
                        render={
                          <a href={item.url}>
                            <item.icon className="size-4 transition-transform duration-200 ease-out group-hover/menu-button:scale-110 group-active/menu-button:scale-95" />
                            <span>{item.title}</span>
                          </a>
                        }
                      />
                    </SidebarMenuItem>
                  );
                }

                const isOpen = openGroups[item.title] ?? false;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton onClick={() => toggle(item.title)}>
                      <item.icon className="size-4 transition-transform duration-200 ease-out group-hover/menu-button:scale-110 group-active/menu-button:scale-95" />
                      <span>{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto size-4 text-muted-foreground transition-transform duration-200 ease-out",
                          isOpen && "rotate-90",
                        )}
                      />
                    </SidebarMenuButton>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <SidebarMenuSub>
                            {item.items.map((sub) => (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton
                                  isActive={pathname === sub.url}
                                  render={<a href={sub.url}>{sub.title}</a>}
                                />
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickLinks.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton
                    isActive={pathname === link.url.split("?")[0]}
                    render={
                      <a href={link.url}>
                        <link.icon className="size-4 transition-transform duration-200 ease-out group-hover/menu-button:scale-110 group-active/menu-button:scale-95" />
                        <span>{link.title}</span>
                      </a>
                    }
                  />
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-muted-foreground">
                  <MoreHorizontal className="size-4 transition-transform duration-200 ease-out group-hover/menu-button:scale-110" />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      AU
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Admin User</span>
                      <span className="truncate text-xs text-muted-foreground">
                        admin@acab.com
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-popup-open/user:rotate-180" />
                  </SidebarMenuButton>
                }
              />
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 gap-1 p-2"
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    AU
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">
                      Admin User
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      admin@acab.com
                    </span>
                  </div>
                </div>

                <Separator className="my-1.5" />

                <button
                  type="button"
                  className="group/item flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <Sparkles className="size-4 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-12" />
                  Upgrade to Pro
                </button>

                <Separator className="my-1.5" />

                {(
                  [
                    { label: "Account", icon: User },
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
                  className="group/item flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4 transition-transform duration-200 group-hover/item:translate-x-0.5" />
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
