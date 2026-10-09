const SPORTS = [
  ["American football", "🏈"], ["Football", "⚽️"], ["Tennis", "🎾"],
  ["Cricket", "🏏"], ["Basketball", "🏀"], ["Baseball", "⚾️"],
  ["Rugby", "🏉"], ["Volleyball", "🏐"], ["Boxing", "🥊"],
  ["Golf", "⛳️"], ["Darts", "🎯"], ["Snooker & pool", "🎱"],
  ["Horse racing", "🐎"], ["Esports", "🎮"], ["Hockey", "🏒"],
];

export default function SportsCoverage({ className = "" }) {
  return (
    <section aria-labelledby="sports-coverage-heading" className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 ${className}`}>
      <div className="mb-4">
        <h2 id="sports-coverage-heading" className="text-lg font-bold text-slate-100">Sports coverage</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Our scrapers cover sports across the board. Free selections focus on football; broader sports coverage is available through premium tiers.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Sports covered">
        {SPORTS.map(([sport, emoji]) => (
          <li key={sport} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200">
            <span aria-hidden="true">{emoji}</span>{sport}
          </li>
        ))}
      </ul>
    </section>
  );
}
