"use client";

import { Activity, Building2, CircleDollarSign, Users, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/lib/auth-store";
import { isOpenQuotationStatus, useQuotations } from "@/lib/quotations-store";
import { useStockIns } from "@/lib/stock-in-store";
import { useStockOuts } from "@/lib/stock-out-store";
import { useSuppliers } from "@/lib/suppliers-store";

export default function DashboardPage() {
  const accounts = useAccounts();
  const suppliers = useSuppliers();
  const quotations = useQuotations();
  const stockIns = useStockIns();
  const stockOuts = useStockOuts();

  const totalUsers = accounts.length;
  const pendingStaff = accounts.filter((account) => account.role === "staff" && account.status === "pending").length;
  const totalSuppliers = suppliers.length;
  const pendingQuotations = quotations.filter((quotation) => isOpenQuotationStatus(quotation.status)).length;
  const recentActivity = accounts.slice(0, 4).map((account) => ({
    title: `${account.name} ${account.status === "pending" ? "requested access" : "joined the platform"}`,
    time: new Date(account.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
  const recentRequests = quotations.filter((quotation) => isOpenQuotationStatus(quotation.status)).slice(0, 5);

  const stats = [
    { label: "Total Users", value: String(totalUsers), icon: Users },
    { label: "Pending Staff Requests", value: String(pendingStaff), icon: FileText },
    { label: "Total Suppliers", value: String(totalSuppliers), icon: Building2 },
    { label: "Pending Quotations", value: String(pendingQuotations), icon: CircleDollarSign },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest platform updates and approvals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Activity className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{item.time}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations snapshot</CardTitle>
            <CardDescription>Quick status at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm text-muted-foreground">Approved staff</span>
              <span className="font-medium">{accounts.filter((account) => account.role === "staff" && account.status === "active").length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm text-muted-foreground">Rejected staff</span>
              <span className="font-medium">{accounts.filter((account) => account.role === "staff" && account.status === "rejected").length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm text-muted-foreground">Active suppliers</span>
              <span className="font-medium">{suppliers.filter((supplier) => supplier.status === "active").length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm text-muted-foreground">Stock in records</span>
              <span className="font-medium">{stockIns.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm text-muted-foreground">Stock out records</span>
              <span className="font-medium">{stockOuts.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer requests</CardTitle>
          <CardDescription>Live quotation requests from customers for staff review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer requests yet.</p>
          ) : (
            recentRequests.map((quotation) => (
              <div key={quotation.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{quotation.projectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {quotation.customerName ?? "Customer"} · {quotation.projectType} · {quotation.location}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{quotation.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {quotation.materials} · Qty: {quotation.quantity}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
