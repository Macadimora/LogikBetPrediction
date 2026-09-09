import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expireOldSubscriptions } from "@/lib/subscriptions";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const LAGOS_TIME_ZONE = "Africa/Lagos";

function formatProbability(value: number | null) {
  if (value === null) return "—";
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

function getMainPickProbability(
  pHome: number | null,
  pDraw: number | null,
  pAway: number | null
) {
  const values = [pHome, pDraw, pAway].filter(
    (value): value is number => value !== null
  );

  return values.length ? Math.max(...values) : null;
}

function getModelConfidence(
  confidence: number | null,
  pHome: number | null,
  pDraw: number | null,
  pAway: number | null
) {
  if (confidence !== null) return confidence;
  return getMainPickProbability(pHome, pDraw, pAway);
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

  const siteSettings = await prisma.siteSetting.findFirst({
    select: {
      siteName: true,
      heroHeading: true,
      heroHighlight: true,
      heroDescription: true,
    },
  });

  const siteName = siteSettings?.siteName?.trim() || "LogikBetPrediction";
  const heroHeading = siteSettings?.heroHeading?.trim() || "Football insights built for";
  const heroHighlight = siteSettings?.heroHighlight?.trim() || "smarter decisions.";
  const heroDescription =
    siteSettings?.heroDescription?.trim() ||
    "Access daily football predictions powered by fixture data, probability analysis and structured match insights. Start free or unlock more with VIP.";

  const isAdmin = session?.user?.role === "ADMIN";
  let isVip = false;

  if (session?.user?.id && !isAdmin) {
    await expireOldSubscriptions(session.user.id);

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: { id: true },
      orderBy: { expiresAt: "desc" },
    });

    isVip = !!activeSubscription;
  }

  const hasPremiumAccess = isAdmin || isVip;

  const predictionSelect = {
    id: true,
    title: true,
    pHome: true,
    pDraw: true,
    pAway: true,
  
    /*
     * Premium fields are fetched only when
     * the current visitor has VIP/admin access.
     */
    analysis: hasPremiumAccess,
    predictedHomeScore: hasPremiumAccess,
    predictedAwayScore: hasPremiumAccess,
    confidence: hasPremiumAccess,
  
    fixture: {
      select: {
        leagueName: true,
        homeTeam: true,
        awayTeam: true,
        kickoffTime: true,
      },
    },
  } as const;

  /*
   * The sync process removes fixtures older than 3 days,
   * so the homepage can safely show every remaining
   * published prediction.
   *
   * Upcoming matches come first, nearest kickoff first.
   * Recent past matches follow, newest kickoff first.
   */
  const upcomingPredictions = await prisma.prediction.findMany({
    where: {
      status: "PUBLISHED",
      pHome: { not: null },
      pDraw: { not: null },
      pAway: { not: null },
      fixture: {
        kickoffTime: {
          gte: now,
        },
      },
    },
    select: predictionSelect,
    orderBy: {
      fixture: {
        kickoffTime: "asc",
      },
    },
    take: 100,
  });

  const recentPastPredictions = await prisma.prediction.findMany({
    where: {
      status: "PUBLISHED",
      pHome: { not: null },
      pDraw: { not: null },
      pAway: { not: null },
      fixture: {
        kickoffTime: {
          lt: now,
        },
      },
    },
    select: predictionSelect,
    orderBy: {
      fixture: {
        kickoffTime: "desc",
      },
    },
    take: 100,
  });

  const predictions = [
    ...upcomingPredictions,
    ...recentPastPredictions,
  ];

  function groupByLeague<T extends { fixture: { leagueName: string | null } }>(items: T[]) {
    return items.reduce<Record<string, T[]>>((groups, item) => {
      const league = item.fixture.leagueName?.trim() || "Other Competitions";
      if (!groups[league]) groups[league] = [];
      groups[league].push(item);
      return groups;
    }, {});
  }

  const predictionsByLeague = groupByLeague(predictions);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />

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
              {heroHeading}<span className="text-brand"> {heroHighlight}</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              {heroDescription}
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap sm:gap-4">
              <a
                href="#predictions"
                className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto"
              >
                Latest Predictions
              </a>

              <a
                href="/subscribe"
                className="inline-flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-6 py-3.5 font-semibold text-text-primary transition hover:bg-surface-muted min-[400px]:w-auto"
              >
                Get VIP
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm text-text-muted">
              <div><span className="font-bold text-text-primary">Daily</span> updates</div>
              <div><span className="font-bold text-text-primary">Free</span> main picks</div>
              <div><span className="font-bold text-text-primary">VIP</span> full insights</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[40px] bg-brand/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-theme-border bg-surface-soft p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">AI Prediction Board</p>
                  <h2 className="mt-2 text-2xl font-bold">Latest insights</h2>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">Updated</span>
              </div>

              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">FREE</p>
                  <p className="mt-2 font-bold">Every published match</p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    See the match, kickoff time, AI main pick and strongest probability for free.
                  </p>
                </div>

                <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand">VIP Access</p>
                      <p className="mt-2 font-bold">Full AI prediction data</p>
                    </div>
                    <span className="shrink-0 text-2xl">🔒</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    Unlock correct score, full Home/Draw/Away probabilities, confidence and detailed analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-2xl border border-theme-border bg-surface-soft p-4 sm:p-5">
                    <p className="text-xs text-text-muted">Matches shown</p>
                    <p className="mt-2 text-2xl font-black">{predictions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-theme-border bg-surface-soft p-4 sm:p-5">
                    <p className="text-xs text-text-muted">Feed</p>
                    <p className="mt-2 text-lg font-black">Rolling 3-Day Feed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="predictions" className="w-full px-4 py-20 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Latest Predictions</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Latest football predictions</h2>
            <p className="mt-4 max-w-2xl leading-7 text-text-secondary">
              All published predictions currently retained in the rolling 3-day feed are shown here. Upcoming matches appear first, followed by the most recent completed fixtures. Free users get the AI main pick, while VIP unlocks the full prediction details.
            </p>
          </div>

          {!hasPremiumAccess && (
            <a href="/subscribe" className="text-sm font-bold text-brand transition hover:text-brand-hover">
              Unlock VIP details →
            </a>
          )}
        </div>

        {predictions.length > 0 ? (
          <div className="mt-10 space-y-12">
            {Object.entries(predictionsByLeague).map(([league, leaguePredictions]) => (
              <section key={league} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-border pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Competition</p>
                    <h3 className="mt-1 text-xl font-black sm:text-2xl">{league}</h3>
                  </div>
                  <span className="rounded-full border border-theme-border bg-surface-soft px-3 py-1 text-xs font-bold text-text-muted">
                    {leaguePredictions.length} {leaguePredictions.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {leaguePredictions.map((prediction) => {
                    const mainPick = getMainPick(
                      prediction.pHome,
                      prediction.pDraw,
                      prediction.pAway,
                      prediction.fixture.homeTeam,
                      prediction.fixture.awayTeam
                    );
                    const mainPickProbability = getMainPickProbability(
                      prediction.pHome,
                      prediction.pDraw,
                      prediction.pAway
                    );
                    const modelConfidence = getModelConfidence(
                      prediction.confidence,
                      prediction.pHome,
                      prediction.pDraw,
                      prediction.pAway
                    );

                    return (
                      <article
                        key={prediction.id}
                        className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:bg-surface-soft sm:p-6"
                      >
                        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand/5 blur-3xl" />

                        <div className="relative">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="break-words text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{league}</p>
                              <p className="mt-2 text-xs text-text-muted">{formatKickoff(prediction.fixture.kickoffTime)}</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                              FREE PICK
                            </span>
                          </div>

                          <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                            <p className="min-w-0 break-words font-bold leading-6">{prediction.fixture.homeTeam}</p>
                            <span className="rounded-lg bg-surface-soft px-2 py-1 text-xs font-semibold text-text-muted">VS</span>
                            <p className="min-w-0 break-words text-right font-bold leading-6">{prediction.fixture.awayTeam}</p>
                          </div>

                          {prediction.title && (
                            <div className="mt-6 rounded-xl border border-brand/10 bg-brand/[0.05] px-4 py-3">
                              <p className="break-words text-sm font-bold text-brand">{prediction.title}</p>
                            </div>
                          )}

                          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 sm:px-5">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">AI Main Pick</p>
                            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                              <p className="break-words text-lg font-black">{mainPick}</p>
                              {mainPickProbability !== null && (
                                <span className="text-sm font-black text-emerald-400">
                                  {formatProbability(mainPickProbability)}
                                </span>
                              )}
                            </div>
                          </div>

                          {hasPremiumAccess ? (
                            <>
                              {prediction.predictedHomeScore !== null && prediction.predictedAwayScore !== null && (
                                <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-surface-soft px-4 py-4 sm:px-5">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Correct Score</span>
                                  <span className="shrink-0 text-xl font-black">
                                    {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
                                  </span>
                                </div>
                              )}

                              <div className="mt-5 grid grid-cols-3 gap-2">
                                <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                  <p className="text-xs text-text-muted">Home</p>
                                  <p className="mt-1 font-bold">{formatProbability(prediction.pHome)}</p>
                                </div>
                                <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                  <p className="text-xs text-text-muted">Draw</p>
                                  <p className="mt-1 font-bold">{formatProbability(prediction.pDraw)}</p>
                                </div>
                                <div className="rounded-xl border border-theme-border bg-surface-soft p-2.5 text-center sm:p-3">
                                  <p className="text-xs text-text-muted">Away</p>
                                  <p className="mt-1 font-bold">{formatProbability(prediction.pAway)}</p>
                                </div>
                              </div>

                              {modelConfidence !== null && (
                                <div className="mt-5 flex items-center justify-between text-sm">
                                  <span className="text-text-muted">AI Confidence</span>
                                  <span className="font-bold text-text-primary">{formatProbability(modelConfidence)}</span>
                                </div>
                              )}

                              {prediction.analysis && (
                                <p className="mt-5 break-words text-sm leading-6 text-text-secondary">{prediction.analysis}</p>
                              )}

                              <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                                <span>◆</span> VIP details unlocked
                              </div>
                            </>
                          ) : (
                            <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/[0.05] p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-xl">🔒</span>
                                <div>
                                  <p className="font-bold text-text-primary">VIP prediction details</p>
                                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                                    Unlock correct score, full probabilities, AI confidence and detailed analysis.
                                  </p>
                                </div>
                              </div>
                              <a
                                href="/subscribe"
                                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
                              >
                                Get VIP
                              </a>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-theme-border bg-surface px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-xl">⚽</div>
            <p className="mt-5 text-lg font-bold">No daily predictions available yet</p>
            <p className="mt-2 text-sm text-text-muted">
              There are no published predictions in the current rolling 3-day feed. New AI picks will appear here automatically once they are available.
            </p>
          </div>
        )}
      </section>

      <section className="border-y border-theme-border bg-surface-soft">
        <div className="grid w-full gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 xl:px-10">
          <div>
            <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-bold text-brand">VIP Access</span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {hasPremiumAccess ? "Full prediction details are unlocked." : "See more than just the main pick."}
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-text-secondary">
              {hasPremiumAccess
                ? "You can view the full AI prediction data for every published match."
                : "Every match and its main AI pick stays visible for free. VIP unlocks the deeper prediction data behind each pick."}
            </p>
            {!hasPremiumAccess && (
              <a href="/subscribe" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto">
                Get VIP
              </a>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Correct Score", "See the AI model's predicted final score for each match."],
              ["Full Probabilities", "View complete Home, Draw and Away probability percentages."],
              ["AI Confidence", "See the model confidence attached to the prediction."],
              ["Detailed Analysis", "Read additional match insight whenever AI analysis is available."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-theme-border bg-surface p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">✓</div>
                <h3 className="mt-5 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-20 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative overflow-hidden rounded-[32px] border border-brand/20 bg-gradient-to-br from-brand/15 via-brand/[0.06] to-transparent px-5 py-12 text-center sm:px-12 sm:py-14">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative">
            <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand">{siteName}</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              {hasPremiumAccess ? "Your premium prediction access is active." : "Unlock the full AI prediction."}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-text-secondary">
              {hasPremiumAccess
                ? "Every published match is visible with its full prediction data."
                : "Follow every match for free, then upgrade when you want correct scores, full probabilities, confidence and deeper insights."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 min-[400px]:flex-row min-[400px]:flex-wrap sm:gap-4">
              <a href="#predictions" className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover min-[400px]:w-auto">
                Latest Predictions
              </a>
              {!hasPremiumAccess && (
                <a href="/subscribe" className="inline-flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-6 py-3.5 font-semibold transition hover:bg-surface-muted min-[400px]:w-auto">
                  Get VIP
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </main>
  );
}
