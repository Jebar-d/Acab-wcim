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
let cache: DeliveryReceipt[] | null = null;
const SEED: DeliveryReceipt[] = [];
function loadFromStorage(): DeliveryReceipt[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeliveryReceipt[]) : [];
  } catch {
    return SEED;
  }
}
function getSnapshot(): DeliveryReceipt[] {
  if (cache === null) cache = loadFromStorage();
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
  const next = [
    {
      ...input,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
    ...loadFromStorage(),
  ];
  write(next);
  return next[0];
}

// lib/delivery-receipts-store.ts — add
export function deleteDeliveryReceipt(id: string) {
  write(loadFromStorage().filter((entry) => entry.id !== id));
}
