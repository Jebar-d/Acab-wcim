// app/staff/ledger/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import {
  addLedgerEntry,
  deleteLedgerEntry,
  useLedger,
} from "@/lib/ledger-store";
import type { LedgerEntry } from "@/lib/ledger-store";

export default function LedgerPage() {
  const entries = useLedger();
  return (
    <DataTablePage
      title="Ledger"
      description="Review procurement transactions and balances."
      addLabel="Add entry"
      emptyLabel="No ledger entries yet."
      data={entries}
      onAdd={(v) =>
        addLedgerEntry({
          type: (v.type as LedgerEntry["type"]) || "Procurement",
          reference: v.reference,
          description: v.description,
          amount: Number(v.amount) || 0,
          date: v.date || new Date().toISOString().slice(0, 10),
          party: v.party,
          status: "Draft",
        })
      }
      onDelete={deleteLedgerEntry}
      fields={[
        { key: "reference", label: "Reference #", placeholder: "PO-1001" },
        {
          key: "type",
          label: "Type",
          placeholder: "Procurement / Inventory / Sale",
        },
        {
          key: "description",
          label: "Description",
          placeholder: "Cement purchase",
        },
        { key: "party", label: "Party", placeholder: "Cebu Steel & Rebar Co." },
        {
          key: "amount",
          label: "Amount",
          type: "number",
          placeholder: "15000",
        },
        { key: "date", label: "Date", type: "date" },
      ]}
      columns={[
        { key: "reference", label: "Reference" },
        { key: "type", label: "Type" },
        { key: "party", label: "Party" },
        {
          key: "amount",
          label: "Amount",
          render: (e) => `₱${e.amount.toLocaleString()}`,
        },
        {
          key: "status",
          label: "Status",
          render: (e) => (
            <Badge variant={e.status === "Posted" ? "secondary" : "outline"}>
              {e.status}
            </Badge>
          ),
        },
      ]}
    />
  );
}
