// frontend/src/app/stats/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Trophy,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  FileText,
  Layers,
  Award,
} from "lucide-react";

import { statsApi } from "../../api/stats.api";
import StatCard from "../../components/StatCard";
import { formatPercent, formatOdds } from "../../lib/utils";

const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 Days" },
  { id: "14-days", label: "14 Days" },
  { id: "month", label: "30 Days" },
  { id: "year", label: "This Year" },
  { id: "all-time", label: "All Time" },
];

const PRODUCT_OPTIONS = [
  { id: "ALL", label: "All Products" },
  { id: "free", label: "Free Tier" },
  { id: "vip", label: "VIP Group" },
  { id: "maxbet", label: "MaxBet VIP" },
];

const REPORT_OPTIONS = [
  { id: "overall", label: "Overall" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const REPORT_METHODS = {
  overall: "getPerformanceReport",
  weekly: "getWeeklyReport",
  monthly: "getMonthlyReport",
  yearly: "getYearlyReport",
};

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const panelStyles =
  "min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6";

const getResponseData = (response) =>
  response?.stats ?? response?.data ?? response ?? null;

// Normalize arrays and keyed breakdown objects.
function getArrayData(response, key) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item === "object");
  }

  if (!data || typeof data !== "object") return [];

  return Object.entries(data).map(([name, value]) => ({
    [key]: name,
    ...(value && typeof value === "object" ? value : { value }),
  }));
}

// Reject missing and non-finite numeric values.
function getFiniteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMetricPercent(value) {
  const number = getFiniteNumber(value);
  return number === null ? "—" : formatPercent(number);
}

function formatMetricOdds(value) {
  const number = getFiniteNumber(value);
  return number !== null && number > 0 ? `@${formatOdds(number)}` : "—";
}

function formatCount(value) {
  const number = getFiniteNumber(value);

  return number !== null && number >= 0
    ? number.toLocaleString("en-GB")
    : "—";
}

function getNairobiDateLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function StatsPage() {
  const [period, setPeriod] = useState("all-time");
  const [productFilter, setProductFilter] = useState("ALL");
  const [reportType, setReportType] = useState("overall");
  const [refreshCount, setRefreshCount] = useState(0);

  const [data, setData] = useState({});
  const [failedRequests, setFailedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportFetchedAt, setReportFetchedAt] = useState(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    async function fetchAllStats() {
      setLoading(true);
      setData({});
      setFailedRequests([]);
      setReportFetchedAt(null);

      /*
       * The metric cards, the breakdowns, the volume totals and the performance
       * report each come from one endpoint that already applies the correct
       * filters server side. Nothing here guesses which endpoint matches which
       * period or product, so the figures cannot drift apart.
       */
      const requests = [
        {
          key: "summary",
          label: "Win rate, ROI and average odds",
          run: () => statsApi.getSummaryStats({ period, product: productFilter }),
        },
        {
          key: "sports",
          label: "Sport performance",
          run: () => statsApi.getSportStats(),
          arrayKey: "sport",
        },
        {
          key: "markets",
          label: "Market performance",
          run: () => statsApi.getMarketStats(),
          arrayKey: "market",
        },
        {
          key: "competitions",
          label: "Competition performance",
          run: () => statsApi.getCompetitionStats(),
          arrayKey: "competition",
        },
        {
          key: "volume",
          label: "Tip volume",
          run: () => statsApi.getVolumeStats(),
        },
        {
          key: "scraped",
          label: "Scraped tips",
          run: () => statsApi.getScrapedStats(),
        },
        {
          key: "report",
          label: "Performance report",
          run: () => statsApi[REPORT_METHODS[reportType]](),
        },
      ];

      const results = await Promise.allSettled(
        requests.map(({ run }) =>
          Promise.resolve().then(() => run())
        )
      );

      if (cancelled || requestId !== requestIdRef.current) return;

      const nextData = {};
      const failures = [];

      results.forEach((result, index) => {
        const request = requests[index];

        if (result.status === "fulfilled") {
          nextData[request.key] = request.arrayKey
            ? getArrayData(result.value, request.arrayKey)
            : getResponseData(result.value);
        } else {
          nextData[request.key] = request.arrayKey ? [] : null;
          failures.push({
            key: request.key,
            label: request.label,
            message: result.reason?.response?.data?.message ?? null,
          });
        }
      });

      setData(nextData);
      setFailedRequests(failures);

      if (nextData.report !== null && nextData.report !== undefined) {
        setReportFetchedAt(new Date());
      }

      setLoading(false);
    }

    fetchAllStats();

    return () => {
      cancelled = true;
    };
  }, [period, productFilter, reportType, refreshCount]);

  // Hide previous results immediately when controls change.
  const prepareRequest = () => {
    requestIdRef.current += 1;
    setLoading(true);
    setData({});
    setFailedRequests([]);
    setReportFetchedAt(null);
  };

  const handleRefresh = () => {
    if (loading) return;
    prepareRequest();
    setRefreshCount((count) => count + 1);
  };

  const handlePeriodChange = (value) => {
    if (value === period) return;
    prepareRequest();
    setPeriod(value);
  };

  const handleProductChange = (value) => {
    if (value === productFilter) return;
    prepareRequest();
    setProductFilter(value);
  };

  const handleReportChange = (value) => {
    if (value === reportType) return;
    prepareRequest();
    setReportType(value);
  };

  const hasFailed = (key) =>
    failedRequests.some((request) => request.key === key);

  const periodLabel = PERIOD_OPTIONS.find(
    (option) => option.id === period
  )?.label;

  const productLabel = PRODUCT_OPTIONS.find(
    (option) => option.id === productFilter
  )?.label;

  const scopeLabel = `${productLabel} · ${periodLabel}`;

  /*
   * Win rate, ROI and average odds are read from one summary payload the server
   * computed for this exact period and product. There is no cross endpoint
   * fallback, so a card can never show a figure that belongs to a different
   * filter than the scope label above it.
   */
  const summary = hasFailed("summary") ? null : data.summary;

  const winRate = summary?.winRate ?? null;
  const roi = summary?.roi ?? null;
  const averageOdds = summary?.avgOdds ?? null;

  // Volume and breakdown endpoints are deliberately overall, so they ignore the
  // period and product controls.
  const totalVolume = getFiniteNumber(data.volume?.total);
  const publishedCount = getFiniteNumber(data.volume?.published);
  const scrapedCount = getFiniteNumber(data.scraped?.scrapedTips);

  /*
   * The overall report returns { overview, products, sports, markets } while the
   * period reports return { periodStart, periodEnd, performance }. Read whichever
   * object actually carries the totals so every report option renders.
   */
  const reportOverview =
    data.report?.overview ?? data.report?.performance ?? data.report;
  const metricScope = loading ? "Loading statistics…" : scopeLabel;

  return (
    <main
      aria-labelledby="stats-heading"
      className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:space-y-10 sm:px-6 lg:px-8"
    >
      {/* Page header */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 space-y-3">
          <div className="brand-kicker">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Performance Analytics
          </div>

          <h1
            id="stats-heading"
            className="text-3xl font-black leading-tight tracking-tight text-slate-100 sm:text-4xl"
          >
            System Analytics &amp; ROI Reports
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Track tip performance across periods, sports, markets,
            competitions, and products. Results are reviewed and settled once a
            day, so the latest figures update after settlement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh statistics"
          className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:cursor-wait disabled:opacity-50 ${focusStyles}`}
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "motion-safe:animate-spin" : ""
            }`}
            aria-hidden="true"
          />
          {loading ? "Loading Metrics…" : "Refresh Metrics"}
        </button>
      </header>

      {/* Analytics filters */}
      <section aria-label="Analytics filters" className="space-y-4">
        <OptionGroup
          label="Period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={handlePeriodChange}
        />

        <OptionGroup
          label="Product"
          options={PRODUCT_OPTIONS}
          value={productFilter}
          onChange={handleProductChange}
          activeClass="bg-indigo-600 text-white"
        />

        <div className="space-y-2 text-xs leading-5 text-slate-400">
          <p>
            Period and product controls apply to win rate, ROI, and average
            odds. Tip volume and breakdowns show overall statistics.
            Reports use their own period controls.
          </p>

          <p role="status" aria-live="polite" aria-atomic="true">
            {loading
              ? "Loading statistics…"
              : failedRequests.length > 0
                ? "Some statistics could not be loaded."
                : "Statistics loaded."}
          </p>
        </div>
      </section>

      {/* Partial request failures */}
      {!loading && failedRequests.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
        >
          <p className="text-sm font-semibold text-amber-300">
            Some statistics are unavailable.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Could not load:{" "}
            {failedRequests.map((request) => request.label).join(", ")}.
            Use Refresh Metrics to try again.
          </p>

        </div>
      )}

      {/* Primary metrics */}
      <section
        aria-label="Primary performance metrics"
        aria-busy={loading}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Win Rate"
          value={formatMetricPercent(winRate)}
          subtitle={metricScope}
          color="emerald"
          icon={Trophy}
        />

        <StatCard
          title="Estimated ROI"
          value={formatMetricPercent(roi)}
          subtitle={metricScope}
          color="purple"
          icon={TrendingUp}
        />

        <StatCard
          title="Average Odds"
          value={formatMetricOdds(averageOdds)}
          subtitle={metricScope}
          color="amber"
          icon={Activity}
        />

        <StatCard
          title="Tip Volume"
          value={formatCount(totalVolume)}
          subtitle={
            loading
              ? "Loading overall volume…"
              : `Overall · Scraped: ${formatCount(
                  scrapedCount
                )} · Published: ${formatCount(publishedCount)}`
          }
          color="blue"
          icon={Layers}
        />
      </section>

      {/* Overall performance breakdowns */}
      <section
        aria-label="Overall performance breakdowns"
        aria-busy={loading}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <BreakdownPanel
          title="Sport Performance"
          icon={PieChart}
          items={data.sports ?? []}
          field="sport"
          loading={loading}
          failed={hasFailed("sports")}
          accent="cyan"
        />

        <BreakdownPanel
          title="Market Performance"
          icon={BarChart3}
          items={data.markets ?? []}
          field="market"
          loading={loading}
          failed={hasFailed("markets")}
          accent="indigo"
        />

        <BreakdownPanel
          title="Competitions"
          icon={Award}
          items={data.competitions ?? []}
          field="competition"
          loading={loading}
          failed={hasFailed("competitions")}
          accent="amber"
        />
      </section>

      {/* Performance reports */}
      <section
        aria-labelledby="report-heading"
        aria-busy={loading}
        className={`${panelStyles} space-y-6`}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2
              id="report-heading"
              className="flex items-center gap-2 text-lg font-bold text-slate-100"
            >
              <FileText
                className="h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              Performance Reports
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Overall results for the selected reporting period, independent
              of the product filter.
            </p>
          </div>

          <OptionGroup
            label="Report period"
            options={REPORT_OPTIONS}
            value={reportType}
            onChange={handleReportChange}
            compact
          />
        </div>

        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {reportType} Performance Report
            </h3>

            {reportFetchedAt && (
              <p className="text-xs leading-5 text-slate-400">
                Retrieved:{" "}
                <time dateTime={reportFetchedAt.toISOString()}>
                  {getNairobiDateLabel(reportFetchedAt)}
                </time>{" "}
                EAT
              </p>
            )}
          </div>

          {loading ? (
            <LoadingRows />
          ) : hasFailed("report") ? (
            <EmptyBreakdown message="The performance report could not be loaded." />
          ) : !data.report ? (
            <EmptyBreakdown message="No report data is currently available for this period." />
          ) : (
            <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <ReportMetric
                label="Total Predictions"
                value={formatCount(
                  reportOverview?.totalTips ?? reportOverview?.count
                )}
              />
              <ReportMetric
                label="Settled"
                value={formatCount(reportOverview?.settled)}
              />
              <ReportMetric
                label="Average Odds"
                value={formatMetricOdds(
                  reportOverview?.avgOdds ??
                    reportOverview?.averageOdds ??
                    data.report?.avgOdds
                )}
                valueClassName="text-amber-400"
              />
              <ReportMetric
                label="Win Rate"
                value={formatMetricPercent(reportOverview?.winRate)}
                valueClassName="text-emerald-400"
              />
              <ReportMetric
                label="Wins Recorded"
                value={formatCount(reportOverview?.wins)}
                valueClassName="text-emerald-400"
              />
              <ReportMetric
                label="Losses Recorded"
                value={formatCount(reportOverview?.losses)}
                valueClassName="text-rose-400"
              />
              <ReportMetric
                label="Pending"
                value={formatCount(reportOverview?.pending)}
              />
              <ReportMetric
                label="ROI"
                value={formatMetricPercent(reportOverview?.roi)}
                valueClassName="text-purple-400"
              />
            </dl>
          )}
        </div>
      </section>
    </main>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
  activeClass = "bg-emerald-400 text-slate-950",
  compact = false,
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex min-w-0 max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-slate-800 p-2 ${
        compact ? "bg-slate-950" : "bg-slate-900"
      }`}
    >
      {!compact && (
        <span className="shrink-0 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}:
        </span>
      )}

      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors ${focusStyles} ${
            value === option.id
              ? activeClass
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const breakdownStyles = {
  cyan: {
    text: "text-emerald-300",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-200",
  },
  indigo: {
    text: "text-indigo-400",
    bar: "bg-gradient-to-r from-indigo-500 to-purple-500",
  },
  amber: {
    text: "text-amber-400",
    bar: "bg-gradient-to-r from-amber-400 to-orange-400",
  },
};

function BreakdownPanel({
  title,
  icon: Icon,
  items,
  field,
  loading,
  failed,
  accent,
}) {
  const style = breakdownStyles[accent] ?? breakdownStyles.cyan;

  return (
    <div className={`${panelStyles} space-y-4`}>
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
          <Icon
            className={`h-4 w-4 shrink-0 ${style.text}`}
            aria-hidden="true"
          />
          {title}
        </h2>
        <p className="mt-2 text-xs text-slate-400">Overall statistics</p>
      </div>

      {loading ? (
        <LoadingRows />
      ) : failed ? (
        <EmptyBreakdown message="This breakdown could not be loaded." />
      ) : items.length === 0 ? (
        <EmptyBreakdown message="No performance data is available yet." />
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const name =
              item[field] ||
              item.name ||
              `Unknown ${field === "competition" ? "Competition" : field}`;

            const rate = getFiniteNumber(item.winRate);
            const boundedRate =
              rate === null ? null : Math.min(Math.max(rate, 0), 100);

            return (
              <li
                key={item.id ?? `${name}-${index}`}
                className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-bold leading-5 text-slate-200">
                    {name}
                  </span>

                  <span
                    className={`shrink-0 text-sm font-extrabold tabular-nums ${style.text}`}
                  >
                    <span className="sr-only">Win rate: </span>
                    {formatMetricPercent(item.winRate)}
                  </span>
                </div>

                {boundedRate !== null && (
                  <div
                    aria-hidden="true"
                    className="h-2 overflow-hidden rounded-full bg-slate-800"
                  >
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${boundedRate}%` }}
                    />
                  </div>
                )}

                <p className="text-xs leading-5 text-slate-400">
                  Tips analyzed:{" "}
                  {formatCount(item.totalTips ?? item.count)} · Average
                  odds: {formatMetricOdds(item.avgOdds)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-20 rounded-xl border border-slate-800 bg-slate-800/40 motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyBreakdown({ message }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
      <p className="text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  valueClassName = "text-slate-100",
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-5 text-slate-400">{label}</dt>
      <dd
        className={`mt-2 break-words text-lg font-black tabular-nums ${valueClassName}`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
