// frontend/src/app/admin/tokens/page.jsx
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Copy,
  KeyRound,
  Plus,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../../api/admin.api";
import { productsApi } from "../../../api/products.api";
import { formatDate } from "../../../lib/utils";
import Modal from "../../../components/Modal";

const initialSingleForm = {
  productId: "",
  durationDays: 30,
  note: "",
};

const initialBulkForm = {
  productId: "",
  count: 5,
  durationDays: 30,
};

const inputClassName =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20";

function getList(response, key) {
  const list =
    response?.[key] ??
    response?.data ??
    response ??
    [];

  return Array.isArray(list) ? list : [];
}

function getTokenStatus(token) {
  if (token.isUsed) {
    return {
      label: "USED",
      className:
        "border-slate-700 bg-slate-800 text-slate-400",
      icon: CheckCircle,
    };
  }

  if (token.isRevoked) {
    return {
      label: "REVOKED",
      className:
        "border-rose-500/20 bg-rose-500/10 text-rose-400",
      icon: ShieldAlert,
    };
  }

  return {
    label: "AVAILABLE",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    icon: Clock,
  };
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const [singleForm, setSingleForm] = useState(initialSingleForm);
  const [bulkForm, setBulkForm] = useState(initialBulkForm);

  const [creatingSingle, setCreatingSingle] = useState(false);
  const [creatingBulk, setCreatingBulk] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const loadData = async () => {
    setLoading(true);

    const [tokenResult, productResult] = await Promise.allSettled([
      adminApi.getAccessTokens(),
      productsApi.getProducts(),
    ]);

    if (tokenResult.status === "fulfilled") {
      setTokens(getList(tokenResult.value, "tokens"));
    } else {
      console.error("Failed loading access tokens", tokenResult.reason);
      toast.error("Failed to load access tokens");
    }

    if (productResult.status === "fulfilled") {
      setProducts(getList(productResult.value, "products"));
    } else {
      console.error("Failed loading products", productResult.reason);
      toast.error("Failed to load products");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSingleModal = () => {
    setSingleForm(initialSingleForm);
    setSingleModalOpen(true);
  };

  const closeSingleModal = () => {
    if (creatingSingle) return;

    setSingleModalOpen(false);
    setSingleForm(initialSingleForm);
  };

  const openBulkModal = () => {
    setBulkForm(initialBulkForm);
    setBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    if (creatingBulk) return;

    setBulkModalOpen(false);
    setBulkForm(initialBulkForm);
  };

  const handleCreateSingle = async (event) => {
    event.preventDefault();

    const durationDays = Number(singleForm.durationDays);

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      toast.error("Duration must be at least 1 day");
      return;
    }

    setCreatingSingle(true);

    try {
      const response = await adminApi.createAccessToken({
        ...singleForm,
        durationDays,
        note: singleForm.note.trim(),
      });

      toast.success(
        response?.message || "Access token created successfully"
      );

      closeSingleModal();
      await loadData();
    } catch (error) {
      console.error("Failed creating access token", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to create access token"
      );
    } finally {
      setCreatingSingle(false);
    }
  };

  const handleCreateBulk = async (event) => {
    event.preventDefault();

    const count = Number(bulkForm.count);
    const durationDays = Number(bulkForm.durationDays);

    if (!Number.isInteger(count) || count < 1) {
      toast.error("Token quantity must be at least 1");
      return;
    }

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      toast.error("Duration must be at least 1 day");
      return;
    }

    setCreatingBulk(true);

    try {
      const response = await adminApi.createAccessTokensBulk({
        ...bulkForm,
        count,
        durationDays,
      });

      toast.success(
        response?.message || `Generated ${count} access tokens`
      );

      closeBulkModal();
      await loadData();
    } catch (error) {
      console.error("Failed generating access tokens", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to generate access tokens"
      );
    } finally {
      setCreatingBulk(false);
    }
  };

  const handleRevoke = async (token) => {
    const code = token.tokenCode || token.code;

    const confirmed = window.confirm(
      `Revoke access token ${code}?\n\nThis action cannot be used to redeem the token again.`
    );

    if (!confirmed) return;

    setRevokingId(token.id);

    try {
      await adminApi.revokeAccessToken(token.id);

      toast.success("Access token revoked");
      await loadData();
    } catch (error) {
      console.error("Failed revoking access token", error);
      toast.error("Failed to revoke access token");
    } finally {
      setRevokingId(null);
    }
  };

  const copyCode = async (code) => {
    if (!code) {
      toast.error("Token code is unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      toast.success("Token code copied");
    } catch (error) {
      console.error("Failed copying token code", error);
      toast.error("Could not copy token code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-amber-400" />

            <h1 className="text-2xl font-black text-slate-100">
              VIP Access Tokens
            </h1>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Generate, distribute, and revoke subscription access codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openSingleModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <Plus className="h-4 w-4" />
            Single Token
          </button>

          <button
            type="button"
            onClick={openBulkModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
          >
            <Plus className="h-4 w-4" />
            Bulk Tokens
          </button>
        </div>
      </div>

      {/* Token Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Loading access tokens...
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-10 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-slate-600" />

            <h2 className="mt-3 text-sm font-bold text-slate-300">
              No access tokens yet
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Generate a token after confirming a customer&apos;s access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Token Code
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Product
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Validity
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {tokens.map((token) => {
                  const code = token.tokenCode || token.code;
                  const status = getTokenStatus(token);
                  const StatusIcon = status.icon;
                  const canRevoke =
                    !token.isUsed && !token.isRevoked;
                  const isRevoking = revokingId === token.id;

                  return (
                    <tr
                      key={token.id}
                      className="transition-colors hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-amber-400">
                            {code || "—"}
                          </code>

                          {code && (
                            <button
                              type="button"
                              onClick={() => copyCode(code)}
                              aria-label={`Copy token ${code}`}
                              title="Copy token code"
                              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-slate-600"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-200">
                        {token.product?.name || "VIP Product"}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {token.durationDays
                          ? `${token.durationDays} days`
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${status.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {token.createdAt
                          ? formatDate(token.createdAt)
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {canRevoke && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(token)}
                            disabled={isRevoking}
                            className="rounded border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRevoking ? "Revoking..." : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Token Modal */}
      <Modal
        isOpen={singleModalOpen}
        onClose={closeSingleModal}
        title="Issue Single Access Token"
      >
        <form
          onSubmit={handleCreateSingle}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="single-product"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Product *
            </label>

            <select
              id="single-product"
              required
              value={singleForm.productId}
              onChange={(event) =>
                setSingleForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
              className={inputClassName}
            >
              <option value="">Select Product Tier...</option>

              {products
                .filter((product) => product.status !== "INACTIVE")
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — ${product.price}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="single-duration"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Duration (Days)
            </label>

            <input
              id="single-duration"
              type="number"
              min="1"
              step="1"
              required
              value={singleForm.durationDays}
              onChange={(event) =>
                setSingleForm((current) => ({
                  ...current,
                  durationDays: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="single-note"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Internal Note
            </label>

            <textarea
              id="single-note"
              rows={2}
              placeholder="Optional payment/customer reference..."
              value={singleForm.note}
              onChange={(event) =>
                setSingleForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              className={`${inputClassName} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeSingleModal}
              disabled={creatingSingle}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creatingSingle}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingSingle
                ? "Generating..."
                : "Generate Token"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Token Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={closeBulkModal}
        title="Bulk Generate Access Tokens"
      >
        <form
          onSubmit={handleCreateBulk}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="bulk-product"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Product *
            </label>

            <select
              id="bulk-product"
              required
              value={bulkForm.productId}
              onChange={(event) =>
                setBulkForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
              className={inputClassName}
            >
              <option value="">Select Product Tier...</option>

              {products
                .filter((product) => product.status !== "INACTIVE")
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — ${product.price}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="bulk-count"
                className="mb-1.5 block text-xs font-semibold text-slate-400"
              >
                Quantity
              </label>

              <input
                id="bulk-count"
                type="number"
                min="1"
                max="1000"
                step="1"
                required
                value={bulkForm.count}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    count: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="bulk-duration"
                className="mb-1.5 block text-xs font-semibold text-slate-400"
              >
                Duration (Days)
              </label>

              <input
                id="bulk-duration"
                type="number"
                min="1"
                step="1"
                required
                value={bulkForm.durationDays}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    durationDays: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-400">
            Bulk generation creates independent access codes.
            Keep the generated codes secure and distribute them only
            to the intended customers.
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeBulkModal}
              disabled={creatingBulk}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creatingBulk}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingBulk
                ? "Generating..."
                : "Generate Tokens"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}