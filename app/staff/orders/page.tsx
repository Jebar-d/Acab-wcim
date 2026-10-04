// app/staff/orders/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import { addOrder, deleteOrder, updateOrder, updateOrderStatus, useOrders, type OrderStatus } from "@/lib/orders-store";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-store";

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "Ready for Release", "Released", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const orders = useOrders();
  const session = useSession();

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status, `${session?.name ?? "Staff"} moved the order to ${status}.`);
      toast.success(`Order moved to ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    }
  }

  return (
    <DataTablePage
      title="Orders"
      description="Monitor customer orders from confirmation through warehouse release and delivery."
      addLabel="Add order"
      emptyLabel="No orders yet."
      data={orders}
      onAdd={(v) => addOrder({ projectName: v.projectName, clientName: v.clientName, materials: v.materials, quantity: v.quantity })}
      onDelete={deleteOrder}
      onUpdate={(id, v) => updateOrder(id, { projectName: v.projectName, clientName: v.clientName, materials: v.materials, quantity: v.quantity })}
      fields={[
        { key: "projectName", label: "Project name", placeholder: "Riverside Housing" },
        { key: "clientName", label: "Client", placeholder: "Maria Santos" },
        { key: "materials", label: "Materials", placeholder: "Cement, rebar" },
        { key: "quantity", label: "Quantity", placeholder: "50 bags" },
      ]}
      columns={[
        { key: "projectName", label: "Order" },
        { key: "clientName", label: "Client" },
        { key: "materials", label: "Materials" },
        { key: "quantity", label: "Qty" },
        { key: "status", label: "Status", render: (o) => <Badge variant={o.status === "Cancelled" ? "destructive" : "secondary"}>{o.status}</Badge> },
      ]}
      extra={(order) => (
        <select
          aria-label={`Update ${order.projectName} status`}
          value={order.status}
          onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)}
          className="h-8 rounded-xl border border-border bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      )}
    />
  );
}
