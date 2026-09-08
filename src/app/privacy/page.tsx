import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Privacy Policy | LogikBetPrediction",
  description:
    "Privacy Policy explaining how LogikBetPrediction collects, uses, stores, and protects personal information.",
};

const DEFAULT_SITE_NAME = "LogikBetPrediction";

async function getSiteName() {
  try {
    const settings = await prisma.siteSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        siteName: true,
      },
    });

    return settings?.siteName?.trim() || DEFAULT_SITE_NAME;
  } catch (error) {
    console.error("Failed to load site name for privacy page:", error);
    return DEFAULT_SITE_NAME;
  }
}

export default async function PrivacyPage() {
  const siteName = await getSiteName();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-theme-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
              Legal
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-text-primary sm:text-5xl">
              Privacy Policy
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              This Privacy Policy explains how {siteName} collects, uses,
              stores, shares, and protects personal information when you use
              our website, account features, subscriptions, payments, and
              notification services.
            </p>

            <p className="mt-4 text-sm text-text-muted">
              Last updated: September 8, 2026
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-16">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-theme-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">
                On this page
              </p>

              <nav className="mt-4 space-y-3 text-sm">
                <a
                  href="#information"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Information we collect
                </a>
                <a
                  href="#use"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  How we use data
                </a>
                <a
                  href="#legal-basis"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Legal basis
                </a>
                <a
                  href="#payments"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Payments
                </a>
                <a
                  href="#notifications"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Email & WhatsApp
                </a>
                <a
                  href="#cookies"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Cookies & sessions
                </a>
                <a
                  href="#sharing"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Sharing
                </a>
                <a
                  href="#retention"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Data retention
                </a>
                <a
                  href="#security"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Security
                </a>
                <a
                  href="#rights"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Your rights
                </a>
                <a
                  href="#international"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  International transfers
                </a>
                <a
                  href="#changes"
                  className="block text-text-secondary transition hover:text-brand"
                >
                  Policy changes
                </a>
              </nav>
            </div>
          </aside>

          <article className="min-w-0 space-y-10">
            <section className="rounded-2xl border border-theme-border bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-black text-text-primary">
                1. Who this policy applies to
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  This policy applies to visitors, registered users, VIP
                  subscribers, and other people who interact with {siteName}.
                </p>

                <p>
                  By using the platform, you acknowledge that your personal
                  information may be handled as described in this policy.
                </p>
              </div>
            </section>

            <section
              id="information"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                2. Information we collect
              </h2>

              <div className="mt-4 space-y-5 text-sm leading-7 text-text-secondary sm:text-base">
                <div>
                  <h3 className="font-black text-text-primary">
                    Account information
                  </h3>
                  <p className="mt-2">
                    When you register, we may collect information such as your
                    name, email address, password credentials in protected
                    hashed form, account role, verification status, and profile
                    details you choose to provide.
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-text-primary">
                    Subscription and transaction information
                  </h3>
                  <p className="mt-2">
                    We may record your subscription plan, subscription status,
                    start and expiry dates, payment reference, amount, currency,
                    transaction status, and related payment metadata needed to
                    manage VIP access.
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-text-primary">
                    Notification preferences
                  </h3>
                  <p className="mt-2">
                    We may store whether you want to receive email or WhatsApp
                    notifications and the settings associated with those
                    preferences.
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-text-primary">
                    Technical and usage information
                  </h3>
                  <p className="mt-2">
                    When you use the platform, we may process technical
                    information such as IP address, browser information,
                    device-related information, timestamps, authentication
                    sessions, security events, request logs, and activity needed
                    to operate, secure, and troubleshoot the service.
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-text-primary">
                    Prediction activity
                  </h3>
                  <p className="mt-2">
                    We may record limited activity relating to prediction views
                    or access where this is necessary for analytics, security,
                    subscription enforcement, or service improvement.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="use"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                3. How we use personal information
              </h2>

              <div className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>We may use personal information to:</p>

                <ul className="mt-4 list-disc space-y-2 pl-5">
                  <li>create, verify, and manage user accounts;</li>
                  <li>authenticate users and protect account security;</li>
                  <li>activate and manage VIP subscriptions;</li>
                  <li>confirm and reconcile payments;</li>
                  <li>provide free and paid prediction features;</li>
                  <li>send requested email or WhatsApp notifications;</li>
                  <li>respond to account, billing, or support requests;</li>
                  <li>detect abuse, fraud, suspicious activity, or misuse;</li>
                  <li>enforce subscription and access controls;</li>
                  <li>monitor performance and troubleshoot technical issues;</li>
                  <li>improve the platform and user experience; and</li>
                  <li>comply with applicable legal or regulatory obligations.</li>
                </ul>
              </div>
            </section>

            <section
              id="legal-basis"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                4. Legal basis for processing
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  Depending on the context, we may process personal information
                  because it is necessary to provide a service you requested,
                  comply with legal obligations, protect legitimate business
                  and security interests, or because you have provided consent
                  for a particular use.
                </p>

                <p>
                  Where consent is the basis for optional communications, you
                  may withdraw that consent through the available preference
                  controls or by contacting us.
                </p>
              </div>
            </section>

            <section
              id="payments"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                5. Payments
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  Payments may be processed by third-party payment providers
                  such as Flutterwave. Payment providers may collect payment
                  card, bank, identity, or transaction information according to
                  their own privacy practices.
                </p>

                <p>
                  {siteName} does not need to store your complete payment card
                  details in order to manage your subscription. We may retain
                  transaction references, amounts, statuses, and other limited
                  payment information necessary for account administration,
                  reconciliation, fraud prevention, and support.
                </p>
              </div>
            </section>

            <section
              id="notifications"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                6. Email and WhatsApp notifications
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  If you enable notifications, we may use your contact details
                  to send prediction alerts, subscription updates, verification
                  messages, password-reset messages, account notices, or other
                  communications associated with the service.
                </p>

                <p>
                  Email messages may be delivered through a third-party email
                  provider, and WhatsApp notifications may be delivered through
                  WhatsApp or an associated messaging provider. Those providers
                  may process the information necessary to deliver messages.
                </p>

                <p>
                  You can manage optional notification preferences from your
                  account where those controls are available. Security,
                  verification, transaction, or essential service messages may
                  still be sent where necessary.
                </p>
              </div>
            </section>

            <section
              id="cookies"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                7. Cookies, authentication, and session data
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  The platform may use cookies or similar browser storage that
                  are necessary for authentication, session management,
                  security, interface preferences, and other core website
                  functionality.
                </p>

                <p>
                  For example, session technologies may be used to keep you
                  signed in, confirm your identity, remember theme preferences,
                  and protect restricted areas of the platform.
                </p>
              </div>
            </section>

            <section
              id="sharing"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                8. When we share information
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  We do not sell your personal information as a standalone
                  product.
                </p>

                <p>
                  We may share limited information with trusted service
                  providers where necessary to operate {siteName}, including
                  providers for hosting, databases, storage, payments, email,
                  messaging, security, and other technical infrastructure.
                </p>

                <p>
                  We may also disclose information where required by law, court
                  order, lawful regulatory request, or where reasonably
                  necessary to protect the rights, safety, security, or property
                  of users, the platform, or third parties.
                </p>
              </div>
            </section>

            <section
              id="third-party"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                9. Third-party services
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  {siteName} may use third-party services for football data,
                  payment processing, email delivery, WhatsApp messaging,
                  hosting, databases, caching, file storage, and similar
                  infrastructure.
                </p>

                <p>
                  These providers may process information under their own terms
                  and privacy policies. We encourage you to review the privacy
                  information provided by services you interact with directly.
                </p>
              </div>
            </section>

            <section
              id="retention"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                10. Data retention
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  We retain personal information only for as long as reasonably
                  necessary for the purposes described in this policy,
                  including account administration, subscription management,
                  payment records, security, dispute resolution, fraud
                  prevention, and legal compliance.
                </p>

                <p>
                  Different types of data may be retained for different periods.
                  Information may also be retained in backups for a limited
                  period after deletion from active systems.
                </p>
              </div>
            </section>

            <section
              id="security"
              className="scroll-mt-28 rounded-2xl border border-brand/20 bg-brand/[0.04] p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                11. Security
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  We use reasonable technical and organizational safeguards
                  intended to protect personal information, including
                  authentication controls, restricted administrative access,
                  password hashing, encrypted handling of sensitive integration
                  credentials, and security controls around protected content.
                </p>

                <p>
                  No internet-based service can guarantee absolute security.
                  You are responsible for keeping your password confidential and
                  should use a strong, unique password for your account.
                </p>
              </div>
            </section>

            <section
              id="rights"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                12. Your privacy rights
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  Subject to applicable law and any relevant exceptions, you may
                  have rights relating to your personal information, including
                  the right to request access, correction, deletion,
                  restriction, objection, portability, or withdrawal of consent.
                </p>

                <p>
                  You may also have the right to raise a complaint with the
                  appropriate data protection authority if you believe your
                  personal information has been handled unlawfully.
                </p>

                <p>
                  We may need to verify your identity before completing certain
                  privacy requests.
                </p>
              </div>
            </section>

            <section
              id="children"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                13. Children and age restrictions
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  {siteName} is not intended to encourage gambling by minors.
                  Users are responsible for complying with the minimum legal
                  age requirements that apply to them and to any betting
                  activity in their jurisdiction.
                </p>

                <p>
                  We do not knowingly seek to collect personal information from
                  children for the purpose of providing gambling or wagering
                  services.
                </p>
              </div>
            </section>

            <section
              id="international"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                14. International data processing
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  Some service providers used by {siteName} may operate or store
                  data outside Nigeria. As a result, personal information may be
                  processed in countries other than the country in which you
                  live.
                </p>

                <p>
                  Where required, we aim to use appropriate safeguards and
                  service providers that support lawful handling of personal
                  information across jurisdictions.
                </p>
              </div>
            </section>

            <section
              id="nigeria"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                15. Nigerian data protection
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  Where Nigerian data protection law applies, we intend to
                  handle personal information in a manner consistent with
                  applicable Nigerian data protection requirements, including
                  principles relating to lawful processing, transparency,
                  purpose limitation, data security, and data subject rights.
                </p>
              </div>
            </section>

            <section
              id="changes"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                16. Changes to this Privacy Policy
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  We may update this Privacy Policy when our services, business
                  practices, technology, or legal obligations change.
                </p>

                <p>
                  When we make changes, we will publish the revised version on
                  this page and update the date shown at the top.
                </p>
              </div>
            </section>

            <section
              id="contact"
              className="scroll-mt-28 rounded-2xl border border-theme-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-2xl font-black text-text-primary">
                17. Contact us
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                <p>
                  If you have a privacy question, want to exercise a privacy
                  right, or have concerns about how your personal information
                  is handled, please contact us using the support contact
                  details made available through the {siteName} platform.
                </p>

                <p>
                  For other platform rules, please review our{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-brand transition hover:text-brand-hover"
                  >
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>
            </section>

            <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-5 text-sm leading-6 text-text-secondary">
              This policy is a practical website privacy template and should be
              reviewed by a qualified legal professional to ensure it matches
              your final business structure, data flows, and legal obligations.
            </div>
          </article>
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </main>
  );
}

