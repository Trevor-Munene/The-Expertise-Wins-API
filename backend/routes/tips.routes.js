const { Router } = require("express");

const tipsController = require("../controllers/tips.controller");
const { authenticateJWT } = require("../middleware/authentication");

const tipsRouter = Router();

// Public tips
tipsRouter.get("/", tipsController.getTips);
tipsRouter.get("/free", tipsController.getFreeTips);

// Protected product tips
tipsRouter.get("/vip", authenticateJWT, tipsController.getVipTips);
tipsRouter.get("/maxbet", authenticateJWT, tipsController.getMaxbetTips);

// Individual tip
tipsRouter.get("/:id", tipsController.getTipById);

// Tip management
tipsRouter.post("/", authenticateJWT, tipsController.createTip);
tipsRouter.patch("/:id", authenticateJWT, tipsController.updateTip);

// Tip results
tipsRouter.patch("/:id/result", authenticateJWT, tipsController.updateTipResult);

// Delete / cancel a tip
tipsRouter.delete("/:id", authenticateJWT, tipsController.deleteTip);

module.exports = tipsRouter;