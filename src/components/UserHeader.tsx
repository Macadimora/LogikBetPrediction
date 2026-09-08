import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

type UserHeaderProps = {
  activePage?:
    | "dashboard"
    | "vip"
    | "notifications"
    | "account";

  unreadNotificationCount?: number;
};

const fallbackSettings = {
  siteName: "LogikBetPrediction",
  logoUrl: null as string | null,
};

export default async function UserHeader({
  activePage,
  unreadNotificationCount = 0,
}: UserHeaderProps) {
  const settings =
    (await prisma.siteSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },

      select: {
        siteName: true,
        logoUrl: true,
      },
    })) ?? fallbackSettings;

  function navClass(
    page:
      | "dashboard"
      | "vip"
      | "notifications"
      | "account"
  ) {
    if (activePage === page) {
      return "rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-text-primary";
    }

    return "rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary";
  }

  function mobileNavClass(
    page:
      | "dashboard"
      | "vip"
      | "notifications"
      | "account"
  ) {
    if (activePage === page) {
      return "flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3 text-sm font-bold text-text-primary";
    }

    return "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary";
  }

  return (
    <header className="relative z-20 border-b border-theme-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
        >
          {settings.logoUrl ? (
            <div className="relative h-10 w-36 max-w-[45vw]">
              <Image
                src={settings.logoUrl}
                alt={settings.siteName}
                fill
                sizes="144px"
                className="object-contain object-left"
                priority
              />
            </div>
          ) : (
            <span className="truncate text-lg font-black tracking-tight text-text-primary sm:text-xl">
              {settings.siteName}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className={navClass(
              "dashboard"
            )}
          >
            Dashboard
          </Link>

          <Link
            href="/subscribe"
            className={navClass("vip")}
          >
            VIP Plans
          </Link>

          <Link
            href="/notifications"
            className={navClass(
              "notifications"
            )}
          >
            Notifications

            {unreadNotificationCount >
              0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-black text-brand-foreground">
                {unreadNotificationCount >
                99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </Link>

          <Link
            href="/account"
            className={navClass(
              "account"
            )}
          >
            Account
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LogoutButton />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <details className="group relative">
            <summary
              aria-label="Open navigation menu"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-theme-border bg-surface-soft text-text-primary transition hover:bg-surface-muted"
            >
              <span className="sr-only">
                Open menu
              </span>

              <div className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current transition" />
                <span className="block h-0.5 w-5 rounded-full bg-current transition" />
                <span className="block h-0.5 w-5 rounded-full bg-current transition" />
              </div>
            </summary>

            <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-theme-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className={mobileNavClass(
                    "dashboard"
                  )}
                >
                  <span>
                    Dashboard
                  </span>
                </Link>

                <Link
                  href="/subscribe"
                  className={mobileNavClass(
                    "vip"
                  )}
                >
                  <span>
                    VIP Plans
                  </span>

                  <span className="text-xs font-black text-brand">
                    VIP
                  </span>
                </Link>

                <Link
                  href="/notifications"
                  className={mobileNavClass(
                    "notifications"
                  )}
                >
                  <span>
                    Notifications
                  </span>

                  {unreadNotificationCount >
                    0 && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand px-2 py-1 text-[10px] font-black text-brand-foreground">
                      {unreadNotificationCount >
                      99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/account"
                  className={mobileNavClass(
                    "account"
                  )}
                >
                  <span>
                    Account
                  </span>
                </Link>
              </nav>

              <div className="mt-3 border-t border-theme-border pt-3">
                <div className="w-full">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
