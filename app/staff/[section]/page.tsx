import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

const sections = {
  clients: {
    title: "Clients",
    group: "Sales",
    description: "Manage customer records and contact details.",
    icon: Users,
    columns: ["Client", "Contact", "Status"],
  },
  quotations: {
    title: "Quotations",
    group: "Sales",
    description: "Prepare and track quotations for customer requests.",
    icon: FileText,
    columns: ["Quotation", "Client", "Status"],
  },
  orders: {
    title: "Orders",
    group: "Sales",
    description: "Monitor sales orders from confirmation through fulfillment.",
    icon: ShoppingCart,
    columns: ["Order", "Client", "Status"],
  },
  materials: {
    title: "Materials",
    group: "Inventory",
    description: "Keep material records and available quantities up to date.",
    icon: Package,
    columns: ["Material", "Category", "Quantity"],
  },
  categories: {
    title: "Categories",
    group: "Inventory",
    description: "Organize materials into clear inventory categories.",
    icon: Package,
    columns: ["Category", "Materials", "Status"],
  },
  checklist: {
    title: "Checklist",
    group: "Inventory",
    description: "Review the checks required before inventory moves forward.",
    icon: ClipboardCheck,
    columns: ["Checklist", "Assigned to", "Status"],
  },
  "stock-in": {
    title: "Stock In",
    group: "Warehouse",
    description: "Record materials received into the warehouse.",
    icon: Warehouse,
    columns: ["Reference", "Supplier", "Received"],
  },
  "stock-out": {
    title: "Stock Out",
    group: "Warehouse",
    description: "Record materials released from warehouse stock.",
    icon: Warehouse,
    columns: ["Reference", "Destination", "Released"],
  },
  "delivery-receipts": {
    title: "Delivery Receipts",
    group: "Warehouse",
    description: "Track delivery receipts and confirmation details.",
    icon: Truck,
    columns: ["Receipt", "Recipient", "Status"],
  },
  "purchase-orders": {
    title: "Purchase Orders",
    group: "Procurement",
    description: "Create and follow purchase orders with suppliers.",
    icon: Receipt,
    columns: ["Purchase order", "Supplier", "Status"],
  },
  suppliers: {
    title: "Suppliers",
    group: "Procurement",
    description: "Maintain supplier records for purchasing workflows.",
    icon: Users,
    columns: ["Supplier", "Contact", "Status"],
  },
  ledger: {
    title: "Ledger",
    group: "Procurement",
    description: "Review procurement transactions and balances.",
    icon: Receipt,
    columns: ["Transaction", "Supplier", "Amount"],
  },
  alerts: {
    title: "Low Stock Alerts",
    group: "Quick Links",
    description: "Review materials that need replenishment.",
    icon: Package,
    columns: ["Material", "Available", "Action"],
  },
} as const;

type SectionKey = keyof typeof sections;

export default async function StaffSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = sections[section as SectionKey];

  if (!page) notFound();

  const Icon = page.icon;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Staff / {page.group}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-3 gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {page.columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <div className="px-5 py-12 text-center">
          <p className="font-medium">No records yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Records for this Staff workspace will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
