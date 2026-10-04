const { Router } = require("express");

const adminController = require("../controllers/admin.controller");
const { authenticateJWT } = require("../middleware/authentication");
const authorizeAdmin = require("../middleware/authorize");

const adminRouter = Router();

// Require an authenticated admin for every admin route
adminRouter.use(authenticateJWT, authorizeAdmin);

// Manage users
adminRouter.get("/users", adminController.getUsers);
adminRouter.get("/users/:id", adminController.getUserById);
adminRouter.patch("/users/:id", adminController.updateUser);
adminRouter.patch("/users/:id/status", adminController.updateUserStatus);

// Create and list tips
adminRouter.post("/tips", adminController.createTip);
adminRouter.get("/tips", adminController.getTips);

// Register bulk tip routes before "/tips/:id" so "bulk" is not matched as an id
adminRouter.patch("/tips/bulk", adminController.updateTipsBulk);
adminRouter.post("/tips/bulk/publish", adminController.publishTipsBulk);
adminRouter.post("/tips/bulk/unpublish", adminController.unpublishTipsBulk);
adminRouter.post("/tips/bulk/settle", adminController.settleTipsBulk);
adminRouter.post("/tips/bulk/cancel", adminController.cancelTipsBulk);

// Read, update and delete a single tip
adminRouter.get("/tips/:id", adminController.getTipById);
adminRouter.patch("/tips/:id", adminController.updateTip);
adminRouter.delete("/tips/:id", adminController.deleteTip);

// Run actions on a single tip
adminRouter.post("/tips/:id/publish", adminController.publishTip);
adminRouter.post("/tips/:id/unpublish", adminController.unpublishTip);
adminRouter.post("/tips/:id/settle", adminController.settleTip);
adminRouter.post("/tips/:id/cancel", adminController.cancelTip);

// Manage tip publications per product
adminRouter.post("/tips/:id/publications", adminController.publishTipToProduct);
adminRouter.delete("/tips/:id/publications/:productId", adminController.removeTipPublication);

// Manage access tokens
adminRouter.post("/subscription-tokens", adminController.createAccessToken);
adminRouter.post("/subscription-tokens/bulk", adminController.createAccessTokensBulk);
adminRouter.get("/subscription-tokens", adminController.getAccessTokens);
adminRouter.get("/subscription-tokens/:id", adminController.getAccessTokenById);
adminRouter.patch("/subscription-tokens/:id", adminController.updateAccessToken);
adminRouter.post("/subscription-tokens/:id/revoke", adminController.revokeAccessToken);
adminRouter.post("/subscription-tokens/:id/extend", adminController.extendAccessToken);

// Manage products
adminRouter.post("/products", adminController.createProduct);
adminRouter.get("/products", adminController.getProducts);
adminRouter.get("/products/:id", adminController.getProductById);
adminRouter.patch("/products/:id", adminController.updateProduct);
adminRouter.patch("/products/:id/status", adminController.updateProductStatus);

module.exports = adminRouter;