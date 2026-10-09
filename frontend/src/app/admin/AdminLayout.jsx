// frontend/src/app/admin/layout.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  Package,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

import { auth } from "../../lib/auth";
import { authApi } from "../../api/auth.api";

const adminNav = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users & Roles",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Tips Management",
    href: "/admin/tips",
    icon: Trophy,
  },
  {
    label: "Access Tokens",
    href: "/admin/tokens",
    icon: KeyRound,
  },
  {
    label: "Products & Tiers",
    href: "/admin/products",
    icon: Package,
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refreshAuthorization() {
      if (!auth.getToken()) {
        setUser(null);
        setChecking(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (cancelled) return;
        auth.setUser(currentUser);
        setUser(currentUser);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    refreshAuthorization();
    return () => { cancelled = true; };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"
          role="status"
          aria-label="Checking authorization"
        />
      </div>
    );
  }

  const isAuthorized = user && auth.isAdmin(user);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-rose-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-100">
              Access Restricted
            </h1>

            <p className="text-xs leading-relaxed text-slate-400">
              The Admin Dashboard is restricted to authorized administrator
              accounts. Please sign in with an account that has the required
              permissions.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              Sign In
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-slate-100 md:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-900 p-4 md:w-64 md:border-b-0 md:border-r">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950">
            ADM
          </div>

          <div>
            <div className="text-sm font-extrabold leading-none text-slate-100">
              Admin Module
            </div>

            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Expertise Engine
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1" aria-label="Admin navigation">
          {adminNav.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Main App</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
