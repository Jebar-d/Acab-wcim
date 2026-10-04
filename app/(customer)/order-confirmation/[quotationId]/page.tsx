"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ClipboardList, MapPin, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useSession } from "@/lib/auth-store";
import {
  confirmCustomerOrder,
  getQuotationById,
  useQuotations,
} from "@/lib/quotations-store";
import { createOrderFromQuotation } from "@/lib/orders-store";
import { addNotification } from "@/lib/notifications-store";
import { useAddresses } from "@/lib/addresses-store";
import { updateOrder } from "@/lib/orders-store";
import { addTransaction } from "@/lib/transactions-store";

export default function OrderConfirmationPage() {
  const params = useParams<{ quotationId: string }>();

  const session = useSession();

  // Subscribe to quotation changes so the page updates automatically.
  useQuotations();

  const quotationId = Array.isArray(params.quotationId)
    ? params.quotationId[0]
    : params.quotationId;

  const quotation = getQuotationById(quotationId);

  const addresses = useAddresses();
  const userAddresses = addresses.filter((address) => address.userId === session?.id);
  const [selectedAddress, setSelectedAddress] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState("Delivery");
  const [paymentMethod, setPaymentMethod] = React.useState("Cash on delivery");
  const [completed, setCompleted] = React.useState(false);

  // --------------------------------------------------
  // CHECK 1: USER MUST BE SIGNED IN
  // --------------------------------------------------
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Alert>
          <AlertDescription>
            Please sign in to confirm your order.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --------------------------------------------------
  // CHECK 2: QUOTATION MUST EXIST
  // --------------------------------------------------
  if (!quotation) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Alert variant="destructive">
          <AlertDescription>
            This quotation could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /*
   * IMPORTANT:
   * Store the values after the null checks.
   *
   * This makes TypeScript understand that these values
   * cannot be null when used inside handleConfirmOrder().
   */
  const currentSession = session;
  const currentQuotation = quotation;

  // --------------------------------------------------
  // CHECK 3: ONLY THE CUSTOMER WHO REQUESTED IT
  // CAN CONFIRM THE ORDER
  // --------------------------------------------------
  if (
    currentQuotation.accountId &&
    currentQuotation.accountId !== currentSession.id
  ) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to confirm this order.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --------------------------------------------------
  // CHECK 4: STAFF MUST CONFIRM THE QUOTATION FIRST
  // --------------------------------------------------
  if (currentQuotation.status !== "confirmed") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Alert>
          <AlertDescription>
            This quotation is not ready for customer confirmation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --------------------------------------------------
  // CUSTOMER CONFIRMS THE ORDER
  // --------------------------------------------------
  async function handleConfirmOrder() {
    /*
     * Create the order from the confirmed quotation.
     *
     * currentQuotation is guaranteed not to be null.
     */
    const order = await createOrderFromQuotation(currentQuotation);

    updateOrder(order.id, { deliveryMethod, deliveryAddressId: selectedAddress || undefined, paymentMethod });
    void addTransaction({ orderId: order.id, accountId: currentSession.id, type: "ORDER_CONFIRMED", status: "Confirmed", title: "Customer confirmed order", message: `${currentSession.name} confirmed the order for ${currentQuotation.projectName}.`, metadata: { deliveryMethod, paymentMethod, deliveryAddressId: selectedAddress || null } });

    /*
     * Save the customer's confirmation and connect
     * the created order to the quotation.
     *
     * Your orders store can automatically create the
     * delivery receipt during createOrderFromQuotation().
     */
    confirmCustomerOrder(currentQuotation.id, order.id);

    /*
     * Notify staff that the customer has confirmed.
     */
    addNotification({
      audience: "staff",
      title: "Customer confirmed an order",
      body: `${currentSession.name} confirmed the order for "${currentQuotation.projectName}". The order and delivery receipt were created automatically.`,
      href: "/staff/orders",
    });

    setCompleted(true);
  }

  // --------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------
  if (completed || currentQuotation.customerConfirmedAt) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-7" />
            </div>

            <CardTitle className="mt-4">Order confirmed</CardTitle>

            <CardDescription>
              Your order has been created successfully. A delivery receipt was
              also created for the warehouse workflow.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center">
            <Button render={<Link href="/">Back to home</Link>} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------
  // CONFIRMATION PAGE
  // --------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        Confirm order
      </p>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Your quotation is ready.
      </h1>

      <p className="mt-3 text-muted-foreground">
        Please review the confirmed quotation before creating your order.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{currentQuotation.projectName}</CardTitle>

          <CardDescription>
            {currentQuotation.projectType} · {currentQuotation.location}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* MATERIALS */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex gap-3">
              <Package className="size-5 text-primary" />

              <div>
                <p className="font-medium">Materials</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {currentQuotation.materials}
                </p>
              </div>
            </div>
          </div>

          {/* QUANTITY AND TIMELINE */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex gap-3">
              <ClipboardList className="size-5 text-primary" />

              <div>
                <p className="font-medium">Quantity</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {currentQuotation.quantity}
                </p>

                <p className="mt-3 font-medium">Required timeline</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {currentQuotation.timeline}
                </p>
              </div>
            </div>
          </div>

          {/* NOTES */}
          {currentQuotation.notes && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="font-medium">Additional notes</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {currentQuotation.notes}
              </p>
            </div>
          )}

          {/* DELIVERY + PAYMENT */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-primary" /> Delivery method</div>
              <select className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                <option>Delivery</option>
                <option>Customer pickup</option>
              </select>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">Payment method</p>
              <select className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Cash on delivery</option>
                <option>Bank transfer</option>
                <option>Pay on pickup</option>
              </select>
            </div>
          </div>

          {deliveryMethod === "Delivery" && (
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">Delivery address</p>
              {userAddresses.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No saved address yet. Add one from your Profile & activity page before confirming a delivery order.</p>
              ) : (
                <select className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" required value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                  <option value="">Select an address</option>
                  {userAddresses.map((address) => <option key={address.id} value={address.id}>{address.label} — {address.line1}, {address.city ?? ""}</option>)}
                </select>
              )}
            </div>
          )}

          {/* CONFIRM BUTTON */}
          <Button size="lg" onClick={handleConfirmOrder} disabled={deliveryMethod === "Delivery" && (!userAddresses.length || !selectedAddress)}>
            <CheckCircle2 className="size-4" />
            Confirm order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
