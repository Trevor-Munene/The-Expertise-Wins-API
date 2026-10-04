// frontend/src/components/StatCard.jsx

const colorStyles = {
  emerald: {
    card: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    glow: "bg-emerald-400",
  },
  purple: {
    card: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20",
    icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    glow: "bg-indigo-400",
  },
  amber: {
    card: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
    icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    glow: "bg-amber-400",
  },
  blue: {
    card: "from-sky-500/10 to-blue-500/5 border-sky-500/20",
    icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    glow: "bg-sky-400",
  },
  rose: {
    card: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    glow: "bg-rose-400",
  },
};

const trendStyles = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-slate-400",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "emerald",
  trend,
  trendType = "neutral",
  description,
}) {
  const style = colorStyles[color] || colorStyles.emerald;

  const isInvalidNumber =
    typeof value === "number" && !Number.isFinite(value);

  const displayValue =
    value === null || value === undefined || value === "" || isInvalidNumber
      ? "—"
      : value;

  const hasTrend = trend !== null && trend !== undefined && trend !== "";

  return (
    <article
      className={`relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border bg-slate-900 bg-gradient-to-br p-5 shadow-lg shadow-black/10 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/20 ${style.card}`}
    >
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full opacity-20 blur-3xl ${style.glow}`}
      />

      {/* Card header */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-xs font-bold uppercase leading-5 tracking-[0.14em] text-slate-300">
            {title}
          </p>

          {description && (
            <p className="mt-1 break-words text-xs leading-5 text-slate-400">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.icon}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Primary metric */}
      <div className="relative mt-5 min-w-0">
        <div className="break-words text-2xl font-black tracking-tight text-slate-100 tabular-nums sm:text-3xl">
          {displayValue}
        </div>

        {subtitle && (
          <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Supporting trend */}
      {hasTrend && (
        <div className="relative mt-4 border-t border-slate-800/70 pt-3">
          <p
            className={`break-words text-xs font-semibold leading-5 ${
              trendStyles[trendType] || trendStyles.neutral
            }`}
          >
            {trend}
          </p>
        </div>
      )}
    </article>
  );
}