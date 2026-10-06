// frontend/src/app/page.jsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
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

const TELEGRAM_URL = "https://t.me/+D_jIXFB807E0NmRk";
const containerStyles = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${focusStyles}`;

const features = [
  {
    title: "Structured & Normalized",
    description:
      "Source data is collected, parsed, and normalized into consistent sports, competitions, markets, selections, odds, and fixture information before publication.",
    icon: ShieldCheck,
    iconStyles: "bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Transparent Performance",
    description:
      "Published selections can be tracked through their outcomes, creating a record that can be reviewed through the performance dashboard.",
    icon: TrendingUp,
    iconStyles: "bg-teal-500/10 text-teal-400",
  },
  {
    title: "Simple Premium Access",
    description:
      "Choose your access level, complete the membership process, and redeem the access token provided by Admin to unlock your premium subscription.",
    icon: Zap,
    iconStyles: "bg-amber-500/10 text-amber-400",
  },
];

// Build the business date using the Nairobi calendar rather than UTC, so the
// day requested always matches the day the backend buckets tips into.
function getNairobiDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) => parts.find((part) => part.type === type)?.value;

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

// Normalize a sport value for comparison against the free football view.
function normalizeSport(value) {
  return String(value || "").trim().toUpperCase();
}

// The home page only ever shows free football tips, so anything that is not
// football is filtered out before it reaches the page.
function isFootballTip(tip) {
  const sport = normalizeSport(tip?.sport);
  return sport === "FOOTBALL" || sport === "SOCCER";
}

function isTipForToday(tip) {
  const timestamp = tip?.scrapedAt ?? tip?.publishedAt ?? tip?.createdAt;
  if (!timestamp) return false;

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) return false;

  const tipDay = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const getPart = (type) => tipDay.find((part) => part.type === type)?.value;
  const normalizedTipDay = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

  return normalizedTipDay === getNairobiDate();
}

// Accept numeric API values without converting missing values into zero.
function getFiniteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Read the response envelopes already supported by the homepage.
function unwrapStats(response) {
  const value = response?.stats ?? response?.data ?? response;
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

export default function HomePage() {
  const [freeTips, setFreeTips] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipsError, setTipsError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setTipsError(false);

      try {
        const [tipsRes, statsRes, oddsRes] = await Promise.allSettled([
          // The home page only shows free football picks published today.
          tipsApi.getFreeTips({
            day: getNairobiDate(),
            limit: 100,
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

          if (Array.isArray(tipsData)) {
            setFreeTips(
              tipsData
                .filter((tip) => tip && typeof tip === "object")
                .filter(isTipForToday)
                .filter(isFootballTip)
            );
          } else {
            setFreeTips([]);
            setTipsError(true);
          }
        } else {
          setFreeTips([]);
          setTipsError(true);
        }

        const overview =
          statsRes.status === "fulfilled" ? unwrapStats(statsRes.value) : null;
        const odds =
          oddsRes.status === "fulfilled" ? unwrapStats(oddsRes.value) : null;
        const avgOdds =
          getFiniteNumber(odds?.average) ??
          getFiniteNumber(odds?.avgOdds) ??
          getFiniteNumber(overview?.avgOdds);

        // Preserve independently available odds and overview metrics.
        setOverviewStats(
          overview || avgOdds !== null
            ? { ...overview, avgOdds }
            : null
        );
      } catch {
        if (!mounted) return;
        setFreeTips([]);
        setOverviewStats(null);
        setTipsError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [requestVersion]);

  const winRateNumber = getFiniteNumber(overviewStats?.winRate);
  const settledTipsNumber =
    getFiniteNumber(overviewStats?.settledTips) ??
    getFiniteNumber(overviewStats?.settled);
  const averageOddsNumber = getFiniteNumber(overviewStats?.avgOdds);

  const winRate = winRateNumber !== null ? `${winRateNumber}%` : "—";
  const totalTips = settledTipsNumber ?? "—";
  const averageOdds =
    averageOddsNumber !== null && averageOddsNumber > 0
      ? `@${averageOddsNumber.toFixed(2)}`
      : "—";

  const metricSubtitle = (available, text) =>
    loading
      ? "Loading performance data…"
      : available
        ? text
        : "Performance data unavailable";

  return (
    <div className="space-y-12 py-6 sm:space-y-16 sm:py-8">
      {/* Hero section */}
      <section
        aria-labelledby="home-heading"
        className={`relative isolate overflow-hidden pb-8 pt-8 sm:pb-12 sm:pt-12 ${containerStyles}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-3xl"
        />

        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 sm:text-xs">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sports Intelligence &amp; Daily Curation</span>
          </div>

          <h1
            id="home-heading"
            className="text-4xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
          >
            Data-Driven Selections.
            <span className="mt-2 block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Tracked Daily Performance.
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            The Expertise Wins delivers at least 6 free football tips daily for
            the community, while premium access expands coverage across other
            sports, markets, VIP selections, and MaxBet opportunities.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/tips"
              className={`${buttonStyles} bg-emerald-500 font-bold text-slate-950 shadow-lg shadow-emerald-500/15 hover:bg-emerald-400`}
            >
              Explore Today&apos;s Tips
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>

            <Link
              href="/stats"
              className={`${buttonStyles} border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800`}
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              View Performance Stats
            </Link>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles} border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
            >
              <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
              Official Telegram Channel
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Performance overview */}
      <section
        className={containerStyles}
        aria-labelledby="performance-heading"
        aria-busy={loading}
      >
        <h2 id="performance-heading" className="sr-only">
          Performance overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Overall Win Rate"
            value={loading ? "—" : winRate}
            subtitle={metricSubtitle(winRateNumber !== null, "Across settled tips")}
            color="emerald"
            icon={Trophy}
          />
          <StatCard
            title="Settled Tips"
            value={loading ? "—" : totalTips}
            subtitle={metricSubtitle(settledTipsNumber !== null, "Normalized & tracked")}
            color="purple"
            icon={ShieldCheck}
          />
          <StatCard
            title="Average Odds"
            value={loading ? "—" : averageOdds}
            subtitle={metricSubtitle(averageOdds !== "—", "Across available tips")}
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

      {/* Daily free tips */}
      <section
        className={`${containerStyles} space-y-6`}
        aria-labelledby="free-tips-heading"
        aria-busy={loading}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Free Football Coverage
            </p>
            <h2 id="free-tips-heading" className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              Today&apos;s Free Football Tips
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Start with the public selections and follow the results over time.
              All daily dates use Kenyan time.
            </p>
          </div>

          <Link
            href="/tips"
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300 ${focusStyles}`}
          >
            View all tips &amp; filters
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <p role="status" className="sr-only">
          {loading
            ? "Loading today's free tips."
            : tipsError
              ? "Today's free tips could not be loaded."
              : freeTips.length > 0
                ? `${freeTips.length} free tips loaded.`
                : "No free tips are currently available for today."}
        </p>

        {loading ? (
          <div aria-hidden="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-72 rounded-2xl border border-slate-800 bg-slate-900 p-5 motion-safe:animate-pulse">
                <div className="mb-5 h-5 w-2/3 rounded bg-slate-800" />
                <div className="mb-4 h-6 w-5/6 rounded bg-slate-800" />
                <div className="h-28 rounded-xl bg-slate-950/60" />
                <div className="mt-5 h-4 w-1/2 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : !tipsError && freeTips.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {freeTips.map((tip, index) => (
              <TipCard key={tip.id ?? tip._id ?? `free-tip-${index}`} tip={tip} />
            ))}
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center sm:p-8">
            <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
              <Trophy className="h-6 w-6 text-emerald-400" />
            </div>

            <div className="mx-auto max-w-lg space-y-2">
              <h3 className="text-base font-semibold text-slate-200">
                {tipsError
                  ? "We couldn't load today's free tips."
                  : "Today's free tips are not available yet."}
              </h3>
              <p className="text-sm leading-6 text-slate-400">
                {tipsError
                  ? "Please try again, or visit the tips page and official Telegram channel for updates."
                  : "Check back shortly or follow the official Telegram channel for daily updates."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {tipsError && (
                <button
                  type="button"
                  onClick={() => setRequestVersion((version) => version + 1)}
                  className={`${buttonStyles} border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700`}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try Again
                </button>
              )}
              <Link href="/tips" className={`${buttonStyles} border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700`}>
                Browse Tips
              </Link>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${buttonStyles} bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400`}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Join Telegram
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Platform features */}
      <section aria-labelledby="features-heading" className="border-y border-slate-800 bg-slate-900/60 py-12 sm:py-16">
        <div className={containerStyles}>
          <div className="mx-auto mb-8 max-w-2xl space-y-3 text-center sm:mb-10">
            <h2 id="features-heading" className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              Built Around the Work
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              The Expertise Wins turns sports-source data into structured
              selections, publishes them through the community workflow, and
              tracks outcomes so performance can be reviewed over time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
            {features.map(({ title, description, icon: Icon, iconStyles }) => (
              <article key={title} className="h-full space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
                <div aria-hidden="true" className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyles}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                <p className="text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section aria-labelledby="get-started-heading" className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900 p-6 text-center sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/5" />
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Follow the work
            </div>
            <h2 id="get-started-heading" className="text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              Start with the free channel.
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-slate-400">
              Explore the daily selections, follow the results, and when
              you&apos;re ready for broader coverage, discover the VIP and MaxBet
              access options.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <Link href="/tips" className={`${buttonStyles} bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400`}>
                Explore Free Tips
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/products" className={`${buttonStyles} border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700`}>
                View VIP Access
              </Link>
            </div>
            <p className="pt-2 text-xs leading-5 text-slate-400">
              Predictions are not guarantees. Past performance does not guarantee
              future results. Bet responsibly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
