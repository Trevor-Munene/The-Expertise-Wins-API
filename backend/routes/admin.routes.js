const { Router } = require("express");

const adminController = require("../controllers/admin.controller");
const { authenticateJWT } = require("../middleware/authentication");

const adminRouter = Router();

// Admin access
adminRouter.use(authenticateJWT);

// Users
adminRouter.get("/users", adminController.getUsers);
adminRouter.get("/users/:id", adminController.getUserById);
adminRouter.patch("/users/:id", adminController.updateUser);
adminRouter.patch("/users/:id/status", adminController.updateUserStatus);

// Tips
adminRouter.post("/tips", adminController.createTip);
adminRouter.get("/tips", adminController.getTips);
adminRouter.get("/tips/:id", adminController.getTipById);
adminRouter.patch("/tips/:id", adminController.updateTip);
adminRouter.delete("/tips/:id", adminController.deleteTip);

// Bulk tip operations
adminRouter.patch("/tips/bulk", adminController.updateTipsBulk);
adminRouter.post("/tips/bulk/publish", adminController.publishTipsBulk);
adminRouter.post("/tips/bulk/unpublish", adminController.unpublishTipsBulk);
adminRouter.post("/tips/bulk/settle", adminController.settleTipsBulk);
adminRouter.post("/tips/bulk/cancel", adminController.cancelTipsBulk);

// Individual tip operations
adminRouter.post("/tips/:id/publish", adminController.publishTip);
adminRouter.post("/tips/:id/unpublish", adminController.unpublishTip);
adminRouter.post("/tips/:id/settle", adminController.settleTip);
adminRouter.post("/tips/:id/cancel", adminController.cancelTip);

// Tip publications
adminRouter.post("/tips/:id/publications", adminController.publishTipToProduct);
adminRouter.delete("/tips/:id/publications/:productId", adminController.removeTipPublication);

// Access tokens
adminRouter.post("/subscription-tokens", adminController.createAccessToken);
adminRouter.post("/subscription-tokens/bulk", adminController.createAccessTokensBulk);
adminRouter.get("/subscription-tokens", adminController.getAccessTokens);
adminRouter.get("/subscription-tokens/:id", adminController.getAccessTokenById);
adminRouter.patch("/subscription-tokens/:id", adminController.updateAccessToken);
adminRouter.post("/subscription-tokens/:id/revoke", adminController.revokeAccessToken);
adminRouter.post("/subscription-tokens/:id/extend", adminController.extendAccessToken);

// Products
adminRouter.post("/products", adminController.createProduct);
adminRouter.get("/products", adminController.getProducts);
adminRouter.get("/products/:id", adminController.getProductById);
adminRouter.patch("/products/:id", adminController.updateProduct);
adminRouter.patch("/products/:id/status", adminController.updateProductStatus);

module.exports = adminRouter;