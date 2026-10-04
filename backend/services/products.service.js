const prisma = require("../lib/prisma");

// Select product fields returned to the client
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  type: true,
  status: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
};

// Create an error with an HTTP status the error handler can read
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  return error;
};

// List all active products, oldest first
const getProducts = async () => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: PRODUCT_SELECT,
  });

  return products;
};

// Get a product by slug or throw when it does not exist
const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: PRODUCT_SELECT,
  });

  if (!product) throw createError("Product not found.", 404);

  return product;
};

// Get the free product
const getFreeProduct = async () => {
  return getProductBySlug("free");
};

// Get the VIP product
const getVipProduct = async () => {
  return getProductBySlug("vip");
};

// Get the MaxBet product
const getMaxbetProduct = async () => {
  return getProductBySlug("maxbet");
};

// Get a product by id or throw when it does not exist
const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: PRODUCT_SELECT,
  });

  if (!product) throw createError("Product not found.", 404);

  return product;
};

// List active products that are public or unlocked by a valid token assigned to the user
const getMyProducts = async (userId) => {
  const now = new Date();

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { isPublic: true },
        {
          accessTokens: {
            some: {
              assignedUserId: userId,
              status: "ACTIVE",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: PRODUCT_SELECT,
  });

  return products;
};

module.exports = {
  getProducts,
  getFreeProduct,
  getVipProduct,
  getMaxbetProduct,
  getProductById,
  getMyProducts,
};