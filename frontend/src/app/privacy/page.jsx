// frontend/src/app/privacy/page.jsx
import Link from "next/link";
import {
  Database,
  Eye,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Learn how The Expertise Wins collects, uses, and protects your information.",
};

const privacySections = [
  {
    id: "approach",
    title: "Our approach",
    icon: Lock,
    paragraphs: [
      "We aim to collect only the information reasonably needed to operate the service, provide account functionality, maintain security, and improve The Expertise Wins.",
    ],
  },
  {
    id: "information-collected",
    title: "Information We Collect",
    icon: Database,
    paragraphs: [
      "When you create an account or use The Expertise Wins, we may collect information such as your name, username, email address, account credentials, subscription information, and access-token activity.",
      "We may also collect basic technical information such as your browser, device, IP address, and diagnostic information where necessary for security and service operation.",
    ],
  },
  {
    id: "information-use",
    title: "How We Use Information",
    icon: Eye,
    items: [
      "Creating and managing user accounts.",
      "Providing free and premium content.",
      "Managing subscriptions and access tokens.",
      "Verifying payments and subscription access.",
      "Providing sports tips and performance analytics.",
      "Maintaining security and preventing abuse.",
      "Improving the website and user experience.",
      "Communicating with you about the service.",
    ],
  },
  {
    id: "accounts-access",
    title: "Accounts & Access",
    icon: UserRound,
    paragraphs: [
      "You are responsible for keeping your account credentials secure. Please do not share your password or account credentials with other people.",
      "Premium access may use access tokens or subscription verification. We may record whether an access token has been redeemed, revoked, or used so that access can be managed correctly.",
    ],
  },
  {
    id: "sports-data",
    title: "Sports Tips & Performance Data",
    icon: ShieldCheck,
    paragraphs: [
      "The Expertise Wins maintains information relating to published sports tips, including selections, markets, odds, competitions, results, and performance statistics.",
      "This information is used to publish tips, track historical performance, and provide analytics. Historical performance does not guarantee future results.",
    ],
  },
  {
    id: "security",
    title: "Security",
    icon: Lock,
    paragraphs: [
      "We take reasonable measures to protect information against unauthorized access, alteration, disclosure, or destruction.",
      "These measures may include authenticated access, password protection, access controls, secure server configuration, and other technical safeguards appropriate to the service.",
      "No internet service can guarantee absolute security, so we encourage you to use a strong password and keep your account credentials private.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    icon: Database,
    paragraphs: [
      "Some parts of The Expertise Wins may rely on third-party providers for hosting, infrastructure, payments, communication, analytics, or other functionality.",
      "These providers may process information according to their own terms and privacy policies.",
      "Our website may also contain links to external services such as Telegram, social platforms, payment services, and betting platforms. Their own privacy policies apply when you use those services.",
    ],
  },
  {
    id: "browser-storage",
    title: "Cookies & Local Storage",
    icon: Eye,
    paragraphs: [
      "The website uses cookies and local storage to store authentication tokens, and local storage to retain account information used by the interface. These support sign-in and account functionality.",
      "The website may also use cookies, local storage, or similar technologies to remember preferences and support other essential functionality.",
    ],
  },
  {
    id: "your-information",
    title: "Your Information",
    icon: UserRound,
    paragraphs: [
      "Depending on applicable law, you may have rights relating to the personal information we hold about you, including the ability to request access, correction, or deletion where applicable.",
      "Some information may need to be retained where there is a legitimate operational or legal reason to do so.",
    ],
  },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

export default function PrivacyPage() {
  return (
    <main
      aria-labelledby="privacy-heading"
      className="relative isolate overflow-hidden py-12 sm:py-20 lg:py-24"
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-full max-w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Privacy &amp; data
          </p>

          <h1
            id="privacy-heading"
            className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Your privacy matters.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Here&apos;s how The Expertise Wins collects, uses, and protects
            information when you use our website and services.
          </p>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Last updated:{" "}
            <time dateTime="2026-09-30">September 30, 2026</time>
          </p>
        </header>

        {/* Privacy policy content */}
        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/10 sm:p-8 lg:p-10">
          <div className="divide-y divide-slate-800">
            {privacySections.map((section, index) => {
              const Icon = section.icon;
              const headingId = `${section.id}-heading`;

              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={headingId}
                  className={`scroll-mt-24 ${
                    index === 0 ? "pb-8" : "py-8"
                  }`}
                >
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-emerald-300 ${
                        index === 0
                          ? "border-emerald-500/20 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2
                        id={headingId}
                        className="break-words text-lg font-bold leading-7 text-slate-100 sm:text-xl"
                      >
                        {section.title}
                      </h2>

                      {section.paragraphs && (
                        <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300 sm:text-base">
                          {section.paragraphs.map((paragraph) => (
                            <p key={paragraph} className="break-words">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}

                      {section.items && (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300 marker:text-emerald-400 sm:text-base">
                          {section.items.map((item) => (
                            <li key={item} className="break-words pl-1">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Privacy contact */}
            <section
              id="privacy-contact"
              aria-labelledby="privacy-contact-heading"
              className="scroll-mt-24 pt-8"
            >
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="privacy-contact-heading"
                    className="text-lg font-bold leading-7 text-slate-100 sm:text-xl"
                  >
                    Questions about your privacy?
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                    If you have questions about your information or this
                    Privacy Policy, contact us directly.
                  </p>

                  <a
                    href="mailto:midwaymaster10@gmail.com"
                    className={`mt-3 inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-lg py-2 text-sm font-bold text-emerald-300 transition-colors hover:text-emerald-200 ${focusStyles}`}
                  >
                    <Mail
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      midwaymaster10@gmail.com
                    </span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Closing message */}
        <div className="mt-7 flex items-start justify-center gap-2 text-center text-xs leading-5 text-emerald-300">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>Clear information. Responsible data handling.</p>
        </div>

        {/* Related pages */}
        <nav
          aria-label="Related pages"
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/about"
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 ${focusStyles}`}
          >
            <Heart
              className="h-4 w-4 shrink-0 text-rose-400"
              aria-hidden="true"
            />
            Learn more about the project
          </Link>

          <Link
            href="/terms"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white ${focusStyles}`}
          >
            Read Terms of Service
          </Link>
        </nav>
      </div>
    </main>
  );
}