import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import MobileSiteMenu from "@/components/MobileSiteMenu";
import SiteNavLinks from "@/components/SiteNavLinks";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SiteHeader() {
  const session = await auth();

  const settings =
    await prisma.siteSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  const siteName =
    settings?.siteName ||
    "LogikBetPrediction";

  const logoUrl =
    settings?.logoUrl || null;

  const homeLabel =
    settings?.homeLabel || "Home";

  const predictionsLabel =
    settings?.predictionsLabel ||
    "Predictions";

  const vipLabel =
    settings?.vipLabel ||
    "VIP Plans";

  const primaryCtaLabel =
    settings?.primaryCtaLabel ||
    "Get VIP";

  const primaryCtaUrl =
    settings?.primaryCtaUrl ||
    "/subscribe";

  const isLoggedIn =
    !!session?.user;

  const isAdmin =
    session?.user?.role === "ADMIN";

  const accountHref =
    isAdmin
      ? "/admin"
      : "/dashboard";

  return (
    <header className="relative z-50 border-b border-theme-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-5 sm:px-6">
        <a
          href="/"
          className="flex min-w-0 shrink-0 items-center"
          aria-label={`${siteName} home`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="max-h-12 w-auto max-w-[190px] object-contain sm:max-w-[230px]"
            />
          ) : (
            <span className="truncate text-xl font-black tracking-tight text-text-primary sm:text-2xl">
              {siteName}
            </span>
          )}
        </a>

        <div className="ml-auto hidden items-center gap-7 lg:flex">
          <SiteNavLinks
            homeLabel={homeLabel}
            predictionsLabel={predictionsLabel}
            vipLabel={vipLabel}
          />

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isLoggedIn ? (
              <>
                <a
                  href={accountHref}
                  className="rounded-xl border border-theme-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-surface-soft"
                >
                  {isAdmin
                    ? "Admin Dashboard"
                    : "My Dashboard"}
                </a>

                {!isAdmin && (
                  <a
                    href={primaryCtaUrl}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
                  >
                    {primaryCtaLabel}
                  </a>
                )}
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-3 py-2.5 text-sm font-semibold text-text-secondary transition hover:text-brand"
                >
                  Login
                </a>

                <a
                  href={primaryCtaUrl}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover"
                >
                  {primaryCtaLabel}
                </a>
              </>
            )}
          </div>
        </div>

        <MobileSiteMenu
          homeLabel={homeLabel}
          predictionsLabel={
            predictionsLabel
          }
          vipLabel={vipLabel}
          primaryCtaLabel={
            primaryCtaLabel
          }
          primaryCtaUrl={
            primaryCtaUrl
          }
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          accountHref={accountHref}
        />
      </div>
    </header>
  );
}

