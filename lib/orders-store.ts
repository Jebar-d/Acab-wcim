"use client";
import {
  createRecord,
  deleteRecord,
  makeId,
  refreshCollection,
  updateRecord,
  useDbCollection,
  apiRequest,
} from "@/lib/db-client";
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready for Release"
  | "Released"
  | "Delivered"
  | "Cancelled";
export type Order = {
  id: string;
  orderNo?: string;
  quotationId?: string;
  inquiryId?: string;
  clientId?: string;
  accountId?: string;
  projectName: string;
  clientName: string;
  materials: string;
  quantity: string;
  status: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
  deliveryMethod?: string;
  deliveryAddressId?: string;
  paymentMethod?: string;
  notes?: string;
};
export function useOrders() {
  return useDbCollection<Order>("orders");
}
export async function createOrderFromQuotation(q: { id: string }, options: {
  deliveryMethod: string;
  deliveryAddressId?: string;
  paymentMethod: string;
}) {
  const saved = await apiRequest<Order>("confirm_quotation_order", undefined, {
    quotationId: q.id,
    ...options,
  });
  const rows = await refreshCollection<Order>("orders");
  return rows.find((order) => order.id === saved.id) ?? saved;
}
export function updateOrder(id: string, patch: Partial<Order>) {
  void updateRecord("orders", id, patch);
}
export function addOrder(
  input: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus },
) {
  const row: Order = {
    ...input,
    id: makeId("order"),
    createdAt: new Date().toISOString(),
    status: input.status ?? "Pending",
  };
  void createRecord("orders", row);
  return row;
}
export function deleteOrder(id: string) {
  void deleteRecord("orders", id);
}
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message?: string,
) {
  await apiRequest("transaction_status", undefined, {
    orderId,
    status,
    message,
  });
  await updateRecord("orders", orderId, { status });
}
export async function cancelOrder(orderId: string, reason?: string) {
  await updateOrderStatus(
    orderId,
    "Cancelled",
    reason ?? "The customer cancelled this order.",
  );
}
