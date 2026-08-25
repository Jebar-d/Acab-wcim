// app/staff/categories/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import {
  addCategory,
  deleteCategory,
  useCategories,
} from "@/lib/categories-store";

export default function CategoriesPage() {
  const categories = useCategories();
  return (
    <DataTablePage
      title="Categories"
      description="Organize materials into clear inventory categories."
      addLabel="Add category"
      emptyLabel="No categories yet."
      data={categories}
      onAdd={(v) => addCategory({ name: v.name, description: v.description })}
      onDelete={deleteCategory}
      fields={[
        { key: "name", label: "Name", placeholder: "Plumbing" },
        {
          key: "description",
          label: "Description",
          placeholder: "Pipes and fittings",
        },
      ]}
      columns={[
        { key: "name", label: "Category" },
        { key: "description", label: "Description" },
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
