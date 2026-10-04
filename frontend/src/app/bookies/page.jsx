// frontend/src/app/bookies/page.jsx
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  ExternalLink,
  Gift,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";

export const metadata = {
  title: "Where We Place Our Bets | The Expertise Wins",
  description:
    "Explore featured bookmaker registration links, promo-code instructions, and responsible betting guidance from The Expertise Wins.",
};

const bookmakers = [
  {
    id: "betwinners",
    name: "BetWinners",
    eyebrow: "Our featured betting partner",
    description:
      "This is one of the platforms we use for the bets shared through The Expertise Wins. If you choose to register, follow the instructions below and confirm any welcome offer directly with the bookmaker.",
    promo: "Promo code: PIKKBETTER",
    offer: "Listed offer: first deposit doubled*",
    accent: "cyan",
    links: [
      {
        label: "Register on BetWinners — Web",
        href: "https://bwredir.com/122C",
      },
      {
        label: "BetWinners — APK Link",
        href: "https://bwredir.com/122D",
      },
    ],
    steps: [
      "Open the BetWinners registration link.",
      "Register a new account and complete the required information.",
      "Enter promo code PIKKBETTER.",
      "Before depositing, confirm the offer, eligibility rules, and applicable bonus terms.",
    ],
  },
  {
    id: "22bet",
    name: "22Bet",
    eyebrow: "Alternative registration",
    description:
      "22Bet is another platform featured for our community. The registration instructions supplied for this link do not require a promo code; confirm the current requirements directly with the bookmaker.",
    promo: "No promo code listed",
    offer: "Listed offer: first deposit doubled*",
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
      "No promo code is listed for this registration link.",
      "Before depositing, confirm the offer, eligibility rules, and applicable bonus terms.",
    ],
  },
];

const generalSteps = [
  "Check that you meet the legal age requirements and that the platform is permitted where you live.",
  "If you choose to register, open your preferred platform’s link and complete the required information.",
  "Follow the platform-specific registration and promo-code instructions.",
  "Before depositing, read the current bonus terms, eligibility rules, and wagering requirements.",
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const contextItems = [
  {
    title: "Free Tip Archives",
    description: "Review selections and recorded results",
  },
  {
    title: "Offer Conditions",
    description: "Registration offers and eligibility may change",
  },
  {
    title: "Legal Age Only",
    description: "18+ or the higher minimum where you live",
  },
];

export default function BookiesPage() {
  return (
    <main
      aria-labelledby="bookies-heading"
      className="relative isolate overflow-hidden py-10 sm:py-16"
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full max-w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Where we place our bets</span>
          </div>

          <h1
            id="bookies-heading"
            className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Bet where{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              we do.
            </span>
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Explore the betting platforms featured by The Expertise Wins.
            If you choose to register, follow the instructions and check
            the bookmaker&apos;s current terms before depositing.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {contextItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <p className="text-sm font-bold text-slate-100">
                  {item.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Affiliate disclosure */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-left">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <p className="text-xs leading-6 text-slate-400">
              <span className="font-semibold text-slate-200">
                Affiliate disclosure:
              </span>{" "}
              We may earn a commission from qualifying registrations
              through these links. Listed offers are not live-verified
              on this page.
            </p>
          </div>
        </header>

        {/* Bookmaker cards */}
        <section
          aria-labelledby="bookmaker-options-heading"
          className="mt-10 sm:mt-14"
        >
          <h2 id="bookmaker-options-heading" className="sr-only">
            Featured bookmaker registration options
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {bookmakers.map((bookmaker) => {
              const isCyan = bookmaker.accent === "cyan";
              const accentText = isCyan
                ? "text-cyan-400"
                : "text-amber-400";

              return (
                <article
                  key={bookmaker.id}
                  aria-labelledby={`${bookmaker.id}-heading`}
                  className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-8"
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-1 ${
                      isCyan ? "bg-cyan-400" : "bg-amber-400"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold uppercase leading-5 tracking-wider ${accentText}`}
                      >
                        {bookmaker.eyebrow}
                      </p>
                      <h3
                        id={`${bookmaker.id}-heading`}
                        className="mt-2 break-words text-2xl font-extrabold text-slate-100 sm:text-3xl"
                      >
                        {bookmaker.name}
                      </h3>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                      <Star
                        className={`h-5 w-5 ${accentText}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-400">
                    {bookmaker.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="inline-flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold leading-5 text-emerald-300">
                      <BadgePercent
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      {bookmaker.offer}
                    </span>

                    <span className="inline-flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold leading-5 text-slate-300">
                      <WalletCards
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      {bookmaker.promo}
                    </span>
                  </div>

                  {/* Registration instructions */}
                  <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Registration instructions
                    </h4>
                    <StepList
                      steps={bookmaker.steps}
                      accentClass={accentText}
                    />
                  </div>

                  {/* External registration links */}
                  <div className="mt-auto pt-6">
                    <div className="space-y-3 border-t border-slate-800 pt-6">
                      {bookmaker.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-bold leading-6 text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-800 ${focusStyles}`}
                        >
                          <span className="min-w-0 break-words">
                            {link.label}
                            <span className="sr-only">
                              {" "}
                              (opens in a new tab)
                            </span>
                          </span>
                          <ExternalLink
                            className={`h-4 w-4 shrink-0 ${accentText}`}
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>

                    <p className="mt-5 text-xs leading-6 text-slate-400">
                      *The listed offer is subject to confirmation.
                      Bonus availability, eligibility, wagering
                      requirements, minimum deposits, and other
                      conditions are determined by {bookmaker.name}.
                      Confirm current terms directly with the bookmaker.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Registration guidance and responsible betting */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section
            aria-labelledby="registration-guide-heading"
            className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Before you register
                </p>
                <h2
                  id="registration-guide-heading"
                  className="mt-2 text-xl font-bold text-slate-100"
                >
                  Check the requirements first
                </h2>
              </div>
            </div>

            <StepList steps={generalSteps} accentClass="text-cyan-400" />
          </section>

          <section
            aria-labelledby="responsible-betting-heading"
            className="min-w-0 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-5 sm:p-8"
          >
            <ShieldCheck
              className="mb-4 h-8 w-8 text-emerald-400"
              aria-hidden="true"
            />

            <h2
              id="responsible-betting-heading"
              className="text-xl font-bold text-slate-100"
            >
              Bet responsibly
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              Betting should be entertainment, not a way to make money.
              Only play with money you can afford to lose, never chase
              losses, and take a break if betting stops being enjoyable.
            </p>

            <p className="mt-5 text-xs font-semibold leading-6 text-emerald-300">
              18+ only, or the higher legal minimum where you live.
              Follow local laws and age requirements.
            </p>

            <Link
              href="/responsible-betting"
              className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg py-2 text-sm font-bold text-emerald-300 transition-colors hover:text-emerald-200 ${focusStyles}`}
            >
              Read responsible betting guidance
              <ArrowRight
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </Link>
          </section>
        </div>

        {/* Tip archive navigation */}
        <nav
          aria-label="Related pages"
          className="mt-8 flex justify-center"
        >
          <Link
            href="/tips"
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-cyan-400 transition-colors hover:bg-slate-900 hover:text-cyan-300 ${focusStyles}`}
          >
            Explore free tips
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </main>
  );
}

function StepList({ steps, accentClass }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li
          key={step}
          className="flex items-start gap-3 text-sm leading-6 text-slate-300"
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold ${accentClass}`}
          >
            {index + 1}
          </span>
          <span className="min-w-0 break-words">{step}</span>
        </li>
      ))}
    </ol>
  );
}