// frontend/src/api/stats.api.js
import apiClient from "../lib/axios";

export const statsApi = {
  async getOverview() {
    const { data } = await apiClient.get("/stats");
    return data;
  },

  async getTodayStats() {
    const { data } = await apiClient.get("/stats/today");
    return data;
  },

  async getWeeklyStats() {
    const { data } = await apiClient.get("/stats/week");
    return data;
  },

  async getFourteenDayStats() {
    const { data } = await apiClient.get("/stats/14-days");
    return data;
  },

  async getMonthlyStats() {
    const { data } = await apiClient.get("/stats/month");
    return data;
  },

  async getYearlyStats() {
    const { data } = await apiClient.get("/stats/year");
    return data;
  },

  async getAllTimeStats() {
    const { data } = await apiClient.get("/stats/all-time");
    return data;
  },

  async getFreeStats() {
    const { data } = await apiClient.get("/stats/free");
    return data;
  },

  async getVipStats() {
    const { data } = await apiClient.get("/stats/vip");
    return data;
  },

  async getMaxbetStats() {
    const { data } = await apiClient.get("/stats/maxbet");
    return data;
  },

  async getFreeWeeklyStats() {
    const { data } = await apiClient.get("/stats/free/week");
    return data;
  },

  async getFreeMonthlyStats() {
    const { data } = await apiClient.get("/stats/free/month");
    return data;
  },

  async getVipWeeklyStats() {
    const { data } = await apiClient.get("/stats/vip/week");
    return data;
  },

  async getVipMonthlyStats() {
    const { data } = await apiClient.get("/stats/vip/month");
    return data;
  },

  async getMaxbetWeeklyStats() {
    const { data } = await apiClient.get("/stats/maxbet/week");
    return data;
  },

  async getMaxbetMonthlyStats() {
    const { data } = await apiClient.get("/stats/maxbet/month");
    return data;
  },

  async getResults() {
    const { data } = await apiClient.get("/stats/results");
    return data;
  },

  async getWins() {
    const { data } = await apiClient.get("/stats/wins");
    return data;
  },

  async getLosses() {
    const { data } = await apiClient.get("/stats/losses");
    return data;
  },

  async getPending() {
    const { data } = await apiClient.get("/stats/pending");
    return data;
  },

  async getWinRate() {
    const { data } = await apiClient.get("/stats/win-rate");
    return data;
  },

  async getRoi() {
    const { data } = await apiClient.get("/stats/roi");
    return data;
  },

  async getOddsStats() {
    const { data } = await apiClient.get("/stats/odds");
    return data;
  },

  async getStakeStats() {
    const { data } = await apiClient.get("/stats/stakes");
    return data;
  },

  async getSportStats() {
    const { data } = await apiClient.get("/stats/sports");
    return data;
  },

  async getMarketStats() {
    const { data } = await apiClient.get("/stats/markets");
    return data;
  },

  async getCompetitionStats() {
    const { data } = await apiClient.get("/stats/competitions");
    return data;
  },

  async getSourceStats() {
    const { data } = await apiClient.get("/stats/sources");
    return data;
  },

  async getVolumeStats() {
    const { data } = await apiClient.get("/stats/volume");
    return data;
  },

  async getScrapedStats() {
    const { data } = await apiClient.get("/stats/scraped");
    return data;
  },

  async getPublishedStats() {
    const { data } = await apiClient.get("/stats/published");
    return data;
  },

  async getPerformanceReport() {
    const { data } = await apiClient.get("/stats/report");
    return data;
  },

  async getWeeklyReport() {
    const { data } = await apiClient.get("/stats/report/weekly");
    return data;
  },

  async getMonthlyReport() {
    const { data } = await apiClient.get("/stats/report/monthly");
    return data;
  },

  async getYearlyReport() {
    const { data } = await apiClient.get("/stats/report/yearly");
    return data;
  },

  async getMyAccessStats() {
    const { data } = await apiClient.get("/stats/my-access");
    return data;
  },
};
