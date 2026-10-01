// frontend/src/components/Footer.jsx

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Coffee,
  Github,
  Mail,
  Send,
  Twitter,
} from "lucide-react";

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

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-md space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-emerald-500/30">
                <Image
                  src="/app-icon.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="font-extrabold tracking-tight text-white">
                  The Expertise Wins
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Sports Intelligence
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold leading-6 text-slate-200">
              Curated sports intelligence, disciplined analysis and
              transparent performance tracking.
            </p>

            <p className="text-xs leading-6 text-slate-500">
              The Expertise Wins collects and organizes predictions from
              trusted sources, curates selections and delivers them through
              free and premium channels. The platform is built around a
              simple idea: turn a repeatable process into reliable,
              measurable infrastructure.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Official Telegram
              </a>

              <a
                href="https://t.me/pikkbetter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                VIP Support
              </a>

              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Blog & Insights
              </Link>
            </div>
          </div>

          {/* Navigation groups */}
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                {group.title}
              </h4>

              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Connect */}
        <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-slate-900 bg-slate-900/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">
              Follow the operation.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Follow daily picks, results, updates and new products.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://x.com/munene254_"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Expertise Wins on X"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Twitter className="h-3.5 w-3.5" aria-hidden="true" />
              X
            </a>

            <a
              href="https://github.com/john-walter-munene/The-Expertise-Wins-API"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Expertise Wins on GitHub"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              GitHub
            </a>

            <a
              href="mailto:midwaymaster10@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Contact
            </a>

            <Link
              href="/coffee"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
              Support
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-5 border-t border-slate-900 pt-6 text-xs sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-slate-300">
              The Expertise Wins
            </p>

            <p className="mt-1 text-slate-600">
              © {new Date().getFullYear()} The Expertise Wins. All rights
              reserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-slate-500">
            <Link
              href="/about"
              className="transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
            >
              About
            </Link>

            <Link
              href="/blog"
              className="transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
            >
              Blog
            </Link>

            <Link
              href="/privacy"
              className="transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
            >
              Terms
            </Link>

            <Link
              href="/responsible-betting"
              className="transition-colors hover:text-emerald-400 focus:outline-none focus-visible:text-emerald-400"
            >
              Responsible Betting
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-[11px] leading-5 text-slate-600">
          Sports predictions and betting tips are inherently uncertain and
          are not guarantees of financial outcomes. Past performance does
          not guarantee future results. Please make informed decisions and
          bet responsibly.
        </div>
      </div>
    </footer>
  );
}