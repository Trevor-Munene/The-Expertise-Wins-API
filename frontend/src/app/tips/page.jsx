// frontend/src/app/tips/page.jsx
"use client";

import { useState, useEffect } from "react";
import { tipsApi } from "../../api/tips.api";
import TipCard from "../../components/TipCard";
import { Search, Filter, Lock, Trophy, Zap, Sparkles } from "lucide-react";
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
          setTips([]);
        } else {
          setTips([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadTips();
  }, [activeTab]);

  const filteredTips = tips.filter((tip) => {
    const matchStr = (tip.teams || `${tip.homeTeam} ${tip.awayTeam} ${tip.competition} ${tip.selection}`).toLowerCase();
    const matchesSearch = matchStr.includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === "ALL" || (tip.sport || "Football").toUpperCase() === selectedSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Betting Selections</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">Tips & Predictions Hub</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Browse daily sports predictions curated by our engine. Switch between Free, VIP, and MaxBet products.
        </p>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab("free")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "free"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Free Tips</span>
          </button>

          <button
            onClick={() => setActiveTab("vip")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "vip"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Channel</span>
          </button>

          <button
            onClick={() => setActiveTab("maxbet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "maxbet"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MaxBet VIP</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-800 text-slate-100"
                : "bg-slate-950 text-slate-400 hover:bg-slate-800"
            }`}
          >
            All Tips
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search team, league, selection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 pl-9"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Sports</option>
            <option value="FOOTBALL">Football</option>
            <option value="BASKETBALL">Basketball</option>
            <option value="TENNIS">Tennis</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requiresAuth ? (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">VIP Access Required</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Viewing premium VIP or MaxBet predictions requires an active subscription or access token. Please sign in or redeem your token.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Sign In to View
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Redeem Access Token
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No tips found matching your criteria.
        </div>
      )}
    </div>
  );
}
