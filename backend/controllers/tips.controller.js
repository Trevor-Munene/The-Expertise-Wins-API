// backend/controllers/tips.controller.js
const tipsService = require("../services/tips.service");

// Helper to extract request data consistently
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  body: req.body,
  userId: req.user?.id,
});

const getTips = async (req, res, next) => {
  try {
    const { query } = getRequestData(req);
    const tips = await tipsService.getTips(query);
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

const getFreeTips = async (req, res, next) => {
  try {
    const { query } = getRequestData(req);
    const tips = await tipsService.getFreeTips(query);
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

const getVipTips = async (req, res, next) => {
  try {
    const { userId, query } = getRequestData(req);
    const tips = await tipsService.getVipTips(userId, query, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

const getMaxbetTips = async (req, res, next) => {
  try {
    const { userId, query } = getRequestData(req);
    const tips = await tipsService.getMaxbetTips(userId, query, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

const getArchive = async (req, res, next) => {
  try {
    const { query, userId } = getRequestData(req);
    const tips = await tipsService.getArchive(query, userId, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

const getTipById = async (req, res, next) => {
  try {
    const { id } = req.params; // single param, destructure for consistency
    const tip = await tipsService.getTipById(id, req.user?.id, req.user?.role === "ADMIN");
    res.status(200).json({ tip });
  } catch (error) {
    next(error);
  }
};

const createTip = async (req, res, next) => {
  try {
    const { userId, body } = getRequestData(req);
    const tip = await tipsService.createTip(userId, body);
    res.status(201).json({
      message: "Tip created successfully.",
      tip,
    });
  } catch (error) {
    next(error);
  }
};

const updateTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, body } = getRequestData(req);
    const tip = await tipsService.updateTip(id, userId, body);
    res.status(200).json({
      message: "Tip updated successfully.",
      tip,
    });
  } catch (error) {
    next(error);
  }
};

const updateTipResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, body } = getRequestData(req);
    const tip = await tipsService.updateTipResult(id, userId, body);
    res.status(200).json({
      message: "Tip result updated successfully.",
      tip,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = getRequestData(req);
    const result = await tipsService.deleteTip(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTips,
  getFreeTips,
  getVipTips,
  getMaxbetTips,
  getArchive,
  getTipById,
  createTip,
  updateTip,
  updateTipResult,
  deleteTip,
};