// frontend/src/lib/utils.js
import { clsx } from "clsx";

/** Merge Tailwind class names conditionally */
export function cn(...inputs) {
  return clsx(inputs);
}

/** Format odds value */
export function formatOdds(value) {
  if (value == null || value === "") return "—";
  return Number(value).toFixed(2);
}

/** Format date string */
export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format datetime string */
export function formatDateTime(date) {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return String(date);
  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Outcome badge color */
export function outcomeColor(outcome) {
  switch (outcome) {
    case "WON":
      return "text-green-400 bg-green-950/60 border-green-800/50";
    case "HALF_WON":
      return "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";
    case "LOST":
      return "text-rose-400 bg-rose-950/60 border-rose-800/50";
    case "HALF_LOST":
      return "text-orange-400 bg-orange-950/60 border-orange-800/50";
    case "VOID":
    case "PUSH":
      return "text-amber-400 bg-amber-950/60 border-amber-800/50";
    case "CANCELLED":
      return "text-slate-400 bg-slate-900 border-slate-700";
    default:
      return "text-sky-400 bg-sky-950/60 border-sky-800/50";
  }
}

/** Status badge color */
export function statusColor(status) {
  switch (status) {
    case "PUBLISHED":
      return "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";
    case "SETTLED":
      return "text-indigo-400 bg-indigo-950/60 border-indigo-800/50";
    case "LOCKED":
      return "text-amber-400 bg-amber-950/60 border-amber-800/50";
    case "CANCELLED":
      return "text-rose-400 bg-rose-950/60 border-rose-800/50";
    case "PENDING":
      return "text-sky-400 bg-sky-950/60 border-sky-800/50";
    default:
      return "text-slate-400 bg-slate-900 border-slate-700";
  }
}

/** Percentage formatter */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return "—";
  return `${Number(value).toFixed(1)}%`;
}
