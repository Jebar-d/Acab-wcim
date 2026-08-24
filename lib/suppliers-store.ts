"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Mock suppliers "backend" — same localStorage + useSyncExternalStore
// pattern as lib/auth-store.ts, kept separate because suppliers aren't
// accounts. Swap for real API calls once a backend exists.
// ---------------------------------------------------------------------------

export type SupplierStatus = "active" | "inactive";

export type Supplier = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  status: SupplierStatus;
  createdAt: string;
};

const STORAGE_KEY = "acab-suppliers";
const EVENT = "acab-suppliers-change";

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "seed-1",
    name: "Cebu Steel & Rebar Co.",
    contactName: "Marites Uy",
    email: "marites@cebusteel.ph",
    phone: "+63 917 555 0142",
    category: "Steel & Rebar",
    status: "active",
    createdAt: "2026-02-10T08:00:00.000Z",
  },
  {
    id: "seed-2",
    name: "Visayas Cement Depot",
    contactName: "Ronnel Pacaña",
    email: "ronnel@viscement.ph",
    phone: "+63 917 555 0198",
    category: "Cement & Aggregates",
    status: "active",
    createdAt: "2026-03-02T08:00:00.000Z",
  },
  {
    id: "seed-3",
    name: "Mandaue Hardware Supply",
    contactName: "Grace Lim",
    email: "grace@mandauehardware.ph",
    phone: "+63 917 555 0173",
    category: "Tools & Hardware",
    status: "inactive",
    createdAt: "2026-04-18T08:00:00.000Z",
  },
];

let cache: Supplier[] | null = null;

function loadFromStorage(): Supplier[] {
  if (typeof window === "undefined") return SEED_SUPPLIERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SUPPLIERS));
      return SEED_SUPPLIERS;
    }
    return JSON.parse(raw) as Supplier[];
  } catch {
    return SEED_SUPPLIERS;
  }
}

function getSnapshot(): Supplier[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}

function write(suppliers: Supplier[]) {
  cache = suppliers;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
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

export type SupplierInput = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
};

export function addSupplier(input: SupplierInput): Supplier {
  const suppliers = loadFromStorage();
  const supplier: Supplier = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: input.name.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    category: input.category.trim(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  write([supplier, ...suppliers]);
  return supplier;
}

export function toggleSupplierStatus(id: string) {
  const suppliers = loadFromStorage();
  write(
    suppliers.map((s) =>
      s.id === id
        ? { ...s, status: s.status === "active" ? "inactive" : "active" }
        : s,
    ),
  );
}

export function useSuppliers(): Supplier[] {
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SEED_SUPPLIERS,
  );
}
