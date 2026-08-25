"use client";

import * as React from "react";

export type NotificationAudience = "admin" | "staff" | "user" | "all";

export type Notification = {
  id: string;

  audience: NotificationAudience;

  accountId?: string;

  title: string;

  body: string;

  createdAt: string;

  read: boolean;

  href?: string;
};

const STORAGE_KEY = "acab-notifications";

const EVENT = "acab-notifications-change";

const SEED: Notification[] = [];

let cache: Notification[] | null = null;

function loadFromStorage(): Notification[] {
  if (typeof window === "undefined") {
    return SEED;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));

      return SEED;
    }

    return JSON.parse(raw) as Notification[];
  } catch {
    return SEED;
  }
}

function getSnapshot(): Notification[] {
  if (cache === null) {
    cache = loadFromStorage();
  }

  return cache;
}

function write(next: Notification[]) {
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

export function addNotification(input: {
  audience: NotificationAudience;
  accountId?: string;
  title: string;
  body: string;
  href?: string;
}) {
  const notification: Notification = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `notification-${Date.now()}`,

    audience: input.audience,

    accountId: input.accountId,

    title: input.title,

    body: input.body,

    createdAt: new Date().toISOString(),

    read: false,

    href: input.href,
  };

  write([notification, ...getSnapshot()]);

  return notification;
}

export function useNotifications(
  audience: "admin" | "staff" | "user",

  accountId?: string,
) {
  const notifications = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SEED,
  );

  return notifications.filter((notification) => {
    if (notification.audience === "all") {
      return true;
    }

    if (notification.audience !== audience) {
      return false;
    }

    /*
     * General notification for a role.
     */
    if (!notification.accountId) {
      return true;
    }

    /*
     * Account-specific notification.
     */
    return notification.accountId === accountId;
  });
}

export function useUnreadCount(
  audience: "admin" | "staff" | "user",

  accountId?: string,
) {
  return useNotifications(audience, accountId).filter(
    (notification) => !notification.read,
  ).length;
}

export function markRead(id: string) {
  write(
    getSnapshot().map((notification) =>
      notification.id === id
        ? {
            ...notification,
            read: true,
          }
        : notification,
    ),
  );
}

export function markAllRead(
  audience: "admin" | "staff" | "user",

  accountId?: string,
) {
  write(
    getSnapshot().map((notification) => {
      const audienceMatches =
        notification.audience === audience || notification.audience === "all";

      const accountMatches =
        !notification.accountId || notification.accountId === accountId;

      if (audienceMatches && accountMatches) {
        return {
          ...notification,
          read: true,
        };
      }

      return notification;
    }),
  );
}
