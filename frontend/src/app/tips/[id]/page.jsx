// frontend/src/app/tips/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tipsApi } from "../../../api/tips.api";
import { formatOdds, formatDate, formatDateTime, outcomeColor, statusColor } from "../../../lib/utils";
import { ArrowLeft, Trophy, Calendar, Target, Award, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

export default function TipDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function fetchTip() {
      try {
        const data = await tipsApi.getTipById(id);
        setTip(data?.tip || data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed loading tip details");
      } finally {
        setLoading(false);
      }
    }
    fetchTip();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !tip) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-rose-400 font-semibold">{error || "Tip not found"}</p>
        <button
          onClick={() => router.push("/tips")}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl hover:bg-slate-700"
        >
          Back to Tips
        </button>
      </div>
    );
  }

  const matchTitle = tip.teams || `${tip.homeTeam || "Home"} vs ${tip.awayTeam || "Away"}`;
  const outcome = tip.result?.outcome || tip.outcome;
  const status = tip.status || "PUBLISHED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link
        href="/tips"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tips Hub</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Badges */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {tip.sport || "Football"}
            </span>
            <span className="text-xs text-slate-400 font-medium">{tip.competition || tip.league}</span>
          </div>

          <div>
            {outcome ? (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${outcomeColor(outcome)}`}>
                RESULT: {outcome}
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor(status)}`}>
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{matchTitle}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Kick-off: {formatDateTime(tip.kickoff || tip.matchDate || tip.createdAt)}</span>
          </p>
        </div>

        {/* Prediction Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prediction Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Market</span>
              <span className="font-bold text-slate-100">{tip.market || "Match Winner"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Selection</span>
              <span className="font-extrabold text-emerald-400 text-base">{tip.selection || tip.prediction}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Odds</span>
              <span className="font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 inline-block">
                @{formatOdds(tip.odds)}
              </span>
            </div>
          </div>
        </div>

        {/* Source / Metadata */}
        {tip.notes && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operator Notes</h4>
            <p className="text-slate-300 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
              {tip.notes}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Source: {tip.source || "Expertise Engine"}</span>
          <span>Tip ID: {tip.id}</span>
        </div>
      </div>
    </div>
  );
}
