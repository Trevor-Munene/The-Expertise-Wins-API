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

// Mirror the server-side rules in backend/middleware/validation.js so mistakes
// are caught before the request instead of surfacing as a generic API error.
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

const validateForm = (values) => {
  const errors = {};

  const username = values.username.trim();
  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 3 || username.length > 30) {
    errors.username = "Username must be between 3 and 30 characters.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      "Username may only contain letters, numbers, dots, hyphens and underscores.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (values.firstName.trim().length > 50) {
    errors.firstName = "First name must be 50 characters or fewer.";
  }

  if (values.lastName.trim().length > 50) {
    errors.lastName = "Last name must be 50 characters or fewer.";
  }

  return errors;
};

const inputClassName =
  "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors";

const errorInputClassName =
  "w-full px-4 py-2.5 bg-slate-950 border border-red-500/70 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    // Clear a field's error as soon as the user edits it again
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const fieldErrors = validateForm(formData);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});

    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password;

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
      // The API returns field-level detail for validation failures, so show
      // that when present instead of the generic conflict message.
      const responseData = err.response?.data;
      const details = responseData?.details;

      if (err.response?.status === 400 && Array.isArray(details) && details.length > 0) {
        // Attach server-side validation details to the field they refer to so
        // the message appears inline as well as in the toast.
        const serverErrors = {};
        for (const detail of details) {
          const field = ["email", "username", "password", "firstName", "lastName"].find(
            (key) => detail.toLowerCase().startsWith(key.toLowerCase())
          );
          if (field) {
            serverErrors[field] = detail;
          }
        }
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
        }
        toast.error(details.join(" "));
      } else if (err.response?.status === 409) {
        toast.error(
          responseData?.message ||
            "Email or username already in use."
        );
      } else {
        toast.error(
          responseData?.message ||
            "Registration failed. Please try again."
        );
      }
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
                className={errors.firstName ? errorInputClassName : inputClassName}
              />
              {errors.firstName && (
                <p className="mt-1 text-[11px] text-red-400">{errors.firstName}</p>
              )}
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
                className={errors.lastName ? errorInputClassName : inputClassName}
              />
              {errors.lastName && (
                <p className="mt-1 text-[11px] text-red-400">{errors.lastName}</p>
              )}
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
                className={`${errors.username ? errorInputClassName : inputClassName} pl-10`}
              />

              <User
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-[11px] text-red-400">{errors.username}</p>
            )}
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
                className={`${errors.email ? errorInputClassName : inputClassName} pl-10`}
              />

              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>
            )}
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
                className={`${errors.password ? errorInputClassName : inputClassName} pl-10`}
              />

              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>
            )}
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
