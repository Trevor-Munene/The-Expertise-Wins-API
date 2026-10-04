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
    id: "purpose",
    icon: Target,
    title: "Our purpose",
    text: "Turn noisy sports information into clear, organized insight that is easier for fans to understand.",
  },
  {
    id: "approach",
    icon: BarChart3,
    title: "Our approach",
    text: "Track outcomes, explain context, and keep performance visible rather than relying on hype alone.",
  },
  {
    id: "community",
    icon: Users,
    title: "Our community",
    text: "Create a respectful space for sports fans to learn, discuss, and share the journey together.",
  },
];

const contactLinks = [
  {
    label: "Official Telegram",
    href: "https://t.me/+D_jIXFB807E0NmRk",
    icon: Send,
    external: true,
    className:
      "border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
  },
  {
    label: "Admin: @PikkBetter",
    href: "https://t.me/pikkbetter",
    icon: Send,
    external: true,
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
  },
  {
    label: "Contact us",
    href: "mailto:midwaymaster10@gmail.com",
    icon: Mail,
    external: false,
    className:
      "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-800",
  },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${focusStyles}`;

export default function AboutPage() {
  return (
    <main
      aria-labelledby="about-heading"
      className="relative isolate overflow-hidden py-12 sm:py-20"
    >
      {/* Background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-full max-w-[650px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="max-w-3xl space-y-5 sm:space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            About the project
          </p>

          <h1
            id="about-heading"
            className="text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Making sports insight more{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              clear, useful, and accountable.
            </span>
          </h1>

          <p className="text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            The Expertise Wins is an independent sports analytics and
            community project built to bring together curated tips,
            normalized markets, performance tracking, and practical
            betting education in one place.
          </p>

          <p className="text-sm leading-7 text-slate-400 sm:text-base">
            We are a data pipeline curated by tipsters in Kenya:
            collecting sports information, normalizing markets,
            preserving daily records, and turning expert judgment into
            clear, trackable selections. Our goal is to make the journey
            from raw signals to responsible insight easier to understand
            and evaluate.
          </p>
        </header>

        {/* Project principles */}
        <section
          aria-labelledby="principles-heading"
          className="mt-10 sm:mt-14"
        >
          <h2 id="principles-heading" className="sr-only">
            Our guiding principles
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {principles.map(({ id, icon: Icon, title, text }) => (
              <article
                key={id}
                aria-labelledby={`${id}-heading`}
                className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3
                  id={`${id}-heading`}
                  className="mt-5 text-lg font-bold text-slate-100"
                >
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Transparency and community */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="transparency-heading"
            className="min-w-0 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8"
          >
            <h2
              id="transparency-heading"
              className="text-2xl font-bold text-slate-100"
            >
              Trust &amp; transparency
            </h2>

            <p className="text-sm leading-7 text-slate-300">
              Our selections are independently curated by experienced
              tipsters in Kenya from sports information and specialist
              sources, then organized and presented through The Expertise
              Wins data pipeline.
            </p>

            <p className="text-sm leading-7 text-slate-300">
              Free football coverage is available to the community.
              Premium access covers selected sports, specialist markets,
              and additional curated content.
            </p>

            <p className="text-sm leading-7 text-slate-400">
              Performance information is presented for tracking and
              educational purposes. Past results do not guarantee future
              outcomes.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <ShieldCheck
                className="mt-1 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />

              <p className="min-w-0 text-sm leading-7 text-slate-300">
                <strong className="text-emerald-300">
                  18+ or the higher legal minimum where you live.
                </strong>{" "}
                Betting involves risk. This platform provides
                informational and entertainment content, not financial
                advice. Only participate where betting is legal and
                within your means.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/stats"
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg py-2 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200 ${focusStyles}`}
              >
                View performance
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="/responsible-betting"
                className={`inline-flex min-h-[44px] items-center rounded-lg py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white ${focusStyles}`}
              >
                Responsible betting guidance
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="contact-heading"
            className="min-w-0 space-y-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-5 sm:p-8"
          >
            <h2
              id="contact-heading"
              className="text-2xl font-bold text-slate-100"
            >
              Stay close to the project
            </h2>

            <p className="text-sm leading-7 text-slate-300">
              Follow the official Telegram channel for daily selections
              and project updates. For direct account, access, or
              partnership support, contact the admin at{" "}
              <span className="font-semibold text-amber-300">
                @PikkBetter
              </span>
              .
            </p>

            <div className="flex flex-col gap-3 sm:items-start">
              {contactLinks.map((contact) => {
                const Icon = contact.icon;

                return (
                  <a
                    key={contact.href}
                    href={contact.href}
                    target={contact.external ? "_blank" : undefined}
                    rel={
                      contact.external
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className={`${buttonStyles} border ${contact.className}`}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {contact.label}
                    {contact.external && (
                      <span className="sr-only">
                        {" "}
                        (opens in a new tab)
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        </div>

        {/* Developer contributions */}
        <section
          aria-labelledby="contributions-heading"
          className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-slate-900/70 to-cyan-500/10 p-5 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                Built in public
              </div>

              <h2
                id="contributions-heading"
                className="mt-4 text-2xl font-bold text-slate-100"
              >
                Developers are welcome to contribute.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                The Expertise Wins is also a software project. The
                platform brings together data collection, normalization,
                analytics, APIs, and the tools behind the sports workflow.
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                If you&apos;re a developer, feel free to explore the code,
                report issues, suggest improvements, or contribute to the
                project. The goal is to keep building useful software in
                the open.
              </p>
            </div>

            <a
              href="https://github.com/john-walter-munene/The-Expertise-Wins-API"
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles} shrink-0 bg-slate-100 text-slate-950 hover:bg-white`}
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Explore on GitHub
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>

        {/* Related pages */}
        <nav
          aria-label="Explore and support the project"
          className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap"
        >
          <Link
            href="/tips"
            className={`${buttonStyles} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
          >
            Explore tips
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/coffee"
            className={`${buttonStyles} border border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:bg-slate-800`}
          >
            <Heart
              className="h-4 w-4 text-rose-400"
              aria-hidden="true"
            />
            Support the project
          </Link>
        </nav>
      </div>
    </main>
  );
}