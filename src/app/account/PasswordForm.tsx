"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "All password fields are required."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New password and confirmation do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/account/password",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        data.message ||
          "Password changed successfully. Please sign in again."
      );

      await signOut({
        callbackUrl:
          "/login?passwordChanged=true",
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while changing your password."
      );

      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="currentPassword"
          className="block text-sm font-semibold text-text-secondary"
        >
          Current password
        </label>

        <input
          id="currentPassword"
          type="password"
          value={
            currentPassword
          }
          onChange={(event) =>
            setCurrentPassword(
              event.target.value
            )
          }
          autoComplete="current-password"
          disabled={loading}
          required
          className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-semibold text-text-secondary"
        >
          New password
        </label>

        <input
          id="newPassword"
          type="password"
          value={
            newPassword
          }
          onChange={(event) =>
            setNewPassword(
              event.target.value
            )
          }
          autoComplete="new-password"
          minLength={8}
          disabled={loading}
          required
          className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="text-xs leading-5 text-text-muted">
          Use at least 8 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-text-secondary"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={
            confirmPassword
          }
          onChange={(event) =>
            setConfirmPassword(
              event.target.value
            )
          }
          autoComplete="new-password"
          minLength={8}
          disabled={loading}
          required
          className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="text-xs leading-5 text-text-muted">
          Enter the new password
          again to confirm it.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm leading-6 text-emerald-400"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-400"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end border-t border-theme-border pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-40 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Changing..."
            : "Change Password"}
        </button>
      </div>
    </form>
  );
}
