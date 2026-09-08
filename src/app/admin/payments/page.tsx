import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminPaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      subscription: {
        select: {
          id: true,
          plan: true,
          status: true,
          startsAt: true,
          expiresAt: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const successfulPayments =
    payments.filter(
      (payment) =>
        payment.status === "SUCCESS"
    );

  const pendingPayments =
    payments.filter(
      (payment) =>
        payment.status === "PENDING"
    );

  const failedPayments =
    payments.filter(
      (payment) =>
        payment.status === "FAILED"
    );

  const refundedPayments =
    payments.filter(
      (payment) =>
        payment.status === "REFUNDED"
    );

  const totalRevenue =
    successfulPayments.reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  function formatAmount(
    amount: number
  ) {
    return `₦${(
      amount / 100
    ).toLocaleString("en-NG")}`;
  }

  function formatDate(
    value: Date
  ) {
    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(value);
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

    if (status === "REFUNDED") {
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";
    }

    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.05] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[600px] h-[620px] w-[620px] rounded-full bg-blue-500/[0.04] blur-[170px]" />

      <AdminHeader activePage="payments" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Transaction Management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Payments
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Monitor payment activity,
              subscription purchases,
              transaction status and
              revenue generated from
              successful payments.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            View Users →
          </Link>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Revenue
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-300">
              {formatAmount(
                totalRevenue
              )}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Successful payments
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Successful
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                successfulPayments.length
              }
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Completed
            </p>
          </article>

          <article className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-amber-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-amber-300">
              {
                pendingPayments.length
              }
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Awaiting confirmation
            </p>
          </article>

          <article className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-red-400">
              Failed
            </p>

            <p className="mt-2 text-3xl font-black text-red-300">
              {
                failedPayments.length
              }
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Unsuccessful
            </p>
          </article>

          <article className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-wider text-purple-400">
              Refunded
            </p>

            <p className="mt-2 text-3xl font-black text-purple-300">
              {
                refundedPayments.length
              }
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Returned payments
            </p>
          </article>
        </section>

        {/* Payment history */}
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Transactions
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Payment History
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                All recorded payment
                attempts, newest first.
              </p>
            </div>

            <p className="text-xs font-semibold text-text-muted">
              {payments.length}{" "}
              transaction
              {payments.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-2xl">
                ₦
              </div>

              <h3 className="mt-5 text-xl font-black">
                No payments yet
              </h3>

              <p className="mt-2 text-sm text-text-muted">
                Payment transactions
                will appear here after
                users begin purchasing
                VIP subscriptions.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-hidden rounded-3xl border border-theme-border bg-surface lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-left text-sm">
                    <thead className="border-b border-theme-border bg-surface">
                      <tr className="text-xs font-black uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-4">
                          User
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
                          Date
                        </th>

                        <th className="px-5 py-4">
                          Reference
                        </th>

                        <th className="px-5 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-theme-border">
                      {payments.map(
                        (payment) => {
                          const initial =
                            (
                              payment
                                .user
                                .name ||
                              payment
                                .user
                                .email ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase();

                          return (
                            <tr
                              key={
                                payment.id
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
                                    <p className="font-bold">
                                      {payment
                                        .user
                                        .name ||
                                        "Unnamed User"}
                                    </p>

                                    <p className="mt-1 max-w-52 truncate text-xs text-text-muted">
                                      {
                                        payment
                                          .user
                                          .email
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <p className="font-bold text-text-secondary">
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

                                {payment
                                  .subscription && (
                                  <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-text-muted">
                                    {
                                      payment
                                        .subscription
                                        .status
                                    }
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-5">
                                <p className="font-black text-text-primary">
                                  {formatAmount(
                                    payment.amount
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <span className="rounded-lg border border-theme-border bg-surface-soft px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-text-secondary">
                                  {
                                    payment.provider
                                  }
                                </span>
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

                              <td className="px-5 py-5 text-xs leading-5 text-text-secondary">
                                {formatDate(
                                  payment.createdAt
                                )}
                              </td>

                              <td className="max-w-[220px] truncate px-5 py-5 font-mono text-[11px] text-text-muted">
                                {
                                  payment.reference
                                }
                              </td>

                              <td className="px-5 py-5">
                                <Link
                                  href={`/admin/users/${payment.user.id}`}
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

              {/* Mobile */}
              <div className="grid gap-4 lg:hidden">
                {payments.map(
                  (payment) => {
                    const initial =
                      (
                        payment.user
                          .name ||
                        payment.user
                          .email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <article
                        key={payment.id}
                        className="rounded-3xl border border-theme-border bg-surface p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft font-black text-text-secondary">
                              {
                                initial
                              }
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black">
                                {payment
                                  .user
                                  .name ||
                                  "Unnamed User"}
                              </p>

                              <p className="mt-1 truncate text-xs text-text-muted">
                                {
                                  payment
                                    .user
                                    .email
                                }
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${paymentStatusClass(
                              payment.status
                            )}`}
                          >
                            {
                              payment.status
                            }
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Amount
                            </p>

                            <p className="mt-1 text-2xl font-black">
                              {formatAmount(
                                payment.amount
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Plan
                            </p>

                            <p className="mt-1 text-sm font-bold text-text-secondary">
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
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
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

                          <div className="rounded-xl bg-surface-soft p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                              Date
                            </p>

                            <p className="mt-1 text-xs font-bold leading-5 text-text-secondary">
                              {formatDate(
                                payment.createdAt
                              )}
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

                        <Link
                          href={`/admin/users/${payment.user.id}`}
                          className="mt-4 flex w-full items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.07] px-4 py-2.5 text-sm font-black text-brand transition hover:bg-brand/[0.12]"
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