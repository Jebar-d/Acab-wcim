// components/staff/data-table-page.tsx
"use client";

import * as React from "react";
import { Edit3, ImagePlus, Plus, Trash2, X } from "lucide-react";

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
import { resolveApiAssetUrl } from "@/lib/db-client";
import { toast } from "sonner";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "image";
  defaultValue?: string;
  placeholder?: string;
  previewKey?: string;
};

function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false);
  if (!failed) return <img src={src} alt="Material image preview" className="h-full w-full object-contain" onError={() => setFailed(true)} />;
  return <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="size-6" />Image preview unavailable</div>;
}

function ImageField({ value, currentImageUrl, onChange, onReadingChange }: { value: string; currentImageUrl?: string; onChange: (value: string) => void; onReadingChange: (reading: boolean) => void }) {
  const [readError, setReadError] = React.useState("");
  const preview = value.startsWith("data:image/") ? value : value === "__REMOVE_IMAGE__" ? "" : currentImageUrl ? resolveApiAssetUrl(currentImageUrl) : "";

  function selectFile(file?: File) {
    setReadError("");
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeByExtension: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const mime = file.type.toLowerCase() === "image/jpg" ? "image/jpeg" : ["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase()) ? file.type.toLowerCase() : mimeByExtension[extension ?? ""];
    if (!mime) { setReadError("Choose a JPG, JPEG, PNG, or WEBP image."); return; }
    if (file.size > 4 * 1024 * 1024) { setReadError("Image must be 4 MB or smaller."); return; }
    const reader = new FileReader();
    onReadingChange(true);
    reader.onload = () => { onReadingChange(false); if (typeof reader.result === "string") onChange(reader.result); else setReadError("Could not preview this image."); };
    reader.onerror = () => { onReadingChange(false); setReadError("Could not read this image file."); };
    reader.readAsDataURL(file.slice(0, file.size, mime));
  }

  return <div className="flex flex-col gap-3">
    <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30">
      {preview ? <ImagePreview key={preview} src={preview} /> : <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="size-6" />{value === "__REMOVE_IMAGE__" ? "Image will be removed" : "No image selected"}</div>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border px-3 text-sm font-medium hover:bg-muted">{preview ? "Change image" : "Choose image"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { selectFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
      {value === "__REMOVE_IMAGE__" && currentImageUrl ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>Keep current image</Button> : (preview || currentImageUrl) && <Button type="button" size="sm" variant="ghost" onClick={() => onChange(currentImageUrl && !value.startsWith("data:image/") ? "__REMOVE_IMAGE__" : "")}><X className="size-4" />Remove</Button>}
      <span className="text-xs text-muted-foreground">JPG, PNG, WEBP · up to 4 MB</span>
    </div>
    {readError && <p className="text-xs text-destructive">{readError}</p>}
  </div>;
}

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
  onAdd: (values: Record<string, string>) => unknown;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, values: Record<string, string>) => unknown;
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
  const [readingImage, setReadingImage] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readingImage) { toast.error("Wait for the image preview to finish before saving."); return; }
    try { await onAdd(form); setForm(emptyForm); setOpen(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save this record."); }
  }

  function openEdit(row: T) {
    const values = Object.fromEntries(
      fields.map((field) => [field.key, String((row as Record<string, unknown>)[field.key] ?? "")]),
    );
    setForm(values);
    setReadingImage(false);
    setEditing(row);
  }

  async function handleEdit(event: React.FormEvent) {
    event.preventDefault();
    if (readingImage) { toast.error("Wait for the image preview to finish before saving."); return; }
    try { if (editing && onUpdate) await onUpdate(editing.id, form); setEditing(null); setForm(emptyForm); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update this record."); }
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
                  {field.type === "image" ? <ImageField value={form[field.key] ?? ""} currentImageUrl={field.previewKey && editing ? String((editing as Record<string, unknown>)[field.previewKey] ?? "") : undefined} onChange={(value) => setForm((prev) => ({ ...prev, [field.key]: value }))} onReadingChange={setReadingImage} /> : <Input id={field.key} type={field.type ?? "text"} required value={form[field.key] ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))} placeholder={field.placeholder} />}
                </div>
              ))}
            </form>

            <SheetFooter className="flex-row justify-end gap-2">
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit" form="data-table-add-form" disabled={readingImage}>
                {readingImage ? "Preparing image…" : addLabel}
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
                {field.type === "image" ? <ImageField value={form[field.key] ?? ""} currentImageUrl={field.previewKey ? String((editing as unknown as Record<string, unknown> | null)?.[field.previewKey] ?? "") : undefined} onChange={(value) => setForm((prev) => ({ ...prev, [field.key]: value }))} onReadingChange={setReadingImage} /> : <Input id={`edit-${field.key}`} type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))} placeholder={field.placeholder} />}
              </div>
            ))}
          </form>
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="data-table-edit-form" disabled={readingImage}>{readingImage ? "Preparing image…" : "Save changes"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </Card>
  );
}
