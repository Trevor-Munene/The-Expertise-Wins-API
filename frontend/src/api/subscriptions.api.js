import apiClient from "../lib/axios";

export const subscriptionsApi = {
  // List all subscriptions for the current user
  async getMySubscriptions() {
    const { data } = await apiClient.get("/subscriptions");
    return data;
  },

  // Get the current user's active subscription
  async getActiveSubscription() {
    const { data } = await apiClient.get("/subscriptions/active");
    return data;
  },

  // Get the current user's subscription history
  async getSubscriptionHistory() {
    const { data } = await apiClient.get("/subscriptions/history");
    return data;
  },

  // Redeem an access token
  async redeemAccessToken(tokenCode) {
    const { data } = await apiClient.post("/subscriptions/redeem", { token: tokenCode });
    return data;
  },

  // Check whether an access token is valid and return the access details
  async verifyAccessToken(tokenCode) {
    const { data } = await apiClient.post("/subscriptions/verify", { token: tokenCode });
    return data?.access ?? data;
  },

  // List products the current user can access
  async getMyAccess() {
    const { data } = await apiClient.get("/subscriptions/my-access");
    return data;
  },

  // Cancel a subscription
  async cancelSubscription(id) {
    const { data } = await apiClient.post(`/subscriptions/${id}/cancel`);
    return data;
  },

  // Renew a subscription, expecting a payload of { days }
  async renewSubscription(id, payload = {}) {
    const { data } = await apiClient.post(`/subscriptions/${id}/renew`, payload);
    return data;
  },

  // Get a single subscription
  async getSubscriptionById(id) {
    const { data } = await apiClient.get(`/subscriptions/${id}`);
    return data;
  },
};