// frontend/src/components/Navbar.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  User,
  LogOut,
  Trophy,
  Menu,
  X,
  BarChart3,
  Crown,
  Sparkles,
  BookOpen,
  Moon,
  Sun,
} from "lucide-react";
import { auth } from "../lib/auth";
import { authApi } from "../api/auth.api";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setMounted(true);

    const user = auth.getUser();
    setCurrentUser(user);
    setMobileMenuOpen(false);
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
    localStorage.setItem("tew-theme", nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout should still clear the local session
      // even if the API request fails.
    } finally {
      auth.clear();
      setCurrentUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    }
  };

  const navLinks = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tips",
      href: "/tips",
    },
    {
      label: "Stats",
      href: "/stats",
      icon: BarChart3,
    },
    {
      label: "Premium",
      href: "/products",
      icon: Crown,
      highlight: true,
    },
    {
      label: "Free Bets",
      href: "/bookies",
    },
    {
      label: "Blog",
      href: "/blog",
      icon: BookOpen,
    },
    {
      label: "About",
      href: "/about",
    },
  ];

  const isActiveRoute = (href) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-bg/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* BRAND */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="The Expertise Wins home"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/app-icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-dark-bg" />
            </div>

            <div className="hidden sm:flex flex-col">
              <span className="font-black text-lg text-slate-100 tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                The Expertise Wins
              </span>

              <span className="mt-1 text-[9px] uppercase tracking-[0.18em] font-bold text-slate-500">
                Sports Intelligence
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav
            className="hidden lg:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive = isActiveRoute(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    relative flex items-center gap-1.5
                    px-3.5 py-2 rounded-xl
                    text-xs font-bold
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                        : "text-slate-300 border border-transparent hover:text-white hover:bg-dark-hover"
                    }
                    ${
                      link.highlight && !isActive
                        ? "text-amber-300"
                        : ""
                    }
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-500
                  `}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        link.highlight
                          ? "text-amber-400"
                          : isActive
                          ? "text-emerald-400"
                          : ""
                      }`}
                      aria-hidden="true"
                    />
                  )}

                  <span>{link.label}</span>

                  {link.highlight && (
                    <Sparkles
                      className="w-3 h-3 text-amber-400"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* DESKTOP ACCOUNT ACTIONS */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="rounded-xl border border-dark-border bg-dark-card p-2 text-slate-400 transition-colors hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {mounted && currentUser ? (
              <>
                {/* Admin */}
                {auth.isAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className="
                      flex items-center gap-1.5
                      px-3 py-1.5
                      text-xs font-bold
                      rounded-xl
                      bg-amber-500/10
                      text-amber-400
                      border border-amber-500/20
                      hover:bg-amber-500/20
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-amber-500
                      transition-all
                    "
                  >
                    <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Profile */}
                <Link
                  href="/profile"
                  className="
                    flex items-center gap-2
                    px-3 py-1.5
                    text-xs font-semibold
                    rounded-xl
                    bg-dark-card
                    border border-dark-border
                    text-slate-200
                    hover:border-emerald-500/40
                    hover:text-white
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-500
                    transition-all
                  "
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />

                  <span className="max-w-[110px] truncate">
                    {currentUser.username || currentUser.email}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="
                    p-2 rounded-xl
                    bg-dark-card
                    text-slate-400
                    hover:text-rose-400
                    hover:bg-dark-hover
                    border border-dark-border
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-rose-500
                    transition-colors
                  "
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="
                    px-3.5 py-2
                    text-xs font-bold
                    text-slate-300
                    hover:text-white
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-cyan-500
                    rounded-xl
                    transition-colors
                  "
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="
                    flex items-center gap-1.5
                    px-4 py-2
                    text-xs font-bold
                    rounded-xl
                    bg-emerald-500
                    text-slate-950
                    hover:bg-emerald-400
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-400
                    transition-all
                    shadow-md shadow-emerald-500/20
                  "
                >
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="rounded-xl border border-dark-border bg-dark-card p-2 text-slate-400 transition-colors hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="
                p-2 rounded-xl
                bg-dark-card
                border border-dark-border
                text-slate-300
                hover:text-white
                hover:border-emerald-500/30
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-500
                transition-all
              "
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-dark-border bg-dark-bg/95 backdrop-blur-xl animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Brand context */}
            <div className="flex items-center gap-2 px-3 pb-3 mb-2 border-b border-dark-border">
              <Trophy
                className="w-4 h-4 text-cyan-400"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs font-bold text-slate-200">
                  The Expertise Wins
                </p>

                <p className="text-[10px] text-slate-500">
                  Sports intelligence & curated tips
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav
              className="flex flex-col space-y-1"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => {
                const isActive = isActiveRoute(link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      flex items-center justify-between
                      px-4 py-3
                      rounded-xl
                      text-xs font-bold
                      transition-all
                      ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-300 hover:text-white hover:bg-dark-hover border border-transparent"
                      }
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-emerald-500
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 ${
                            link.highlight
                              ? "text-amber-400"
                              : isActive
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                          aria-hidden="true"
                        />
                      )}

                      {link.label}
                    </span>

                  </Link>
                );
              })}
            </nav>

            {/* Account section */}
            <div className="pt-4 mt-3 border-t border-dark-border">
              {mounted && currentUser ? (
                <div className="flex flex-col gap-2">
                  {/* Current account */}
                  <Link
                    href="/profile"
                    className="
                      flex items-center gap-3
                      px-4 py-3
                      rounded-xl
                      bg-dark-card
                      border border-dark-border
                      text-slate-200
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-cyan-500
                    "
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <User
                        className="w-4 h-4 text-cyan-400"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Signed in as
                      </p>

                      <p className="text-xs font-bold text-slate-200 truncate">
                        {currentUser.username || currentUser.email}
                      </p>
                    </div>
                  </Link>

                  {/* Admin */}
                  {auth.isAdmin(currentUser) && (
                    <Link
                      href="/admin"
                      className="
                        flex items-center justify-center gap-2
                        px-4 py-3
                        text-xs font-bold
                        rounded-xl
                        bg-amber-500/10
                        text-amber-400
                        border border-amber-500/20
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-amber-500
                      "
                    >
                      <Shield className="w-4 h-4" aria-hidden="true" />
                      Admin Control
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      w-full
                      flex items-center justify-center gap-2
                      py-3
                      text-xs font-bold
                      text-rose-400
                      bg-rose-500/10
                      border border-rose-500/20
                      rounded-xl
                      hover:bg-rose-500/15
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-rose-500
                      transition-all
                    "
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="
                      flex items-center justify-center
                      py-3
                      text-xs font-bold
                      rounded-xl
                      bg-dark-card
                      border border-dark-border
                      text-slate-200
                      hover:border-cyan-500/30
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-cyan-500
                      transition-all
                    "
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    className="
                      flex items-center justify-center gap-1.5
                      py-3
                      text-xs font-bold
                      rounded-xl
                      bg-cyan-gradient
                      text-slate-950
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-cyan-400
                      shadow-md shadow-cyan-500/10
                    "
                  >
                    <Trophy
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}