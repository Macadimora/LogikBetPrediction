import Link from "next/link";
import { auth } from "@/auth";
import {
  redirect,
  notFound,
} from "next/navigation";

import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";
import AdminHeader from "@/components/AdminHeader";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailsPage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;

  await expireOldSubscriptions(
    id
  );

  const user =
    await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        subscriptions: {
          select: {
            id: true,
            plan: true,
            status: true,
            startsAt: true,
            expiresAt: true,
            provider: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },

        payments: {
          select: {
            id: true,
            amount: true,
            provider: true,
            status: true,
            reference: true,
            createdAt: true,

            subscription: {
              select: {
                plan: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!user) {
    notFound();
  }

  const now = new Date();

  const activeSubscription =
    user.subscriptions.find(
      (subscription) =>
        subscription.status ===
          "ACTIVE" &&
        (!subscription.expiresAt ||
          subscription.expiresAt >
            now)
    );

  function formatDate(
    value:
      | Date
      | null
      | undefined
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

  function formatAmount(
    amount: number
  ) {
    return `₦${(
      amount / 100
    ).toLocaleString("en-NG")}`;
  }

  function subscriptionStatusClass(
    status: string
  ) {
    if (status === "ACTIVE") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (status === "EXPIRED") {
      return "border-theme-border bg-surface-soft text-text-muted";
    }

    if (
      status === "CANCELLED"
    ) {
      return "border-red-500/20 bg-red-500/10 text-red-400";
    }

    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  function paymentStatusClass(
    status: string
  ) {
    if (status === "SUCCESS") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (status === "FAILED") {
      return "border-red-500/20 bg-red-500/10 text-red-400";
    }

    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  const successfulPayments =
    user.payments.filter(
      (payment) =>
        payment.status ===
        "SUCCESS"
    );

  const totalPaid =
    successfulPayments.reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  const pendingSubscriptions =
    user.subscriptions.filter(
      (subscription) =>
        subscription.status ===
        "PENDING"
    ).length;

  const userInitial = (
    user.name ||
    user.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.05] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[600px] h-[620px] w-[620px] rounded-full bg-blue-500/[0.04] blur-[170px]" />

      <AdminHeader activePage="users" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Link
            href="/admin"
            className="transition hover:text-text-primary"
          >
            Admin
          </Link>

          <span>/</span>

          <Link
            href="/admin/users"
            className="transition hover:text-text-primary"
          >
            Users
          </Link>

          <span>/</span>

          <span className="text-text-secondary">
            User Details
          </span>
        </div>

        {/* User heading */}
        <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-theme-border bg-surface-soft text-xl font-black text-text-secondary">
              {userInitial}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                  User Account
                </p>

                <span
                  className={
                    user.role ===
                    "ADMIN"
                      ? "rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-purple-400"
                      : "rounded-full border border-theme-border bg-surface-soft px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-text-muted"
                  }
                >
                  {user.role}
                </span>

                {activeSubscription && (
                  <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-brand">
                    VIP
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {user.name ||
                  "Unnamed User"}
              </h1>

              <p className="mt-2 break-all text-sm text-text-muted">
                {user.email}
              </p>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            Back to All Users
          </Link>
        </section>

        {/* Overview */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-theme-border bg-surface p-5">
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Account Role
            </p>

            <p className="mt-3 text-xl font-black">
              {user.role}
            </p>

            <p className="mt-2 text-xs text-text-muted">
              Joined{" "}
              {formatDate(
                user.createdAt
              )}
            </p>
          </article>

          <article
            className={`rounded-2xl border p-5 ${
              activeSubscription
                ? "border-brand/20 bg-brand/[0.05]"
                : "border-theme-border bg-surface"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-wider ${
                activeSubscription
                  ? "text-brand"
                  : "text-text-muted"
              }`}
            >
              Current Plan
            </p>

            <p className="mt-3 text-xl font-black">
              {activeSubscription
                ? activeSubscription.plan ===
                  "MONTHLY"
                  ? "Monthly VIP"
                  : "Weekly VIP"
                : "FREE"}
            </p>

            <p className="mt-2 text-xs text-text-muted">
              {activeSubscription?.expiresAt
                ? `Expires ${formatDate(
                    activeSubscription.expiresAt
                  )}`
                : activeSubscription
                  ? "No expiry date"
                  : "No active VIP subscription"}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Successful Payments
            </p>

            <p className="mt-3 text-xl font-black text-emerald-300">
              {
                successfulPayments.length
              }
            </p>

            <p className="mt-2 text-xs text-text-muted">
              {formatAmount(
                totalPaid
              )}{" "}
              successfully paid
            </p>
          </article>

          <article className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-sky-400">
              Subscriptions
            </p>

            <p className="mt-3 text-xl font-black text-sky-300">
              {
                user.subscriptions
                  .length
              }
            </p>

            <p className="mt-2 text-xs text-text-muted">
              {pendingSubscriptions}{" "}
              pending
            </p>
          </article>
        </section>

        {/* Current subscription */}
        <section className="mt-8 rounded-3xl border border-theme-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Subscription Status
              </p>

              <h2 className="mt-2 text-xl font-black">
                Current Access
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                Current subscription
                access for this account.
              </p>
            </div>

            {activeSubscription ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-brand/20 bg-brand/[0.07] px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand">
                    Active Plan
                  </p>

                  <p className="mt-1 font-black">
                    {activeSubscription.plan ===
                    "MONTHLY"
                      ? "Monthly VIP"
                      : "Weekly VIP"}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Status
                  </p>

                  <p className="mt-1 font-black text-emerald-300">
                    ACTIVE
                  </p>
                </div>

                <div className="rounded-2xl border border-theme-border bg-surface-soft px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                    Expires
                  </p>

                  <p className="mt-1 font-black text-text-secondary">
                    {activeSubscription.expiresAt
                      ? formatDate(
                          activeSubscription.expiresAt
                        )
                      : "No expiry"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-theme-border bg-surface-soft px-5 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                  Current Plan
                </p>

                <p className="mt-1 font-black text-text-secondary">
                  FREE
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Subscription history */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Membership
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Subscription History
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                All subscription
                records created for
                this user.
              </p>
            </div>

            <p className="hidden text-xs font-semibold text-text-muted sm:block">
              {
                user.subscriptions
                  .length
              }{" "}
              record
              {user.subscriptions
                .length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {user.subscriptions
            .length === 0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface p-10 text-center">
              <p className="font-bold">
                No subscription records
              </p>

              <p className="mt-2 text-sm text-text-muted">
                This user has not
                created a VIP
                subscription.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-hidden rounded-3xl border border-theme-border bg-surface md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-theme-border bg-surface">
                      <tr className="text-xs font-black uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-4">
                          Plan
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Started
                        </th>

                        <th className="px-5 py-4">
                          Expires
                        </th>

                        <th className="px-5 py-4">
                          Provider
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-theme-border">
                      {user.subscriptions.map(
                        (
                          subscription
                        ) => (
                          <tr
                            key={
                              subscription.id
                            }
                            className="transition hover:bg-surface-soft"
                          >
                            <td className="px-5 py-5 font-bold">
                              {subscription.plan ===
                              "MONTHLY"
                                ? "Monthly VIP"
                                : "Weekly VIP"}
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${subscriptionStatusClass(
                                  subscription.status
                                )}`}
                              >
                                {
                                  subscription.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-5 text-text-secondary">
                              {formatDate(
                                subscription.startsAt
                              )}
                            </td>

                            <td className="px-5 py-5 text-text-secondary">
                              {formatDate(
                                subscription.expiresAt
                              )}
                            </td>

                            <td className="px-5 py-5 text-text-secondary">
                              {subscription.provider ||
                                "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile */}
              <div className="grid gap-3 md:hidden">
                {user.subscriptions.map(
                  (
                    subscription
                  ) => (
                    <article
                      key={
                        subscription.id
                      }
                      className="rounded-2xl border border-theme-border bg-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">
                            {subscription.plan ===
                            "MONTHLY"
                              ? "Monthly VIP"
                              : "Weekly VIP"}
                          </p>

                          <p className="mt-1 text-xs text-text-muted">
                            {subscription.provider ||
                              "No provider"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${subscriptionStatusClass(
                            subscription.status
                          )}`}
                        >
                          {
                            subscription.status
                          }
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-surface-soft p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                            Started
                          </p>

                          <p className="mt-1 text-xs font-bold text-text-secondary">
                            {formatDate(
                              subscription.startsAt
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-soft p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                            Expires
                          </p>

                          <p className="mt-1 text-xs font-bold text-text-secondary">
                            {formatDate(
                              subscription.expiresAt
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {/* Payment history */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Transactions
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Payment History
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                All payment attempts
                recorded for this user.
              </p>
            </div>

            <p className="hidden text-xs font-semibold text-text-muted sm:block">
              {
                user.payments.length
              }{" "}
              transaction
              {user.payments.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          {user.payments.length ===
          0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface p-10 text-center">
              <p className="font-bold">
                No payment records
              </p>

              <p className="mt-2 text-sm text-text-muted">
                This user has no
                recorded payment
                activity.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-hidden rounded-3xl border border-theme-border bg-surface md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-theme-border bg-surface">
                      <tr className="text-xs font-black uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-4">
                          Date
                        </th>

                        <th className="px-5 py-4">
                          Plan
                        </th>

                        <th className="px-5 py-4">
                          Amount
                        </th>

                        <th className="px-5 py-4">
                          Provider
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Reference
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-theme-border">
                      {user.payments.map(
                        (payment) => (
                          <tr
                            key={
                              payment.id
                            }
                            className="transition hover:bg-surface-soft"
                          >
                            <td className="px-5 py-5 text-text-secondary">
                              {formatDate(
                                payment.createdAt
                              )}
                            </td>

                            <td className="px-5 py-5 font-bold">
                              {payment
                                .subscription
                                ?.plan ===
                              "MONTHLY"
                                ? "Monthly VIP"
                                : payment
                                      .subscription
                                      ?.plan ===
                                    "WEEKLY"
                                  ? "Weekly VIP"
                                  : "—"}
                            </td>

                            <td className="px-5 py-5 font-black text-text-primary">
                              {formatAmount(
                                payment.amount
                              )}
                            </td>

                            <td className="px-5 py-5 text-text-secondary">
                              {
                                payment.provider
                              }
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${paymentStatusClass(
                                  payment.status
                                )}`}
                              >
                                {
                                  payment.status
                                }
                              </span>
                            </td>

                            <td className="max-w-[220px] truncate px-5 py-5 font-mono text-xs text-text-muted">
                              {
                                payment.reference
                              }
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile */}
              <div className="grid gap-3 md:hidden">
                {user.payments.map(
                  (payment) => (
                    <article
                      key={
                        payment.id
                      }
                      className="rounded-2xl border border-theme-border bg-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">
                            {formatAmount(
                              payment.amount
                            )}
                          </p>

                          <p className="mt-1 text-xs text-text-muted">
                            {formatDate(
                              payment.createdAt
                            )}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${paymentStatusClass(
                            payment.status
                          )}`}
                        >
                          {
                            payment.status
                          }
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-surface-soft p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                            Plan
                          </p>

                          <p className="mt-1 text-xs font-bold text-text-secondary">
                            {payment
                              .subscription
                              ?.plan ===
                            "MONTHLY"
                              ? "Monthly VIP"
                              : payment
                                    .subscription
                                    ?.plan ===
                                  "WEEKLY"
                                ? "Weekly VIP"
                                : "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-soft p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                            Provider
                          </p>

                          <p className="mt-1 text-xs font-bold text-text-secondary">
                            {
                              payment.provider
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-surface-soft p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                          Reference
                        </p>

                        <p className="mt-1 break-all font-mono text-[11px] leading-5 text-text-muted">
                          {
                            payment.reference
                          }
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-8 pb-8">
          <Link
            href="/admin/users"
            className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
          >
            ← Back to Users
          </Link>
        </div>
      </div>
    </main>
  );
}
