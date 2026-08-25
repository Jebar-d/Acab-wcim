"use client";

import * as React from "react";
import { addMaterial, type Material } from "@/lib/materials-store";

export type StockIn = {
  id: string;
  sku: string;
  material: string;
  quantity: number;
  supplier: string;
  date: string;
  reference: string;
  status: "Draft" | "Confirmed";
  createdAt: string;
};

const STORAGE_KEY = "acab-stock-in";
const EVENT = "acab-stock-in-change";
let cache: StockIn[] | null = null;
const SEED: StockIn[] = [];
function loadFromStorage(): StockIn[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StockIn[]) : [];
  } catch {
    return SEED;
  }
}
function getSnapshot(): StockIn[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}
function write(next: StockIn[]) {
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

export function useStockIns(): StockIn[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}
export function addStockIn(input: Omit<StockIn, "id" | "createdAt">) {
  const item: StockIn = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `stockin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "Confirmed",
  };
  const next = [item, ...loadFromStorage()];
  write(next);

  const existing = window.localStorage.getItem("acab-materials");
  const list: Material[] = existing ? (JSON.parse(existing) as Material[]) : [];
  const materialMatch = list.find(
    (material) =>
      material.sku === item.sku ||
      material.name.toLowerCase() === item.material.toLowerCase(),
  );

  if (materialMatch) {
    const updated: Material[] = list.map((material) => {
      if (material.id !== materialMatch.id) return material;
      const quantity =
        Number(material.quantity || 0) + Number(item.quantity || 0);
      const status: Material["status"] =
        quantity <= Number(material.minimumStock || 0)
          ? "Limited"
          : "Available";
      return { ...material, quantity, status };
    });
    window.localStorage.setItem("acab-materials", JSON.stringify(updated));
    window.dispatchEvent(new Event("acab-materials-change"));
  } else {
    addMaterial({
      sku: item.sku,
      name: item.material,
      category: "General",
      unit: "Unit",
      quantity: Number(item.quantity || 0),
      minimumStock: 0,
      status: "Available",
    });
  }

  return item;
}

// lib/stock-in-store.ts — add
export function deleteStockIn(id: string) {
  write(loadFromStorage().filter((entry) => entry.id !== id));
}