"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Loader2,
  Package,
  Pencil,
  Save,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ensureChecklistForQuotation,
  isChecklistDone,
  resetChecklistForQuotation,
  useChecklists,
} from "@/lib/checklists-store";
import { useMaterials } from "@/lib/materials-store";
import { addNotification } from "@/lib/notifications-store";

import {
  confirmQuotation,
  updateQuotation,
  useQuotations,
  type Quotation,
} from "@/lib/quotations-store";
import { parseQuotationItems } from "@/lib/quotations-store";
import { resolveApiAssetUrl } from "@/lib/db-client";
import { ImageOff } from "lucide-react";
import { useSession } from "@/lib/auth-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: Quotation["status"] }) {
  const variant =
    status === "confirmed"
      ? "secondary"
      : status === "rejected"
        ? "destructive"
        : "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status.replace("-", " ")}
    </Badge>
  );
}

export default function QuotationsPage() {
  const router = useRouter();
  const quotations = useQuotations();
  const materials = useMaterials();
  const session = useSession();
  const checklists = useChecklists();
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [quoteEdits, setQuoteEdits] = React.useState<
    Record<string, Partial<Pick<Quotation, "projectName" | "projectType" | "location" | "materials" | "quantity" | "timeline" | "notes">>>
  >({});
  const allRequests = [...quotations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const activeRequests = allRequests;

  // Creates the checklist for this quotation the first time, then opens it.
  async function handleOpenChecklist(quotation: Quotation) {
    setOpeningId(quotation.id);
    try {
      await ensureChecklistForQuotation(quotation, materials);
      router.push(
        `/staff/checklist?quotation=${encodeURIComponent(quotation.id)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the checklist.",
      );
      setOpeningId(null);
    }
  }

  async function handleConfirm(quotation: Quotation) {
    if (quotation.checklistStatus !== "Ready for Confirmation") {
      toast.error(
        "Complete and confirm the checklist before confirming this quotation.",
      );
      return;
  }
    await confirmQuotation(quotation.id, {
      sendNotification: true,
    });

    if (quotation.accountId) {
      addNotification({
        audience: "user",
        accountId: quotation.accountId,
        title: "Quotation ready for your approval",
        body: `Your quotation for "${quotation.projectName}" is ready. Review the details and confirm it to place your order, or request changes.`,
        href: `/order-confirmation/${quotation.id}`,
      });

      toast.success("Quotation sent to the customer for approval.");
    } else {
      toast.success("Quotation marked ready for customer approval.");
    }
  }

  async function handleSaveEdits(quotation: Quotation) {
    const patch = quoteEdits[quotation.id] ?? {};
    const revisedQuotation = { ...quotation, ...patch };
    try {
      await updateQuotation(quotation.id, {
        ...patch,
        status: "reviewing",
        checklistStatus: "Pending Review",
        confirmedAt: null,
        confirmationSentAt: null,
        customerConfirmedAt: null,
      });
      await resetChecklistForQuotation(revisedQuotation, materials);
      setEditingId(null);
      toast.success("Quotation changes saved. Review the checklist before confirming again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save quotation changes.");
    }
  }

  function editValue(quotation: Quotation, key: "projectName" | "projectType" | "location" | "materials" | "quantity" | "timeline" | "notes") {
    return quoteEdits[quotation.id]?.[key] ?? quotation[key] ?? "";
  }

  function handleReject(quotation: Quotation) {
    updateQuotation(quotation.id, {
      status: "rejected",
      checklistStatus: "Rejected",
    });

    if (quotation.accountId) {
      addNotification({
        audience: "user",
        accountId: quotation.accountId,
        title: "Your quotation was declined",
        body: `Your request for "${quotation.projectName}" could not be confirmed. Please contact us for details.`,
      });
    }

    toast("Quotation rejected.");
  }

  async function handleCancel(quotation: Quotation) {
    if (!window.confirm(`Cancel quotation for ${quotation.projectName}?`)) return;
    try {
      await updateQuotation(quotation.id, { status: "cancelled", cancelledAt: new Date().toISOString(), cancelledBy: session?.id });
      if (quotation.accountId) addNotification({ audience: "user", accountId: quotation.accountId, title: "Quotation cancelled", body: `Staff cancelled quotation #${quotation.id.slice(0, 8)} for ${quotation.projectName}.`, href: "/profile" });
      toast.success("Quotation cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this quotation.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotations</CardTitle>
        <CardDescription>
          Review requests, update quotation details when needed, then confirm
          the final version for customer approval.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {activeRequests.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quotation requests yet.
          </p>
        )}

        {activeRequests.map((quotation) => {
          const isDecided = ["confirmed", "rejected", "cancelled", "expired"].includes(quotation.status);

          const checklist = checklists.find(
            (c) => c.quotationId === quotation.id,
          );
          const checklistDone =
            quotation.checklistStatus === "Ready for Confirmation";
          const checked =
            checklist?.items.filter((item) => item.completed).length ?? 0;
          const totalChecks = checklist?.items.length ?? 0;
          const checklistLabel =
            quotation.status === "confirmed"
              ? "Confirmed"
              : quotation.status === "rejected"
                ? "Rejected"
                : checklistDone ||
                    (checklist && isChecklistDone(checklist.status))
                  ? "Done — ready to confirm"
                  : checklist
                    ? `In progress (${checked}/${totalChecks})`
                    : "Not started";

          const contactDetails =
            [quotation.customerEmail, quotation.customerPhone]
              .filter(Boolean)
              .join(" • ") || "No email/phone recorded";

          return (
            <div
              key={quotation.id}
              className="flex flex-col gap-4 rounded-3xl border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{quotation.projectName}</p>
                    <StatusBadge status={quotation.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quotation.customerName ?? "Customer"} ·{" "}
                    {quotation.projectType} · {quotation.location}
                  </p>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <p>Request ID: {quotation.id.slice(0, 8)}</p>
                  <p>Submitted {formatDate(quotation.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm lg:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Customer name: </span>
                  {quotation.customerName ?? "Not provided"}
                </p>
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  {quotation.customerEmail ?? "Not provided"}
                </p>
                <p>
                  <span className="text-muted-foreground">Contact: </span>
                  {quotation.customerPhone ?? "Not provided"}
                </p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  {quotation.status}
                </p>
                <div className="lg:col-span-2">
                  <span className="text-muted-foreground">Materials: </span>
                  {parseQuotationItems(quotation.materials).length ? <ul className="mt-2 space-y-2">{parseQuotationItems(quotation.materials).map((item)=>{const imageUrl=item.imageUrl ?? materials.find((material)=>material.id===item.materialId)?.imageUrl;return <li key={item.materialId} className="flex items-center gap-3"><span className="relative flex size-10 shrink-0 items-center justify-center rounded-md border text-muted-foreground">{imageUrl ? <img src={resolveApiAssetUrl(imageUrl)} alt={item.materialName} className="absolute inset-0 size-full rounded-md object-contain" onError={(event)=>{event.currentTarget.style.display="none";}} /> : <ImageOff className="size-4" aria-label="No image" />}</span><span>{item.materialName} · {item.quantity} {item.unit}{item.size?` · ${item.size}`:""}{item.brand?` · ${item.brand}`:""}</span></li>;})}</ul> : quotation.materials}
                </div>
                <p>
                  <span className="text-muted-foreground">Quantity: </span>
                  {quotation.quantity}
                </p>
                <p>
                  <span className="text-muted-foreground">Timeline: </span>
                  {quotation.timeline}
                </p>
                {quotation.expiresAt && <p><span className="text-muted-foreground">Valid until: </span>{formatDate(quotation.expiresAt)}</p>}
                <p className="lg:col-span-2">
                  <span className="text-muted-foreground">
                    Request details:{" "}
                  </span>
                  {quotation.notes || contactDetails}
                </p>
                {quotation.customerChangeRequest && (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 lg:col-span-2">
                    <span className="font-medium">Customer requested changes: </span>
                    {quotation.customerChangeRequest}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={checklistDone ? "secondary" : "outline"}>
                  Checklist: {checklistLabel}
                </Badge>
                {quotation.inventoryStatus && (
                  <Badge
                    variant={
                      quotation.inventoryStatus === "Available"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    Inventory: {quotation.inventoryStatus}
                  </Badge>
                )}
              </div>

              {quotation.customerConfirmedAt && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  Customer confirmed the order.
                </div>
              )}

              {quotation.status === "confirmed" && !quotation.orderId && <Button size="sm" variant="outline" onClick={() => void handleCancel(quotation)} className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive">Cancel quotation</Button>}

              <div className="flex flex-wrap items-center gap-2">
                {!isDecided && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(editingId === quotation.id ? null : quotation.id)}
                  >
                    <Pencil className="size-4" />
                    {editingId === quotation.id ? "Close editor" : "Edit quotation"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={openingId === quotation.id}
                  onClick={() => handleOpenChecklist(quotation)}
                >
                  {openingId === quotation.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : checklistDone ? (
                    <ClipboardCheck className="size-4" />
                  ) : (
                    <ClipboardList className="size-4" />
                  )}
                  {checklist ? "Open checklist" : "Create checklist"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href="/staff/materials">
                      <Package className="size-4" />
                      Check inventory
                    </Link>
                  }
                />

                {!isDecided && (
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void handleCancel(quotation)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">Cancel quotation</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(quotation)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      disabled={!checklistDone}
                      onClick={() => handleConfirm(quotation)}
                    >
                      <CheckCircle2 className="size-4" />
                      Confirm
                    </Button>
                  </div>
                )}
              </div>

              {editingId === quotation.id && (
                <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2">
                  {([
                    ["projectName", "Project name"],
                    ["projectType", "Project type"],
                    ["location", "Location"],
                    ["materials", "Materials"],
                    ["quantity", "Quantity"],
                    ["timeline", "Required timeline"],
                    ["notes", "Quotation notes"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="grid gap-1 text-xs font-medium">
                      {label}
                      {key === "notes" || key === "materials" ? (
                        <textarea
                          className="min-h-20 rounded-xl border border-input bg-background p-2 text-sm font-normal"
                          value={editValue(quotation, key)}
                          onChange={(event) =>
                            setQuoteEdits((current) => ({
                              ...current,
                              [quotation.id]: {
                                ...current[quotation.id],
                                [key]: event.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        <input
                          className="h-9 rounded-xl border border-input bg-background px-3 text-sm font-normal"
                          value={editValue(quotation, key)}
                          onChange={(event) =>
                            setQuoteEdits((current) => ({
                              ...current,
                              [quotation.id]: {
                                ...current[quotation.id],
                                [key]: event.target.value,
                              },
                            }))
                          }
                        />
                      )}
                    </label>
                  ))}
                  <div className="flex justify-end sm:col-span-2">
                    <Button size="sm" onClick={() => void handleSaveEdits(quotation)}>
                      <Save className="size-4" />
                      Save changes and review again
                    </Button>
                  </div>
                </div>
              )}

              {!isDecided && !checklistDone && (
                <p className="text-xs text-muted-foreground">
                  Confirm unlocks once the checklist for this quotation is
                  completed and confirmed.
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
