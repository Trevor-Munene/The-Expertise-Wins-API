const { Router } = require("express");

const tipsController = require("../controllers/tips.controller");
const { authenticateJWT, optionalAuthenticateJWT } = require("../middleware/authentication");

const tipsRouter = Router();

// Public tips
tipsRouter.get("/", tipsController.getTips);
tipsRouter.get("/free", tipsController.getFreeTips);

// Protected product tips
tipsRouter.get("/vip", authenticateJWT, tipsController.getVipTips);
tipsRouter.get("/maxbet", authenticateJWT, tipsController.getMaxbetTips);

// Historical previews, public tiers for guests and entitled tiers for members
tipsRouter.get("/archive", optionalAuthenticateJWT, tipsController.getArchive);

// Individual tip
tipsRouter.get("/:id", optionalAuthenticateJWT, tipsController.getTipById);

// Tip management
tipsRouter.post("/", authenticateJWT, tipsController.createTip);
tipsRouter.patch("/:id", authenticateJWT, tipsController.updateTip);

// Tip results
tipsRouter.patch("/:id/result", authenticateJWT, tipsController.updateTipResult);

// Delete / cancel a tip
tipsRouter.delete("/:id", authenticateJWT, tipsController.deleteTip);

module.exports = tipsRouter;