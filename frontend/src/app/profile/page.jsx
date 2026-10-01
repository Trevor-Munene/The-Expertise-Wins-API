// frontend/src/app/profile/page.jsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../api/auth.api";
import { subscriptionsApi } from "../../api/subscriptions.api";
import { productsApi } from "../../api/products.api";
import { auth } from "../../lib/auth";
import { formatDate } from "../../lib/utils";
import toast from "react-hot-toast";
import { User, Lock, KeyRound, ShieldCheck, Upload, LogOut, CheckCircle2, Clock, XCircle, RefreshCw, Eye, ShieldAlert } from "lucide-react";
import Modal from "../../components/Modal";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [myAccess, setMyAccess] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password update form
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Token redemption form
  const [tokenCode, setTokenCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Token verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!auth.getToken()) {
      router.push("/login");
      return;
    }

    try {
      const [meRes, activeSubRes, historyRes, accessRes, productsRes] = await Promise.allSettled([
        authApi.me(),
        subscriptionsApi.getActiveSubscription(),
        subscriptionsApi.getSubscriptionHistory(),
        subscriptionsApi.getMyAccess(),
        productsApi.getMyProducts(),
      ]);

      if (meRes.status === "fulfilled") setUser(meRes.value);
      if (activeSubRes.status === "fulfilled") setActiveSub(activeSubRes.value?.subscription || activeSubRes.value);
      if (historyRes.status === "fulfilled") {
        const hData = historyRes.value?.subscriptions || historyRes.value || [];
        setSubHistory(Array.isArray(hData) ? hData : []);
      }
      if (accessRes.status === "fulfilled") setMyAccess(accessRes.value?.access || accessRes.value);
      if (productsRes.status === "fulfilled") {
        const pData = productsRes.value?.products || productsRes.value || [];
        setMyProducts(Array.isArray(pData) ? pData : []);
      }
    } catch (err) {
      console.error("Error loading user profile", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("Both old and new password are required");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await authApi.updatePassword(passwordForm);
      toast.success(res.message || "Password updated successfully");
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed updating password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleRedeemToken = async (e) => {
    e.preventDefault();
    if (!tokenCode.trim()) {
      toast.error("Please enter a token code");
      return;
    }

    setRedeeming(true);
    try {
      const res = await subscriptionsApi.redeemAccessToken(tokenCode.trim());
      toast.success(res.message || "Access Token Redeemed!");
      setTokenCode("");
      loadProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setRedeeming(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;

    setVerifying(true);
    try {
      const res = await subscriptionsApi.verifyAccessToken(verifyCodeInput.trim());
      setVerificationResult(res);
      toast.success("Token verification completed!");
    } catch (err) {
      setVerificationResult({ valid: false, message: err.response?.data?.message || "Invalid token code" });
      toast.error("Token verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!confirm("Are you sure you want to cancel this active subscription access?")) return;
    try {
      const res = await subscriptionsApi.cancelSubscription(subId);
      toast.success(res.message || "Subscription cancelled");
      loadProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed cancelling subscription");
    }
  };

  const handleRenewSubscription = async (subId) => {
    try {
      const res = await subscriptionsApi.renewSubscription(subId);
      toast.success(res.message || "Subscription renewed!");
      loadProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed renewing subscription");
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await authApi.updateAvatar(avatarFile);
      toast.success(res.message || "Avatar updated successfully");
      if (res.result?.avatarUrl) {
        setUser((prev) => ({ ...prev, avatarUrl: res.result.avatarUrl }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 bg-dark-card border border-dark-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* User Profile Header */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-gradient text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-cyan-500/20 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.username || user?.email || "U")[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100">{user?.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {user?.role || "USER"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Avatar Upload */}
        <form onSubmit={handleAvatarUpload} className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="w-full min-w-0 text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-dark-bg file:text-slate-200 hover:file:bg-dark-hover cursor-pointer sm:w-64"
          />
          <button
            type="submit"
            disabled={uploadingAvatar || !avatarFile}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-gradient hover:opacity-90 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
          >
            {uploadingAvatar ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Grid: Active Membership & Token Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Active Membership Status */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Active Subscriptions & Access
            </h3>
          </div>

          {activeSub ? (
            <div className="bg-dark-bg border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Plan Tier:</span>
                <span className="font-bold text-cyan-400 uppercase">{activeSub.product?.name || activeSub.tier || "VIP Pass"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Expires On:</span>
                <span className="font-medium text-slate-200">{formatDate(activeSub.expiresAt || activeSub.endDate)}</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleCancelSubscription(activeSub.id)}
                  className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                >
                  Cancel Access
                </button>
                <button
                  onClick={() => handleRenewSubscription(activeSub.id)}
                  className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
                >
                  Renew Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg border border-dark-border rounded-xl p-4 text-center space-y-2">
              <p className="text-slate-400 text-xs">No active paid subscription found.</p>
              <p className="text-[11px] text-slate-400">Redeem an access token code below to unlock VIP predictions.</p>
            </div>
          )}
        </div>

        {/* Redeem & Verify Access Token */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Token Code Operations
            </h3>

            <button
              onClick={() => setVerifyModalOpen(true)}
              className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              Verify Code
            </button>
          </div>

          <form onSubmit={handleRedeemToken} className="space-y-3">
            <input
              type="text"
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value)}
              placeholder="e.g. VIP-TOK-9921"
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={redeeming}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {redeeming ? "Redeeming..." : "Activate Access Code"}
            </button>
          </form>
        </div>
      </div>

      {/* Password Update Form */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" />
          Security & Password Update
        </h3>

        <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-dark-bg border border-dark-border rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-dark-bg border border-dark-border rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {updatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription History Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Access History
        </h3>

        {subHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-bg text-slate-400 uppercase text-[10px] tracking-wider border-b border-dark-border">
                <tr>
                  <th className="px-4 py-3">Product / Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-slate-300">
                {subHistory.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-slate-100">{sub.product?.name || sub.tier || "VIP Pass"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-dark-bg text-cyan-400 border border-dark-border">
                        {sub.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(sub.createdAt || sub.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(sub.expiresAt || sub.endDate)}</td>
                    <td className="px-4 py-3 text-right">
                      {sub.status === "EXPIRED" && (
                        <button
                          onClick={() => handleRenewSubscription(sub.id)}
                          className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[11px] font-semibold hover:bg-cyan-500/20"
                        >
                          Renew
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-xs">No prior subscription history recorded.</p>
        )}
      </div>

      {/* Verify Token Modal */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title="Verify Access Token Code">
        <form onSubmit={handleVerifyToken} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Enter Token Code to Test</label>
            <input
              type="text"
              required
              placeholder="e.g. VIP-8842-X99"
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-xl text-slate-100 font-mono"
            />
          </div>

          {verificationResult && (
            <div className={`p-3 rounded-xl border text-xs ${verificationResult.valid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
              {verificationResult.valid ? "Token Code is Valid & Available!" : verificationResult.message || "Invalid or used token"}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
          >
            {verifying ? "Checking..." : "Verify Token Status"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
