"use client";

import Link from "next/link";
import { useState } from "react";

type Plan = "WEEKLY" | "MONTHLY";

export default function SubscribeClient() {
  const [loadingPlan, setLoadingPlan] =
    useState<Plan | null>(null);

  const [error, setError] =
    useState("");

  async function startPayment(
    plan: Plan
  ) {
    try {
      setError("");
      setLoadingPlan(plan);

      const response = await fetch(
        "/api/payments/flutterwave/initialize",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plan,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.checkoutUrl
      ) {
        setError(
          data.error ||
            "Unable to start payment. Please try again."
        );

        return;
      }

      window.location.href =
        data.checkoutUrl;
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong while starting payment."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  const paymentLoading =
    loadingPlan !== null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand">
          <span className="h-2 w-2 rounded-full bg-brand" />
          VIP Membership
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          Unlock the full
          prediction experience.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
          Get access to VIP football
          predictions, probabilities,
          detailed analysis and premium
          prediction insights.
        </p>
      </section>

      {error && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-sm leading-6 text-red-400">
          {error}
        </div>
      )}

      {/* Plans */}
      <section className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Weekly */}
        <article className="relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Weekly VIP
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-text-primary">
                ₦3,000
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                7 days of VIP access
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-xl">
              ⚡
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                ✓
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                Full access to VIP
                predictions
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                ✓
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                Prediction probabilities
                and confidence levels
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                ✓
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                Match analysis and
                predicted score details
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                ✓
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                VIP prediction
                notifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              startPayment("WEEKLY")
            }
            disabled={paymentLoading}
            className="mt-9 w-full rounded-xl border border-theme-border bg-surface-soft px-5 py-3.5 font-bold text-text-primary transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingPlan === "WEEKLY"
              ? "Opening Flutterwave..."
              : "Choose Weekly"}
          </button>
        </article>

        {/* Monthly */}
        <article className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/[0.12] via-surface to-surface-soft p-6 shadow-2xl shadow-brand/20 sm:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-[70px]" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
                    Monthly VIP
                  </p>

                  <span className="rounded-full bg-brand px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-brand-foreground">
                    Best Value
                  </span>
                </div>

                <h2 className="mt-4 text-4xl font-black tracking-tight text-text-primary">
                  ₦10,000
                </h2>

                <p className="mt-2 text-sm text-text-secondary">
                  30 days of VIP access
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-xl">
                ★
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-brand/15 bg-brand/[0.06] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Compared to 4 weeks
                  </p>

                  <p className="mt-1 text-sm font-bold text-text-primary">
                    Save ₦2,000
                  </p>
                </div>

                <span className="text-sm font-black text-brand">
                  Better value
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                  ✓
                </div>

                <p className="text-sm leading-6 text-text-secondary">
                  Full access to VIP
                  predictions
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                  ✓
                </div>

                <p className="text-sm leading-6 text-text-secondary">
                  Prediction probabilities
                  and confidence levels
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                  ✓
                </div>

                <p className="text-sm leading-6 text-text-secondary">
                  Match analysis and
                  predicted score details
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-black text-emerald-400">
                  ✓
                </div>

                <p className="text-sm leading-6 text-text-secondary">
                  VIP prediction
                  notifications
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                startPayment("MONTHLY")
              }
              disabled={paymentLoading}
              className="mt-9 w-full rounded-xl bg-brand px-5 py-3.5 font-black text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPlan === "MONTHLY"
                ? "Opening Flutterwave..."
                : "Choose Monthly VIP"}
            </button>
          </div>
        </article>
      </section>

      {/* Included features */}
      <section className="mx-auto mt-12 max-w-5xl rounded-3xl border border-theme-border bg-surface p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            VIP Membership
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            What you unlock
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              ⚽
            </div>

            <h3 className="mt-4 font-bold text-text-primary">
              VIP Predictions
            </h3>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              Unlock premium football
              prediction picks.
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              %
            </div>

            <h3 className="mt-4 font-bold text-text-primary">
              Probabilities
            </h3>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              See home, draw and away
              probability data.
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              ◎
            </div>

            <h3 className="mt-4 font-bold text-text-primary">
              Analysis
            </h3>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              Access additional match
              analysis and insights.
            </p>
          </div>

          <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              🔔
            </div>

            <h3 className="mt-4 font-bold text-text-primary">
              Notifications
            </h3>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              Stay updated when new
              prediction tips arrive.
            </p>
          </div>
        </div>
      </section>

      {/* Payment note */}
      <section className="mx-auto mt-8 max-w-3xl text-center">
        <div className="rounded-2xl border border-theme-border bg-surface px-5 py-5">
          <p className="text-sm leading-6 text-text-muted">
            Payments are processed securely
            through{" "}
            <span className="font-semibold text-text-secondary">
              Flutterwave
            </span>
            . After successful verification,
            your VIP subscription is activated
            automatically.
          </p>
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
