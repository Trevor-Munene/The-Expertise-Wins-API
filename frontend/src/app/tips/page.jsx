
// frontend/src/app/tips/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Lock,
  Trophy,
  Zap,
  Sparkles,
  Send,
  Crown,
  RefreshCw,
} from "lucide-react";

import { tipsApi } from "../../api/tips.api";
import TipCard from "../../components/TipCard";
import { formatTipChannelCard } from "../../lib/tipChannelFormatter";

const tabs = [
  {
    id: "free",
    label: "6+ Free Football Tips",
    viewLabel: "Free Football Tips",
    icon: Trophy,
    activeClass:
      "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20",
  },
  {
    id: "vip",
    label: "VIP Channel",
    viewLabel: "Pikk Better VIP",
    icon: Zap,
    activeClass:
      "bg-indigo-500 text-white shadow-md shadow-indigo-500/20",
  },
  {
    id: "maxbet",
    label: "MaxBet VIP",
    viewLabel: "Pikk MaxBet VIP",
    icon: Sparkles,
    activeClass:
      "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20",
  },
  {
    id: "all",
    label: "All Tips",
    viewLabel: "All Available Tips",
    icon: null,
    activeClass: "bg-slate-800 text-slate-100",
  },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors ${focusStyles}`;

// Get the current calendar date in Nairobi.
function getTodayIso() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

// Validate a date-only value before displaying it.
function normalizeServedDay(value) {
  if (typeof value !== "string") return null;

  const day = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;

  const parsed = new Date(`${day}T00:00:00Z`);

  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== day
  ) {
    return null;
  }

  return day;
}

// Read the supported list response shapes.
function extractTips(response) {
  const candidates = [
    response?.tips?.data,
    response?.tips,
    response?.data?.data,
    response?.data,
    response,
  ];

  const data = candidates.find(Array.isArray);

  return data
    ? data.filter((tip) => tip && typeof tip === "object")
    : [];
}

// Normalize sport values without changing the underlying tip data.
function normalizeSport(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

// Strict football check for the free public view.
function isFootballTip(tip) {
  return normalizeSport(tip.sport) === "FOOTBALL";
}

// Read the tier from the API response without changing the API contract.
// Different existing field names are supported so the page remains
// compatible with the current response shape.
function getTipTier(tip) {
  const value =
    tip?.tier ??
    tip?.product ??
    tip?.productType ??
    tip?.accessLevel ??
    tip?.category ??
    "";

  const normalized = String(value).trim().toUpperCase();

  if (
    normalized === "MAXBET" ||
    normalized === "MAXBET VIP" ||
    normalized === "MAX_BET" ||
    normalized === "MAXBETVIP"
  ) {
    return "MAXBET";
  }

  if (
    normalized === "VIP" ||
    normalized === "PREMIUM" ||
    normalized === "VIP CHANNEL"
  ) {
    return "VIP";
  }

  if (
    normalized === "FREE" ||
    normalized === "PUBLIC" ||
    normalized === "FREE TIPS"
  ) {
    return "FREE";
  }

  return "";
}

// Free → VIP → MaxBet.
function getTierRank(tip) {
  const tier = getTipTier(tip);

  if (tier === "FREE") return 1;
  if (tier === "VIP") return 2;
  if (tier === "MAXBET") return 3;

  return 99;
}

function getTierLabel(tip) {
  const tier = getTipTier(tip);

  if (tier === "MAXBET") return "MAXBET";
  if (tier === "VIP") return "VIP";
  if (tier === "FREE") return "FREE";

  return "TIP";
}

function getTierStyles(tip) {
  const tier = getTipTier(tip);

  if (tier === "FREE") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (tier === "VIP") {
    return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
  }

  if (tier === "MAXBET") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState("free");
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [servedDay, setServedDay] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTips() {
      setLoading(true);
      setRequiresAuth(false);
      setAccessStatus(null);
      setError("");
      setServedDay(null);
      setTips([]);

      try {
        let response;

        // Let the API choose the latest available published day.
        if (activeTab === "free") {
          response = await tipsApi.getFreeTips();
        } else if (activeTab === "vip") {
          response = await tipsApi.getVipTips();
        } else if (activeTab === "maxbet") {
          response = await tipsApi.getMaxbetTips();
        } else {
          response = await tipsApi.getTips();
        }

        // Ignore responses from an earlier tab or an unmounted page.
        if (cancelled) return;

        setTips(extractTips(response));
        setServedDay(normalizeServedDay(response?.tips?.day));
      } catch (requestError) {
        if (cancelled) return;

        const status = requestError?.response?.status;

        if (status === 401 || status === 403) {
          setRequiresAuth(true);
          setAccessStatus(status);
        } else {
          setError(
            "We couldn't load the selections. Please try again shortly."
          );
        }

        setTips([]);
        setServedDay(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTips();

    return () => {
      cancelled = true;
    };
  }, [activeTab, retryCount]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const todayIso = getTodayIso();

  /*
   * Keep the existing filtering behavior.
   *
   * The only special rules are:
   * - Free = today's football tips only.
   * - All = all tips returned by the API.
   * - VIP / MaxBet = exactly what their respective endpoints return.
   */
  const filteredTips = tips.filter((tip) => {
    const selections = Array.isArray(tip.tips) ? tip.tips : [];

    /*
     * Free tips must be today's football selections.
     *
     * We use the API's served day because that is already the date
     * associated with the published tip set.
     */
    if (activeTab === "free") {
      if (servedDay !== todayIso) {
        return false;
      }

      if (!isFootballTip(tip)) {
        return false;
      }
    }

    // Search all relevant fields, including premium selections.
    const searchableText = [
      tip.teams,
      tip.homeTeam,
      tip.awayTeam,
      tip.competition,
      tip.league,
      tip.selection,
      tip.prediction,
      tip.market,
      ...selections.flatMap((selection) => [
        selection?.selection,
        selection?.market,
      ]),
    ]
      .filter((value) => value !== null && value !== undefined)
      .map(String)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(normalizedSearch);

    const matchesSport =
      selectedSport === "ALL" ||
      normalizeSport(tip.sport || "Football") === selectedSport;

    return matchesSearch && matchesSport;
  });

  /*
   * All Tips keeps every returned tip but presents them in product order:
   * FREE → VIP → MAXBET.
   *
   * The other tabs preserve the API's existing ordering.
   */
  const displayedTips =
    activeTab === "all"
      ? [...filteredTips].sort((a, b) => {
          const tierDifference = getTierRank(a) - getTierRank(b);

          if (tierDifference !== 0) {
            return tierDifference;
          }

          return 0;
        })
      : filteredTips;

  const activeView = tabs.find((tab) => tab.id === activeTab);
  const isPremiumTab = activeTab === "vip" || activeTab === "maxbet";
  const hasFilters =
    normalizedSearch !== "" || selectedSport !== "ALL";
  const hasLoadedContent = !loading && !requiresAuth && !error;

  const isHistoricalDay =
    hasLoadedContent && servedDay && servedDay < todayIso;

  const dayLabel = servedDay
    ? new Date(`${servedDay}T00:00:00Z`).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }
      )
    : null;

  const accessHeading = isPremiumTab
    ? accessStatus === 401
      ? "Sign In to View Premium Tips"
      : "Premium Access Required"
    : accessStatus === 401
      ? "Sign In Required"
      : "Access Restricted";

  const accessDescription = isPremiumTab
    ? "This section requires an active VIP or MaxBet membership. Sign in with your account or activate the access token provided by Admin."
    : "This view is currently restricted. Sign in with your account or contact Admin if you believe you should have access.";

  const viewStatus = loading
    ? "Loading selections…"
    : requiresAuth
      ? "Access required"
      : error
        ? "Selections unavailable"
        : `${displayedTips.length} selection${
            displayedTips.length === 1 ? "" : "s"
          } shown`;

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    // Hide the previous view immediately while the next request starts.
    setLoading(true);
    setTips([]);
    setServedDay(null);
    setError("");
    setRequiresAuth(false);
    setAccessStatus(null);
    setActiveTab(tabId);
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSport("ALL");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-10 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      {/* Page header */}
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Sparkles
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>Curated Betting Selections</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-100 sm:text-5xl">
          Tips &amp; Predictions Hub
        </h1>

        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Football tips remain free for our community, with at least 6 free
          football selections published daily. VIP and MaxBet access extends
          our coverage into additional sports, markets, curated selections,
          and premium opportunities.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href="/products"
            className={`${buttonStyles} bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400`}
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            View Membership Access
          </Link>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles} border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            DM @PikkBetter
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </header>

      {/* Access guide */}
      <section aria-labelledby="access-guide-heading">
        <h2 id="access-guide-heading" className="sr-only">
          Tip access levels
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Trophy
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-slate-100">
                Free Football
              </h3>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              At least 6 football tips daily, available to the wider
              community.
            </p>
          </article>

          <article className="rounded-2xl border border-indigo-500/20 bg-slate-900 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Zap
                className="h-4 w-4 shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-slate-100">
                Pikk Better VIP
              </h3>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              Premium daily selections, multiple sports and markets, with
              curated reasoning.
            </p>
          </article>

          <article className="rounded-2xl border border-amber-500/20 bg-slate-900 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-slate-100">
                Pikk MaxBet VIP
              </h3>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              Highest-tier selections with stronger curation and dedicated
              MaxBet opportunities.
            </p>
          </article>
        </div>
      </section>

      {/* View controls and filters */}
      <section
        aria-labelledby="tips-controls-heading"
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
      >
        <h2 id="tips-controls-heading" className="sr-only">
          Choose a tip category and filter selections
        </h2>

        <div className="flex flex-col gap-4">
          <div
            role="group"
            aria-label="Tip category"
            className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto p-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  aria-pressed={isActive}
                  aria-controls="tips-results"
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold transition-colors ${focusStyles} ${
                    isActive
                      ? tab.activeClass
                      : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 ${
                        tab.id === "vip" && !isActive
                          ? "text-amber-400"
                          : "text-current"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="tips-search" className="sr-only">
                Search teams, leagues, markets, or selections
              </label>

              <input
                id="tips-search"
                type="search"
                placeholder="Search team, league, selection…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={`min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 ${focusStyles}`}
              />

              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>

            <div className="sm:w-48">
              <label htmlFor="tips-sport" className="sr-only">
                Filter by sport
              </label>

              <select
                id="tips-sport"
                value={selectedSport}
                onChange={(event) => setSelectedSport(event.target.value)}
                className={`min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 ${focusStyles}`}
              >
                <option value="ALL">All Sports</option>
                <option value="FOOTBALL">Football</option>
                <option value="BASKETBALL">Basketball</option>
                <option value="TENNIS">Tennis</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <p className="text-xs leading-5 text-slate-400">
            Viewing:{" "}
            <span className="font-bold text-slate-200">
              {activeView?.viewLabel}
            </span>
          </p>

          {activeTab === "free" && isHistoricalDay && (
            <p className="text-xs leading-5 text-amber-300">
              The latest published selections are from{" "}
              <span className="font-bold">{dayLabel}</span>. Today's free
              football tips are not yet available.
            </p>
          )}

          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-xs text-slate-400"
          >
            {viewStatus}
          </p>
        </div>
      </section>

      {/* Selection results */}
      <section
        id="tips-results"
        aria-labelledby="tips-results-heading"
        aria-busy={loading}
      >
        <h2 id="tips-results-heading" className="sr-only">
          {activeView?.viewLabel}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-64 rounded-2xl border border-slate-800 bg-slate-900 motion-safe:animate-pulse"
              />
            ))}
          </div>
        ) : requiresAuth ? (
          <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-amber-500/20 bg-slate-900 p-6 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Lock className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                {accessHeading}
              </h3>

              <p className="mx-auto max-w-md text-sm leading-6 text-slate-400">
                {accessDescription}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className={`${buttonStyles} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
              >
                Sign In
              </Link>

              <Link
                href="/products"
                className={`${buttonStyles} border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                View Access Options
              </Link>
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="space-y-4 rounded-2xl border border-rose-500/20 bg-slate-900 p-6 text-center sm:p-10"
          >
            <h3 className="text-lg font-bold text-slate-100">
              Unable to Load Tips
            </h3>

            <p className="text-sm leading-6 text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className={`${buttonStyles} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </button>
          </div>
        ) : displayedTips.length > 0 ? (
          isPremiumTab ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {displayedTips.map((tip, index) => (
                <article
                  key={tip.id ?? tip._id ?? `premium-tip-${index}`}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <h3 className="border-b border-slate-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Card {index + 1}
                  </h3>

                  <pre className="whitespace-pre-wrap break-words px-5 py-5 font-mono text-sm leading-7 text-slate-100 [overflow-wrap:anywhere]">
                    {formatTipChannelCard(tip)}
                  </pre>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedTips.map((tip, index) => (
                <article
                  key={tip.id ?? tip._id ?? `tip-${index}`}
                  className="relative min-w-0"
                >
                  {activeTab === "all" && (
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getTierStyles(
                          tip
                        )}`}
                      >
                        {getTierLabel(tip)}
                      </span>
                    </div>
                  )}

                  <TipCard tip={tip} />
                </article>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
              <Search
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200">
                {tips.length > 0
                  ? "No Matching Tips"
                  : "No Tips Available Yet"}
              </h3>

              <p className="text-sm leading-6 text-slate-400">
                {tips.length > 0
                  ? activeTab === "free" && servedDay !== todayIso
                    ? "Today's free football tips are not available yet."
                    : "No selections match your current search or sport filter."
                  : "There are no selections available in this view right now. Check back shortly for updates."}
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={`${buttonStyles} border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Community and membership banner */}
      <section
        aria-labelledby="membership-heading"
        className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 p-7 text-center shadow-xl sm:p-8"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <Crown className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2
          id="membership-heading"
          className="text-lg font-bold text-slate-100 sm:text-xl"
        >
          I COME TO HELP &amp; SERVE MY PEOPLE
        </h2>

        <p className="mx-auto max-w-xl text-sm leading-6 text-slate-300">
          Football remains free for our community. For premium sports,
          markets, VIP selections, or MaxBet access, membership is available
          through dedicated international and African-market rates.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/products"
            className={`${buttonStyles} bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 hover:bg-amber-400`}
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            View Memberships
          </Link>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles} bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10 hover:bg-sky-400`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            DM ADMIN @PikkBetter
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>
    </div>
  );
}