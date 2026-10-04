// frontend/src/components/Footer.jsx

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Coffee, Github, Mail, Send, Twitter } from "lucide-react";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Free Tips", href: "/tips" },
      { label: "Blog & Insights", href: "/blog" },
      { label: "Results & Stats", href: "/stats" },
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Premium",
    links: [
      { label: "Pikk Better VIP", href: "/products" },
      { label: "Pikk MaxBet VIP", href: "/products" },
      { label: "Access Tokens", href: "/products" },
      { label: "VIP Access", href: "/products" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "How It Works", href: "/about" },
      { label: "Results & Analytics", href: "/stats" },
      { label: "The Technology", href: "/about" },
      { label: "API & Partnerships", href: "/about" },
    ],
  },
];

const bottomLinks = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Responsible Betting", href: "/responsible-betting" },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${focusStyles}`;

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {/* Main footer */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-8">
          <div className="max-w-md space-y-5 sm:col-span-3 lg:col-span-1">
            <Link
              href="/"
              aria-label="The Expertise Wins home"
              className={`inline-flex items-center gap-3 rounded-xl ${focusStyles}`}
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-emerald-500/30">
                <Image
                  src="/app-icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="font-extrabold tracking-tight text-white">
                  The Expertise Wins
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Sports Intelligence
                </p>
              </div>
            </Link>

            <p className="text-sm font-semibold leading-6 text-slate-200">
              Curated sports intelligence, disciplined analysis and transparent
              performance tracking.
            </p>

            <p className="text-sm leading-6 text-slate-400">
              The Expertise Wins collects and organizes predictions from trusted
              sources, curates selections and delivers them through free and
              premium channels. The platform is built around a simple idea:
              turn a repeatable process into reliable, measurable infrastructure.
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonStyles} border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Official Telegram
                <span className="sr-only"> (opens in a new tab)</span>
              </a>

              <a
                href="https://t.me/pikkbetter"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonStyles} border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20`}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                VIP Support
                <span className="sr-only"> (opens in a new tab)</span>
              </a>

              <Link
                href="/blog"
                className={`${buttonStyles} border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Blog & Insights
              </Link>
            </div>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={`Footer ${group.title}`}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                {group.title}
              </h2>

              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`inline-block rounded py-2 text-sm transition-colors hover:text-emerald-300 ${focusStyles}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Contact and social links */}
        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">Follow the operation.</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Follow daily picks, results, updates and new products.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://x.com/munene254_"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Expertise Wins on X (opens in a new tab)"
              className={`${buttonStyles} border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white`}
            >
              <Twitter className="h-4 w-4" aria-hidden="true" />
              X
            </a>

            <a
              href="https://github.com/john-walter-munene/The-Expertise-Wins-API"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Expertise Wins on GitHub (opens in a new tab)"
              className={`${buttonStyles} border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white`}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>

            <a
              href="mailto:midwaymaster10@gmail.com"
              className={`${buttonStyles} border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white`}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact
            </a>

            <Link
              href="/coffee"
              className={`${buttonStyles} border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20`}
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Support
            </Link>
          </div>
        </div>

        {/* Legal links */}
        <div className="mt-10 flex flex-col gap-5 border-t border-slate-800 pt-6 text-xs sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-slate-300">The Expertise Wins</p>
            <p className="mt-2 leading-5 text-slate-400">
              © {new Date().getFullYear()} The Expertise Wins. All rights
              reserved.
            </p>
          </div>

          <nav
            aria-label="Footer legal navigation"
            className="flex flex-wrap gap-x-5 gap-y-1"
          >
            {bottomLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded py-2 transition-colors hover:text-emerald-300 ${focusStyles}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Responsible betting disclaimer */}
        <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-400">
          Sports predictions and betting tips are inherently uncertain and are
          not guarantees of financial outcomes. Past performance does not
          guarantee future results. Please make informed decisions and bet
          responsibly.
        </p>
      </div>
    </footer>
  );
}