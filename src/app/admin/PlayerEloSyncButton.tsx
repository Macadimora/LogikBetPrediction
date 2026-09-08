"use client";

import { useState } from "react";

type SyncResults = {
  received: number;
  fixturesCreated: number;
  fixturesUpdated: number;
  predictionsCreated: number;
  predictionsUpdated: number;
  predictionsSkipped: number;
};

export default function PlayerEloSyncButton() {
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
        "/api/sync/playerelo",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to synchronize PlayerElo predictions."
        );
      }

      setMessage(
        data.message ||
          "PlayerElo predictions synchronized successfully."
      );

      setResults(data.results);
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
          : "Sync PlayerElo"}
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-400">
            {message}
          </p>

          {results && (
            <div className="mt-3 space-y-1 text-xs text-text-secondary">
              <p>
                Received: {results.received}
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
