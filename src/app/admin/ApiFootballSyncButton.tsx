"use client";

import { useState } from "react";

type SyncResults = {
  requestsUsed: number;
  receivedFixtures: number;
  eligibleTopCompetitionFixtures: number;
  fixturesCreated: number;
  fixturesUpdated: number;
  predictionsCreated: number;
  predictionsUpdated: number;
  predictionsSkipped: number;
  predictionsProtected: number;
};

export default function ApiFootballSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] =
    useState<SyncResults | null>(null);
  const [error, setError] = useState("");

  async function handleSync() {
    try {
      setLoading(true);
      setMessage("");
      setResults(null);
      setError("");

      const response = await fetch(
        "/api/sync/api-football",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to synchronize API-Football predictions."
        );
      }

      setMessage(
        data.message ||
          "API-Football predictions synchronized successfully."
      );

      setResults({
        requestsUsed: data.requestsUsed ?? 0,
        receivedFixtures:
          data.receivedFixtures ?? 0,
        eligibleTopCompetitionFixtures:
          data.eligibleTopCompetitionFixtures ?? 0,
        fixturesCreated:
          data.fixturesCreated ?? 0,
        fixturesUpdated:
          data.fixturesUpdated ?? 0,
        predictionsCreated:
          data.predictionsCreated ?? 0,
        predictionsUpdated:
          data.predictionsUpdated ?? 0,
        predictionsSkipped:
          data.predictionsSkipped ?? 0,
        predictionsProtected:
          data.predictionsProtected ?? 0,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Synchronizing..."
          : "Sync API-Football"}
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-400">
            {message}
          </p>

          {results && (
            <div className="mt-3 space-y-1 text-xs text-text-secondary">
              <p>
                API requests used:{" "}
                {results.requestsUsed}
              </p>
              <p>
                Fixtures received:{" "}
                {results.receivedFixtures}
              </p>
              <p>
                Eligible top fixtures:{" "}
                {
                  results.eligibleTopCompetitionFixtures
                }
              </p>
              <p>
                Fixtures created:{" "}
                {results.fixturesCreated}
              </p>
              <p>
                Fixtures updated:{" "}
                {results.fixturesUpdated}
              </p>
              <p>
                Predictions created:{" "}
                {results.predictionsCreated}
              </p>
              <p>
                Predictions updated:{" "}
                {results.predictionsUpdated}
              </p>
              <p>
                Predictions skipped:{" "}
                {results.predictionsSkipped}
              </p>
              <p>
                Manual predictions protected:{" "}
                {results.predictionsProtected}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
