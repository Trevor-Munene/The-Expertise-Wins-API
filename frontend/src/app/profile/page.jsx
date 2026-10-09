// frontend/src/app/profile/page.jsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Upload,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react";

import { authApi } from "../../api/auth.api";
import { subscriptionsApi } from "../../api/subscriptions.api";
import { productsApi } from "../../api/products.api";
import { auth } from "../../lib/auth";
import { getTipsPathForProduct } from "../../lib/access";
import { formatDate } from "../../lib/utils";
import Modal from "../../components/Modal";

const panelStyles =
  "min-w-0 rounded-2xl border border-dark-border bg-dark-card p-5 sm:p-6";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-card";

const inputStyles = `min-h-[44px] w-full rounded-xl border border-dark-border bg-dark-bg px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-60 ${focusStyles}`;

const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusStyles}`;

// Preserve explicit null values in wrapped API responses.
function unwrapResponse(response, key) {
  if (
    response &&
    typeof response === "object" &&
    Object.prototype.hasOwnProperty.call(response, key)
  ) {
    return response[key];
  }

  return response;
}

function getList(response, key) {
  const data = unwrapResponse(response, key);

  return Array.isArray(data)
    ? data.filter((item) => item && typeof item === "object")
    : [];
}

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;

  return typeof message === "string" && message.trim()
    ? message
    : fallback;
}

function getSuccessMessage(response, fallback) {
  return typeof response?.message === "string" && response.message.trim()
    ? response.message
    : fallback;
}

function safeFormatDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isFinite(parsed.getTime()) ? formatDate(value) : "—";
}

function normalizeStatus(status) {
  return typeof status === "string" && status.trim()
    ? status.trim().toUpperCase()
    : "UNKNOWN";
}

function getStatusClasses(status) {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    case "EXPIRED":
    case "CANCELLED":
    case "REVOKED":
      return "border-rose-500/20 bg-rose-500/10 text-rose-400";
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    default:
      return "border-dark-border bg-dark-bg text-slate-400";
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [failedSections, setFailedSections] = useState([]);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [tokenCode, setTokenCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [subscriptionAction, setSubscriptionAction] = useState(null);

  const mountedRef = useRef(false);
  const profileRequestRef = useRef(0);
  const verificationRequestRef = useRef(0);
  const fileInputRef = useRef(null);
  const busyActionsRef = useRef(new Set());

  // Guard against duplicate submissions before React updates the UI.
  const beginAction = (name) => {
    if (busyActionsRef.current.has(name)) return false;
    busyActionsRef.current.add(name);
    return true;
  };

  const endAction = (name) => {
    busyActionsRef.current.delete(name);
  };

  const loadProfileData = useCallback(async () => {
    const requestId = ++profileRequestRef.current;

    if (!auth.getToken()) {
      router.replace("/login");
      return;
    }

    if (mountedRef.current) {
      setRefreshing(true);
      setProfileError("");
    }

    const results = await Promise.allSettled([
      authApi.me(),
      subscriptionsApi.getActiveSubscription(),
      subscriptionsApi.getSubscriptionHistory(),
      subscriptionsApi.getMyAccess(),
      productsApi.getMyProducts(),
    ]);

    if (
      !mountedRef.current ||
      requestId !== profileRequestRef.current
    ) {
      return;
    }

    const [meRes, activeRes, historyRes, accessRes, productsRes] = results;

    const sectionResults = [
      { result: activeRes, label: "Active subscription" },
      { result: historyRes, label: "Access history" },
      { result: accessRes, label: "Access details" },
      { result: productsRes, label: "Available products" },
    ];

    setFailedSections(
      sectionResults
        .filter(({ result }) => result.status === "rejected")
        .map(({ label }) => label)
    );

    if (
      meRes.status === "fulfilled" &&
      meRes.value &&
      typeof meRes.value === "object" &&
      !Array.isArray(meRes.value)
    ) {
      setUser(meRes.value);
    } else {
      setUser(null);
      setProfileError(
        meRes.status === "rejected"
          ? getErrorMessage(meRes.reason, "Unable to load your profile.")
          : "Your profile information is unavailable."
      );
    }

    const subscription =
      activeRes.status === "fulfilled"
        ? unwrapResponse(activeRes.value, "subscription")
        : null;

    setActiveSub(
      subscription &&
        typeof subscription === "object" &&
        !Array.isArray(subscription)
        ? subscription
        : null
    );

    setSubHistory(
      historyRes.status === "fulfilled"
        ? getList(historyRes.value, "subscriptions")
        : []
    );

    setLoading(false);
    setRefreshing(false);
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    loadProfileData();

    return () => {
      mountedRef.current = false;
      profileRequestRef.current += 1;
      verificationRequestRef.current += 1;
    };
  }, [loadProfileData]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("Both old and new password are required");
      return;
    }

    if (!beginAction("password")) return;
    setUpdatingPassword(true);

    try {
      const response = await authApi.updatePassword(passwordForm);

      if (!mountedRef.current) return;

      toast.success(
        getSuccessMessage(response, "Password updated successfully")
      );
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      if (mountedRef.current) {
        toast.error(getErrorMessage(error, "Failed updating password"));
      }
    } finally {
      endAction("password");
      if (mountedRef.current) setUpdatingPassword(false);
    }
  };

  const handleRedeemToken = async (event) => {
    event.preventDefault();

    const code = tokenCode.trim();

    if (!code) {
      toast.error("Please enter a token code");
      return;
    }

    if (!beginAction("redeem")) return;
    setRedeeming(true);

    try {
      const response = await subscriptionsApi.redeemAccessToken(code);

      if (!mountedRef.current) return;

      toast.success(getSuccessMessage(response, "Access token redeemed!"));
      setTokenCode("");
      await loadProfileData();
      router.push(getTipsPathForProduct(response?.accessToken?.product?.slug));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(getErrorMessage(error, "Invalid or expired token"));
      }
    } finally {
      endAction("redeem");
      if (mountedRef.current) setRedeeming(false);
    }
  };

  const handleVerifyToken = async (event) => {
    event.preventDefault();

    const code = verifyCodeInput.trim();

    if (!code) {
      toast.error("Please enter a token code");
      return;
    }

    if (!beginAction("verify")) return;

    const requestId = ++verificationRequestRef.current;
    setVerifying(true);
    setVerificationResult(null);

    try {
      const response = await subscriptionsApi.verifyAccessToken(code);

      if (
        !mountedRef.current ||
        requestId !== verificationRequestRef.current
      ) {
        return;
      }

      // Do not infer validity when the API omits an explicit valid flag.
      const valid =
        typeof response?.valid === "boolean" ? response.valid : null;

      setVerificationResult({
        valid,
        message: getSuccessMessage(
          response,
          valid === true
            ? "The API reports that this token is valid."
            : valid === false
              ? "This token is invalid or unavailable."
              : "Verification completed. The response did not include an explicit validity status."
        ),
      });
    } catch (error) {
      if (
        mountedRef.current &&
        requestId === verificationRequestRef.current
      ) {
        setVerificationResult({
          valid: null,
          message: getErrorMessage(
            error,
            "Unable to verify this token. Please try again."
          ),
          failed: true,
        });
      }
    } finally {
      endAction("verify");

      if (mountedRef.current) {
        setVerifying(false);
      }
    }
  };

  const closeVerificationModal = () => {
    verificationRequestRef.current += 1;
    setVerifyModalOpen(false);
    setVerificationResult(null);
  };

  const handleSubscriptionAction = async (subId, action) => {
    if (subId === null || subId === undefined || subId === "") return;

    if (
      action === "cancel" &&
      !window.confirm(
        "Are you sure you want to cancel this active subscription access?"
      )
    ) {
      return;
    }

    if (!beginAction("subscription")) return;
    setSubscriptionAction({ id: subId, action });

    try {
      const response =
        action === "cancel"
          ? await subscriptionsApi.cancelSubscription(subId)
          : await subscriptionsApi.renewSubscription(subId);

      if (!mountedRef.current) return;

      toast.success(
        getSuccessMessage(
          response,
          action === "cancel"
            ? "Subscription cancelled"
            : "Subscription renewed!"
        )
      );

      await loadProfileData();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          getErrorMessage(
            error,
            action === "cancel"
              ? "Failed cancelling subscription"
              : "Failed renewing subscription"
          )
        );
      }
    } finally {
      endAction("subscription");
      if (mountedRef.current) setSubscriptionAction(null);
    }
  };

  const handleAvatarSelection = (event) => {
    const file = event.target.files?.[0] ?? null;

    if (file && file.type && !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      setAvatarFile(null);
      return;
    }

    setAvatarFile(file);
  };

  const handleAvatarUpload = async (event) => {
    event.preventDefault();

    if (!avatarFile) {
      toast.error("Please select an image file");
      return;
    }

    if (!beginAction("avatar")) return;
    setUploadingAvatar(true);

    try {
      const response = await authApi.updateAvatar(avatarFile);

      if (!mountedRef.current) return;

      toast.success(
        getSuccessMessage(response, "Avatar updated successfully")
      );

      if (response?.result?.avatarUrl) {
        auth.setUser({ ...user, avatarUrl: response.result.avatarUrl });
        setUser((previous) =>
          previous
            ? { ...previous, avatarUrl: response.result.avatarUrl }
            : previous
        );
      }

      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      if (mountedRef.current) {
        toast.error(getErrorMessage(error, "Failed uploading avatar"));
      }
    } finally {
      endAction("avatar");
      if (mountedRef.current) setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <p role="status" className="sr-only">
          Loading your profile…
        </p>
        <div
          aria-hidden="true"
          className="h-64 rounded-2xl border border-dark-border bg-dark-card motion-safe:animate-pulse"
        />
      </div>
    );
  }

  if (profileError || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className={`${panelStyles} space-y-4 text-center`}>
          <XCircle
            className="mx-auto h-10 w-10 text-rose-400"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold text-slate-100">
            Unable to Load Profile
          </h1>
          <p role="alert" className="text-sm leading-6 text-slate-400">
            {profileError || "Your profile information is unavailable."}
          </p>
          <button
            type="button"
            onClick={loadProfileData}
            disabled={refreshing}
            className={`${buttonStyles} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {refreshing ? "Loading…" : "Try Again"}
          </button>
        </section>
      </div>
    );
  }

  const displayName = user.username || user.email || "Your Profile";
  const initial = String(displayName).charAt(0).toUpperCase();
  const activeSubId = activeSub?.id ?? activeSub?._id;
  const hasActiveSubId =
    activeSubId !== null &&
    activeSubId !== undefined &&
    activeSubId !== "";

  const activeStatus = normalizeStatus(activeSub?.status);
  const subscriptionBusy = Boolean(subscriptionAction) || refreshing;

  const verificationClasses =
    verificationResult?.valid === true
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : verificationResult?.valid === false || verificationResult?.failed
        ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
        : "border-amber-500/20 bg-amber-500/10 text-amber-300";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Profile header */}
      <header
        className={`${panelStyles} flex flex-col justify-between gap-6 shadow-xl lg:flex-row lg:items-center`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-2xl font-bold text-slate-950">
            {user.avatarUrl && !avatarFailed ? (
              <img
                src={user.avatarUrl}
                alt=""
                width={64}
                height={64}
                onError={() => setAvatarFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-black text-slate-100 sm:text-2xl">
                {displayName}
              </h1>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                {user.role || "USER"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400 [overflow-wrap:anywhere]">
              {user.email}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAvatarUpload}
          aria-label="Upload profile avatar"
          className="flex min-w-0 flex-col gap-3"
        >
          <label
            htmlFor="profile-avatar"
            className="text-xs font-semibold text-slate-400"
          >
            Profile image
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              id="profile-avatar"
              type="file"
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={handleAvatarSelection}
              className={`min-w-0 max-w-full rounded-lg text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-dark-bg file:px-3 file:py-3 file:text-xs file:font-semibold file:text-slate-200 sm:w-64 ${focusStyles}`}
            />
            <button
              type="submit"
              disabled={uploadingAvatar || !avatarFile}
              className={`${buttonStyles} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploadingAvatar ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </header>

      {/* Profile data status */}
      <div role="status" aria-live="polite" className="text-xs text-slate-400">
        {refreshing ? "Refreshing account information…" : ""}
      </div>

      {failedSections.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <p className="text-sm leading-6 text-amber-300">
            Could not load: {failedSections.join(", ")}.
          </p>
          <button
            type="button"
            onClick={loadProfileData}
            disabled={refreshing}
            className={`${buttonStyles} mt-2 text-amber-300 hover:bg-amber-500/10`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Membership and token operations */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className={`${panelStyles} space-y-4`}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
            <ShieldCheck
              className="h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            Active Subscriptions &amp; Access
          </h2>

          {failedSections.includes("Active subscription") ? (
            <p className="text-sm leading-6 text-slate-400">
              Subscription information is currently unavailable.
            </p>
          ) : activeSub ? (
            <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-dark-bg p-4">
              <dl className="space-y-3 text-sm">
                <DetailRow
                  label="Plan tier"
                  value={
                    activeSub.product?.name ||
                    activeSub.tier ||
                    "Subscription"
                  }
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <dt className="text-slate-400">Status</dt>
                  <dd
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusClasses(activeStatus)}`}
                  >
                    {activeStatus}
                  </dd>
                </div>
                <DetailRow
                  label="Expires on"
                  value={safeFormatDate(
                    activeSub.expiresAt || activeSub.endDate
                  )}
                />
              </dl>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={subscriptionBusy || !hasActiveSubId}
                  onClick={() =>
                    handleSubscriptionAction(activeSubId, "cancel")
                  }
                  className={`${buttonStyles} border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20`}
                >
                  {subscriptionAction?.action === "cancel"
                    ? "Cancelling…"
                    : "Cancel Access"}
                </button>
                <button
                  type="button"
                  disabled={subscriptionBusy || !hasActiveSubId}
                  onClick={() =>
                    handleSubscriptionAction(activeSubId, "renew")
                  }
                  className={`${buttonStyles} border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
                >
                  {subscriptionAction?.id === activeSubId &&
                  subscriptionAction?.action === "renew"
                    ? "Renewing…"
                    : "Renew Plan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-dark-border bg-dark-bg p-4 text-center">
              <p className="text-sm text-slate-300">
                No active paid subscription found.
              </p>
              <p className="text-xs leading-6 text-slate-400">
                Redeem an access token to unlock premium selections.
              </p>
            </div>
          )}
        </section>

        <section className={`${panelStyles} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
              <KeyRound
                className="h-5 w-5 text-amber-400"
                aria-hidden="true"
              />
              Token Code Operations
            </h2>
            <button
              type="button"
              onClick={() => {
                setVerificationResult(null);
                setVerifyModalOpen(true);
              }}
              className={`${buttonStyles} px-2 text-amber-400 hover:bg-amber-500/10`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Verify Code
            </button>
          </div>

          <form onSubmit={handleRedeemToken} className="space-y-3">
            <label
              htmlFor="redeem-token"
              className="block text-xs font-semibold text-slate-400"
            >
              Access token code
            </label>
            <input
              id="redeem-token"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              value={tokenCode}
              disabled={redeeming}
              onChange={(event) => setTokenCode(event.target.value)}
              placeholder="e.g. VIP-TOK-9921"
              className={`${inputStyles} font-mono`}
            />
            <button
              type="submit"
              disabled={redeeming || !tokenCode.trim()}
              className={`${buttonStyles} w-full bg-amber-500 text-slate-950 hover:bg-amber-400`}
            >
              {redeeming ? "Redeeming…" : "Activate Access Code"}
            </button>
          </form>
        </section>
      </div>

      {/* Password update */}
      <section className={`${panelStyles} space-y-5`}>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
          <Lock className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          Security &amp; Password Update
        </h2>

        <form
          onSubmit={handlePasswordUpdate}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="current-password"
              className="block text-xs font-semibold text-slate-400"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              disabled={updatingPassword}
              value={passwordForm.oldPassword}
              onChange={(event) =>
                setPasswordForm((previous) => ({
                  ...previous,
                  oldPassword: event.target.value,
                }))
              }
              className={inputStyles}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-slate-400"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              disabled={updatingPassword}
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((previous) => ({
                  ...previous,
                  newPassword: event.target.value,
                }))
              }
              className={inputStyles}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className={`${buttonStyles} bg-indigo-600 text-white hover:bg-indigo-500`}
            >
              {updatingPassword ? "Updating Password…" : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      {/* Subscription history */}
      <section className={`${panelStyles} space-y-4`}>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
          <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
          Access History
        </h2>

        {failedSections.includes("Access history") ? (
          <p className="text-sm text-slate-400">
            Access history is currently unavailable.
          </p>
        ) : subHistory.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-dark-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Subscription history and renewal actions
              </caption>
              <thead className="border-b border-dark-border bg-dark-bg text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Product / Tier</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Started</th>
                  <th scope="col" className="px-4 py-3">Expires</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-slate-300">
                {subHistory.map((sub, index) => {
                  const subId = sub.id ?? sub._id;
                  const status = normalizeStatus(sub.status);
                  const hasId =
                    subId !== null && subId !== undefined && subId !== "";

                  return (
                    <tr key={subId ?? `subscription-${index}`}>
                      <th
                        scope="row"
                        className="px-4 py-3 font-semibold text-slate-100"
                      >
                        {sub.product?.name || sub.tier || "Subscription"}
                      </th>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-lg border px-2 py-1 text-[11px] font-bold ${getStatusClasses(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {safeFormatDate(sub.startDate || sub.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {safeFormatDate(sub.expiresAt || sub.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {status === "EXPIRED" && hasId ? (
                          <button
                            type="button"
                            disabled={subscriptionBusy}
                            onClick={() =>
                              handleSubscriptionAction(subId, "renew")
                            }
                            className={`${buttonStyles} border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
                          >
                            {subscriptionAction?.id === subId &&
                            subscriptionAction?.action === "renew"
                              ? "Renewing…"
                              : "Renew"}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No prior subscription history recorded.
          </p>
        )}
      </section>

      {/* Token verification */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={closeVerificationModal}
        title="Verify Access Token Code"
      >
        <form onSubmit={handleVerifyToken} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="verify-token"
              className="block text-sm font-semibold text-slate-400"
            >
              Token code
            </label>
            <input
              id="verify-token"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              disabled={verifying}
              placeholder="e.g. VIP-8842-X99"
              value={verifyCodeInput}
              onChange={(event) => {
                setVerifyCodeInput(event.target.value);
                setVerificationResult(null);
              }}
              className={`${inputStyles} font-mono`}
            />
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Verification checks the code without redeeming it.
          </p>

          {verificationResult && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-4 text-sm leading-6 ${verificationClasses}`}
            >
              {verificationResult.message}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || !verifyCodeInput.trim()}
            className={`${buttonStyles} w-full bg-amber-500 text-slate-950 hover:bg-amber-400`}
          >
            {verifying ? "Checking…" : "Verify Token Status"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-slate-200">
        {value}
      </dd>
    </div>
  );
}
