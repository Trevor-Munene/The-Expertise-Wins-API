// frontend/src/components/Navbar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../lib/auth";
import { authApi } from "../api/auth.api";
import toast from "react-hot-toast";
import { Shield, User, LogOut, Trophy, Menu, X, BookOpen, Crown } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = auth.getUser();
    setCurrentUser(user);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      auth.clear();
      setCurrentUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Tips Hub", href: "/tips" },
    { label: "Stats & Analytics", href: "/stats" },
    { label: "VIP Products", href: "/products" },
    { label: "Insights Blog", href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Photo-inspired Avatar */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl brand-avatar-badge flex items-center justify-center text-slate-950 font-bold transition-transform group-hover:scale-105">
                {/* SVG Silhouette representation of the cool avatar photo */}
                <svg viewBox="0 0 100 100" className="w-7 h-7 fill-slate-950">
                  <path d="M50 10 C 30 10 20 25 20 45 C 20 55 22 65 28 75 C 34 85 45 92 50 92 C 55 92 66 85 72 75 C 78 65 80 55 80 45 C 80 25 70 10 50 10 Z" />
                  <path d="M30 40 Q 40 36 50 40 Q 60 36 70 40 L 68 50 Q 50 56 32 50 Z" fill="#00c6ff" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-dark-bg" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-lg text-slate-100 tracking-tight leading-none group-hover:text-cyan-400 transition-colors">
                The Expertise Wins
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-400 leading-tight">
                PIKK BETTER VIP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-dark-hover"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User / Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && currentUser ? (
              <div className="flex items-center gap-2">
                {auth.isAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Module</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-dark-card border border-dark-border text-slate-200 hover:border-cyan-500/40 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[100px] truncate">{currentUser.username || currentUser.email}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl bg-dark-card text-slate-400 hover:text-rose-400 hover:bg-dark-hover border border-dark-border transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-gradient text-slate-950 hover:opacity-90 transition-all shadow-md shadow-cyan-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-dark-card border border-dark-border text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-bg border-b border-dark-border px-4 py-4 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-300 hover:bg-dark-hover"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-dark-border flex flex-col gap-2">
            {mounted && currentUser ? (
              <>
                {auth.isAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Module</span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-dark-card border border-dark-border text-slate-200"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>My Profile ({currentUser.username})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="py-2.5 text-center text-xs font-bold rounded-xl bg-dark-card border border-dark-border text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-2.5 text-center text-xs font-bold rounded-xl bg-cyan-gradient text-slate-950"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
