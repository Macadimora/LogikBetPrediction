import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const email = params.email?.trim();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-theme-border bg-surface p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl">
            ✉️
          </div>

          <h1 className="text-2xl font-bold text-text-primary">
            Check your email
          </h1>

          <p className="mt-3 text-text-secondary">
            We sent a verification
            link
            {email ? (
              <>
                {" "}
                to{" "}
                <span className="font-semibold text-text-primary">
                  {email}
                </span>
              </>
            ) : null}
            .
          </p>

          <p className="mt-3 text-sm text-text-muted">
            Click the link in the
            email to verify your
            account. The link
            expires in 30 minutes.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 font-semibold text-brand-foreground transition hover:bg-brand-hover"
          >
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}