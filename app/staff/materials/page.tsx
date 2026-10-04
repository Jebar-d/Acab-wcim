// app/staff/materials/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";
import { DataTablePage } from "@/components/staff/data-table-page";
import { resolveApiAssetUrl } from "@/lib/db-client";
import {
  addMaterial,
  deleteMaterial,
  updateMaterial,
  useMaterials,
} from "@/lib/materials-store";

const STATUS_VARIANT = {
  Available: "secondary",
  Limited: "outline",
  Unavailable: "destructive",
} as const;

export default function MaterialsPage() {
  const materials = useMaterials();
  return (
    <DataTablePage
      title="Materials"
      description="Keep material records and available quantities up to date."
      addLabel="Add material"
      emptyLabel="No materials yet."
      data={materials}
      onAdd={(v) =>
        addMaterial({
          sku: v.sku,
          name: v.name,
          category: v.category,
          unit: v.unit,
          quantity: Number(v.quantity) || 0,
          minimumStock: Number(v.minimumStock) || 0,
          status: "Available",
          imageData: v.imageData,
        })
      }
      onDelete={deleteMaterial}
      onUpdate={(id, v) => updateMaterial(id, { sku: v.sku, name: v.name, category: v.category, unit: v.unit, quantity: Number(v.quantity)||0, minimumStock: Number(v.minimumStock)||0 }, v.imageData)}
      fields={[
        { key: "sku", label: "SKU", placeholder: "CEM-002" },
        { key: "name", label: "Name", placeholder: "White Cement" },
        { key: "category", label: "Category", placeholder: "Cement" },
        { key: "unit", label: "Unit", placeholder: "Bag" },
        {
          key: "quantity",
          label: "Quantity",
          type: "number",
          placeholder: "100",
        },
        {
          key: "minimumStock",
          label: "Minimum stock",
          type: "number",
          placeholder: "20",
        },
        { key: "imageData", label: "Product image", type: "image", previewKey: "imageUrl" },
      ]}
      columns={[
        { key: "imageUrl", label: "Image", render: (m) => <span className="relative flex size-12 items-center justify-center rounded-lg border text-muted-foreground">{m.imageUrl ? <><img src={resolveApiAssetUrl(m.imageUrl)} alt={m.name} onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.classList.remove("hidden"); }} className="absolute inset-0 size-full rounded-lg object-contain" /><ImageOff className="hidden size-4" aria-label="Image unavailable" /></> : <ImageOff className="size-4" aria-label="No image" />}</span> },
        { key: "sku", label: "SKU" },
        { key: "name", label: "Material" },
        { key: "category", label: "Category" },
        {
          key: "quantity",
          label: "Qty",
          render: (m) => `${m.quantity} ${m.unit}`,
        },
        {
          key: "status",
          label: "Status",
          render: (m) => (
            <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
          ),
        },
      ]}
    />
  );
}
