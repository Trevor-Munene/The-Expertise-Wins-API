// frontend/src/app/profile/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../api/auth.api";
import { subscriptionsApi } from "../../api/subscriptions.api";
import { auth } from "../../lib/auth";
import { formatDate } from "../../lib/utils";
import toast from "react-hot-toast";
import { User, Lock, KeyRound, ShieldCheck, Upload, LogOut, CheckCircle2, Clock } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password update form
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Token redemption form
  const [tokenCode, setTokenCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!auth.getToken()) {
        router.push("/login");
        return;
      }

      try {
        const [meRes, activeSubRes, historyRes] = await Promise.allSettled([
          authApi.me(),
          subscriptionsApi.getActiveSubscription(),
          subscriptionsApi.getSubscriptionHistory(),
        ]);

        if (meRes.status === "fulfilled") {
          setUser(meRes.value);
        }
        if (activeSubRes.status === "fulfilled") {
          setActiveSub(activeSubRes.value?.subscription || activeSubRes.value);
        }
        if (historyRes.status === "fulfilled") {
          const hData = historyRes.value?.subscriptions || historyRes.value || [];
          setSubHistory(Array.isArray(hData) ? hData : []);
        }
      } catch (err) {
        console.error("Error loading user profile", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

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
      toast.success(res.message || "Token redeemed!");
      setTokenCode("");
      
      // refresh active sub
      const activeRes = await subscriptionsApi.getActiveSubscription();
      setActiveSub(activeRes?.subscription || activeRes);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setRedeeming(false);
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
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* User Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-500/20">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              (user?.username || user?.email || "U")[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100">{user?.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {user?.role || "USER"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Avatar Upload */}
        <form onSubmit={handleAvatarUpload} className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
          />
          <button
            type="submit"
            disabled={uploadingAvatar || !avatarFile}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
          >
            {uploadingAvatar ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Grid: Active Membership & Token Redemption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Active Membership Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Active Subscription & Access
          </h3>

          {activeSub ? (
            <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-emerald-400 uppercase">{activeSub.product?.name || activeSub.tier || "VIP Pass"}</span>
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
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
              <p className="text-slate-400 text-xs">No active paid subscription found.</p>
              <p className="text-[11px] text-slate-400">Redeem an access token code below to unlock VIP predictions.</p>
            </div>
          )}
        </div>

        {/* Redeem Access Token */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Redeem Access Token Code
          </h3>

          <form onSubmit={handleRedeemToken} className="space-y-3">
            <input
              type="text"
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value)}
              placeholder="e.g. VIP-TOK-9921"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500"
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
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
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Access History
        </h3>

        {subHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Product / Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3 rounded-r-lg">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {subHistory.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-slate-100">{sub.product?.name || sub.tier || "VIP Pass"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {sub.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(sub.createdAt || sub.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(sub.expiresAt || sub.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-xs">No prior subscription history recorded.</p>
        )}
      </div>
    </div>
  );
}
