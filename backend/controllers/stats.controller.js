const statsService = require("../services/stats.service");

const getOverview = async (req, res, next) => {
    try {
        const stats = await statsService.getOverview();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getTodayStats = async (req, res, next) => {
    try {
        const stats = await statsService.getTodayStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getWeeklyStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getFourteenDayStats = async (req, res, next) => {
    try {
        const stats = await statsService.getFourteenDayStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMonthlyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMonthlyStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getYearlyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getYearlyStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getAllTimeStats = async (req, res, next) => {
    try {
        const stats = await statsService.getAllTimeStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getFreeStats = async (req, res, next) => {
    try {
        const stats = await statsService.getFreeStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getVipStats = async (req, res, next) => {
    try {
        const stats = await statsService.getVipStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMaxbetStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMaxbetStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getFreeWeeklyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getFreeWeeklyStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getFreeMonthlyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getFreeMonthlyStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getVipWeeklyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getVipWeeklyStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getVipMonthlyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getVipMonthlyStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMaxbetWeeklyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMaxbetWeeklyStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMaxbetMonthlyStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMaxbetMonthlyStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getResults = async (req, res, next) => {
    try {
        const stats = await statsService.getResults();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getWins = async (req, res, next) => {
    try {
        const stats = await statsService.getWins();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getLosses = async (req, res, next) => {
    try {
        const stats = await statsService.getLosses();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getPending = async (req, res, next) => {
    try {
        const stats = await statsService.getPending();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getWinRate = async (req, res, next) => {
    try {
        const stats = await statsService.getWinRate();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getRoi = async (req, res, next) => {
    try {
        const stats = await statsService.getRoi();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getOddsStats = async (req, res, next) => {
    try {
        const stats = await statsService.getOddsStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getStakeStats = async (req, res, next) => {
    try {
        const stats = await statsService.getStakeStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getSportStats = async (req, res, next) => {
    try {
        const stats = await statsService.getSportStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMarketStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMarketStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getCompetitionStats = async (req, res, next) => {
    try {
        const stats = await statsService.getCompetitionStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getSourceStats = async (req, res, next) => {
    try {
        const stats = await statsService.getSourceStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getVolumeStats = async (req, res, next) => {
    try {
        const stats = await statsService.getVolumeStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getScrapedStats = async (req, res, next) => {
    try {
        const stats = await statsService.getScrapedStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getPublishedStats = async (req, res, next) => {
    try {
        const stats = await statsService.getPublishedStats();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getPerformanceReport = async (req, res, next) => {
    try {
        const stats = await statsService.getPerformanceReport();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyReport = async (req, res, next) => {
    try {
        const stats = await statsService.getWeeklyReport();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMonthlyReport = async (req, res, next) => {
    try {
        const stats = await statsService.getMonthlyReport();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getYearlyReport = async (req, res, next) => {
    try {
        const stats = await statsService.getYearlyReport();

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

const getMyAccessStats = async (req, res, next) => {
    try {
        const stats = await statsService.getMyAccessStats(
            req.user.id
        );

        res.status(200).json({
            stats,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getTodayStats,
    getWeeklyStats,
    getFourteenDayStats,
    getMonthlyStats,
    getYearlyStats,
    getAllTimeStats,
    getFreeStats,
    getVipStats,
    getMaxbetStats,
    getFreeWeeklyStats,
    getFreeMonthlyStats,
    getVipWeeklyStats,
    getVipMonthlyStats,
    getMaxbetWeeklyStats,
    getMaxbetMonthlyStats,
    getResults,
    getWins,
    getLosses,
    getPending,
    getWinRate,
    getRoi,
    getOddsStats,
    getStakeStats,
    getSportStats,
    getMarketStats,
    getCompetitionStats,
    getSourceStats,
    getVolumeStats,
    getScrapedStats,
    getPublishedStats,
    getPerformanceReport,
    getWeeklyReport,
    getMonthlyReport,
    getYearlyReport,
    getMyAccessStats,
};