// app/(app)/suppliers/page.tsx (full file)
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, Plus, ShieldAlert } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useSession } from "@/lib/auth-store";
import {
  addSupplier,
  toggleSupplierStatus,
  useSuppliers,
  type Supplier,
} from "@/lib/suppliers-store";

const EMPTY_FORM = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  category: "",
};

export default function SuppliersPage() {
  const session = useSession();
  const isAdmin = session?.role === "admin";
  const suppliers = useSuppliers();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  function updateField(field: keyof typeof EMPTY_FORM) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supplier = addSupplier(form);
    setForm(EMPTY_FORM);
    setOpen(false);
    toast.success(`${supplier.name} added`);
  }

  function handleToggle(supplier: Supplier) {
    toggleSupplierStatus(supplier.id);
    toast(
      supplier.status === "active"
        ? `${supplier.name} deactivated`
        : `${supplier.name} reactivated`,
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-muted-foreground" />
            Admins only
          </CardTitle>
          <CardDescription>
            Sign in with an admin account to manage the supplier directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            render={<a href="/login">Go to sign in</a>}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>
            The master vendor list staff pull from when raising purchase orders.
          </CardDescription>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button size="sm">
                <Plus className="size-4" />
                Add supplier
              </Button>
            }
          />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add supplier</SheetTitle>
              <SheetDescription>
                New suppliers become available to staff immediately.
              </SheetDescription>
            </SheetHeader>

            <form
              id="add-supplier-form"
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-6"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="supplier-name">Company name</Label>
                <Input
                  id="supplier-name"
                  required
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder="Cebu Steel & Rebar Co."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="supplier-category">Category</Label>
                <Input
                  id="supplier-category"
                  required
                  value={form.category}
                  onChange={updateField("category")}
                  placeholder="Steel & Rebar"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="supplier-contact">Contact person</Label>
                <Input
                  id="supplier-contact"
                  required
                  value={form.contactName}
                  onChange={updateField("contactName")}
                  placeholder="Marites Uy"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="supplier-email">Email</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="marites@cebusteel.ph"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="supplier-phone">Phone</Label>
                <Input
                  id="supplier-phone"
                  required
                  value={form.phone}
                  onChange={updateField("phone")}
                  placeholder="+63 917 555 0142"
                />
              </div>
            </form>

            <SheetFooter className="flex-row justify-end gap-2">
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit" form="add-supplier-form">
                Add supplier
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardHeader>

      <CardContent>
        {suppliers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No suppliers yet — add the first one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{supplier.name}</p>
                        <Badge variant="outline" className="mt-0.5">
                          {supplier.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{supplier.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {supplier.email} · {supplier.phone}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        supplier.status === "active"
                          ? "secondary"
                          : "destructive"
                      }
                      className="capitalize"
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={supplier.status === "active"}
                      onCheckedChange={() => handleToggle(supplier)}
                      aria-label={`Toggle ${supplier.name} active status`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
