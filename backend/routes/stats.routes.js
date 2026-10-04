const { Router } = require("express");

const statsController = require("../controllers/stats.controller");
const { authenticateJWT } = require("../middleware/authentication");
const authorizeAdmin = require("../middleware/authorize");

const statsRouter = Router();

// Get the overall performance overview
statsRouter.get("/", statsController.getOverview);

// Get application usage for admins
statsRouter.get("/usage", authenticateJWT, authorizeAdmin, statsController.getUsageStats);

// Get performance for fixed time periods
statsRouter.get("/today", statsController.getTodayStats);
statsRouter.get("/week", statsController.getWeeklyStats);
statsRouter.get("/14-days", statsController.getFourteenDayStats);
statsRouter.get("/month", statsController.getMonthlyStats);
statsRouter.get("/year", statsController.getYearlyStats);
statsRouter.get("/all-time", statsController.getAllTimeStats);

// Get performance per product, requiring login for paid products
statsRouter.get("/free", statsController.getFreeStats);
statsRouter.get("/vip", authenticateJWT, statsController.getVipStats);
statsRouter.get("/maxbet", authenticateJWT, statsController.getMaxbetStats);

// Get product performance for weekly and monthly periods
statsRouter.get("/free/week", statsController.getFreeWeeklyStats);
statsRouter.get("/free/month", statsController.getFreeMonthlyStats);
statsRouter.get("/vip/week", authenticateJWT, statsController.getVipWeeklyStats);
statsRouter.get("/vip/month", authenticateJWT, statsController.getVipMonthlyStats);
statsRouter.get("/maxbet/week", authenticateJWT, statsController.getMaxbetWeeklyStats);
statsRouter.get("/maxbet/month", authenticateJWT, statsController.getMaxbetMonthlyStats);

// Get results filtered by outcome
statsRouter.get("/results", statsController.getResults);
statsRouter.get("/wins", statsController.getWins);
statsRouter.get("/losses", statsController.getLosses);
statsRouter.get("/pending", statsController.getPending);

// Get performance metrics
statsRouter.get("/win-rate", statsController.getWinRate);
statsRouter.get("/roi", statsController.getRoi);
statsRouter.get("/odds", statsController.getOddsStats);
statsRouter.get("/stakes", statsController.getStakeStats);

// Get performance grouped by category
statsRouter.get("/sports", statsController.getSportStats);
statsRouter.get("/markets", statsController.getMarketStats);
statsRouter.get("/competitions", statsController.getCompetitionStats);
statsRouter.get("/sources", authenticateJWT, authorizeAdmin, statsController.getSourceStats);

// Get tip volume and activity
statsRouter.get("/volume", statsController.getVolumeStats);
statsRouter.get("/scraped", statsController.getScrapedStats);
statsRouter.get("/published", statsController.getPublishedStats);

// Get performance reports
statsRouter.get("/report", statsController.getPerformanceReport);
statsRouter.get("/report/weekly", statsController.getWeeklyReport);
statsRouter.get("/report/monthly", statsController.getMonthlyReport);
statsRouter.get("/report/yearly", statsController.getYearlyReport);

// Get performance for products the current user can access
statsRouter.get("/my-access", authenticateJWT, statsController.getMyAccessStats);

module.exports = statsRouter;