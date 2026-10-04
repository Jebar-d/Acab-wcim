"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePage, type FieldConfig } from "@/components/staff/data-table-page";
import { addStockOut, confirmStockOut, useStockOuts } from "@/lib/stock-out-store";
import { useMaterials } from "@/lib/materials-store";

export default function StockOutPage() {
  const entries = useStockOuts();
  const materials = useMaterials();
  const fields = React.useMemo<FieldConfig[]>(() => [
    { key: "sku", label: "Material", type: "select", defaultValue: materials[0]?.sku ?? "", options: materials.map((material) => ({ value: material.sku, label: `${material.name} · ${material.sku} (${material.quantity} ${material.unit})` })) },
    { key: "quantity", label: "Quantity released", type: "number", defaultValue: "1", placeholder: "Quantity to release" },
    { key: "destination", label: "Destination", placeholder: "Project site or recipient" },
    { key: "orderRef", label: "Order reference", placeholder: "Order number" },
    { key: "warehouseStaff", label: "Released by", placeholder: "Staff name" },
    { key: "reference", label: "Reference #", placeholder: "Stock-out reference" },
    { key: "date", label: "Date", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
  ], [materials]);

  async function add(values: Record<string, string>) {
    const material = materials.find((item) => item.sku === values.sku);
    const quantity = Number(values.quantity);
    if (!material) throw new Error("Choose an existing material.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero.");
    await addStockOut({
      stockOutId: values.reference.trim(), sku: material.sku, material: material.name,
      quantity, orderRef: values.orderRef.trim(), destination: values.destination.trim(),
      warehouseStaff: values.warehouseStaff.trim(), date: values.date, status: "Draft",
    });
  }

  async function handleConfirm(id: string) {
    try {
      await confirmStockOut(id);
      toast.success("Stock out confirmed. Inventory and delivery receipt updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't confirm stock out. Check the available quantity.");
    }
  }

  return <div className="space-y-3">
    {materials.length === 0 && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Add materials before recording a release. <Link className="font-medium underline" href="/staff/materials">Manage materials</Link></p>}
    <DataTablePage
    title="Stock Out"
    description="Prepare a material release, then confirm it to deduct inventory and create a delivery receipt."
    addLabel="Record stock out"
    emptyLabel="No stock-out records yet."
    data={entries}
    onAdd={add}
    fields={fields}
    columns={[
      { key: "stockOutId", label: "Reference" },
      { key: "material", label: "Material", render: (entry) => <span>{entry.material}<span className="block text-xs text-muted-foreground">{entry.sku}</span></span> },
      { key: "quantity", label: "Qty" },
      { key: "orderRef", label: "Order" },
      { key: "destination", label: "Destination" },
      { key: "status", label: "Status", render: (entry) => <Badge variant={entry.status === "Confirmed" ? "secondary" : "outline"}>{entry.status}</Badge> },
    ]}
    extra={(entry) => entry.status === "Draft" ? <Button size="sm" variant="outline" onClick={() => void handleConfirm(entry.id)}><CheckCircle2 className="size-4" />Confirm release</Button> : null}
    />
  </div>;
}
