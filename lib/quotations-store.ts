"use client";

import * as React from "react";

export type QuotationStatus =
  | "pending"
  | "reviewing"
  | "inventory-check"
  | "checklist-pending"
  | "ready"
  | "confirmed"
  | "rejected";

export type Quotation = {
  id: string;

  inquiryId?: string;
  clientId?: string;
  accountId?: string;

  customerName?: string;

  projectName: string;
  projectType: string;
  location: string;

  materials: string;
  quantity: string;
  timeline: string;

  notes?: string;

  status: QuotationStatus;

  inventoryStatus?: "Available" | "Limited" | "Unavailable";

  checklistStatus?:
    | "Pending Review"
    | "Checking Inventory"
    | "Checklist Pending"
    | "Ready for Confirmation"
    | "Confirmed"
    | "Rejected";

  confirmedAt?: string;

  confirmationSentAt?: string;

  /*
   * Set when the customer confirms the order.
   */
  customerConfirmedAt?: string;

  /*
   * Created order ID.
   */
  orderId?: string;

  createdAt: string;
};

const STORAGE_KEY = "acab-quotations";

const EVENT = "acab-quotations-change";

const SEED: Quotation[] = [];

let cache: Quotation[] | null = null;

function loadFromStorage(): Quotation[] {
  if (typeof window === "undefined") {
    return SEED;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));

      return SEED;
    }

    return JSON.parse(raw) as Quotation[];
  } catch {
    return SEED;
  }
}

function getSnapshot(): Quotation[] {
  if (cache === null) {
    cache = loadFromStorage();
  }

  return cache;
}

function write(next: Quotation[]) {
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

export function useQuotations(): Quotation[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}

export function getQuotationById(id: string): Quotation | null {
  return loadFromStorage().find((quotation) => quotation.id === id) ?? null;
}

export function createQuotation(
  input: Omit<Quotation, "id" | "createdAt"> & {
    id?: string;
  },
) {
  const created: Quotation = {
    ...input,

    id:
      input.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `quotation-${Date.now()}`),

    createdAt: new Date().toISOString(),

    status: input.status ?? "pending",

    checklistStatus: input.checklistStatus ?? "Pending Review",
  };

  write([created, ...loadFromStorage()]);

  return created;
}

export function updateQuotation(id: string, patch: Partial<Quotation>) {
  const next = loadFromStorage().map((quotation) =>
    quotation.id === id
      ? {
          ...quotation,
          ...patch,
        }
      : quotation,
  );

  write(next);

  return next.find((quotation) => quotation.id === id) ?? null;
}

export function deleteQuotation(id: string) {
  write(loadFromStorage().filter((quotation) => quotation.id !== id));
}

export function confirmQuotation(
  id: string,
  options?: {
    sendNotification?: boolean;
  },
) {
  const now = new Date().toISOString();

  return updateQuotation(id, {
    status: "confirmed",

    checklistStatus: "Confirmed",

    confirmedAt: now,

    confirmationSentAt: options?.sendNotification ? now : undefined,
  });
}

export function confirmCustomerOrder(quotationId: string, orderId: string) {
  return updateQuotation(quotationId, {
    customerConfirmedAt: new Date().toISOString(),

    orderId,
  });
}
