import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";
import Link from "next/link";
import UserHeader from "@/components/UserHeader";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const paymentStatus = params.payment;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const now = new Date();

  await expireOldSubscriptions(
    session.user.id
  );

  const activeSubscription =
    await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
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

  const isVip = !!activeSubscription;

  const unreadNotificationCount =
    await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });

  const payments =
    await prisma.payment.findMany({
      where: {
        userId: session.user.id,
      },

      include: {
        subscription: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 10,
    });

  /*
   * Every published match is visible to every user.
   * VIP controls access to deeper prediction details.
   *
   * For free members, premium-only fields are not fetched at all.
   */
  const predictions = isVip
    ? await prisma.prediction.findMany({
        where: {
          status: "PUBLISHED",
          pHome: { not: null },
          pDraw: { not: null },
          pAway: { not: null },
        },
        select: {
          id: true,
          title: true,
          pHome: true,
          pDraw: true,
          pAway: true,
          predictedHomeScore: true,
          predictedAwayScore: true,
          confidence: true,
          analysis: true,
          fixture: {
            select: {
              leagueName: true,
              homeTeam: true,
              awayTeam: true,
              kickoffTime: true,
            },
          },
        },
        orderBy: { fixture: { kickoffTime: "desc" } },
        take: 100,
      })
    : (
        await prisma.prediction.findMany({
          where: {
            status: "PUBLISHED",
            pHome: { not: null },
            pDraw: { not: null },
            pAway: { not: null },
          },
          select: {
            id: true,
            title: true,
            pHome: true,
            pDraw: true,
            pAway: true,
            fixture: {
              select: {
                leagueName: true,
                homeTeam: true,
                awayTeam: true,
                kickoffTime: true,
              },
            },
          },
          orderBy: { fixture: { kickoffTime: "desc" } },
          take: 100,
        })
      ).map((prediction) => ({
        ...prediction,
        predictedHomeScore: null,
        predictedAwayScore: null,
        confidence: null,
        analysis: null,
      }));

  function percentage(
    value: number | null
  ) {
    if (value === null) {
      return "—";
    }

    return `${(
      value * 100
    ).toFixed(1)}%`;
  }

  function getPrediction(
    homeTeam: string,
    awayTeam: string,
    pHome: number | null,
    pDraw: number | null,
    pAway: number | null
  ) {
    if (
      pHome === null ||
      pDraw === null ||
      pAway === null
    ) {
      return "No prediction";
    }

    const highest = Math.max(
      pHome,
      pDraw,
      pAway
    );

    if (highest === pHome) {
      return `${homeTeam} Win`;
    }

    if (highest === pAway) {
      return `${awayTeam} Win`;
    }

    return "Draw";
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
      }
    ).format(date);
  }

  function formatKickoff(date: Date) {
    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  }

  const visiblePredictionCount = predictions.length;

  const displayName =
    session.user.name ||
    "User";

  const firstName =
    displayName.split(" ")[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-brand/[0.07] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[500px] h-[600px] w-[600px] rounded-full bg-blue-500/[0.06] blur-[160px]" />

      {/* Dashboard navigation */}
      <UserHeader
  activePage="dashboard"
  unreadNotificationCount={
    unreadNotificationCount
  }
/>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Payment status */}
        {paymentStatus ===
          "success" && (
          <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 font-black text-emerald-400">
                ✓
              </div>

              <div>
                <h2 className="font-bold text-emerald-300">
                  Payment successful
                </h2>

                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Your payment was
                  verified successfully
                  and your VIP
                  subscription has been
                  updated.
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus ===
          "failed" && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 font-black text-red-400">
                ×
              </div>

              <div>
                <h2 className="font-bold text-red-300">
                  Payment unsuccessful
                </h2>

                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  We could not verify
                  your payment. Your VIP
                  subscription has not
                  been activated.
                </p>

                <Link
                  href="/subscribe"
                  className="mt-3 inline-flex text-sm font-bold text-brand transition hover:text-brand-hover"
                >
                  Try again →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Welcome area */}
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-text-muted">
                Dashboard
              </span>

              <span className="text-text-muted">
                /
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  isVip
                    ? "bg-brand/10 text-brand"
                    : "bg-surface-soft text-text-secondary"
                }`}
              >
                {isVip
                  ? "VIP MEMBER"
                  : "FREE MEMBER"}
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Welcome back,{" "}
              <span className="text-brand">
                {firstName}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Track your football
              predictions, subscription
              and account activity from
              one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/account"
              className="rounded-xl border border-theme-border bg-surface px-4 py-3 text-sm font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
            >
              Manage Account
            </Link>

            <Link
              href="/subscribe"
              className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
            >
              {isVip
                ? "Extend VIP"
                : "Get VIP"}
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Subscription */}
          <div className="group rounded-2xl border border-theme-border bg-surface p-5 transition hover:border-theme-border hover:bg-surface-soft">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-lg">
                ★
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  isVip
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-surface-soft text-text-muted"
                }`}
              >
                {isVip
                  ? "Active"
                  : "Free"}
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Subscription
            </p>

            <h2 className="mt-2 text-xl font-black">
              {isVip
                ? activeSubscription?.plan ===
                  "MONTHLY"
                  ? "Monthly VIP"
                  : "Weekly VIP"
                : "Free Plan"}
            </h2>

            <p className="mt-2 min-h-10 text-xs leading-5 text-text-muted">
              {isVip &&
              activeSubscription?.expiresAt
                ? `Expires ${formatDate(
                    activeSubscription.expiresAt
                  )}`
                : "Upgrade to unlock full prediction details."}
            </p>
          </div>

          {/* Predictions */}
          <div className="group rounded-2xl border border-theme-border bg-surface p-5 transition hover:border-theme-border hover:bg-surface-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
              ⚽
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Predictions
            </p>

            <h2 className="mt-2 text-xl font-black">
              {visiblePredictionCount}
            </h2>

            <p className="mt-2 min-h-10 text-xs leading-5 text-text-muted">
              {isVip
                ? "All published matches with full VIP prediction details."
                : "All published matches with free main picks."}
            </p>
          </div>

          {/* Notifications */}
          <div className="group rounded-2xl border border-theme-border bg-surface p-5 transition hover:border-theme-border hover:bg-surface-soft">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-lg">
                🔔
              </div>

              {unreadNotificationCount >
                0 && (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-black text-brand-foreground">
                  NEW
                </span>
              )}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Notifications
            </p>

            <h2 className="mt-2 text-xl font-black">
              {unreadNotificationCount}
              <span className="ml-1 text-sm font-medium text-text-muted">
                unread
              </span>
            </h2>

            <Link
              href="/notifications"
              className="mt-2 inline-flex text-xs font-bold text-brand transition hover:text-brand-hover"
            >
              View notifications →
            </Link>
          </div>

          {/* Account */}
          <div className="group rounded-2xl border border-theme-border bg-surface p-5 transition hover:border-theme-border hover:bg-surface-soft">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg">
                ✓
              </div>

              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Active
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Account
            </p>

            <h2 className="mt-2 truncate text-xl font-black">
              {displayName}
            </h2>

            <p className="mt-2 truncate text-xs text-text-muted">
              {session.user.email}
            </p>
          </div>
        </section>

        {/* Predictions header */}
        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Prediction Center
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Latest Predictions
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                {isVip
                  ? "All published matches with full prediction details unlocked."
                  : "All published matches are visible. Upgrade to unlock the full details."}
              </p>
            </div>

            {!isVip && (
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.07] px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-hover/[0.12]"
              >
                Unlock VIP Details →
              </Link>
            )}
          </div>

          {visiblePredictionCount ===
          0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-2xl">
                ⚽
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No predictions available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
                There are no published
                predictions available
                right now. Check back
                again soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {predictions.map((prediction) => {
                const fixture = prediction.fixture;

                const selectedPrediction = getPrediction(
                  fixture.homeTeam,
                  fixture.awayTeam,
                  prediction.pHome,
                  prediction.pDraw,
                  prediction.pAway
                );

                const mainPickProbability = Math.max(
                  prediction.pHome ?? 0,
                  prediction.pDraw ?? 0,
                  prediction.pAway ?? 0
                );

                return (
                  <article
                    key={prediction.id}
                    className="group overflow-hidden rounded-3xl border border-theme-border bg-surface transition hover:border-theme-border hover:bg-surface-soft"
                  >
                    <div className="border-b border-theme-border px-5 py-4 sm:px-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-text-secondary">
                            {fixture.leagueName}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {formatKickoff(fixture.kickoffTime)}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          FREE PICK
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <div>
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-theme-border bg-surface-soft text-sm font-black text-text-secondary">
                            H
                          </div>
                          <p className="font-bold leading-snug">{fixture.homeTeam}</p>
                          <p className="mt-1 text-xs text-text-muted">Home</p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-theme-border bg-surface-soft text-[10px] font-black text-text-muted">
                          VS
                        </div>

                        <div className="text-right">
                          <div className="mb-3 ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-theme-border bg-surface-soft text-sm font-black text-text-secondary">
                            A
                          </div>
                          <p className="font-bold leading-snug">{fixture.awayTeam}</p>
                          <p className="mt-1 text-xs text-text-muted">Away</p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500/70">
                              AI Main Pick
                            </p>
                            <p className="mt-1.5 font-black">{selectedPrediction}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-text-muted">
                              Probability
                            </p>
                            <p className="mt-1 text-lg font-black text-emerald-400">
                              {percentage(mainPickProbability)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {isVip ? (
                        <>
                          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="rounded-xl border border-theme-border bg-surface-soft p-3 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Home</p>
                              <p className="mt-1.5 text-base font-black">{percentage(prediction.pHome)}</p>
                            </div>
                            <div className="rounded-xl border border-theme-border bg-surface-soft p-3 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Draw</p>
                              <p className="mt-1.5 text-base font-black">{percentage(prediction.pDraw)}</p>
                            </div>
                            <div className="rounded-xl border border-theme-border bg-surface-soft p-3 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Away</p>
                              <p className="mt-1.5 text-base font-black">{percentage(prediction.pAway)}</p>
                            </div>
                          </div>

                          {prediction.predictedHomeScore !== null &&
                            prediction.predictedAwayScore !== null && (
                              <div className="mt-4 flex items-center justify-between rounded-xl border border-theme-border bg-surface px-4 py-3">
                                <p className="text-xs font-semibold text-text-muted">Predicted Score</p>
                                <p className="font-black">
                                  {prediction.predictedHomeScore}
                                  <span className="mx-1 text-text-muted">-</span>
                                  {prediction.predictedAwayScore}
                                </p>
                              </div>
                            )}

                          {prediction.confidence !== null && (
                            <div className="mt-4 flex items-center justify-between rounded-xl border border-theme-border bg-surface px-4 py-3">
                              <p className="text-xs font-semibold text-text-muted">AI Confidence</p>
                              <p className="font-black">{percentage(prediction.confidence)}</p>
                            </div>
                          )}

                          {prediction.title && (
                            <div className="mt-5">
                              <h3 className="font-bold">{prediction.title}</h3>
                            </div>
                          )}

                          {prediction.analysis && (
                            <div className="mt-3 border-t border-theme-border pt-4">
                              <p className="text-sm leading-6 text-text-secondary">
                                {prediction.analysis}
                              </p>
                            </div>
                          )}

                          <div className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                            ◆ VIP details unlocked
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-brand/15 bg-brand/[0.05] p-5">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">🔒</span>
                            <div>
                              <p className="font-bold">VIP prediction details</p>
                              <p className="mt-1 text-sm leading-6 text-text-muted">
                                Unlock correct score, full Home/Draw/Away probabilities,
                                AI confidence and detailed analysis.
                              </p>
                            </div>
                          </div>

                          <Link
                            href="/subscribe"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
                          >
                            Unlock VIP Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
             </div>

          )}
        </section>

        {/* VIP CTA */}
        {!isVip && (
          <section className="relative mt-12 overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/[0.12] via-surface to-surface-soft p-6 sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-[90px]" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                  VIP Access
                </span>

                <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                  Unlock the full prediction details.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary">
                  Every match and its main pick stays visible for free. VIP unlocks full probabilities, predicted score, confidence and analysis.
                </p>
              </div>

              <Link
                href="/subscribe"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-black text-brand-foreground transition hover:bg-brand-hover"
              >
                View VIP Plans →
              </Link>
            </div>
          </section>
        )}

        {/* Payments */}
        <section className="mt-12 pb-10">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                Billing
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Payment History
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                Your recent VIP
                subscription payments.
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-theme-border bg-surface p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-soft">
                ₦
              </div>

              <h3 className="mt-4 font-bold">
                No payments yet
              </h3>

              <p className="mt-2 text-sm text-text-muted">
                Your VIP subscription
                payments will appear here.
              </p>

              {!isVip && (
                <Link
                  href="/subscribe"
                  className="mt-5 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
                >
                  View VIP Plans
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-theme-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-theme-border bg-surface">
                    <tr className="text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-5 py-4 font-semibold sm:px-6">
                        Date
                      </th>

                      <th className="px-5 py-4 font-semibold sm:px-6">
                        Plan
                      </th>

                      <th className="px-5 py-4 font-semibold sm:px-6">
                        Amount
                      </th>

                      <th className="px-5 py-4 font-semibold sm:px-6">
                        Provider
                      </th>

                      <th className="px-5 py-4 font-semibold sm:px-6">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-theme-border">
                    {payments.map(
                      (payment) => (
                        <tr
                          key={
                            payment.id
                          }
                          className="transition hover:bg-surface"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-text-secondary sm:px-6">
                            {formatDate(
                              payment.createdAt
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-text-secondary sm:px-6">
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

                          <td className="whitespace-nowrap px-5 py-4 font-bold sm:px-6">
                            ₦
                            {(
                              payment.amount /
                              100
                            ).toLocaleString(
                              "en-NG"
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-text-secondary sm:px-6">
                            {
                              payment.provider
                            }
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                                payment.status ===
                                "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : payment.status ===
                                      "FAILED"
                                    ? "bg-red-500/10 text-red-400"
                                    : payment.status ===
                                        "REFUNDED"
                                      ? "bg-purple-500/10 text-purple-400"
                                      : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {
                                payment.status
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
