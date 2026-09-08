import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";

import UserHeader from "@/components/UserHeader";
import PasswordForm from "./PasswordForm";
import NotificationPreferencesForm from "./NotificationPreferencesForm";
import ProfileForm from "./ProfileForm";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await expireOldSubscriptions(
    session.user.id
  );

  const now = new Date();

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

  if (!user) {
    redirect("/login");
  }

  const activeSubscription =
    await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",

        OR: [
          {
            expiresAt: null,
          },

          {
            expiresAt: {
              gt: now,
            },
          },
        ],
      },

      orderBy: {
        expiresAt: "desc",
      },
    });

  const pendingSubscriptions =
    await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: "PENDING",

        expiresAt: {
          gt: now,
        },
      },

      orderBy: {
        startsAt: "asc",
      },
    });

  const isVip =
    !!activeSubscription;

  function formatDate(
    date: Date,
    style: "medium" | "long" = "medium"
  ) {
    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: style,
      }
    ).format(date);
  }

  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-brand/[0.06] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[500px] h-[600px] w-[600px] rounded-full bg-blue-500/[0.05] blur-[160px]" />

      <UserHeader activePage="account" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Account Center
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              My Account
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Manage your profile,
              security, subscription and
              notification preferences.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            ← Dashboard
          </Link>
        </section>

        {/* Account overview */}
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Profile summary */}
          <article className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-xl font-black text-brand">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xl font-black">
                  {user.name ||
                    "User"}
                </p>

                <p className="mt-1 truncate text-sm text-text-muted">
                  {user.email ||
                    "No email"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    {user.role}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      isVip
                        ? "bg-brand/10 text-brand"
                        : "bg-surface-soft text-text-muted"
                    }`}
                  >
                    {isVip
                      ? "VIP Member"
                      : "Free Member"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-theme-border bg-surface-soft p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Account Type
                </p>

                <p className="mt-2 font-bold">
                  {user.role ===
                  "ADMIN"
                    ? "Administrator"
                    : "User"}
                </p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface-soft p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Member Since
                </p>

                <p className="mt-2 text-sm font-bold">
                  {formatDate(
                    user.createdAt
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-black text-emerald-400">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Account active
                  </p>

                  <p className="mt-0.5 text-xs text-text-muted">
                    Your account is
                    currently active.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Subscription */}
          <article className="relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 sm:p-7">
            {isVip && (
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand/10 blur-[80px]" />
            )}

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                    Current Subscription
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    {isVip
                      ? activeSubscription.plan ===
                        "MONTHLY"
                        ? "Monthly VIP"
                        : "Weekly VIP"
                      : "Free Plan"}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    isVip
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border border-theme-border bg-surface-soft text-text-muted"
                  }`}
                >
                  {isVip
                    ? "Active"
                    : "Free"}
                </span>
              </div>

              {isVip ? (
                <>
                  <div className="mt-7 rounded-2xl border border-brand/15 bg-brand/[0.05] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      VIP access expires
                    </p>

                    <p className="mt-2 text-xl font-black text-brand">
                      {activeSubscription.expiresAt
                        ? formatDate(
                            activeSubscription.expiresAt,
                            "long"
                          )
                        : "No expiry date"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      You currently have
                      full access to all
                      published VIP
                      predictions.
                    </p>
                  </div>

                  <Link
                    href="/subscribe"
                    className="mt-5 inline-flex rounded-xl border border-brand/20 bg-brand/[0.07] px-5 py-3 text-sm font-bold text-brand transition hover:bg-brand/[0.12]"
                  >
                    Extend VIP Access →
                  </Link>
                </>
              ) : (
                <div className="mt-7">
                  <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
                    <p className="text-sm leading-6 text-text-secondary">
                      Your account
                      currently has free
                      access. Upgrade to
                      VIP to unlock all
                      premium football
                      predictions,
                      probabilities and
                      analysis.
                    </p>
                  </div>

                  <Link
                    href="/subscribe"
                    className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover"
                  >
                    Upgrade to VIP →
                  </Link>
                </div>
              )}

              {/* Queued subscriptions */}
              {pendingSubscriptions.length >
                0 && (
                <div className="mt-7 border-t border-theme-border pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        Upcoming
                        subscriptions
                      </p>

                      <p className="mt-1 text-xs text-text-muted">
                        Your queued VIP
                        access.
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-400">
                      {
                        pendingSubscriptions.length
                      }{" "}
                      QUEUED
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {pendingSubscriptions.map(
                      (
                        subscription
                      ) => (
                        <div
                          key={
                            subscription.id
                          }
                          className="flex flex-col gap-3 rounded-2xl border border-theme-border bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-bold">
                              {subscription.plan ===
                              "MONTHLY"
                                ? "Monthly VIP"
                                : "Weekly VIP"}
                            </p>

                            {subscription.startsAt && (
                              <p className="mt-1 text-xs text-text-muted">
                                Starts{" "}
                                {formatDate(
                                  subscription.startsAt
                                )}
                              </p>
                            )}
                          </div>

                          <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                            Pending
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>

        {/* Settings */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Settings
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Account Settings
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Manage your personal
              information, security and
              communication preferences.
            </p>
          </div>

          <div className="space-y-5">
            {/* Profile settings */}
            <article className="overflow-hidden rounded-3xl border border-theme-border bg-surface">
              <div className="border-b border-theme-border p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                    ◉
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Profile Information
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      Update your
                      display name. Your
                      account email
                      remains protected.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <ProfileForm
                  initialName={
                    user.name || ""
                  }
                  email={
                    user.email || ""
                  }
                />
              </div>
            </article>

            {/* Password */}
            <article className="overflow-hidden rounded-3xl border border-theme-border bg-surface">
              <div className="border-b border-theme-border p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-lg">
                    🔒
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Password & Security
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      Enter your current
                      password before
                      choosing a new one.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <PasswordForm />
              </div>
            </article>

            {/* Notifications */}
            <article className="overflow-hidden rounded-3xl border border-theme-border bg-surface">
              <div className="border-b border-theme-border p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-lg">
                    🔔
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Notification
                      Preferences
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      Choose how you
                      would like to
                      receive prediction
                      and account
                      notifications.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <NotificationPreferencesForm />
              </div>
            </article>
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