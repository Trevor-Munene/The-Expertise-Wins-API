import apiClient from "../lib/axios";

export const adminApi = {
  // List users with optional status, role and pagination filters
  async getUsers(params = {}) {
    const { data } = await apiClient.get("/admin/users", { params });
    return data;
  },

  // Get a single user with their access tokens
  async getUserById(id) {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },

  // Update a user's details
  async updateUser(id, payload) {
    const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
    return data;
  },

  // Update a user's status
  async updateUserStatus(id, status) {
    const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
    return data;
  },

  // Create a tip
  async createTip(payload) {
    const { data } = await apiClient.post("/admin/tips", payload);
    return data;
  },

  // List tips with optional status, outcome, sport, source and pagination filters
  async getTips(params = {}) {
    const { data } = await apiClient.get("/admin/tips", { params });
    return data;
  },

  // Get a single tip with its publications
  async getTipById(id) {
    const { data } = await apiClient.get(`/admin/tips/${id}`);
    return data;
  },

  // Update a tip
  async updateTip(id, payload) {
    const { data } = await apiClient.patch(`/admin/tips/${id}`, payload);
    return data;
  },

  // Soft delete a tip by cancelling it
  async deleteTip(id) {
    const { data } = await apiClient.delete(`/admin/tips/${id}`);
    return data;
  },

  // Update many tips, expecting a payload of { ids, data }
  async updateTipsBulk(payload) {
    const { data } = await apiClient.patch("/admin/tips/bulk", payload);
    return data;
  },

  // Publish many tips
  async publishTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/publish", { ids: tipIds });
    return data;
  },

  // Unpublish many tips
  async unpublishTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/unpublish", { ids: tipIds });
    return data;
  },

  // Settle many tips, accepting either ids or tipIds in the payload
  async settleTipsBulk(payload) {
    const { tipIds, ...settlement } = payload;
    const { data } = await apiClient.post("/admin/tips/bulk/settle", {
      ...settlement,
      ids: settlement.ids ?? tipIds,
    });
    return data;
  },

  // Cancel many tips
  async cancelTipsBulk(tipIds) {
    const { data } = await apiClient.post("/admin/tips/bulk/cancel", { ids: tipIds });
    return data;
  },

  // Publish a single tip
  async publishTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/publish`);
    return data;
  },

  // Unpublish a single tip
  async unpublishTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/unpublish`);
    return data;
  },

  // Settle a single tip, expecting a payload of { outcome, result }
  async settleTip(id, payload) {
    const { data } = await apiClient.post(`/admin/tips/${id}/settle`, payload);
    return data;
  },

  // Cancel a single tip
  async cancelTip(id) {
    const { data } = await apiClient.post(`/admin/tips/${id}/cancel`);
    return data;
  },

  // Publish a tip to a product
  async publishTipToProduct(id, productId) {
    const { data } = await apiClient.post(`/admin/tips/${id}/publications`, { productId });
    return data;
  },

  // Remove a tip publication from a product
  async removeTipPublication(id, productId) {
    const { data } = await apiClient.delete(`/admin/tips/${id}/publications/${productId}`);
    return data;
  },

  // Create a single access token
  async createAccessToken(payload) {
    const { data } = await apiClient.post("/admin/subscription-tokens", payload);
    return data;
  },

  // Create many access tokens, expecting a payload of { productId, count, expiresAt, notes }
  async createAccessTokensBulk(payload) {
    const { data } = await apiClient.post("/admin/subscription-tokens/bulk", payload);
    return data;
  },

  // List access tokens with optional product, status, user and pagination filters
  async getAccessTokens(params = {}) {
    const { data } = await apiClient.get("/admin/subscription-tokens", { params });
    return data;
  },

  // Get a single access token
  async getAccessTokenById(id) {
    const { data } = await apiClient.get(`/admin/subscription-tokens/${id}`);
    return data;
  },

  // Update an access token
  async updateAccessToken(id, payload) {
    const { data } = await apiClient.patch(`/admin/subscription-tokens/${id}`, payload);
    return data;
  },

  // Revoke an access token while preserving its audit record
  async revokeAccessToken(id) {
    const { data } = await apiClient.post(`/admin/subscription-tokens/${id}/revoke`);
    return data;
  },

  // Permanently delete an access token
  async deleteAccessToken(id) {
    const { data } = await apiClient.delete(`/admin/subscription-tokens/${id}`);
    return data;
  },

  // Extend an access token, expecting a payload of { days }
  async extendAccessToken(id, payload) {
    const { data } = await apiClient.post(`/admin/subscription-tokens/${id}/extend`, payload);
    return data;
  },

  // Create a product
  async createProduct(payload) {
    const { data } = await apiClient.post("/admin/products", payload);
    return data;
  },

  // List products with optional type and status filters
  async getProducts(params = {}) {
    const { data } = await apiClient.get("/admin/products", { params });
    return data;
  },

  // Get a single product with token and publication counts
  async getProductById(id) {
    const { data } = await apiClient.get(`/admin/products/${id}`);
    return data;
  },

  // Update a product
  async updateProduct(id, payload) {
    const { data } = await apiClient.patch(`/admin/products/${id}`, payload);
    return data;
  },

  // Update a product's status
  async updateProductStatus(id, status) {
    const { data } = await apiClient.patch(`/admin/products/${id}/status`, { status });
    return data;
  },
};