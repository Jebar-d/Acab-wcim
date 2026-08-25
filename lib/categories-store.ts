"use client";

import * as React from "react";

export type Category = {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
};

const STORAGE_KEY = "acab-categories";
const EVENT = "acab-categories-change";

const SEED: Category[] = [
  {
    id: "cat-cement",
    name: "Cement",
    description: "Structural and masonry cement",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "cat-steel",
    name: "Steel Bars",
    description: "Reinforcement and structural steel",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "cat-lumber",
    name: "Lumber",
    description: "Framing and finish lumber",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

let cache: Category[] | null = null;
function loadFromStorage(): Category[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Category[];
  } catch {
    return SEED;
  }
}
function getSnapshot(): Category[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}
function write(next: Category[]) {
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

export function useCategories(): Category[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}
export function addCategory(input: { name: string; description?: string }) {
  const next = [
    {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cat-${Date.now()}`,
      name: input.name.trim(),
      description: input.description?.trim(),
      status: "active" as const,
      createdAt: new Date().toISOString(),
    },
    ...loadFromStorage(),
  ];
  write(next);
  return next[0];
}
export function updateCategory(id: string, patch: Partial<Category>) {
  const next = loadFromStorage().map((category) =>
    category.id === id ? { ...category, ...patch } : category,
  );
  write(next);
}
export function toggleCategoryStatus(id: string) {
  const next = loadFromStorage().map((category) => {
    if (category.id !== id) return category;
    const status: Category["status"] =
      category.status === "active" ? "inactive" : "active";
    return { ...category, status };
  });
  write(next);
}
