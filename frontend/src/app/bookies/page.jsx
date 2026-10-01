// frontend/src/app/bookies/page.jsx

import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ExternalLink,
  Gift,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";

const bookmakers = [
  {
    name: "BetWinners",
    eyebrow: "Our featured betting partner",
    description:
      "This is one of the platforms we use for the bets shared through The Expertise Wins. New users registering for the first time can access the current welcome offer when they use our registration link and promo code.",
    promo: "PIKKBETTER",
    offer: "First deposit doubled*",
    accent: "cyan",
    links: [
      {
        label: "Register on BetWinners — Web",
        href: "https://bwredir.com/122C",
      },
      {
        label: "Register on BetWinners — APK",
        href: "https://bwredir.com/122D",
      },
    ],
    steps: [
      "Open the BetWinners registration link.",
      "Register a new account and complete the required information.",
      "Enter promo code PIKKBETTER.",
      "Make your first deposit and follow the applicable bonus terms.",
    ],
  },
  {
    name: "22Bet",
    eyebrow: "Alternative registration",
    description:
      "Looking for an alternative platform? 22Bet gives our community another straightforward route for placing bets. Registration through our link does not require a promo code.",
    promo: "No promo code required",
    offer: "First deposit doubled*",
    accent: "amber",
    links: [
      {
        label: "Register on 22Bet",
        href: "https://bit.ly/Pikkbetter",
      },
    ],
    steps: [
      "Open the 22Bet registration link.",
      "Create your account and complete the required information.",
      "No promo code is required on this registration link.",
      "Make your first deposit and follow the applicable bonus terms.",
    ],
  },
];

const generalSteps = [
  "Choose the platform you want to use and open its registration link.",
  "Create your account and complete all required information.",
  "Follow the specific instructions shown for that platform.",
  "Before depositing, read the current bonus terms, eligibility rules, and wagering requirements.",
];

export const metadata = {
  title: "Where We Place Our Bets | The Expertise Wins",
  description:
    "Find the betting platforms used by The Expertise Wins community, including current registration offers and promo-code instructions.",
};

export default function BookiesPage() {
  return (
    <main className="relative overflow-hidden py-10 sm:py-16">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <Gift className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Where we place our bets</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 mt-5">
            Bet where{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              we do.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mt-5">
            These are the betting platforms currently featured on The
            Expertise Wins channel. Choose your preferred platform, follow
            the registration instructions, and always check the bookmaker&apos;s
            current terms before depositing.
          </p>

          {/* Trust / context strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <p className="text-sm font-bold text-slate-100">
                Daily Free Tips
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Follow the channel before you play
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <p className="text-sm font-bold text-slate-100">
                Partner Offers
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Registration offers may change
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <p className="text-sm font-bold text-slate-100">
                18+ Only
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Bet responsibly and within the law
              </p>
            </div>
          </div>

          {/* Affiliate disclosure */}
          <div className="inline-flex items-start sm:items-center gap-2 text-xs text-slate-400 bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 mt-5 text-left">
            <ShieldCheck
              className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0"
              aria-hidden="true"
            />
            <span>
              Affiliate disclosure: we may earn a commission from qualifying
              registrations through these links.
            </span>
          </div>
        </div>

        {/* Bookmaker cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14">
          {bookmakers.map((bookmaker) => {
            const isCyan = bookmaker.accent === "cyan";

            return (
              <article
                key={bookmaker.name}
                className="relative flex flex-col bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/10 overflow-hidden"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isCyan ? "bg-cyan-400" : "bg-amber-400"
                  }`}
                  aria-hidden="true"
                />

                {/* Card header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${
                        isCyan ? "text-cyan-400" : "text-amber-400"
                      }`}
                    >
                      {bookmaker.eyebrow}
                    </p>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                      {bookmaker.name}
                    </h2>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                    <Star
                      className={`w-5 h-5 ${
                        isCyan ? "text-cyan-400" : "text-amber-400"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mt-5">
                  {bookmaker.description}
                </p>

                {/* Offer badges */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-2 text-xs font-bold">
                    <BadgePercent
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                    {bookmaker.offer}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 text-xs font-bold">
                    <WalletCards
                      className="w-4 h-4 text-slate-500"
                      aria-hidden="true"
                    />
                    {bookmaker.promo}
                  </span>
                </div>

                {/* Registration steps */}
                <div className="mt-7 rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Registration
                  </p>

                  <ol className="space-y-3">
                    {bookmaker.steps.map((step, index) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-sm text-slate-300"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-cyan-400 text-[11px] font-bold shrink-0">
                          {index + 1}
                        </span>

                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Registration links */}
                <div className="space-y-3 mt-6 pt-6 border-t border-slate-800">
                  {bookmaker.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 px-4 py-3.5 text-sm font-bold text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <span>{link.label}</span>

                      <ExternalLink
                        className="w-4 h-4 text-cyan-400 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mt-5">
                  *Bonus availability, eligibility, wagering requirements,
                  minimum deposits, and other conditions are determined by{" "}
                  {bookmaker.name}. Offers can change, so confirm the current
                  terms directly on the bookmaker&apos;s platform.
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works + responsible betting */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6">
          {/* General steps */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  Getting started
                </p>

                <h2 className="text-xl font-bold text-white mt-1">
                  From registration to your first bet
                </h2>
              </div>
            </div>

            <ol className="space-y-4">
              {generalSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-cyan-400 text-xs font-bold shrink-0">
                    {index + 1}
                  </span>

                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Responsible betting */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-6 sm:p-8">
            <ShieldCheck
              className="w-8 h-8 text-emerald-400 mb-4"
              aria-hidden="true"
            />

            <h2 className="text-xl font-bold text-white">
              Bet responsibly
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mt-3">
              Betting should be entertainment, not a way to make money. Only
              play with money you can afford to lose, never chase losses, and
              take a break if betting stops being enjoyable.
            </p>

            <div className="flex items-start gap-2 mt-5 text-xs text-emerald-300 font-bold">
              <CheckCircle2
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                18+ only. Follow the laws and age requirements where you live.
              </span>
            </div>

            <Link
              href="/tips"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-5 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              Explore today&apos;s free tips
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center mt-10">
          <Link
            href="/tips"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 px-3 py-2"
          >
            Explore today&apos;s tips
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}