const { Router } = require("express");

const productsController = require("../controllers/products.controller");
const { authenticateJWT } = require("../middleware/authentication");

const productsRouter = Router();

// Available products
productsRouter.get("/", productsController.getProducts);

// Public product information
productsRouter.get("/free", productsController.getFreeProduct);

// Premium product information
productsRouter.get("/vip", productsController.getVipProduct);

// MaxBet product information
productsRouter.get("/maxbet", productsController.getMaxbetProduct);

// Single product
productsRouter.get("/:id", productsController.getProductById);

// Authenticated user's available products
productsRouter.get("/my-access", authenticateJWT, productsController.getMyProducts);

module.exports = productsRouter;