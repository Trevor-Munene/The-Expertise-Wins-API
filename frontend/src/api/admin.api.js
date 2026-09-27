// frontend/src/api/admin.api.js
import apiClient from "../lib/axios";

export const adminApi = {
  // Users
  async getUsers(params = {}) {
    const { data } = await apiClient.get("/admin/users", { params });
    return data;
  },

  async getUserById(id) {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },

  async updateUser(id, payload) {
    const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
    return data;
  },

  async updateUserStatus(id, status) {
    const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
    return data;
  },

  // Tips Management
  async createTip(payload) {
    const { data } = await apiClient.post("/admin/tips", payload);
    return data;
  },

  async getTips(params = {}) {
    const { data } = await apiClient.get("/admin/tips", { params });
    return data;
  },

  async getTipById(id) {
    const { data } = await apiClient.get(`/admin/tips/${id}`);
    return data;
  },

  async updateTip(id, payload) {
    const { data } = await apiClient.patch(`/admin/tips/${id}`, payload);
    return data;
  },

  async deleteTip(id) {
    const { data } = await apiClient.delete(`/admin/tips/${id}`);
    return data;
  },

  // Bulk Tip Operations
  async updateTipsBulk(payload) {
    const { data } = await apiClient.patch("/admin/tips/bulk", payload);
    return data;
  },

  async publishTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/publish", { tipIds });
    return data;
  },

  async unpublishTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/unpublish", { tipIds });
    return data;
  },

  async settleTipsBulk(payload) {
    const { data } = await apiClient.post("/admin/tips/bulk/settle", payload);
    return data;
  },

  async cancelTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/cancel", { tipIds });
    return data;
  },

  // Single Tip Actions
  async publishTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/publish`);
    return data;
  },

  async unpublishTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/unpublish`);
    return data;
  },

  async settleTip(id, payload) {
    const { data } = await apiClient.post(`/admin/tips/${id}/settle`, payload);
    return data;
  },

  async cancelTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/cancel`);
    return data;
  },

  // Tip Publications
  async publishTipToProduct(id, productId) {
    const { data } = await apiClient.post(`/admin/tips/${id}/publications`, { productId });
    return data;
  },

  async removeTipPublication(id, productId) {
    const { data } = await apiClient.delete(`/admin/tips/${id}/publications/${productId}`);
    return data;
  },

  // Access Tokens
  async createAccessToken(payload) {
    const { data } = await apiClient.post("/admin/subscription-tokens", payload);
    return data;
  },

  async createAccessTokensBulk(payload) {
    const { data } = await apiClient.post("/admin/subscription-tokens/bulk", payload);
    return data;
  },

  async getAccessTokens(params = {}) {
    const { data } = await apiClient.get("/admin/subscription-tokens", { params });
    return data;
  },

  async getAccessTokenById(id) {
    const { data } = await apiClient.get(`/admin/subscription-tokens/${id}`);
    return data;
  },

  async updateAccessToken(id, payload) {
    const { data } = await apiClient.patch(`/admin/subscription-tokens/${id}`, payload);
    return data;
  },

  async revokeAccessToken(id) {
    const { data } = await apiClient.post(`/admin/subscription-tokens/${id}/revoke`);
    return data;
  },

  async extendAccessToken(id, payload) {
    const { data } = await apiClient.post(`/admin/subscription-tokens/${id}/extend`, payload);
    return data;
  },

  // Products
  async createProduct(payload) {
    const { data } = await apiClient.post("/admin/products", payload);
    return data;
  },

  async getProducts() {
    const { data } = await apiClient.get("/admin/products");
    return data;
  },

  async getProductById(id) {
    const { data } = await apiClient.get(`/admin/products/${id}`);
    return data;
  },

  async updateProduct(id, payload) {
    const { data } = await apiClient.patch(`/admin/products/${id}`, payload);
    return data;
  },

  async updateProductStatus(id, status) {
    const { data } = await apiClient.patch(`/admin/products/${id}/status`, { status });
    return data;
  },
};
