"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  markAllRead,
  markRead,
  useNotifications,
  useUnreadCount,
} from "@/lib/notifications-store";

function relativeTime(createdAt: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsMenu({ role }: { role: "admin" | "staff" }) {
  const notifications = useNotifications(role);
  const unreadCount = useUnreadCount(role);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative transition-transform duration-200 hover:scale-105 active:scale-90"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]"
          >
            {unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => markAllRead(role)}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.map((notification) => {
              const content = (
                <div className="flex gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-primary"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {notification.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {notification.body}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                </div>
              );
              return notification.href ? (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => markRead(notification.id)}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification.id}
                  type="button"
                  className="w-full"
                  onClick={() => markRead(notification.id)}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
