// frontend/src/app/products/page.jsx
"use client";

import { useEffect, useState } from "react";
import { productsApi } from "../../api/products.api";
import { subscriptionsApi } from "../../api/subscriptions.api";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";
import { Check, Shield, Zap, Sparkles, KeyRound, Trophy, Send, Crown, Flame, BarChart2, Target } from "lucide-react";
import Modal from "../../components/Modal";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await productsApi.getProducts();
        const data = res?.products || res?.data || res || [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed loading products", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!tokenCode.trim()) {
      toast.error("Please enter a valid token code");
      return;
    }

    if (!auth.getToken()) {
      toast.error("Please sign in first to redeem an access token");
      return;
    }

    setRedeeming(true);
    try {
      const res = await subscriptionsApi.redeemAccessToken(tokenCode.trim());
      toast.success(res.message || "Access Token Redeemed Successfully!");
      setTokenCode("");
      setRedeemModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired access token.");
    } finally {
      setRedeeming(false);
    }
  };

  const defaultTiers = [
    {
      id: "free",
      name: "Public Free Channel",
      price: "$0 / Free",
      description: "Public daily tips normalized for standard markets.",
      features: [
        "1-3 Daily Public Tips",
        "Transparent Performance Tracking",
        "Public Telegram Channel Access",
      ],
      icon: Trophy,
      badge: "Public Access",
      color: "emerald",
      popular: false,
    },
    {
      id: "vip",
      name: "❇️ PIKK BETTER VIP GROUP ❇️",
      price: "60 USD / 2,000 KSH",
      period: "Monthly Access",
      description: "🔥 Premium Daily Betting Tips with Curated Selections & Detailed Reasons.",
      features: [
        "🔥 Premium Daily Betting Tips",
        "📊 Curated Selections with Reasons",
        "🎯 Multiple Sports & Markets",
        "💳 2 Weeks Access: 1,200 KSH",
        "🗓️ Monthly: 55 EUR | 60 USD | 40,000 NGN | 350 GHS | 2,000 KSH",
        "♾️ Lifetime Access: $500 USD",
      ],
      icon: Zap,
      badge: "❇️ Premium VIP",
      color: "purple",
      popular: true,
      lifetimePrice: "$500 Lifetime",
    },
    {
      id: "maxbet",
      name: "🥇 PIKK MAXBET VIP GROUP 🥇",
      price: "120 USD / 3,500 KSH",
      period: "Monthly Access",
      description: "💎 Our Highest-Tier & Best Selections with Strongest Curation & Premium Maxbet Opportunities.",
      features: [
        "💎 Our Highest-Tier & Best Selections",
        "🔥 Strongest Curation with Reasons",
        "🎯 Premium Maxbet Opportunities",
        "💳 2 Weeks Access: 2,000 KSH",
        "🗓️ Monthly: 100 EUR | 120 USD | 70,000 NGN | 600 GHS | 3,500 KSH",
        "♾️ Lifetime Access: $1,000 USD",
      ],
      icon: Sparkles,
      badge: "🥇 MaxBet Platinum",
      color: "amber",
      popular: false,
      lifetimePrice: "$1,000 Lifetime",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>I Come To Help & Serve My People</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          PIKK BETTER VIP Membership Tiers
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Unlock high-confidence daily tips, curated reasons, and maximum yield selections. Redeem your token code or contact us directly on Telegram.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setRedeemModalOpen(true)}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Redeem Access Token Code</span>
          </button>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>DM for VIP Addition @PIKKBETTER</span>
          </a>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {defaultTiers.map((tier) => {
          const Icon = tier.icon;
          const isPopular = tier.popular;
          return (
            <div
              key={tier.id}
              className={`bg-slate-900 rounded-2xl p-7 flex flex-col justify-between relative transition-all ${
                isPopular
                  ? "border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 md:scale-105"
                  : "border border-slate-800 hover:border-slate-700"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-[11px] uppercase tracking-widest rounded-full shadow-md">
                  Most Popular Tier
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <Icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{tier.badge}</span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-100">{tier.name}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{tier.description}</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Monthly Rate</div>
                  <div className="text-2xl font-black text-slate-100">{tier.price}</div>
                  {tier.lifetimePrice && (
                    <div className="text-xs font-bold text-amber-400 pt-1">
                      Lifetime Option: {tier.lifetimePrice}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 font-medium leading-normal">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 space-y-2">
                {tier.id === "free" ? (
                  <Link
                    href="/tips"
                    className="w-full py-3 block text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                  >
                    Browse Free Tips
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setRedeemModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                    >
                      Redeem Access Code
                    </button>
                    <a
                      href="https://t.me/pikkbetter"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 block text-center rounded-xl bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 text-[11px] font-semibold transition-colors"
                    >
                      Contact @PIKKBETTER on Telegram
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Telegram Addition Notice Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center space-y-3 max-w-4xl mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto font-bold">
          <Crown className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">👑 I COME TO HELP & SERVE MY PEOPLE</h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
          Need custom multi-currency payment, manual addition, or direct operator support? Send a direct message to our official Telegram contact.
        </p>
        <div className="pt-2">
          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
          >
            <Send className="w-4 h-4" />
            <span>📩 DM FOR VIP ADDITION @PIKKBETTER 📍</span>
          </a>
        </div>
      </div>

      {/* Modal for Token Redemption */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        title="Redeem VIP Access Token"
      >
        <form onSubmit={handleRedeem} className="space-y-4">
          <p className="text-slate-400 text-xs leading-relaxed">
            Enter your access token code provided by @PIKKBETTER to activate your VIP or MaxBet membership.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Access Token Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={tokenCode}
                onChange={(e) => setTokenCode(e.target.value)}
                placeholder="e.g. VIP-8842-X99"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500 pl-10"
              />
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={redeeming}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {redeeming ? "Verifying & Redeeming..." : "Redeem Token Now"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
