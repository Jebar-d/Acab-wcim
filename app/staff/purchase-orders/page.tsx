"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePage, type FieldConfig } from "@/components/staff/data-table-page";
import { addPurchaseOrder, receivePurchaseOrder, updatePurchaseOrderStatus, usePurchaseOrders, type PurchaseOrder, type PurchaseOrderStatus } from "@/lib/purchase-orders-store";
import { useMaterials } from "@/lib/materials-store";
import { useSuppliers } from "@/lib/suppliers-store";
import { useSearchParams } from "next/navigation";

const STATUSES: PurchaseOrderStatus[] = ["Pending", "Ordered", "Received", "Cancelled"];
const currency = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);

export default function PurchaseOrdersPage() {
  return <React.Suspense fallback={null}><PurchaseOrdersContent /></React.Suspense>;
}

function PurchaseOrdersContent() {
  const orders = usePurchaseOrders();
  const suppliers = useSuppliers();
  const materials = useMaterials();
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const filter = STATUSES.find((item) => item.toLowerCase() === requestedStatus?.toLowerCase()) ?? "All";
  const preferredMaterialId = searchParams.get("materialId") ?? "";

  const fields = React.useMemo<FieldConfig[]>(() => [
    { key: "supplierId", label: "Supplier", type: "select", defaultValue: suppliers.find((s) => s.status === "active")?.id ?? "", options: suppliers.filter((s) => s.status === "active").map((s) => ({ value: s.id, label: s.name })) },
    { key: "materialId", label: "Material", type: "select", defaultValue: materials.some((material) => material.id === preferredMaterialId) ? preferredMaterialId : materials[0]?.id ?? "", options: materials.map((m) => ({ value: m.id, label: `${m.name} · ${m.sku} (${m.quantity} ${m.unit})` })) },
    { key: "quantity", label: "Quantity", type: "number", defaultValue: "1", placeholder: "Quantity to order" },
    { key: "unitCost", label: "Unit cost (PHP)", type: "number", defaultValue: "0", placeholder: "0.00" },
    { key: "expectedDate", label: "Expected delivery date", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
  ], [materials, preferredMaterialId, suppliers]);

  const visibleOrders = React.useMemo(() => [...orders]
    .filter((order) => filter === "All" || order.status.toLowerCase() === filter.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filter, orders]);

  async function add(values: Record<string, string>) {
    const supplier = suppliers.find((item) => item.id === values.supplierId && item.status === "active");
    const material = materials.find((item) => item.id === values.materialId);
    const quantity = Number(values.quantity);
    const unitCost = Number(values.unitCost);
    if (!supplier) throw new Error("Choose an active supplier before creating a purchase order.");
    if (!material) throw new Error("Choose a material for this purchase order.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero.");
    if (!Number.isFinite(unitCost) || unitCost < 0) throw new Error("Unit cost must be zero or greater.");
    await addPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      materialId: material.id,
      material: material.name,
      sku: material.sku,
      quantity,
      unitCost,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: values.expectedDate,
      status: "Pending",
    });
    toast.success("Purchase order created.");
  }

  async function setStatus(order: PurchaseOrder, status: PurchaseOrderStatus) {
    try {
      await updatePurchaseOrderStatus(order.id, status);
      toast.success(`${order.poNumber || "Purchase order"} marked ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this purchase order.");
    }
  }

  async function receive(order: PurchaseOrder) {
    try {
      await receivePurchaseOrder(order.id);
      toast.success(`${order.poNumber} received and inventory updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not receive this purchase order.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Purchase Orders</h1><p className="text-sm text-muted-foreground">Order materials from suppliers and receive them into inventory.</p></div>
        <div className="flex flex-wrap gap-2">{["All", ...STATUSES].map((status) => <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} render={<Link href={status === "All" ? "/staff/purchase-orders" : `/staff/purchase-orders?status=${encodeURIComponent(status)}`} />}>{status}</Button>)}</div>
      </div>
      {suppliers.filter((supplier) => supplier.status === "active").length === 0 && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Add and activate a supplier before creating a purchase order. <Link className="font-medium underline" href="/staff/suppliers">Manage suppliers</Link></p>}
      {materials.length === 0 && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Add materials to inventory before creating purchase orders. <Link className="font-medium underline" href="/staff/materials">Manage materials</Link></p>}
      <DataTablePage<PurchaseOrder>
        title={filter === "Pending" ? "Pending Orders" : `${filter} Purchase Orders`}
        description="Pending orders can be marked as ordered, then received to update stock."
        addLabel="Create purchase order"
        emptyLabel={filter === "Pending" ? "No pending purchase orders." : "No purchase orders match this filter."}
        data={visibleOrders}
        fields={fields}
        onAdd={add}
        columns={[
          { key: "poNumber", label: "PO #", render: (order) => order.poNumber || "Saving…" },
          { key: "supplierName", label: "Supplier" },
          { key: "material", label: "Material", render: (order) => <span>{order.material}<span className="block text-xs text-muted-foreground">{order.sku}</span></span> },
          { key: "quantity", label: "Quantity" },
          { key: "totalAmount", label: "Total", render: (order) => currency(order.totalAmount) },
          { key: "expectedDate", label: "Expected" },
          { key: "status", label: "Status", render: (order) => <Badge variant={order.status === "Received" ? "secondary" : order.status === "Cancelled" ? "destructive" : "outline"}>{order.status}</Badge> },
        ]}
        extra={(order) => order.status === "Pending" ? <><Button size="sm" variant="outline" onClick={() => void setStatus(order, "Ordered")}>Mark ordered</Button><Button size="sm" variant="ghost" onClick={() => void setStatus(order, "Cancelled")}>Cancel</Button></> : order.status === "Ordered" ? <><Button size="sm" onClick={() => void receive(order)}>Receive stock</Button><Button size="sm" variant="ghost" onClick={() => void setStatus(order, "Cancelled")}>Cancel</Button></> : null}
      />
    </div>
  );
}
