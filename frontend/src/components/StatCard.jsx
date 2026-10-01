// frontend/src/components/StatCard.jsx

const colorStyles = {
  emerald: {
    card: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    accent: "text-emerald-400",
  },

  purple: {
    card: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20",
    icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    accent: "text-indigo-400",
  },

  amber: {
    card: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
    icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    accent: "text-amber-400",
  },

  blue: {
    card: "from-sky-500/10 to-blue-500/5 border-sky-500/20",
    icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    accent: "text-sky-400",
  },

  rose: {
    card: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    accent: "text-rose-400",
  },
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

  const trendStyles = {
    positive: "text-emerald-400",
    negative: "text-rose-400",
    neutral: "text-slate-400",
  };

  const displayValue = value !== null && value !== undefined
    ? value
    : "—";

  return (
    <article
      className={`
        relative overflow-hidden
        flex flex-col justify-between
        min-h-[150px]
        rounded-2xl
        border
        bg-gradient-to-br
        ${style.card}
        bg-slate-900
        p-5
        shadow-lg shadow-black/10
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-xl hover:shadow-black/20
      `}
    >
      {/* Subtle decorative glow */}
      <div
        className={`
          pointer-events-none
          absolute -top-12 -right-12
          w-24 h-24
          rounded-full
          blur-3xl
          opacity-20
          ${style.accent.replace("text-", "bg-")}
        `}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-slate-400 truncate">
            {title}
          </p>

          {description && (
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`
              shrink-0
              flex items-center justify-center
              w-9 h-9
              rounded-xl
              border
              ${style.icon}
            `}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Primary metric */}
      <div className="relative mt-5">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
          {displayValue}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs font-medium text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend / supporting information */}
      {trend && (
        <div className="relative mt-4 pt-3 border-t border-slate-800/70">
          <p
            className={`text-xs font-semibold ${trendStyles[trendType] || trendStyles.neutral}`}
          >
            {trend}
          </p>
        </div>
      )}
    </article>
  );
}