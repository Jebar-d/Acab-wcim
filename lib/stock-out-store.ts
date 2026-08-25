"use client";

import * as React from "react";
import type { Material } from "@/lib/materials-store";

export type StockOut = {
  id: string;
  stockOutId: string;
  sku: string;
  material: string;
  quantity: number;
  orderRef: string;
  destination: string;
  warehouseStaff: string;
  date: string;
  status: "Draft" | "Confirmed";
  createdAt: string;
};

const STORAGE_KEY = "acab-stock-out";
const EVENT = "acab-stock-out-change";
let cache: StockOut[] | null = null;
const SEED: StockOut[] = [];
function loadFromStorage(): StockOut[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StockOut[]) : [];
  } catch {
    return SEED;
  }
}
function getSnapshot(): StockOut[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}
function write(next: StockOut[]) {
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

export function useStockOuts(): StockOut[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}
export function addStockOut(input: Omit<StockOut, "id" | "createdAt">) {
  const item: StockOut = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `stockout-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...loadFromStorage()];
  write(next);
  return item;
}
export function confirmStockOut(id: string) {
  const entries = loadFromStorage();
  const stockOut = entries.find((entry) => entry.id === id);
  if (!stockOut) return null;

  const materials: Material[] = JSON.parse(
    window.localStorage.getItem("acab-materials") || "[]",
  ) as Material[];
  const target = materials.find(
    (material) =>
      material.sku === stockOut.sku ||
      material.name.toLowerCase() === stockOut.material.toLowerCase(),
  );
  if (!target) return null;

  const updatedQty =
    Number(target.quantity || 0) - Number(stockOut.quantity || 0);
  if (updatedQty < 0) return null;

  const nextMaterials: Material[] = materials.map((material) => {
    if (material.id !== target.id) return material;
    const status: Material["status"] =
      updatedQty <= Number(material.minimumStock || 0)
        ? "Limited"
        : "Available";
    return { ...material, quantity: updatedQty, status };
  });

  window.localStorage.setItem("acab-materials", JSON.stringify(nextMaterials));
  window.dispatchEvent(new Event("acab-materials-change"));

  const next: StockOut[] = entries.map((entry) =>
    entry.id === id ? { ...entry, status: "Confirmed" } : entry,
  );
  write(next);

  const drKey = "acab-delivery-receipts";
  const drs = JSON.parse(window.localStorage.getItem(drKey) || "[]") as Array<
    Record<string, unknown>
  >;
  const dr = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dr-${Date.now()}`,
    drNumber: `DR-${Date.now()}`.slice(0, 12),
    orderNumber: stockOut.orderRef,
    client: stockOut.destination,
    items: stockOut.material,
    sku: stockOut.sku,
    quantity: stockOut.quantity,
    date: new Date().toISOString(),
    releasedBy: stockOut.warehouseStaff,
    status: "Released",
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(drKey, JSON.stringify([dr, ...drs]));
  window.dispatchEvent(new Event("acab-delivery-receipts-change"));
  return stockOut;
}

// lib/stock-out-store.ts — add
export function deleteStockOut(id: string) {
  write(loadFromStorage().filter((entry) => entry.id !== id));
}
