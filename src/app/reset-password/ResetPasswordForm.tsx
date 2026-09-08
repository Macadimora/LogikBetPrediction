"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token") ||
    "";

  const email =
    searchParams.get("email") ||
    "";

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token || !email) {
      setError(
        "This password reset link is invalid."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Password and confirmation do not match."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              token,
              password,
              confirmPassword,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to reset password."
        );
      }

      setPassword("");
      setConfirmPassword("");

      setMessage(
        data.message ||
          "Password reset successfully."
      );
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

  const invalidLink =
    !token || !email;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-brand/10 blur-[130px]" />

      <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden border-r border-theme-border px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            LogikBetPrediction
          </Link>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Secure password update
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight">
              Create a new
              password for your
              account.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-text-secondary">
              Choose a strong new
              password so you can
              securely return to
              your predictions and
              account.
            </p>

            <div className="mt-9 space-y-4">
              <div className="rounded-2xl border border-theme-border bg-surface p-5">
                <p className="font-bold">
                  Use at least 8 characters
                </p>

                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Longer passwords are
                  generally harder to
                  guess.
                </p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface p-5">
                <p className="font-bold">
                  Avoid your old password
                </p>

                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Your account prevents
                  reuse of your current
                  password.
                </p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface p-5">
                <p className="font-bold">
                  Existing sessions are protected
                </p>

                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Resetting your password
                  invalidates older account
                  sessions.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Keep your account credentials
            private and unique.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="text-xl font-black tracking-tight"
              >
                LogikBetPrediction
              </Link>
            </div>

            <div className="mb-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-2xl">
                🔒
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
                Account security
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Reset your password
              </h1>

              <p className="mt-3 leading-7 text-text-secondary">
                Choose a new password for
                your account.
              </p>
            </div>

            {invalidLink ? (
              <div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm leading-6 text-red-300">
                  <p className="font-semibold text-red-200">
                    Invalid reset link
                  </p>

                  <p className="mt-2">
                    This password reset link
                    is invalid or incomplete.
                  </p>
                </div>

                <Link
                  href="/forgot-password"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover"
                >
                  Request a new reset link
                </Link>

                <Link
                  href="/login"
                  className="mt-3 flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface px-5 py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5"
              >
                <div className="rounded-2xl border border-theme-border bg-surface px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Resetting password for
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-text-secondary">
                    {email}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-text-secondary"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target
                            .value
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      disabled={
                        loading
                      }
                      className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 pr-20 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      disabled={
                        loading
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted transition hover:text-text-primary disabled:opacity-50"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-text-muted">
                    Minimum 8 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-text-secondary"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirmPassword"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event.target
                          .value
                      )
                    }
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={
                      loading
                    }
                    className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {message && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm leading-6 text-emerald-300">
                    <p className="font-semibold text-emerald-200">
                      Password updated
                    </p>

                    <p className="mt-2">
                      {message}
                    </p>

                    <Link
                      href="/login?passwordChanged=true"
                      className="mt-4 inline-flex font-bold text-text-primary transition hover:text-brand-hover"
                    >
                      Continue to login →
                    </Link>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                    {error}
                  </div>
                )}

                {!message && (
                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="w-full rounded-xl bg-brand px-5 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Resetting..."
                      : "Reset Password"}
                  </button>
                )}
              </form>
            )}

            {!invalidLink &&
              !message && (
                <>
                  <div className="my-7 flex items-center gap-4">
                    <div className="h-px flex-1 bg-theme-border" />

                    <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Cancel reset
                    </span>

                    <div className="h-px flex-1 bg-theme-border" />
                  </div>

                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted"
                  >
                    Back to login
                  </Link>
                </>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}