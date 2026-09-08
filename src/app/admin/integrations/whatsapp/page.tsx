import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/AdminHeader";

import WhatsAppIntegrationForm from "./WhatsAppIntegrationForm";

export default async function WhatsAppIntegrationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const integration =
    await prisma.whatsAppIntegration.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  const isEnabled =
    integration?.enabled ?? false;

  const hasAccessToken = Boolean(
    integration?.accessToken
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/[0.05] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 top-[500px] h-[620px] w-[620px] rounded-full bg-emerald-500/[0.04] blur-[170px]" />

      <AdminHeader activePage="whatsapp" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Link
            href="/admin"
            className="transition hover:text-text-primary"
          >
            Admin
          </Link>

          <span>/</span>

          <span className="text-text-secondary">
            WhatsApp Integration
          </span>
        </div>

        {/* Heading */}
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Integrations
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              WhatsApp Integration
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Connect your Meta WhatsApp
              Cloud API account to send
              prediction notifications to
              subscribed users.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider ${
              isEnabled
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-theme-border bg-surface-soft text-text-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isEnabled
                  ? "bg-emerald-400"
                  : "bg-slate-600"
              }`}
            />

            {isEnabled
              ? "Integration Enabled"
              : "Integration Disabled"}
          </div>
        </section>

        {/* Status cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <article
            className={`rounded-2xl border p-5 ${
              isEnabled
                ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                : "border-theme-border bg-surface"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Status
            </p>

            <p
              className={`mt-2 text-xl font-black ${
                isEnabled
                  ? "text-emerald-400"
                  : "text-text-secondary"
              }`}
            >
              {isEnabled
                ? "Enabled"
                : "Disabled"}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Prediction notifications
            </p>
          </article>

          <article className="rounded-2xl border border-theme-border bg-surface p-5">
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Provider
            </p>

            <p className="mt-2 text-xl font-black">
              {integration?.provider ??
                "META"}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              WhatsApp Cloud API
            </p>
          </article>

          <article
            className={`rounded-2xl border p-5 ${
              hasAccessToken
                ? "border-brand/20 bg-brand/[0.05]"
                : "border-red-500/20 bg-red-500/[0.04]"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              Access Token
            </p>

            <p
              className={`mt-2 text-xl font-black ${
                hasAccessToken
                  ? "text-brand"
                  : "text-red-400"
              }`}
            >
              {hasAccessToken
                ? "Configured"
                : "Missing"}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Stored securely
            </p>
          </article>
        </section>

        {/* Information */}
        <section className="mt-8 rounded-3xl border border-theme-border bg-surface p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-lg">
              💬
            </div>

            <div>
              <h2 className="font-black">
                Meta WhatsApp Cloud API
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
                This integration is used
                for automated prediction
                notifications. Your access
                token is not displayed
                after it has been saved.
                Enter a new token only when
                you need to replace the
                existing credential.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="mt-6 rounded-3xl border border-theme-border bg-surface p-5 sm:p-7">
          <div className="mb-6 border-b border-theme-border pb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
              Configuration
            </p>

            <h2 className="mt-2 text-xl font-black">
              WhatsApp Settings
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Configure the API account,
              phone number and prediction
              message template.
            </p>
          </div>

          <WhatsAppIntegrationForm
            initialSettings={{
              enabled:
                integration?.enabled ??
                false,

              provider:
                integration?.provider ??
                "META",

              phoneNumberId:
                integration?.phoneNumberId ??
                "",

              apiVersion:
                integration?.apiVersion ??
                "v23.0",

              predictionTemplateName:
                integration?.predictionTemplateName ??
                "new_prediction",

              hasAccessToken:
                Boolean(
                  integration?.accessToken
                ),
            }}
          />
        </section>

        {/* Security note */}
        <section className="mt-6 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5">
          <p className="text-xs font-black uppercase tracking-wider text-amber-400">
            Credential Security
          </p>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            Treat your Meta access token
            like a password. Never expose
            it in client-side code, GitHub,
            screenshots, logs, or public
            documentation.
          </p>
        </section>

        <div className="mt-8 pb-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-text-muted transition hover:text-text-primary"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
