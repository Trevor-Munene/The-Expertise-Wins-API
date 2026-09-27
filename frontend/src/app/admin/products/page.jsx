// frontend/src/app/admin/products/page.jsx
"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../api/admin.api";
import toast from "react-hot-toast";
import { Package, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import Modal from "../../../components/Modal";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    interval: "MONTHLY",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts();
      const list = res?.products || res?.data || res || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createProduct(form);
      toast.success("Product created successfully");
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error("Failed creating product");
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await adminApi.updateProductStatus(product.id, newStatus);
      toast.success(`Product updated to ${newStatus}`);
      loadProducts();
    } catch {
      toast.error("Failed updating product status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Products & Subscription Tiers
          </h1>
          <p className="text-slate-400 text-xs">Manage public and VIP product offerings.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-slate-400 text-xs">Loading products...</div>
        ) : products.length > 0 ? (
          products.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                  {p.slug || "TIER"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {p.status || "ACTIVE"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-100 text-lg">{p.name}</h3>
                <p className="text-slate-400 text-xs mt-1">{p.description}</p>
              </div>

              <div className="text-2xl font-black text-slate-100">${p.price || "0.00"}</div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {p.status === "ACTIVE" ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 p-8 text-center text-slate-400 text-xs">No custom products created yet.</div>
        )}
      </div>

      {/* Create Product Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Product Tier">
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="MaxBet Platinum VIP"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Slug Code</label>
            <input
              type="text"
              placeholder="maxbet-vip"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Price ($USD)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
          >
            Save Product Tier
          </button>
        </form>
      </Modal>
    </div>
  );
}
