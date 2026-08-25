"use client";

import * as React from "react";

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

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

/*
 * Standard checklist used for warehouse construction
 * material requests and quotations.
 */
const STANDARD_CHECKLIST_ITEMS = [
  "Verify quotation details and requested quantities",
  "Verify customer/project information",
  "Check material availability in inventory",
  "Check available stock against requested quantity",
  "Check minimum stock level after release",
  "Verify material SKU and specifications",
  "Verify warehouse storage location",
  "Check material condition and quality",
  "Confirm supplier availability for missing materials",
  "Confirm supplier lead time for replenishment",
  "Check purchase order requirement for unavailable materials",
  "Verify delivery schedule and required date",
  "Check warehouse loading/release capacity",
  "Verify transportation or delivery requirements",
  "Confirm project location and delivery destination",
  "Review special customer requirements",
];

const SEED: Checklist[] = [
  {
    id: "check-standard-material-review",

    title: "Standard Construction Material Review",

    status: "Checklist Pending",

    items: STANDARD_CHECKLIST_ITEMS.map((text, index) => ({
      id: `standard-${index + 1}`,
      text,
      completed: false,
    })),

    createdAt: new Date().toISOString(),
  },
];

let cache: Checklist[] | null = null;

function loadFromStorage(): Checklist[] {
  if (typeof window === "undefined") {
    return SEED;
  }

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
  if (cache === null) {
    cache = loadFromStorage();
  }

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

function createStandardItems(): ChecklistItem[] {
  return STANDARD_CHECKLIST_ITEMS.map((text, index) => ({
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `item-${Date.now()}-${index}`,

    text,

    completed: false,
  }));
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

    title: input.title.trim() || "Construction Material Review",

    status: "Checklist Pending",

    /*
     * Every new checklist now gets the full
     * warehouse/construction checklist.
     */
    items: createStandardItems(),

    createdAt: new Date().toISOString(),
  };

  const next = [item, ...loadFromStorage()];

  write(next);

  return item;
}

export function toggleChecklistItem(checklistId: string, itemId: string) {
  const next = loadFromStorage().map((checklist) => {
    if (checklist.id !== checklistId) {
      return checklist;
    }

    const items = checklist.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
          }
        : item,
    );

    const allCompleted =
      items.length > 0 && items.every((item) => item.completed);

    const status: Checklist["status"] = allCompleted
      ? "Ready for Confirmation"
      : "Checklist Pending";

    return {
      ...checklist,
      items,
      status,
    };
  });

  write(next);
}

export function updateChecklist(id: string, patch: Partial<Checklist>) {
  const next = loadFromStorage().map((checklist) =>
    checklist.id === id
      ? {
          ...checklist,
          ...patch,
        }
      : checklist,
  );

  write(next);
}

export function deleteChecklist(id: string) {
  write(loadFromStorage().filter((checklist) => checklist.id !== id));
}
