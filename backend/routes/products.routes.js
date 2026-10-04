const { Router } = require("express");

const productsController = require("../controllers/products.controller");
const { authenticateJWT } = require("../middleware/authentication");

const productsRouter = Router();

// List all active products
productsRouter.get("/", productsController.getProducts);

// Get the free product
productsRouter.get("/free", productsController.getFreeProduct);

// Get the VIP product
productsRouter.get("/vip", productsController.getVipProduct);

// Get the MaxBet product
productsRouter.get("/maxbet", productsController.getMaxbetProduct);

// List products the current user can access
productsRouter.get("/my-access", authenticateJWT, productsController.getMyProducts);

// Get a single product by id, registered last so named routes match first
productsRouter.get("/:id", productsController.getProductById);

module.exports = productsRouter;