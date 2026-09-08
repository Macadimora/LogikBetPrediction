import Link from "next/link";

type SiteFooterProps = {
  siteName?: string;
};

export default function SiteFooter({
  siteName = "LogikBetPrediction",
}: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-theme-border">
      <div className="w-full px-4 py-9 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="break-words text-sm text-text-muted">
              © {new Date().getFullYear()} {siteName}
            </p>

            <p className="max-w-xl text-sm leading-6 text-text-muted">
              Predictions are informational and do not guarantee
              outcomes.
            </p>
          </div>

          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
          >
            <Link
              href="/terms"
              className="text-text-muted transition hover:text-brand"
            >
              Terms &amp; Conditions
            </Link>

            <Link
              href="/privacy"
              className="text-text-muted transition hover:text-brand"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
