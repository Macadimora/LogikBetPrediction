"use client";

import { useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsListProps = {
  initialNotifications: NotificationItem[];
};

export default function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [markingAll, setMarkingAll] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.readAt
    ).length;

  async function markAsRead(
    notificationId: string
  ) {
    setError("");
    setUpdatingId(notificationId);

    try {
      const response = await fetch(
        "/api/account/notifications/read",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            notificationId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark notification as read."
        );
      }

      const readAt =
        data.notification?.readAt ||
        new Date().toISOString();

      setNotifications((current) =>
        current.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  readAt,
                }
              : notification
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    setError("");
    setMarkingAll(true);

    try {
      const response = await fetch(
        "/api/account/notifications/read",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            markAll: true,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark notifications as read."
        );
      }

      const readAt =
        new Date().toISOString();

      setNotifications((current) =>
        current.map(
          (notification) =>
            notification.readAt
              ? notification
              : {
                  ...notification,
                  readAt,
                }
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  if (
    notifications.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-theme-border bg-surface px-6 py-12 text-center sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-xl">
          🔔
        </div>

        <h2 className="mt-5 text-xl font-black tracking-tight text-text-primary">
          No notifications yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
          Your prediction, payment,
          subscription and account
          notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-theme-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
            Inbox status
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            {unreadCount === 0
              ? "You have no unread notifications."
              : `${unreadCount} unread notification${
                  unreadCount === 1
                    ? ""
                    : "s"
                }`}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={
              markAllAsRead
            }
            disabled={markingAll}
            className="inline-flex w-fit items-center justify-center rounded-xl border border-brand/30 bg-brand/[0.05] px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-hover/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markingAll
              ? "Marking..."
              : "Mark all as read"}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-400"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {notifications.map(
          (notification) => {
            const isUnread =
              !notification.readAt;

            return (
              <article
                key={
                  notification.id
                }
                className={`relative overflow-hidden rounded-3xl border p-5 transition sm:p-6 ${
                  isUnread
                    ? "border-brand/25 bg-brand/[0.045]"
                    : "border-theme-border bg-surface"
                }`}
              >
                {isUnread && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
                )}

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand-foreground">
                          New
                        </span>
                      )}

                      <span className="rounded-full border border-brand/15 bg-brand/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand">
                        {notification.type.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                      <span className="rounded-full border border-theme-border bg-surface-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {
                          notification.channel
                        }
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-black tracking-tight text-text-primary sm:text-xl">
                      {
                        notification.title
                      }
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
                      {
                        notification.message
                      }
                    </p>
                  </div>

                  <p className="shrink-0 text-xs leading-5 text-text-muted sm:text-right">
                    {new Date(
                      notification.createdAt
                    ).toLocaleString(
                      "en-NG"
                    )}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-theme-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-text-muted">
                    {notification.sentAt
                      ? `Sent ${new Date(
                          notification.sentAt
                        ).toLocaleString(
                          "en-NG"
                        )}`
                      : "Created"}
                  </p>

                  {isUnread ? (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        notification.id
                      }
                      onClick={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      className="w-fit text-left text-sm font-bold text-brand transition hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:text-right"
                    >
                      {updatingId ===
                      notification.id
                        ? "Marking..."
                        : "Mark as read"}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-emerald-400">
                      ✓ Read
                    </span>
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>
    </div>
  );
}
