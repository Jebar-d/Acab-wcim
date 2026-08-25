"use client";

import * as React from "react";

export type MaterialStatus = "Available" | "Limited" | "Unavailable";

export type Material = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  status: MaterialStatus;
  createdAt: string;
};

const STORAGE_KEY = "acab-materials";
const EVENT = "acab-materials-change";

const SEED: Material[] = [
  {
    id: "mat-portland-cement",
    sku: "CEM-001",
    name: "Portland Cement",
    category: "Cement",
    unit: "Bag",
    quantity: 120,
    minimumStock: 30,
    status: "Available",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "mat-structural-steel",
    sku: "STL-001",
    name: "Structural Steel Bars",
    category: "Steel Bars",
    unit: "Piece",
    quantity: 42,
    minimumStock: 20,
    status: "Limited",
    createdAt: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "mat-lumber",
    sku: "LMB-001",
    name: "Structural Lumber",
    category: "Lumber",
    unit: "Piece",
    quantity: 68,
    minimumStock: 25,
    status: "Available",
    createdAt: "2026-08-03T00:00:00.000Z",
  },
];

let cache: Material[] | null = null;

function loadFromStorage(): Material[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Material[];
  } catch {
    return SEED;
  }
}

function getSnapshot(): Material[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}

function write(next: Material[]) {
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

export function useMaterials(): Material[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}

export function addMaterial(
  input: Omit<Material, "id" | "createdAt"> & { id?: string },
) {
  const materials = loadFromStorage();
  const material: Material = {
    ...input,
    id:
      input.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `material-${Date.now()}`),
    createdAt: new Date().toISOString(),
  };
  const next = [material, ...materials];
  write(next);
  return material;
}

export function updateMaterial(id: string, patch: Partial<Material>) {
  const next = loadFromStorage().map((material) =>
    material.id === id ? { ...material, ...patch } : material,
  );
  write(next);
}

export function deleteMaterial(id: string) {
  const next = loadFromStorage().filter((material) => material.id !== id);
  write(next);
}

export function adjustStock(id: string, delta: number) {
  const next: Material[] = loadFromStorage().map((material) => {
    if (material.id !== id) return material;
    const quantity = Math.max(0, material.quantity + delta);
    const status: MaterialStatus =
      quantity <= material.minimumStock ? "Limited" : "Available";
    return { ...material, quantity, status };
  });
  write(next);
}
