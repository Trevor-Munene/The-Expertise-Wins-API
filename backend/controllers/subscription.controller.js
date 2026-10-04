const subscriptionsService = require("../services/subscription.service");

// List all subscriptions for the current user
const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionsService.getMySubscriptions(req.user.id);
    res.status(200).json({ subscriptions });
  } catch (error) {
    next(error);
  }
};

// Get the current user's active subscription
const getActiveSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.getActiveSubscription(req.user.id);
    res.status(200).json({ subscription });
  } catch (error) {
    next(error);
  }
};

// Get the current user's subscription history
const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionsService.getSubscriptionHistory(req.user.id);
    res.status(200).json({ subscriptions });
  } catch (error) {
    next(error);
  }
};

// Redeem an access token for the current user or a guest
const redeemAccessToken = async (req, res, next) => {
  try {
    const { token } = req.body ?? {};
    const result = await subscriptionsService.redeemAccessToken(req.user?.id, token);
    res.status(200).json({ message: "Access token redeemed successfully.", ...result });
  } catch (error) {
    next(error);
  }
};

// Check whether an access token is valid
const verifyAccessToken = async (req, res, next) => {
  try {
    const { token } = req.body ?? {};
    const result = await subscriptionsService.verifyAccessToken(token);
    res.status(200).json({ access: result });
  } catch (error) {
    next(error);
  }
};

// List products the current user can access
const getMyAccess = async (req, res, next) => {
  try {
    const access = await subscriptionsService.getMyAccess(req.user.id);
    res.status(200).json({ access });
  } catch (error) {
    next(error);
  }
};

// Cancel one of the current user's subscriptions
const cancelSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionsService.cancelSubscription(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Renew one of the current user's subscriptions
const renewSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionsService.renewSubscription(req.user.id, req.params.id, req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get one of the current user's subscriptions
const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.getSubscriptionById(req.user.id, req.params.id);
    res.status(200).json({ subscription });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscriptions,
  getActiveSubscription,
  getSubscriptionHistory,
  redeemAccessToken,
  verifyAccessToken,
  getMyAccess,
  cancelSubscription,
  renewSubscription,
  getSubscriptionById,
};