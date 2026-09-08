"use client";

import { useState } from "react";

type PredictionActionsProps = {
  id: string;
  access: "FREE" | "VIP";
  status:
    | "DRAFT"
    | "SCHEDULED"
    | "PUBLISHED"
    | "COMPLETED"
    | "CANCELLED";
};

export default function PredictionActions({
  id,
  access,
  status,
}: PredictionActionsProps) {
  const [currentAccess, setCurrentAccess] = useState(access);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updatePrediction(
    changes: Record<string, string>
  ) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/predictions/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Update failed.");
        return;
      }

      if (changes.access) {
        setCurrentAccess(
          changes.access as "FREE" | "VIP"
        );
      }

      if (changes.status) {
        setCurrentStatus(
          changes.status as typeof currentStatus
        );
      }

      setMessage("Saved");

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePrediction() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prediction?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/predictions/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Delete failed.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <select
        value={currentAccess}
        disabled={loading}
        onChange={(event) =>
          updatePrediction({
            access: event.target.value,
          })
        }
        className="rounded-lg border border-theme-border bg-surface-soft px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="FREE">FREE</option>
        <option value="VIP">VIP</option>
      </select>

      <select
        value={currentStatus}
        disabled={loading}
        onChange={(event) =>
          updatePrediction({
            status: event.target.value,
          })
        }
        className="rounded-lg border border-theme-border bg-surface-soft px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="DRAFT">DRAFT</option>
        <option value="SCHEDULED">SCHEDULED</option>
        <option value="PUBLISHED">PUBLISHED</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>

      <button
        type="button"
        disabled={loading}
        onClick={deletePrediction}
        className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>

      {message && (
        <p className="text-xs text-text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
