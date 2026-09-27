// backend/controllers/products.controller.js
const productsService = require("../services/products.service");

// Helper to destructure request data
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  userId: req.user?.id,
});

const getProducts = async (req, res, next) => {
  try {
    // No parameters needed for this service call
    const products = await productsService.getProducts();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

const getFreeProduct = async (req, res, next) => {
  try {
    const product = await productsService.getFreeProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const getVipProduct = async (req, res, next) => {
  try {
    const product = await productsService.getVipProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const getMaxbetProduct = async (req, res, next) => {
  try {
    const product = await productsService.getMaxbetProduct();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(id);
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
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