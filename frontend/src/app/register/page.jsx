// frontend/src/app/register/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../../api/auth.api";

const initialFormData = {
  email: "",
  username: "",
  password: "",
  firstName: "",
  lastName: "",
};

const inputClassName =
  "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password;

    if (!email || !username || !password) {
      toast.error("Email, username, and password are required.");
      return;
    }

    setLoading(true);

    try {
      const registrationPayload = {
        email,
        username,
        password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      const registrationResponse = await authApi.register(
        registrationPayload
      );

      toast.success(
        registrationResponse?.message ||
          "Account registered successfully!"
      );

      router.push("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Registration failed. Username or email may already be taken."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <section
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
        aria-labelledby="register-title"
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <UserPlus
              className="w-6 h-6"
              aria-hidden="true"
            />
          </div>

          <h1
            id="register-title"
            className="text-2xl font-bold text-slate-100"
          >
            Create an Account
          </h1>

          <p className="text-slate-400 text-xs leading-relaxed">
            Join The Expertise Wins to manage your account,
            subscriptions, and access.
          </p>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate={false}
        >
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                placeholder="John"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                placeholder="Doe"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
            >
              Username *
            </label>

            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={formData.username}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
                placeholder="expert_tipster"
                className={`${inputClassName} pl-10`}
              />

              <User
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
            >
              Email Address *
            </label>

            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="user@example.com"
                className={`${inputClassName} pl-10`}
              />

              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
            >
              Password *
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="••••••••"
                className={`${inputClassName} pl-10`}
              />

              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {loading ? (
              <>
                <Loader2
                  className="w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="pt-5 mt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400/50 rounded"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
