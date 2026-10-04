"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTablePage, type FieldConfig } from "@/components/staff/data-table-page";
import { addStockIn, useStockIns } from "@/lib/stock-in-store";
import { useMaterials } from "@/lib/materials-store";
import { useSuppliers } from "@/lib/suppliers-store";

export default function StockInPage() {
  const entries = useStockIns();
  const materials = useMaterials();
  const allSuppliers = useSuppliers();
  const suppliers = React.useMemo(() => allSuppliers.filter((supplier) => supplier.status === "active"), [allSuppliers]);
  const [preferredSku, setPreferredSku] = React.useState("");
  React.useEffect(() => {
    setPreferredSku(new URLSearchParams(window.location.search).get("sku") ?? "");
  }, []);
  const fields = React.useMemo<FieldConfig[]>(() => [
    { key: "sku", label: "Material", type: "select", defaultValue: materials.some((material) => material.sku === preferredSku) ? preferredSku : materials[0]?.sku ?? "", options: materials.map((material) => ({ value: material.sku, label: `${material.name} · ${material.sku} (${material.quantity} ${material.unit})` })) },
    { key: "quantity", label: "Quantity received", type: "number", defaultValue: "1", placeholder: "Quantity received" },
    { key: "supplierId", label: "Supplier", type: "select", defaultValue: suppliers[0]?.id ?? "", options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })) },
    { key: "reference", label: "Reference #", placeholder: "Delivery note or invoice number" },
    { key: "date", label: "Date", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
  ], [materials, preferredSku, suppliers]);

  async function add(values: Record<string, string>) {
    const material = materials.find((item) => item.sku === values.sku);
    const supplier = suppliers.find((item) => item.id === values.supplierId);
    const quantity = Number(values.quantity);
    if (!material) throw new Error("Choose an existing material.");
    if (!supplier) throw new Error("Choose an active supplier.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero.");
    await addStockIn({ sku: material.sku, material: material.name, quantity, supplier: supplier.name, date: values.date, stockInId: values.reference.trim() || undefined });
  }

  return <div className="space-y-3">
    {(materials.length === 0 || suppliers.length === 0) && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">{materials.length === 0 && <>Add a material first in <Link className="font-medium underline" href="/staff/materials">Materials</Link>. </>}{suppliers.length === 0 && <>Add or activate a supplier in <Link className="font-medium underline" href="/staff/suppliers">Suppliers</Link> before recording a delivery.</>}</p>}
    <DataTablePage
    title="Stock In"
    description="Record supplier deliveries and add received quantities to inventory."
    addLabel="Record stock in"
    emptyLabel="No stock-in records yet."
    data={entries}
    onAdd={add}
    fields={fields}
    columns={[
      { key: "reference", label: "Reference" },
      { key: "material", label: "Material", render: (entry) => <span>{entry.material}<span className="block text-xs text-muted-foreground">{entry.sku}</span></span> },
      { key: "quantity", label: "Qty received" },
      { key: "supplier", label: "Supplier" },
      { key: "date", label: "Received" },
      { key: "status", label: "Status", render: (entry) => <Badge variant="secondary">{entry.status}</Badge> },
    ]}
    />
  </div>;
}
