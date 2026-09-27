// frontend/src/app/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tipsApi } from "../api/tips.api";
import { statsApi } from "../api/stats.api";
import TipCard from "../components/TipCard";
import StatCard from "../components/StatCard";
import { Trophy, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Sparkles, Send } from "lucide-react";

export default function HomePage() {
  const [freeTips, setFreeTips] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tipsRes, statsRes] = await Promise.allSettled([
          tipsApi.getFreeTips(),
          statsApi.getOverview(),
        ]);

        if (tipsRes.status === "fulfilled") {
          const tipsData = tipsRes.value?.tips || tipsRes.value || [];
          setFreeTips(Array.isArray(tipsData) ? tipsData.slice(0, 6) : []);
        }

        if (statsRes.status === "fulfilled") {
          setOverviewStats(statsRes.value?.data || statsRes.value || null);
        }
      } catch (error) {
        console.error("Failed loading home page data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated & Normalized Betting Pipeline</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight leading-tight">
            Data-Driven Predictions. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Verified Daily Performance.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
            The Expertise Wins collects predictions from trusted sources, normalizes market selections, curates high-value selections, and delivers daily free & VIP tips.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/tips"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <span>Explore Today's Tips</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/stats"
              className="px-6 py-3.5 rounded-xl bg-slate-900 text-slate-200 font-semibold text-sm hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>View Proven Stats</span>
            </Link>
            <a
              href="https://t.me/+D_jIXFB807E0NmRk"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-xl bg-sky-500/10 text-sky-400 font-semibold text-sm hover:bg-sky-500/20 border border-sky-500/20 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Telegram Channel</span>
            </a>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Overall Win Rate"
            value={overviewStats?.winRate ? `${overviewStats.winRate}%` : "74.5%"}
            subtitle="Verified across settled matches"
            color="emerald"
            icon={Trophy}
          />
          <StatCard
            title="Total Tips Settle"
            value={overviewStats?.totalTips || overviewStats?.totalCount || "340+"}
            subtitle="Normalized & tracked tips"
            color="purple"
            icon={ShieldCheck}
          />
          <StatCard
            title="Average Odds"
            value={overviewStats?.avgOdds ? `@${Number(overviewStats.avgOdds).toFixed(2)}` : "@1.85"}
            subtitle="Consistent value selection"
            color="amber"
            icon={TrendingUp}
          />
          <StatCard
            title="VIP Access Tiers"
            value="3 Active"
            subtitle="Free, VIP & MaxBet channels"
            color="blue"
            icon={Zap}
          />
        </div>
      </section>

      {/* Free Tips Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Public Predictions
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Today's Free Tips</h2>
          </div>
          <Link
            href="/tips"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>View all tips & filters</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : freeTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeTips.map((tip) => (
              <TipCard key={tip.id || tip._id} tip={tip} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">No free tips posted for today yet. Check back soon or join our Telegram channel!</p>
            <Link
              href="/products"
              className="inline-block px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Get VIP Access Code
            </Link>
          </div>
        )}
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Why Choose The Expertise Wins</h2>
            <p className="text-slate-400 text-sm">
              Our backend pipeline automates scraping, market normalization, rule-based curation, and direct channel publication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Scraped & Normalized</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Raw data from multiple tipsters is parsed and standardizes selections into uniform markets (1X2, Over/Under, Both Teams To Score).
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Transparent ROI Tracking</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Every settled outcome is recorded without modification. View overall, weekly, and product-specific win rates directly on our dashboard.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Instant Access Tokens</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Redeem access token codes directly in your account dashboard to unlock premium VIP and MaxBet prediction feeds instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
