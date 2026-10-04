"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePage } from "@/components/staff/data-table-page";
import { addSupplier, toggleSupplierStatus, updateSupplier, useSuppliers, type Supplier } from "@/lib/suppliers-store";

export function SuppliersPage() {
  const suppliers = useSuppliers();

  async function handleAdd(values: Record<string, string>) {
    const supplier = await addSupplier({
      name: values.name.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
    });
    toast.success(`${supplier.name} added.`);
  }

  async function handleToggle(supplier: Supplier) {
    try {
      const status = supplier.status === "active" ? "inactive" : "active";
      await toggleSupplierStatus(supplier.id, status);
      toast.success(`${supplier.name} ${status === "active" ? "reactivated" : "deactivated"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this supplier.");
    }
  }

  return (
    <DataTablePage
      title="Suppliers"
      description="Manage vendors available for purchase orders and stock receipts."
      addLabel="Add supplier"
      emptyLabel="No suppliers yet. Add a supplier to begin purchasing."
      data={suppliers}
      onAdd={handleAdd}
      onUpdate={(id, values) => updateSupplier(id, {
        name: values.name.trim(),
        contactName: values.contactName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
      })}
      fields={[
        { key: "name", label: "Company name", placeholder: "Cebu Steel & Rebar Co." },
        { key: "contactName", label: "Contact person", placeholder: "Marites Uy" },
        { key: "email", label: "Email", placeholder: "supplier@example.com" },
        { key: "phone", label: "Phone", placeholder: "+63 917 555 0142" },
        { key: "address", label: "Address", placeholder: "Supplier address" },
      ]}
      columns={[
        { key: "name", label: "Supplier" },
        { key: "contactName", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status", render: (supplier) => <Badge variant={supplier.status === "active" ? "secondary" : "outline"} className="capitalize">{supplier.status}</Badge> },
      ]}
      extra={(supplier) => <Button size="sm" variant="outline" onClick={() => void handleToggle(supplier)}>{supplier.status === "active" ? "Deactivate" : "Activate"}</Button>}
    />
  );
}
