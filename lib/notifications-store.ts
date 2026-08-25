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
const NOTIFICATIONS_EVENT = "acab-notifications-change";
const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "seed-admin-registration",
    audience: "admin",
    title: "New staff registration awaiting approval",
    body: "Jamie Cruz submitted an employee registration for review.",
    createdAt: "2026-08-18T14:30:00.000Z",
    read: false,
    href: "/approvals",
  },
  {
    id: "seed-staff-stock",
    audience: "staff",
    title: "Low stock: Cement",
    body: "Only 12 bags remain in warehouse inventory.",
    createdAt: "2026-08-20T08:15:00.000Z",
    read: false,
    href: "/staff/alerts",
  },
  {
    id: "seed-all-welcome",
    audience: "all",
    title: "Welcome to ACAB WCIM",
    body: "Your workspace is ready for the next project.",
    createdAt: "2026-08-15T09:00:00.000Z",
    read: true,
  },
];

let notificationsCache: Notification[] | null = null;

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return SEED_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(SEED_NOTIFICATIONS),
      );
      return SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw) as Notification[];
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

function getSnapshot() {
  if (notificationsCache === null) notificationsCache = loadNotifications();
  return notificationsCache;
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      notificationsCache = null;
      callback();
    }
  };
  window.addEventListener(NOTIFICATIONS_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function writeNotifications(next: Notification[]) {
  notificationsCache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

function matchesAudience(
  notification: Notification,
  audience: "admin" | "staff" | "user",
) {
  return notification.audience === audience || notification.audience === "all";
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
        : `notify-${Date.now()}`,
    audience: input.audience,
    accountId: input.accountId,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    read: false,
    href: input.href,
  };

  const next = [notification, ...getSnapshot()];
  writeNotifications(next);
  return notification;
}

export function useNotifications(audience: "admin" | "staff" | "user") {
  const notifications = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SEED_NOTIFICATIONS,
  );
  return notifications.filter((notification) => {
    if (audience === "user") {
      return (
        notification.audience === "user" ||
        notification.audience === "all" ||
        notification.accountId === undefined
      );
    }
    return matchesAudience(notification, audience);
  });
}

export function useUnreadCount(audience: "admin" | "staff" | "user") {
  return useNotifications(audience).filter((notification) => !notification.read)
    .length;
}

export function markAllRead(audience: "admin" | "staff" | "user") {
  writeNotifications(
    getSnapshot().map((notification) =>
      matchesAudience(notification, audience)
        ? { ...notification, read: true }
        : notification,
    ),
  );
}

export function markRead(id: string) {
  writeNotifications(
    getSnapshot().map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  );
}

export function getUserNotifications(accountId?: string) {
  return getSnapshot().filter(
    (notification) =>
      notification.audience === "user" ||
      notification.audience === "all" ||
      (notification.accountId !== undefined &&
        notification.accountId === accountId),
  );
}
