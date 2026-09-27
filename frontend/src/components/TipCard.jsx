// frontend/src/components/TipCard.jsx
import Link from "next/link";
import { formatOdds, formatDate, formatDateTime, outcomeColor, statusColor } from "../lib/utils";
import { Calendar, Target, Award, Clock, ArrowRight } from "lucide-react";

export default function TipCard({ tip }) {
  if (!tip) return null;

  const matchTitle = tip.teams || `${tip.homeTeam || "Home"} vs ${tip.awayTeam || "Away"}`;
  const sport = tip.sport || "Football";
  const competition = tip.competition || tip.league || "Global League";
  const market = tip.market || "Match Winner";
  const selection = tip.selection || tip.prediction || "1";
  const odds = tip.odds;
  const outcome = tip.result?.outcome || tip.outcome;
  const status = tip.status || "PUBLISHED";
  const kickOff = tip.kickoff || tip.matchDate || tip.createdAt;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition-all hover:shadow-xl flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {sport}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
              {competition}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {outcome ? (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${outcomeColor(outcome)}`}>
                {outcome}
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor(status)}`}>
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Match Header */}
        <h3 className="font-bold text-slate-100 text-base mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {matchTitle}
        </h3>

        {/* Prediction Info Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 my-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Market:
            </span>
            <span className="font-semibold text-slate-200">{market}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-400" />
              Selection:
            </span>
            <span className="font-extrabold text-emerald-400">{selection}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Odds:</span>
            <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              @{formatOdds(odds)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateTime(kickOff)}</span>
        </div>

        {tip.id && (
          <Link
            href={`/tips/${tip.id}`}
            className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
