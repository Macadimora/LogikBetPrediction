import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  await expireOldSubscriptions();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,

      subscriptions: {
        select: {
          id: true,
          plan: true,
          status: true,
          startsAt: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      payments: {
        where: {
          status: "SUCCESS",
        },
        select: {
          id: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();

  const getActiveSubscription = (
    subscriptions: (typeof users)[number]["subscriptions"]
  ) => {
    return subscriptions.find(
      (subscription) =>
        subscription.status === "ACTIVE" &&
        (!subscription.expiresAt ||
          subscription.expiresAt > now)
    );
  };

  const getPendingSubscription = (
    subscriptions: (typeof users)[number]["subscriptions"]
  ) => {
    return subscriptions
      .filter(
        (subscription) =>
          subscription.status === "PENDING" &&
          (!subscription.expiresAt ||
            subscription.expiresAt > now)
      )
      .sort((a, b) => {
        const aStart =
          a.startsAt?.getTime() ??
          Number.MAX_SAFE_INTEGER;

        const bStart =
          b.startsAt?.getTime() ??
          Number.MAX_SAFE_INTEGER;

        return aStart - bStart;
      })[0];
  };

  function formatDate(
    value: Date | null | undefined
  ) {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
      }
    ).format(value);
  }

  const totalUsers = users.length;

  const vipUsers = users.filter(
    (user) =>
      !!getActiveSubscription(
        user.subscriptions
      )
  ).length;

  const freeUsers =
    totalUsers - vipUsers;

  const adminUsers =
    users.filter(
      (user) =>
        user.role === "ADMIN"
    ).length;

  const totalSuccessfulPayments =
    users.reduce(
      (total, user) =>
        total +
        user.payments.length,
      0
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.05] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[600px] h-[620px] w-[620px] rounded-full bg-blue-500/[0.04] blur-[170px]" />

      <AdminHeader activePage="users" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              User Management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Users & Subscriptions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Review registered users,
              active VIP access,
              queued subscriptions and
              successful payment activity.
            </p>
          </div>

          <Link
            href="/admin/payments"
            className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            View Payments →
          </Link>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-theme-border bg-surface p-5">
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-black">
              {totalUsers}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Registered accounts
            </p>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-brand">
              VIP Users
            </p>

            <p className="mt-2 text-3xl font-black text-brand">
              {vipUsers}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Active subscribers
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface p-5">
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Free Users
            </p>

            <p className="mt-2 text-3xl font-black">
              {freeUsers}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              No active VIP
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-purple-400">
              Administrators
            </p>

            <p className="mt-2 text-3xl font-black text-purple-300">
              {adminUsers}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Admin accounts
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Successful Payments
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-300">
              {totalSuccessfulPayments}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Completed transactions
            </p>
          </div>
        </section>

        {/* Users */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Accounts
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Registered Users
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                Select a user to review
                their full account,
                subscription and payment
                information.
              </p>
            </div>

            <p className="text-xs font-semibold text-text-muted">
              {totalUsers} account
              {totalUsers === 1
                ? ""
                : "s"}
            </p>
          </div>

          {users.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-2xl">
                👥
              </div>

              <h3 className="mt-5 text-xl font-black">
                No users yet
              </h3>

              <p className="mt-2 text-sm text-text-muted">
                Registered accounts
                will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-3xl border border-theme-border bg-surface lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="border-b border-theme-border bg-surface">
                      <tr className="text-xs font-black uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-4">
                          User
                        </th>

                        <th className="px-5 py-4">
                          Role
                        </th>

                        <th className="px-5 py-4">
                          Plan
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Expires
                        </th>

                        <th className="px-5 py-4">
                          Next Subscription
                        </th>

                        <th className="px-5 py-4 text-center">
                          Payments
                        </th>

                        <th className="px-5 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-theme-border">
                      {users.map(
                        (user) => {
                          const activeSubscription =
                            getActiveSubscription(
                              user.subscriptions
                            );

                          const pendingSubscription =
                            getPendingSubscription(
                              user.subscriptions
                            );

                          const hasActiveVip =
                            !!activeSubscription;

                          const initial =
                            (
                              user.name ||
                              user.email ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase();

                          return (
                            <tr
                              key={
                                user.id
                              }
                              className="transition hover:bg-surface"
                            >
                              <td className="px-5 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-sm font-black text-text-secondary">
                                    {
                                      initial
                                    }
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-bold text-text-primary">
                                      {user.name ||
                                        "Unnamed User"}
                                    </p>

                                    <p className="mt-1 max-w-56 truncate text-xs text-text-muted">
                                      {
                                        user.email
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={
                                    user.role ===
                                    "ADMIN"
                                      ? "rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-purple-400"
                                      : "rounded-full border border-theme-border bg-surface-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary"
                                  }
                                >
                                  {
                                    user.role
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <p className="font-bold text-text-primary">
                                  {hasActiveVip
                                    ? activeSubscription?.plan ===
                                      "MONTHLY"
                                      ? "Monthly VIP"
                                      : "Weekly VIP"
                                    : "FREE"}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={
                                    hasActiveVip
                                      ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400"
                                      : "rounded-full border border-theme-border bg-surface-soft px-3 py-1 text-[10px] font-black uppercase tracking-wider text-text-muted"
                                  }
                                >
                                  {hasActiveVip
                                    ? "ACTIVE"
                                    : "FREE"}
                                </span>
                              </td>

                              <td className="px-5 py-5 text-sm text-text-secondary">
                                {formatDate(
                                  activeSubscription?.expiresAt
                                )}
                              </td>

                              <td className="px-5 py-5">
                                {pendingSubscription ? (
                                  <div>
                                    <p className="font-bold text-amber-400">
                                      {pendingSubscription.plan ===
                                      "MONTHLY"
                                        ? "Monthly VIP"
                                        : "Weekly VIP"}
                                    </p>

                                    <p className="mt-1 text-xs text-text-muted">
                                      {pendingSubscription.startsAt
                                        ? `Starts ${formatDate(
                                            pendingSubscription.startsAt
                                          )}`
                                        : "Pending"}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-text-muted">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-5 text-center">
                                <span className="inline-flex min-w-8 justify-center rounded-lg bg-surface-soft px-2.5 py-1.5 text-xs font-black text-text-secondary">
                                  {
                                    user
                                      .payments
                                      .length
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <Link
                                  href={`/admin/users/${user.id}`}
                                  className="inline-flex rounded-xl border border-brand/20 bg-brand/[0.07] px-4 py-2 text-xs font-black text-brand transition hover:bg-brand/[0.12]"
                                >
                                  View User →
                                </Link>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-4 lg:hidden">
                {users.map(
                  (user) => {
                    const activeSubscription =
                      getActiveSubscription(
                        user.subscriptions
                      );

                    const pendingSubscription =
                      getPendingSubscription(
                        user.subscriptions
                      );

                    const hasActiveVip =
                      !!activeSubscription;

                    const initial =
                      (
                        user.name ||
                        user.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <article
                        key={user.id}
                        className="rounded-3xl border border-theme-border bg-surface p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft font-black text-text-secondary">
                            {
                              initial
                            }
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black">
                                {user.name ||
                                  "Unnamed User"}
                              </h3>

                              {user.role ===
                                "ADMIN" && (
                                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-400">
                                  Admin
                                </span>
                              )}
                            </div>

                            <p className="mt-1 break-all text-xs text-text-muted">
                              {
                                user.email
                              }
                            </p>
                          </div>

                          <span
                            className={
                              hasActiveVip
                                ? "rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[9px] font-black uppercase text-brand"
                                : "rounded-full border border-theme-border bg-surface-soft px-2.5 py-1 text-[9px] font-black uppercase text-text-muted"
                            }
                          >
                            {hasActiveVip
                              ? "VIP"
                              : "FREE"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-theme-border bg-surface-soft p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Plan
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {hasActiveVip
                                ? activeSubscription?.plan ===
                                  "MONTHLY"
                                  ? "Monthly VIP"
                                  : "Weekly VIP"
                                : "FREE"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-theme-border bg-surface-soft p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Payments
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {
                                user
                                  .payments
                                  .length
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-theme-border bg-surface-soft p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Expires
                            </p>

                            <p className="mt-1 text-sm font-bold text-text-secondary">
                              {formatDate(
                                activeSubscription?.expiresAt
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl border border-theme-border bg-surface-soft p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Status
                            </p>

                            <p
                              className={`mt-1 text-sm font-bold ${
                                hasActiveVip
                                  ? "text-emerald-400"
                                  : "text-text-secondary"
                              }`}
                            >
                              {hasActiveVip
                                ? "ACTIVE"
                                : "FREE"}
                            </p>
                          </div>
                        </div>

                        {pendingSubscription && (
                          <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                              Next Subscription
                            </p>

                            <p className="mt-1 text-sm font-bold text-text-primary">
                              {pendingSubscription.plan ===
                              "MONTHLY"
                                ? "Monthly VIP"
                                : "Weekly VIP"}
                            </p>

                            <p className="mt-1 text-xs text-text-muted">
                              {pendingSubscription.startsAt
                                ? `Starts ${formatDate(
                                    pendingSubscription.startsAt
                                  )}`
                                : "Pending activation"}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/admin/users/${user.id}`}
                          className="mt-4 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-black text-brand-foreground transition hover:bg-brand-hover"
                        >
                          View User Details
                        </Link>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-8 pb-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}