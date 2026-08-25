"use client";

import * as React from "react";

export type ClientStatus = "active" | "inactive";

export type Client = {
  id: string;
  accountId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  createdAt: string;
};

const STORAGE_KEY = "acab-clients";
const EVENT = "acab-clients-change";

const SEED_CLIENTS: Client[] = [
  {
    id: "seed-client-1",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    phone: "+63 917 000 1122",
    company: "Cebu Integrated Builders",
    status: "active",
    createdAt: "2026-06-12T08:00:00.000Z",
  },
];

let cache: Client[] | null = null;

function loadFromStorage(): Client[] {
  if (typeof window === "undefined") return SEED_CLIENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CLIENTS));
      return SEED_CLIENTS;
    }
    return JSON.parse(raw) as Client[];
  } catch {
    return SEED_CLIENTS;
  }
}

function getSnapshot(): Client[] {
  if (cache === null) cache = loadFromStorage();
  return cache;
}

function write(clients: Client[]) {
  cache = clients;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
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

export type ClientInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  accountId?: string;
};

export function upsertClient(input: ClientInput) {
  const clients = loadFromStorage();
  const normalizedName = input.name.trim();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = clients.find(
    (client) =>
      client.accountId === input.accountId ||
      client.email.toLowerCase() === normalizedEmail,
  );

  if (existing) {
    const patched = {
      ...existing,
      name: normalizedName || existing.name,
      email: normalizedEmail || existing.email,
      phone: input.phone?.trim() || existing.phone,
      company: input.company?.trim() || existing.company,
      accountId: input.accountId ?? existing.accountId,
    };
    const next = clients.map((client) =>
      client.id === existing.id ? patched : client,
    );
    write(next);
    return patched;
  }

  const created: Client = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Date.now()}`,
    accountId: input.accountId,
    name: normalizedName,
    email: normalizedEmail,
    phone: input.phone?.trim() || "",
    company: input.company?.trim() || "",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  write([created, ...clients]);
  return created;
}

export function ensureClientForAccount(account: {
  id: string;
  name: string;
  email: string;
}) {
  return upsertClient({
    accountId: account.id,
    name: account.name,
    email: account.email,
  });
}

export function useClients(): Client[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => SEED_CLIENTS);
}

// lib/clients-store.ts — add
export function deleteClient(id: string) {
  write(loadFromStorage().filter((client) => client.id !== id));
}
