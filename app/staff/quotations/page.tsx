"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { CheckCircle2, ClipboardList, Package, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
import { useMaterials } from "@/lib/materials-store";
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
  const allRequests = [...quotations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const activeRequests = allRequests;

  async function handleConfirm(quotation: Quotation) {
    await confirmQuotation(quotation.id, {
      sendNotification: true,
    });

    if (quotation.accountId) {
      addNotification({
        audience: "user",
        accountId: quotation.accountId,
        title: "Quotation confirmed — confirm your order",
        body: `Your quotation for "${quotation.projectName}" was confirmed. Click this notification to review and confirm your order.`,
        href: `/order-confirmation/${quotation.id}`,
      });

      toast.success("Quotation confirmed and sent to the customer.");
    } else {
      toast.success("Quotation confirmed.");
    }

    router.push("/staff/orders");
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
          Requests submitted through the quotation form. Check inventory and the
          construction checklist before confirming.
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

          const contactDetails = [
            quotation.customerEmail,
            quotation.customerPhone,
          ].filter(Boolean).join(" • ") || "No email/phone recorded";

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
                    {quotation.customerName ?? "Customer"} · {quotation.projectType} · {quotation.location}
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
                  <span className="text-muted-foreground">Request details: </span>
                  {quotation.notes || contactDetails}
                </p>
              </div>

              {quotation.customerConfirmedAt && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  Customer confirmed the order.
                </div>
              )}

              {quotation.status === "confirmed" && !quotation.orderId && <Button size="sm" variant="outline" onClick={() => void handleCancel(quotation)} className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive">Cancel quotation</Button>}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href="/staff/checklist">
                      <ClipboardList className="size-4" />
                      Check checklist
                    </Link>
                  }
                />

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

                    <Button size="sm" onClick={() => handleConfirm(quotation)}>
                      <CheckCircle2 className="size-4" />
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
