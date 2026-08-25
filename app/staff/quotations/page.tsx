"use client";

import Link from "next/link";

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

import { useSession } from "@/lib/auth-store";

import { addNotification } from "@/lib/notifications-store";

import {
  confirmQuotation,
  updateQuotation,
  useQuotations,
  type Quotation,
} from "@/lib/quotations-store";

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
  const quotations = useQuotations();

  const session = useSession();

  function handleConfirm(quotation: Quotation) {
    confirmQuotation(quotation.id, {
      sendNotification: true,
    });

    if (quotation.accountId) {
      addNotification({
        audience: "user",

        accountId: quotation.accountId,

        title: "Quotation confirmed — confirm your order",

        body: `Your quotation for "${quotation.projectName}" was confirmed. Click this notification to review and confirm your order.`,

        /*
         * Customer notification now opens the confirmation page.
         */
        href: `/order-confirmation/${quotation.id}`,
      });

      toast.success("Quotation confirmed and sent to the customer.");
    } else {
      toast.success("Quotation confirmed.");
    }
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
        {quotations.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quotation requests yet.
          </p>
        )}

        {quotations.map((quotation) => {
          const isDecided =
            quotation.status === "confirmed" || quotation.status === "rejected";

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

                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(quotation.createdAt)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <p>
                  <span className="text-muted-foreground">Materials: </span>

                  {quotation.materials}
                </p>

                <p>
                  <span className="text-muted-foreground">Quantity: </span>

                  {quotation.quantity}
                </p>

                <p>
                  <span className="text-muted-foreground">Timeline: </span>

                  {quotation.timeline}
                </p>
              </div>

              {quotation.notes && (
                <p className="rounded-2xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  {quotation.notes}
                </p>
              )}

              {quotation.customerConfirmedAt && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  Customer confirmed the order.
                </div>
              )}

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
