"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Search, Trophy } from "lucide-react";
import { tipsApi } from "../../api/tips.api";
import { formatTipChannelCard, formatFreeTipChannelCard } from "../../lib/tipChannelFormatter";

const PAGE_SIZE = 20;
const getTodayDate = () => new Date().toISOString().slice(0, 10);

// Default to today; when the API has no data for today it falls back to the most
// recent day that has records, so switching to another date shows real data.
const createInitialFilters = () => ({
  sport: "",
  tier: "free",
  day: getTodayDate(),
  search: "",
  outcome: "",
});

export default function ArchivePage() {
  const [archive, setArchive] = useState({ data: [], pagination: { page: 1, pages: 0, total: 0 }, sports: [], tierSports: {}, tiers: [] });
  const [filters, setFilters] = useState(createInitialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadArchive = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await tipsApi.getArchive({
          ...filters,
          page,
          limit: PAGE_SIZE,
        });
        if (active) setArchive(response?.tips || { data: [], pagination: { page: 1, pages: 0, total: 0 }, sports: [], tiers: [] });

          // When the selected day has no records, fall back to the most recent
          // day the API reports so the archive is not blank on first load.
          const total = response?.tips?.pagination?.total ?? 0;
          if (total === 0 && filters.day && !filters.from && !filters.to) {
            try {
              const latest = await tipsApi.getArchive({ limit: 1 });
              const latestDay = latest?.tips?.day || null;
              if (latestDay && latestDay !== filters.day) {
                setFilters((current) => ({ ...current, day: latestDay }));
                return;
              }
            } catch {
              // Keep the empty state when the fallback lookup fails.
            }
          }
      } catch (requestError) {
        if (active) {
          setArchive({ data: [], pagination: { page: 1, pages: 0, total: 0 }, sports: [], tierSports: {}, tiers: [] });
          setError(requestError.response?.data?.message || "Unable to load the tip archive.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadArchive();
    return () => { active = false; };
  }, [filters, page]);

  const changeFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters(createInitialFilters());
    setPage(1);
  };

  const selectedTier = filters.tier || "free";
  const availableSports = archive.tierSports?.[selectedTier] || archive.sports || [];
  const groupedTips = ["free", "vip", "maxbet"]
    .map((tier) => ({
      tier,
      tips: archive.data.filter((tip) => tip.tiers?.includes(tier) || (tip.tier || "free") === tier),
    }))
    .filter((group) => group.tips.length > 0);
  const tierTitles = {
    maxbet: "💰 MAXBET TIPS",
    vip: "💎 VIP TIPS",
    free: "🆓 The Expertise Wins Free Tips 📣",
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-slate-800 pb-7">
        <Link href="/tips" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" /> Tips
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
              <CalendarDays className="h-4 w-4" /> Historical record
            </p>
            <h1 className="text-3xl font-black text-slate-100">Tip Archive</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Browse the Free, VIP, and MaxBet record transparently by day and by sport.
            </p>
          </div>
          <p className="text-sm text-slate-400" aria-live="polite">
            {archive.pagination.total} records
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border-slate-800 bg-slate-900 p-4 shadow-lg" aria-label="Archive tip tiers">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Archive tiers</p>
              <p className="mt-1 text-xs text-slate-500">Every archived tier is available to everyone.</p>
            </div>
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[{ id: "free", label: "🆓 Free" }, { id: "vip", label: "💎 VIP" }, { id: "maxbet", label: "💰 MaxBet" }].map((tier) => (
              <button key={tier.id} type="button" onClick={() => changeFilter("tier", tier.id)} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${filters.tier === tier.id ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"}`}>
                {tier.label}<span className="mt-1 block text-[11px] font-normal text-slate-500">Historical preview</span>
              </button>
            ))}
          </div>
        </section>

        <form
          className="grid grid-cols-1 gap-3 rounded-2xl border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            changeFilter("search", searchInput.trim());
          }}
        >
        <label className="space-y-1 text-xs text-slate-400 lg:col-span-2">
          Search fixtures or selections
          <span className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Team, competition, selection"
              className="w-full rounded-md border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </span>
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Sport
          <select value={filters.sport} onChange={(event) => changeFilter("sport", event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100">
            <option value="">All available sports</option>
            {availableSports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Tier sports
          <span className="block rounded-md border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">{selectedTier}</span>
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Recorded outcome
          <select value={filters.outcome} onChange={(event) => changeFilter("outcome", event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100">
            <option value="">Any outcome</option>
            <option value="PENDING">Pending</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="VOID">Void</option>
            <option value="PUSH">Push</option>
            <option value="HALF_WON">Half won</option>
            <option value="HALF_LOST">Half lost</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-slate-400 hidden">
          Tier
          <select value={filters.tier} onChange={(event) => changeFilter("tier", event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100">
            <option value="">All available tiers</option>
            {archive.tiers.map((tier) => <option key={tier.slug} value={tier.slug}>{tier.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Specific day
          <input type="date" value={filters.day} onChange={(event) => changeFilter("day", event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" />
        </label>
        <div className="flex items-end gap-2 lg:col-span-6">
          <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400">
            <Search className="h-4 w-4" /> Search
          </button>
          <button type="button" onClick={clearFilters} className="rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900">
            Clear filters
          </button>
        </div>
        </form>
      </div>

      {error ? (
        <div className="border-y border-rose-500/30 py-8 text-center text-sm text-rose-300">{error}</div>
      ) : loading ? (
        <div className="space-y-4" aria-label="Loading archive">
          {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse border-y border-slate-800 bg-slate-900/60" />)}
        </div>
      ) : archive.data.length ? (
        <div className="space-y-10" aria-label="Historical tips by tier">
          {groupedTips.map((group) => (
            <section key={group.tier} className="space-y-3" aria-label={tierTitles[group.tier]}>
              <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <h2 className={`text-base font-black text-slate-100 ${group.tier === "free" ? "normal-case" : "uppercase"}`}>{tierTitles[group.tier]}</h2>
                <span className="text-xs text-slate-500">{group.tips.length} cards</span>
              </header>
              <div className="divide-y divide-slate-800">
                {group.tips.map((tip, index) => {
                  const card = group.tier === "free"
                    ? formatFreeTipChannelCard(tip)
                    : formatTipChannelCard(tip);
                  return (
                    <article key={tip.id} className="py-5">
                      {group.tier !== "free" && <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Card {index + 1}</p>}
                      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-200">{card}</pre>
                      <Link href={`/tips/${tip.id}`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                        Preview details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {index < group.tips.length - 1 && group.tier !== "free" && <p className="mt-5 text-xs tracking-widest text-slate-700">----------------------------------------</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="border-y border-slate-800 py-16 text-center">
          <Trophy className="mx-auto mb-3 h-6 w-6 text-slate-500" />
          <h2 className="text-base font-bold text-slate-200">No archived tips found</h2>
          <p className="mt-2 text-sm text-slate-500">Try another day, tier, or sport.</p>
        </div>
      )}

      {!loading && archive.pagination.pages > 1 && (
        <nav className="flex items-center justify-between border-t border-slate-800 pt-5" aria-label="Archive pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-slate-500">Page {page} of {archive.pagination.pages}</span>
          <button type="button" disabled={page >= archive.pagination.pages} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </main>
  );
}
