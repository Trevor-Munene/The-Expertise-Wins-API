// frontend/src/app/tips/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { tipsApi } from "../../../api/tips.api";
import {
  formatOdds,
  formatDateTime,
  outcomeColor,
  statusColor,
} from "../../../lib/utils";

export default function TipDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchTip() {
      setLoading(true);
      setError(null);

      try {
        const response = await tipsApi.getTipById(id);
        setTip(response?.tip || response);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed loading tip details."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTip();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-32 bg-dark-card rounded" />

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between gap-4">
              <div className="space-y-3">
                <div className="h-6 w-24 bg-dark-bg rounded-full" />
                <div className="h-8 w-72 bg-dark-bg rounded" />
              </div>
              <div className="h-7 w-24 bg-dark-bg rounded-full" />
            </div>

            <div className="h-24 bg-dark-bg rounded-xl" />
            <div className="h-36 bg-dark-bg rounded-xl" />
            <div className="h-20 bg-dark-bg rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tip) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-100">
              Unable to Load Tip
            </h2>
            <p className="text-sm text-slate-400">
              {error || "The requested tip could not be found."}
            </p>
          </div>

          <button
            onClick={() => router.push("/tips")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tips
          </button>
        </div>
      </div>
    );
  }

  const matchTitle =
    tip.teams ||
    `${tip.homeTeam || "Home"} vs ${tip.awayTeam || "Away"}`;

  const outcome = tip.result?.outcome || tip.outcome;
  const status = tip.status || "PUBLISHED";

  const sport = tip.sport || "Football";
  const competition = tip.competition || tip.league || "General";
  const market = tip.market || "Match Winner";
  const selection = tip.selection || tip.prediction || "—";

  const hasResult = Boolean(outcome);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <Link
        href="/tips"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tips Hub
      </Link>

      {/* Main Tip Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl shadow-xl overflow-hidden">
        {/* Top Accent */}
        <div className="h-1 bg-cyan-gradient" />

        <div className="p-6 sm:p-8 space-y-7">
          {/* Header / Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-dark-border">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {sport}
                </span>

                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
                  {competition}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                  {matchTitle}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Kick-off:{" "}
                    {formatDateTime(
                      tip.kickoff ||
                        tip.matchDate ||
                        tip.createdAt
                    )}
                  </span>

                </div>
              </div>
            </div>

            {/* Status */}
            <div className="shrink-0">
              {hasResult ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${outcomeColor(
                    outcome
                  )}`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Result: {outcome}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor(
                    status
                  )}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Prediction Summary */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Prediction Summary
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Published selection
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Market */}
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Market
                </span>

                <span className="text-sm font-bold text-slate-100">
                  {market}
                </span>
              </div>

              {/* Selection */}
              <div className="bg-dark-bg border border-emerald-500/20 rounded-xl p-4">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Selection
                </span>

                <span className="text-base font-black text-emerald-400">
                  {selection}
                </span>
              </div>

              {/* Odds */}
              <div className="bg-dark-bg border border-amber-500/20 rounded-xl p-4">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Odds
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-base font-black">
                  @{formatOdds(tip.odds)}
                </span>
              </div>
            </div>
          </section>

          {/* Result Information */}
          {hasResult && (
            <section className="bg-dark-bg border border-dark-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    Recorded Result
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Outcome verification
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  Final outcome
                </span>

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${outcomeColor(
                    outcome
                  )}`}
                >
                  {outcome}
                </span>
              </div>
            </section>
          )}

          {(tip.verdict || tip.preview) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Match Preview</h2>
                  <p className="text-[10px] uppercase text-slate-500">Selection analysis</p>
                </div>
              </div>
              <p className="whitespace-pre-line rounded-xl border border-dark-border bg-dark-bg p-5 text-sm leading-7 text-slate-300">
                {tip.verdict || tip.preview}
              </p>
            </section>
          )}

          {/* Operator Notes */}
          {tip.notes && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />

                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Operator Notes
                </h2>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {tip.notes}
                </p>
              </div>
            </section>
          )}

          {/* Extra Tips */}
          {Array.isArray(tip.extraTips) && tip.extraTips.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />

                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Additional Selections
                </h2>
              </div>

              <div className="space-y-2">
                {tip.extraTips.map((extraTip, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 bg-dark-bg border border-dark-border rounded-xl px-4 py-3"
                  >
                    <span className="text-xs text-slate-300">
                      {typeof extraTip === "string"
                        ? extraTip
                        : extraTip.selection || extraTip.name || "Additional selection"}
                    </span>

                    {extraTip?.odds && (
                      <span className="text-xs font-bold text-amber-400">
                        @{formatOdds(extraTip.odds)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tips"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Tips
        </Link>

        <span className="text-[10px] text-slate-600 uppercase tracking-wider">
          The Expertise Wins
        </span>
      </div>
    </div>
  );
}
