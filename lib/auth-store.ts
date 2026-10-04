"use client";

import * as React from "react";
import { apiRequest } from "@/lib/db-client";

export type Role = "user" | "staff" | "admin";
export type AccountStatus = "active" | "pending" | "rejected";

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  employeeId?: string | null;
  status: AccountStatus;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  notificationEmail?: boolean;
};

const EMPTY_ACCOUNTS: Account[] = [] as Account[];
let accountsCache: Account[] = [];
let sessionCache: Account | null = null;
let accountsLoaded = false;
let sessionLoaded = false;
const listeners = new Set<() => void>();

export function useSessionReady() {
  const snapshot = React.useSyncExternalStore(
    (callback) => { listeners.add(callback); return () => listeners.delete(callback); },
    () => sessionLoaded,
    () => false,
  );

  React.useEffect(() => { void loadSession(); }, []);
  return snapshot;
}

function notify() { listeners.forEach((listener) => listener()); }

export type RegisterInput = { name: string; email: string; password: string; role: Role };
export type RegisterResult = { ok: true; account: Account } | { ok: false; error: string };
export type LoginResult = { ok: true; account: Account } | { ok: false; error: string };

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  try {
    const account = await apiRequest<Account>("auth_register", undefined, input as Record<string, unknown>);
    accountsCache = [account, ...accountsCache.filter((a) => a.id !== account.id)];
    accountsLoaded = true;
    notify();
    return { ok: true, account };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Registration failed." };
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const account = await apiRequest<Account>("auth_login", undefined, { email, password });
    sessionCache = account;
    sessionLoaded = true;
    accountsCache = [account, ...accountsCache.filter((a) => a.id !== account.id)];
    accountsLoaded = true;
    notify();
    return { ok: true, account };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Login failed." };
  }
}

export async function logout() {
  try { await apiRequest("auth_logout"); } finally {
    sessionCache = null;
    sessionLoaded = true;
    notify();
  }
}

async function loadSession() {
  if (sessionLoaded) return sessionCache;
  try {
    sessionCache = await apiRequest<Account | null>("auth_me");
  } catch {
    sessionCache = null;
  }
  sessionLoaded = true;
  if (sessionCache) {
    accountsCache = [sessionCache, ...accountsCache.filter((a) => a.id !== sessionCache?.id)];
    accountsLoaded = true;
  }
  notify();
  return sessionCache;
}

async function loadAccounts() {
  if (accountsLoaded) return accountsCache;
  try { accountsCache = await apiRequest<Account[]>("list", "accounts"); } catch { accountsCache = []; }
  accountsLoaded = true;
  notify();
  return accountsCache;
}

export function useSession(): Account | null {
  const snapshot = React.useSyncExternalStore(
    (callback) => { listeners.add(callback); return () => listeners.delete(callback); },
    () => sessionCache,
    () => null,
  );
  React.useEffect(() => { void loadSession(); }, []);
  return snapshot;
}

export function useAccounts(): Account[] {
  const snapshot = React.useSyncExternalStore(
    (callback) => { listeners.add(callback); return () => listeners.delete(callback); },
    () => accountsCache,
    () => EMPTY_ACCOUNTS,
  );
  React.useEffect(() => { void loadAccounts(); }, []);
  return snapshot;
}

export function usePendingCount() {
  return useAccounts().filter((account) => account.status === "pending").length;
}

export async function reviewAccount(id: string, decision: "approve" | "reject", reviewerName: string) {
  await apiRequest<Account>("auth_review", undefined, { id, decision, reviewerName });
  await loadAccounts();
}

export async function deleteAccount(id: string) {
  await apiRequest("delete", "accounts", { id });
  accountsCache = accountsCache.filter((account) => account.id !== id);
  if (sessionCache?.id === id) sessionCache = null;
  notify();
}

export async function updateProfile(id: string, patch: { name?: string; phone?: string; avatarUrl?: string; notificationEmail?: boolean }) {
  const account = await apiRequest<Account>("update", "accounts", { id, patch });
  if (sessionCache?.id === id) sessionCache = account;
  accountsCache = accountsCache.map((item) => item.id === id ? account : item);
  notify();
  return account;
}
