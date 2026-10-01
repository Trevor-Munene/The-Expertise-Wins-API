// frontend/src/components/TipCard.jsx
import Link from "next/link";
import { ArrowRight, Award, Clock, Target } from "lucide-react";
import {
  formatDateTime,
  formatOdds,
  outcomeColor,
  statusColor,
} from "../lib/utils";

export default function TipCard({ tip }) {
  if (!tip) return null;

  const matchTitle =
    tip.teams ||
    `${tip.homeTeam || "Home"} vs ${tip.awayTeam || "Away"}`;

  const sport = tip.sport || "Football";
  const competition = tip.competition || tip.league || "Global League";
  const market = tip.market || "Match Winner";
  const selection = tip.selection || tip.prediction || "1";
  const odds = tip.odds;

  const outcome = tip.result?.outcome || tip.outcome;
  const status = tip.status || "PUBLISHED";
  const kickOff = tip.kickoff || tip.matchDate || tip.createdAt;
  const tipId = tip.id ?? tip._id;

  const displayResult = outcome || status;
  const resultClasses = outcome
    ? outcomeColor(outcome)
    : statusColor(status);

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition-all hover:border-slate-700 hover:shadow-xl">
      <div>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {sport}
            </span>

            <span
              className="truncate text-xs font-medium text-slate-400"
              title={competition}
            >
              {competition}
            </span>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${resultClasses}`}
          >
            {displayResult}
          </span>
        </div>

        {/* Match */}
        <h3 className="mb-2 line-clamp-2 text-base font-bold text-slate-100 transition-colors group-hover:text-emerald-400">
          {matchTitle}
        </h3>

        {/* Prediction */}
        <div className="my-3 space-y-2 rounded-lg border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="flex shrink-0 items-center gap-1 font-medium text-slate-400">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Market
            </span>

            <span className="truncate text-right font-semibold text-slate-200">
              {market}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="flex shrink-0 items-center gap-1 font-medium text-slate-400">
              <Award className="h-3.5 w-3.5 text-teal-400" />
              Selection
            </span>

            <span className="truncate text-right font-extrabold text-emerald-400">
              {selection}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-400">Odds</span>

            <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 font-bold text-amber-400">
              @{formatOdds(odds)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
        <div className="flex min-w-0 items-center gap-1 text-[11px]">
          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <span className="truncate">
            {formatDateTime(kickOff)}
          </span>
        </div>

        {tipId && (
          <Link
            href={`/tips/${tipId}`}
            className="ml-3 flex shrink-0 items-center gap-1 font-semibold text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}