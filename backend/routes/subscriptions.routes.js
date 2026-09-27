const { Router } = require("express");

const subscriptionsController = require("../controllers/subscription.controller");
const { authenticateJWT } = require("../middleware/authentication");

const subscriptionsRouter = Router();

// Subscription overview
subscriptionsRouter.get("/", authenticateJWT, subscriptionsController.getMySubscriptions);

// Available access
subscriptionsRouter.get("/active", authenticateJWT, subscriptionsController.getActiveSubscription);
subscriptionsRouter.get("/history", authenticateJWT, subscriptionsController.getSubscriptionHistory);

// Access token redemption
subscriptionsRouter.post("/redeem", authenticateJWT, subscriptionsController.redeemAccessToken);

// Check an access token
subscriptionsRouter.post("/verify", subscriptionsController.verifyAccessToken);

// Current user's access
subscriptionsRouter.get("/my-access", authenticateJWT, subscriptionsController.getMyAccess);

// Cancel access
subscriptionsRouter.post("/:id/cancel", authenticateJWT, subscriptionsController.cancelSubscription);

// Renew access
subscriptionsRouter.post("/:id/renew", authenticateJWT, subscriptionsController.renewSubscription);

// Subscription details
subscriptionsRouter.get("/:id", authenticateJWT, subscriptionsController.getSubscriptionById);

module.exports = subscriptionsRouter;