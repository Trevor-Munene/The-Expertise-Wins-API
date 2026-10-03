// frontend/src/app/stats/page.jsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { statsApi } from "../../api/stats.api";
import StatCard from "../../components/StatCard";
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
  Target,
} from "lucide-react";
import { formatPercent, formatOdds, formatDate } from "../../lib/utils";

const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 Days" },
  { id: "14-days", label: "14 Days" },
  { id: "month", label: "This Month" },
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

const getResponseData = (response) =>
  response?.stats ?? response?.data ?? response ?? null;

const getArrayData = (response, key) => {
  const data = getResponseData(response);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return Object.entries(data).map(([name, value]) => ({
    [key]: name,
    ...(value && typeof value === "object" ? value : { value }),
  }));
};

const formatMetricPercent = (value) =>
  value != null ? formatPercent(value) : "—";

const getStatusClasses = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE" || normalized === "WON") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  if (
    normalized === "EXPIRED" ||
    normalized === "LOST" ||
    normalized === "CANCELLED"
  ) {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }

  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
};

export default function StatsPage() {
  const [period, setPeriod] = useState("all-time");
  const [productFilter, setProductFilter] = useState("ALL");
  const [reportType, setReportType] = useState("overall");

  const [overview, setOverview] = useState(null);
  const [periodStats, setPeriodStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [sportStats, setSportStats] = useState([]);
  const [marketStats, setMarketStats] = useState([]);
  const [competitionStats, setCompetitionStats] = useState([]);
  const [volumeStats, setVolumeStats] = useState(null);
  const [scrapedStats, setScrapedStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [winRateData, setWinRateData] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [oddsData, setOddsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllStats = useCallback(async () => {
    setLoading(true);

    try {
      const periodRequest =
        period === "today"
          ? statsApi.getTodayStats()
          : period === "week"
          ? statsApi.getWeeklyStats()
          : period === "14-days"
          ? statsApi.getFourteenDayStats()
          : period === "month"
          ? statsApi.getMonthlyStats()
          : period === "year"
          ? statsApi.getYearlyStats()
          : statsApi.getAllTimeStats();

      const productRequest =
        productFilter === "free"
          ? period === "week"
            ? statsApi.getFreeWeeklyStats()
            : period === "month"
            ? statsApi.getFreeMonthlyStats()
            : statsApi.getFreeStats()
          : productFilter === "vip"
          ? period === "week"
            ? statsApi.getVipWeeklyStats()
            : period === "month"
            ? statsApi.getVipMonthlyStats()
            : statsApi.getVipStats()
          : productFilter === "maxbet"
          ? period === "week"
            ? statsApi.getMaxbetWeeklyStats()
            : period === "month"
            ? statsApi.getMaxbetMonthlyStats()
            : statsApi.getMaxbetStats()
          : Promise.resolve(null);

      const reportRequest =
        reportType === "weekly"
          ? statsApi.getWeeklyReport()
          : reportType === "monthly"
          ? statsApi.getMonthlyReport()
          : reportType === "yearly"
          ? statsApi.getYearlyReport()
          : statsApi.getPerformanceReport();

      const results = await Promise.allSettled([
        statsApi.getOverview(),
        periodRequest,
        productRequest,
        statsApi.getSportStats(),
        statsApi.getMarketStats(),
        statsApi.getCompetitionStats(),
        statsApi.getVolumeStats(),
        statsApi.getScrapedStats(),
        reportRequest,
        statsApi.getWinRate(),
        statsApi.getRoi(),
        statsApi.getOddsStats(),
      ]);

      const [
        overviewRes,
        periodRes,
        productRes,
        sportRes,
        marketRes,
        competitionRes,
        volumeRes,
        scrapedRes,
        reportRes,
        winRateRes,
        roiRes,
        oddsRes,
      ] = results;

      if (overviewRes.status === "fulfilled") {
        setOverview(getResponseData(overviewRes.value));
      }

      if (periodRes.status === "fulfilled") {
        setPeriodStats(getResponseData(periodRes.value));
      }

      if (productRes.status === "fulfilled") {
        setProductStats(getResponseData(productRes.value));
      }

      if (sportRes.status === "fulfilled") {
        setSportStats(getArrayData(sportRes.value, "sport"));
      }

      if (marketRes.status === "fulfilled") {
        setMarketStats(getArrayData(marketRes.value, "market"));
      }

      if (competitionRes.status === "fulfilled") {
        setCompetitionStats(getArrayData(competitionRes.value, "competition"));
      }


      if (volumeRes.status === "fulfilled") {
        setVolumeStats(getResponseData(volumeRes.value));
      }

      if (scrapedRes.status === "fulfilled") {
        setScrapedStats(getResponseData(scrapedRes.value));
      }

      if (reportRes.status === "fulfilled") {
        setReportData(getResponseData(reportRes.value));
      }

      if (winRateRes.status === "fulfilled") {
        setWinRateData(getResponseData(winRateRes.value));
      }

      if (roiRes.status === "fulfilled") {
        setRoiData(getResponseData(roiRes.value));
      }

      if (oddsRes.status === "fulfilled") {
        setOddsData(getResponseData(oddsRes.value));
      }
    } catch (err) {
      console.error("Failed loading statistics", err);
    } finally {
      setLoading(false);
    }
  }, [period, productFilter, reportType]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const winRate =
    productStats?.winRate ??
    periodStats?.winRate ??
    winRateData?.winRate ??
    overview?.winRate;

  const roi =
    roiData?.roi ??
    periodStats?.roi ??
    overview?.roi;

  const averageOdds =
    oddsData?.average ??
    oddsData?.avgOdds ??
    periodStats?.avgOdds ??
    overview?.avgOdds;

  const totalVolume =
    volumeStats?.totalVolume ??
    volumeStats?.count ??
    volumeStats?.total ??
    overview?.totalCount;

  const scrapedCount = scrapedStats?.scrapedTips;

  const publishedCount =
    volumeStats?.publishedCount ??
    volumeStats?.published;
  const reportOverview = reportData?.overview ?? reportData;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Performance Analytics</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            System Analytics & ROI Reports
          </h1>

          <p className="text-slate-400 text-sm max-w-2xl">
            Track tip performance across periods, sports, markets,
            competitions, and products.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAllStats}
          disabled={loading}
          aria-label="Refresh statistics"
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold flex items-center gap-2 self-start transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>{loading ? "Refreshing..." : "Refresh Metrics"}</span>
        </button>
      </header>

      {/* Filters */}
      <section className="space-y-4" aria-label="Analytics filters">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
            Period:
          </span>

          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              aria-pressed={period === item.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                period === item.id
                  ? "bg-cyan-gradient text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
            Product:
          </span>

          {PRODUCT_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProductFilter(item.id)}
              aria-pressed={productFilter === item.id}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-400/40 ${
                productFilter === item.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Primary Metrics */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        aria-label="Primary performance metrics"
      >
        <StatCard
          title="Win Rate"
          value={winRate != null ? formatMetricPercent(winRate) : "—"}
          subtitle={`Scope: ${productFilter} · ${period}`}
          color="emerald"
          icon={Trophy}
        />

        <StatCard
          title="Estimated ROI"
          value={roi != null ? `${roi}%` : "—"}
          subtitle="Tracked return on investment"
          color="purple"
          icon={TrendingUp}
        />

        <StatCard
          title="Average Odds"
          value={averageOdds != null ? `@${formatOdds(averageOdds)}` : "—"}
          subtitle="Average recorded selection odds"
          color="amber"
          icon={Activity}
        />

        <StatCard
          title="Tip Volume"
          value={totalVolume != null ? totalVolume : "—"}
          subtitle={
            scrapedCount != null || publishedCount != null
              ? `Scraped: ${scrapedCount ?? "—"} · Published: ${
                  publishedCount ?? "—"
                }`
              : "Recorded tip volume"
          }
          color="blue"
          icon={Layers}
        />
      </section>

      {/* Breakdown Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sports */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <PieChart
              className="w-4 h-4 text-cyan-400"
              aria-hidden="true"
            />
            Sport Performance
          </h2>

          {sportStats.length > 0 ? (
            <div className="space-y-3">
              {sportStats.map((item, index) => {
                const rate = Number(item.winRate);

                return (
                  <div
                    key={item.sport || item.id || index}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-slate-200">
                        {item.sport || "Unknown Sport"}
                      </span>

                      <span className="text-cyan-400 font-extrabold">
                        {item.winRate != null
                          ? `${item.winRate}%`
                          : "—"}
                      </span>
                    </div>

                    {Number.isFinite(rate) && (
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-cyan-gradient h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.max(rate, 0), 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Tips analyzed: {item.totalTips ?? item.count ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBreakdown message="No sport performance data available yet." />
          )}
        </div>

        {/* Markets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <BarChart3
              className="w-4 h-4 text-indigo-400"
              aria-hidden="true"
            />
            Market Performance
          </h2>

          {marketStats.length > 0 ? (
            <div className="space-y-3">
              {marketStats.map((item, index) => {
                const rate = Number(item.winRate);

                return (
                  <div
                    key={item.market || item.id || index}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-slate-200">
                        {item.market || "Unknown Market"}
                      </span>

                      <span className="text-indigo-400 font-extrabold">
                        {item.winRate != null
                          ? `${item.winRate}%`
                          : "—"}
                      </span>
                    </div>

                    {Number.isFinite(rate) && (
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.max(rate, 0), 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Selections: {item.totalTips ?? item.count ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBreakdown message="No market performance data available yet." />
          )}
        </div>

        {/* Competitions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Award
              className="w-4 h-4 text-amber-400"
              aria-hidden="true"
            />
            Competitions
          </h2>

          {competitionStats.length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {competitionStats.map((competition, index) => (
                <div
                  key={
                    competition.id ||
                    competition.name ||
                    competition.competition ||
                    index
                  }
                  className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">
                      {competition.name ||
                        competition.competition ||
                        "Unknown Competition"}
                    </span>

                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {competition.totalTips ?? competition.count ?? "—"} Matches
                    </span>
                  </div>

                  <span className="shrink-0 font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    {competition.winRate != null
                      ? `${competition.winRate}%`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBreakdown message="No competition performance data available yet." />
          )}
        </div>

      </section>

      {/* Reports */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <FileText
                className="w-5 h-5 text-cyan-400"
                aria-hidden="true"
              />
              Performance Reports
            </h2>

            <p className="text-slate-400 text-xs mt-1">
              Review recorded results for the selected reporting period.
            </p>
          </div>

          <div
            className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto"
            aria-label="Report period"
          >
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setReportType(option.id)}
                aria-pressed={reportType === option.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                  reportType === option.id
                    ? "bg-cyan-gradient text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-bold uppercase tracking-wider text-cyan-400">
              {reportType.toUpperCase()} Performance Report
            </span>

            <span className="text-slate-500 font-mono">
              Generated: {formatDate(new Date())}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-300">
            <ReportMetric
              label="Total Predictions"
              value={reportOverview?.totalTips ?? reportOverview?.count}
            />

            <ReportMetric
              label="Wins Recorded"
              value={reportOverview?.wins}
              valueClassName="text-emerald-400"
            />

            <ReportMetric
              label="Losses Recorded"
              value={reportOverview?.losses}
              valueClassName="text-rose-400"
            />

            <ReportMetric
              label="Win Rate"
              value={
                reportOverview?.winRate != null
                  ? `${reportOverview.winRate}%`
                  : null
              }
              valueClassName="text-cyan-400"
            />
          </div>

          {!reportData && (
            <p className="text-slate-500 text-xs">
              No report data is currently available for this period.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function EmptyBreakdown({ message }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
      <p className="text-slate-500 text-xs">{message}</p>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  valueClassName = "text-slate-100",
}) {
  return (
    <div>
      <span className="text-[11px] text-slate-500 block">
        {label}
      </span>

      <span
        className={`font-black text-base ${
          valueClassName
        }`}
      >
        {value != null ? value : "—"}
      </span>
    </div>
  );
}