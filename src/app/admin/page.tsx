import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import ApiFootballSyncButton from "./ApiFootballSyncButton";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const displayName =
    session.user.name || "Administrator";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.06] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[420px] h-[620px] w-[620px] rounded-full bg-blue-500/[0.05] blur-[170px]" />

      <AdminHeader activePage="overview" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Heading */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Administration
              </p>

              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                Admin Access
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Welcome back,{" "}
              <span className="font-semibold text-text-primary">
                {displayName}
              </span>
              . Manage predictions, users, payments,
              integrations and site configuration.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
          >
            View Public Site →
          </Link>
        </section>

        {/* Main management */}
        <section className="mt-9">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
              Management
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-text-primary">
              Control Center
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {/* Predictions */}
            <Link
              href="/admin/predictions"
              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 transition hover:border-brand/30 hover:bg-surface-soft"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-brand/10 opacity-0 blur-[60px] transition group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-xl">
                    ⚽
                  </div>

                  <span className="text-sm font-bold text-text-muted transition group-hover:text-brand">
                    →
                  </span>
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                  Predictions
                </p>

                <h3 className="mt-2 text-2xl font-black text-text-primary">
                  Manage Predictions
                </h3>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Review, edit, publish, schedule and
                  manage FREE and VIP prediction records.
                </p>
              </div>
            </Link>

            {/* Users */}
            <Link
              href="/admin/users"
              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 transition hover:border-blue-500/30 hover:bg-surface-soft"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-500/10 opacity-0 blur-[60px] transition group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                    👥
                  </div>

                  <span className="text-sm font-bold text-text-muted transition group-hover:text-blue-500">
                    →
                  </span>
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                  Users
                </p>

                <h3 className="mt-2 text-2xl font-black text-text-primary">
                  Manage Users
                </h3>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Review user accounts, VIP subscriptions
                  and individual account activity.
                </p>
              </div>
            </Link>

            {/* Payments */}
            <Link
              href="/admin/payments"
              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 transition hover:border-emerald-500/30 hover:bg-surface-soft"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-500/10 opacity-0 blur-[60px] transition group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
                    ₦
                  </div>

                  <span className="text-sm font-bold text-text-muted transition group-hover:text-emerald-500">
                    →
                  </span>
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                  Payments
                </p>

                <h3 className="mt-2 text-2xl font-black text-text-primary">
                  Payment Activity
                </h3>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Monitor Flutterwave transactions,
                  payment status and revenue activity.
                </p>
              </div>
            </Link>

            {/* WhatsApp */}
            <Link
              href="/admin/integrations/whatsapp"
              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 transition hover:border-emerald-500/30 hover:bg-surface-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
                  ◉
                </div>

                <span className="text-sm font-bold text-text-muted transition group-hover:text-emerald-500">
                  →
                </span>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Integration
              </p>

              <h3 className="mt-2 text-2xl font-black text-text-primary">
                WhatsApp
              </h3>

              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Configure the Meta WhatsApp Cloud API used
                for prediction and account notifications.
              </p>
            </Link>

            {/* Site settings */}
            <Link
              href="/admin/site-settings"
              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-surface p-6 transition hover:border-purple-500/30 hover:bg-surface-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-xl">
                  ⚙
                </div>

                <span className="text-sm font-bold text-text-muted transition group-hover:text-purple-500">
                  →
                </span>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
                Configuration
              </p>

              <h3 className="mt-2 text-2xl font-black text-text-primary">
                Site Settings
              </h3>

              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Update branding, site name, logo,
                navigation labels and primary CTA.
              </p>
            </Link>

            {/* API-Football sync */}
            <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-surface p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-[70px]" />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-xl">
                  ↻
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-brand">
                  API-Football
                </p>

                <h3 className="mt-2 text-2xl font-black text-text-primary">
                  Prediction Sync
                </h3>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Synchronize today&apos;s top fixtures
                  and prediction data through API-Football.
                </p>

                <div className="mt-6">
                  <ApiFootballSyncButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick admin links */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
              Admin Shortcuts
            </p>

            <h2 className="mt-2 text-xl font-black text-text-primary">
              Quick actions
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/predictions"
                className="rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:border-brand/20"
              >
                <p className="text-sm font-bold text-text-primary">
                  Review predictions
                </p>

                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Manage draft, scheduled and published
                  tips.
                </p>
              </Link>

              <Link
                href="/admin/users"
                className="rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:border-blue-500/20"
              >
                <p className="text-sm font-bold text-text-primary">
                  Review users
                </p>

                <p className="mt-1 text-xs leading-5 text-text-muted">
                  View account and subscription details.
                </p>
              </Link>

              <Link
                href="/admin/payments"
                className="rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:border-emerald-500/20"
              >
                <p className="text-sm font-bold text-text-primary">
                  Check payments
                </p>

                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Inspect recent Flutterwave transactions.
                </p>
              </Link>

              <Link
                href="/admin/site-settings"
                className="rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:border-purple-500/20"
              >
                <p className="text-sm font-bold text-text-primary">
                  Update website
                </p>

                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Edit logo, navigation and CTA labels.
                </p>
              </Link>
            </div>
          </article>

          {/* Admin identity */}
          <article className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg font-black text-emerald-500 dark:text-emerald-400">
              A
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-text-muted">
              Signed in as
            </p>

            <h2 className="mt-2 break-words text-lg font-black text-text-primary">
              {session.user.email}
            </h2>

            <div className="mt-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
              Administrator
            </div>

            <p className="mt-5 text-xs leading-5 text-text-muted">
              This account has access to protected
              administration tools.
            </p>
          </article>
        </section>

        <div className="mt-8 pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
          >
            ← Switch to User Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
