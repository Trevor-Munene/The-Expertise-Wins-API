const tipsService = require("../services/tips.service");

// Extract request data, defaulting the body to an empty object
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  body: req.body ?? {},
  userId: req.user?.id,
});

// List public tips
const getTips = async (req, res, next) => {
  try {
    const { query } = getRequestData(req);
    const tips = await tipsService.getTips(query);
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

// List free product tips
const getFreeTips = async (req, res, next) => {
  try {
    const { query } = getRequestData(req);
    const tips = await tipsService.getFreeTips(query);
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

// List VIP tips if the user has access
const getVipTips = async (req, res, next) => {
  try {
    const { userId, query } = getRequestData(req);
    const tips = await tipsService.getVipTips(userId, query, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

// List MaxBet tips if the user has access
const getMaxbetTips = async (req, res, next) => {
  try {
    const { userId, query } = getRequestData(req);
    const tips = await tipsService.getMaxbetTips(userId, query, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

// List archived tips for the visible tiers
const getArchive = async (req, res, next) => {
  try {
    const { query, userId } = getRequestData(req);
    const tips = await tipsService.getArchive(query, userId, req.user?.role === "ADMIN");
    res.status(200).json({ tips });
  } catch (error) {
    next(error);
  }
};

// Get a single tip if it is visible to the user
const getTipById = async (req, res, next) => {
  try {
    const { params, userId } = getRequestData(req);
    const tip = await tipsService.getTipById(params.id, userId, req.user?.role === "ADMIN");
    res.status(200).json({ tip });
  } catch (error) {
    next(error);
  }
};

// Create a tip as the current user
const createTip = async (req, res, next) => {
  try {
    const { userId, body } = getRequestData(req);
    const tip = await tipsService.createTip(userId, body);
    res.status(201).json({ message: "Tip created successfully.", tip });
  } catch (error) {
    next(error);
  }
};

// Update a tip
const updateTip = async (req, res, next) => {
  try {
    const { params, userId, body } = getRequestData(req);
    const tip = await tipsService.updateTip(params.id, userId, body);
    res.status(200).json({ message: "Tip updated successfully.", tip });
  } catch (error) {
    next(error);
  }
};

// Update a tip's result and outcome
const updateTipResult = async (req, res, next) => {
  try {
    const { params, userId, body } = getRequestData(req);
    const tip = await tipsService.updateTipResult(params.id, userId, body);
    res.status(200).json({ message: "Tip result updated successfully.", tip });
  } catch (error) {
    next(error);
  }
};

// Cancel a tip
const deleteTip = async (req, res, next) => {
  try {
    const { params, userId } = getRequestData(req);
    const result = await tipsService.deleteTip(params.id, userId);
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