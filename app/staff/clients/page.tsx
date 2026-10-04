// app/staff/clients/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import { deleteClient, updateClient, upsertClient, useClients } from "@/lib/clients-store";

export default function ClientsPage() {
  const clients = useClients();
  return (
    <DataTablePage
      title="Clients"
      description="Manage customer records and contact details."
      addLabel="Add client"
      emptyLabel="No clients yet."
      data={clients}
      onAdd={(v) =>
        upsertClient({
          name: v.name,
          email: v.email,
          phone: v.phone,
          company: v.company,
        })
      }
      onDelete={deleteClient}
      onUpdate={(id, v) => updateClient(id, { name: v.name, company: v.company, email: v.email, phone: v.phone })}
      fields={[
        { key: "name", label: "Name", placeholder: "Maria Santos" },
        {
          key: "company",
          label: "Company",
          placeholder: "Cebu Integrated Builders",
        },
        { key: "email", label: "Email", placeholder: "maria@example.com" },
        { key: "phone", label: "Phone", placeholder: "+63 917 000 1122" },
      ]}
      columns={[
        { key: "name", label: "Client" },
        { key: "company", label: "Company" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        {
          key: "status",
          label: "Status",
          render: (c) => (
            <Badge
              variant={c.status === "active" ? "secondary" : "destructive"}
              className="capitalize"
            >
              {c.status}
            </Badge>
          ),
        },
      ]}
    />
  );
}
