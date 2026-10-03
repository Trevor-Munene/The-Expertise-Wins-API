// frontend/src/app/admin/products/page.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Edit,
  Package,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../../api/admin.api";
import Modal from "../../../components/Modal";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  type: "VIP",
  isPublic: false,
};

const inputClassName =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadProducts = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getProducts();

      const list =
        response?.products ??
        response?.data ??
        response ??
        [];

      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed loading products", error);
      toast.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setForm(initialForm);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(initialForm);
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) {
      toast.error("A URL-friendly product slug is required");
      return;
    }

    setSaving(true);

    try {
      await adminApi.createProduct({
        ...form,
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
      });

      toast.success("Product created successfully");

      setModalOpen(false);
      setForm(initialForm);

      await loadProducts();
    } catch (error) {
      console.error("Failed creating product", error);
      toast.error("Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus =
      product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setUpdatingId(product.id);

    try {
      await adminApi.updateProductStatus(product.id, newStatus);

      toast.success(
        `${product.name} is now ${newStatus.toLowerCase()}`
      );

      await loadProducts();
    } catch (error) {
      console.error("Failed updating product status", error);
      toast.error("Failed to update product status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-400" />

            <h1 className="text-2xl font-black text-slate-100">
              Products & Subscription Tiers
            </h1>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Manage the products and subscription tiers available through
            The Expertise Wins.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Plus className="h-4 w-4" />
          New Product
        </button>
      </div>

      {/* Products */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-xs text-slate-400">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-600" />

          <h2 className="mt-3 text-sm font-bold text-slate-300">
            No products yet
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Create your first product or subscription tier to get started.
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const isActive = product.status === "ACTIVE";
            const isUpdating = updatingId === product.id;

            return (
              <article
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-colors hover:border-slate-700"
              >
                <div className="space-y-5">
                  {/* Product Meta */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate rounded border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {product.slug || "TIER"}
                    </span>

                    <span
                      className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {product.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">
                      {product.name}
                    </h2>

                    {product.description && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded border border-slate-700 px-2 py-1">{product.type}</span>
                    <span className="rounded border border-slate-700 px-2 py-1">{product.isPublic ? "Public" : "Access controlled"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(product)}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 text-slate-400" />
                        Activate
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled
                    title="Product editing will be available here"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Create New Product Tier"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label
              htmlFor="product-name"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Product Name *
            </label>

            <input
              id="product-name"
              type="text"
              required
              placeholder="MaxBet Platinum VIP"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="product-slug"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Slug
            </label>

            <input
              id="product-slug"
              type="text"
              placeholder="maxbet-vip"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slug: event.target.value,
                }))
              }
              className={inputClassName}
            />

            <p className="mt-1 text-[11px] text-slate-600">
              Use a short, URL-friendly identifier.
            </p>
          </div>

          <div>
            <div>
              <label
                htmlFor="product-type"
                className="mb-1.5 block text-xs font-semibold text-slate-400"
              >
                Product Type *
              </label>

              <select
                id="product-type"
                required
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className={inputClassName}
              >
                <option value="FREE">Free</option>
                <option value="VIP">VIP</option>
                <option value="MAXBET">MaxBet</option>
                <option value="API">API</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
              className="h-4 w-4 accent-emerald-500"
            />
            Make this product publicly accessible
          </label>

          <div>
            <label
              htmlFor="product-description"
              className="mb-1.5 block text-xs font-semibold text-slate-400"
            >
              Description
            </label>

            <textarea
              id="product-description"
              rows={3}
              placeholder="Describe what this product provides..."
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${inputClassName} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}