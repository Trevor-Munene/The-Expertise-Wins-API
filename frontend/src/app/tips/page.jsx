// frontend/src/app/tips/page.jsx
"use client";

import { useState, useEffect } from "react";
import { tipsApi } from "../../api/tips.api";
import TipCard from "../../components/TipCard";
import {
  Search,
  Lock,
  Trophy,
  Zap,
  Sparkles,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState("free"); // free | vip | maxbet | all
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    async function loadTips() {
      setLoading(true);
      setRequiresAuth(false);

      try {
        let res;

        if (activeTab === "free") {
          res = await tipsApi.getFreeTips();
        } else if (activeTab === "vip") {
          res = await tipsApi.getVipTips();
        } else if (activeTab === "maxbet") {
          res = await tipsApi.getMaxbetTips();
        } else {
          res = await tipsApi.getTips();
        }

        const data = res?.tips || res?.data || res || [];
        setTips(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.response?.status === 401) {
          setRequiresAuth(true);
        }

        setTips([]);
      } finally {
        setLoading(false);
      }
    }

    loadTips();
  }, [activeTab]);

  const filteredTips = tips.filter((tip) => {
    const matchStr = (
      tip.teams ||
      `${tip.homeTeam || ""} ${tip.awayTeam || ""} ${
        tip.competition || ""
      } ${tip.selection || ""}`
    ).toLowerCase();

    const matchesSearch = matchStr.includes(searchTerm.toLowerCase());

    const matchesSport =
      selectedSport === "ALL" ||
      (tip.sport || "Football").toUpperCase() === selectedSport;

    return matchesSearch && matchesSport;
  });

  const tabs = [
    {
      id: "free",
      label: "6+ Free Football Tips",
      icon: Trophy,
      activeClass:
        "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20",
      iconClass: "text-current",
    },
    {
      id: "vip",
      label: "VIP Channel",
      icon: Zap,
      activeClass:
        "bg-indigo-500 text-white shadow-md shadow-indigo-500/20",
      iconClass: "text-amber-400",
    },
    {
      id: "maxbet",
      label: "MaxBet VIP",
      icon: Sparkles,
      activeClass:
        "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20",
      iconClass: "text-current",
    },
    {
      id: "all",
      label: "All Tips",
      icon: null,
      activeClass: "bg-slate-800 text-slate-100",
      iconClass: "",
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Curated Betting Selections</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Tips & Predictions Hub
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Football tips remain free for our community, with at least 6 free
          football selections published daily. VIP and MaxBet access extends
          our coverage into additional sports, markets, curated selections,
          and premium opportunities.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            View Membership Access
          </Link>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 font-bold text-xs transition-all inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            DM @PikkBetter
          </a>
        </div>
      </div>

      {/* Tip Access Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Free Football
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            At least 6 football tips daily, available to the wider community.
          </p>
        </div>

        <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Pikk Better VIP
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Premium daily selections, multiple sports and markets, with
            curated reasoning.
          </p>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Pikk MaxBet VIP
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Highest-tier selections with stronger curation and dedicated
            MaxBet opportunities.
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.activeClass
                      : "bg-slate-950 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {Icon && (
                    <Icon className={`w-3.5 h-3.5 ${tab.iconClass}`} />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 lg:w-64">
              <input
                type="text"
                placeholder="Search team, league, selection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 pl-9"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full max-w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 sm:w-auto"
            >
              <option value="ALL">All Sports</option>
              <option value="FOOTBALL">Football</option>
              <option value="BASKETBALL">Basketball</option>
              <option value="TENNIS">Tennis</option>
            </select>
          </div>
        </div>

        {/* Current View Indicator */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400">
            Viewing:{" "}
            <span className="font-bold text-slate-200">
              {activeTab === "free"
                ? "Free Football Tips"
                : activeTab === "vip"
                ? "Pikk Better VIP"
                : activeTab === "maxbet"
                ? "Pikk MaxBet VIP"
                : "All Available Tips"}
            </span>
          </p>

          <p className="text-[11px] text-slate-500">
            {filteredTips.length} selection
            {filteredTips.length === 1 ? "" : "s"} shown
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : requiresAuth ? (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-10 text-center space-y-5 max-w-xl mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-100">
              Premium Access Required
            </h3>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              This section contains premium selections available through an
              active VIP or MaxBet membership. Sign in with your account or
              activate the access token provided by Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/products"
              className="px-5 py-2.5 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              View Access Options
            </Link>
          </div>
        </div>
      ) : filteredTips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTips.map((tip) => (
            <TipCard key={tip.id || tip._id} tip={tip} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5 text-slate-500" />
          </div>

          <h3 className="text-sm font-bold text-slate-200">
            No Tips Found
          </h3>

          <p className="text-slate-400 text-xs">
            No selections match your current search or sport filter.
          </p>
        </div>
      )}

      {/* Community / Access Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-2xl p-7 sm:p-8 text-center space-y-3 max-w-4xl mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Crown className="w-6 h-6" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-100">
          👑 I COME TO HELP & SERVE MY PEOPLE
        </h3>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
          Football remains free for our community. For premium sports,
          markets, VIP selections, or MaxBet access, membership is available
          through dedicated international and African-market rates.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            <Crown className="w-4 h-4" />
            View Memberships
          </Link>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
          >
            <Send className="w-4 h-4" />
            DM ADMIN @PikkBetter
          </a>
        </div>
      </div>
    </div>
  );
}
