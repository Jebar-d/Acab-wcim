"use client";

import * as React from "react";

export type LedgerSource =
  | "Purchase Order"
  | "Invoice"
  | "Customer Order"
  | "Delivery Receipt"
  | "Stock In"
  | "Stock Out"
  | "Project Transaction";

export type LedgerEntry = {
  id: string;
  source: LedgerSource;
  reference: string;
  description: string;
  amount: number;
  date: string;
  party: string;
  project: string;
  status: "Posted" | "Draft";
  sourceId: string;
  createdAt: string;
};

const EVENT = "acab-ledger-change";
const SOURCE_EVENTS = [
  "acab-orders-change",
  "acab-delivery-receipts-change",
  "acab-stock-in-change",
  "acab-stock-out-change",
  "acab-purchase-orders-change",
  "acab-invoices-change",
];

const SOURCE_KEYS = {
  orders: "acab-orders",
  deliveryReceipts: "acab-delivery-receipts",
  stockIn: "acab-stock-in",
  stockOut: "acab-stock-out",
  purchaseOrders: "acab-purchase-orders",
  invoices: "acab-invoices",
};

let cache: LedgerEntry[] | null = null;

function readArray(key: string): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOf(value: unknown) {
  const valueText = text(value);
  return valueText || new Date().toISOString().slice(0, 10);
}

function makeReference(prefix: string, value: unknown, index: number) {
  const raw = text(value);

  if (raw && raw.toUpperCase().startsWith(`${prefix}-`)) {
    return raw;
  }

  return `${prefix}-${String(index + 1).padStart(4, "0")}`;
}

function buildLedger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  const orders = readArray(SOURCE_KEYS.orders);
  const deliveryReceipts = readArray(SOURCE_KEYS.deliveryReceipts);
  const stockIns = readArray(SOURCE_KEYS.stockIn);
  const stockOuts = readArray(SOURCE_KEYS.stockOut);
  const purchaseOrders = readArray(SOURCE_KEYS.purchaseOrders);
  const invoices = readArray(SOURCE_KEYS.invoices);
  const manualEntries = readArray("acab-ledger-manual");

  for (const [index, order] of orders.entries()) {
    const id = text(order.id);
    if (!id) continue;

    entries.push({
      id: `ledger-order-${id}`,
      source: "Customer Order",
      reference: makeReference("ORD", order.reference, index),
      description: `Customer order for ${text(order.materials, "project materials")}`,
      amount: number(order.amount ?? order.total ?? order.totalAmount),
      date: dateOf(order.confirmedAt ?? order.createdAt),
      party: text(order.clientName, "Customer"),
      project: text(order.projectName, "—"),
      status: text(order.status) === "Cancelled" ? "Draft" : "Posted",
      sourceId: id,
      createdAt: text(order.createdAt, new Date().toISOString()),
    });
  }

  for (const [index, receipt] of deliveryReceipts.entries()) {
    const id = text(receipt.id);
    if (!id) continue;

    entries.push({
      id: `ledger-dr-${id}`,
      source: "Delivery Receipt",
      reference: makeReference("DR", receipt.drNumber, index),
      description: `Delivery of ${text(receipt.items, "materials")}`,
      amount: number(receipt.amount ?? receipt.total ?? receipt.totalAmount),
      date: dateOf(receipt.date ?? receipt.createdAt),
      party: text(receipt.client, "Customer"),
      project: text(receipt.destination, text(receipt.orderNumber, "—")),
      status: text(receipt.status) === "Draft" ? "Draft" : "Posted",
      sourceId: id,
      createdAt: text(receipt.createdAt, new Date().toISOString()),
    });
  }

  for (const [index, stockIn] of stockIns.entries()) {
    const id = text(stockIn.id);
    if (!id) continue;

    entries.push({
      id: `ledger-stock-in-${id}`,
      source: "Stock In",
      reference: makeReference("STKIN", stockIn.reference, index),
      description: `Received ${number(stockIn.quantity)} ${text(stockIn.material, "material")}`,
      amount: number(stockIn.amount ?? stockIn.total ?? stockIn.totalAmount),
      date: dateOf(stockIn.date ?? stockIn.createdAt),
      party: text(stockIn.supplier, "Supplier"),
      project: "Warehouse",
      status: text(stockIn.status) === "Draft" ? "Draft" : "Posted",
      sourceId: id,
      createdAt: text(stockIn.createdAt, new Date().toISOString()),
    });
  }

  for (const [index, stockOut] of stockOuts.entries()) {
    const id = text(stockOut.id);
    if (!id) continue;

    entries.push({
      id: `ledger-stock-out-${id}`,
      source: "Stock Out",
      reference: makeReference("STKOUT", stockOut.stockOutId, index),
      description: `Released ${number(stockOut.quantity)} ${text(stockOut.material, "material")}`,
      amount: number(stockOut.amount ?? stockOut.total ?? stockOut.totalAmount),
      date: dateOf(stockOut.date ?? stockOut.createdAt),
      party: text(stockOut.destination, "Project"),
      project: text(stockOut.destination, text(stockOut.orderRef, "—")),
      status: text(stockOut.status) === "Confirmed" ? "Posted" : "Draft",
      sourceId: id,
      createdAt: text(stockOut.createdAt, new Date().toISOString()),
    });
  }

  /*
   * Purchase orders and invoices are supported automatically if their
   * records are added to localStorage by their respective modules.
   */
  for (const [index, purchaseOrder] of purchaseOrders.entries()) {
    const id = text(purchaseOrder.id);
    if (!id) continue;

    entries.push({
      id: `ledger-po-${id}`,
      source: "Purchase Order",
      reference: makeReference(
        "PO",
        purchaseOrder.poNumber || purchaseOrder.reference,
        index,
      ),
      description: text(
        purchaseOrder.description,
        `Purchase order for ${text(purchaseOrder.items, "materials")}`,
      ),
      amount: number(
        purchaseOrder.amount ??
          purchaseOrder.total ??
          purchaseOrder.totalAmount ??
          purchaseOrder.grandTotal,
      ),
      date: dateOf(purchaseOrder.date ?? purchaseOrder.createdAt),
      party: text(purchaseOrder.supplier, "Supplier"),
      project: text(purchaseOrder.projectName, "—"),
      status: text(purchaseOrder.status).toLowerCase() === "draft" ? "Draft" : "Posted",
      sourceId: id,
      createdAt: text(purchaseOrder.createdAt, new Date().toISOString()),
    });
  }

  for (const [index, manual] of manualEntries.entries()) {
    const id = text(manual.id);
    if (!id) continue;

    entries.push({
      id: `ledger-manual-${id}`,
      source: (text(manual.source, "Project Transaction") as LedgerSource),
      reference: makeReference("TXN", manual.reference, index),
      description: text(manual.description, "Project transaction"),
      amount: number(manual.amount),
      date: dateOf(manual.date ?? manual.createdAt),
      party: text(manual.party, "Customer"),
      project: text(manual.project, "—"),
      status: text(manual.status) === "Draft" ? "Draft" : "Posted",
      sourceId: text(manual.sourceId, id),
      createdAt: text(manual.createdAt, new Date().toISOString()),
    });
  }

  for (const [index, invoice] of invoices.entries()) {
    const id = text(invoice.id);
    if (!id) continue;

    entries.push({
      id: `ledger-invoice-${id}`,
      source: "Invoice",
      reference: makeReference(
        "INV",
        invoice.invoiceNumber || invoice.reference,
        index,
      ),
      description: text(
        invoice.description,
        `Invoice for ${text(invoice.items, "project charges")}`,
      ),
      amount: number(
        invoice.amount ?? invoice.total ?? invoice.totalAmount ?? invoice.grandTotal,
      ),
      date: dateOf(invoice.date ?? invoice.issueDate ?? invoice.createdAt),
      party: text(invoice.customer ?? invoice.client ?? invoice.customerName, "Customer"),
      project: text(invoice.projectName, "—"),
      status: text(invoice.status).toLowerCase() === "draft" ? "Draft" : "Posted",
      sourceId: id,
      createdAt: text(invoice.createdAt, new Date().toISOString()),
    });
  }

  return entries.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return bTime - aTime;
  });
}

function getSnapshot(): LedgerEntry[] {
  if (cache === null) {
    cache = buildLedger();
  }

  return cache;
}

function invalidate() {
  cache = null;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  const handlers = SOURCE_EVENTS.map((eventName) => {
    const handler = () => {
      cache = null;
      callback();
    };

    window.addEventListener(eventName, handler);
    return { eventName, handler };
  });

  const handleStorage = (event: StorageEvent) => {
    if (Object.values(SOURCE_KEYS).includes(event.key ?? "")) {
      cache = null;
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    for (const { eventName, handler } of handlers) {
      window.removeEventListener(eventName, handler);
    }

    window.removeEventListener("storage", handleStorage);
  };
}

export function useLedger(): LedgerEntry[] {
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => [],
  );
}

/*
 * Kept for compatibility with older pages/components.
 * New ledger entries should normally come from source transactions.
 */
export function addLedgerEntry(
  input: Omit<LedgerEntry, "id" | "createdAt" | "sourceId" | "project"> & {
    project?: string;
    sourceId?: string;
  },
) {
  const entry: LedgerEntry = {
    ...input,
    project: input.project ?? "—",
    sourceId: input.sourceId ?? "manual",
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ledger-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const manualKey = "acab-ledger-manual";
  const existing = readArray(manualKey);
  const next = [entry, ...existing];

  window.localStorage.setItem(manualKey, JSON.stringify(next));
  invalidate();

  return entry;
}

export function deleteLedgerEntry(id: string) {
  const manualKey = "acab-ledger-manual";
  const existing = readArray(manualKey);
  const next = existing.filter((entry) => text(entry.id) !== id);

  window.localStorage.setItem(manualKey, JSON.stringify(next));
  invalidate();
}
