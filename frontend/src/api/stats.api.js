import apiClient from "../lib/axios";

export const statsApi = {
  // Get the overall performance overview
  async getOverview() {
    const { data } = await apiClient.get("/stats");
    return data;
  },

  // Get win rate, ROI and average odds for a period and optional product.
  // This is the endpoint the metric cards read, so the three figures always
  // come from one server side computation over one set of tips.
  async getSummaryStats({ period, product } = {}) {
    const { data } = await apiClient.get("/stats/summary", {
      params: { period, product },
    });
    return data;
  },

  // Get application usage for admins
  async getUsageStats() {
    const { data } = await apiClient.get("/stats/usage");
    return data;
  },

  // Get performance for tips created today
  async getTodayStats() {
    const { data } = await apiClient.get("/stats/today");
    return data;
  },

  // Get performance for the last 7 days
  async getWeeklyStats() {
    const { data } = await apiClient.get("/stats/week");
    return data;
  },

  // Get performance for the last 14 days
  async getFourteenDayStats() {
    const { data } = await apiClient.get("/stats/14-days");
    return data;
  },

  // Get performance for the last 30 days
  async getMonthlyStats() {
    const { data } = await apiClient.get("/stats/month");
    return data;
  },

  // Get performance since the start of the year
  async getYearlyStats() {
    const { data } = await apiClient.get("/stats/year");
    return data;
  },

  // Get performance for all tips
  async getAllTimeStats() {
    const { data } = await apiClient.get("/stats/all-time");
    return data;
  },

  // Get performance for the free product
  async getFreeStats() {
    const { data } = await apiClient.get("/stats/free");
    return data;
  },

  // Get performance for the VIP product
  async getVipStats() {
    const { data } = await apiClient.get("/stats/vip");
    return data;
  },

  // Get performance for the MaxBet product
  async getMaxbetStats() {
    const { data } = await apiClient.get("/stats/maxbet");
    return data;
  },

  // Get free product performance for the last 7 days
  async getFreeWeeklyStats() {
    const { data } = await apiClient.get("/stats/free/week");
    return data;
  },

  // Get free product performance for the last 30 days
  async getFreeMonthlyStats() {
    const { data } = await apiClient.get("/stats/free/month");
    return data;
  },

  // Get VIP product performance for the last 7 days
  async getVipWeeklyStats() {
    const { data } = await apiClient.get("/stats/vip/week");
    return data;
  },

  // Get VIP product performance for the last 30 days
  async getVipMonthlyStats() {
    const { data } = await apiClient.get("/stats/vip/month");
    return data;
  },

  // Get MaxBet product performance for the last 7 days
  async getMaxbetWeeklyStats() {
    const { data } = await apiClient.get("/stats/maxbet/week");
    return data;
  },

  // Get MaxBet product performance for the last 30 days
  async getMaxbetMonthlyStats() {
    const { data } = await apiClient.get("/stats/maxbet/month");
    return data;
  },

  // Get performance for settled tips
  async getResults() {
    const { data } = await apiClient.get("/stats/results");
    return data;
  },

  // Get performance for won tips
  async getWins() {
    const { data } = await apiClient.get("/stats/wins");
    return data;
  },

  // Get performance for lost tips
  async getLosses() {
    const { data } = await apiClient.get("/stats/losses");
    return data;
  },

  // Get performance for pending tips
  async getPending() {
    const { data } = await apiClient.get("/stats/pending");
    return data;
  },

  // Get the overall win rate
  async getWinRate() {
    const { data } = await apiClient.get("/stats/win-rate");
    return data;
  },

  // Get the overall return on investment
  async getRoi() {
    const { data } = await apiClient.get("/stats/roi");
    return data;
  },

  // Get odds statistics
  async getOddsStats() {
    const { data } = await apiClient.get("/stats/odds");
    return data;
  },

  // Get stake statistics
  async getStakeStats() {
    const { data } = await apiClient.get("/stats/stakes");
    return data;
  },

  // Get performance grouped by sport
  async getSportStats() {
    const { data } = await apiClient.get("/stats/sports");
    return data;
  },

  // Get performance grouped by market
  async getMarketStats() {
    const { data } = await apiClient.get("/stats/markets");
    return data;
  },

  // Get performance grouped by competition
  async getCompetitionStats() {
    const { data } = await apiClient.get("/stats/competitions");
    return data;
  },

  // Get performance grouped by source for admins
  async getSourceStats() {
    const { data } = await apiClient.get("/stats/sources");
    return data;
  },

  // Get tip volume counts
  async getVolumeStats() {
    const { data } = await apiClient.get("/stats/volume");
    return data;
  },

  // Get scraped versus manual tip counts
  async getScrapedStats() {
    const { data } = await apiClient.get("/stats/scraped");
    return data;
  },

  // Get published tip counts per product
  async getPublishedStats() {
    const { data } = await apiClient.get("/stats/published");
    return data;
  },

  // Get the full performance report
  async getPerformanceReport() {
    const { data } = await apiClient.get("/stats/report");
    return data;
  },

  // Get the report for the last 7 days
  async getWeeklyReport() {
    const { data } = await apiClient.get("/stats/report/weekly");
    return data;
  },

  // Get the report for the last 30 days
  async getMonthlyReport() {
    const { data } = await apiClient.get("/stats/report/monthly");
    return data;
  },

  // Get the report since the start of the year
  async getYearlyReport() {
    const { data } = await apiClient.get("/stats/report/yearly");
    return data;
  },

  // Get performance for products the current user can access
  async getMyAccessStats() {
    const { data } = await apiClient.get("/stats/my-access");
    return data;
  },
};