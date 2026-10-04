const { Router } = require("express");

const tipsController = require("../controllers/tips.controller");
const { authenticateJWT, optionalAuthenticateJWT } = require("../middleware/authentication");

const tipsRouter = Router();

// List public tips and free tips
tipsRouter.get("/", tipsController.getTips);
tipsRouter.get("/free", tipsController.getFreeTips);

// List tips for paid products, requiring login
tipsRouter.get("/vip", authenticateJWT, tipsController.getVipTips);
tipsRouter.get("/maxbet", authenticateJWT, tipsController.getMaxbetTips);

// List archived tips for guests and logged in members
tipsRouter.get("/archive", optionalAuthenticateJWT, tipsController.getArchive);

// Get a single tip, registered after named routes so they match first
tipsRouter.get("/:id", optionalAuthenticateJWT, tipsController.getTipById);

// Create and update tips
tipsRouter.post("/", authenticateJWT, tipsController.createTip);
tipsRouter.patch("/:id", authenticateJWT, tipsController.updateTip);

// Update a tip's result
tipsRouter.patch("/:id/result", authenticateJWT, tipsController.updateTipResult);

// Cancel a tip
tipsRouter.delete("/:id", authenticateJWT, tipsController.deleteTip);

module.exports = tipsRouter;