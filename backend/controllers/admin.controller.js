// backend/controllers/admin.controller.js
const adminService = require("../services/admin.service");

// Users
const getUsers = async (req, res, next) => {
  try {
    const { query } = req;
    const result = await adminService.getUsers(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const user = await adminService.updateUser(id, body);
    res.status(200).json({ message: "User updated successfully.", user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await adminService.updateUserStatus(id, status);
    res.status(200).json({ message: "User status updated successfully.", user });
  } catch (error) {
    next(error);
  }
};

// Tips
const createTip = async (req, res, next) => {
  try {
    const { body, user } = req;
    const tip = await adminService.createTip(body, user.id);
    res.status(201).json({ message: "Tip created successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const getTips = async (req, res, next) => {
  try {
    const { query } = req;
    const result = await adminService.getTips(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tip = await adminService.getTipById(id);
    res.status(200).json({ tip });
  } catch (error) {
    next(error);
  }
};

const updateTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const tip = await adminService.updateTip(id, body);
    res.status(200).json({ message: "Tip updated successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const deleteTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tip = await adminService.deleteTip(id);
    res.status(200).json({ message: "Tip cancelled successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const updateTipsBulk = async (req, res, next) => {
  try {
    const { ids, data } = req.body;
    const result = await adminService.updateTipsBulk(ids, data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const publishTipsBulk = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const { id: userId } = req.user;
    const result = await adminService.publishTipsBulk(ids, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const unpublishTipsBulk = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await adminService.unpublishTipsBulk(ids);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const settleTipsBulk = async (req, res, next) => {
  try {
    const { ids, outcome, result: resInfo } = req.body;
    const result = await adminService.settleTipsBulk(ids, outcome, resInfo);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const cancelTipsBulk = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await adminService.cancelTipsBulk(ids);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Single tip actions
const publishTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const tip = await adminService.publishTip(id, userId);
    res.status(200).json({ message: "Tip published successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const unpublishTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tip = await adminService.unpublishTip(id);
    res.status(200).json({ message: "Tip unpublished successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const settleTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome, result: resInfo } = req.body;
    const tip = await adminService.settleTip(id, outcome, resInfo);
    res.status(200).json({ message: "Tip settled successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const cancelTip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tip = await adminService.cancelTip(id);
    res.status(200).json({ message: "Tip cancelled successfully.", tip });
  } catch (error) {
    next(error);
  }
};

const publishTipToProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    const publication = await adminService.publishTipToProduct(id, productId);
    res.status(201).json({ message: "Tip published to product successfully.", publication });
  } catch (error) {
    next(error);
  }
};

const removeTipPublication = async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    const publication = await adminService.removeTipPublication(id, productId);
    res.status(200).json({ message: "Tip publication removed successfully.", publication });
  } catch (error) {
    next(error);
  }
};

// Access Tokens
const createAccessToken = async (req, res, next) => {
  try {
    const { body } = req;
    const result = await adminService.createAccessToken(body);
    res.status(201).json({ message: "Access token created successfully.", ...result });
  } catch (error) {
    next(error);
  }
};

const createAccessTokensBulk = async (req, res, next) => {
  try {
    const { body } = req;
    const result = await adminService.createAccessTokensBulk(body);
    res.status(201).json({ message: "Access tokens created successfully.", ...result });
  } catch (error) {
    next(error);
  }
};

const getAccessTokens = async (req, res, next) => {
  try {
    const { query } = req;
    const result = await adminService.getAccessTokens(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAccessTokenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accessToken = await adminService.getAccessTokenById(id);
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

const updateAccessToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const accessToken = await adminService.updateAccessToken(id, body);
    res.status(200).json({ message: "Access token updated successfully.", accessToken });
  } catch (error) {
    next(error);
  }
};

const revokeAccessToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accessToken = await adminService.revokeAccessToken(id);
    res.status(200).json({ message: "Access token revoked successfully.", accessToken });
  } catch (error) {
    next(error);
  }
};

const extendAccessToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    const accessToken = await adminService.extendAccessToken(id, days);
    res.status(200).json({ message: "Access token extended successfully.", accessToken });
  } catch (error) {
    next(error);
  }
};

// Products
const createProduct = async (req, res, next) => {
  try {
    const { body } = req;
    const product = await adminService.createProduct(body);
    res.status(201).json({ message: "Product created successfully.", product });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const { query } = req;
    const products = await adminService.getProducts(query);
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await adminService.getProductById(id);
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const product = await adminService.updateProduct(id, body);
    res.status(200).json({ message: "Product updated successfully.", product });
  } catch (error) {
    next(error);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const product = await adminService.updateProductStatus(id, status);
    res.status(200).json({ message: "Product status updated successfully.", product });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  createTip,
  getTips,
  getTipById,
  updateTip,
  deleteTip,
  updateTipsBulk,
  publishTipsBulk,
  unpublishTipsBulk,
  settleTipsBulk,
  cancelTipsBulk,
  publishTip,
  unpublishTip,
  settleTip,
  cancelTip,
  publishTipToProduct,
  removeTipPublication,
  createAccessToken,
  createAccessTokensBulk,
  getAccessTokens,
  getAccessTokenById,
  updateAccessToken,
  revokeAccessToken,
  extendAccessToken,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
};