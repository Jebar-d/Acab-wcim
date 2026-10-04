"use client";

import { apiRequest, createRecord, makeId, refreshCollection, updateRecord, useDbCollection } from "@/lib/db-client";

export type PurchaseOrderStatus = "Pending" | "Ordered" | "Received" | "Cancelled";
export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  materialId: string;
  material: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  orderDate: string;
  expectedDate: string;
  receivedAt?: string | null;
  status: PurchaseOrderStatus;
  notes?: string;
  createdAt: string;
};

export function usePurchaseOrders() {
  return useDbCollection<PurchaseOrder>("purchase_orders");
}

export async function addPurchaseOrder(input: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "receivedAt" | "totalAmount">) {
  const row: PurchaseOrder = {
    ...input,
    id: makeId("po"),
    poNumber: "",
    totalAmount: Number((input.quantity * input.unitCost).toFixed(2)),
    createdAt: new Date().toISOString(),
  };
  return createRecord("purchase_orders", row);
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  return updateRecord<PurchaseOrder>("purchase_orders", id, { status });
}

export async function receivePurchaseOrder(id: string) {
  const saved = await apiRequest<PurchaseOrder>("receive_purchase_order", undefined, { id });
  await Promise.all([
    refreshCollection<PurchaseOrder>("purchase_orders"),
    refreshCollection("stock_in"),
    refreshCollection("materials"),
  ]);
  return saved;
}
