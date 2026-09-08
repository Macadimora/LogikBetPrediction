import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import UserHeader from "@/components/UserHeader";
import NotificationsList from "./NotificationsList";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const notifications =
    await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    });

  const serializedNotifications =
    notifications.map(
      (notification) => ({
        id: notification.id,

        type:
          notification.type,

        channel:
          notification.channel,

        title:
          notification.title,

        message:
          notification.message,

        sentAt:
          notification.sentAt
            ? notification.sentAt.toISOString()
            : null,

        readAt:
          notification.readAt
            ? notification.readAt.toISOString()
            : null,

        createdAt:
          notification.createdAt.toISOString(),
      })
    );

  const unreadCount =
    serializedNotifications.filter(
      (notification) =>
        !notification.readAt
    ).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-brand/[0.06] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[450px] h-[600px] w-[600px] rounded-full bg-blue-500/[0.05] blur-[160px]" />

      <UserHeader
        activePage="notifications"
        unreadNotificationCount={
          unreadCount
        }
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="flex flex-col gap-6 border-b border-theme-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Notification Center
              </p>

              {unreadCount > 0 && (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-black text-brand-foreground">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}{" "}
                  UNREAD
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Keep track of prediction
              updates, subscription
              activity, payments and
              important account messages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
            >
              ← Dashboard
            </Link>

            <Link
              href="/account"
              className="rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
            >
              Account
            </Link>
          </div>
        </section>

        {/* Overview */}
        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-theme-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-lg">
              🔔
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
              Total Notifications
            </p>

            <p className="mt-2 text-2xl font-black">
              {
                serializedNotifications.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-lg">
              ●
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
              Unread
            </p>

            <p className="mt-2 text-2xl font-black text-brand">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg">
              ✓
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
              Read
            </p>

            <p className="mt-2 text-2xl font-black">
              {serializedNotifications.length -
                unreadCount}
            </p>
          </div>
        </section>

        {/* Notification feed */}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
              Activity
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Recent Notifications
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Your most recent account
              and prediction updates.
            </p>
          </div>

          {serializedNotifications.length ===
          0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-2xl">
                🔔
              </div>

              <h3 className="mt-5 text-lg font-black">
                No notifications yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
                Prediction updates,
                subscription changes and
                account messages will
                appear here when they
                become available.
              </p>

              <Link
                href="/dashboard"
                className="mt-5 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-black text-brand-foreground transition hover:bg-brand-hover"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-theme-border bg-surface">
              <div className="border-b border-theme-border px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold">
                    Notification Feed
                  </p>

                  <span className="text-xs text-text-muted">
                    Showing up to 100
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <NotificationsList
                  initialNotifications={
                    serializedNotifications
                  }
                />
              </div>
            </div>
          )}
        </section>

        {/* Settings CTA */}
        <section className="mt-8 rounded-3xl border border-theme-border bg-surface p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
                Notification Preferences
              </p>

              <h2 className="mt-2 text-xl font-black">
                Control how you receive
                updates.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                Manage in-app, email and
                WhatsApp notification
                preferences from your
                account settings.
              </p>
            </div>

            <Link
              href="/account"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.07] px-5 py-3 text-sm font-bold text-brand transition hover:bg-brand-hover/[0.12]"
            >
              Manage Preferences →
            </Link>
          </div>
        </section>

        <div className="mt-8 pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
