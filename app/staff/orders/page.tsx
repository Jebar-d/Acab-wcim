// app/staff/orders/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { DataTablePage } from "@/components/staff/data-table-page";
import { addOrder, deleteOrder, updateOrder, updateOrderStatus, useOrders, type OrderStatus } from "@/lib/orders-store";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import { apiRequest, resolveApiAssetUrl } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaterials } from "@/lib/materials-store";
import { ImageOff } from "lucide-react";

type EditItem={materialId:string;sku?:string;materialName:string;imageUrl?:string|null;quantity:number;unit:string};
type EditRequest={id:string;order_id:string;quotation_id?:string;customer_name:string;project_name:string;status:string;requested_at:string;reviewed_at?:string|null;reviewer_name?:string|null;rejection_reason?:string|null;requestedItems:EditItem[];previousItems:EditItem[]};

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Confirmed", "APPROVED", "EDIT_REQUESTED", "Preparing", "Ready for Release", "Released", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const orders = useOrders();
  const materials = useMaterials();
  const session = useSession();
  const [editRequests,setEditRequests]=useState<EditRequest[]>([]);
  const [reviewingId,setReviewingId]=useState<string|null>(null);
  async function loadEditRequests(){try{setEditRequests(await apiRequest<EditRequest[]>("order_edit_list"));}catch{/* API may be unavailable during setup. */}}
  useEffect(()=>{const timer=window.setInterval(()=>void loadEditRequests(),10000);void apiRequest<EditRequest[]>("order_edit_list").then(setEditRequests).catch(()=>{});return()=>window.clearInterval(timer);},[]);

  async function reviewEdit(requestId:string,decision:"approve"|"reject"){
    const reason=decision==="reject"?window.prompt("Reason for rejecting this requested change?")?.trim()??"":"";
    setReviewingId(requestId);
    try{await apiRequest("order_edit_review",undefined,{requestId,decision,reason});toast.success(decision==="approve"?"Order update approved.":"Order update rejected.");await loadEditRequests();}
    catch(error){toast.error(error instanceof Error?error.message:"Could not review the order update.");}
    finally{setReviewingId(null);}
  }

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status, `${session?.name ?? "Staff"} moved the order to ${status}.`);
      toast.success(`Order moved to ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    }
  }

  return (
    <>
    <Card className="mb-6">
      <CardHeader><CardTitle>Order edit requests</CardTitle><CardDescription>Customer changes stay pending until staff approves them. Inventory is checked again during approval.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {editRequests.length===0 ? <p className="text-sm text-muted-foreground">No edit requests yet.</p> : editRequests.map((request)=>{
          const oldById=new Map(request.previousItems.map((item)=>[item.materialId,item]));
          const nextById=new Map(request.requestedItems.map((item)=>[item.materialId,item]));
          const changes=[
            ...request.requestedItems.flatMap((item)=>{
              const old=oldById.get(item.materialId);
              return !old ? [{label:"Added",item,detail:`${item.quantity} ${item.unit}`}] : Number(old.quantity)!==Number(item.quantity) ? [{label:"Changed",item,detail:`${old.quantity} ? ${item.quantity} ${item.unit}`}] : [];
            }),
            ...request.previousItems.filter((item)=>!nextById.has(item.materialId)).map((item)=>({label:"Removed",item,detail:`${item.quantity} ${item.unit}`})),
          ];
          const inventoryChecks=request.requestedItems.map((item)=>{
            const material=materials.find((candidate)=>candidate.id===item.materialId);
            const available=Number(material?.quantity??0);
            const sufficient=!!material && material.status!=="Unavailable" && Number(item.quantity)>0 && Number(item.quantity)<=available;
            return {item,material,available,sufficient};
          });
          const canApprove=inventoryChecks.length>0 && inventoryChecks.every((check)=>check.sufficient);
          const renderItems=(items:EditItem[])=>items.map((item,index)=>{
            const imageUrl=item.imageUrl??materials.find((material)=>material.id===item.materialId)?.imageUrl;
            return <div key={`${item.materialId}-${index}`} className="flex items-center gap-2 py-1"><span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border text-muted-foreground">{imageUrl?<img src={resolveApiAssetUrl(imageUrl)} alt={item.materialName} className="absolute inset-0 size-full object-contain" onError={(event)=>{event.currentTarget.style.display="none";}}/>:<ImageOff className="size-4"/>}</span><span className="text-sm">{item.materialName} ? {item.quantity} {item.unit}</span></div>;
          });
          return <div key={request.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">Order #{request.order_id.slice(0,8)} ? {request.project_name}</p><p className="text-sm text-muted-foreground">{request.customer_name} ? {new Date(request.requested_at).toLocaleString()}</p></div><Badge variant={request.status==="PENDING"?"outline":request.status==="APPROVED"?"secondary":"destructive"}>{request.status==="PENDING"?"Pending Review":request.status==="APPROVED"?"Approved":"Rejected"}</Badge></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Original order</p>{renderItems(request.previousItems)}</div><div><p className="text-xs font-semibold uppercase text-muted-foreground">Edited order</p>{renderItems(request.requestedItems)}</div></div>
            <div className="mt-3 rounded-xl bg-muted/30 p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Changes</p>{changes.length?changes.map((change,index)=><p key={`${change.label}-${change.item.materialId}-${index}`} className="mt-1 text-sm"><span className="font-semibold">{change.label}:</span> {change.item.materialName} ? {change.detail}</p>):<p className="mt-1 text-sm text-muted-foreground">No item differences recorded.</p>}</div>
            {request.status==="PENDING"&&<div className="mt-3 rounded-xl border p-3"><p className="text-sm font-semibold">Current inventory check</p><div className="mt-2 space-y-2">{inventoryChecks.map(({item,material,available,sufficient})=><div key={item.materialId} className="grid gap-1 border-t pt-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><span className="font-medium">{item.materialName}{item.sku?` | ${item.sku}`:""}</span><span>Requested: {item.quantity} {item.unit} | Available: {available} {material?.unit??item.unit}</span><Badge variant={sufficient?"secondary":"destructive"}>{sufficient?"Available":"Insufficient stock"}</Badge></div>)}</div><p className={`mt-2 text-sm ${canApprove?"text-emerald-600":"text-destructive"}`}>{canApprove?"All requested materials are available.":"Some materials have insufficient stock. Reject this request or wait for inventory to change."}</p></div>}
            {request.reviewed_at&&<p className="mt-2 text-xs text-muted-foreground">Reviewed {new Date(request.reviewed_at).toLocaleString()}{request.reviewer_name?` by ${request.reviewer_name}`:""}{request.rejection_reason?` ? ${request.rejection_reason}`:""}</p>}
            {request.status==="PENDING"&&<div className="mt-3 flex gap-2"><Button size="sm" disabled={!canApprove||reviewingId!==null} onClick={()=>void reviewEdit(request.id,"approve")}>{reviewingId===request.id?"Processing?":"Confirm Changes"}</Button><Button size="sm" variant="outline" disabled={reviewingId!==null} onClick={()=>void reviewEdit(request.id,"reject")}>Reject Changes</Button></div>}
          </div>;
        })}
      </CardContent>
    </Card>
    <DataTablePage
      title="Orders"
      description="Monitor customer orders from confirmation through warehouse release and delivery."
      addLabel="Add order"
      emptyLabel="No orders yet."
      data={orders}
      onAdd={(v) => addOrder({ projectName: v.projectName, clientName: v.clientName, materials: v.materials, quantity: v.quantity })}
      onDelete={deleteOrder}
      onUpdate={(id, v) => updateOrder(id, { projectName: v.projectName, clientName: v.clientName, materials: v.materials, quantity: v.quantity })}
      fields={[
        { key: "projectName", label: "Project name", placeholder: "Riverside Housing" },
        { key: "clientName", label: "Client", placeholder: "Maria Santos" },
        { key: "materials", label: "Materials", placeholder: "Cement, rebar" },
        { key: "quantity", label: "Quantity", placeholder: "50 bags" },
      ]}
      columns={[
        { key: "projectName", label: "Order" },
        { key: "clientName", label: "Client" },
        { key: "materials", label: "Materials" },
        { key: "quantity", label: "Qty" },
        { key: "status", label: "Status", render: (o) => <Badge variant={o.status === "Cancelled" ? "destructive" : "secondary"}>{o.status}</Badge> },
      ]}
      extra={(order) => (
        <select
          aria-label={`Update ${order.projectName} status`}
          value={order.status}
          onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)}
          className="h-8 rounded-xl border border-border bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map((status) => <option key={status} value={status} disabled={status === "EDIT_REQUESTED"}>{status}</option>)}
        </select>
      )}
    />
    </>
  );
}
