"use client";

import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";

type MobileSiteMenuProps = {
  homeLabel: string;
  predictionsLabel: string;
  vipLabel: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  accountHref: string;
};

export default function MobileSiteMenu({
  homeLabel,
  predictionsLabel,
  vipLabel,
  primaryCtaLabel,
  primaryCtaUrl,
  isLoggedIn,
  isAdmin,
  accountHref,
}: MobileSiteMenuProps) {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-theme-border bg-surface-soft text-text-primary transition hover:bg-surface-muted"
        >
          <div className="flex w-5 flex-col gap-1.5">
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                open
                  ? "translate-y-2 rotate-45"
                  : ""
              }`}
            />

            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                open ? "opacity-0" : ""
              }`}
            />

            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                open
                  ? "-translate-y-2 -rotate-45"
                  : ""
              }`}
            />
          </div>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-theme-border bg-background/95 px-5 py-5 shadow-2xl backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            <a
              href="/"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
            >
              {homeLabel}
            </a>

            <a
              href="/#predictions"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
            >
              {predictionsLabel}
            </a>

            <a
              href="/subscribe"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
            >
              {vipLabel}
            </a>

            <div className="my-2 border-t border-theme-border" />

            {isLoggedIn ? (
              <>
                <a
                  href={accountHref}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-semibold text-text-primary transition hover:bg-surface-soft"
                >
                  {isAdmin
                    ? "Admin Dashboard"
                    : "My Dashboard"}
                </a>

                {!isAdmin && (
                  <a
                    href={primaryCtaUrl}
                    onClick={closeMenu}
                    className="mt-1 rounded-xl bg-brand px-4 py-3 text-center font-semibold text-brand-foreground transition hover:bg-brand-hover"
                  >
                    {primaryCtaLabel}
                  </a>
                )}
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
                >
                  Login
                </a>

                <a
                  href={primaryCtaUrl}
                  onClick={closeMenu}
                  className="mt-1 rounded-xl bg-brand px-4 py-3 text-center font-semibold text-brand-foreground transition hover:bg-brand-hover"
                >
                  {primaryCtaLabel}
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
