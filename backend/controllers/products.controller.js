const productsService = require("../services/products.service");

// Extract request data used by the handlers
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  userId: req.user?.id,
});

// List all active products
const getProducts = async (req, res, next) => {
  try {
    const products = await productsService.getProducts();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

// Get the free product
const getFreeProduct = async (req, res, next) => {
  try {
    const product = await productsService.getFreeProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// Get the VIP product
const getVipProduct = async (req, res, next) => {
  try {
    const product = await productsService.getVipProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// Get the MaxBet product
const getMaxbetProduct = async (req, res, next) => {
  try {
    const product = await productsService.getMaxbetProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// Get a single product by id
const getProductById = async (req, res, next) => {
  try {
    const { params } = getRequestData(req);
    const product = await productsService.getProductById(params.id);
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// List products the current user can access
const getMyProducts = async (req, res, next) => {
  try {
    const { userId } = getRequestData(req);
    const products = await productsService.getMyProducts(userId);
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFreeProduct,
  getVipProduct,
  getMaxbetProduct,
  getProductById,
  getMyProducts,
};