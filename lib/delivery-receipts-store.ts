"use client";
import {
  createRecord,
  deleteRecord,
  getCollection,
  makeId,
  useDbCollection,
} from "@/lib/db-client";
export type DeliveryReceipt = {
  id: string;
  drNumber: string;
  orderNumber: string;
  orderId?: string;
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  client: string;
  items: string;
  sku: string;
  quantity: number;
  totalAmount?: number;
  date: string;
  releasedBy: string;
  status: "Draft" | "Released" | "Delivered";
  createdAt: string;
};
export function useDeliveryReceipts() {
  return useDbCollection<DeliveryReceipt>("delivery_receipts");
}
export function addDeliveryReceipt(
  input: Omit<DeliveryReceipt, "id" | "createdAt">,
) {
  const row: DeliveryReceipt = {
    ...input,
    id: makeId("dr"),
    createdAt: new Date().toISOString(),
  };
  void createRecord("delivery_receipts", row);
  return row;
}
export function createDeliveryReceiptForOrder(input: {
  orderId: string;
  client: string;
  items: string;
  quantity: number;
}) {
  const found = getCollection<DeliveryReceipt>("delivery_receipts").find(
    (r) => r.orderNumber === input.orderId,
  );
  if (found) return found;
  return addDeliveryReceipt({
    drNumber: `DR-${Date.now()}`,
    orderNumber: input.orderId,
    client: input.client,
    items: input.items,
    sku: "",
    quantity: input.quantity,
    date: new Date().toISOString().slice(0, 10),
    releasedBy: "System",
    status: "Draft",
  });
}
export function deleteDeliveryReceipt(id: string) {
  void deleteRecord("delivery_receipts", id);
}
