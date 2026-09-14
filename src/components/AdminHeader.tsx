import Link from "next/link";

import { prisma } from "@/lib/prisma";

import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

type AdminHeaderProps = {
  activePage?:
    | "overview"
    | "predictions"
    | "users"
    | "payments"
    | "whatsapp"
    | "settings";
};

export default async function AdminHeader({
  activePage = "overview",
}: AdminHeaderProps) {
  let siteName =
  "LogikBetPrediction";

let logoUrl: string | null =
  null;

try {
  const settings =
    await prisma.siteSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        siteName: true,
        logoUrl: true,
      },
    });

  siteName =
    settings?.siteName ||
    "LogikBetPrediction";

  logoUrl =
    settings?.logoUrl || null;
} catch (error) {
  console.error(
    "Unable to load admin header settings. Using default branding:",
    error
  );
}

  function desktopNavClass(
    page: AdminHeaderProps["activePage"]
  ) {
    const active =
      activePage === page;

    return active
      ? "flex items-center rounded-2xl bg-brand px-4 py-3.5 text-sm font-bold text-brand-foreground"
      : "flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary";
  }

  function mobileNavClass(
    page: AdminHeaderProps["activePage"]
  ) {
    const active =
      activePage === page;

    return active
      ? "rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground"
      : "rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary";
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-theme-border bg-background lg:flex lg:flex-col">
        <div className="flex min-h-24 items-center border-b border-theme-border px-6">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="max-h-11 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <span className="truncate text-xl font-black tracking-tight text-text-primary">
                {siteName}
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6">
          <div>
            <div className="flex items-center justify-between px-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                Admin
              </p>

              <ThemeToggle />
            </div>

            <nav className="mt-5 space-y-2">
              <Link
                href="/admin"
                className={desktopNavClass(
                  "overview"
                )}
              >
                Overview
              </Link>

              <Link
                href="/admin/predictions"
                className={desktopNavClass(
                  "predictions"
                )}
              >
                Predictions
              </Link>

              <Link
                href="/admin/users"
                className={desktopNavClass(
                  "users"
                )}
              >
                Users
              </Link>

              <Link
                href="/admin/payments"
                className={desktopNavClass(
                  "payments"
                )}
              >
                Payments
              </Link>

              <Link
                href="/admin/integrations/whatsapp"
                className={desktopNavClass(
                  "whatsapp"
                )}
              >
                WhatsApp
              </Link>

              <Link
                href="/admin/site-settings"
                className={desktopNavClass(
                  "settings"
                )}
              >
                Settings
              </Link>
            </nav>
          </div>

          <div className="mt-auto border-t border-theme-border pt-5">
            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
              >
                View Public Site
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
              >
                User Dashboard
              </Link>

              <div className="pt-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="relative z-40 border-b border-theme-border bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-20 items-center justify-between gap-4 px-5 sm:px-6">
          <Link
            href="/admin"
            className="flex min-w-0 items-center"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="max-h-10 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <span className="truncate text-lg font-black tracking-tight text-text-primary sm:text-xl">
                {siteName}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <details className="relative">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-theme-border bg-surface-soft text-xl text-text-primary transition hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                ☰
              </summary>

              <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-theme-border bg-background p-2 shadow-2xl">
                <nav className="flex flex-col gap-1">
                  <Link
                    href="/admin"
                    className={mobileNavClass(
                      "overview"
                    )}
                  >
                    Overview
                  </Link>

                  <Link
                    href="/admin/predictions"
                    className={mobileNavClass(
                      "predictions"
                    )}
                  >
                    Predictions
                  </Link>

                  <Link
                    href="/admin/users"
                    className={mobileNavClass(
                      "users"
                    )}
                  >
                    Users
                  </Link>

                  <Link
                    href="/admin/payments"
                    className={mobileNavClass(
                      "payments"
                    )}
                  >
                    Payments
                  </Link>

                  <Link
                    href="/admin/integrations/whatsapp"
                    className={mobileNavClass(
                      "whatsapp"
                    )}
                  >
                    WhatsApp
                  </Link>

                  <Link
                    href="/admin/site-settings"
                    className={mobileNavClass(
                      "settings"
                    )}
                  >
                    Settings
                  </Link>

                  <div className="my-2 border-t border-theme-border" />

                  <Link
                    href="/"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
                  >
                    View Public Site
                  </Link>

                  <Link
                    href="/dashboard"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
                  >
                    User Dashboard
                  </Link>

                  <div className="px-2 pb-1 pt-2">
                    <LogoutButton />
                  </div>
                </nav>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
