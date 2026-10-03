// frontend/src/app/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { tipsApi } from "../api/tips.api";
import { statsApi } from "../api/stats.api";
import TipCard from "../components/TipCard";
import StatCard from "../components/StatCard";

export default function HomePage() {
  const [freeTips, setFreeTips] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      const [tipsRes, statsRes, oddsRes] = await Promise.allSettled([
        tipsApi.getArchive({
          tier: "free",
          day: new Date().toISOString().slice(0, 10),
          limit: 6,
        }),
        statsApi.getOverview(),
        statsApi.getOddsStats(),
      ]);

      if (!mounted) return;

      if (tipsRes.status === "fulfilled") {
        const tipsData =
          tipsRes.value?.tips?.data ??
          tipsRes.value?.data ??
          tipsRes.value ??
          [];

        setFreeTips(Array.isArray(tipsData) ? tipsData.slice(0, 6) : []);
      }

      if (statsRes.status === "fulfilled") {
        const overview = statsRes.value?.stats ?? statsRes.value?.data ?? statsRes.value ?? null;
        const odds = oddsRes.status === "fulfilled"
          ? oddsRes.value?.stats?.average ?? oddsRes.value?.stats?.avgOdds
          : null;
        setOverviewStats(overview ? { ...overview, avgOdds: odds } : null);
      } else {
        setOverviewStats(null);
      }

      setLoading(false);
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const winRate =
    overviewStats?.winRate !== undefined &&
    overviewStats?.winRate !== null
      ? `${overviewStats.winRate}%`
      : "—";

  const totalTips =
    overviewStats?.settledTips ??
    overviewStats?.settled ??
    "—";

  const averageOdds =
    overviewStats?.avgOdds !== undefined &&
    overviewStats?.avgOdds !== null
      ? `@${Number(overviewStats.avgOdds).toFixed(2)}`
      : "—";

  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"
          aria-hidden="true"
        />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sports Intelligence &amp; Daily Curation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight leading-tight">
            Data-Driven Selections.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Tracked Daily Performance.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
            The Expertise Wins delivers at least 6 free football tips daily
            for the community, while premium access expands coverage across
            other sports, markets, VIP selections, and MaxBet opportunities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/tips"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>Explore Today&apos;s Tips</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              href="/stats"
              className="px-6 py-3.5 rounded-xl bg-slate-900 text-slate-200 font-semibold text-sm hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <TrendingUp
                className="w-4 h-4 text-emerald-400"
                aria-hidden="true"
              />
              <span>View Performance Stats</span>
            </Link>

            <a
              href="https://t.me/+D_jIXFB807E0NmRk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-sky-500/10 text-sky-400 font-semibold text-sm hover:bg-sky-500/20 border border-sky-500/20 transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Official Telegram Channel</span>
            </a>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-labelledby="performance-heading"
      >
        <h2 id="performance-heading" className="sr-only">
          Performance overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Overall Win Rate"
            value={winRate}
            subtitle={
              overviewStats
                ? "Across settled tips"
                : "Performance data unavailable"
            }
            color="emerald"
            icon={Trophy}
          />

          <StatCard
            title="Settled Tips"
            value={totalTips}
            subtitle={
              overviewStats
                ? "Normalized & tracked"
                : "Performance data unavailable"
            }
            color="purple"
            icon={ShieldCheck}
          />

          <StatCard
            title="Average Odds"
            value={averageOdds}
            subtitle={
              overviewStats
                ? "Across available settled tips"
                : "Performance data unavailable"
            }
            color="amber"
            icon={TrendingUp}
          />

          <StatCard
            title="Access Levels"
            value="3"
            subtitle="Free, VIP & MaxBet"
            color="blue"
            icon={Zap}
          />
        </div>
      </section>

      {/* Free Tips */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
        aria-labelledby="free-tips-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Free Football Coverage
            </div>

            <h2
              id="free-tips-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-100"
            >
              Today&apos;s 6+ Free Football Tips
            </h2>

            <p className="text-slate-500 text-xs mt-2">
              Start with the public selections and follow the results over
              time.
            </p>
          </div>

          <Link
            href="/tips"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
          >
            <span>View all tips &amp; filters</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading today's free tips"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : freeTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeTips.map((tip, index) => (
              <TipCard
                key={tip.id ?? tip._id ?? `free-tip-${index}`}
                tip={tip}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="w-11 h-11 mx-auto rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Trophy
                className="w-5 h-5 text-emerald-400"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-slate-200 text-sm font-semibold">
                Today&apos;s free football tips are not posted yet.
              </p>

              <p className="text-slate-500 text-xs leading-relaxed">
                Check back shortly or follow the official Telegram channel for
                daily updates.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/tips"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                Browse Tips
              </Link>

              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                Join Telegram
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Built Around the Work
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed">
              The Expertise Wins turns sports-source data into structured
              selections, publishes them through the community workflow, and
              tracks outcomes so performance can be reviewed over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Data Pipeline */}
            <article className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck
                  className="w-6 h-6"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-bold text-lg text-slate-100">
                Structured &amp; Normalized
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                Source data is collected, parsed, and normalized into
                consistent sports, competitions, markets, selections, odds,
                and fixture information before publication.
              </p>
            </article>

            {/* Performance */}
            <article className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <TrendingUp
                  className="w-6 h-6"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-bold text-lg text-slate-100">
                Transparent Performance
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                Published selections can be tracked through their outcomes,
                creating a record that can be reviewed through the
                performance dashboard.
              </p>
            </article>

            {/* Access */}
            <article className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Zap
                  className="w-6 h-6"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-bold text-lg text-slate-100">
                Simple Premium Access
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                Choose your access level, complete the membership process, and
                redeem the access token provided by Admin to unlock your
                premium subscription.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900 p-8 sm:p-10 text-center">
          <div
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/5 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Follow the work</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Start with the free channel.
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
              Explore the daily selections, follow the results, and when
              you&apos;re ready for broader coverage, discover the VIP and
              MaxBet access options.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/tips"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Explore Free Tips
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                View VIP Access
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
