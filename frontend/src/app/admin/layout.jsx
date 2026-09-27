// frontend/src/app/admin/layout.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../lib/auth";
import { LayoutDashboard, Users, Trophy, KeyRound, Package, ArrowLeft, ShieldAlert, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const currentUser = auth.getUser();
    setUser(currentUser);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict Admin Authorization Check
  if (!user || !auth.isAdmin(user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            The Admin Dashboard module is restricted to administrators and operators. Please sign in with an authorized account.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminNav = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users & Roles", href: "/admin/users", icon: Users },
    { label: "Tips Management", href: "/admin/tips", icon: Trophy },
    { label: "Access Tokens", href: "/admin/tokens", icon: KeyRound },
    { label: "Products & Tiers", href: "/admin/products", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
              ADM
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-100 leading-none">Admin Module</div>
              <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Expertise Engine</div>
            </div>
          </div>
        </div>

        {/* Admin Nav Links */}
        <nav className="space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Main Web App</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content View */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
