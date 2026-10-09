// frontend/src/app/terms/page.jsx
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { createPageMetadata } from "../../lib/seo";

export const metadata = createPageMetadata({ title: "Terms of Service", description: "Read the Terms of Service for using The Expertise Wins website, services, and community.", pathname: "/terms" });

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-300",
    paragraphs: [
      "By accessing or using The Expertise Wins website, services, or community, you agree to these Terms of Service. If you do not agree with these terms, please do not use the services.",
    ],
  },
  {
    id: "service",
    title: "The service",
    icon: FileText,
    iconClass: "bg-sky-500/10 text-sky-300",
    paragraphs: [
      "The Expertise Wins provides sports information, curated selections, statistical information, educational content, and related digital services.",
      "Our content is provided for informational and entertainment purposes. Sports results and betting outcomes are inherently uncertain, and past performance does not guarantee future results.",
    ],
  },
  {
    id: "responsibility",
    title: "Betting and financial responsibility",
    icon: ShieldCheck,
    iconClass: "bg-amber-500/10 text-amber-300",
    paragraphs: [
      "The Expertise Wins does not guarantee winnings, profits, successful bets, or any particular financial outcome.",
      "If you choose to participate in sports betting, you are responsible for your own decisions, stakes, and losses. Only participate where betting is legal for you and follow the applicable laws and regulations in your jurisdiction.",
      "Never stake money you cannot afford to lose.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: UserRound,
    iconClass: "bg-indigo-500/10 text-indigo-300",
    paragraphs: [
      "Some features may require an account. You are responsible for providing accurate information and keeping your login credentials secure.",
      "You should not share your account credentials or access tokens with other people. We may restrict or suspend access where there is evidence of misuse, unauthorized sharing, fraud, or activity that compromises the service.",
    ],
  },
  {
    id: "subscriptions",
    title: "Premium access and subscriptions",
    icon: Lock,
    iconClass: "bg-emerald-500/10 text-emerald-300",
    paragraphs: [
      "Premium products and subscription access may provide additional sports, markets, selections, content, or community access.",
      "Access is subject to the product and subscription terms presented at the time of purchase. Where access is issued manually, payment may need to be verified before an access token or subscription is provided.",
      "Subscription access may be cancelled, suspended, or revoked where required by these terms or where an account or access token is misused.",
    ],
  },
  {
    id: "community",
    title: "Community conduct",
    icon: Heart,
    iconClass: "bg-rose-500/10 text-rose-300",
    paragraphs: [
      "Our community should remain useful, respectful, and safe. Do not use our services to harass others, distribute malicious content, impersonate another person, conduct fraud, or interfere with the operation of the service.",
      "Community platforms such as Telegram may also have their own rules and terms that apply alongside these terms.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    icon: FileText,
    iconClass: "border border-slate-800 bg-slate-950 text-slate-300",
    paragraphs: [
      "The Expertise Wins name, branding, website presentation, original written content, software, and other original materials are protected by applicable intellectual property laws.",
      "You may use the service for its intended personal purposes, but you should not reproduce, resell, redistribute, or commercially exploit protected content without permission.",
    ],
  },
  {
    id: "availability",
    title: "Availability and changes",
    icon: ShieldCheck,
    iconClass: "bg-violet-500/10 text-violet-300",
    paragraphs: [
      "We work to keep the service available and useful, but we do not guarantee uninterrupted availability, error-free operation, or that every feature will always remain available.",
      "We may update, improve, remove, or change parts of the service over time. We may also update these terms when necessary. The latest version published on this page will apply to future use of the service.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    icon: Lock,
    iconClass: "bg-emerald-500/10 text-emerald-300",
    paragraphs: [
      "Your use of the service is also subject to our Privacy Policy, which explains how information may be collected, used, and protected.",
    ],
    link: {
      href: "/privacy",
      label: "Read our Privacy Policy",
    },
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
    iconClass: "bg-sky-500/10 text-sky-300",
    paragraphs: [
      "If you have questions about these terms, your account, or our services, contact The Expertise Wins.",
    ],
    link: {
      href: "mailto:midwaymaster10@gmail.com",
      label: "midwaymaster10@gmail.com",
      external: true,
    },
  },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const textLinkStyles = `mt-3 inline-flex min-h-[44px] max-w-full items-center rounded-lg py-2 font-semibold text-emerald-300 transition-colors hover:text-emerald-200 ${focusStyles}`;

export default function TermsPage() {
  return (
    <main
      aria-labelledby="terms-heading"
      className="relative isolate overflow-hidden py-12 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-full max-w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <FileText className="h-8 w-8" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Terms &amp; conditions
          </p>

          <h1
            id="terms-heading"
            className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Terms of Service
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            These terms explain the basic rules for using The Expertise Wins,
            including our website, sports tips, accounts, subscriptions, and
            community services.
          </p>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Last updated:{" "}
            <time dateTime="2026-09-30">September 30, 2026</time>
          </p>
        </header>

        {/* Terms content */}
        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/10 sm:p-8 lg:p-10">
          <div className="space-y-8 sm:space-y-10">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const headingId = `${section.id}-heading`;

              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={headingId}
                  className="scroll-mt-24"
                >
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.iconClass}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2
                        id={headingId}
                        className="break-words text-lg font-bold leading-7 text-slate-100 sm:text-xl"
                      >
                        {index + 1}. {section.title}
                      </h2>

                      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300 sm:text-base">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="break-words">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.link &&
                        (section.link.external ? (
                          <a
                            href={section.link.href}
                            className={textLinkStyles}
                          >
                            <span className="min-w-0 [overflow-wrap:anywhere]">
                              {section.link.label}
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={section.link.href}
                            className={textLinkStyles}
                          >
                            <span className="min-w-0 break-words">
                              {section.link.label}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Closing notice */}
        <div className="mx-auto mt-7 max-w-2xl text-center">
          <p className="text-sm leading-6 text-slate-400">
            By using The Expertise Wins, you acknowledge that sports outcomes
            are uncertain and that you remain responsible for your own betting
            decisions.
          </p>

          <Link
            href="/about"
            className={`mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 ${focusStyles}`}
          >
            Learn more about The Expertise Wins
          </Link>
        </div>
      </div>
    </main>
  );
}
