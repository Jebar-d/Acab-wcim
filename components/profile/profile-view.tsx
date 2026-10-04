"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  IdCard,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { updateProfile, useSession, type Role } from "@/lib/auth-store";
import { useAddresses, addAddress, updateAddress, deleteAddress, type Address } from "@/lib/addresses-store";
import { cancelOrder, useOrders } from "@/lib/orders-store";
import { useInquiries } from "@/lib/inquiries-store";
import { useNotifications } from "@/lib/notifications-store";
import { useTransactions } from "@/lib/transactions-store";
import { parseQuotationItems, updateQuotation, useQuotations } from "@/lib/quotations-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">{role}</Badge>;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "notifications", label: "Notifications" },
  { id: "addresses", label: "Addresses" },
  { id: "details", label: "Profile details" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProfileView() {
  const session = useSession();
  const addresses = useAddresses();
  const orders = useOrders();
  const quotations = useQuotations();
  const inquiries = useInquiries();
  const notifications = useNotifications(session?.role ?? "user", session?.id);
  const transactions = useTransactions();
  const [tab, setTab] = React.useState<TabId>("overview");
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(session?.name ?? "");
  const [phone, setPhone] = React.useState(session?.phone ?? "");
  const [emailNotifications, setEmailNotifications] = React.useState(session?.notificationEmail ?? true);
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [addressForm, setAddressForm] = React.useState({ label: "Home", recipientName: "", phone: "", line1: "", line2: "", barangay: "", city: "", province: "", postalCode: "" });

  if (!session) {
    return <Card className="max-w-lg"><CardHeader><CardTitle>You&apos;re not signed in</CardTitle><CardDescription>Sign in to view your profile.</CardDescription></CardHeader><CardContent><Button variant="outline" render={<a href="/login">Go to sign in</a>} /></CardContent></Card>;
  }

  const currentSession = session;
  const userAddresses = addresses.filter((address) => address.userId === currentSession.id);
  const userOrders = orders.filter((order) => order.accountId === currentSession.id);
  const userQuotations = quotations.filter((quotation) => quotation.accountId === currentSession.id);
  const userInquiries = inquiries.filter((inquiry) => inquiry.accountId === currentSession.id);
  const userTransactions = transactions.filter((tx) => tx.accountId === currentSession.id || tx.actorUserId === currentSession.id);
  const roleIsUser = currentSession.role === "user";

  async function saveProfile() {
    try {
      await updateProfile(currentSession.id, { name: name.trim(), phone: phone.trim(), notificationEmail: emailNotifications });
      setEditing(false);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile.");
    }
  }

  function saveAddress(event: React.FormEvent) {
    event.preventDefault();
    addAddress({ userId: currentSession.id, ...addressForm, isDefault: userAddresses.length === 0 });
    setAddressForm({ label: "Home", recipientName: currentSession.name, phone: currentSession.phone ?? "", line1: "", line2: "", barangay: "", city: "", province: "", postalCode: "" });
    setShowAddressForm(false);
    toast.success("Address saved.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account center</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile & activity</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Keep your contact details, delivery addresses, notifications and activity in one place.</p>
        </div>
        <Button variant="outline" render={<Link href={roleIsUser ? "/inquire" : "/staff"} />}>
          {roleIsUser ? "Start a new request" : "Back to workspace"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12"><AvatarFallback className="bg-primary text-primary-foreground">{getInitials(currentSession.name)}</AvatarFallback></Avatar>
                <div className="min-w-0"><p className="truncate font-semibold">{currentSession.name}</p><div className="mt-1"><RoleBadge role={currentSession.role} /></div></div>
              </div>
            </div>
            <nav className="mt-3 flex flex-col gap-1">
              {tabs.map((item) => (
                <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {item.id === "notifications" ? <Bell className="size-4" /> : item.id === "addresses" ? <MapPin className="size-4" /> : item.id === "details" ? <UserRound className="size-4" /> : <PackageCheck className="size-4" />}
                  {item.label}
                  {item.id === "notifications" && notifications.some((n) => !n.read) ? <span className="ml-auto size-2 rounded-full bg-current" /> : null}
                </button>
              ))}
            </nav>
            {roleIsUser && <div className="mt-3 rounded-xl border p-3 text-xs text-muted-foreground">User-only activity such as requests and orders is shown only for customer accounts.</div>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {tab === "overview" && (
            <>
              <Card>
                <CardHeader><CardTitle>Account overview</CardTitle><CardDescription>A quick view of the activity connected to this account.</CardDescription></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Notifications</p><p className="mt-1 text-2xl font-semibold">{notifications.length}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">Saved addresses</p><p className="mt-1 text-2xl font-semibold">{userAddresses.length}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">{roleIsUser ? "Requests" : "Transactions"}</p><p className="mt-1 text-2xl font-semibold">{roleIsUser ? userInquiries.length : userTransactions.length}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-muted-foreground">{roleIsUser ? "Orders" : "Access"}</p><p className="mt-1 text-2xl font-semibold">{roleIsUser ? userOrders.length : currentSession.role}</p></div>
                </CardContent>
              </Card>

              {roleIsUser && <Card><CardHeader><CardTitle>Quotations</CardTitle><CardDescription>Review request status and cancel active requests before an order is created.</CardDescription></CardHeader><CardContent className="space-y-3">{userQuotations.length===0?<p className="py-5 text-sm text-muted-foreground">No quotations yet.</p>:userQuotations.map(quotation=><div key={quotation.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{quotation.projectName}</p><p className="text-sm text-muted-foreground">Quotation #{quotation.id.slice(0,8)} · Submitted {formatDate(quotation.createdAt)}</p></div><Badge variant={["cancelled","rejected","expired"].includes(quotation.status)?"destructive":quotation.status==="confirmed"?"secondary":"outline"}>{quotation.status.replaceAll("-"," ").replaceAll("_"," ")}</Badge></div><div className="mt-2 space-y-1 text-sm text-muted-foreground">{parseQuotationItems(quotation.materials).length?parseQuotationItems(quotation.materials).map((item)=><p key={item.materialId}>{item.materialName} · {item.quantity} {item.unit}</p>):quotation.materials}</div>{quotation.expiresAt&&<p className="mt-1 text-xs text-muted-foreground">Valid until {formatDate(quotation.expiresAt)}</p>}<div className="mt-3 flex gap-2">{quotation.status==="confirmed"&&!quotation.customerConfirmedAt&&<Button size="sm" variant="outline" render={<Link href={`/order-confirmation/${quotation.id}`}>Review order</Link>} />}{["pending","reviewing","inventory-check","checklist-pending","ready"].includes(quotation.status)||(quotation.status==="confirmed"&&!quotation.orderId)?<Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={async()=>{if(!window.confirm("Cancel this quotation request?"))return;try{await updateQuotation(quotation.id,{status:"cancelled"});toast.success("Quotation cancelled.");}catch(error){toast.error(error instanceof Error?error.message:"Could not cancel quotation.");}}}>Cancel quotation</Button>:null}</div></div>)}</CardContent></Card>}
              {roleIsUser ? <Card><CardHeader><CardTitle>Orders</CardTitle><CardDescription>Track your order progress from confirmation to delivery.</CardDescription></CardHeader><CardContent className="space-y-3">{userOrders.length===0?<p className="py-5 text-sm text-muted-foreground">No orders yet. Confirmed quotations will appear here.</p>:userOrders.map(order=><div key={order.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{order.projectName}</p><p className="text-sm text-muted-foreground">{order.clientName} · {order.quantity}</p></div><Badge variant={order.status === "Cancelled" ? "destructive" : order.status === "Delivered" ? "secondary" : "outline"}>{order.status.replaceAll("_"," ")}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{order.materials}</p><div className="mt-3 flex flex-wrap gap-2">{order.quotationId && ["Confirmed","APPROVED","EDIT_REQUESTED"].includes(order.status) && <Button size="sm" variant="outline" render={<Link href={`/order-confirmation/${order.quotationId}`}>Review / edit order</Link>} />}{["Pending","Confirmed","APPROVED"].includes(order.status) && <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={async () => { if (!window.confirm("Cancel this order?")) return; try { await cancelOrder(order.id, "Customer cancelled this order."); toast.success("Order cancelled successfully."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not cancel this order."); } }}>Cancel order</Button>}</div></div>)}</CardContent></Card> : <Card><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Operational transactions performed by this account.</CardDescription></CardHeader><CardContent className="space-y-3">{userTransactions.slice(0,8).map(tx=><div key={tx.id} className="flex items-start gap-3 rounded-2xl border p-3"><CheckCircle2 className="mt-0.5 size-4 text-primary"/><div><p className="text-sm font-medium">{tx.title}</p><p className="text-xs text-muted-foreground">{tx.status} · {formatDate(tx.createdAt)}</p>{tx.message&&<p className="mt-1 text-sm text-muted-foreground">{tx.message}</p>}</div></div>)}{userTransactions.length===0&&<p className="py-5 text-sm text-muted-foreground">No recorded transactions yet.</p>}</CardContent></Card>}
            </>
          )}

          {tab === "notifications" && <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Updates relevant to this account and role.</CardDescription></CardHeader><CardContent className="space-y-3">{notifications.length===0?<p className="py-5 text-sm text-muted-foreground">You&apos;re all caught up.</p>:notifications.map(note=><div key={note.id} className={`rounded-2xl border p-4 ${note.read?"opacity-70":""}`}><div className="flex items-start gap-3"><Bell className="mt-0.5 size-4"/><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{note.title}</p>{!note.read&&<Badge variant="outline">New</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{note.body}</p>{note.href&&<Link href={note.href} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Open related record</Link>}</div></div></div>)}</CardContent></Card>}

          {tab === "addresses" && <Card><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Addresses</CardTitle><CardDescription>Save addresses once and reuse them during checkout.</CardDescription></div><Button size="sm" onClick={()=>setShowAddressForm(true)}><Plus className="size-4"/>Add address</Button></CardHeader><CardContent className="space-y-3">{showAddressForm&&<form onSubmit={saveAddress} className="rounded-2xl border bg-muted/20 p-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Label</Label><Input value={addressForm.label} onChange={e=>setAddressForm({...addressForm,label:e.target.value})}/></div><div><Label>Recipient</Label><Input value={addressForm.recipientName} onChange={e=>setAddressForm({...addressForm,recipientName:e.target.value})}/></div><div className="sm:col-span-2"><Label>Address line 1</Label><Input required value={addressForm.line1} onChange={e=>setAddressForm({...addressForm,line1:e.target.value})}/></div><div className="sm:col-span-2"><Label>Address line 2</Label><Input value={addressForm.line2} onChange={e=>setAddressForm({...addressForm,line2:e.target.value})}/></div><div><Label>Barangay</Label><Input value={addressForm.barangay} onChange={e=>setAddressForm({...addressForm,barangay:e.target.value})}/></div><div><Label>City</Label><Input value={addressForm.city} onChange={e=>setAddressForm({...addressForm,city:e.target.value})}/></div><div><Label>Province</Label><Input value={addressForm.province} onChange={e=>setAddressForm({...addressForm,province:e.target.value})}/></div><div><Label>Postal code</Label><Input value={addressForm.postalCode} onChange={e=>setAddressForm({...addressForm,postalCode:e.target.value})}/></div></div><div className="mt-4 flex gap-2"><Button type="submit"><Save className="size-4"/>Save address</Button><Button type="button" variant="outline" onClick={()=>setShowAddressForm(false)}>Cancel</Button></div></form>}{userAddresses.length===0&&!showAddressForm?<p className="py-5 text-sm text-muted-foreground">No saved addresses yet.</p>:userAddresses.map(address=><AddressCard key={address.id} address={address} onDefault={()=>updateAddress(address.id,{isDefault:true})} onDelete={()=>deleteAddress(address.id)}/>)}</CardContent></Card>}

          {tab === "details" && <Card><CardHeader><CardTitle>Profile details</CardTitle><CardDescription>Edit the information staff use to contact you.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div><Label>Full name</Label><Input disabled={!editing} value={name} onChange={e=>setName(e.target.value)}/></div><div><Label>Email</Label><Input value={currentSession.email} readOnly/></div><div><Label>Phone</Label><Input disabled={!editing} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+63 9xx xxx xxxx"/></div><div><Label>Notifications by email</Label><div className="mt-2 flex items-center gap-2"><input type="checkbox" checked={emailNotifications} disabled={!editing} onChange={e=>setEmailNotifications(e.target.checked)} /><span className="text-sm text-muted-foreground">Receive important account updates by email.</span></div></div></div><Separator/><div className="space-y-3 text-sm"><div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground"/><span className="text-muted-foreground">Email</span><span className="ml-auto font-medium">{currentSession.email}</span></div>{currentSession.employeeId&&<div className="flex items-center gap-3"><IdCard className="size-4 text-muted-foreground"/><span className="text-muted-foreground">{currentSession.role==="admin"?"Admin ID":"Employee ID"}</span><span className="ml-auto font-mono font-medium">{currentSession.employeeId}</span></div>}<div className="flex items-center gap-3"><ShieldCheck className="size-4 text-muted-foreground"/><span className="text-muted-foreground">Access level</span><span className="ml-auto"><RoleBadge role={currentSession.role}/></span></div><div className="flex items-center gap-3"><CalendarDays className="size-4 text-muted-foreground"/><span className="text-muted-foreground">Member since</span><span className="ml-auto font-medium">{formatDate(currentSession.createdAt)}</span></div></div><div className="flex justify-end gap-2">{editing?<><Button variant="outline" onClick={()=>setEditing(false)}>Cancel</Button><Button onClick={saveProfile}><Save className="size-4"/>Save profile</Button></>:<Button variant="outline" onClick={()=>setEditing(true)}><Pencil className="size-4"/>Edit profile</Button>}</div></CardContent></Card>}
        </div>
      </div>
    </div>
  );
}

function AddressCard({ address, onDefault, onDelete }: { address: Address; onDefault: () => void; onDelete: () => void }) {
  return <div className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{address.label}</p>{address.isDefault&&<Badge variant="secondary">Default</Badge>}</div><p className="mt-1 text-sm">{address.recipientName}</p><p className="mt-1 text-sm text-muted-foreground">{[address.line1,address.line2,address.barangay,address.city,address.province,address.postalCode].filter(Boolean).join(", ")}</p>{address.phone&&<p className="mt-1 text-xs text-muted-foreground">{address.phone}</p>}</div><div className="flex gap-2">{!address.isDefault&&<Button size="sm" variant="outline" onClick={onDefault}>Set default</Button>}<Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>Remove</Button></div></div></div>;
}
