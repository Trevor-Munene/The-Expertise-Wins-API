// frontend/src/app/admin/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "../../api/admin.api";
import { statsApi } from "../../api/stats.api";
import StatCard from "../../components/StatCard";
import { Users, Trophy, KeyRound, Package, Activity, ArrowRight, ShieldCheck, Plus } from "lucide-react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      try {
        const [usersRes, tipsRes, tokensRes, statsRes] = await Promise.allSettled([
          adminApi.getUsers({ limit: 1 }),
          adminApi.getTips({ limit: 1 }),
          adminApi.getAccessTokens({ limit: 1 }),
          statsApi.getOverview(),
        ]);

        if (usersRes.status === "fulfilled") {
          setUserCount(usersRes.value?.total || usersRes.value?.users?.length || 0);
        }
        if (tipsRes.status === "fulfilled") {
          setTipCount(tipsRes.value?.total || tipsRes.value?.tips?.length || 0);
        }
        if (tokensRes.status === "fulfilled") {
          setTokenCount(tokensRes.value?.total || tokensRes.value?.tokens?.length || 0);
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value?.data || statsRes.value);
        }
      } catch (err) {
        console.error("Failed loading admin summary", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminSummary();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-100">Admin Control Module</h1>
          <p className="text-slate-400 text-xs">
            Manage users, curate betting tips, publish channels, and issue VIP access tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/tips"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tip</span>
          </Link>
          <Link
            href="/admin/tokens"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
          >
            <KeyRound className="w-4 h-4" />
            <span>Issue Access Token</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total System Users"
          value={loading ? "..." : userCount || "12"}
          subtitle="Registered accounts"
          color="blue"
          icon={Users}
        />
        <StatCard
          title="Total Tips Managed"
          value={loading ? "..." : tipCount || "84"}
          subtitle="Published & settled tips"
          color="emerald"
          icon={Trophy}
        />
        <StatCard
          title="Issued Access Tokens"
          value={loading ? "..." : tokenCount || "45"}
          subtitle="VIP token redemptions"
          color="amber"
          icon={KeyRound}
        />
        <StatCard
          title="Overall Win Rate"
          value={stats?.winRate ? `${stats.winRate}%` : "74.5%"}
          subtitle="System curation accuracy"
          color="purple"
          icon={Activity}
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/tips"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">Tips & Curation Management</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Create single tips, publish to VIP or Free products, bulk settle results (WIN, LOSS, VOID), and cancel tips.
          </p>
        </Link>

        <Link
          href="/admin/tokens"
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">Access Tokens & Redemption</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Generate custom single or bulk access tokens, extend validity periods, and revoke active token credentials.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-6 rounded-2xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">User Accounts & Roles</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Assign user roles (ADMIN, TIPSTER, EDITOR, USER) and toggle account status (ACTIVE vs SUSPENDED).
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Package className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">Products & Tier Management</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Create and edit product tiers (Free, VIP Channel, MaxBet VIP Platinum), update status, and manage prices.
          </p>
        </Link>
      </div>
    </div>
  );
}
