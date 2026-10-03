const subscriptionsService = require("../services/subscription.service");

const getMySubscriptions = async (req, res, next) => {
    try {
        const subscriptions =
            await subscriptionsService.getMySubscriptions(req.user.id);

        res.status(200).json({
            subscriptions,
        });
    } catch (error) {
        next(error);
    }
};

const getActiveSubscription = async (req, res, next) => {
    try {
        const subscription =
            await subscriptionsService.getActiveSubscription(req.user.id);

        res.status(200).json({
            subscription,
        });
    } catch (error) {
        next(error);
    }
};

const getSubscriptionHistory = async (req, res, next) => {
    try {
        const subscriptions =
            await subscriptionsService.getSubscriptionHistory(req.user.id);

        res.status(200).json({
            subscriptions,
        });
    } catch (error) {
        next(error);
    }
};

const redeemAccessToken = async (req, res, next) => {
    try {
        const result = await subscriptionsService.redeemAccessToken(
            req.user?.id,
            req.body.token
        );

        res.status(200).json({
            message: "Access token redeemed successfully.",
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const verifyAccessToken = async (req, res, next) => {
    try {
        const result = await subscriptionsService.verifyAccessToken(
            req.body.token
        );

        res.status(200).json({
            access: result,
        });
    } catch (error) {
        next(error);
    }
};

const getMyAccess = async (req, res, next) => {
    try {
        const access = await subscriptionsService.getMyAccess(req.user.id);

        res.status(200).json({ access,});
    } catch (error) {
        next(error);
    }
};

const cancelSubscription = async (req, res, next) => {
    try {
        const result = await subscriptionsService.cancelSubscription(req.user.id, req.params.id);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const renewSubscription = async (req, res, next) => {
    try {
        const result = await subscriptionsService.renewSubscription(
            req.user.id,
            req.params.id,
            req.body
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getSubscriptionById = async (req, res, next) => {
    try {
        const subscription =
            await subscriptionsService.getSubscriptionById(
                req.user.id,
                req.params.id
            );

        res.status(200).json({
            subscription,
        });
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