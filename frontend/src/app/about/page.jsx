// frontend/src/app/about/page.jsx

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Code2,
  ExternalLink,
  Heart,
  Mail,
  Send,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

export const metadata = {
  title: "About The Expertise Wins",
  description:
    "Learn about The Expertise Wins, our approach to sports analysis, community, and open-source development.",
};

const principles = [
  {
    icon: Target,
    title: "Our purpose",
    text: "Turn noisy sports information into clear, organized insight that is easier for fans to understand.",
  },
  {
    icon: BarChart3,
    title: "Our approach",
    text: "Track outcomes, explain context, and keep performance visible rather than relying on hype alone.",
  },
  {
    icon: Users,
    title: "Our community",
    text: "Create a respectful space for sports fans to learn, discuss, and share the journey together.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden py-12 sm:py-20">
      {/* Background accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
        aria-hidden="true"
      />

      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            About the project
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-100 sm:text-6xl">
            Making sports insight more{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              clear, useful, and accountable.
            </span>
          </h1>

          <p className="text-lg leading-relaxed text-slate-300">
            The Expertise Wins is an independent sports analytics and
            community project built to bring together curated tips, normalized
            markets, performance tracking, and practical betting education in
            one place.
          </p>
        </div>

        {/* Principles */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-colors hover:border-slate-700"
            >
              <Icon
                className="h-7 w-7 text-emerald-400"
                aria-hidden="true"
              />

              <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {text}
              </p>
            </article>
          ))}
        </div>

        {/* Trust + Community */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Trust */}
          <article className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white">
              Trust & transparency
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              Our selections are independently curated from sports information
              and specialist sources, then organized and presented through The
              Expertise Wins platform.
            </p>

            <p className="text-sm leading-relaxed text-slate-300">
              Free football coverage is available to the community. Premium
              access covers selected sports, specialist markets, and
              additional curated content.
            </p>

            <p className="text-sm leading-relaxed text-slate-400">
              Performance information is presented transparently for tracking
              and educational purposes. Past results do not guarantee future
              outcomes.
            </p>

            <div className="flex items-start gap-3 text-sm text-emerald-300">
              <ShieldCheck
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <span>
                <strong>18+ • Bet responsibly.</strong> Betting involves risk.
                This platform provides informational and entertainment content,
                not financial advice. Only participate where betting is legal
                and within your means.
              </span>
            </div>
          </article>

          {/* Community */}
          <article className="space-y-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white">
              Stay close to the project
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              Follow the official Telegram channel for daily selections,
              updates, and community conversations. For direct account,
              access, or partnership support, contact the admin at{" "}
              <span className="font-semibold text-amber-300">
                @PikkBetter
              </span>
              .
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-bold text-sky-300 transition-colors hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Official Telegram
              </a>

              <a
                href="https://t.me/pikkbetter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Admin: @PikkBetter
              </a>

              <a
                href="mailto:midwaymaster10@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-bold text-slate-200 transition-colors hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contact us
              </a>
            </div>
          </article>
        </div>

        {/* Developer / Open Source */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-slate-900/70 to-cyan-500/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-300">
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                Built in public
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white">
                Developers are welcome to contribute.
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The Expertise Wins is also a software project. The platform
                brings together data collection, normalization, analytics,
                APIs, and the tools behind the sports workflow.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                If you&apos;re a developer, feel free to explore the code,
                report issues, suggest improvements, or contribute to the
                project. The goal is to keep building useful software in the
                open.
              </p>
            </div>

            <a
              href="https://github.com/john-walter-munene/The-Expertise-Wins-API"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Contribute on GitHub
              <ExternalLink
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/tips"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            Explore tips
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/coffee"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          >
            <Heart className="h-4 w-4 text-rose-400" aria-hidden="true" />
            Support the project
          </Link>
        </div>
      </section>
    </main>
  );
}
