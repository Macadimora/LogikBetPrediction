"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import {
  signIn,
  getSession,
} from "next-auth/react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const registered =
    searchParams.get("registered");

  const verified =
    searchParams.get("verified");

  const verification =
    searchParams.get(
      "verification"
    );

  const passwordChanged =
    searchParams.get(
      "passwordChanged"
    );

  const [
    form,
    setForm,
  ] = useState({
    email: "",
    password: "",
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
    setLoading(true);

    try {
      const result =
        await signIn(
          "credentials",
          {
            email:
              form.email,
            password:
              form.password,
            redirect: false,
          }
        );

      if (result?.error) {
        setError(
          "Invalid email or password, or your email has not been verified."
        );

        return;
      }

      const session =
        await getSession();

      if (
        session?.user
          ?.role ===
        "ADMIN"
      ) {
        router.push(
          "/admin"
        );
      } else {
        router.push(
          "/dashboard"
        );
      }

      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please try again."
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
              Football insights, simplified
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight">
              Welcome back to
              your football
              prediction hub.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-text-secondary">
              Access your daily
              predictions, manage your
              VIP subscription and stay
              updated with your latest
              football insights.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-theme-border bg-surface p-5">
                <p className="text-2xl font-black text-brand">
                  Daily
                </p>

                <p className="mt-2 text-sm text-text-secondary">
                  Fresh football
                  predictions and match
                  insights.
                </p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface p-5">
                <p className="text-2xl font-black text-brand">
                  VIP
                </p>

                <p className="mt-2 text-sm text-text-secondary">
                  Unlock premium
                  predictions and full
                  analysis.
                </p>
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
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Log in to your account
              </h2>

              <p className="mt-3 leading-7 text-text-secondary">
                Enter your credentials to
                access your dashboard and
                predictions.
              </p>
            </div>

            {registered && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-300">
                Account created
                successfully. Please verify
                your email before logging
                in.
              </div>
            )}

            {verified ===
              "true" && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-300">
                Your email has been
                verified successfully. You
                can now log in.
              </div>
            )}

            {passwordChanged ===
              "true" && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-300">
                Your password was changed
                successfully. Please log
                in again.
              </div>
            )}

            {verification ===
              "expired" && (
              <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-300">
                Your email verification
                link has expired. Request
                a new verification email
                to continue.
              </div>
            )}

            {verification ===
              "invalid" && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-300">
                This verification link is
                invalid or has already
                been used.
              </div>
            )}

            {verification ===
              "error" && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-300">
                We could not verify your
                email. Please try again.
              </div>
            )}

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
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-text-secondary"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-brand transition hover:text-brand-hover"
                  >
                    Forgot password?
                  </Link>
                </div>

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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-brand py-3.5 font-bold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Log in"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-theme-border" />

              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                New here?
              </span>

              <div className="h-px flex-1 bg-theme-border" />
            </div>

            <Link
              href="/register"
              className="flex w-full items-center justify-center rounded-xl border border-theme-border bg-surface py-3.5 font-semibold text-text-secondary transition hover:bg-surface-muted"
            >
              Create a free account
            </Link>

            <p className="mt-7 text-center text-xs leading-5 text-text-muted">
              By continuing, you agree to
              use LogikBetPrediction
              responsibly. Predictions do
              not guarantee match outcomes.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-theme-border border-t-brand" />

            <p className="mt-4 text-sm text-text-secondary">
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
