// lib/auth-store.ts
"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Mock accounts "backend", entirely in the browser (localStorage), so the
// register -> pending -> admin approval -> login flow is fully clickable
// without a real API or database behind it yet.
//
// NOT production-ready: passwords are stored in plain text, there's no
// server-side session/cookie, and nothing here is validated on a server.
// Swap this module for real API calls + hashed passwords + server sessions
// once a backend exists — the component code that calls it (login/register
// forms, the approvals page) shouldn't need to change much.
// ---------------------------------------------------------------------------

export type Role = "user" | "staff" | "admin";
export type AccountStatus = "active" | "pending" | "rejected";

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  /** Required for "staff" and "admin" — what an existing admin checks the registration against. */
  employeeId?: string;
  status: AccountStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

const STORAGE_KEY = "acab-accounts";
const SESSION_KEY = "acab-session";
const ACCOUNTS_EVENT = "acab-accounts-change";
const SESSION_EVENT = "acab-session-change";

// Seeded so the demo is interactive immediately: a verified admin who can
// sign in and review requests, plus one staff request already sitting in
// the queue.
const SEED_ACCOUNTS: Account[] = [
  {
    id: "seed-admin",
    name: "Admin User",
    email: "admin@acab.com",
    password: "admin123",
    role: "admin",
    employeeId: "ADM-0001",
    status: "active",
    createdAt: "2026-01-05T09:00:00.000Z",
    reviewedBy: "System",
    reviewedAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "seed-staff-pending",
    name: "Jamie Cruz",
    email: "jamie.cruz@acab.com",
    password: "staff123",
    role: "staff",
    employeeId: "EMP-1042",
    status: "pending",
    createdAt: "2026-08-18T14:30:00.000Z",
  },
];

// In-memory cache so useSyncExternalStore gets a stable reference between
// actual changes (JSON.parse-ing localStorage on every call would return a
// new array identity each time and trip React's "getSnapshot should be
// cached" loop guard).
let accountsCache: Account[] | null = null;

function loadAccountsFromStorage(): Account[] {
  if (typeof window === "undefined") return SEED_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ACCOUNTS));
      return SEED_ACCOUNTS;
    }
    return JSON.parse(raw) as Account[];
  } catch {
    return SEED_ACCOUNTS;
  }
}

function getAccountsSnapshot(): Account[] {
  if (accountsCache === null) {
    accountsCache = loadAccountsFromStorage();
  }
  return accountsCache;
}

function writeAccounts(accounts: Account[]) {
  accountsCache = accounts;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event(ACCOUNTS_EVENT));
}

function readSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function writeSessionId(id: string | null) {
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  employeeId?: string;
};

export type RegisterResult =
  | { ok: true; account: Account }
  | { ok: false; error: string };

export function registerAccount(input: RegisterInput): RegisterResult {
  const accounts = loadAccountsFromStorage();
  const email = input.email.trim().toLowerCase();

  if (!input.name.trim() || !email || !input.password) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (
    (input.role === "staff" || input.role === "admin") &&
    !input.employeeId?.trim()
  ) {
    return {
      ok: false,
      error:
        "An ID number is required for staff/employee and admin registrations.",
    };
  }

  const account: Account = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `acc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role,
    employeeId: input.employeeId?.trim() || undefined,
    // Users are active right away; staff/admin need a verified admin to
    // check their ID number first.
    status: input.role === "user" ? "active" : "pending",
    createdAt: new Date().toISOString(),
  };

  writeAccounts([...accounts, account]);
  return { ok: true, account };
}

export type LoginResult =
  | { ok: true; account: Account }
  | { ok: false; error: string };

export function login(email: string, password: string): LoginResult {
  const accounts = loadAccountsFromStorage();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!account || account.password !== password) {
    return { ok: false, error: "Incorrect email or password." };
  }
  if (account.status === "pending") {
    return {
      ok: false,
      error:
        "This account is still waiting on admin verification. You'll be able to sign in once your ID has been checked.",
    };
  }
  if (account.status === "rejected") {
    return {
      ok: false,
      error: "This registration was rejected. Contact an administrator.",
    };
  }

  writeSessionId(account.id);
  return { ok: true, account };
}

export function logout() {
  writeSessionId(null);
}

/** Admin action: approve or reject a pending staff/admin registration. */
export function reviewAccount(
  id: string,
  decision: "approve" | "reject",
  reviewerName: string,
) {
  const accounts = loadAccountsFromStorage();
  const next = accounts.map((a) =>
    a.id === id
      ? {
          ...a,
          status: (decision === "approve"
            ? "active"
            : "rejected") as AccountStatus,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString(),
        }
      : a,
  );
  writeAccounts(next);
}

// ---------------------------------------------------------------------------
// Reactive hooks — useSyncExternalStore, no effects, no setState-in-effect
// warnings.
// ---------------------------------------------------------------------------

function subscribeAccounts(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      accountsCache = null;
      callback();
    }
  };
  window.addEventListener(ACCOUNTS_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(ACCOUNTS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function subscribeSession(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useAccounts(): Account[] {
  return React.useSyncExternalStore(
    subscribeAccounts,
    getAccountsSnapshot,
    () => SEED_ACCOUNTS,
  );
}

export function useSession(): Account | null {
  const sessionId = React.useSyncExternalStore(
    subscribeSession,
    readSessionId,
    () => null,
  );
  const accounts = useAccounts();
  if (!sessionId) return null;
  return accounts.find((a) => a.id === sessionId) ?? null;
}

export function usePendingCount(): number {
  const accounts = useAccounts();
  return accounts.filter((a) => a.status === "pending").length;
}
