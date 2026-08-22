"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  Clock,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  User,
  Warehouse,
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

type StaffSubItem = { title: string; url: string };
type StaffNavItem = {
  title: string;
  icon: React.ElementType;
  url?: string;
  items?: StaffSubItem[];
};

const staffNav: StaffNavItem[] = [
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
];

const quickLinks = [
  { title: "Low Stock Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Pending Orders", url: "/purchase-orders?status=pending", icon: Clock },
  { title: "Recent Deliveries", url: "/delivery-receipts", icon: Truck },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Sales: true,
  });

  function toggleGroup(title: string) {
    setOpenGroups((groups) => ({ ...groups, [title]: !groups[title] }));
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
              {staffNav.map((item) => {
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={pathname === item.url}
                        render={
                          <a href={item.url}>
                            <item.icon className="size-4" />
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
                    <SidebarMenuButton onClick={() => toggleGroup(item.title)}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto size-4 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-90",
                        )}
                      />
                    </SidebarMenuButton>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  isActive={pathname === subItem.url}
                                  render={<a href={subItem.url}>{subItem.title}</a>}
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
                        <link.icon className="size-4" />
                        <span>{link.title}</span>
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
            <SidebarMenuButton size="lg" render={<a href="/login" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Guest</span>
                <span className="truncate text-xs text-muted-foreground">
                  Not signed in
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
