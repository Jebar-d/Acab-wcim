"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { addLedgerEntry, deleteLedgerEntry, type LedgerEntry, updateLedgerEntry, useLedger } from "@/lib/ledger-store";
import { useOrders } from "@/lib/orders-store";
import { usePurchaseOrders } from "@/lib/purchase-orders-store";

const TRANSACTION_TYPES = [
  { value: "Customer Payment", label: "Customer payment" },
  { value: "Other Income", label: "Other income" },
  { value: "Supplier Payment", label: "Supplier payment" },
  { value: "Operating Expense", label: "Operating expense" },
] as const;

type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];
type FormValues = {
  type: TransactionType;
  reference: string;
  description: string;
  amount: string;
  date: string;
  party: string;
  project: string;
  status: "Posted" | "Draft";
  sourceId: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const newForm = (): FormValues => ({
  type: "Customer Payment",
  reference: "",
  description: "",
  amount: "",
  date: today(),
  party: "",
  project: "",
  status: "Posted",
  sourceId: "",
});

function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function isMoneyIn(type: string) {
  return type === "Customer Payment" || type === "Other Income";
}

function entryType(entry: LedgerEntry) {
  return entry.type || entry.source;
}

function paidAgainst(entries: LedgerEntry[], type: TransactionType, sourceId: string, excludeId?: string) {
  return entries.reduce((total, entry) => {
    if (entry.id === excludeId || entry.status !== "Posted" || entry.sourceId !== sourceId || entryType(entry) !== type) return total;
    return total + (Number(entry.amount) || 0);
  }, 0);
}

function outstanding(total: number, entries: LedgerEntry[], type: TransactionType, sourceId: string, excludeId?: string) {
  return Math.max(0, Math.round((total - paidAgainst(entries, type, sourceId, excludeId)) * 100) / 100);
}

export default function LedgerPage() {
  const entries = useLedger();
  const orders = useOrders();
  const purchaseOrders = usePurchaseOrders();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormValues>(newForm);

  const sortedEntries = React.useMemo(() => {
    const chronological = [...entries].sort((a, b) =>
      a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );
    let balance = 0;
    const withBalances = chronological.map((entry) => {
      const amount = Number(entry.amount) || 0;
      if (entry.status === "Posted") balance += isMoneyIn(entryType(entry)) ? amount : -amount;
      return { ...entry, runningBalance: balance };
    });
    return withBalances.reverse();
  }, [entries]);

  const totals = React.useMemo(() => entries.reduce(
    (sum, entry) => {
      if (entry.status !== "Posted") return sum;
      const amount = Number(entry.amount) || 0;
      if (isMoneyIn(entryType(entry))) sum.moneyIn += amount;
      else sum.moneyOut += amount;
      return sum;
    },
    { moneyIn: 0, moneyOut: 0 },
  ), [entries]);

  const availableOrders = orders.filter((order) =>
    order.status !== "Cancelled" && (outstanding(Number(order.totalAmount) || 0, entries, "Customer Payment", order.id, editingId) > 0 || form.sourceId === order.id),
  );
  const availablePurchaseOrders = purchaseOrders.filter((order) =>
    order.status !== "Cancelled" && (outstanding(Number(order.totalAmount) || 0, entries, "Supplier Payment", order.id, editingId) > 0 || form.sourceId === order.id),
  );

  function startNewEntry() {
    setEditingId(null);
    setForm(newForm());
    setOpen(true);
  }

  function startEditing(entry: LedgerEntry) {
    const type = entryType(entry) as TransactionType;
    setEditingId(entry.id);
    setForm({
      type: TRANSACTION_TYPES.some((option) => option.value === type) ? type : "Other Income",
      reference: entry.reference || "",
      description: entry.description || "",
      amount: String(entry.amount ?? ""),
      date: (entry.date || today()).slice(0, 10),
      party: entry.party || "",
      project: entry.project || "",
      status: entry.status === "Draft" ? "Draft" : "Posted",
      sourceId: entry.sourceId || "",
    });
    setOpen(true);
  }

  function changeType(type: TransactionType) {
    setForm((current) => ({ ...current, type, sourceId: "", reference: "", description: "", amount: "", party: "", project: "" }));
  }

  function chooseOrder(orderId: string) {
    const order = orders.find((candidate) => candidate.id === orderId);
    if (!order) {
      setForm((current) => ({ ...current, sourceId: "" }));
      return;
    }
    const amountDue = outstanding(Number(order.totalAmount) || 0, entries, "Customer Payment", order.id, editingId);
    setForm((current) => ({
      ...current,
      sourceId: order.id,
      reference: order.orderNo || order.id,
      party: order.clientName || "",
      project: order.projectName || "",
      amount: amountDue ? String(amountDue) : current.amount,
      description: `Payment for ${order.orderNo || order.id}${order.projectName ? ` · ${order.projectName}` : ""}`,
    }));
  }

  function choosePurchaseOrder(orderId: string) {
    const order = purchaseOrders.find((candidate) => candidate.id === orderId);
    if (!order) {
      setForm((current) => ({ ...current, sourceId: "" }));
      return;
    }
    const amountDue = outstanding(Number(order.totalAmount) || 0, entries, "Supplier Payment", order.id, editingId);
    setForm((current) => ({
      ...current,
      sourceId: order.id,
      reference: order.poNumber || order.id,
      party: order.supplierName || "",
      project: "",
      amount: amountDue ? String(amountDue) : current.amount,
      description: `Payment for purchase order ${order.poNumber || order.id} · ${order.material}`,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (form.type === "Customer Payment" && form.sourceId && !orders.some((order) => order.id === form.sourceId)) {
      toast.error("Choose a valid customer order or clear the linked order.");
      return;
    }
    if (form.type === "Supplier Payment" && form.sourceId && !purchaseOrders.some((order) => order.id === form.sourceId)) {
      toast.error("Choose a valid purchase order or clear the linked purchase order.");
      return;
    }
    if (form.type === "Customer Payment" && form.sourceId) {
      const order = orders.find((candidate) => candidate.id === form.sourceId);
      const due = order ? outstanding(Number(order.totalAmount) || 0, entries, form.type, order.id, editingId) : 0;
      if (amount > due + 0.009) {
        toast.error(`This payment is higher than the linked order's remaining balance of ${money(due)}.`);
        return;
      }
    }
    if (form.type === "Supplier Payment" && form.sourceId) {
      const order = purchaseOrders.find((candidate) => candidate.id === form.sourceId);
      const due = order ? outstanding(Number(order.totalAmount) || 0, entries, form.type, order.id, editingId) : 0;
      if (amount > due + 0.009) {
        toast.error(`This payment is higher than the linked purchase order's remaining balance of ${money(due)}.`);
        return;
      }
    }

    const source = form.type === "Customer Payment" && form.sourceId
      ? "Customer Order"
      : form.type === "Supplier Payment" && form.sourceId
        ? "Purchase Order"
        : form.type;
    const values = {
      source,
      type: form.type,
      reference: form.reference.trim(),
      description: form.description.trim(),
      amount: Math.round(amount * 100) / 100,
      date: form.date,
      party: form.party.trim(),
      project: form.project.trim(),
      status: form.status,
      sourceId: form.sourceId,
    } as const;

    setSaving(true);
    try {
      if (editingId) {
        const saved = await updateLedgerEntry(editingId, values);
        if (!saved) throw new Error("Ledger entry was not found. Refresh the page and try again.");
        toast.success("Ledger entry updated.");
      } else {
        await addLedgerEntry(values);
        toast.success("Transaction added to the ledger.");
      }
      setForm(newForm());
      setEditingId(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: LedgerEntry) {
    if (!window.confirm(`Delete the ${entryType(entry).toLowerCase()} entry ${entry.reference ? `(${entry.reference})` : ""}?`)) return;
    try {
      await deleteLedgerEntry(entry.id);
      toast.success("Ledger entry deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this ledger entry.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Money in · posted</CardDescription><CardTitle className="text-2xl text-emerald-600">{money(totals.moneyIn)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Money out · posted</CardDescription><CardTitle className="text-2xl text-destructive">{money(totals.moneyOut)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Net balance · posted</CardDescription><CardTitle className="text-2xl">{money(totals.moneyIn - totals.moneyOut)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Ledger</CardTitle>
            <CardDescription>Link customer and supplier payments to their order records. Other income and expenses can be entered directly.</CardDescription>
          </div>
          <Button size="sm" onClick={startNewEntry}><Plus className="size-4" />Record transaction</Button>
          <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (!next && !saving) { setEditingId(null); setForm(newForm()); } }}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{editingId ? "Edit ledger entry" : "Record transaction"}</SheetTitle>
                <SheetDescription>Order links fill in the party, reference, and outstanding amount. Change the amount for a partial payment. Only post an entry after money has actually moved.</SheetDescription>
              </SheetHeader>
              <form id="ledger-transaction-form" onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-type">Transaction type</Label>
                  <select id="ledger-type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => changeType(event.target.value as TransactionType)}>
                    {TRANSACTION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                {form.type === "Customer Payment" && <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-customer-order">Link customer order (optional)</Label>
                  <select id="ledger-customer-order" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.sourceId} onChange={(event) => chooseOrder(event.target.value)}>
                    <option value="">No order link</option>
                    {availableOrders.map((order) => {
                      const due = outstanding(Number(order.totalAmount) || 0, entries, "Customer Payment", order.id, editingId);
                      return <option key={order.id} value={order.id}>{order.orderNo || order.id} · {order.clientName} · due {money(due)}</option>;
                    })}
                  </select>
                </div>}

                {form.type === "Supplier Payment" && <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-supplier-order">Link purchase order (optional)</Label>
                  <select id="ledger-supplier-order" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.sourceId} onChange={(event) => choosePurchaseOrder(event.target.value)}>
                    <option value="">No purchase order link</option>
                    {availablePurchaseOrders.map((order) => {
                      const due = outstanding(Number(order.totalAmount) || 0, entries, "Supplier Payment", order.id, editingId);
                      return <option key={order.id} value={order.id}>{order.poNumber || order.id} · {order.supplierName} · due {money(due)}</option>;
                    })}
                  </select>
                </div>}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-amount">Amount (PHP)</Label>
                  <Input id="ledger-amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-date">Date</Label>
                  <Input id="ledger-date" type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-reference">Receipt / invoice / voucher reference</Label>
                  <Input id="ledger-reference" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Reference number" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-party">Customer / supplier / source</Label>
                  <Input id="ledger-party" value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} placeholder="Name or income source" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-project">Project</Label>
                  <Input id="ledger-project" value={form.project} onChange={(event) => setForm((current) => ({ ...current, project: event.target.value }))} placeholder="Project name (optional)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-description">Description</Label>
                  <Input id="ledger-description" required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What was this transaction for?" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-status">Entry status</Label>
                  <select id="ledger-status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FormValues["status"] }))}>
                    <option value="Posted">Posted</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </form>
              <SheetFooter className="flex-row justify-end gap-2">
                <SheetClose render={<Button variant="outline" disabled={saving}>Cancel</Button>} />
                <Button type="submit" form="ledger-transaction-form" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Save transaction"}</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No ledger entries yet. Record a payment, income, or expense to start tracking money in and money out.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Transaction</TableHead><TableHead>Customer / Party</TableHead><TableHead>Project</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Running balance</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sortedEntries.map((entry) => <LedgerRow key={entry.id} entry={entry} onEdit={() => startEditing(entry)} onDelete={() => void handleDelete(entry)} />)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LedgerRow({ entry, onEdit, onDelete }: { entry: LedgerEntry & { runningBalance: number }; onEdit: () => void; onDelete: () => void }) {
  const moneyIn = isMoneyIn(entryType(entry));
  return (
    <TableRow>
      <TableCell>{entry.date.slice(0, 10)}</TableCell>
      <TableCell className="font-medium">{entry.reference || "—"}</TableCell>
      <TableCell><span className="inline-flex items-center gap-1.5">{moneyIn ? <ArrowDownLeft className="size-4 text-emerald-600" /> : <ArrowUpRight className="size-4 text-destructive" />}{entryType(entry)}</span></TableCell>
      <TableCell>{entry.party || "—"}</TableCell>
      <TableCell>{entry.project || "—"}</TableCell>
      <TableCell>{entry.description}</TableCell>
      <TableCell className={`text-right font-medium ${moneyIn ? "text-emerald-600" : "text-destructive"}`}>{moneyIn ? "+" : "−"}{money(Number(entry.amount) || 0)}</TableCell>
      <TableCell className="text-right">{money(entry.runningBalance)}</TableCell>
      <TableCell><Badge variant={entry.status === "Posted" ? "secondary" : "outline"}>{entry.status}</Badge></TableCell>
      <TableCell><div className="flex items-center justify-end gap-1"><Button type="button" size="sm" variant="outline" onClick={onEdit}><Pencil className="size-3.5" />Edit</Button><Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-3.5" /><span className="sr-only">Delete</span></Button></div></TableCell>
    </TableRow>
  );
}
