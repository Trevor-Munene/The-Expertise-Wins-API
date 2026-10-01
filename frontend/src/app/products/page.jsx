// frontend/src/app/products/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  KeyRound,
  Send,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

import { productsApi } from "../../api/products.api";
import { subscriptionsApi } from "../../api/subscriptions.api";
import { auth } from "../../lib/auth";
import Modal from "../../components/Modal";

const initialTokenCode = "";

const defaultTiers = [
  {
    id: "free",
    name: "Public Free Channel",
    price: "$0",
    period: "Free Access",
    description:
      "Football tips remain free for the community, with daily selections and transparent performance tracking.",
    features: [
      "6+ Free Football Tips Daily",
      "Transparent Performance Tracking",
      "Public Community Access",
      "Premium Sports & Markets Available Separately",
    ],
    icon: Trophy,
    badge: "Public Access",
    accent: "emerald",
    popular: false,
  },
  {
    id: "vip",
    name: "PIKK BETTER VIP GROUP",
    price: "$60",
    period: "Monthly Access",
    description:
      "Premium daily betting tips across sports and markets beyond the free football coverage, with curated selections and reasons.",
    features: [
      "🔥 Premium Daily Betting Tips",
      "📊 Curated Selections with Reasons",
      "🎯 Multiple Sports & Markets",
      "🌍 Regional African-market pricing",
    ],
    regionalPricing: [
      "55 EUR",
      "60 USD",
      "40,000 NGN",
      "350 GHS",
      "2,000 KSH",
    ],
    shortTerm: "2 Weeks — 1,200 KSH",
    lifetime: "$500 Lifetime Access",
    icon: Zap,
    badge: "Premium VIP",
    accent: "emerald",
    popular: true,
  },
  {
    id: "maxbet",
    name: "PIKK MAXBET VIP GROUP",
    price: "$120",
    period: "Monthly Access",
    description:
      "Our highest-tier selections with stronger curation, detailed reasoning, and premium MaxBet opportunities.",
    features: [
      "💎 Highest-Tier Selections",
      "🔥 Strongest Curation with Reasons",
      "🎯 Premium MaxBet Opportunities",
      "🌍 Regional African-market pricing",
    ],
    regionalPricing: [
      "100 EUR",
      "120 USD",
      "70,000 NGN",
      "600 GHS",
      "3,500 KSH",
    ],
    shortTerm: "2 Weeks — 2,000 KSH",
    lifetime: "$1,000 Lifetime Access",
    icon: Sparkles,
    badge: "MaxBet Platinum",
    accent: "amber",
    popular: false,
  },
];

function getProductList(response) {
  const data = response?.products ?? response?.data ?? response ?? [];
  return Array.isArray(data) ? data : [];
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [tokenCode, setTokenCode] = useState(initialTokenCode);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const response = await productsApi.getProducts();

        if (mounted) {
          setProducts(getProductList(response));
          setCatalogLoaded(true);
        }
      } catch (error) {
        console.error("Failed loading products", error);
        toast.error("Unable to load membership information.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const openRedeemModal = () => {
    setTokenCode("");
    setRedeemModalOpen(true);
  };

  const closeRedeemModal = () => {
    if (redeeming) return;

    setRedeemModalOpen(false);
    setTokenCode("");
  };

  const handleRedeem = async (event) => {
    event.preventDefault();

    const code = tokenCode.trim();

    if (!code) {
      toast.error("Please enter your access token code.");
      return;
    }

    if (!auth.getToken()) {
      toast.error("Please sign in first to redeem an access token.");
      return;
    }

    setRedeeming(true);

    try {
      const response = await subscriptionsApi.redeemAccessToken(code);

      toast.success(
        response?.message || "Access token redeemed successfully!"
      );

      setTokenCode("");
      setRedeemModalOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Invalid or expired access token."
      );
    } finally {
      setRedeeming(false);
    }
  };

  const productsBySlug = Object.fromEntries(
    products.map((product) => [product.slug, product])
  );
  const visibleTiers = catalogLoaded
    ? defaultTiers
        .filter((tier) => productsBySlug[tier.id])
        .map((tier) => ({
          ...tier,
          name: productsBySlug[tier.id].name || tier.name,
          description:
            productsBySlug[tier.id].description || tier.description,
        }))
    : defaultTiers;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <header className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Crown
            className="w-4 h-4 text-amber-400"
            aria-hidden="true"
          />
          <span>African-market-first access</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
            Community Access & Premium Membership
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Football tips remain free for the community. Premium membership
            gives you access to our broader sports and market curation,
            with dedicated pricing for different regions.
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl px-5 py-4 max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-400">
              Regional pricing is intentional.
            </span>{" "}
            The African-market prices shown below are dedicated access prices
            for our community — they are{" "}
            <span className="font-semibold text-slate-100">
              not currency-conversion equivalents
            </span>{" "}
            of the USD or EUR prices.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={openRedeemModal}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            <span>Redeem Access Token</span>
          </button>

          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>DM @PikkBetter for Access</span>
          </a>
        </div>
      </header>

      {/* Pricing Cards */}
      <section aria-labelledby="membership-tiers-heading">
        <h2 id="membership-tiers-heading" className="sr-only">
          Membership tiers
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[520px] rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : visibleTiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visibleTiers.map((tier) => {
              const Icon = tier.icon;
              const isPopular = tier.popular;
              const isMaxBet = tier.id === "maxbet";

              return (
                <article
                  key={tier.id}
                  className={`bg-slate-900 rounded-2xl p-7 flex flex-col justify-between relative transition-all duration-200 ${
                    isPopular
                      ? "border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 md:scale-105"
                      : "border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-slate-950 font-extrabold text-[11px] uppercase tracking-widest rounded-full shadow-md whitespace-nowrap">
                      Most Popular Tier
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Tier Identity */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <Icon
                          className={`w-6 h-6 ${
                            tier.accent === "amber"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                          aria-hidden="true"
                        />
                      </div>

                      <span
                        className={`text-xs font-bold uppercase tracking-wider text-right ${
                          tier.accent === "amber"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-xl font-black text-slate-100">
                        {tier.name}
                      </h3>

                      <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    {/* Main Price */}
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        International / Base Price
                      </div>

                      <div className="text-2xl font-black text-slate-100 mt-1">
                        {tier.price}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        {tier.period}
                      </div>
                    </div>

                    {/* Regional Pricing */}
                    {tier.regionalPricing && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                        <div>
                          <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                            African-market pricing
                          </p>

                          <p className="text-[10px] text-slate-500 mt-1">
                            Dedicated regional access prices — not
                            exchange-rate equivalents.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {tier.regionalPricing.map((price) => (
                            <div
                              key={price}
                              className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200"
                            >
                              {price}
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-emerald-500/10">
                          <p className="text-xs font-bold text-amber-400">
                            {tier.shortTerm}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    <ul className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-slate-300 font-medium leading-normal"
                        >
                          <Check
                            className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Lifetime */}
                    {tier.lifetime && (
                      <div className="text-xs font-bold text-amber-400">
                        {tier.lifetime}
                      </div>
                    )}

                    {tier.id !== "free" && (
                      <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2.5 text-[10px] text-slate-500 leading-relaxed">
                        Pricing varies by market. Regional prices are offered
                        intentionally to make access more practical for our
                        African community.
                      </div>
                    )}
                  </div>

                  {/* Card Footer / CTA */}
                  <div className="pt-8 mt-2 border-t border-slate-800 space-y-4">
                    {tier.id === "free" ? (
                      <>
                        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                            Start with the free tips, follow the results, and
                            see the work for yourself. When you&apos;re ready
                            for more coverage, step into VIP.
                          </p>
                        </div>

                        <Link
                          href="/tips"
                          className="w-full py-3 block text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                          Browse Free Tips
                        </Link>
                      </>
                    ) : (
                      <>
                        <div
                          className={`rounded-xl px-4 py-3 border ${
                            isMaxBet
                              ? "bg-amber-500/5 border-amber-500/10"
                              : "bg-emerald-500/5 border-emerald-500/10"
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                            {isMaxBet
                              ? "Looking for the highest level of curation? MaxBet brings our strongest selections and premium opportunities together."
                              : "Ready to go beyond the free channel? Join VIP for more sports, more markets, and more curated selections."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={openRedeemModal}
                          className={`w-full py-3 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md focus:outline-none focus-visible:ring-2 ${
                            isMaxBet
                              ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/10 focus-visible:ring-amber-500"
                              : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10 focus-visible:ring-emerald-500"
                          }`}
                        >
                          Join {isMaxBet ? "MaxBet" : "VIP"} Access
                        </button>

                        <a
                          href="https://t.me/pikkbetter"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 block text-center rounded-xl bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                          DM @PikkBetter on Telegram
                        </a>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-400" role="status">
            Membership options are not currently available.
          </p>
        )}
      </section>

      {/* Community Support */}
      <section className="bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 max-w-4xl mx-auto shadow-xl">
        <div
          className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <Crown className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-slate-100">
          👑 I COME TO HELP & SERVE MY PEOPLE
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Need a regional payment arrangement, manual addition, or direct
          support? Contact Admin @PikkBetter on Telegram. African-market
          pricing is intentionally structured to make the service more
          accessible to the community.
        </p>

        <div className="pt-1">
          <a
            href="https://t.me/pikkbetter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>DM ADMIN @PikkBetter FOR ACCESS</span>
          </a>
        </div>
      </section>

      {/* Token Redemption Modal */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={closeRedeemModal}
        title="Redeem VIP Access Token"
      >
        <form onSubmit={handleRedeem} className="space-y-5">
          <p className="text-slate-400 text-xs leading-relaxed">
            Enter the access token provided by Admin @PikkBetter after your
            membership has been confirmed.
          </p>

          <div>
            <label
              htmlFor="access-token"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Access Token Code
            </label>

            <div className="relative">
              <input
                id="access-token"
                name="accessToken"
                type="text"
                required
                autoComplete="off"
                disabled={redeeming}
                value={tokenCode}
                onChange={(event) => setTokenCode(event.target.value)}
                placeholder="e.g. VIP-8842-X99"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-60 pl-10"
              />

              <KeyRound
                className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={redeeming}
            aria-busy={redeeming}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {redeeming ? "Verifying & Redeeming..." : "Redeem Token Now"}
          </button>
        </form>
      </Modal>
    </main>
  );
}