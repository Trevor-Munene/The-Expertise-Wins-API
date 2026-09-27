// frontend/src/app/admin/tokens/page.jsx
"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../api/admin.api";
import { productsApi } from "../../../api/products.api";
import { formatDate } from "../../../lib/utils";
import toast from "react-hot-toast";
import { KeyRound, Plus, Copy, ShieldAlert, Clock, CheckCircle } from "lucide-react";
import Modal from "../../../components/Modal";

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Token Modal
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [singleForm, setSingleForm] = useState({
    productId: "",
    durationDays: 30,
    note: "",
  });

  // Bulk Tokens Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    productId: "",
    count: 5,
    durationDays: 30,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokenRes, prodRes] = await Promise.allSettled([
        adminApi.getAccessTokens(),
        productsApi.getProducts(),
      ]);

      if (tokenRes.status === "fulfilled") {
        const tList = tokenRes.value?.tokens || tokenRes.value?.data || tokenRes.value || [];
        setTokens(Array.isArray(tList) ? tList : []);
      }
      if (prodRes.status === "fulfilled") {
        const pList = prodRes.value?.products || prodRes.value?.data || prodRes.value || [];
        setProducts(Array.isArray(pList) ? pList : []);
      }
    } catch {
      toast.error("Failed loading tokens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSingle = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createAccessToken(singleForm);
      toast.success(res.message || "Access token created!");
      setSingleModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed creating token");
    }
  };

  const handleCreateBulk = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createAccessTokensBulk(bulkForm);
      toast.success(res.message || `Generated ${bulkForm.count} tokens!`);
      setBulkModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed generating bulk tokens");
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm("Are you sure you want to revoke this access token?")) return;
    try {
      await adminApi.revokeAccessToken(id);
      toast.success("Token revoked");
      loadData();
    } catch {
      toast.error("Failed revoking token");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Token code copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
            VIP Access Token Management
          </h1>
          <p className="text-slate-400 text-xs">Generate single or bulk access codes for client subscription redemption.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSingleModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Single Token</span>
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Bulk Tokens</span>
          </button>
        </div>
      </div>

      {/* Token List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading access tokens...</div>
        ) : tokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Token Code</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {tokens.map((tok) => (
                  <tr key={tok.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400 flex items-center gap-2">
                      <span>{tok.tokenCode || tok.code}</span>
                      <button
                        onClick={() => copyCode(tok.tokenCode || tok.code)}
                        className="p-1 hover:text-white text-slate-400"
                        title="Copy Code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      {tok.product?.name || "VIP Product"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{tok.durationDays || 30} Days</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tok.isUsed
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : tok.isRevoked
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {tok.isUsed ? "USED" : tok.isRevoked ? "REVOKED" : "AVAILABLE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(tok.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!tok.isUsed && !tok.isRevoked && (
                        <button
                          onClick={() => handleRevoke(tok.id)}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[11px] font-semibold hover:bg-rose-500/20"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No tokens generated yet.</div>
        )}
      </div>

      {/* Single Token Modal */}
      <Modal isOpen={singleModalOpen} onClose={() => setSingleModalOpen(false)} title="Issue Single Access Token">
        <form onSubmit={handleCreateSingle} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Product Target *</label>
            <select
              required
              value={singleForm.productId}
              onChange={(e) => setSingleForm({ ...singleForm, productId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            >
              <option value="">Select Product Tier...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Duration (Days)</label>
            <input
              type="number"
              value={singleForm.durationDays}
              onChange={(e) => setSingleForm({ ...singleForm, durationDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
          >
            Generate Token Code
          </button>
        </form>
      </Modal>

      {/* Bulk Tokens Modal */}
      <Modal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Generate Access Tokens">
        <form onSubmit={handleCreateBulk} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Product Target *</label>
            <select
              required
              value={bulkForm.productId}
              onChange={(e) => setBulkForm({ ...bulkForm, productId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            >
              <option value="">Select Product Tier...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Quantity (Count)</label>
              <input
                type="number"
                value={bulkForm.count}
                onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Duration (Days)</label>
              <input
                type="number"
                value={bulkForm.durationDays}
                onChange={(e) => setBulkForm({ ...bulkForm, durationDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
          >
            Generate Bulk Tokens Now
          </button>
        </form>
      </Modal>
    </div>
  );
}
