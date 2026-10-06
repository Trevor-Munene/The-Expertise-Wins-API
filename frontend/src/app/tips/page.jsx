
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
import VipChannelTipCard from "../../components/VipChannelTipCard";

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

// Get the current day key used by the API, which buckets tips by the Nairobi
// business day. Using the same calendar as the backend keeps the requested day
// and the served day identical.
function getCurrentDayKey() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) => parts.find((part) => part.type === type)?.value;

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

/* The live tips view is restricted to today's Nairobi business date. */

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
  const sport = normalizeSport(tip.sport);
  return sport === "FOOTBALL" || sport === "SOCCER";
}

function isTipForDay(tip, day) {
  const timestamp = tip?.scrapedAt ?? tip?.publishedAt ?? tip?.createdAt;
  if (!timestamp) return false;

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) return false;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  const tipDay = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

  return tipDay === day;
}

// Read the tier from the API response without changing the API contract.
// Different existing field names are supported so the page remains
// compatible with the current response shape.
function getTipTier(tip) {
  const value =
    tip?._tier ??
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

  const productSlug = String(tip?.publications?.[0]?.product?.slug ?? "").toUpperCase();
  if (productSlug === "MAXBET") return "MAXBET";
  if (productSlug === "VIP") return "VIP";
  if (productSlug === "FREE") return "FREE";

  const label = `${tip?.competition ?? ""} ${tip?.previewTitle ?? ""}`.toLowerCase();
  if (tip?.isFeatured || /bet of the day/.test(label)) return "MAXBET";
  if (isFootballTip(tip)) return "FREE";
  if (tip?._tier === "MAXBET" || tip?._tier === "VIP" || tip?._tier === "FREE") return tip._tier;
  return "VIP";
}

// The "All" tab prints MaxBet, then VIP, then Free.
function getTierRank(tip) {
  const tier = getTipTier(tip);

  if (tier === "MAXBET") return 1;
  if (tier === "VIP") return 2;
  if (tier === "FREE") return 3;

  return 99;
}

function getSportRank(tip) {
  const sport = normalizeSport(tip?.sport);
  if (sport === "TENNIS") return 0;
  if (sport === "BASKETBALL") return 1;
  return 2;
}

function getKickoffMinutes(tip) {
  const value = String(tip?.kickoff ?? "").trim();
  const time = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (time) return Number(time[1]) * 60 + Number(time[2]);

  const duration = value.match(/^(?:(\d+)\s*h(?:ours?)?\s*)?(?:(\d+)\s*m(?:in(?:utes?))?)?$/i);
  if (duration && (duration[1] || duration[2])) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const nowMinutes = Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
      Number(parts.find((part) => part.type === "minute")?.value || 0);
    return (nowMinutes + Number(duration[1] || 0) * 60 + Number(duration[2] || 0)) % 1440;
  }

  return Number.MAX_SAFE_INTEGER;
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
        const day = getCurrentDayKey();
        let response;

        if (activeTab === "all") {
          /*
           * "All" must show every tier, so query each endpoint separately.
           * A failing premium endpoint must not hide the free tips, so the
           * results are collected independently and merged afterwards.
           */
          const sources = [
            {
              tier: "MAXBET",
              request: () => tipsApi.getMaxbetTips({ day, limit: 100 }),
            },
            { tier: "VIP", request: () => tipsApi.getVipTips({ day, limit: 100 }) },
            {
              tier: "FREE",
              request: () => tipsApi.getFreeTips({ day, limit: 100 }),
            },
          ];

          const settledSources = await Promise.allSettled(
            sources.map((source) => source.request())
          );

          if (cancelled) return;

          let accessDenied = false;
          let requestFailed = false;
          const merged = [];

          const sourceIndexes = ["MAXBET", "VIP", "FREE"];
          settledSources.forEach((result, index) => {
            const tier = sourceIndexes[index];
            if (result.status === "rejected") {
              const status = result.reason?.response?.status;
              if (status === 401 || status === 403) accessDenied = true;
              else requestFailed = true;
              return;
            }

            for (const tip of extractTips(result.value)) {
              merged.push({ ...tip, _tier: tier });
            }
          });

          const displayedAllTips = merged.filter((tip) => isTipForDay(tip, day));
          const orderedAllTips = displayedAllTips.map((tip, index) => ({ tip, index }));
          orderedAllTips.sort((a, b) => {
            const tierDifference = getTierRank(a.tip) - getTierRank(b.tip);
            if (tierDifference !== 0) return tierDifference;
            if (getTierRank(a.tip) !== 3) {
              const sportDifference = getSportRank(a.tip) - getSportRank(b.tip);
              if (sportDifference !== 0) return sportDifference;
            }
            return getKickoffMinutes(a.tip) - getKickoffMinutes(b.tip) || a.index - b.index;
          });

          setTips(orderedAllTips.map(({ tip }) => tip));
          setServedDay(day);

          // Only block the whole view when every source failed.
          if (merged.length === 0) {
            if (accessDenied && !requestFailed) {
              setRequiresAuth(true);
              setAccessStatus(403);
            } else if (requestFailed) {
              setError(
                "We couldn't load the selections. Please try again shortly."
              );
            }
          }

          return;
        }

        // Every tier is pinned to today's business date.
        if (activeTab === "free") {
          response = await tipsApi.getFreeTips({ day, limit: 100 });
        } else if (activeTab === "vip") {
          response = await tipsApi.getVipTips({ day, limit: 100 });
        } else {
          response = await tipsApi.getMaxbetTips({ day, limit: 100 });
        }

        // Ignore responses from an earlier tab or an unmounted page.
        if (cancelled) return;

        const responseDay = normalizeServedDay(response?.tips?.day);
        const list = extractTips(response)
          .filter((tip) => isTipForDay(tip, day))
          .map((tip) => ({
            ...tip,
            _tier: activeTab === "free" ? "FREE" : activeTab === "vip" ? "VIP" : "MAXBET",
          }));
        const orderedList = activeTab === "free"
          ? list
          : [...list].sort((a, b) =>
              getSportRank(a) - getSportRank(b) ||
              getKickoffMinutes(a) - getKickoffMinutes(b)
            );

        setTips(orderedList);
        setServedDay(responseDay === day ? responseDay : day);
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

  /*
   * Every tab shows today's selections and their current outcomes for its tier.
   *
   * Free additionally restricts to football only. "All" keeps every tip from
   * every tier and is reordered by tier below.
   */
  const filteredTips = tips.filter((tip) => {
    const selections = Array.isArray(tip.tips) ? tip.tips : [];

    // Free tips are football only.
    if (activeTab === "free" && !isFootballTip(tip)) {
      return false;
    }

    // Show every selection scraped today, including already-settled results.
    // This keeps the daily record transparent until tomorrow's fresh scrape.
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
   * "All" mirrors the CLI tier groups. Paid tiers are sorted by sport class
   * (tennis, basketball, then other sports), followed by beginning time; free
   * cards retain the scrape/channel order.
   */
  const displayedTips =
    activeTab === "all"
      ? [...filteredTips].sort((a, b) => {
          const tierDifference = getTierRank(a) - getTierRank(b);
          if (tierDifference !== 0) return tierDifference;

          // Match the tier order and the game-type/kickoff ordering used by CLI.
          if (getTierRank(a) !== 3) {
            const sportDifference = getSportRank(a) - getSportRank(b);
            if (sportDifference !== 0) return sportDifference;
          }

          return getKickoffMinutes(a) - getKickoffMinutes(b);
        })
      : activeTab === "vip" || activeTab === "maxbet"
      ? [...filteredTips].sort((a, b) => {
          const featuredA = /bet of the day/i.test(`${a.competition || ""} ${a.previewTitle || ""}`);
          const featuredB = /bet of the day/i.test(`${b.competition || ""} ${b.previewTitle || ""}`);
          return Number(featuredB) - Number(featuredA) ||
            getSportRank(a) - getSportRank(b) ||
            getKickoffMinutes(a) - getKickoffMinutes(b);
        })
        : filteredTips;

  const activeView = tabs.find((tab) => tab.id === activeTab);
  const hasFilters =
    normalizedSearch !== "" || selectedSport !== "ALL";

  // "All" can also hit the premium endpoints, so it uses the same messaging.
  const isPremiumView = activeTab !== "free";

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

  const accessHeading = isPremiumView
    ? accessStatus === 401
      ? "Sign In to View Premium Tips"
      : "Premium Access Required"
    : accessStatus === 401
      ? "Sign In Required"
      : "Access Restricted";

  const accessDescription = isPremiumView
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

          {dayLabel && (
            <p className="text-xs leading-5 text-slate-400">
              Showing tips for{" "}
              <span className="font-bold text-slate-200">{dayLabel}</span>.
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
        data-tip-card-count={displayedTips.length}
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedTips.map((tip, index) => (
              <div
                key={tip.id ?? tip._id ?? `tip-${index}`}
                className="min-w-0"
              >
                {getTipTier(tip) === "FREE" ? (
                  <TipCard tip={tip} tier="FREE" />
                ) : (
                  <VipChannelTipCard
                    tip={tip}
                    tier={getTipTier(tip)}
                    cardNumber={index + 1}
                  />
                )}
              </div>
            ))}
          </div>
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
                  ? activeTab === "free"
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
