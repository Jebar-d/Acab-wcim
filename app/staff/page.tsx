"use client";

import { isOpenQuotationStatus, parseQuotationItems, useQuotations } from "@/lib/quotations-store";
import { formatUnitPrice } from "@/lib/money";
import { useStockIns } from "@/lib/stock-in-store";
import { useStockOuts } from "@/lib/stock-out-store";

const staffAreas = [
  {
    title: "Sales",
    description: "Clients, quotations, and orders",
    links: [
      ["Clients", "/staff/clients"],
      ["Quotations", "/staff/quotations"],
      ["Orders", "/staff/orders"],
    ],
  },
  {
    title: "Inventory",
    description: "Materials, categories, and checklist",
    links: [
      ["Materials", "/staff/materials"],
      ["Categories", "/staff/categories"],
      ["Checklist", "/staff/checklist"],
    ],
  },
  {
    title: "Warehouse",
    description: "Stock movements and delivery receipts",
    links: [
      ["Stock In", "/staff/stock-in"],
      ["Stock Out", "/staff/stock-out"],
      ["Delivery Receipts", "/staff/delivery-receipts"],
    ],
  },
  {
    title: "Procurement",
    description: "Purchase orders, suppliers, and ledger",
    links: [
      ["Purchase Orders", "/staff/purchase-orders"],
      ["Suppliers", "/staff/suppliers"],
      ["Ledger", "/staff/ledger"],
    ],
  },
];

export default function StaffPage() {
  const quotations = useQuotations();
  const stockIns = useStockIns();
  const stockOuts = useStockOuts();

  const pendingQuotationCount = quotations.filter((quotation) => isOpenQuotationStatus(quotation.status)).length;

  const recentRequests = quotations.filter((quotation) => isOpenQuotationStatus(quotation.status)).slice(0, 4);
  const staffMetrics = [
    { label: "Assigned Orders", value: "0" },
    { label: "Items to Pick", value: "0" },
    { label: "Pending Deliveries", value: "0" },
    { label: "Pending Quotations", value: String(pendingQuotationCount) },
    { label: "Stock In", value: String(stockIns.length) },
    { label: "Stock Out", value: String(stockOuts.length) },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Keep today&apos;s warehouse work moving.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {staffMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Customer requests waiting for review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff can review customer quotation requests and approve them here.
        </p>

        <div className="mt-4 space-y-3">
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quotation requests yet.
            </p>
          ) : (
            recentRequests.map((quotation) => (
              <div
                key={quotation.id}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{quotation.projectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {quotation.customerName ?? "Customer"} · {quotation.location}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs capitalize">
                    {quotation.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {parseQuotationItems(quotation.materials).map((item) => item.materialName + " (" + item.quantity + " " + item.unit + ")").join(", ") || quotation.materials} · Qty: {quotation.quantity} · {formatUnitPrice(quotation.totalAmount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {staffAreas.map((area) => (
          <section key={area.title} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold">{area.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {area.links.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {label}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
