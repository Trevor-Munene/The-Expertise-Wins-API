// frontend/src/api/tips.api.js
import apiClient from "../lib/axios";

export const tipsApi = {
  async getTips(params = {}) {
    const { data } = await apiClient.get("/tips", { params });
    return data;
  },

  async getFreeTips(params = {}) {
    const { data } = await apiClient.get("/tips/free", { params });
    return data;
  },

  async getVipTips(params = {}) {
    const { data } = await apiClient.get("/tips/vip", { params });
    return data;
  },

  async getMaxbetTips(params = {}) {
    const { data } = await apiClient.get("/tips/maxbet", { params });
    return data;
  },

  async getArchive(params = {}) {
    const { data } = await apiClient.get("/tips/archive", { params });
    return data;
  },

  async getTipById(id) {
    const { data } = await apiClient.get(`/tips/${id}`);
    return data;
  },

  async createTip(payload) {
    const { data } = await apiClient.post("/tips", payload);
    return data;
  },

  async updateTip(id, payload) {
    const { data } = await apiClient.patch(`/tips/${id}`, payload);
    return data;
  },

  async updateTipResult(id, payload) {
    const { data } = await apiClient.patch(`/tips/${id}/result`, payload);
    return data;
  },

  async deleteTip(id) {
    const { data } = await apiClient.delete(`/tips/${id}`);
    return data;
  },
};
