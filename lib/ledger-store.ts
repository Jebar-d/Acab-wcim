"use client";

import * as React from "react";

export type LedgerEntry = {
  id: string;
  type: "Procurement" | "Inventory" | "Sale";
  reference: string;
  description: string;
  amount: number;
  date: string;
  party: string;
  status: "Posted" | "Draft";
  createdAt: string;
};
const STORAGE_KEY = "acab-ledger";
const EVENT = "acab-ledger-change";
let cache: LedgerEntry[] | null = null;
const SEED: LedgerEntry[] = [];
function loadFromStorage(): LedgerEntry[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return SEED;
  }
}
function getSnapshot(): LedgerEntry[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}
function write(next: LedgerEntry[]) {
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
export function useLedger(): LedgerEntry[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}
export function addLedgerEntry(input: Omit<LedgerEntry, "id" | "createdAt">) {
  const entry: LedgerEntry = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ledger-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadFromStorage()];
  write(next);
  return entry;
}
