"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type PredictionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "COMPLETED"
  | "CANCELLED";

type Prediction = {
  id: string;
  source:
    | "PLAYER_ELO"
    | "ADMIN";
  status: PredictionStatus;

  pHome: number | null;
  pDraw: number | null;
  pAway: number | null;

  predictedHomeScore:
    | number
    | null;

  predictedAwayScore:
    | number
    | null;

  confidence: number | null;

  title: string | null;
  analysis: string | null;

  publishedAt:
    | string
    | null;

  scheduledFor:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  fixture: {
    id: string;
    externalId: number;
    kickoffTime: string;
    leagueId: number | null;
    leagueName: string;
    homeTeam: string;
    awayTeam: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  };
};

type EditablePredictionField =
  | "status"
  | "pHome"
  | "pDraw"
  | "pAway"
  | "predictedHomeScore"
  | "predictedAwayScore"
  | "confidence"
  | "title"
  | "analysis"
  | "scheduledFor";

type PredictionFilter =
  | "ALL"
  | "REVIEW"
  | "PUBLISHED"
  | "SCHEDULED";

export default function AdminPredictionsPage() {
  const [
    predictions,
    setPredictions,
  ] = useState<Prediction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [filter, setFilter] =
    useState<PredictionFilter>(
      "ALL"
    );

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadPredictions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/predictions",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load predictions."
        );
      }

      const predictionData =
        Array.isArray(data)
          ? data
          : data.predictions ?? [];

      setPredictions(
        predictionData
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load predictions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPredictions();
  }, []);

  const activePredictions =
    useMemo(() => {
      const oneDayAgo =
        Date.now() -
        24 * 60 * 60 * 1000;

      return predictions.filter(
        (prediction) => {
          const kickoffTime =
            new Date(
              prediction.fixture.kickoffTime
            ).getTime();

          return (
            !Number.isNaN(kickoffTime) &&
            kickoffTime >= oneDayAgo
          );
        }
      );
    }, [predictions]);

  const reviewCount =
    useMemo(() => {
      return activePredictions.filter(
        (prediction) =>
          prediction.source ===
            "PLAYER_ELO" &&
          prediction.status ===
            "DRAFT"
      ).length;
    }, [activePredictions]);

  const publishedCount =
    useMemo(() => {
      return activePredictions.filter(
        (prediction) =>
          prediction.status ===
          "PUBLISHED"
      ).length;
    }, [activePredictions]);

  const scheduledCount =
    useMemo(() => {
      return activePredictions.filter(
        (prediction) =>
          prediction.status ===
          "SCHEDULED"
      ).length;
    }, [activePredictions]);

  const filteredPredictions =
    useMemo(() => {
      if (filter === "REVIEW") {
        return activePredictions.filter(
          (prediction) =>
            prediction.source ===
              "PLAYER_ELO" &&
            prediction.status ===
              "DRAFT"
        );
      }

      if (
        filter === "PUBLISHED"
      ) {
        return activePredictions.filter(
          (prediction) =>
            prediction.status ===
            "PUBLISHED"
        );
      }

      if (
        filter === "SCHEDULED"
      ) {
        return activePredictions.filter(
          (prediction) =>
            prediction.status ===
            "SCHEDULED"
        );
      }

      return activePredictions;
    }, [activePredictions, filter]);

  function updatePrediction(
    id: string,
    field:
      EditablePredictionField,
    value:
      | string
      | number
      | null
  ) {
    setPredictions((current) =>
      current.map(
        (prediction) => {
          if (
            prediction.id !== id
          ) {
            return prediction;
          }

          if (
            field === "status"
          ) {
            return {
              ...prediction,
              status:
                value as PredictionStatus,
            };
          }

          if (
            field ===
            "scheduledFor"
          ) {
            return {
              ...prediction,
              scheduledFor:
                value as
                  | string
                  | null,
            };
          }

          if (
            field === "title" ||
            field === "analysis"
          ) {
            return {
              ...prediction,
              [field]:
                value === ""
                  ? null
                  : String(
                      value
                    ),
            };
          }

          return {
            ...prediction,
            [field]:
              value === "" ||
              value === null
                ? null
                : Number(
                    value
                  ),
          };
        }
      )
    );
  }

  async function savePrediction(
    prediction: Prediction
  ) {
    try {
      setSavingId(
        prediction.id
      );

      setMessage("");
      setError("");

      if (
        prediction.status ===
          "SCHEDULED" &&
        !prediction.scheduledFor
      ) {
        setError(
          `${prediction.fixture.homeTeam} vs ${prediction.fixture.awayTeam}: choose a scheduled publication date and time.`
        );

        setSavingId(null);
        return;
      }

      if (
        prediction.status ===
          "SCHEDULED" &&
        prediction.scheduledFor
      ) {
        const scheduledDate =
          new Date(
            prediction.scheduledFor
          );

        if (
          Number.isNaN(
            scheduledDate.getTime()
          )
        ) {
          setError(
            "The scheduled publication date is invalid."
          );

          setSavingId(null);
          return;
        }

        if (
          scheduledDate.getTime() <=
          Date.now()
        ) {
          setError(
            `${prediction.fixture.homeTeam} vs ${prediction.fixture.awayTeam}: scheduled publication time must be in the future.`
          );

          setSavingId(null);
          return;
        }
      }

      const response =
        await fetch(
          `/api/admin/predictions/${prediction.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                prediction.status,

              pHome:
                prediction.pHome,

              pDraw:
                prediction.pDraw,

              pAway:
                prediction.pAway,

              predictedHomeScore:
                prediction.predictedHomeScore,

              predictedAwayScore:
                prediction.predictedAwayScore,

              confidence:
                prediction.confidence,

              title:
                prediction.title,

              analysis:
                prediction.analysis,

              scheduledFor:
                prediction.status ===
                "SCHEDULED"
                  ? prediction.scheduledFor
                  : null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save prediction."
        );
      }

      const updatedPrediction =
        data.prediction ?? data;

      if (
        updatedPrediction &&
        updatedPrediction.id
      ) {
        setPredictions(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                prediction.id
                  ? {
                      ...item,
                      ...updatedPrediction,
                    }
                  : item
            )
        );
      }

      setMessage(
        `${prediction.fixture.homeTeam} vs ${prediction.fixture.awayTeam} updated successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save prediction."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deletePrediction(
    prediction: Prediction
  ) {
    const confirmed =
      window.confirm(
        `Delete ${prediction.fixture.homeTeam} vs ${prediction.fixture.awayTeam}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        prediction.id
      );

      setMessage("");
      setError("");

      const response =
        await fetch(
          `/api/admin/predictions/${prediction.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete prediction."
        );
      }

      setPredictions(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              prediction.id
          )
      );

      setMessage(
        `${prediction.fixture.homeTeam} vs ${prediction.fixture.awayTeam} deleted successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete prediction."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function syncPlayerElo() {
    try {
      setSyncing(true);
      setMessage("");
      setError("");

      const response =
        await fetch(
          "/api/sync/playerelo",
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "PlayerElo sync failed."
        );
      }

      const created =
        data.predictionsCreated ??
        0;

      const updated =
        data.predictionsUpdated ??
        0;

      const skipped =
        data.predictionsSkipped ??
        0;

      setMessage(
        `PlayerElo sync completed. ${created} new predictions, ${updated} updated, ${skipped} skipped.`
      );

      await loadPredictions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PlayerElo sync failed."
      );
    } finally {
      setSyncing(false);
    }
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  }

  function getDateTimeLocalValue(
    value: string | null
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const offset =
      date.getTimezoneOffset() *
      60 *
      1000;

    return new Date(
      date.getTime() - offset
    )
      .toISOString()
      .slice(0, 16);
  }

  function probabilityPercent(
    value: number | null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      value >= 0 &&
      value <= 1
    ) {
      return `${(
        value * 100
      ).toFixed(1)}%`;
    }

    return `${value}%`;
  }

  function isNeedsReview(
    prediction: Prediction
  ) {
    return (
      prediction.source ===
        "PLAYER_ELO" &&
      prediction.status ===
        "DRAFT"
    );
  }

  function filterButtonClass(
    active: boolean
  ) {
    return active
      ? "rounded-xl bg-brand px-4 py-2.5 text-sm font-black text-brand-foreground"
      : "rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary";
  }

  const inputClass =
    "w-full rounded-xl border border-theme-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/10";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.05] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[600px] h-[620px] w-[620px] rounded-full bg-blue-500/[0.04] blur-[170px]" />

      

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Prediction Management
              </p>

              {reviewCount > 0 && (
                <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand">
                  {reviewCount} Need Review
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Predictions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Review imported PlayerElo
              data, edit prediction
              details and control when
              each prediction is
              published. All published
              matches remain visible;
              VIP unlocks deeper details.
            </p>
          </div>

          <button
            type="button"
            onClick={syncPlayerElo}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={
                syncing
                  ? "animate-spin"
                  : ""
              }
            >
              ↻
            </span>

            {syncing
              ? "Syncing PlayerElo..."
              : "Sync PlayerElo"}
          </button>
        </section>

        {/* Messages */}
        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] px-5 py-4 text-sm leading-6 text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-sm leading-6 text-red-300">
            {error}
          </div>
        )}

        {/* Statistics */}
        {!loading && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-theme-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">
                Total
              </p>

              <p className="mt-2 text-3xl font-black">
                {activePredictions.length}
              </p>

              <p className="mt-1 text-xs text-text-muted">
                Prediction records
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                Needs Review
              </p>

              <p className="mt-2 text-3xl font-black text-amber-300">
                {reviewCount}
              </p>

              <p className="mt-1 text-xs text-text-muted">
                PlayerElo drafts
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Published
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-300">
                {publishedCount}
              </p>

              <p className="mt-1 text-xs text-text-muted">
                Live predictions
              </p>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-wider text-sky-400">
                Scheduled
              </p>

              <p className="mt-2 text-3xl font-black text-sky-300">
                {scheduledCount}
              </p>

              <p className="mt-1 text-xs text-text-muted">
                Awaiting publication
              </p>
            </div>
          </section>
        )}

        {/* Filters */}
        {!loading && (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-theme-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilter("ALL")
                }
                className={filterButtonClass(
                  filter === "ALL"
                )}
              >
                All ({activePredictions.length})
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter("REVIEW")
                }
                className={filterButtonClass(
                  filter === "REVIEW"
                )}
              >
                Needs Review ({reviewCount})
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter(
                    "PUBLISHED"
                  )
                }
                className={filterButtonClass(
                  filter ===
                    "PUBLISHED"
                )}
              >
                Published ({publishedCount})
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter(
                    "SCHEDULED"
                  )
                }
                className={filterButtonClass(
                  filter ===
                    "SCHEDULED"
                )}
              >
                Scheduled ({scheduledCount})
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Showing{" "}
              {filteredPredictions.length}{" "}
              record
              {filteredPredictions.length ===
              1
                ? ""
                : "s"}
            </p>
          </section>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-6 rounded-3xl border border-theme-border bg-surface p-12 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-theme-border border-t-brand" />

            <p className="mt-4 text-sm font-semibold text-text-secondary">
              Loading predictions...
            </p>
          </div>
        ) : activePredictions.length ===
          0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-theme-border bg-surface p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
              ⚽
            </div>

            <h2 className="mt-5 text-xl font-black">
              No predictions found
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Run PlayerElo sync to
              import predictions.
            </p>
          </div>
        ) : filteredPredictions.length ===
          0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-theme-border bg-surface p-12 text-center">
            <h2 className="text-lg font-black">
              Nothing here
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              No predictions match this
              filter.
            </p>
          </div>
        ) : (
          <section className="mt-6 space-y-5">
            {filteredPredictions.map(
              (prediction) => {
                const needsReview =
                  isNeedsReview(
                    prediction
                  );

                const busy =
                  savingId ===
                    prediction.id ||
                  deletingId ===
                    prediction.id;

                return (
                  <article
                    key={prediction.id}
                    className={`overflow-hidden rounded-3xl border ${
                      needsReview
                        ? "border-amber-500/25 bg-amber-500/[0.035]"
                        : "border-theme-border bg-surface"
                    }`}
                  >
                    {/* Match header */}
                    <div className="border-b border-theme-border p-5 sm:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {needsReview && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                                Needs Review
                              </span>
                            )}

                            <span
                              className={
                                prediction.source ===
                                "PLAYER_ELO"
                                  ? "rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300"
                                  : "rounded-full border border-theme-border bg-surface-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary"
                              }
                            >
                              {prediction.source ===
                              "PLAYER_ELO"
                                ? "PlayerElo"
                                : "Admin"}
                            </span>


                            <span className="rounded-full border border-theme-border bg-surface-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary">
                              {prediction.status}
                            </span>
                          </div>

                          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                            {
                              prediction
                                .fixture
                                .homeTeam
                            }{" "}
                            <span className="mx-1 text-sm font-medium text-text-muted">
                              vs
                            </span>{" "}
                            {
                              prediction
                                .fixture
                                .awayTeam
                            }
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                            <span>
                              {
                                prediction
                                  .fixture
                                  .leagueName
                              }
                            </span>

                            <span>
                              {formatDate(
                                prediction
                                  .fixture
                                  .kickoffTime
                              )}
                            </span>

                            <span>
                              Fixture #
                              {
                                prediction
                                  .fixture
                                  .externalId
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              savePrediction(
                                prediction
                              )
                            }
                            disabled={busy}
                            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-black text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingId ===
                            prediction.id
                              ? "Saving..."
                              : needsReview
                                ? "Review & Save"
                                : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deletePrediction(
                                prediction
                              )
                            }
                            disabled={busy}
                            className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId ===
                            prediction.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-[1fr_0.85fr]">
                      {/* Prediction data */}
                      <div className="p-5 sm:p-6 xl:border-r xl:border-theme-border">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                          Prediction Data
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <label className="block">
                            <span className="text-xs font-bold text-text-muted">
                              Home Probability
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                prediction.pHome ??
                                ""
                              }
                              onChange={(e) =>
                                updatePrediction(
                                  prediction.id,
                                  "pHome",
                                  e.target.value
                                )
                              }
                              className={`${inputClass} mt-2`}
                            />

                            <span className="mt-1.5 block text-xs font-semibold text-brand">
                              {probabilityPercent(
                                prediction.pHome
                              ) || "—"}
                            </span>
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold text-text-muted">
                              Draw Probability
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                prediction.pDraw ??
                                ""
                              }
                              onChange={(e) =>
                                updatePrediction(
                                  prediction.id,
                                  "pDraw",
                                  e.target.value
                                )
                              }
                              className={`${inputClass} mt-2`}
                            />

                            <span className="mt-1.5 block text-xs font-semibold text-brand">
                              {probabilityPercent(
                                prediction.pDraw
                              ) || "—"}
                            </span>
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold text-text-muted">
                              Away Probability
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                prediction.pAway ??
                                ""
                              }
                              onChange={(e) =>
                                updatePrediction(
                                  prediction.id,
                                  "pAway",
                                  e.target.value
                                )
                              }
                              className={`${inputClass} mt-2`}
                            />

                            <span className="mt-1.5 block text-xs font-semibold text-brand">
                              {probabilityPercent(
                                prediction.pAway
                              ) || "—"}
                            </span>
                          </label>

                          <div>
                            <span className="text-xs font-bold text-text-muted">
                              Predicted Score
                            </span>

                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                aria-label="Predicted home score"
                                value={
                                  prediction.predictedHomeScore ??
                                  ""
                                }
                                onChange={(e) =>
                                  updatePrediction(
                                    prediction.id,
                                    "predictedHomeScore",
                                    e.target.value
                                  )
                                }
                                className={`${inputClass} text-center`}
                              />

                              <span className="text-text-muted">
                                —
                              </span>

                              <input
                                type="number"
                                min="0"
                                aria-label="Predicted away score"
                                value={
                                  prediction.predictedAwayScore ??
                                  ""
                                }
                                onChange={(e) =>
                                  updatePrediction(
                                    prediction.id,
                                    "predictedAwayScore",
                                    e.target.value
                                  )
                                }
                                className={`${inputClass} text-center`}
                              />
                            </div>
                          </div>

                          <label className="block">
                            <span className="text-xs font-bold text-text-muted">
                              Confidence
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                prediction.confidence ??
                                ""
                              }
                              onChange={(e) =>
                                updatePrediction(
                                  prediction.id,
                                  "confidence",
                                  e.target.value
                                )
                              }
                              className={`${inputClass} mt-2`}
                            />

                            <span className="mt-1.5 block text-xs font-semibold text-brand">
                              {probabilityPercent(
                                prediction.confidence
                              ) || "—"}
                            </span>
                          </label>

                        </div>
                      </div>

                      {/* Publishing */}
                      <div className="border-t border-theme-border p-5 sm:p-6 xl:border-t-0">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                          Publishing
                        </p>

                        <label className="mt-5 block">
                          <span className="text-xs font-bold text-text-muted">
                            Status
                          </span>

                          <select
                            value={
                              prediction.status
                            }
                            onChange={(e) =>
                              updatePrediction(
                                prediction.id,
                                "status",
                                e.target.value
                              )
                            }
                            className={`${inputClass} mt-2`}
                          >
                            <option value="DRAFT">
                              DRAFT
                            </option>

                            <option value="SCHEDULED">
                              SCHEDULED
                            </option>

                            <option value="PUBLISHED">
                              PUBLISHED
                            </option>

                            <option value="COMPLETED">
                              COMPLETED
                            </option>

                            <option value="CANCELLED">
                              CANCELLED
                            </option>
                          </select>
                        </label>

                        {prediction.status ===
                          "SCHEDULED" && (
                          <label className="mt-4 block">
                            <span className="text-xs font-bold text-text-muted">
                              Publish At
                            </span>

                            <input
                              type="datetime-local"
                              value={getDateTimeLocalValue(
                                prediction.scheduledFor
                              )}
                              min={getDateTimeLocalValue(
                                new Date().toISOString()
                              )}
                              onChange={(e) => {
                                const value =
                                  e.target.value;

                                updatePrediction(
                                  prediction.id,
                                  "scheduledFor",
                                  value
                                    ? new Date(
                                        value
                                      ).toISOString()
                                    : null
                                );
                              }}
                              className={`${inputClass} mt-2`}
                            />

                            <span className="mt-2 block text-xs leading-5 text-text-muted">
                              This prediction
                              will automatically
                              publish after the
                              selected time.
                            </span>
                          </label>
                        )}

                        {prediction.status ===
                          "PUBLISHED" &&
                          prediction.publishedAt && (
                            <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                Published
                              </p>

                              <p className="mt-1 text-sm text-text-secondary">
                                {formatDate(
                                  prediction.publishedAt
                                )}
                              </p>
                            </div>
                          )}

                        <div className="mt-4 rounded-xl border border-theme-border bg-surface-soft p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                            Fixture Status
                          </p>

                          <p className="mt-1 text-sm font-semibold text-text-secondary">
                            {
                              prediction
                                .fixture
                                .status
                            }
                          </p>

                          {prediction.fixture
                            .homeScore !==
                            null &&
                            prediction.fixture
                              .awayScore !==
                              null && (
                              <p className="mt-2 text-xs text-text-muted">
                                Result:{" "}
                                {
                                  prediction
                                    .fixture
                                    .homeScore
                                }{" "}
                                -{" "}
                                {
                                  prediction
                                    .fixture
                                    .awayScore
                                }
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="border-t border-theme-border p-5 sm:p-6">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                        Prediction Content
                      </p>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <label className="block">
                          <span className="text-xs font-bold text-text-muted">
                            Title
                          </span>

                          <input
                            type="text"
                            placeholder="Prediction title"
                            value={
                              prediction.title ??
                              ""
                            }
                            onChange={(e) =>
                              updatePrediction(
                                prediction.id,
                                "title",
                                e.target.value
                              )
                            }
                            className={`${inputClass} mt-2`}
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold text-text-muted">
                            Analysis
                          </span>

                          <textarea
                            placeholder="Prediction analysis"
                            rows={4}
                            value={
                              prediction.analysis ??
                              ""
                            }
                            onChange={(e) =>
                              updatePrediction(
                                prediction.id,
                                "analysis",
                                e.target.value
                              )
                            }
                            className={`${inputClass} mt-2 resize-y`}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Mobile bottom actions */}
                    <div className="flex flex-col gap-3 border-t border-theme-border bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <p className="text-xs text-text-muted">
                        Last updated{" "}
                        {formatDate(
                          prediction.updatedAt
                        )}
                      </p>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            savePrediction(
                              prediction
                            )
                          }
                          disabled={busy}
                          className="flex-1 rounded-xl bg-brand px-5 py-2.5 text-sm font-black text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          {savingId ===
                          prediction.id
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deletePrediction(
                              prediction
                            )
                          }
                          disabled={busy}
                          className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          prediction.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}

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
