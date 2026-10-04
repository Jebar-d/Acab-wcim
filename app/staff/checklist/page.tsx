"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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

import {
  addChecklist,
  checkStock,
  confirmChecklist,
  deleteChecklist,
  ensureChecklistForQuotation,
  isChecklistDone,
  reopenChecklist,
  toggleChecklistItem,
  useChecklists,
  type Checklist,
  type ChecklistItem,
  type StockState,
} from "@/lib/checklists-store";
import { useMaterials, type Material } from "@/lib/materials-store";
import { useQuotations } from "@/lib/quotations-store";

const STOCK_LABEL: Record<StockState, string> = {
  ok: "In stock",
  low: "Low stock",
  short: "Not enough stock",
  missing: "Not in inventory",
};

function ChecklistCard({
  checklist,
  materials,
  projectName,
  quotationQuantity,
  focused,
}: {
  checklist: Checklist;
  materials: Material[];
  projectName?: string;
  quotationQuantity?: string;
  focused: boolean;
}) {
  const [confirming, setConfirming] = React.useState(false);

  const done = isChecklistDone(checklist.status);
  const completed = checklist.items.filter((item) => item.completed).length;
  const total = checklist.items.length;
  const allChecked = total > 0 && completed === total;

  const materialItems = checklist.items.filter(
    (item) => item.kind === "material",
  );
  const otherItems = checklist.items.filter((item) => item.kind !== "material");

  const stock = new Map(
    materialItems.map((item) => [item.id, checkStock(item, materials)]),
  );
  const problems = materialItems.filter((item) => {
    const state = stock.get(item.id)?.state;
    return state === "short" || state === "missing";
  }).length;
  const lowCount = materialItems.filter(
    (item) => stock.get(item.id)?.state === "low",
  ).length;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmChecklist(checklist.id);
      toast.success(
        checklist.quotationId
          ? "Checklist done. The quotation is ready to confirm."
          : "Checklist done.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not confirm the checklist.",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleReopen() {
    try {
      await reopenChecklist(checklist.id);
      toast("Checklist reopened.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reopen it.",
      );
    }
  }

  async function handleDelete() {
    if (
      checklist.quotationId &&
      !window.confirm(
        "Delete this checklist? The quotation will go back to waiting for a checklist.",
      )
    ) {
      return;
    }
    try {
      await deleteChecklist(checklist.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete it.",
      );
    }
  }

  function renderRow(item: ChecklistItem) {
    const check = item.kind === "material" ? stock.get(item.id) : undefined;
    return (
      <button
        key={item.id}
        type="button"
        disabled={done}
        onClick={() => toggleChecklistItem(checklist.id, item.id)}
        className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-muted/50 disabled:cursor-default disabled:hover:bg-transparent"
      >
        {item.completed ? (
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
        ) : (
          <Circle className="size-5 shrink-0 text-muted-foreground" />
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={
              item.completed ? "text-muted-foreground line-through" : ""
            }
          >
            {item.kind === "material"
              ? (item.materialName ?? item.text)
              : item.text}
          </span>
          {check && (
            <span className="text-xs text-muted-foreground">
              {item.requested ? `Requested: ${item.requested} · ` : ""}
              {check.material
                ? `On hand: ${check.onHand} ${check.material.unit} (${check.material.name})`
                : "No matching item in the inventory list"}
            </span>
          )}
        </span>

        {check && (
          <Badge
            variant={
              check.state === "ok"
                ? "secondary"
                : check.state === "low"
                  ? "outline"
                  : "destructive"
            }
            className="shrink-0"
          >
            {STOCK_LABEL[check.state]}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <Card className={focused ? "ring-2 ring-primary/40" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{checklist.title}</CardTitle>

            <Badge variant={done || allChecked ? "secondary" : "outline"}>
              {done ? "Done" : checklist.status}
            </Badge>
          </div>

          <CardDescription className="mt-2">
            {completed} of {total} checks completed
            {quotationQuantity
              ? ` · Quotation quantity: ${quotationQuantity}`
              : ""}
          </CardDescription>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
          aria-label="Delete checklist"
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {materialItems.length > 0 && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Package className="size-4" />
                Materials in this quotation
              </p>
              <Button
                size="xs"
                variant="ghost"
                render={<Link href="/staff/materials">Open inventory</Link>}
              />
            </div>
            {materialItems.map(renderRow)}
          </div>
        )}

        {otherItems.length > 0 && (
          <div className="grid gap-2">
            {materialItems.length > 0 && (
              <p className="text-sm font-medium">General checks</p>
            )}
            {otherItems.map(renderRow)}
          </div>
        )}

        {!done && (problems > 0 || lowCount > 0) && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              {problems > 0
                ? `${problems} material${problems > 1 ? "s are" : " is"} not available in the requested amount.`
                : `${lowCount} material${lowCount > 1 ? "s are" : " is"} running low.`}{" "}
              You can still confirm once you have arranged supplier stock.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {done ? (
            <>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                Checklist done
                {checklist.quotationId
                  ? " — quotation is ready to confirm."
                  : "."}
              </p>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleReopen}>
                  <RotateCcw className="size-4" />
                  Reopen
                </Button>
                {checklist.quotationId && (
                  <Button
                    size="sm"
                    render={
                      <Link href="/staff/quotations">
                        <ArrowLeft className="size-4" />
                        Back to quotations
                      </Link>
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {allChecked
                  ? "All checks are complete."
                  : `${total - completed} check${total - completed === 1 ? "" : "s"} left before you can confirm.`}
              </p>
              <Button
                className="ml-auto"
                size="sm"
                disabled={!allChecked || confirming}
                onClick={handleConfirm}
              >
                {confirming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Confirm checklist
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistView() {
  const params = useSearchParams();
  const quotationId = params.get("quotation");

  const checklists = useChecklists();
  const materials = useMaterials();
  const quotations = useQuotations();

  const [title, setTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const quotation = quotationId
    ? quotations.find((q) => q.id === quotationId)
    : undefined;

  const visible = quotationId
    ? checklists.filter((c) => c.quotationId === quotationId)
    : checklists;

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    addChecklist({ title: title.trim() || "Construction Material Review" });
    setTitle("");
  }

  async function handleCreateForQuotation() {
    if (!quotation) return;
    setCreating(true);
    try {
      await ensureChecklistForQuotation(quotation, materials);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the checklist.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {quotationId ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Checklist for {quotation?.projectName ?? "quotation"}
            </CardTitle>
            <CardDescription>
              {quotation
                ? `${quotation.customerName ?? "Customer"} · ${quotation.materials} · ${quotation.quantity}`
                : "Loading quotation…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              render={
                <Link href="/staff/quotations">
                  <ArrowLeft className="size-4" />
                  Back to quotations
                </Link>
              }
            />
            <Button
              size="sm"
              variant="ghost"
              render={<Link href="/staff/checklist">View all checklists</Link>}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Construction & Warehouse Checklist</CardTitle>

            <CardDescription>
              Checklists are created from a quotation (use the checklist button
              on the Quotations page) and check each requested material against
              inventory. You can also add a general checklist below.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleAdd}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Riverside Housing Material Review"
              />

              <Button type="submit">
                <Plus className="size-4" />
                Add checklist
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            {quotationId ? (
              quotation ? (
                <>
                  <p>No checklist exists for this quotation yet.</p>
                  <Button
                    size="sm"
                    disabled={creating}
                    onClick={handleCreateForQuotation}
                  >
                    {creating && <Loader2 className="size-4 animate-spin" />}
                    Create checklist
                  </Button>
                </>
              ) : (
                <p>Loading…</p>
              )
            ) : (
              <p>No checklists yet.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        visible.map((checklist) => {
          const linked = checklist.quotationId
            ? quotations.find((q) => q.id === checklist.quotationId)
            : undefined;
          return (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              materials={materials}
              projectName={linked?.projectName}
              quotationQuantity={linked?.quantity}
              focused={Boolean(quotationId)}
            />
          );
        })
      )}
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <React.Suspense fallback={null}>
      <ChecklistView />
    </React.Suspense>
  );
}
