// frontend/src/components/Navbar.jsx

"use client";

import { useEffect, useRef, useState } from "react";
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
  History,
  Crown,
  Sparkles,
  BookOpen,
  Moon,
  Sun,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";
import { authApi } from "../api/auth.api";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Tips", href: "/tips" },
  { label: "Archive", href: "/archive", icon: History },
  { label: "Stats", href: "/stats", icon: BarChart3 },
  { label: "Premium", href: "/products", icon: Crown, highlight: true },
  { label: "Free Bets", href: "/bookies" },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "About", href: "/about" },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg";

const iconButtonStyles = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dark-border bg-dark-card text-slate-400 transition-colors hover:bg-dark-hover hover:text-emerald-400 ${focusStyles}`;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuButtonRef = useRef(null);
  const headerRef = useRef(null);
  const logoutInProgressRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(auth.getUser());
    setMobileMenuOpen(false);
    setTheme(
      document.documentElement.classList.contains("light") ? "light" : "dark"
    );
  }, [pathname]);

  useEffect(() => {
    const syncStoredState = (event) => {
      if (
        event.key === null ||
        event.key === "tekw_user" ||
        event.key === "tekw_token" ||
        event.type === "tew-auth-change"
      ) {
        setCurrentUser(auth.getUser());
      }

      if (
        event.key === "tew-theme" &&
        (event.newValue === "light" || event.newValue === "dark")
      ) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(event.newValue);
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", syncStoredState);
    window.addEventListener("tew-auth-change", syncStoredState);

    return () => {
      window.removeEventListener("storage", syncStoredState);
      window.removeEventListener("tew-auth-change", syncStoredState);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
    setTheme(nextTheme);

    try {
      localStorage.setItem("tew-theme", nextTheme);
    } catch {
      // Keep the selected theme active when browser storage is unavailable.
    }
  };

  const handleLogout = async () => {
    if (logoutInProgressRef.current) return;

    logoutInProgressRef.current = true;
    setIsLoggingOut(true);

    try {
      await authApi.logout();
    } catch {
      // Clear the local session even when the logout request fails.
    } finally {
      auth.clear();
      setCurrentUser(null);
      setMobileMenuOpen(false);
      setIsLoggingOut(false);
      logoutInProgressRef.current = false;
      toast.success("Logged out successfully");
      router.push("/");
    }
  };

  const isActiveRoute = (href) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || Boolean(pathname?.startsWith(`${href}/`));

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const accountLabel =
    currentUser?.username || currentUser?.email || "My profile";

  const themeLabel = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-emerald-400/10 bg-dark-bg/90 shadow-lg shadow-black/10 backdrop-blur-2xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-emerald-300/20 after:to-transparent"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            aria-label="The Expertise Wins home"
            className={`group flex shrink-0 items-center gap-3 rounded-xl ${focusStyles}`}
          >
            <div className="relative">
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10 transition-transform duration-200 motion-safe:group-hover:scale-105">
                <Image
                  src="/app-icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>

              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-dark-bg bg-emerald-400"
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="whitespace-nowrap text-[13px] font-black leading-none tracking-tight text-slate-100 sm:text-base">
                The Expertise Wins
              </span>
              <span className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.2em] text-emerald-300 sm:text-[9px]">
                Sports Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-0.5 xl:flex"
          >
            {navLinks.map((link) => {
              const isActive = isActiveRoute(link.href);
              const Icon = link.icon;

              const linkColor = isActive
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : link.highlight
                  ? "border-transparent text-amber-300 hover:bg-dark-hover hover:text-amber-200"
                  : "border-transparent text-slate-300 hover:bg-dark-hover hover:text-white";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-2 text-xs font-bold transition-colors ${linkColor} ${focusStyles}`}
                >
                  {Icon && (
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}

                  {link.label}

                  {link.highlight && (
                    <Sparkles
                      className="h-3 w-3 text-amber-400"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop account actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <button
              type="button"
              onClick={toggleTheme}
              disabled={!mounted}
              title={themeLabel}
              aria-label={themeLabel}
              className={`${iconButtonStyles} disabled:cursor-wait`}
            >
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            {!mounted ? (
              <div
                aria-hidden="true"
                className="h-11 w-40 rounded-xl bg-dark-card"
              />
            ) : currentUser ? (
              <>
                {auth.isAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20 ${focusStyles}`}
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  title={accountLabel}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-dark-border bg-dark-card px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-500/40 hover:text-white ${focusStyles}`}
                >
                  <User
                    className="h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="max-w-[100px] truncate">{accountLabel}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Sign out"
                  aria-label={isLoggingOut ? "Signing out" : "Sign out"}
                  aria-busy={isLoggingOut}
                  className={`${iconButtonStyles} hover:text-rose-400 disabled:cursor-wait disabled:opacity-50`}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`inline-flex min-h-[44px] items-center rounded-xl px-3 text-xs font-bold text-slate-300 transition-colors hover:text-white ${focusStyles}`}
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 transition-colors hover:bg-emerald-400 ${focusStyles}`}
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              disabled={!mounted}
              title={themeLabel}
              aria-label={themeLabel}
              className={`${iconButtonStyles} disabled:cursor-wait`}
            >
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className={iconButtonStyles}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        hidden={!mobileMenuOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-dark-border bg-dark-bg/95 xl:hidden"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center gap-3 border-b border-dark-border px-3 pb-4">
            <Trophy
              className="h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-bold text-slate-200">
                The Expertise Wins
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Sports intelligence & curated tips
              </p>
            </div>
          </div>

          <nav
            aria-label="Mobile navigation"
            className="grid gap-1 sm:grid-cols-2"
          >
            {navLinks.map((link) => {
              const isActive = isActiveRoute(link.href);
              const Icon = link.icon;

              const linkColor = isActive
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : link.highlight
                  ? "border-transparent text-amber-300 hover:bg-dark-hover"
                  : "border-transparent text-slate-300 hover:bg-dark-hover hover:text-white";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${linkColor} ${focusStyles}`}
                >
                  <span className="flex items-center gap-2">
                    {Icon && (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    )}
                    {link.label}
                  </span>

                  {link.highlight && (
                    <Sparkles
                      className="h-4 w-4 text-amber-400"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile account actions */}
          <div className="mt-4 border-t border-dark-border pt-4">
            {!mounted ? (
              <div
                aria-hidden="true"
                className="h-12 rounded-xl bg-dark-card"
              />
            ) : currentUser ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card px-4 py-3 text-slate-200 ${focusStyles}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <User
                      className="h-5 w-5 text-emerald-400"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Signed in as
                    </p>
                    <p className="mt-1 truncate text-sm font-bold">
                      {accountLabel}
                    </p>
                  </div>
                </Link>

                {auth.isAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 transition-colors hover:bg-amber-500/20 ${focusStyles}`}
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Admin Control
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/20 disabled:cursor-wait disabled:opacity-50 ${focusStyles}`}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {isLoggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border border-dark-border bg-dark-card px-3 py-3 text-sm font-bold text-slate-200 transition-colors hover:border-emerald-500/40 ${focusStyles}`}
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 ${focusStyles}`}
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
