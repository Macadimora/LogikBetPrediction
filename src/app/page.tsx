import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const LAGOS_TIME_ZONE = "Africa/Lagos";

function formatProbability(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function getMainPick(
  pHome: number | null,
  pDraw: number | null,
  pAway: number | null,
  homeTeam: string,
  awayTeam: string
) {
  if (pHome === null || pDraw === null || pAway === null) {
    return "Prediction unavailable";
  }

  const highest = Math.max(pHome, pDraw, pAway);

  if (highest === pHome) return `${homeTeam} to Win`;
  if (highest === pAway) return `${awayTeam} to Win`;

  return "Draw";
}

function getModelConfidence(
  confidence: number | null,
  pHome: number | null,
  pDraw: number | null,
  pAway: number | null
) {
  if (confidence !== null) return confidence;

  const probabilities = [pHome, pDraw, pAway].filter(
    (value): value is number => value !== null
  );

  return probabilities.length ? Math.max(...probabilities) : null;
}

function formatKickoff(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: LAGOS_TIME_ZONE,
  }).format(value);
}

export default async function Home() {
  const session = await auth();

  const now = new Date();

  const siteSettings =
    await prisma.siteSetting.findFirst({
      select: {
        siteName: true,
        heroHeading: true,
        heroHighlight: true,
        heroDescription: true,
      },
    });

  const siteName =
    siteSettings?.siteName?.trim() ||
    "LogikBetPrediction";

  const heroHeading =
    siteSettings?.heroHeading?.trim() ||
    "Football insights built for";

  const heroHighlight =
    siteSettings?.heroHighlight?.trim() ||
    "smarter decisions.";

  const heroDescription =
    siteSettings?.heroDescription?.trim() ||
    "Access daily football predictions powered by fixture data, probability analysis and structured match insights. Start free or unlock more with VIP.";

  let isVip = false;

  if (
    session?.user?.id &&
    session.user.role !== "ADMIN"
  ) {
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

        select: {
          id: true,
        },

        orderBy: {
          expiresAt: "desc",
        },
      });

    isVip = !!activeSubscription;
  }

  /*
   * Homepage prediction feed
   *
   * This intentionally follows the same broader logic used by the user
   * dashboard: published predictions are shown regardless of whether the
   * fixture is today, upcoming or recently played.
   *
   * Results are grouped by league below so the homepage remains easy to scan.
   */
  const freePredictions =
    await prisma.prediction.findMany({
      where: {
        status: "PUBLISHED",
        access: "FREE",

        pHome: {
          not: null,
        },

        pDraw: {
          not: null,
        },

        pAway: {
          not: null,
        },
      },

      select: {
        id: true,
        title: true,
        analysis: true,
        pHome: true,
        pDraw: true,
        pAway: true,
        predictedHomeScore: true,
        predictedAwayScore: true,
        confidence: true,

        fixture: {
          select: {
            leagueName: true,
            homeTeam: true,
            awayTeam: true,
            kickoffTime: true,
          },
        },
      },

      orderBy: {
        fixture: {
          kickoffTime: "desc",
        },
      },

      take: 60,
    });

  const unlockedVipPredictions =
    isVip
      ? await prisma.prediction.findMany({
          where: {
            status: "PUBLISHED",
            access: "VIP",

            pHome: {
              not: null,
            },

            pDraw: {
              not: null,
            },

            pAway: {
              not: null,
            },
          },

          select: {
            id: true,
            title: true,
            analysis: true,
            pHome: true,
            pDraw: true,
            pAway: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            confidence: true,

            fixture: {
              select: {
                leagueName: true,
                homeTeam: true,
                awayTeam: true,
                kickoffTime: true,
              },
            },
          },

          orderBy: {
            fixture: {
              kickoffTime: "desc",
            },
          },

          take: 40,
        })
      : [];

  /*
   * IMPORTANT:
   *
   * Non-VIP visitors receive ONLY public fixture metadata.
   * VIP probabilities, analysis, confidence and predicted scores are
   * deliberately never selected for locked predictions.
   */
  const lockedVipPredictions =
    !isVip
      ? await prisma.prediction.findMany({
          where: {
            status: "PUBLISHED",
            access: "VIP",

            pHome: {
              not: null,
            },

            pDraw: {
              not: null,
            },

            pAway: {
              not: null,
            },
          },

          select: {
            id: true,

            fixture: {
              select: {
                leagueName: true,
                homeTeam: true,
                awayTeam: true,
                kickoffTime: true,
              },
            },
          },

          orderBy: {
            fixture: {
              kickoffTime: "desc",
            },
          },

          take: 40,
        })
      : [];

  function groupByLeague<
    T extends {
      fixture: {
        leagueName: string | null;
      };
    }
  >(items: T[]) {
    return items.reduce<Record<string, T[]>>(
      (groups, item) => {
        const league =
          item.fixture.leagueName?.trim() ||
          "Other Competitions";

        if (!groups[league]) {
          groups[league] = [];
        }

        groups[league].push(item);

        return groups;
      },
      {}
    );
  }

  const freePredictionsByLeague =
    groupByLeague(freePredictions);

  const unlockedVipPredictionsByLeague =
    groupByLeague(unlockedVipPredictions);

  const lockedVipPredictionsByLeague =
    groupByLeague(lockedVipPredictions);

  const accountHref =
    session?.user?.role === "ADMIN"
      ? "/admin"
      : "/dashboard";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative border-b border-theme-border">
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand/10 blur-[120px]" />

          <div className="absolute right-0 top-20 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <div className="relative grid w-full gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28 xl:px-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-semibold text-brand sm:text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              Daily data-driven football predictions
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight min-[400px]:text-5xl sm:text-6xl lg:text-7xl">
              {heroHeading}
              <span className="text-brand">
                {" "}
                {heroHighlight}
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              {heroDescription}
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap sm:gap-4">
              {session?.user ? (
                <a
                  href={accountHref}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
                >
                  View Predictions
                </a>
              ) : (
                <a
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
                >
                  Start Free
                </a>
              )}

              <a
                href="#predictions"
                className="inline-flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-6 py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted min-[400px]:w-auto"
              >
                Latest Predictions
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm text-text-muted">
              <div>
                <span className="font-bold text-text-primary">
                  Daily
                </span>{" "}
                updates
              </div>

              <div>
                <span className="font-bold text-text-primary">
                  Free
                </span>{" "}
                predictions
              </div>

              <div>
                <span className="font-bold text-text-primary">
                  VIP
                </span>{" "}
                analysis
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[40px] bg-brand/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-theme-border bg-surface-soft p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    Live Prediction Board
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Latest insights
                  </h2>
                </div>

                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  Updated
                </span>
              </div>

              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-theme-border bg-surface-soft p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                    <span>
                      Probability Analysis
                    </span>

                    <span>
                      FREE
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
                    <div className="rounded-xl bg-surface-soft p-2.5 sm:p-3">
                      <p className="text-xs text-text-muted">
                        Home
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        52%
                      </p>
                    </div>

                    <div className="rounded-xl bg-surface-soft p-2.5 sm:p-3">
                      <p className="text-xs text-text-muted">
                        Draw
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        27%
                      </p>
                    </div>

                    <div className="rounded-xl bg-surface-soft p-2.5 sm:p-3">
                      <p className="text-xs text-text-muted">
                        Away
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        21%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                        VIP Access
                      </p>

                      <p className="mt-2 font-bold">
                        Advanced prediction
                        insights
                      </p>
                    </div>

                    <span className="shrink-0 text-2xl">
                      🔒
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    Unlock more predictions,
                    confidence insights and
                    full VIP analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-2xl border border-theme-border bg-surface-soft p-4 sm:p-5">
                    <p className="text-xs text-text-muted">
                      Free predictions
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {freePredictions.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-theme-border bg-surface-soft p-4 sm:p-5">
                    <p className="text-xs text-text-muted">
                      VIP predictions
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {isVip
                        ? unlockedVipPredictions.length
                        : lockedVipPredictions.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free predictions */}
      <section
        id="predictions"
        className="w-full px-4 py-20 sm:px-6 lg:px-8 xl:px-10"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Free Predictions
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Football predictions by league
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-text-secondary">
              Browse published free predictions grouped by competition.
              Recent and upcoming fixtures remain visible, just like in your dashboard.
            </p>
          </div>

          {!session?.user && (
            <a
              href="/register"
              className="text-sm font-bold text-brand transition hover:text-brand-hover"
            >
              Create free account →
            </a>
          )}
        </div>

        {freePredictions.length > 0 ? (
          <div className="mt-10 space-y-12">
            {Object.entries(
              freePredictionsByLeague
            ).map(
              ([league, predictions]) => (
                <section
                  key={league}
                  className="space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-border pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                        Competition
                      </p>

                      <h3 className="mt-1 text-xl font-black sm:text-2xl">
                        {league}
                      </h3>
                    </div>

                    <span className="rounded-full border border-theme-border bg-surface-soft px-3 py-1 text-xs font-bold text-text-muted">
                      {predictions.length}{" "}
                      {predictions.length === 1
                        ? "match"
                        : "matches"}
                    </span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {predictions.map(
                      (prediction) => (
                        <article
                          key={prediction.id}
                          className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:bg-surface-soft sm:p-6"
                        >
                          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-500/5 blur-3xl" />

                          <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="break-words text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                                  {league}
                                </p>

                                <p className="mt-2 text-xs text-text-muted">
                                  {formatKickoff(
                                    prediction.fixture
                                      .kickoffTime
                                  )}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                                FREE
                              </span>
                            </div>

                            <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                              <p className="min-w-0 break-words font-bold leading-6">
                                {
                                  prediction.fixture
                                    .homeTeam
                                }
                              </p>

                              <span className="rounded-lg bg-surface-soft px-2 py-1 text-xs font-semibold text-text-muted">
                                VS
                              </span>

                              <p className="min-w-0 break-words text-right font-bold leading-6">
                                {
                                  prediction.fixture
                                    .awayTeam
                                }
                              </p>
                            </div>

                            {prediction.title && (
                              <div className="mt-6 rounded-xl border border-brand/10 bg-brand/[0.05] px-4 py-3">
                                <p className="break-words text-sm font-bold text-brand">
                                  {prediction.title}
                                </p>
                              </div>
                            )}

                            {prediction.predictedHomeScore !==
                              null &&
                              prediction.predictedAwayScore !==
                                null && (
                                <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-surface-soft px-4 py-4 sm:px-5">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Predicted Score
                                  </span>

                                  <span className="shrink-0 text-xl font-black">
                                    {
                                      prediction.predictedHomeScore
                                    }
                                    {" - "}
                                    {
                                      prediction.predictedAwayScore
                                    }
                                  </span>
                                </div>
                              )}

                            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 sm:px-5">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">
                                Prediction
                              </p>
                              <p className="mt-2 break-words text-lg font-black">
                                {getMainPick(
                                  prediction.pHome,
                                  prediction.pDraw,
                                  prediction.pAway,
                                  prediction.fixture.homeTeam,
                                  prediction.fixture.awayTeam
                                )}
                              </p>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2">
                              <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                <p className="text-xs text-text-muted">
                                  Home
                                </p>

                                <p className="mt-1 font-bold">
                                  {formatProbability(
                                    prediction.pHome
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                <p className="text-xs text-text-muted">
                                  Draw
                                </p>

                                <p className="mt-1 font-bold">
                                  {formatProbability(
                                    prediction.pDraw
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                <p className="text-xs text-text-muted">
                                  Away
                                </p>

                                <p className="mt-1 font-bold">
                                  {formatProbability(
                                    prediction.pAway
                                  )}
                                </p>
                              </div>
                            </div>

                            {prediction.confidence !==
                              null && (
                              <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-text-muted">
                                  Confidence
                                </span>

                                <span className="font-bold text-text-primary">
                                  {Math.round(
                                    prediction.confidence *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                            )}

                            {prediction.analysis && (
                              <p className="mt-5 line-clamp-3 break-words text-sm leading-6 text-text-secondary">
                                {prediction.analysis}
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-xl">
              ⚽
            </div>

            <p className="mt-5 text-lg font-bold">
              No published predictions available
            </p>

            <p className="mt-2 text-sm text-text-muted">
              New football picks will appear here once they are published.
            </p>
          </div>
        )}
      </section>

      {/* VIP predictions */}
      <section className="border-y border-theme-border bg-surface-soft">
        <div className="grid w-full gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8 xl:px-10">
          <div className="lg:sticky lg:top-28">
            <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-bold text-brand">
              VIP Predictions
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {isVip
                ? "Your premium insights are unlocked."
                : "Unlock deeper football insights."}
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-text-secondary">
              {isVip
                ? "Your active subscription gives you full access to published VIP predictions, grouped by competition."
                : "Upgrade to VIP to unlock premium picks, correct-score predictions, full probability data, confidence insights and deeper analysis."}
            </p>

            <div className="mt-7 space-y-3 text-sm text-text-secondary">
              <div className="flex items-center gap-3">
                <span className="text-brand">
                  ✓
                </span>
                Additional VIP picks
              </div>

              <div className="flex items-center gap-3">
                <span className="text-brand">
                  ✓
                </span>
                Full prediction probabilities
              </div>

              <div className="flex items-center gap-3">
                <span className="text-brand">
                  ✓
                </span>
                Confidence and analysis
              </div>
            </div>

            <a
              href={
                isVip
                  ? "/dashboard"
                  : session?.user
                  ? "/subscribe"
                  : "/register"
              }
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
            >
              {isVip
                ? "Open VIP Dashboard"
                : session?.user
                ? "Upgrade to VIP"
                : "Create Account"}
            </a>
          </div>

          <div className="space-y-10">
            {isVip ? (
              unlockedVipPredictions.length >
              0 ? (
                Object.entries(
                  unlockedVipPredictionsByLeague
                ).map(
                  ([league, predictions]) => (
                    <section
                      key={league}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-black">
                          {league}
                        </h3>

                        <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                          {predictions.length} VIP{" "}
                          {predictions.length === 1
                            ? "match"
                            : "matches"}
                        </span>
                      </div>

                      <div className="space-y-5">
                        {predictions.map(
                          (prediction) => (
                            <article
                              key={prediction.id}
                              className="rounded-3xl border border-brand/20 bg-surface p-5 shadow-xl sm:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="break-words text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
                                    {league}
                                  </p>

                                  <p className="mt-2 text-xs text-text-muted">
                                    {formatKickoff(
                                      prediction.fixture
                                        .kickoffTime
                                    )}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                                  VIP
                                </span>
                              </div>

                              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                                <p className="min-w-0 break-words font-bold">
                                  {
                                    prediction.fixture
                                      .homeTeam
                                  }
                                </p>

                                <span className="text-xs font-bold text-text-muted">
                                  VS
                                </span>

                                <p className="min-w-0 break-words text-right font-bold">
                                  {
                                    prediction.fixture
                                      .awayTeam
                                  }
                                </p>
                              </div>

                              {prediction.title && (
                                <p className="mt-5 break-words font-bold text-brand">
                                  {prediction.title}
                                </p>
                              )}

                              <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/[0.06] p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                                  Main Pick
                                </p>
                                <p className="mt-2 break-words text-lg font-black">
                                  {getMainPick(
                                    prediction.pHome,
                                    prediction.pDraw,
                                    prediction.pAway,
                                    prediction.fixture.homeTeam,
                                    prediction.fixture.awayTeam
                                  )}
                                </p>
                              </div>

                              {prediction.predictedHomeScore !==
                                null &&
                                prediction.predictedAwayScore !==
                                  null && (
                                  <div className="mt-5 rounded-2xl bg-surface-soft p-4 text-center">
                                    <p className="text-xs uppercase tracking-wider text-text-muted">
                                      Correct Score
                                    </p>

                                    <p className="mt-2 text-2xl font-black">
                                      {
                                        prediction.predictedHomeScore
                                      }
                                      {" - "}
                                      {
                                        prediction.predictedAwayScore
                                      }
                                    </p>
                                  </div>
                                )}

                              <div className="mt-5 grid grid-cols-3 gap-2">
                                {[
                                  [
                                    "Home",
                                    prediction.pHome,
                                  ],
                                  [
                                    "Draw",
                                    prediction.pDraw,
                                  ],
                                  [
                                    "Away",
                                    prediction.pAway,
                                  ],
                                ].map(
                                  ([label, value]) => (
                                    <div
                                      key={
                                        label as string
                                      }
                                      className="rounded-xl bg-surface-soft p-2.5 text-center sm:p-3"
                                    >
                                      <p className="text-xs text-text-muted">
                                        {label}
                                      </p>

                                      <p className="mt-1 font-bold">
                                        {formatProbability(
                                          value as
                                            | number
                                            | null
                                        )}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>

                              {prediction.confidence !==
                                null && (
                                <p className="mt-5 text-sm text-text-secondary">
                                  Confidence:{" "}
                                  <span className="font-bold text-text-primary">
                                    {Math.round(
                                      prediction.confidence *
                                        100
                                    )}
                                    %
                                  </span>
                                </p>
                              )}

                              {prediction.analysis && (
                                <p className="mt-4 break-words text-sm leading-6 text-text-secondary">
                                  {prediction.analysis}
                                </p>
                              )}
                            </article>
                          )
                        )}
                      </div>
                    </section>
                  )
                )
              ) : (
                <div className="rounded-3xl border border-theme-border bg-surface p-8">
                  <p className="font-bold">
                    No published VIP predictions available yet.
                  </p>

                  <p className="mt-2 text-sm text-text-muted">
                    New VIP picks will appear here once they are published.
                  </p>
                </div>
              )
            ) : lockedVipPredictions.length >
              0 ? (
              Object.entries(
                lockedVipPredictionsByLeague
              ).map(
                ([league, predictions]) => (
                  <section
                    key={league}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-black">
                        {league}
                      </h3>

                      <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                        {predictions.length} VIP{" "}
                        {predictions.length === 1
                          ? "match"
                          : "matches"}
                      </span>
                    </div>

                    <div className="space-y-5">
                      {predictions.map(
                        (prediction) => (
                          <div
                            key={prediction.id}
                            className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-5 sm:p-6"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/[0.025] to-transparent" />

                            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="break-words text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
                                  {league}
                                </p>

                                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap sm:gap-2">
                                  <p className="min-w-0 break-words text-base font-bold sm:text-lg">
                                    {
                                      prediction.fixture
                                        .homeTeam
                                    }
                                  </p>

                                  <span className="text-text-muted">
                                    vs
                                  </span>

                                  <p className="min-w-0 break-words text-right text-base font-bold sm:text-left sm:text-lg">
                                    {
                                      prediction.fixture
                                        .awayTeam
                                    }
                                  </p>
                                </div>

                                <p className="mt-2 text-sm text-text-muted">
                                  {formatKickoff(
                                    prediction.fixture
                                      .kickoffTime
                                  )}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                                  VIP
                                </span>

                                <span className="rounded-full border border-theme-border px-3 py-1 text-xs font-semibold text-text-muted">
                                  🔒 Locked
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )
              )
            ) : (
              <div className="rounded-3xl border border-theme-border bg-surface p-8">
                <p className="font-bold">
                  No published VIP predictions available yet.
                </p>

                <p className="mt-2 text-sm text-text-muted">
                  New VIP picks will appear here once they are published.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-4 py-20 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative overflow-hidden rounded-[32px] border border-brand/20 bg-gradient-to-br from-brand/15 via-brand/[0.06] to-transparent px-5 py-12 text-center sm:px-12 sm:py-14">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />

          <div className="relative">
            <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand">
              {siteName}
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              {isVip
                ? "Your VIP access is active."
                : "Ready to unlock more predictions?"}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-text-secondary">
              {isVip
                ? "You currently have access to both free and VIP football predictions."
                : "Create your account to access your dashboard, free predictions and VIP subscription options."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 min-[400px]:flex-row min-[400px]:flex-wrap sm:gap-4">
              {session?.user ? (
                <>
                  <a
                    href={accountHref}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
                  >
                    Open Dashboard
                  </a>

                  {session.user.role !==
                    "ADMIN" && (
                    <a
                      href="/subscribe"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-6 py-3.5 font-semibold transition hover:bg-surface-muted min-[400px]:w-auto"
                    >
                      {isVip
                        ? "Extend VIP"
                        : "View VIP Plans"}
                    </a>
                  )}
                </>
              ) : (
                <>
                  <a
                    href="/register"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
                  >
                    Create Free Account
                  </a>

                  <a
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-6 py-3.5 font-semibold transition hover:bg-surface-muted min-[400px]:w-auto"
                  >
                    Login
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </main>
  );
}