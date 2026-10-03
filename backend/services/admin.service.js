// backend/services/admin.service.js
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  telegramUsername: true,
  telegramUserId: true,
  lastLoginAt: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

const TIP_SELECT = {
  id: true,
  source: true,
  externalId: true,
  sport: true,
  competition: true,
  league: true,
  country: true,
  homeTeam: true,
  awayTeam: true,
  kickoff: true,
  market: true,
  selection: true,
  odds: true,
  stakeUnits: true,
  previewTitle: true,
  preview: true,
  verdict: true,
  tips: true,
  analytics: true,
  confidenceIndex: true,
  predictedScore: true,
  detailsUrl: true,
  status: true,
  result: true,
  outcome: true,
  extraTips: true,
  scrapedAt: true,
  publishedAt: true,
  settledAt: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  publishedById: true,
};

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

const ACCESS_TOKEN_SELECT = {
  id: true,
  tokenPrefix: true,
  productId: true,
  assignedUserId: true,
  status: true,
  expiresAt: true,
  usedAt: true,
  notes: true,
  createdAt: true,
  product: { select: { id: true, name: true, slug: true, type: true } },
  assignedUser: { select: { id: true, email: true, username: true, firstName: true, lastName: true } },
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// ---------- User related functions ----------
const getUsers = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.role) where.role = query.role;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_SELECT,
      accessTokens: {
        select: ACCESS_TOKEN_SELECT,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) throw createError("User not found.", 404);
  return user;
};

const updateUser = async (userId, userData) => {
  const allowedFields = ["email", "username", "firstName", "lastName", "telegramUsername", "telegramUserId", "role", "status"];
  const data = {};
  for (const field of allowedFields) {
    if (userData[field] !== undefined) data[field] = userData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No user fields provided for update.");

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        data.email ? { email: data.email, NOT: { id: userId } } : undefined,
        data.username ? { username: data.username, NOT: { id: userId } } : undefined,
        data.telegramUserId ? { telegramUserId: data.telegramUserId, NOT: { id: userId } } : undefined,
      ].filter(Boolean),
    },
    select: { id: true },
  });
  if (existingUser) throw createError("Email, username, or Telegram user ID is already in use.", 409);

  const user = await prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
  return user;
};

const updateUserStatus = async (userId, status) => {
  const validStatuses = ["ACTIVE", "SUSPENDED", "BANNED", "PENDING"];
  if (!validStatuses.includes(status)) throw createError("Invalid user status.");
  const user = await prisma.user.update({ where: { id: userId }, data: { status }, select: USER_SELECT });
  return user;
};

// ---------- Tip related functions ----------
const createTip = async (tipData, userId) => {
  const allowedFields = [
    "source",
    "externalId",
    "sport",
    "competition",
    "league",
    "country",
    "homeTeam",
    "awayTeam",
    "kickoff",
    "market",
    "selection",
    "odds",
    "stakeUnits",
    "previewTitle",
    "preview",
    "verdict",
    "tips",
    "analytics",
    "confidenceIndex",
    "predictedScore",
    "detailsUrl",
    "status",
    "result",
    "outcome",
    "extraTips",
    "scrapedAt",
  ];
  const data = { createdById: userId };
  for (const field of allowedFields) {
    if (tipData[field] !== undefined) data[field] = tipData[field];
  }
  const requiredFields = ["source", "sport", "market", "selection"];
  for (const field of requiredFields) {
    if (!data[field]) throw createError(`${field} is required.`);
  }
  return prisma.tip.create({ data, select: TIP_SELECT });
};

const getTips = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.outcome) where.outcome = query.outcome;
  if (query.sport) where.sport = query.sport;
  if (query.source) where.source = query.source;

  const [tips, total] = await prisma.$transaction([
    prisma.tip.findMany({ where, select: TIP_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.tip.count({ where }),
  ]);
  return { tips, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getTipById = async (tipId) => {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    select: {
      ...TIP_SELECT,
      publications: { include: { product: { select: PRODUCT_SELECT } } },
    },
  });
  if (!tip) throw createError("Tip not found.", 404);
  return tip;
};

const updateTip = async (tipId, tipData) => {
  const allowedFields = [
    "source",
    "externalId",
    "sport",
    "competition",
    "league",
    "country",
    "homeTeam",
    "awayTeam",
    "kickoff",
    "market",
    "selection",
    "odds",
    "stakeUnits",
    "previewTitle",
    "preview",
    "verdict",
    "tips",
    "analytics",
    "confidenceIndex",
    "predictedScore",
    "detailsUrl",
    "status",
    "result",
    "outcome",
    "extraTips",
    "scrapedAt",
  ];
  const data = {};
  for (const field of allowedFields) {
    if (tipData[field] !== undefined) data[field] = tipData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No tip fields provided for update.");
  return prisma.tip.update({ where: { id: tipId }, data, select: TIP_SELECT });
};

const deleteTip = async (tipId) => {
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() },
    select: TIP_SELECT,
  });
};

const validateTipIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) throw createError("At least one tip ID is required.");
  return [...new Set(ids)];
};

const updateTipsBulk = async (ids, data) => {
  const tipIds = validateTipIds(ids);
  const allowedFields = ["status", "result", "outcome", "stakeUnits", "odds", "verdict", "preview", "previewTitle", "confidenceIndex", "predictedScore"];
  const updateData = {};
  for (const field of allowedFields) {
    if (data?.[field] !== undefined) updateData[field] = data[field];
  }
  if (Object.keys(updateData).length === 0) throw createError("No tip fields provided for bulk update.");
  const result = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: updateData });
  return { message: "Tips updated successfully.", updated: result.count };
};

const publishTip = async (tipId, userId) => {
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: userId },
    select: TIP_SELECT,
  });
};

const publishTipsBulk = async (ids, userId) => {
  const tipIds = validateTipIds(ids);
  const publishedAt = new Date();
  const result = await prisma.tip.updateMany({
    where: { id: { in: tipIds } },
    data: { status: "PUBLISHED", publishedAt, publishedById: userId },
  });
  return { message: "Tips published successfully.", updated: result.count };
};

const unpublishTip = async (tipId) => {
  return prisma.tip.update({ where: { id: tipId }, data: { status: "LOCKED" }, select: TIP_SELECT });
};

const unpublishTipsBulk = async (ids) => {
  const tipIds = validateTipIds(ids);
  const result = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: { status: "LOCKED" } });
  return { message: "Tips unpublished successfully.", updated: result.count };
};

const settleTip = async (tipId, outcome, result) => {
  const validOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"];
  if (!validOutcomes.includes(outcome)) throw createError("Invalid tip outcome.");
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "SETTLED", outcome, result: result ?? null, settledAt: new Date() },
    select: TIP_SELECT,
  });
};

const settleTipsBulk = async (ids, outcome, result) => {
  const tipIds = validateTipIds(ids);
  const validOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"];
  if (!validOutcomes.includes(outcome)) throw createError("Invalid tip outcome.");
  const updateData = { status: "SETTLED", outcome, settledAt: new Date() };
  if (result !== undefined) updateData.result = result;
  const updated = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: updateData });
  return { message: "Tips settled successfully.", updated: updated.count };
};

const cancelTip = async (tipId) => {
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() },
    select: TIP_SELECT,
  });
};

const cancelTipsBulk = async (ids) => {
  const tipIds = validateTipIds(ids);
  const result = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() } });
  return { message: "Tips cancelled successfully.", updated: result.count };
};

const publishTipToProduct = async (tipId, productId) => {
  const [tip, product] = await Promise.all([
    prisma.tip.findUnique({ where: { id: tipId }, select: { id: true } }),
    prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } }),
  ]);
  if (!tip) throw createError("Tip not found.", 404);
  if (!product) throw createError("Product not found.", 404);
  if (product.status !== "ACTIVE") throw createError("Cannot publish a tip to an inactive product.");
  return prisma.tipPublication.upsert({
    where: { tipId_productId: { tipId, productId } },
    update: { status: "PUBLISHED", publishedAt: new Date(), unpublishedAt: null },
    create: { tipId, productId, status: "PUBLISHED", publishedAt: new Date() },
    include: { product: { select: PRODUCT_SELECT } },
  });
};

const removeTipPublication = async (tipId, productId) => {
  const publication = await prisma.tipPublication.findUnique({ where: { tipId_productId: { tipId, productId } } });
  if (!publication) throw createError("Tip publication not found.", 404);
  return prisma.tipPublication.update({
    where: { id: publication.id },
    data: { status: "UNPUBLISHED", unpublishedAt: new Date() },
    include: { product: { select: PRODUCT_SELECT } },
  });
};

// ---------- Access Token functions ----------
const generateRawAccessToken = () => crypto.randomBytes(32).toString("hex");
const hashAccessToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const getTokenPrefix = (token) => token.slice(0, 10);

const formatAccessToken = (accessToken) => ({
  id: accessToken.id,
  tokenPrefix: accessToken.tokenPrefix,
  productId: accessToken.productId,
  assignedUserId: accessToken.assignedUserId,
  status: accessToken.status,
  expiresAt: accessToken.expiresAt,
  usedAt: accessToken.usedAt,
  notes: accessToken.notes,
  createdAt: accessToken.createdAt,
  product: accessToken.product,
  assignedUser: accessToken.assignedUser,
});

const parseExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) throw createError("Invalid expiration date.");
  return date;
};

const createAccessToken = async (tokenData) => {
  const { productId, expiresAt, notes, assignedUserId } = tokenData;
  if (!productId) throw createError("Product ID is required.");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
  if (!product) throw createError("Product not found.", 404);
  if (product.status !== "ACTIVE") throw createError("Cannot create a token for an inactive product.");
  const rawToken = generateRawAccessToken();
  const tokenHash = hashAccessToken(rawToken);
  const accessToken = await prisma.accessToken.create({
    data: { tokenHash, tokenPrefix: getTokenPrefix(rawToken), productId, assignedUserId: assignedUserId || null, expiresAt: parseExpiry(expiresAt), notes: notes ?? null },
    select: ACCESS_TOKEN_SELECT,
  });
  return { token: rawToken, accessToken: formatAccessToken(accessToken) };
};

const createAccessTokensBulk = async (tokenData) => {
  const { productId, count, expiresAt, notes } = tokenData;
  const tokenCount = Number.parseInt(count, 10);
  if (!productId) throw createError("Product ID is required.");
  if (!Number.isInteger(tokenCount) || tokenCount < 1 || tokenCount > 1000) throw createError("Token count must be between 1 and 1000.");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
  if (!product) throw createError("Product not found.", 404);
  if (product.status !== "ACTIVE") throw createError("Cannot create tokens for an inactive product.");
  const parsedExpiry = parseExpiry(expiresAt);
  const tokens = [];
  for (let i = 0; i < tokenCount; i++) {
    const rawToken = generateRawAccessToken();
    tokens.push({ rawToken, tokenHash: hashAccessToken(rawToken), tokenPrefix: getTokenPrefix(rawToken) });
  }
  await prisma.accessToken.createMany({
    data: tokens.map((t) => ({ tokenHash: t.tokenHash, tokenPrefix: t.tokenPrefix, productId, expiresAt: parsedExpiry, notes: notes ?? null })),
  });
  return { count: tokens.length, tokens: tokens.map((t) => t.rawToken) };
};

const getAccessTokens = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.productId) where.productId = query.productId;
  if (query.status) where.status = query.status;
  if (query.assignedUserId) where.assignedUserId = query.assignedUserId;
  const [accessTokens, total] = await prisma.$transaction([
    prisma.accessToken.findMany({ where, select: ACCESS_TOKEN_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.accessToken.count({ where }),
  ]);
  return { accessTokens: accessTokens.map(formatAccessToken), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getAccessTokenById = async (accessTokenId) => {
  const accessToken = await prisma.accessToken.findUnique({ where: { id: accessTokenId }, select: ACCESS_TOKEN_SELECT });
  if (!accessToken) throw createError("Access token not found.", 404);
  return formatAccessToken(accessToken);
};

const updateAccessToken = async (accessTokenId, tokenData) => {
  const allowedFields = ["notes", "status", "expiresAt", "assignedUserId"];
  const data = {};
  for (const field of allowedFields) {
    if (tokenData[field] !== undefined) data[field] = field === "expiresAt" ? parseExpiry(tokenData[field]) : tokenData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No access token fields provided for update.");
  const accessToken = await prisma.accessToken.update({ where: { id: accessTokenId }, data, select: ACCESS_TOKEN_SELECT });
  return formatAccessToken(accessToken);
};

const revokeAccessToken = async (accessTokenId) => {
  const accessToken = await prisma.accessToken.update({ where: { id: accessTokenId }, data: { status: "REVOKED" }, select: ACCESS_TOKEN_SELECT });
  return formatAccessToken(accessToken);
};

const extendAccessToken = async (accessTokenId, days) => {
  const numberOfDays = Number.parseInt(days, 10);
  if (!Number.isInteger(numberOfDays) || numberOfDays <= 0) throw createError("Days must be a positive integer.");
  const accessToken = await prisma.accessToken.findUnique({ where: { id: accessTokenId }, select: { id: true, status: true, expiresAt: true } });
  if (!accessToken) throw createError("Access token not found.", 404);
  if (accessToken.status === "REVOKED") throw createError("Cannot extend a revoked access token.");
  const now = new Date();
  const baseDate = accessToken.expiresAt && accessToken.expiresAt > now ? accessToken.expiresAt : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + numberOfDays);
  const updated = await prisma.accessToken.update({
    where: { id: accessTokenId },
    data: { expiresAt: newExpiry, status: "ACTIVE" },
    select: ACCESS_TOKEN_SELECT,
  });
  return formatAccessToken(updated);
};

// ---------- Product functions ----------
const createProduct = async (productData) => {
  const { name, slug, description, type, status, isPublic } = productData;
  if (!name || !slug || !type) throw createError("Name, slug, and type are required.");
  return prisma.product.create({
    data: { name, slug, description: description ?? null, type, status: status ?? "ACTIVE", isPublic: isPublic ?? false },
    select: PRODUCT_SELECT,
  });
};

const getProducts = async (query = {}) => {
  const where = {};
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;
  return prisma.product.findMany({ where, select: PRODUCT_SELECT, orderBy: { createdAt: "desc" } });
};

const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { ...PRODUCT_SELECT, _count: { select: { accessTokens: true, publications: true } } },
  });
  if (!product) throw createError("Product not found.", 404);
  return product;
};

const updateProduct = async (productId, productData) => {
  const allowedFields = ["name", "slug", "description", "type", "status", "isPublic"];
  const data = {};
  for (const field of allowedFields) {
    if (productData[field] !== undefined) data[field] = productData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No product fields provided for update.");
  return prisma.product.update({ where: { id: productId }, data, select: PRODUCT_SELECT });
};

const updateProductStatus = async (productId, status) => {
  const validStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"];
  if (!validStatuses.includes(status)) throw createError("Invalid product status.");
  return prisma.product.update({ where: { id: productId }, data: { status }, select: PRODUCT_SELECT });
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