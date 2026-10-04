import apiClient from "../lib/axios";

export const tipsApi = {
  // List public tips with optional sport, outcome, day and pagination filters
  async getTips(params = {}) {
    const { data } = await apiClient.get("/tips", { params });
    return data;
  },

  // List free product tips
  async getFreeTips(params = {}) {
    const { data } = await apiClient.get("/tips/free", { params });
    return data;
  },

  // List VIP tips for users with access
  async getVipTips(params = {}) {
    const { data } = await apiClient.get("/tips/vip", { params });
    return data;
  },

  // List MaxBet tips for users with access
  async getMaxbetTips(params = {}) {
    const { data } = await apiClient.get("/tips/maxbet", { params });
    return data;
  },

  // List archived tips with tier, sport, outcome, search, day, from and to filters
  async getArchive(params = {}) {
    const { data } = await apiClient.get("/tips/archive", { params });
    return data;
  },

  // Get a single tip
  async getTipById(id) {
    const { data } = await apiClient.get(`/tips/${id}`);
    return data;
  },

  // Create a tip
  async createTip(payload) {
    const { data } = await apiClient.post("/tips", payload);
    return data;
  },

  // Update a tip
  async updateTip(id, payload) {
    const { data } = await apiClient.patch(`/tips/${id}`, payload);
    return data;
  },

  // Update a tip's result, expecting a payload of { result, outcome }
  async updateTipResult(id, payload) {
    const { data } = await apiClient.patch(`/tips/${id}/result`, payload);
    return data;
  },

  // Cancel a tip
  async deleteTip(id) {
    const { data } = await apiClient.delete(`/tips/${id}`);
    return data;
  },
};