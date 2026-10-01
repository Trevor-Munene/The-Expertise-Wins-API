// frontend/src/app/admin/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  KeyRound,
  Package,
  Plus,
  Trophy,
  Users,
} from "lucide-react";

import { adminApi } from "../../api/admin.api";
import { statsApi } from "../../api/stats.api";
import StatCard from "../../components/StatCard";

const adminSections = [
  {
    href: "/admin/tips",
    title: "Tips & Curation Management",
    description:
      "Create tips, publish them to products, settle results, and manage the tip lifecycle.",
    icon: Trophy,
    iconColor: "text-emerald-400",
    iconBackground: "bg-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/50",
  },
  {
    href: "/admin/tokens",
    title: "Access Tokens & Redemption",
    description:
      "Generate access tokens, extend validity periods, and revoke active credentials.",
    icon: KeyRound,
    iconColor: "text-amber-400",
    iconBackground: "bg-amber-500/10",
    hoverBorder: "hover:border-amber-500/50",
  },
  {
    href: "/admin/users",
    title: "User Accounts & Roles",
    description:
      "Manage user accounts, assign roles, and control account status.",
    icon: Users,
    iconColor: "text-sky-400",
    iconBackground: "bg-sky-500/10",
    hoverBorder: "hover:border-sky-500/50",
  },
  {
    href: "/admin/products",
    title: "Products & Tier Management",
    description:
      "Manage product tiers, pricing, availability, and product status.",
    icon: Package,
    iconColor: "text-indigo-400",
    iconBackground: "bg-indigo-500/10",
    hoverBorder: "hover:border-indigo-500/50",
  },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      try {
        const [usersRes, tipsRes, tokensRes, statsRes] =
          await Promise.allSettled([
            adminApi.getUsers({ limit: 1 }),
            adminApi.getTips({ limit: 1 }),
            adminApi.getAccessTokens({ limit: 1 }),
            statsApi.getOverview(),
          ]);

        if (usersRes.status === "fulfilled") {
          const response = usersRes.value;

          setUserCount(
            response?.total ??
              response?.pagination?.total ??
              response?.users?.length ??
              0
          );
        }

        if (tipsRes.status === "fulfilled") {
          const response = tipsRes.value;

          setTipCount(
            response?.total ??
              response?.pagination?.total ??
              response?.tips?.length ??
              0
          );
        }

        if (tokensRes.status === "fulfilled") {
          const response = tokensRes.value;

          setTokenCount(
            response?.total ??
              response?.pagination?.total ??
              response?.tokens?.length ??
              0
          );
        }

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value?.data || statsRes.value);
        }

        const failures = [
          usersRes,
          tipsRes,
          tokensRes,
          statsRes,
        ].filter((result) => result.status === "rejected");

        if (failures.length > 0) {
          console.warn(
            `${failures.length} admin summary request(s) failed.`
          );
        }
      } catch (error) {
        console.error("Failed loading admin summary", error);
      } finally {
        setLoading(false);
      }
    }

    loadAdminSummary();
  }, []);

  const winRate =
    stats?.winRate !== undefined && stats?.winRate !== null
      ? `${stats.winRate}%`
      : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100">
              Admin Control Module
            </h1>

            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Admin
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Manage users, curate tips, control products, and issue access
            credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/tips"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Create Tip
          </Link>

          <Link
            href="/admin/tokens"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-amber-400"
          >
            <KeyRound className="h-4 w-4" />
            Issue Access Token
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total System Users"
          value={loading ? "..." : userCount}
          subtitle="Registered accounts"
          color="blue"
          icon={Users}
        />

        <StatCard
          title="Total Tips Managed"
          value={loading ? "..." : tipCount}
          subtitle="Published & settled tips"
          color="emerald"
          icon={Trophy}
        />

        <StatCard
          title="Issued Access Tokens"
          value={loading ? "..." : tokenCount}
          subtitle="Access credentials"
          color="amber"
          icon={KeyRound}
        />

        <StatCard
          title="Overall Win Rate"
          value={loading ? "..." : winRate}
          subtitle="Tracked tip performance"
          color="purple"
          icon={Activity}
        />
      </div>

      {/* Management Sections */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-100">
            Management
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Administrative tools for operating The Expertise Wins platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {adminSections.map(
            ({
              href,
              title,
              description,
              icon: Icon,
              iconColor,
              iconBackground,
              hoverBorder,
            }) => (
              <Link
                key={href}
                href={href}
                className={`group space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all ${hoverBorder}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`rounded-xl p-3 ${iconBackground} ${iconColor}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-slate-200" />
                </div>

                <h3 className="text-lg font-bold text-slate-100">
                  {title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-400">
                  {description}
                </p>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}