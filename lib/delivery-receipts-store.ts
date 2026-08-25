"use client";

import * as React from "react";

export type DeliveryReceipt = {
  id: string;

  drNumber: string;

  orderNumber: string;

  client: string;

  items: string;

  sku: string;

  quantity: number;

  date: string;

  releasedBy: string;

  status: "Draft" | "Released" | "Delivered";

  createdAt: string;
};

const STORAGE_KEY = "acab-delivery-receipts";

const EVENT = "acab-delivery-receipts-change";

const SEED: DeliveryReceipt[] = [];

let cache: DeliveryReceipt[] | null = null;

function loadFromStorage(): DeliveryReceipt[] {
  if (typeof window === "undefined") {
    return SEED;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : SEED;
  } catch {
    return SEED;
  }
}

function getSnapshot(): DeliveryReceipt[] {
  if (cache === null) {
    cache = loadFromStorage();
  }

  return cache;
}

function write(next: DeliveryReceipt[]) {
  cache = next;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cache = null;
      callback();
    }
  };

  window.addEventListener(EVENT, callback);

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT, callback);

    window.removeEventListener("storage", handleStorage);
  };
}

export function useDeliveryReceipts(): DeliveryReceipt[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}

export function addDeliveryReceipt(
  input: Omit<DeliveryReceipt, "id" | "createdAt">,
) {
  const receipt: DeliveryReceipt = {
    ...input,

    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dr-${Date.now()}`,

    createdAt: new Date().toISOString(),
  };

  write([receipt, ...loadFromStorage()]);

  return receipt;
}

/*
 * Called automatically when a customer confirms
 * an order created from a quotation.
 */
export function createDeliveryReceiptForOrder(input: {
  orderId: string;
  client: string;
  items: string;
  quantity: number;
}) {
  const existing = loadFromStorage();

  /*
   * Do not create duplicate delivery receipts.
   */
  const found = existing.find(
    (receipt) => receipt.orderNumber === input.orderId,
  );

  if (found) {
    return found;
  }

  const now = new Date();

  const receipt: DeliveryReceipt = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dr-${Date.now()}`,

    drNumber: `DR-${Date.now()}`,

    orderNumber: input.orderId,

    client: input.client,

    items: input.items,

    sku: "",

    quantity: input.quantity,

    date: now.toISOString().slice(0, 10),

    releasedBy: "System",

    status: "Draft",

    createdAt: now.toISOString(),
  };

  write([receipt, ...existing]);

  return receipt;
}

export function deleteDeliveryReceipt(id: string) {
  write(loadFromStorage().filter((receipt) => receipt.id !== id));
}
