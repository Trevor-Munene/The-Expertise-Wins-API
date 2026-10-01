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

export const metadata = {
title: "Terms of Service",
description:
"Read the Terms of Service for using The Expertise Wins website, services, and community.",
};

export default function TermsPage() {
return ( <main className="relative overflow-hidden py-14 sm:py-24"> <div
     className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
     aria-hidden="true"
   />

```
  <section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
        <FileText className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
        Terms & conditions
      </p>

      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-100 sm:text-6xl">
        Terms of Service
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
        These terms explain the basic rules for using The Expertise Wins,
        including our website, sports tips, accounts, subscriptions, and
        community services.
      </p>

      <p className="mt-4 text-xs text-slate-500">
        Last updated: September 30, 2026
      </p>
    </div>

    <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/10 sm:p-10">
      <div className="space-y-10">
        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                1. Acceptance of these terms
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                By accessing or using The Expertise Wins website, services,
                or community, you agree to these Terms of Service. If you
                do not agree with these terms, please do not use the
                services.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                2. The service
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                The Expertise Wins provides sports information, curated
                selections, statistical information, educational content,
                and related digital services.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Our content is provided for informational and entertainment
                purposes. Sports results and betting outcomes are
                inherently uncertain, and past performance does not
                guarantee future results.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                3. Betting and financial responsibility
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                The Expertise Wins does not guarantee winnings, profits,
                successful bets, or any particular financial outcome.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                If you choose to participate in sports betting, you are
                responsible for your own decisions, stakes, and losses.
                Only participate where betting is legal for you and follow
                the applicable laws and regulations in your jurisdiction.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Never stake money you cannot afford to lose.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                4. Accounts
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Some features may require an account. You are responsible
                for providing accurate information and keeping your login
                credentials secure.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                You should not share your account credentials or access
                tokens with other people. We may restrict or suspend
                access where there is evidence of misuse, unauthorized
                sharing, fraud, or activity that compromises the service.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                5. Premium access and subscriptions
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Premium products and subscription access may provide
                additional sports, markets, selections, content, or
                community access.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Access is subject to the product and subscription terms
                presented at the time of purchase. Where access is issued
                manually, payment may need to be verified before an access
                token or subscription is provided.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Subscription access may be cancelled, suspended, or revoked
                where required by these terms or where an account or access
                token is misused.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                6. Community conduct
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Our community should remain useful, respectful, and safe.
                Do not use our services to harass others, distribute
                malicious content, impersonate another person, conduct
                fraud, or interfere with the operation of the service.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Community platforms such as Telegram may also have their
                own rules and terms that apply alongside these terms.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                7. Intellectual property
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                The Expertise Wins name, branding, website presentation,
                original written content, software, and other original
                materials are protected by applicable intellectual property
                laws.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                You may use the service for its intended personal purposes,
                but you should not reproduce, resell, redistribute, or
                commercially exploit protected content without permission.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                8. Availability and changes
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                We work to keep the service available and useful, but we
                do not guarantee uninterrupted availability, error-free
                operation, or that every feature will always remain
                available.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                We may update, improve, remove, or change parts of the
                service over time. We may also update these terms when
                necessary. The latest version published on this page will
                apply to future use of the service.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                9. Privacy
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Your use of the service is also subject to our Privacy
                Policy, which explains how information may be collected,
                used, and protected.
              </p>

              <Link
                href="/privacy"
                className="mt-4 inline-flex items-center font-semibold text-emerald-300 transition-colors hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Read our Privacy Policy
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                10. Contact
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                If you have questions about these terms, your account, or
                our services, contact The Expertise Wins.
              </p>

              <a
                href="mailto:midwaymaster10@gmail.com"
                className="mt-4 inline-flex font-semibold text-emerald-300 transition-colors hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                midwaymaster10@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div className="mt-7 text-center">
      <p className="text-sm leading-relaxed text-slate-400">
        By using The Expertise Wins, you acknowledge that sports outcomes
        are uncertain and that you remain responsible for your own betting
        decisions.
      </p>

      <Link
        href="/about"
        className="mt-5 inline-flex rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Learn more about The Expertise Wins
      </Link>
    </div>
  </section>
</main>
);
}