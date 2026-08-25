// app/staff/stock-in/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import { addStockIn, deleteStockIn, useStockIns } from "@/lib/stock-in-store";

export default function StockInPage() {
  const entries = useStockIns();
  return (
    <DataTablePage
      title="Stock In"
      description="Record materials received into the warehouse."
      addLabel="Record stock in"
      emptyLabel="No stock-in records yet."
      data={entries}
      onAdd={(v) =>
        addStockIn({
          sku: v.sku,
          material: v.material,
          quantity: Number(v.quantity) || 0,
          supplier: v.supplier,
          date: v.date || new Date().toISOString().slice(0, 10),
          reference: v.reference,
        })
      }
      onDelete={deleteStockIn}
      fields={[
        { key: "material", label: "Material", placeholder: "Portland Cement" },
        { key: "sku", label: "SKU", placeholder: "CEM-001" },
        {
          key: "quantity",
          label: "Quantity",
          type: "number",
          placeholder: "50",
        },
        {
          key: "supplier",
          label: "Supplier",
          placeholder: "Cebu Steel & Rebar Co.",
        },
        { key: "reference", label: "Reference #", placeholder: "SI-1001" },
        { key: "date", label: "Date", type: "date" },
      ]}
      columns={[
        { key: "reference", label: "Reference" },
        { key: "material", label: "Material" },
        { key: "quantity", label: "Qty" },
        { key: "supplier", label: "Supplier" },
        { key: "date", label: "Received" },
        {
          key: "status",
          label: "Status",
          render: (e) => <Badge variant="secondary">{e.status}</Badge>,
        },
      ]}
    />
  );
}
