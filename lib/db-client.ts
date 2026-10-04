"use client";

import * as React from "react";

export type DbEntity =
  | "accounts"
  | "clients"
  | "materials"
  | "categories"
  | "suppliers"
  | "inquiries"
  | "quotations"
  | "orders"
  | "delivery_receipts"
  | "stock_in"
  | "stock_out"
  | "checklists"
  | "checklist_items"
  | "ledger_entries"
  | "notifications"
  | "transactions"
  | "addresses";

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_URLS = [
  CONFIGURED_API_URL,
  "http://localhost/acab-wcim-api/api.php",
  "http://127.0.0.1/acab-wcim-api/api.php",
  "http://localhost/acab-wcim/api/api.php",
  "http://localhost/acab-wcim-api/api/api.php",
  "http://localhost/api/api.php",
].filter((value, index, list): value is string =>
  Boolean(value) && list.indexOf(value) === index,
);

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const caches = new Map<string, unknown[]>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<unknown[]>>();

// React useSyncExternalStore requires getSnapshot/getServerSnapshot to return
// the same cached value until the store actually changes. Returning a fresh
// [] on every call causes React to detect a change forever and can produce
// "The result of getServerSnapshot should be cached" and
// "Maximum update depth exceeded" errors.
const EMPTY_COLLECTION: unknown[] = [];

function notify(entity: string) {
  listeners.get(entity)?.forEach((listener) => listener());
}

export function getCollection<T>(entity: DbEntity): T[] {
  return (caches.get(entity) as T[] | undefined) ?? (EMPTY_COLLECTION as T[]);
}

function setCollection<T>(entity: DbEntity, rows: T[]) {
  caches.set(entity, rows as unknown[]);
  notify(entity);
}

export async function apiRequest<T>(
  action: string,
  entity?: DbEntity,
  payload?: Record<string, unknown>,
): Promise<T> {
  let lastNetworkError: unknown = null;

  for (const apiUrl of API_URLS) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action !== "transaction_status" && entity ? { entity } : {}),
          ...(payload ?? {}),
        }),
        cache: "no-store",
      });

      const text = await response.text();
      let result: ApiResponse<T>;
      try {
        result = text ? (JSON.parse(text) as ApiResponse<T>) : { ok: false, error: "Empty API response." };
      } catch {
        const preview = text.replace(/\s+/g, " ").slice(0, 220);
        throw new Error(`API returned ${response.status} with an invalid response: ${preview || "empty body"}`);
      }

      if (!response.ok || !result.ok) {
        throw new Error(result.error || `API request failed (${response.status}).`);
      }

      return result.data as T;
    } catch (error) {
      // Only retry a different endpoint for browser-level/network failures.
      // A valid API response containing an application/database error should
      // be surfaced immediately instead of hiding the real problem.
      const isNetworkFailure = error instanceof TypeError;
      if (!isNetworkFailure) throw error;
      lastNetworkError = error;
    }
  }

  const configured = CONFIGURED_API_URL ? `\nConfigured API URL: ${CONFIGURED_API_URL}` : "";
  throw new Error(
    `Unable to connect to the PHP API. Start XAMPP Apache and make sure api.php is inside htdocs. ${configured}`,
    { cause: lastNetworkError },
  );
}

export async function refreshCollection<T>(entity: DbEntity): Promise<T[]> {
  const existing = inflight.get(entity);
  if (existing) return existing as Promise<T[]>;

  const request = apiRequest<T[]>("list", entity)
    .then((rows) => {
      setCollection(entity, rows);
      return rows;
    })
    .finally(() => inflight.delete(entity));

  inflight.set(entity, request as Promise<unknown[]>);
  return request;
}

export async function createRecord<T extends { id: string }>(
  entity: DbEntity,
  value: T,
): Promise<T> {
  const current = getCollection<T>(entity);
  setCollection(entity, [value, ...current]);
  try {
    const saved = await apiRequest<T>("create", entity, { record: value });
    setCollection(
      entity,
      getCollection<T>(entity).map((row) => (row.id === value.id ? saved : row)),
    );
    return saved;
  } catch (error) {
    setCollection(
      entity,
      getCollection<T>(entity).filter((row) => row.id !== value.id),
    );
    throw error;
  }
}

export async function updateRecord<T = Record<string, unknown>>(
  entity: DbEntity,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const current = getCollection<T & { id: string }>(entity);
  const before = current.find((row) => row.id === id) ?? null;
  if (!before) return null;

  const optimistic = { ...before, ...patch } as T & { id: string };
  setCollection(
    entity,
    current.map((row) => (row.id === id ? optimistic : row)),
  );

  try {
    const saved = await apiRequest<T>("update", entity, { id, patch });
    setCollection(
      entity,
      getCollection<T & { id: string }>(entity).map((row) => (row.id === id ? saved : row)),
    );
    return saved;
  } catch (error) {
    setCollection(
      entity,
      getCollection<T & { id: string }>(entity).map((row) => (row.id === id ? before : row)),
    );
    throw error;
  }
}

export async function deleteRecord(entity: DbEntity, id: string) {
  const current = getCollection<{ id: string }>(entity);
  setCollection(entity, current.filter((row) => row.id !== id));
  try {
    await apiRequest("delete", entity, { id });
  } catch (error) {
    await refreshCollection(entity);
    throw error;
  }
}

export function subscribeCollection(entity: DbEntity, callback: () => void) {
  let set = listeners.get(entity);
  if (!set) {
    set = new Set();
    listeners.set(entity, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
  };
}

export function useDbCollection<T>(entity: DbEntity, enabled = true) {
  const snapshot = React.useSyncExternalStore(
    (callback) => subscribeCollection(entity, callback),
    () => getCollection<T>(entity),
    () => EMPTY_COLLECTION as T[],
  );

  React.useEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      void refreshCollection<T>(entity).catch(() => {
        // Keep the screen usable while PHP/XAMPP is being configured.
      });
    };

    refresh();

    const intervalId = window.setInterval(refresh, 10000);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (!document.hidden) refresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [entity, enabled]);

  return snapshot;
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fireAndForget(promise: Promise<unknown>) {
  void promise.catch((error) => {
    console.error("WCIM database request failed:", error);
  });
}
