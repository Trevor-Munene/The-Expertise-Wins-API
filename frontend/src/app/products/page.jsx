// frontend/src/app/products/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  KeyRound,
  RefreshCw,
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

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const buttonStyles = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusStyles}`;

const telegramUrl = "https://t.me/pikkbetter";

// Read the supported catalog response shapes.
function getProductList(response) {
  const candidates = [
    response?.products,
    response?.data,
    response,
  ];

  const data = candidates.find(Array.isArray);

  // Do not treat an unexpected response as a confirmed empty catalog.
  if (!data) {
    throw new Error("Unexpected product catalog response");
  }

  return data.filter(
    (product) => product && typeof product === "object"
  );
}

function getMessage(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);

  const mountedRef = useRef(false);
  const redeemingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setCatalogError("");
      setCatalogLoaded(false);
      setProducts([]);

      try {
        const response = await productsApi.getProducts();
        const catalog = getProductList(response);

        if (cancelled) return;

        setProducts(catalog);
        setCatalogLoaded(true);
      } catch {
        if (cancelled) return;

        setCatalogError(
          "The live membership catalog could not be loaded. The standard membership information is shown below; confirm current availability and pricing with Admin before paying."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const openRedeemModal = () => {
    if (redeemingRef.current) return;

    setTokenCode("");
    setSignInRequired(!auth.getToken());
    setRedeemModalOpen(true);
  };

  const closeRedeemModal = () => {
    if (redeemingRef.current) return;

    setRedeemModalOpen(false);
    setTokenCode("");
    setSignInRequired(false);
  };

  const handleRedeem = async (event) => {
    event.preventDefault();

    if (redeemingRef.current) return;

    const code = tokenCode.trim();

    if (!code) {
      toast.error("Please enter your access token code.");
      return;
    }

    if (!auth.getToken()) {
      setSignInRequired(true);
      toast.error("Please sign in first to redeem an access token.");
      return;
    }

    redeemingRef.current = true;
    setRedeeming(true);
    setSignInRequired(false);

    try {
      const response = await subscriptionsApi.redeemAccessToken(code);

      if (!mountedRef.current) return;

      toast.success(
        getMessage(
          response?.message,
          "Access token redeemed successfully!"
        )
      );

      setTokenCode("");
      setRedeemModalOpen(false);
    } catch (error) {
      if (!mountedRef.current) return;

      if (error?.response?.status === 401) {
        setSignInRequired(true);
      }

      toast.error(
        getMessage(
          error?.response?.data?.message,
          "Unable to redeem this token. It may be invalid or expired."
        )
      );
    } finally {
      redeemingRef.current = false;

      if (mountedRef.current) {
        setRedeeming(false);
      }
    }
  };

  const productsBySlug = new Map(
    products
      .filter((product) => typeof product.slug === "string")
      .map((product) => [product.slug, product])
  );

  // Keep the existing known-tier filtering and static price configuration.
  const visibleTiers = catalogLoaded
    ? defaultTiers
        .filter((tier) => productsBySlug.has(tier.id))
        .map((tier) => {
          const product = productsBySlug.get(tier.id);

          return {
            ...tier,
            name: product.name || tier.name,
            description: product.description || tier.description,
          };
        })
    : defaultTiers;

  return (
    <main
      aria-labelledby="products-heading"
      className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:space-y-12 sm:px-6 lg:px-8"
    >
      {/* Page header */}
      <header className="mx-auto max-w-3xl space-y-5 text-center">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Crown
            className="h-4 w-4 shrink-0 text-amber-400"
            aria-hidden="true"
          />
          <span>African-market-first access</span>
        </div>

        <div className="space-y-4">
          <h1
            id="products-heading"
            className="text-3xl font-black leading-tight tracking-tight text-slate-100 sm:text-5xl"
          >
            Community Access &amp; Premium Membership
          </h1>

          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            Football tips remain free for the community. Premium membership
            gives you access to our broader sports and market curation,
            with dedicated pricing for different regions.
          </p>
        </div>

        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-slate-900 px-5 py-4">
          <p className="text-sm leading-6 text-slate-300">
            <span className="font-bold text-emerald-400">
              Regional pricing is intentional.
            </span>{" "}
            The African-market prices shown below are dedicated access
            prices for our community — they are{" "}
            <span className="font-semibold text-slate-100">
              not currency-conversion equivalents
            </span>{" "}
            of the USD or EUR prices.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={openRedeemModal}
            disabled={redeeming}
            className={`${buttonStyles} bg-amber-500 text-slate-950 hover:bg-amber-400`}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Redeem Access Token
          </button>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles} border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            DM @PikkBetter for Access
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </header>

      {/* Catalog availability */}
      {!loading && catalogError && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
        >
          <p className="text-sm leading-6 text-amber-300">
            {catalogError}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
            className={`${buttonStyles} border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry Catalog
          </button>
        </div>
      )}

      {/* Membership cards */}
      <section
        aria-labelledby="membership-tiers-heading"
        aria-busy={loading}
      >
        <h2 id="membership-tiers-heading" className="sr-only">
          Membership tiers
        </h2>

        {loading ? (
          <>
            <p role="status" className="sr-only">
              Loading membership options…
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  aria-hidden="true"
                  className="h-[520px] rounded-2xl border border-slate-800 bg-slate-900 motion-safe:animate-pulse"
                />
              ))}
            </div>
          </>
        ) : visibleTiers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleTiers.map((tier) => {
              const Icon = tier.icon;
              const isMaxBet = tier.id === "maxbet";
              const isFree = tier.id === "free";
              const accentText =
                tier.accent === "amber"
                  ? "text-amber-400"
                  : "text-emerald-400";

              return (
                <article
                  key={tier.id}
                  aria-labelledby={`${tier.id}-heading`}
                  className={`flex min-w-0 flex-col rounded-2xl border bg-slate-900 p-5 sm:p-6 ${
                    tier.popular
                      ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
                      : "border-slate-800"
                  }`}
                >
                  <div className="space-y-6">
                    {/* Tier identity */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <Icon
                          className={`h-6 w-6 ${accentText}`}
                          aria-hidden="true"
                        />
                      </div>

                      <span
                        className={`text-right text-xs font-bold uppercase tracking-wider ${accentText}`}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    <div>
                      {tier.popular && (
                        <p className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Most Popular Tier
                        </p>
                      )}

                      <h3
                        id={`${tier.id}-heading`}
                        className="break-words text-xl font-black leading-7 text-slate-100"
                      >
                        {tier.name}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {tier.description}
                      </p>
                    </div>

                    {/* Base pricing */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {isFree
                          ? "Public Access"
                          : "International / Base Price"}
                      </p>

                      <p className="mt-2 text-3xl font-black text-slate-100 tabular-nums">
                        {tier.price}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {tier.period}
                      </p>
                    </div>

                    {/* Regional pricing */}
                    {tier.regionalPricing && (
                      <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Pricing by market
                          </h4>
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            International and dedicated African-market
                            prices — not exchange-rate equivalents.
                          </p>
                        </div>

                        <ul className="grid grid-cols-2 gap-2">
                          {tier.regionalPricing.map((price) => (
                            <li
                              key={price}
                              className="break-words rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs font-bold leading-5 text-slate-200 tabular-nums"
                            >
                              {price}
                            </li>
                          ))}
                        </ul>

                        <p className="border-t border-emerald-500/10 pt-3 text-xs font-bold leading-5 text-amber-400">
                          {tier.shortTerm}
                        </p>
                      </div>
                    )}

                    {/* Included features */}
                    <ul
                      aria-label={`${tier.name} features`}
                      className="space-y-3 border-t border-slate-800 pt-4"
                    >
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                        >
                          <Check
                            className="mt-1 h-4 w-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 break-words">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {tier.lifetime && (
                      <p className="text-sm font-bold text-amber-400">
                        {tier.lifetime}
                      </p>
                    )}

                    {!isFree && (
                      <p className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-400">
                        Pricing varies by market. Confirm your applicable
                        price and payment arrangements with Admin before
                        paying.
                      </p>
                    )}
                  </div>

                  {/* Membership actions */}
                  <div className="mt-auto pt-6">
                    <div className="space-y-4 border-t border-slate-800 pt-6">
                      <p
                        className={`rounded-xl border px-4 py-3 text-sm leading-6 text-slate-300 ${
                          isMaxBet
                            ? "border-amber-500/10 bg-amber-500/5"
                            : "border-emerald-500/10 bg-emerald-500/5"
                        }`}
                      >
                        {isFree
                          ? "Start with the free tips, follow the results, and see the work for yourself. When you're ready for more coverage, step into VIP."
                          : isMaxBet
                            ? "Looking for the highest level of curation? MaxBet brings our strongest selections and premium opportunities together."
                            : "Ready to go beyond the free channel? Join VIP for more sports, more markets, and more curated selections."}
                      </p>

                      {isFree ? (
                        <Link
                          href="/tips"
                          className={`${buttonStyles} w-full bg-slate-800 text-slate-200 hover:bg-slate-700`}
                        >
                          Browse Free Tips
                        </Link>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={openRedeemModal}
                            disabled={redeeming}
                            className={`${buttonStyles} w-full text-slate-950 ${
                              isMaxBet
                                ? "bg-amber-500 hover:bg-amber-400"
                                : "bg-emerald-500 hover:bg-emerald-400"
                            }`}
                          >
                            <KeyRound
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            Redeem Access Token
                          </button>

                          <a
                            href={telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${buttonStyles} w-full border border-slate-800 bg-slate-950 text-sky-300 hover:bg-slate-800`}
                          >
                            Contact Admin to Join
                            <span className="sr-only">
                              {" "}
                              (opens in a new tab)
                            </span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p role="status" className="text-sm leading-6 text-slate-400">
              Membership options are not currently available.
            </p>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles} mt-4 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
            >
              Contact Admin
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        )}
      </section>

      {/* Community support */}
      <section
        aria-labelledby="community-support-heading"
        className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-xl sm:p-8"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <Crown className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2
          id="community-support-heading"
          className="text-xl font-bold text-slate-100"
        >
          I COME TO HELP &amp; SERVE MY PEOPLE
        </h2>

        <p className="mx-auto max-w-xl text-sm leading-7 text-slate-300">
          Need a regional payment arrangement, manual addition, or direct
          support? Contact Admin @PikkBetter on Telegram. African-market
          pricing is intentionally structured to make the service more
          accessible to the community.
        </p>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonStyles} bg-sky-500 text-slate-950 hover:bg-sky-400`}
        >
          <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
          DM ADMIN @PikkBetter FOR ACCESS
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>

      {/* Token redemption modal */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={closeRedeemModal}
        title="Redeem Access Token"
      >
        <form onSubmit={handleRedeem} className="space-y-5">
          <p className="text-sm leading-6 text-slate-400">
            Enter the access token provided by Admin @PikkBetter after
            your membership has been confirmed. The token determines
            your access level.
          </p>

          {signInRequired && (
            <div
              role="status"
              className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <p className="text-sm leading-6 text-amber-300">
                Sign in to your account before redeeming a token.
              </p>
              <Link
                href="/login"
                className={`${buttonStyles} bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="access-token"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
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
                spellCheck={false}
                disabled={redeeming}
                value={tokenCode}
                onChange={(event) => setTokenCode(event.target.value)}
                placeholder="e.g. VIP-8842-X99"
                className={`min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-60 ${focusStyles}`}
              />

              <KeyRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400"
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={redeeming || !tokenCode.trim()}
            aria-busy={redeeming}
            className={`${buttonStyles} w-full bg-amber-500 text-slate-950 hover:bg-amber-400`}
          >
            {redeeming ? "Redeeming…" : "Redeem Token Now"}
          </button>
        </form>
      </Modal>
    </main>
  );
}