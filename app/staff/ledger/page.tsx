"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { addLedgerEntry, type LedgerEntry, useLedger } from "@/lib/ledger-store";

const TRANSACTION_TYPES = [
  { value: "Customer Payment", label: "Customer payment" },
  { value: "Other Income", label: "Other income" },
  { value: "Supplier Payment", label: "Supplier payment" },
  { value: "Operating Expense", label: "Operating expense" },
] as const;

type FormValues = {
  type: (typeof TRANSACTION_TYPES)[number]["value"];
  reference: string;
  description: string;
  amount: string;
  date: string;
  party: string;
  project: string;
};

const INITIAL_FORM: FormValues = {
  type: "Customer Payment",
  reference: "",
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  party: "",
  project: "",
};

function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function isMoneyIn(type: string) {
  return type === "Customer Payment" || type === "Other Income";
}

function entryType(entry: LedgerEntry) {
  // The PHP API currently exposes the ledger's source field; use it as a
  // fallback so transaction categories remain readable after a page reload.
  return entry.type || entry.source;
}

export default function LedgerPage() {
  const entries = useLedger();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormValues>(INITIAL_FORM);

  const sortedEntries = React.useMemo(() => {
    const chronological = [...entries].sort((a, b) =>
      a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );
    const withBalances = chronological.reduce<Array<(typeof chronological)[number] & { runningBalance: number }>>((rows, entry) => {
      const amount = Number(entry.amount) || 0;
      const previousBalance = rows.at(-1)?.runningBalance ?? 0;
      const runningBalance = previousBalance + (isMoneyIn(entryType(entry)) ? amount : -amount);
      return [...rows, { ...entry, runningBalance }];
    }, []);
    return [...withBalances].reverse();
  }, [entries]);

  const totals = React.useMemo(() => entries.reduce(
    (sum, entry) => {
      const amount = Number(entry.amount) || 0;
      if (isMoneyIn(entryType(entry))) sum.moneyIn += amount;
      else sum.moneyOut += amount;
      return sum;
    },
    { moneyIn: 0, moneyOut: 0 },
  ), [entries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await addLedgerEntry({
        source: form.type,
        type: form.type,
        reference: form.reference.trim() || `LED-${form.date.replaceAll("-", "")}-${Date.now().toString().slice(-5)}`,
        description: form.description.trim(),
        amount,
        date: form.date,
        party: form.party.trim(),
        project: form.project.trim(),
        status: "Posted",
        sourceId: "",
      });
      toast.success("Transaction added to the ledger.");
      setForm({ ...INITIAL_FORM, date: new Date().toISOString().slice(0, 10) });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Money in</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{money(totals.moneyIn)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Money out</CardDescription>
            <CardTitle className="text-2xl text-destructive">{money(totals.moneyOut)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net balance</CardDescription>
            <CardTitle className="text-2xl">{money(totals.moneyIn - totals.moneyOut)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Ledger</CardTitle>
            <CardDescription>Record customer payments, income, supplier payments, and operating expenses.</CardDescription>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button size="sm"><Plus className="size-4" />Record transaction</Button>} />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Record transaction</SheetTitle>
                <SheetDescription>Add a money in or money out entry to the ledger.</SheetDescription>
              </SheetHeader>
              <form id="ledger-transaction-form" onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-type">Transaction type</Label>
                  <select id="ledger-type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FormValues["type"] }))}>
                    {TRANSACTION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-amount">Amount (PHP)</Label>
                  <Input id="ledger-amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-date">Date</Label>
                  <Input id="ledger-date" type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-reference">Reference number</Label>
                  <Input id="ledger-reference" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Receipt, invoice, or voucher number" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-party">Customer / supplier</Label>
                  <Input id="ledger-party" value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} placeholder="Name (optional)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-project">Project</Label>
                  <Input id="ledger-project" value={form.project} onChange={(event) => setForm((current) => ({ ...current, project: event.target.value }))} placeholder="Project name (optional)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ledger-description">Description</Label>
                  <Input id="ledger-description" required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What was this transaction for?" />
                </div>
              </form>
              <SheetFooter className="flex-row justify-end gap-2">
                <SheetClose render={<Button variant="outline" disabled={saving}>Cancel</Button>} />
                <Button type="submit" form="ledger-transaction-form" disabled={saving}>{saving ? "Saving…" : "Save transaction"}</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No ledger entries yet. Record a transaction to start tracking money in and money out.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Customer / Party</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry) => <LedgerRow key={entry.id} entry={entry} />)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry & { runningBalance: number } }) {
  const moneyIn = isMoneyIn(entryType(entry));
  return (
    <TableRow>
      <TableCell>{entry.date}</TableCell>
      <TableCell className="font-medium">{entry.reference || "—"}</TableCell>
      <TableCell><span className="inline-flex items-center gap-1.5">{moneyIn ? <ArrowDownLeft className="size-4 text-emerald-600" /> : <ArrowUpRight className="size-4 text-destructive" />}{entryType(entry)}</span></TableCell>
      <TableCell>{entry.party || "—"}</TableCell>
      <TableCell>{entry.project || "—"}</TableCell>
      <TableCell>{entry.description}</TableCell>
      <TableCell className={`text-right font-medium ${moneyIn ? "text-emerald-600" : "text-destructive"}`}>{moneyIn ? "+" : "−"}{money(Number(entry.amount) || 0)}</TableCell>
      <TableCell className="text-right">{money(entry.runningBalance)}</TableCell>
      <TableCell><Badge variant={entry.status === "Posted" ? "secondary" : "outline"}>{entry.status}</Badge></TableCell>
    </TableRow>
  );
}
