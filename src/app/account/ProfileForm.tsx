"use client";

import {
  FormEvent,
  useState,
} from "react";

type ProfileFormProps = {
  initialName: string;
  email: string;
};

export default function ProfileForm({
  initialName,
  email,
}: ProfileFormProps) {
  const [name, setName] =
    useState(initialName);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Name is required."
      );

      return;
    }

    if (
      trimmedName.length > 100
    ) {
      setError(
        "Name must not exceed 100 characters."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/account/profile",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: trimmedName,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to update profile."
        );

        return;
      }

      setName(
        data.user?.name ||
          trimmedName
      );

      setSuccess(
        "Profile updated successfully."
      );
    } catch {
      setError(
        "Something went wrong while updating your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mt-6 space-y-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="profile-name"
          className="block text-sm font-semibold text-text-secondary"
        >
          Display name
        </label>

        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          maxLength={100}
          autoComplete="name"
          disabled={loading}
          className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="text-xs leading-5 text-text-muted">
          This is the name shown
          across your account.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-email"
          className="block text-sm font-semibold text-text-secondary"
        >
          Email address
        </label>

        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-sm text-text-muted outline-none"
        />

        <p className="text-xs leading-5 text-text-muted">
          Your account email cannot
          currently be changed from
          this page.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm leading-6 text-emerald-400"
        >
          {success}
        </div>
      )}

      <div className="flex justify-end border-t border-theme-border pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-36 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
