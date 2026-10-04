"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ClipboardList, ImageOff, MapPin, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { createOrderFromQuotation, updateOrderStatus } from "@/lib/orders-store";
import { addNotification } from "@/lib/notifications-store";
import { useAddresses } from "@/lib/addresses-store";
import { updateOrder, useOrders } from "@/lib/orders-store";
import { addTransaction } from "@/lib/transactions-store";
import { parseQuotationItems } from "@/lib/quotations-store";
import { useMaterials } from "@/lib/materials-store";
import { apiRequest, resolveApiAssetUrl } from "@/lib/db-client";
import { toast } from "sonner";

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
  const [confirming, setConfirming] = React.useState(false);
  const inventory = useMaterials();
  const orders = useOrders();
  const [editMode, setEditMode] = React.useState(false);
  const [editItems, setEditItems] = React.useState<Record<string, number>>({});
  const [editSaving, setEditSaving] = React.useState(false);
  const [showAddItems, setShowAddItems] = React.useState(false);

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
  const quotationItems = parseQuotationItems(currentQuotation.materials);
  const currentOrder = orders.find((order) => order.id === currentQuotation.orderId || order.quotationId === currentQuotation.id);
  const currentOrderItems = parseQuotationItems(currentOrder?.materials ?? currentQuotation.materials);

  // --------------------------------------------------
  // CUSTOMER CONFIRMS THE ORDER
  // --------------------------------------------------
  async function handleConfirmOrder() {
    setConfirming(true);
    try {
      await apiRequest("quotation_validate_confirmation",undefined,{quotationId:currentQuotation.id});
    /*
     * Create the order from the confirmed quotation.
     *
     * currentQuotation is guaranteed not to be null.
     */
    const order = await createOrderFromQuotation(currentQuotation);

    await updateOrder(order.id, { deliveryMethod, deliveryAddressId: selectedAddress || undefined, paymentMethod });
    void addTransaction({ orderId: order.id, accountId: currentSession.id, type: "ORDER_CONFIRMED", status: "Confirmed", title: "Customer confirmed order", message: `${currentSession.name} confirmed the order for ${currentQuotation.projectName}.`, metadata: { deliveryMethod, paymentMethod, deliveryAddressId: selectedAddress || null } });

    /*
     * Save the customer's confirmation and connect
     * the created order to the quotation.
     *
     * Your orders store can automatically create the
     * delivery receipt during createOrderFromQuotation().
     */
    await confirmCustomerOrder(currentQuotation.id, order.id);

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
    } finally {
      setConfirming(false);
    }
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

          <CardContent className="flex flex-col gap-4">
            {editMode ? <>
              <p className="text-sm text-muted-foreground">Your original order stays saved. Changes are sent to staff for approval before they replace it.</p>
              <div className="space-y-2"><h2 className="font-medium">Current order</h2>{Object.keys(editItems).length===0&&<p className="text-sm text-muted-foreground">No materials selected yet.</p>}{Object.entries(editItems).map(([materialId,quantity])=>{const material=inventory.find((candidate)=>candidate.id===materialId);if(!material)return null;return <div key={materialId} className="flex items-center gap-3 rounded-xl border p-3"><span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">{material.imageUrl?<img src={resolveApiAssetUrl(material.imageUrl)} alt={material.name} className="absolute inset-0 size-full object-contain"/>:<ImageOff className="size-4 text-muted-foreground"/>}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{material.name}</p><p className="text-xs text-muted-foreground">{material.sku} · Available {material.quantity} {material.unit}</p><label className="mt-2 block text-xs" htmlFor={`edit-${materialId}`}>Quantity ({material.unit})</label><input id={`edit-${materialId}`} type="number" min="0.001" max={material.quantity} step="any" value={quantity} onChange={(event)=>setEditItems((previous)=>({...previous,[materialId]:event.target.value===""?0:Number(event.target.value)}))} className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-sm"/>{quantity>material.quantity&&<p className="mt-1 text-xs text-destructive">Requested quantity exceeds available stock.</p>}</div><Button size="sm" type="button" variant="outline" onClick={()=>setEditItems((previous)=>{const next={...previous};delete next[materialId];return next;})}>Remove</Button></div>;})}</div>
              <Button type="button" variant="outline" onClick={()=>setShowAddItems((open)=>!open)}>{showAddItems?"Hide available materials":"+ Add Items"}</Button>
              {showAddItems&&<div className="grid gap-3 sm:grid-cols-2">{inventory.filter((material)=>!Object.hasOwn(editItems,material.id)).map((material)=>{const availability=material.quantity<=0||material.status==="Unavailable"?"UNAVAILABLE":material.status==="Limited"||material.quantity<=material.minimumStock?"LIMITED":"AVAILABLE";return <div key={material.id} className="overflow-hidden rounded-xl border"><span className="flex h-28 items-center justify-center bg-muted/30">{material.imageUrl?<img src={resolveApiAssetUrl(material.imageUrl)} alt={material.name} className="h-full w-full object-contain p-2"/>:<ImageOff className="size-6 text-muted-foreground"/>}</span><div className="p-3"><p className="truncate text-sm font-medium">{material.name}</p><p className="text-xs text-muted-foreground">{material.category} · {material.sku}</p><p className="mt-1 text-xs text-muted-foreground">Available: {material.quantity} {material.unit} · {availability}</p>{material.quantity>0&&material.status!=="Unavailable"&&<Button type="button" size="sm" className="mt-2 w-full" onClick={()=>setEditItems((previous)=>({...previous,[material.id]:0}))}>Add to edit</Button>}</div></div>;})}</div>}
              <div className="flex flex-wrap gap-2"><Button disabled={editSaving} onClick={async()=>{const invalid=Object.entries(editItems).find(([id,quantity])=>quantity<=0||quantity>(inventory.find((material)=>material.id===id)?.quantity??0));if(invalid){const material=inventory.find((item)=>item.id===invalid[0]);toast.error(invalid[1]>(material?.quantity??0)?"Requested quantity exceeds available stock.":"Enter a quantity greater than zero for each selected item.");return;}const items=inventory.filter((material)=>editItems[material.id]>0).map((material)=>({materialId:material.id,sku:material.sku,materialName:material.name,imageUrl:material.imageUrl,quantity:editItems[material.id],unit:material.unit}));if(!items.length){toast.error("Keep at least one item in the order.");return;}setEditSaving(true);try{await apiRequest("order_edit_submit",undefined,{orderId:currentOrder?.id,items});setEditMode(false);setShowAddItems(false);toast.success("Changes sent to staff for approval.");}catch(error){toast.error(error instanceof Error?error.message:"Could not submit the order changes.");}finally{setEditSaving(false);}}}>{editSaving?"Sending…":"Submit changes for review"}</Button><Button variant="outline" onClick={()=>{setEditMode(false);setShowAddItems(false);}}>Cancel</Button></div>
            </> : <>
              {currentOrder?.status==="EDIT_REQUESTED"&&<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm"><Badge variant="outline">Pending edit approval</Badge><p className="mt-2 text-muted-foreground">Your original order is unchanged while staff reviews the requested updates.</p></div>}
              {currentOrder?.status==="APPROVED"&&<div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"><Badge>Approved updated order</Badge><p className="mt-2 text-muted-foreground">Staff approved your requested changes.</p></div>}
              <div className="space-y-2"><p className="font-medium">{currentOrder?.status==="EDIT_REQUESTED"?"Original order":"Current approved order"}</p>{currentOrderItems.map((item)=><div key={item.materialId} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span>{item.materialName}</span><span className="shrink-0 text-muted-foreground">{item.quantity} {item.unit}</span></div>)}</div>
              <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" disabled={!currentOrder||currentOrder.status==="EDIT_REQUESTED"} onClick={()=>{setEditItems(Object.fromEntries(currentOrderItems.map((item)=>[item.materialId,item.quantity])));setEditMode(true);}}>Edit order</Button>{currentOrder&&["Pending","Confirmed","APPROVED"].includes(currentOrder.status)&&<Button variant="outline" onClick={async()=>{if(!window.confirm("Cancel this order? This will notify the staff."))return;try{await updateOrderStatus(currentOrder.id,"Cancelled","Customer cancelled this order.");toast.success("Order cancelled.");}catch(error){toast.error(error instanceof Error?error.message:"Could not cancel this order.");}}}>Cancel order</Button>}<Button render={<Link href="/">Back to home</Link>} /></div>
            </>}
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

                {quotationItems.length ? <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{quotationItems.map((item)=>{const imageUrl=item.imageUrl ?? inventory.find((material)=>material.id===item.materialId)?.imageUrl;return <li key={item.materialId} className="flex items-center justify-between gap-4"><span className="flex items-center gap-3"><span className="relative flex size-10 shrink-0 items-center justify-center rounded-md border">{imageUrl ? <img src={resolveApiAssetUrl(imageUrl)} alt={item.materialName} className="absolute inset-0 size-full rounded-md object-contain" onError={(event)=>{event.currentTarget.style.display="none";}} /> : <ImageOff className="size-4" aria-label="No image" />}</span>{item.materialName}{item.size ? ` · ${item.size}` : ""}{item.brand ? ` · ${item.brand}` : ""}</span><span>{item.quantity} {item.unit}</span></li>;})}</ul> : <p className="mt-1 text-sm text-muted-foreground">{currentQuotation.materials}</p>}
              </div>
            </div>
          </div>

          {currentQuotation.expiresAt && <p className="text-sm text-muted-foreground">Quotation valid until {new Date(currentQuotation.expiresAt).toLocaleDateString()}.</p>}

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
          <Button size="lg" onClick={() => void handleConfirmOrder().catch((error) => toast.error(error instanceof Error ? error.message : "Could not confirm the order."))} disabled={confirming || (deliveryMethod === "Delivery" && (!userAddresses.length || !selectedAddress))}>
            <CheckCircle2 className="size-4" />
            {confirming ? "Confirming…" : "Confirm order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
