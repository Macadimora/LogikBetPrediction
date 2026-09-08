import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
          <div className="absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-brand/10 blur-[130px]" />

          <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[140px]" />

          <div className="relative w-full max-w-md">
            <div className="rounded-[32px] border border-theme-border bg-surface p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-brand">
                Account security
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                Reset your password
              </h1>

              <p className="mt-4 leading-7 text-text-secondary">
                Preparing your secure password reset form...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}