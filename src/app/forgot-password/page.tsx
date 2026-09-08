"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

export default function ForgotPasswordPage() {
  const [
    email,
    setEmail,
  ] = useState("");

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

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Email is required."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                normalizedEmail,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to process password reset request."
        );
      }

      setMessage(
        data.message ||
          "If an account exists for that email, password reset instructions have been sent."
      );

      setEmail("");
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
              Secure account recovery
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight">
              Reset your password
              and get back into
              your account.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-text-secondary">
              Enter the email linked to
              your account and we&apos;ll
              send secure instructions for
              setting a new password.
            </p>

            <div className="mt-9 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  01
                </div>

                <div>
                  <p className="font-bold">
                    Enter your email
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Use the email address
                    associated with your
                    LogikBetPrediction
                    account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  02
                </div>

                <div>
                  <p className="font-bold">
                    Check your inbox
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    If an account exists,
                    you&apos;ll receive a
                    secure password reset
                    link.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  03
                </div>

                <div>
                  <p className="font-bold">
                    Choose a new password
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Create your new
                    password and then sign
                    back in securely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Password reset links are
            temporary for account security.
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
                🔑
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
                Account recovery
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Forgot your password?
              </h1>

              <p className="mt-3 leading-7 text-text-secondary">
                Enter the email address
                connected to your account
                and we&apos;ll send you
                password reset instructions.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-text-secondary"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={
                    loading
                  }
                  required
                  className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {message && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-300">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-brand px-5 py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Sending..."
                  : "Send Reset Instructions"}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-theme-border bg-surface px-4 py-4 text-sm leading-6 text-text-muted">
              For privacy, we&apos;ll show
              the same confirmation even if
              no account exists for the
              email you enter.
            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-theme-border" />

              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Remembered it?
              </span>

              <div className="h-px flex-1 bg-theme-border" />
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted"
            >
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}