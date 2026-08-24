"use client";

import * as React from "react";

export type Inquiry = {
  id: string;
  project: string;
  materials: string;
  quantity: string;
  timeline: string;
  createdAt: string;
  status: "pending";
};
const STORAGE_KEY = "acab-inquiries";
const EVENT = "acab-inquiries-change";
let cache: Inquiry[] | null = null;
function load() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Inquiry[]) : [];
  } catch {
    return [];
  }
}
function snapshot() {
  if (cache === null) cache = load();
  return cache;
}
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cache = null;
      callback();
    }
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", storage);
  };
}
export function useInquiries() {
  return React.useSyncExternalStore(subscribe, snapshot, () => []);
}
export function createInquiry(
  input: Omit<Inquiry, "id" | "createdAt" | "status">,
) {
  const inquiry: Inquiry = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const next = [...snapshot(), inquiry];
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}
