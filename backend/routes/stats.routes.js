const { Router } = require("express");

const statsController = require("../controllers/stats.controller");
const { authenticateJWT } = require("../middleware/authentication");

const statsRouter = Router();

// Overall API performance
statsRouter.get("/", statsController.getOverview);

// Time-based performance
statsRouter.get("/today", statsController.getTodayStats);
statsRouter.get("/week", statsController.getWeeklyStats);
statsRouter.get("/14-days", statsController.getFourteenDayStats);
statsRouter.get("/month", statsController.getMonthlyStats);
statsRouter.get("/year", statsController.getYearlyStats);
statsRouter.get("/all-time", statsController.getAllTimeStats);

// Product performance
statsRouter.get("/free", statsController.getFreeStats);

statsRouter.get("/vip", authenticateJWT, statsController.getVipStats);
statsRouter.get("/maxbet", authenticateJWT, statsController.getMaxbetStats);

// Product performance by period
statsRouter.get("/free/week", statsController.getFreeWeeklyStats);
statsRouter.get("/free/month", statsController.getFreeMonthlyStats);
statsRouter.get("/vip/week", authenticateJWT, statsController.getVipWeeklyStats);
statsRouter.get("/vip/month", authenticateJWT, statsController.getVipMonthlyStats);
statsRouter.get("/maxbet/week", authenticateJWT, statsController.getMaxbetWeeklyStats);
statsRouter.get("/maxbet/month", authenticateJWT, statsController.getMaxbetMonthlyStats);

// Results and effectiveness
statsRouter.get("/results", statsController.getResults);
statsRouter.get("/wins", statsController.getWins);
statsRouter.get("/losses", statsController.getLosses);
statsRouter.get("/pending", statsController.getPending);

// Performance metrics
statsRouter.get("/win-rate", statsController.getWinRate);
statsRouter.get("/roi", statsController.getRoi);
statsRouter.get("/odds", statsController.getOddsStats);
statsRouter.get("/stakes", statsController.getStakeStats);

// Performance by category
statsRouter.get("/sports", statsController.getSportStats);
statsRouter.get("/markets", statsController.getMarketStats);
statsRouter.get("/competitions", statsController.getCompetitionStats);
statsRouter.get("/sources", statsController.getSourceStats);

// API activity and tip volume
statsRouter.get("/volume", statsController.getVolumeStats);
statsRouter.get("/scraped", statsController.getScrapedStats);
statsRouter.get("/published", statsController.getPublishedStats);

// Effectiveness reports
statsRouter.get("/report", statsController.getPerformanceReport);
statsRouter.get("/report/weekly", statsController.getWeeklyReport);
statsRouter.get("/report/monthly", statsController.getMonthlyReport);
statsRouter.get("/report/yearly", statsController.getYearlyReport);

// Authenticated user performance
statsRouter.get("/my-access", authenticateJWT, statsController.getMyAccessStats);

module.exports = statsRouter;