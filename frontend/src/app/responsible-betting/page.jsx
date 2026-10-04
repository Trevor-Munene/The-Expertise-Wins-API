// frontend/src/app/responsible-betting/page.jsx
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Heart,
  LifeBuoy,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "Responsible Betting",
  description:
    "Practical guidance for approaching sports betting responsibly and keeping it within your limits.",
};

const guidanceSections = [
  {
    id: "entertainment",
    title: "Bet for entertainment",
    icon: Heart,
    iconClass: "bg-emerald-500/10 text-emerald-300",
    paragraphs: [
      "Betting involves uncertainty. A well-researched selection can still lose, and no tip, strategy, statistic, or prediction can guarantee an outcome.",
      "Treat betting as entertainment rather than a way to make money or solve financial problems.",
    ],
  },
  {
    id: "budget",
    title: "Set a budget",
    icon: Wallet,
    iconClass: "bg-amber-500/10 text-amber-300",
    paragraphs: [
      "Decide how much money you are comfortable spending before you place any bets. Your betting budget should come from money you can afford to lose after taking care of your normal financial responsibilities.",
      "Never use money needed for food, housing, bills, education, savings, or other essential expenses.",
    ],
  },
  {
    id: "stakes",
    title: "Manage your stakes",
    icon: ShieldCheck,
    iconClass: "bg-sky-500/10 text-sky-300",
    paragraphs: [
      "Consider using consistent, predetermined stakes rather than increasing your bets simply because you have experienced a loss.",
      "Avoid chasing losses. A losing bet does not create an obligation to place another bet or increase your stake.",
    ],
  },
  {
    id: "warning-signs",
    title: "Know the warning signs",
    icon: AlertTriangle,
    iconClass: "bg-violet-500/10 text-violet-300",
    paragraphs: [
      "Consider stepping away from betting if you find yourself regularly doing things such as:",
    ],
    items: [
      "Betting more money or for longer than you originally intended.",
      "Increasing stakes to try to recover previous losses.",
      "Borrowing money or selling possessions to fund betting.",
      "Feeling stressed, anxious, or unable to control your betting.",
      "Allowing betting to interfere with work, relationships, sleep, or everyday responsibilities.",
    ],
  },
  {
    id: "take-a-break",
    title: "Take a break when you need one",
    icon: LifeBuoy,
    iconClass: "bg-rose-500/10 text-rose-300",
    paragraphs: [
      "If betting stops feeling enjoyable or starts affecting other parts of your life, take a break. Consider using the responsible-gambling tools provided by your bookmaker, including deposit limits, spending limits, time limits, self-exclusion, or account restrictions where available.",
      "If you are struggling to control your gambling, consider speaking with a qualified professional or a recognized gambling-support organization in your country.",
    ],
  },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export default function ResponsibleBettingPage() {
  return (
    <main
      aria-labelledby="responsible-betting-heading"
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
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Play responsibly
          </p>

          <h1
            id="responsible-betting-heading"
            className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Keep betting in its place.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Sports betting should be entertainment, not a financial
            necessity. Set your limits, understand the risks, and never
            stake more than you can afford to lose.
          </p>
        </header>

        {/* Responsible betting guidance */}
        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/10 sm:p-8 lg:p-10">
          <div className="space-y-8 sm:space-y-10">
            {guidanceSections.map((section, index) => {
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

                      {section.items && (
                        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-300 marker:text-emerald-400 sm:text-base">
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

            {/* Prediction disclaimer */}
            <section
              aria-labelledby="prediction-disclaimer-heading"
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <AlertTriangle
                  className="mt-1 h-5 w-5 shrink-0 text-amber-300"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <h2
                    id="prediction-disclaimer-heading"
                    className="text-base font-bold text-slate-100"
                  >
                    No prediction is guaranteed
                  </h2>

                  <p className="mt-2 break-words text-sm leading-7 text-slate-300">
                    The Expertise Wins provides sports information and
                    curated selections, but every sporting event has an
                    uncertain outcome. Our content should never be treated
                    as guaranteed financial advice or a promise of profit.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Related pages */}
        <nav
          aria-label="Related pages"
          className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <Link
            href="/terms"
            className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 sm:w-auto ${focusStyles}`}
          >
            Read Terms of Service
          </Link>

          <Link
            href="/tips"
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 sm:w-auto ${focusStyles}`}
          >
            Explore Tips
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>

        {/* Legal eligibility notice */}
        <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-6 text-slate-400">
          Please follow the laws and regulations that apply to you.
          Betting should only be undertaken by people who are legally
          permitted to do so in their jurisdiction.
        </p>
      </div>
    </main>
  );
}