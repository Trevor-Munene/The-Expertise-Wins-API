const { Router } = require("express");

const subscriptionsController = require("../controllers/subscription.controller");
const { authenticateJWT } = require("../middleware/authentication");

const subscriptionsRouter = Router();

// List all subscriptions for the current user
subscriptionsRouter.get("/", authenticateJWT, subscriptionsController.getMySubscriptions);

// Get the current active subscription and the subscription history
subscriptionsRouter.get("/active", authenticateJWT, subscriptionsController.getActiveSubscription);
subscriptionsRouter.get("/history", authenticateJWT, subscriptionsController.getSubscriptionHistory);

// Redeem an access token. Tokens are issued to a registered account, so
// redemption requires signing in as that account.
subscriptionsRouter.post("/redeem", authenticateJWT, subscriptionsController.redeemAccessToken);

// Check whether an access token is valid
subscriptionsRouter.post("/verify", subscriptionsController.verifyAccessToken);

// List products the current user can access
subscriptionsRouter.get("/my-access", authenticateJWT, subscriptionsController.getMyAccess);

// Cancel a subscription
subscriptionsRouter.post("/:id/cancel", authenticateJWT, subscriptionsController.cancelSubscription);

// Renew a subscription
subscriptionsRouter.post("/:id/renew", authenticateJWT, subscriptionsController.renewSubscription);

// Get a single subscription, registered last so named routes match first
subscriptionsRouter.get("/:id", authenticateJWT, subscriptionsController.getSubscriptionById);

module.exports = subscriptionsRouter;