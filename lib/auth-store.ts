"use client";

import * as React from "react";

export type Role = "user" | "staff" | "admin";

export type AccountStatus = "active" | "pending" | "rejected";

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
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

/*
 * No demo accounts.
 *
 * The first admin can now register normally.
 */
const SEED_ACCOUNTS: Account[] = [];

let accountsCache: Account[] | null = null;

function loadAccountsFromStorage(): Account[] {
  if (typeof window === "undefined") {
    return SEED_ACCOUNTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ACCOUNTS));

      return SEED_ACCOUNTS;
    }

    const accounts = JSON.parse(raw) as Account[];

    /*
     * Remove the old demo accounts automatically.
     */
    const cleaned = accounts.filter(
      (account) =>
        account.id !== "seed-admin" &&
        account.id !== "seed-staff-pending" &&
        account.email !== "admin@acab.com" &&
        account.email !== "jamie.cruz@acab.com",
    );

    if (cleaned.length !== accounts.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
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
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

function writeSessionId(id: string | null) {
  if (id) {
    window.localStorage.setItem(SESSION_KEY, id);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }

  window.dispatchEvent(new Event(SESSION_EVENT));
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type RegisterResult =
  | {
      ok: true;
      account: Account;
    }
  | {
      ok: false;
      error: string;
    };

function generateEmployeeId(role: Role, existingAccounts: Account[]): string {
  const prefix = role === "admin" ? "ADM" : "EMP";

  const existingNumbers = existingAccounts
    .filter(
      (account) =>
        account.role === role && account.employeeId?.startsWith(`${prefix}-`),
    )
    .map((account) => Number(account.employeeId?.replace(`${prefix}-`, "")))
    .filter((number) => !Number.isNaN(number));

  const nextNumber =
    existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : role === "admin"
        ? 1
        : 1001;

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

export function registerAccount(input: RegisterInput): RegisterResult {
  const accounts = loadAccountsFromStorage();

  const name = input.name.trim();

  const email = input.email.trim().toLowerCase();

  if (!name || !email || !input.password) {
    return {
      ok: false,
      error: "Please fill in all required fields.",
    };
  }

  if (accounts.some((account) => account.email.toLowerCase() === email)) {
    return {
      ok: false,
      error: "An account with this email already exists.",
    };
  }

  const needsEmployeeId = input.role === "staff" || input.role === "admin";

  /*
   * Users can use the system immediately.
   *
   * Admin accounts are also active immediately so the system
   * does not depend on a permanent demo admin account.
   *
   * Staff accounts remain pending for admin approval.
   */
  const status: AccountStatus = input.role === "staff" ? "pending" : "active";

  const account: Account = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `acc-${Date.now()}-${Math.random().toString(36).slice(2)}`,

    name,
    email,
    password: input.password,
    role: input.role,

    employeeId: needsEmployeeId
      ? generateEmployeeId(input.role, accounts)
      : undefined,

    status,

    createdAt: new Date().toISOString(),
  };

  writeAccounts([...accounts, account]);

  return {
    ok: true,
    account,
  };
}

export type LoginResult =
  | {
      ok: true;
      account: Account;
    }
  | {
      ok: false;
      error: string;
    };

export function login(email: string, password: string): LoginResult {
  const accounts = loadAccountsFromStorage();

  const account = accounts.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!account || account.password !== password) {
    return {
      ok: false,
      error: "Incorrect email or password.",
    };
  }

  if (account.status === "pending") {
    return {
      ok: false,
      error: "This staff account is waiting for admin approval.",
    };
  }

  if (account.status === "rejected") {
    return {
      ok: false,
      error: "This registration was rejected. Please contact an administrator.",
    };
  }

  writeSessionId(account.id);

  return {
    ok: true,
    account,
  };
}

export function logout() {
  writeSessionId(null);
}

export function reviewAccount(
  id: string,
  decision: "approve" | "reject",
  reviewerName: string,
) {
  const accounts = loadAccountsFromStorage();

 const next: Account[] = accounts.map((account): Account => {
   if (account.id === id) {
     return {
       ...account,
       status: "active",
       reviewedBy: "reviewerId",
       reviewedAt: new Date().toISOString(),
     };
   }

   return account;
 });

 writeAccounts(next);
}

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

  if (!sessionId) {
    return null;
  }

  return accounts.find((account) => account.id === sessionId) ?? null;
}

export function usePendingCount(): number {
  const accounts = useAccounts();

  return accounts.filter((account) => account.status === "pending").length;
}
