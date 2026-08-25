"use client";

import * as React from "react";

export type ChecklistItem = { id: string; text: string; completed: boolean };
export type Checklist = {
  id: string;
  title: string;
  status:
    | "Pending Review"
    | "Checklist Pending"
    | "Ready for Confirmation"
    | "Confirmed"
    | "Rejected";
  items: ChecklistItem[];
  createdAt: string;
};

const STORAGE_KEY = "acab-checklists";
const EVENT = "acab-checklists-change";
const SEED: Checklist[] = [
  {
    id: "check-1",
    title: "Standard material review",
    status: "Ready for Confirmation",
    items: [
      { id: "i-1", text: "Inventory reviewed", completed: true },
      { id: "i-2", text: "Lead time confirmed", completed: true },
      { id: "i-3", text: "Warehouse notes verified", completed: false },
    ],
    createdAt: "2026-08-15T00:00:00.000Z",
  },
];

let cache: Checklist[] | null = null;
function loadFromStorage(): Checklist[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Checklist[];
  } catch {
    return SEED;
  }
}
function getSnapshot(): Checklist[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}
function write(next: Checklist[]) {
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

export function useChecklists(): Checklist[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}
export function addChecklist(input: { title: string }) {
  const item: Checklist = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `check-${Date.now()}`,
    title: input.title.trim(),
    status: "Checklist Pending",
    items: [],
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...loadFromStorage()];
  write(next);
  return item;
}
export function toggleChecklistItem(checklistId: string, itemId: string) {
  const next = loadFromStorage().map((checklist) => {
    if (checklist.id !== checklistId) return checklist;

    const updatedItems = checklist.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );

    const nextStatus: Checklist["status"] = updatedItems.some(
      (item) => !item.completed,
    )
      ? "Checklist Pending"
      : "Ready for Confirmation";

    return { ...checklist, items: updatedItems, status: nextStatus };
  });
  write(next);
}
export function updateChecklist(id: string, patch: Partial<Checklist>) {
  const next = loadFromStorage().map((checklist) =>
    checklist.id === id ? { ...checklist, ...patch } : checklist,
  );
  write(next);
}
export function deleteChecklist(id: string) {
  write(loadFromStorage().filter((checklist) => checklist.id !== id));
}
