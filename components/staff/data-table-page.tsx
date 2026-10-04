// components/staff/data-table-page.tsx
"use client";

import * as React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  defaultValue?: string;
  placeholder?: string;
};

export type ColumnConfig<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

/**
 * Generic editable table: a Card with an "Add" button that opens a Sheet
 * form (built from `fields`), and a Table listing `data` with an optional
 * delete action per row. Used across Sales/Inventory/Warehouse/Procurement
 * so each page only has to describe its own shape, not reimplement CRUD UI.
 */
export function DataTablePage<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  fields,
  onAdd,
  onDelete,
  onUpdate,
  emptyLabel = "No records yet.",
  addLabel = "Add",
  extra,
}: {
  title: string;
  description: string;
  data: T[];
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  onAdd: (values: Record<string, string>) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, values: Record<string, string>) => void;
  emptyLabel?: string;
  addLabel?: string;
  extra?: (row: T) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const emptyForm = React.useMemo(
    () => Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""])),
    [fields],
  );
  const [form, setForm] = React.useState<Record<string, string>>(emptyForm);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onAdd(form);
    setForm(emptyForm);
    setOpen(false);
  }

  function openEdit(row: T) {
    const values = Object.fromEntries(
      fields.map((field) => [field.key, String((row as Record<string, unknown>)[field.key] ?? "")]),
    );
    setForm(values);
    setEditing(row);
  }

  function handleEdit(event: React.FormEvent) {
    event.preventDefault();
    if (editing && onUpdate) onUpdate(editing.id, form);
    setEditing(null);
    setForm(emptyForm);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button size="sm">
                <Plus className="size-4" />
                {addLabel}
              </Button>
            }
          />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{addLabel}</SheetTitle>
              <SheetDescription>Fill in the details below.</SheetDescription>
            </SheetHeader>

            <form
              id="data-table-add-form"
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-6"
            >
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type ?? "text"}
                    required
                    value={form[field.key] ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </form>

            <SheetFooter className="flex-row justify-end gap-2">
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit" form="data-table-add-form">
                {addLabel}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
                {(onDelete || onUpdate || extra) && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as unknown as Record<string, unknown>)[
                              col.key
                            ] ?? "—",
                          )}
                    </TableCell>
                  ))}
                  {(onDelete || onUpdate || extra) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {extra?.(row)}
                        {onUpdate && (
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                            <Edit3 className="size-4" />
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <AlertDialog open={deleteId === row.id} onOpenChange={(open) => setDeleteId(open ? row.id : null)}>
                            <AlertDialogTrigger render={
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            } />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action permanently removes the record. Admin and staff notification records will also be created.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { onDelete(row.id); setDeleteId(null); }}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit record</SheetTitle>
            <SheetDescription>Update the selected record and save the changes to the database.</SheetDescription>
          </SheetHeader>
          <form id="data-table-edit-form" onSubmit={handleEdit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                <Input id={`edit-${field.key}`} type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))} placeholder={field.placeholder} />
              </div>
            ))}
          </form>
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="data-table-edit-form">Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </Card>
  );
}
