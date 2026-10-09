const crypto = require("crypto");
const prisma = require("../lib/prisma");
const BUSINESS_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

// Select user fields returned to the client
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

// Select tip fields returned to the client
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

// Select access token fields returned to the client, excluding the hash
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

// Create an error with an HTTP status the error handler can read
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  return error;
};

// Keep the service mutation boundary safe even when methods are called outside
// Express route middleware (CLI tools/tests/internal jobs).
const requireActiveAdmin = async (userId) => {
  if (!userId || typeof userId !== "string") {
    throw createError("Authentication required.", 401);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") throw createError("Active account required.", 403);
  if (user.role !== "ADMIN") throw createError("Admin access required.", 403);
  return user;
};

// Parse page and limit from the query string
const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getBusinessDayKey = (timestamp = Date.now()) =>
  new Date(timestamp + BUSINESS_UTC_OFFSET_MS).toISOString().slice(0, 10);

const shiftBusinessDay = (dayKey, offset) => {
  const day = new Date(`${dayKey}T00:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
};

const getBusinessDayRange = (dayKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw createError("Invalid admin tip date.", 400);
  const start = Date.parse(`${dayKey}T00:00:00.000Z`) - BUSINESS_UTC_OFFSET_MS;
  const end = Date.parse(`${dayKey}T23:59:59.999Z`) - BUSINESS_UTC_OFFSET_MS;
  return { gte: new Date(start), lte: new Date(end) };
};

// List users with filters and pagination
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

// Get a single user with their access tokens
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

// Update allowed user fields and check unique values first
const updateUser = async (userId, userData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  const allowedFields = ["email", "username", "firstName", "lastName", "telegramUsername", "telegramUserId", "role", "status"];
  const data = {};
  for (const field of allowedFields) {
    if (userData[field] !== undefined) data[field] = userData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No user fields provided for update.");

  // Build conflict checks only for unique fields being changed
  const uniqueChecks = [
    data.email ? { email: data.email, NOT: { id: userId } } : undefined,
    data.username ? { username: data.username, NOT: { id: userId } } : undefined,
    data.telegramUserId ? { telegramUserId: data.telegramUserId, NOT: { id: userId } } : undefined,
  ].filter(Boolean);

  if (uniqueChecks.length > 0) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: uniqueChecks },
      select: { id: true },
    });
    if (existingUser) throw createError("Email, username, or Telegram user ID is already in use.", 409);
  }

  const user = await prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
  return user;
};

// Update a user's status after validating it
const updateUserStatus = async (userId, status, actorId) => {
  await requireActiveAdmin(actorId);
  const validStatuses = ["ACTIVE", "SUSPENDED", "BANNED", "PENDING"];
  if (!validStatuses.includes(status)) throw createError("Invalid user status.");
  const user = await prisma.user.update({ where: { id: userId }, data: { status }, select: USER_SELECT });
  return user;
};

// Create a tip from allowed fields and check required fields
const createTip = async (tipData = {}, userId, actorId = userId) => {
  await requireActiveAdmin(actorId);
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

// List tips with filters and pagination
const getTips = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const today = getBusinessDayKey();
  if (query.day && query.day !== "today" && query.day !== "yesterday") {
    throw createError("Admin tip day must be today or yesterday.", 400);
  }
  const dayKey = query.day === "yesterday" ? shiftBusinessDay(today, -1) : today;
  const range = getBusinessDayRange(dayKey);
  where.AND = [{
    OR: [
      { scrapedAt: range },
      { scrapedAt: null, publishedAt: range },
      { scrapedAt: null, publishedAt: null, createdAt: range },
    ],
  }];
  if (query.status) where.status = query.status;
  if (query.outcome) where.outcome = query.outcome;
  if (query.sport) where.sport = query.sport;
  if (query.source) where.source = query.source;

  const [tips, total] = await prisma.$transaction([
    prisma.tip.findMany({
      where,
      select: {
        ...TIP_SELECT,
        publications: {
          select: { status: true, product: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tip.count({ where }),
  ]);
  return { tips, day: dayKey, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

// Get a single tip with its product publications
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

// Update allowed tip fields
const updateTip = async (tipId, tipData = {}, actorId) => {
  await requireActiveAdmin(actorId);
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

// Soft delete a tip by marking it cancelled
const deleteTip = async (tipId, actorId) => {
  await requireActiveAdmin(actorId);
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() },
    select: TIP_SELECT,
  });
};

// Validate a list of tip ids and remove duplicates
const validateTipIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) throw createError("At least one tip ID is required.");
  return [...new Set(ids)];
};

// Update allowed fields on many tips
const updateTipsBulk = async (ids, data, actorId) => {
  await requireActiveAdmin(actorId);
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

// Publish a single tip and record who published it
const publishTip = async (tipId, userId, actorId = userId) => {
  await requireActiveAdmin(actorId);
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: userId },
    select: TIP_SELECT,
  });
};

// Publish many tips and record who published them
const publishTipsBulk = async (ids, userId, actorId = userId) => {
  await requireActiveAdmin(actorId);
  const tipIds = validateTipIds(ids);
  const publishedAt = new Date();
  const result = await prisma.tip.updateMany({
    where: { id: { in: tipIds } },
    data: { status: "PUBLISHED", publishedAt, publishedById: userId },
  });
  return { message: "Tips published successfully.", updated: result.count };
};

// Unpublish a single tip by locking it
const unpublishTip = async (tipId, actorId) => {
  await requireActiveAdmin(actorId);
  return prisma.tip.update({ where: { id: tipId }, data: { status: "LOCKED" }, select: TIP_SELECT });
};

// Unpublish many tips by locking them
const unpublishTipsBulk = async (ids, actorId) => {
  await requireActiveAdmin(actorId);
  const tipIds = validateTipIds(ids);
  const result = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: { status: "LOCKED" } });
  return { message: "Tips unpublished successfully.", updated: result.count };
};

// Settle a single tip with a validated outcome
const settleTip = async (tipId, outcome, result, actorId, selectionOutcomes) => {
  await requireActiveAdmin(actorId);
  const validOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"];
  if (!validOutcomes.includes(outcome)) throw createError("Invalid tip outcome.");
  const data = { status: "SETTLED", outcome, result: result ?? null, settledAt: new Date() };

  if (selectionOutcomes !== undefined) {
    if (!Array.isArray(selectionOutcomes)) {
      throw createError("Selection outcomes must be an array.");
    }
    const currentTip = await prisma.tip.findUnique({
      where: { id: tipId },
      select: { tips: true },
    });
    if (!currentTip) throw createError("Tip not found.", 404);
    if (!Array.isArray(currentTip.tips) || selectionOutcomes.length !== currentTip.tips.length) {
      throw createError("Provide one outcome for each selection in this tip.");
    }

    data.tips = currentTip.tips.map((selection, index) => {
      if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
        throw createError("Tip selections must be valid objects before they can be settled.");
      }
      const selectionOutcome = String(selectionOutcomes[index] || "").toUpperCase();
      if (!validOutcomes.includes(selectionOutcome)) {
        throw createError(`Invalid outcome for selection ${index + 1}.`);
      }
      return { ...selection, outcome: selectionOutcome };
    });
  }

  return prisma.tip.update({
    where: { id: tipId },
    data,
    select: TIP_SELECT,
  });
};

// Settle many tips with a validated outcome
const settleTipsBulk = async (ids, outcome, result, actorId) => {
  await requireActiveAdmin(actorId);
  const tipIds = validateTipIds(ids);
  const validOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"];
  if (!validOutcomes.includes(outcome)) throw createError("Invalid tip outcome.");
  const updateData = { status: "SETTLED", outcome, settledAt: new Date() };
  if (result !== undefined) updateData.result = result;
  const updated = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: updateData });
  return { message: "Tips settled successfully.", updated: updated.count };
};

// Cancel a single tip
const cancelTip = async (tipId, actorId) => {
  await requireActiveAdmin(actorId);
  return prisma.tip.update({
    where: { id: tipId },
    data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() },
    select: TIP_SELECT,
  });
};

// Cancel many tips
const cancelTipsBulk = async (ids, actorId) => {
  await requireActiveAdmin(actorId);
  const tipIds = validateTipIds(ids);
  const result = await prisma.tip.updateMany({ where: { id: { in: tipIds } }, data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() } });
  return { message: "Tips cancelled successfully.", updated: result.count };
};

// Publish a tip to an active product, creating or reviving the publication
const publishTipToProduct = async (tipId, productId, actorId) => {
  await requireActiveAdmin(actorId);
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

// Mark a tip publication as unpublished
const removeTipPublication = async (tipId, productId, actorId) => {
  await requireActiveAdmin(actorId);
  const publication = await prisma.tipPublication.findUnique({ where: { tipId_productId: { tipId, productId } } });
  if (!publication) throw createError("Tip publication not found.", 404);
  return prisma.tipPublication.update({
    where: { id: publication.id },
    data: { status: "UNPUBLISHED", unpublishedAt: new Date() },
    include: { product: { select: PRODUCT_SELECT } },
  });
};

// Generate a random raw access token
const generateRawAccessToken = () => crypto.randomBytes(32).toString("hex");

// Hash an access token for storage
const hashAccessToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Get the display prefix of an access token
const getTokenPrefix = (token) => token.slice(0, 10);

// Shape an access token for the response
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

// Parse an optional expiry date
const parseExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) throw createError("Invalid expiration date.");
  return date;
};

// Resolve the registered user an access token is being issued to. Tokens are
// only ever minted by an admin for a specific, active, registered account so
// that every token has exactly one owner and access cannot be transferred.
const resolveAssignedUser = async (assignedUserId) => {
  if (!assignedUserId || typeof assignedUserId !== "string" || !assignedUserId.trim()) {
    throw createError("A registered user must be selected for this token.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: assignedUserId.trim() },
    select: { id: true, status: true },
  });

  if (!user) throw createError("The selected user does not exist.", 404);
  if (user.status !== "ACTIVE") {
    throw createError("Tokens can only be issued to an active user.", 400);
  }

  return user.id;
};

// Create a single access token for an active product and a registered user.
// The raw token is returned exactly once so the admin can pass it on.
const createAccessToken = async (tokenData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  const { productId, expiresAt, notes, assignedUserId } = tokenData;
  if (!productId) throw createError("Product ID is required.");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
  if (!product) throw createError("Product not found.", 404);
  if (product.status !== "ACTIVE") throw createError("Cannot create a token for an inactive product.");

  const ownerId = await resolveAssignedUser(assignedUserId);

  const rawToken = generateRawAccessToken();
  const tokenHash = hashAccessToken(rawToken);
  const accessToken = await prisma.accessToken.create({
    data: { tokenHash, tokenPrefix: getTokenPrefix(rawToken), productId, assignedUserId: ownerId, expiresAt: parseExpiry(expiresAt), notes: notes ?? null },
    select: ACCESS_TOKEN_SELECT,
  });
  return { token: rawToken, accessToken: formatAccessToken(accessToken) };
};

// Create many access tokens for an active product, all assigned to the same
// registered user.
const createAccessTokensBulk = async (tokenData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  const { productId, count, expiresAt, notes, assignedUserId } = tokenData;
  const tokenCount = Number.parseInt(count, 10);
  if (!productId) throw createError("Product ID is required.");
  if (!Number.isInteger(tokenCount) || tokenCount < 1 || tokenCount > 1000) throw createError("Token count must be between 1 and 1000.");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
  if (!product) throw createError("Product not found.", 404);
  if (product.status !== "ACTIVE") throw createError("Cannot create tokens for an inactive product.");

  const ownerId = await resolveAssignedUser(assignedUserId);

  const parsedExpiry = parseExpiry(expiresAt);
  const tokens = [];
  for (let i = 0; i < tokenCount; i++) {
    const rawToken = generateRawAccessToken();
    tokens.push({ rawToken, tokenHash: hashAccessToken(rawToken), tokenPrefix: getTokenPrefix(rawToken) });
  }
  await prisma.accessToken.createMany({
    data: tokens.map((t) => ({ tokenHash: t.tokenHash, tokenPrefix: t.tokenPrefix, productId, assignedUserId: ownerId, expiresAt: parsedExpiry, notes: notes ?? null })),
  });
  return { count: tokens.length, tokens: tokens.map((t) => t.rawToken) };
};

// List access tokens with filters and pagination
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

// Get a single access token by id
const getAccessTokenById = async (accessTokenId) => {
  const accessToken = await prisma.accessToken.findUnique({ where: { id: accessTokenId }, select: ACCESS_TOKEN_SELECT });
  if (!accessToken) throw createError("Access token not found.", 404);
  return formatAccessToken(accessToken);
};

// Update allowed access token fields. The assigned user is deliberately not
// reassignable here: a token always belongs to the user it was issued to, so
// ownership can only be fixed at creation time.
const updateAccessToken = async (accessTokenId, tokenData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  if (tokenData.assignedUserId !== undefined) {
    throw createError("An access token cannot be reassigned to a different user.", 400);
  }

  const allowedFields = ["notes", "status", "expiresAt"];
  if (tokenData.status !== undefined && !["ACTIVE", "REVOKED", "EXPIRED"].includes(tokenData.status)) {
    throw createError("Invalid access token status.", 400);
  }
  const data = {};
  for (const field of allowedFields) {
    if (tokenData[field] !== undefined) data[field] = field === "expiresAt" ? parseExpiry(tokenData[field]) : tokenData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No access token fields provided for update.");
  const accessToken = await prisma.accessToken.update({ where: { id: accessTokenId }, data, select: ACCESS_TOKEN_SELECT });
  return formatAccessToken(accessToken);
};

// Revoke an access token
const revokeAccessToken = async (accessTokenId, actorId) => {
  await requireActiveAdmin(actorId);
  const accessToken = await prisma.accessToken.update({ where: { id: accessTokenId }, data: { status: "REVOKED" }, select: ACCESS_TOKEN_SELECT });
  return formatAccessToken(accessToken);
};

// Permanently delete an access token. This is distinct from revocation, which
// preserves the token record for audit/history purposes.
const deleteAccessToken = async (accessTokenId, actorId) => {
  await requireActiveAdmin(actorId);
  const existing = await prisma.accessToken.findUnique({ where: { id: accessTokenId }, select: { id: true } });
  if (!existing) throw createError("Access token not found.", 404);
  await prisma.accessToken.delete({ where: { id: accessTokenId } });
  return { message: "Access token deleted successfully.", id: accessTokenId };
};

// Extend an access token from its current expiry or from now
const extendAccessToken = async (accessTokenId, days, actorId) => {
  await requireActiveAdmin(actorId);
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

// Create a product after checking required fields
const createProduct = async (productData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  const { name, slug, description, type, status, isPublic } = productData;
  if (!name || !slug || !type) throw createError("Name, slug, and type are required.");
  return prisma.product.create({
    data: { name, slug, description: description ?? null, type, status: status ?? "ACTIVE", isPublic: isPublic ?? false },
    select: PRODUCT_SELECT,
  });
};

// List products with filters
const getProducts = async (query = {}) => {
  const where = {};
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;
  return prisma.product.findMany({ where, select: PRODUCT_SELECT, orderBy: { createdAt: "desc" } });
};

// Get a single product with token and publication counts
const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { ...PRODUCT_SELECT, _count: { select: { accessTokens: true, publications: true } } },
  });
  if (!product) throw createError("Product not found.", 404);
  return product;
};

// Update allowed product fields
const updateProduct = async (productId, productData = {}, actorId) => {
  await requireActiveAdmin(actorId);
  const allowedFields = ["name", "slug", "description", "type", "status", "isPublic"];
  const data = {};
  for (const field of allowedFields) {
    if (productData[field] !== undefined) data[field] = productData[field];
  }
  if (Object.keys(data).length === 0) throw createError("No product fields provided for update.");
  return prisma.product.update({ where: { id: productId }, data, select: PRODUCT_SELECT });
};

// Update a product's status after validating it
const updateProductStatus = async (productId, status, actorId) => {
  await requireActiveAdmin(actorId);
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
  deleteAccessToken,
  extendAccessToken,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
};
