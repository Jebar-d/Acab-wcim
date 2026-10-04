// app/staff/delivery-receipts/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import {
  DeliveryReceiptDialog,
  shortAddress,
} from "@/components/delivery-receipt-view";
import { updateRecord } from "@/lib/db-client";
import {
  addDeliveryReceipt,
  deleteDeliveryReceipt,
  useDeliveryReceipts,
} from "@/lib/delivery-receipts-store";
import { parseQuotationItems } from "@/lib/quotations-store";
import { formatUnitPrice } from "@/lib/money";

const STATUS_VARIANT = {
  Draft: "outline",
  Released: "secondary",
  Delivered: "secondary",
} as const;

export default function DeliveryReceiptsPage() {
  const receipts = useDeliveryReceipts();
  return (
    <DataTablePage
      title="Delivery Receipts"
      description="Track delivery receipts and confirmation details."
      addLabel="Add receipt"
      emptyLabel="No delivery receipts yet."
      data={receipts}
      onAdd={(v) =>
        addDeliveryReceipt({
          drNumber: v.drNumber,
          orderNumber: v.orderNumber,
          client: v.client,
          items: v.items,
          sku: v.sku,
          quantity: Number(v.quantity) || 0,
          totalAmount: Number(v.totalAmount) || 0,
          date: v.date || new Date().toISOString().slice(0, 10),
          releasedBy: v.releasedBy,
          status: "Draft",
        })
      }
      extra={(r) => <DeliveryReceiptDialog receipt={r} />}
      onDelete={deleteDeliveryReceipt}
      onUpdate={(id, v) =>
        void updateRecord("delivery_receipts", id, {
          drNumber: v.drNumber,
          orderNumber: v.orderNumber,
          client: v.client,
          items: v.items,
          sku: v.sku,
          quantity: Number(v.quantity) || 0,
          totalAmount: Number(v.totalAmount) || 0,
          releasedBy: v.releasedBy,
          date: v.date,
        })
      }
      fields={[
        { key: "drNumber", label: "DR number", placeholder: "DR-1001" },
        { key: "orderNumber", label: "Order #", placeholder: "ORD-1001" },
        {
          key: "client",
          label: "Client / Destination",
          placeholder: "Maria Santos",
        },
        { key: "items", label: "Items", placeholder: "Portland Cement" },
        { key: "sku", label: "SKU", placeholder: "CEM-001" },
        {
          key: "quantity",
          label: "Quantity",
          type: "number",
          placeholder: "50",
        },
        { key: "totalAmount", label: "Receipt total (PHP)", type: "number", placeholder: "0.00", defaultValue: "0" },
        { key: "releasedBy", label: "Released by", placeholder: "Jamie Cruz" },
        { key: "date", label: "Date", type: "date" },
      ]}
      columns={[
        { key: "drNumber", label: "Receipt" },
        { key: "orderNumber", label: "Order #" },
        { key: "client", label: "Client" },
        { key: "items", label: "Items", render: (r) => parseQuotationItems(r.items).map((item) => item.materialName + " (" + item.quantity + " " + item.unit + ")").join(", ") || r.items },
        { key: "quantity", label: "Qty" },
        { key: "totalAmount", label: "Total", render: (r) => formatUnitPrice(r.totalAmount) },
        {
          key: "deliveryAddress",
          label: "Deliver to",
          render: (r) => (
            <span
              title={r.deliveryAddress ?? undefined}
              className="block max-w-[220px] truncate text-sm text-muted-foreground"
            >
              {[r.deliveryMethod, shortAddress(r.deliveryAddress)]
                .filter(Boolean)
                .join(" · ") || "—"}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (r) => (
            <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
          ),
        },
      ]}
    />
  );
}
