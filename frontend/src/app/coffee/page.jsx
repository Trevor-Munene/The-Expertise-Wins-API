// frontend/src/app/coffee/page.jsx

import Link from "next/link";
import { Coffee, Heart, Send, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Support The Expertise Wins",
  description:
    "Support The Expertise Wins and stay connected with the official Telegram channel and admin.",
};

export default function CoffeePage() {
  return (
    <main className="relative overflow-hidden py-14 sm:py-24">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Coffee className="w-8 h-8" aria-hidden="true" />
        </div>

        {/* Heading */}
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mt-7">
          Support the work
        </p>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mt-3">
          Buy The Expertise Wins a coffee.
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed mt-6 max-w-2xl mx-auto">
          If the tips, tools, content, or community have been useful to you,
          you can support the time and work that goes into building and
          maintaining The Expertise Wins.
        </p>

        {/* Support card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 mt-10 text-left shadow-2xl shadow-black/10">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
              <Coffee className="w-5 h-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Support the journey
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed mt-1">
                Every contribution helps keep the project moving, independent,
                and focused on delivering useful work.
              </p>
            </div>
          </div>

          {/* Primary support CTA */}
          <a
            href="https://buymeacoffee.com/munene254_"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl bg-amber-500 text-slate-950 px-5 py-4 font-bold hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span className="flex items-center gap-3">
              <Coffee className="w-5 h-5" aria-hidden="true" />
              Buy Me a Coffee
            </span>

            <span aria-hidden="true">↗</span>
          </a>

          <p className="text-xs text-slate-500 mt-3">
            Support The Expertise Wins directly through my Buy Me a Coffee
            page.
          </p>

          {/* Community links */}
          <div className="mt-8 pt-7 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Stay connected
            </p>

            <div className="space-y-3">
              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 px-4 py-3.5 font-bold hover:bg-sky-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <span className="flex items-center gap-3">
                  <Send className="w-5 h-5" aria-hidden="true" />
                  Join the Official Telegram Channel
                </span>

                <span aria-hidden="true">↗</span>
              </a>

              <a
                href="https://t.me/pikkbetter"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3.5 font-bold hover:bg-amber-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <span className="flex items-center gap-3">
                  <Send className="w-5 h-5" aria-hidden="true" />
                  Contact Admin: @PikkBetter
                </span>

                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Independence message */}
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 mt-7">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Your support helps keep the project independent.</span>
        </div>

        {/* About link */}
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white mt-8 rounded focus:outline-none focus:ring-2 focus:ring-slate-400/50 px-2 py-1"
        >
          <Heart
            className="w-4 h-4 text-rose-400"
            aria-hidden="true"
          />
          Learn more about the project
        </Link>
      </section>
    </main>
  );
}