import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Terms & Conditions | LogikBetPrediction",
  description:
    "Terms and conditions governing the use of LogikBetPrediction, including free and VIP football prediction services.",
};

const DEFAULT_SITE_NAME = "LogikBetPrediction";

async function getSiteName() {
  try {
    const settings = await prisma.siteSetting.findFirst({
      orderBy: { createdAt: "asc" },
      select: { siteName: true },
    });

    return settings?.siteName?.trim() || DEFAULT_SITE_NAME;
  } catch (error) {
    console.error("Failed to load site name for terms page:", error);
    return DEFAULT_SITE_NAME;
  }
}

export default async function TermsPage() {
  const siteName = await getSiteName();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-theme-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-primary sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-text-secondary sm:text-lg">
            These Terms &amp; Conditions govern your access to and use of {siteName},
            including our free predictions, VIP subscriptions, account features,
            notifications, and related services.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            Last updated: September 8, 2026
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <article className="space-y-8">
            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">1. Acceptance of these terms</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>By accessing or using {siteName}, creating an account, purchasing a VIP subscription, or using any of our services, you agree to be bound by these Terms &amp; Conditions.</p>
                <p>If you do not agree with these terms, you should not use the platform or purchase any paid service.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">2. About our service</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>{siteName} provides football-related information, match probabilities, predictions, analysis, and subscription-based content. Some content may be available free of charge, while other content is reserved for active VIP subscribers.</p>
                <p>Predictions may be produced using third-party fixture data, statistical information, probability models, automated systems, and editorial review. Availability, match data, and prediction coverage may vary.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">3. Football predictions and betting disclaimer</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>All predictions, probabilities, scores, analysis, and other football information provided through {siteName} are for informational and entertainment purposes only.</p>
                <p>We do not guarantee that any prediction will be correct, that any match will produce a particular result, or that you will make a profit from acting on information available through the platform.</p>
                <p>You are solely responsible for any decision you make based on information provided by {siteName}. If you choose to place a wager, you do so independently and at your own risk.</p>
                <p>You must comply with all laws and age restrictions that apply to betting or gambling in your jurisdiction. Nothing on this platform should be interpreted as financial advice, investment advice, or a guarantee of gambling returns.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">4. User accounts</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>Certain features require an account. You agree to provide accurate information when registering and to keep your account information reasonably current.</p>
                <p>You are responsible for maintaining the confidentiality of your login credentials and for activity carried out through your account. Notify us promptly if you believe your account has been accessed without authorization.</p>
                <p>Accounts may not be sold, transferred, shared for the purpose of bypassing subscription restrictions, or used to distribute paid content to unauthorized persons.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">5. VIP subscriptions</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>VIP access is available through the subscription plans shown on the platform at the time of purchase. The applicable price, billing period, and access duration are displayed before payment.</p>
                <p>VIP access begins after a qualifying payment has been successfully confirmed and continues until the applicable subscription period expires unless otherwise stated.</p>
                <p>A VIP subscription gives you access to paid features made available for that plan. It does not guarantee a particular number of winning predictions, a profit, or any specific football outcome.</p>
                <p>We may change subscription prices, features, or available plans in the future. New prices will apply to future purchases or renewals and will be displayed before payment.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">6. Payments and refunds</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>Payments may be processed by third-party payment providers, including Flutterwave. We do not directly store your complete payment card details.</p>
                <p>You are responsible for ensuring that the payment information you provide is accurate and that you are authorized to use the selected payment method.</p>
                <p>Because VIP content may become available immediately after payment confirmation, subscription payments are generally non-refundable once access has been successfully activated, except where a refund is required by applicable law or where we determine that a duplicate payment, technical failure, or other exceptional circumstance justifies one.</p>
                <p>If you believe you were charged incorrectly, contact us as soon as reasonably possible with the relevant transaction details.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">7. Email and WhatsApp notifications</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>Where available, you may choose to receive service-related notifications by email or WhatsApp, including prediction alerts, subscription updates, account messages, and other relevant platform communications.</p>
                <p>Delivery is not guaranteed because messages may depend on third-party providers, network availability, user-provided contact information, and device or account settings.</p>
                <p>You may manage optional notification preferences through your account where those controls are available. Certain essential account or security communications may still be sent when necessary to operate the service.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">8. Prohibited use</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>You must not use {siteName} to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>copy, republish, resell, scrape, or redistribute VIP predictions or other protected content without permission;</li>
                  <li>attempt to bypass authentication, subscription controls, or other security measures;</li>
                  <li>interfere with the operation, availability, or security of the platform;</li>
                  <li>impersonate another person or use payment information without authorization;</li>
                  <li>use automated systems in a manner that places unreasonable load on the service; or</li>
                  <li>use the platform for unlawful, fraudulent, or abusive activity.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">9. Intellectual property</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>The {siteName} name, branding, interface, original written content, analysis, and other materials created for the platform may be protected by intellectual property rights.</p>
                <p>Third-party football data, team names, league names, logos, trademarks, and other third-party materials remain the property of their respective owners where applicable.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">10. Third-party services and data</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>The platform may rely on third-party providers for football data, payment processing, email delivery, messaging, hosting, analytics, storage, or other infrastructure.</p>
                <p>We are not responsible for outages, errors, delays, or changes caused by third-party services that are outside our reasonable control.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">11. Service availability</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>We aim to keep {siteName} available and accurate, but the platform may occasionally be unavailable because of maintenance, technical issues, third-party outages, updates, or circumstances beyond our control.</p>
                <p>Fixtures may be postponed, cancelled, rescheduled, or changed. Prediction data may also become outdated when underlying match information changes.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">12. Limitation of liability</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>To the fullest extent permitted by applicable law, {siteName} and its operators will not be liable for gambling losses, lost profits, missed opportunities, indirect losses, or decisions made in reliance on predictions or other information provided through the platform.</p>
                <p>Nothing in these terms excludes or limits any liability that cannot legally be excluded or limited under applicable law.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">13. Suspension and termination</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>We may suspend, restrict, or terminate an account where we reasonably believe that these terms have been violated, the platform is being abused, payment activity is fraudulent, or action is required to protect users, the service, or third parties.</p>
                <p>You may stop using the platform at any time. Expiry or termination of an account does not automatically create a right to a refund for a subscription period that has already been activated.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">14. Privacy</h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                Our handling of personal information is described in our{" "}
                <Link href="/privacy" className="font-semibold text-brand transition hover:text-brand-hover">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">15. Changes to these terms</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>We may update these Terms &amp; Conditions from time to time to reflect changes to the platform, our services, applicable law, or our business practices.</p>
                <p>The updated version will be published on this page with a revised effective date.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">16. Governing law</h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                These Terms &amp; Conditions are intended to be governed by the applicable laws of the Federal Republic of Nigeria, subject to any mandatory consumer or other legal protections that may apply in your jurisdiction.
              </p>
            </section>

            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">17. Contact</h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                If you have questions about these Terms &amp; Conditions, payments, subscriptions, or your account, please contact us using the support contact details made available through the {siteName} platform.
              </p>
            </section>

            <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-5 text-sm leading-6 text-text-secondary">
              This page is a practical policy template for the website and should be reviewed by a qualified legal professional before you rely on it as legal advice for your specific business.
            </div>
          </article>
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </main>
  );
}

