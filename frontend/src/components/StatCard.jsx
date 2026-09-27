// frontend/src/components/StatCard.jsx
export default function StatCard({ title, value, subtitle, icon: Icon, color = "emerald", trend }) {
  const colorStyles = {
    emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20",
    purple: "from-indigo-500/10 to-purple-500/5 text-indigo-400 border-indigo-500/20",
    amber: "from-amber-500/10 to-yellow-500/5 text-amber-400 border-amber-500/20",
    blue: "from-sky-500/10 to-blue-500/5 text-sky-400 border-sky-500/20",
    rose: "from-rose-500/10 to-pink-500/5 text-rose-400 border-rose-500/20",
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div className={`bg-gradient-to-br ${style} bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          {value != null ? value : "—"}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs font-semibold text-slate-300">
          {trend}
        </div>
      )}
    </div>
  );
}
