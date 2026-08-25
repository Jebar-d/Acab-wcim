// app/staff/checklist/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import {
  addChecklist,
  deleteChecklist,
  useChecklists,
} from "@/lib/checklists-store";

export default function ChecklistPage() {
  const checklists = useChecklists();
  return (
    <DataTablePage
      title="Checklist"
      description="Review the checks required before inventory moves forward."
      addLabel="Add checklist"
      emptyLabel="No checklists yet."
      data={checklists}
      onAdd={(v) => addChecklist({ title: v.title })}
      onDelete={deleteChecklist}
      fields={[
        {
          key: "title",
          label: "Title",
          placeholder: "Standard material review",
        },
      ]}
      columns={[
        { key: "title", label: "Checklist" },
        {
          key: "items",
          label: "Items complete",
          render: (c) =>
            `${c.items.filter((i) => i.completed).length}/${c.items.length}`,
        },
        {
          key: "status",
          label: "Status",
          render: (c) => (
            <Badge
              variant={
                c.status === "Ready for Confirmation" ? "secondary" : "outline"
              }
            >
              {c.status}
            </Badge>
          ),
        },
      ]}
    />
  );
}
