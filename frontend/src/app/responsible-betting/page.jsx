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

export default function ResponsibleBettingPage() {
return ( <main className="relative overflow-hidden py-14 sm:py-24"> <div
     className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
     aria-hidden="true"
   />

```
  <section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
        <ShieldCheck className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
        Play responsibly
      </p>

      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-100 sm:text-6xl">
        Keep betting in its place.
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
        Sports betting should be entertainment, not a financial
        necessity. Set your limits, understand the risks, and never stake
        more than you can afford to lose.
      </p>
    </div>

    <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/10 sm:p-10">
      <div className="space-y-10">
        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                1. Bet for entertainment
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Betting involves uncertainty. A well-researched selection
                can still lose, and no tip, strategy, statistic, or
                prediction can guarantee an outcome.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Treat betting as entertainment rather than a way to make
                money or solve financial problems.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                2. Set a budget
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Decide how much money you are comfortable spending before
                you place any bets. Your betting budget should come from
                money you can afford to lose after taking care of your
                normal financial responsibilities.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Never use money needed for food, housing, bills,
                education, savings, or other essential expenses.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                3. Manage your stakes
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Consider using consistent, predetermined stakes rather than
                increasing your bets simply because you have experienced a
                loss.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                Avoid chasing losses. A losing bet does not create an
                obligation to place another bet or increase your stake.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                4. Know the warning signs
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                Consider stepping away from betting if you find yourself
                regularly doing things such as:
              </p>

              <ul className="mt-4 space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    Betting more money or for longer than you originally
                    intended.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    Increasing stakes to try to recover previous losses.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    Borrowing money or selling possessions to fund betting.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    Feeling stressed, anxious, or unable to control your
                    betting.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>
                    Allowing betting to interfere with work, relationships,
                    sleep, or everyday responsibilities.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
              <LifeBuoy className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                5. Take a break when you need one
              </h2>

              <p className="mt-3 leading-relaxed text-slate-300">
                If betting stops feeling enjoyable or starts affecting
                other parts of your life, take a break. Consider using the
                responsible-gambling tools provided by your bookmaker,
                including deposit limits, spending limits, time limits,
                self-exclusion, or account restrictions where available.
              </p>

              <p className="mt-3 leading-relaxed text-slate-300">
                If you are struggling to control your gambling, consider
                speaking with a qualified professional or a recognized
                gambling-support organization in your country.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
                aria-hidden="true"
              />

              <div>
                <h2 className="font-bold text-slate-100">
                  No prediction is guaranteed
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  The Expertise Wins provides sports information and
                  curated selections, but every sporting event has an
                  uncertain outcome. Our content should never be treated as
                  guaranteed financial advice or a promise of profit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
      <Link
        href="/terms"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Read Terms of Service
      </Link>

      <Link
        href="/tips"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Explore Tips
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>

    <p className="mt-7 text-center text-xs leading-relaxed text-slate-500">
      Please follow the laws and regulations that apply to you. Betting
      should only be undertaken by people who are legally permitted to do
      so in their jurisdiction.
    </p>
  </section>
</main>
);
}