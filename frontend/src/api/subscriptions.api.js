// frontend/src/api/subscriptions.api.js
import apiClient from "../lib/axios";

export const subscriptionsApi = {
  async getMySubscriptions() {
    const { data } = await apiClient.get("/subscriptions");
    return data;
  },

  async getActiveSubscription() {
    const { data } = await apiClient.get("/subscriptions/active");
    return data;
  },

  async getSubscriptionHistory() {
    const { data } = await apiClient.get("/subscriptions/history");
    return data;
  },

  async redeemAccessToken(tokenCode) {
    const { data } = await apiClient.post("/subscriptions/redeem", { token: tokenCode });
    return data;
  },

  async verifyAccessToken(tokenCode) {
    const { data } = await apiClient.post("/subscriptions/verify", { token: tokenCode });
    return data?.access ?? data;
  },

  async getMyAccess() {
    const { data } = await apiClient.get("/subscriptions/my-access");
    return data;
  },

  async cancelSubscription(id) {
    const { data } = await apiClient.post(`/subscriptions/${id}/cancel`);
    return data;
  },

  async renewSubscription(id) {
    const { data } = await apiClient.post(`/subscriptions/${id}/renew`);
    return data;
  },

  async getSubscriptionById(id) {
    const { data } = await apiClient.get(`/subscriptions/${id}`);
    return data;
  },
};
