// app/staff/stock-out/page.tsx
"use client";

import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePage } from "@/components/staff/data-table-page";
import { updateRecord } from "@/lib/db-client";
import {
  addStockOut,
  confirmStockOut,
  deleteStockOut,
  useStockOuts,
} from "@/lib/stock-out-store";

export default function StockOutPage() {
  const entries = useStockOuts();

  async function handleConfirm(id: string) {
    const result = await confirmStockOut(id);
    if (!result) {
      toast.error("Couldn't confirm — check the material has enough stock.");
      return;
    }
    toast.success(
      "Stock out confirmed, inventory updated, delivery receipt created.",
    );
  }

  return (
    <DataTablePage
      title="Stock Out"
      description="Record materials released from warehouse stock."
      addLabel="Record stock out"
      emptyLabel="No stock-out records yet."
      data={entries}
      onAdd={(v) =>
        addStockOut({
          stockOutId: v.reference,
          sku: v.sku,
          material: v.material,
          quantity: Number(v.quantity) || 0,
          orderRef: v.orderRef,
          destination: v.destination,
          warehouseStaff: v.warehouseStaff,
          date: v.date || new Date().toISOString().slice(0, 10),
          status: "Draft",
        })
      }
      onDelete={deleteStockOut}
      onUpdate={(id, v) => void updateRecord("stock_out", id, { material: v.material, sku: v.sku, quantity: Number(v.quantity)||0, orderRef: v.orderRef, destination: v.destination, warehouseStaff: v.warehouseStaff, stockOutId: v.reference, date: v.date })}
      fields={[
        { key: "material", label: "Material", placeholder: "Portland Cement" },
        { key: "sku", label: "SKU", placeholder: "CEM-001" },
        {
          key: "quantity",
          label: "Quantity",
          type: "number",
          placeholder: "20",
        },
        {
          key: "destination",
          label: "Destination",
          placeholder: "Riverside Housing site",
        },
        { key: "orderRef", label: "Order reference", placeholder: "ORD-1001" },
        {
          key: "warehouseStaff",
          label: "Released by",
          placeholder: "Jamie Cruz",
        },
        { key: "reference", label: "Reference #", placeholder: "SO-1001" },
        { key: "date", label: "Date", type: "date" },
      ]}
      columns={[
        { key: "material", label: "Material" },
        { key: "quantity", label: "Qty" },
        { key: "destination", label: "Destination" },
        {
          key: "status",
          label: "Status",
          render: (e) => (
            <Badge variant={e.status === "Confirmed" ? "secondary" : "outline"}>
              {e.status}
            </Badge>
          ),
        },
      ]}
      extra={(entry) =>
        entry.status === "Draft" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConfirm(entry.id)}
          >
            <CheckCircle2 className="size-4" />
            Confirm
          </Button>
        ) : null
      }
    />
  );
}
