// frontend/src/app/login/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../../api/auth.api";
import { auth } from "../../lib/auth";

const initialFormData = {
  email: "",
  password: "",
};

const inputClassName =
  "w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors pl-11 disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const identifier = formData.email.trim();
    const password = formData.password;

    if (!identifier || !password) {
      toast.error("Please enter your email or username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        email: identifier,
        password,
      });

      if (!response?.token || !response?.user) {
        toast.error("Unexpected response from server.");
        return;
      }

      auth.setToken(response.token);
      auth.setUser(response.user);

      toast.success(response.message || "Login successful!");

      router.push(auth.isAdmin(response.user) ? "/admin" : "/profile");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Invalid credentials. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto"
            aria-hidden="true"
          >
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome Back
            </h1>

            <p className="text-slate-400 text-xs leading-relaxed">
              Sign in to access VIP tips, token redemption, and account
              features.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email or Username
            </label>

            <div className="relative">
              <input
                id="login-identifier"
                name="email"
                type="text"
                autoComplete="username"
                required
                disabled={loading}
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                className={inputClassName}
              />

              <Mail
                className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                className={inputClassName}
              />

              <Lock
                className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>

            <ArrowRight
              className="w-4 h-4"
              aria-hidden="true"
            />
          </button>
        </form>

        {/* Footer */}
        <div className="pt-5 mt-6 border-t border-slate-800 text-center text-xs text-slate-400 space-y-3">
          <p>
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
            >
              Register here
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck
              className="w-3.5 h-3.5 text-emerald-400"
              aria-hidden="true"
            />
            <span>
              Admin and tipster accounts use the same secure login.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}