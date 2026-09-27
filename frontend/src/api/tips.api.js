// frontend/src/api/tips.api.js
import apiClient from "../lib/axios";

export const tipsApi = {
  async getTips(params = {}) {
    const { data } = await apiClient.get("/tips", { params });
    return data;
  },

  async getFreeTips() {
    const { data } = await apiClient.get("/tips/free");
    return data;
  },

  async getVipTips() {
    const { data } = await apiClient.get("/tips/vip");
    return data;
  },

  async getMaxbetTips() {
    const { data } = await apiClient.get("/tips/maxbet");
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
