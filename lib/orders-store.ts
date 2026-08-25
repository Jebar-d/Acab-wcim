"use client";

import * as React from "react";

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
};

const STORAGE_KEY = "acab-orders";
const EVENT = "acab-orders-change";

let cache: Order[] | null = null;

function loadFromStorage(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): Order[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}

function write(next: Order[]) {
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

export function useOrders(): Order[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => []);
}

export function createOrderFromQuotation(quotation: {
  id: string;
  inquiryId?: string;
  clientId?: string;
  accountId?: string;
  projectName: string;
  customerName?: string;
  materials: string;
  quantity: string;
}) {
  const existing = loadFromStorage();
  const order: Order = {
    id: `order-${Date.now()}`,
    quotationId: quotation.id,
    inquiryId: quotation.inquiryId,
    clientId: quotation.clientId,
    accountId: quotation.accountId,
    projectName: quotation.projectName,
    clientName: quotation.customerName || "Customer",
    materials: quotation.materials,
    quantity: quotation.quantity,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  const next = [order, ...existing];
  write(next);
  return order;
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const next = loadFromStorage().map((order) =>
    order.id === id ? { ...order, ...patch } : order,
  );
  write(next);
}
