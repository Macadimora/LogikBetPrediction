"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

export default function RegisterPage() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (
      form.password.length <
      8
    ) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password:
                form.password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Registration failed."
        );

        return;
      }

      router.push(
        `/verify-email?email=${encodeURIComponent(
          form.email
            .trim()
            .toLowerCase()
        )}`
      );
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
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

              Get started for free
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight">
              Start your
              football prediction
              experience.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-text-secondary">
              Create an account to access
              daily free predictions,
              manage your profile and
              upgrade to VIP whenever
              you&apos;re ready.
            </p>

            <div className="mt-9 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  01
                </div>

                <div>
                  <p className="font-bold">
                    Create your account
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Register using your
                    name, email and a
                    secure password.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  02
                </div>

                <div>
                  <p className="font-bold">
                    Verify your email
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    We&apos;ll send you a
                    verification link before
                    you can sign in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-theme-border bg-surface p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-black text-brand">
                  03
                </div>

                <div>
                  <p className="font-bold">
                    Access predictions
                  </p>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Explore free picks and
                    unlock additional VIP
                    insights when needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Predictions are informational
            and do not guarantee outcomes.
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
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
                Create account
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Join LogikBetPrediction
              </h2>

              <p className="mt-3 leading-7 text-text-secondary">
                Set up your account and
                start accessing today&apos;s
                football predictions.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-text-secondary"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-text-secondary"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-text-secondary"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 pr-20 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted transition hover:text-text-primary"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-text-muted">
                  Use at least 8 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-text-secondary"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.confirmPassword
                  }
                  onChange={
                    handleChange
                  }
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/60 focus:bg-surface-muted"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-brand py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-theme-border" />

              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Already registered?
              </span>

              <div className="h-px flex-1 bg-theme-border" />
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted"
            >
              Log in to your account
            </Link>

            <p className="mt-7 text-center text-xs leading-5 text-text-muted">
              After registration,
              you&apos;ll need to verify
              your email address before
              logging in.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
