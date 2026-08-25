// app/staff/orders/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import { addOrder, deleteOrder, useOrders } from "@/lib/orders-store";

export default function OrdersPage() {
  const orders = useOrders();
  return (
    <DataTablePage
      title="Orders"
      description="Monitor sales orders from confirmation through fulfillment."
      addLabel="Add order"
      emptyLabel="No orders yet."
      data={orders}
      onAdd={(v) =>
        addOrder({
          projectName: v.projectName,
          clientName: v.clientName,
          materials: v.materials,
          quantity: v.quantity,
        })
      }
      onDelete={deleteOrder}
      fields={[
        {
          key: "projectName",
          label: "Project name",
          placeholder: "Riverside Housing",
        },
        { key: "clientName", label: "Client", placeholder: "Maria Santos" },
        { key: "materials", label: "Materials", placeholder: "Cement, rebar" },
        { key: "quantity", label: "Quantity", placeholder: "50 bags" },
      ]}
      columns={[
        { key: "projectName", label: "Order" },
        { key: "clientName", label: "Client" },
        { key: "materials", label: "Materials" },
        { key: "quantity", label: "Qty" },
        {
          key: "status",
          label: "Status",
          render: (o) => <Badge variant="secondary">{o.status}</Badge>,
        },
      ]}
    />
  );
}
