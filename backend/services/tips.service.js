const prisma = require("../lib/prisma");

// List keys removed from tips before they reach the client
const sourceMetadataKeys = new Set([
  "source",
  "externalid",
  "detailsurl",
  "url",
  "beturl",
  "bookmaker",
  "previewtitle",
  "sourcename",
  "sourceurl",
  "provider",
  "providername",
  "affiliateurl",
]);

// List outcomes that mark a tip as settled
const settledOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"];

// List outcomes accepted by the archive filter
const archiveOutcomes = ["PENDING", "WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST"];

// List archive tiers that can be requested
const archiveTiers = ["free", "vip", "maxbet"];

// Create an error with an HTTP status the error handler can read
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  return error;
};

// Get today's date in YYYY-MM-DD format using UTC
const getTodayKey = () => new Date().toISOString().slice(0, 10);

// Decide which day a tip list defaults to. An explicit day/from/to always wins.
// Otherwise use today when it has published tips, and otherwise fall back to the
// most recent day that does, so the pages are never blank just because today's
// scrape has not run yet.
const resolveDefaultDay = async (query = {}) => {
  if (query.day || query.from || query.to) return null;

  const today = getTodayKey();
  const todayCount = await prisma.tip.count({
    where: {
      status: { not: "CANCELLED" },
      scrapedAt: { gte: new Date(`${today}T00:00:00.000Z`), lte: new Date(`${today}T23:59:59.999Z`) },
    },
  });

  if (todayCount > 0) return today;
  return await getLatestPublishedDay();
};

// Parse page and limit from the query string
const getPagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);

  return { page, limit, skip: (page - 1) * limit };
};

// Build the pagination object returned with list results
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

// Remove source metadata keys and URLs from a value recursively
const stripSourceMetadata = (value) => {
  if (Array.isArray(value)) return value.map(stripSourceMetadata);
  if (typeof value === "string") return value.replace(/https?:\/\/\S+/gi, "").trim();
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date || value.constructor?.name === "Decimal") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sourceMetadataKeys.has(key.toLowerCase()))
      .map(([key, nestedValue]) => [key, stripSourceMetadata(nestedValue)])
  );
};

// Shape a tip for the client and convert Decimal fields to numbers
const formatTip = (tip) => {
  if (!tip) return null;

  return {
    ...stripSourceMetadata(tip),
    odds: tip.odds ? Number(tip.odds) : null,
    stakeUnits: tip.stakeUnits ? Number(tip.stakeUnits) : null,
    confidenceIndex: tip.confidenceIndex ? Number(tip.confidenceIndex) : null,
  };
};

// Parse a YYYY-MM-DD date as the start or end of that day in UTC
const parseArchiveDate = (value, endOfDay = false) => {
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError("Archive dates must use YYYY-MM-DD format.", 400);
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw createError("Invalid archive date.", 400);

  return date;
};

// Filter tips to one day by scrape date, falling back to creation date
const addPublishedDayFilter = (where, query, defaultDay = null) => {
  const day = query.day || defaultDay;
  if (!day) return;

  const dateFrom = parseArchiveDate(day);
  const dateTo = parseArchiveDate(day, true);

  where.AND = [
    {
      OR: [
        { scrapedAt: { gte: dateFrom, lte: dateTo } },
        { scrapedAt: null, createdAt: { gte: dateFrom, lte: dateTo } },
      ],
    },
  ];
};

// Add optional sport and outcome filters from the query
const addTipFilters = (where, query) => {
  if (query.sport) where.sport = query.sport;
  if (query.outcome) where.outcome = query.outcome;
};

// Fetch a page of tips and the total count for a filter. `day` reports the day
// actually served so a client can label the result when it defaulted.
const findTipPage = async (where, query, day = null) => {
  const { page, limit, skip } = getPagination(query);

  const [tips, total] = await Promise.all([
    prisma.tip.findMany({ where, skip, take: limit, orderBy: { kickoff: "asc" } }),
    prisma.tip.count({ where }),
  ]);

  return {
    data: tips.map(formatTip),
    pagination: buildPagination(page, limit, total),
    day,
  };
};

// List today's tips published to any active public product
const getTips = async (query = {}) => {
  const where = {
    status: { not: "CANCELLED" },
    publications: {
      some: {
        status: "PUBLISHED",
        product: { status: "ACTIVE", isPublic: true },
      },
    },
  };

  addTipFilters(where, query);
  const day = query.day || (await resolveDefaultDay(query));
  addPublishedDayFilter(where, query, day);

  return findTipPage(where, query, day);
};

// List today's tips published to the free product
const getFreeTips = async (query = {}) => {
  const freeProduct = await prisma.product.findUnique({ where: { slug: "free" } });

  if (!freeProduct) throw createError("Free product not found.", 404);

  const where = {
    status: { not: "CANCELLED" },
    publications: {
      some: { productId: freeProduct.id, status: "PUBLISHED" },
    },
  };

  addTipFilters(where, query);
  const day = query.day || (await resolveDefaultDay(query));
  addPublishedDayFilter(where, query, day);

  return findTipPage(where, query, day);
};

// Check that a user can view a product, allowing public products and admins
const hasProductAccess = async (userId, productSlug, isAdmin = false) => {
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: { id: true, isPublic: true },
  });

  if (!product) throw createError("Product not found.", 404);

  if (product.isPublic || isAdmin) return product;

  const accessToken = await prisma.accessToken.findFirst({
    where: {
      productId: product.id,
      assignedUserId: userId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (!accessToken) throw createError("You do not have access to this product.", 403);

  return product;
};

// List today's tips for a paid product after checking access
const getProtectedTips = async (userId, productSlug, query = {}, isAdmin = false) => {
  const product = await hasProductAccess(userId, productSlug, isAdmin);

  const where = {
    status: { not: "CANCELLED" },
    publications: {
      some: { productId: product.id, status: "PUBLISHED" },
    },
  };

  addTipFilters(where, query);
  const day = query.day || (await resolveDefaultDay(query));
  addPublishedDayFilter(where, query, day);

  return findTipPage(where, query, day);
};

// List VIP tips after checking access
const getVipTips = async (userId, query, isAdmin = false) => {
  return getProtectedTips(userId, "vip", query, isAdmin);
};

// List MaxBet tips after checking access
const getMaxbetTips = async (userId, query, isAdmin = false) => {
  return getProtectedTips(userId, "maxbet", query, isAdmin);
};

// Get the most recent day that has published tips. Tip and archive lists fall
// back to this when the current day has not been scraped yet, so the pages
// always show the latest available data instead of an empty result.
const getLatestPublishedDay = async () => {
  const latest = await prisma.tip.findFirst({
    where: { status: { not: "CANCELLED" } },
    orderBy: { scrapedAt: "desc" },
    select: { scrapedAt: true },
  });

  if (!latest?.scrapedAt) return null;
  return new Date(latest.scrapedAt).toISOString().slice(0, 10);
};

// List products whose tips can be shown, currently every active product
const getVisibleProducts = async () => {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, slug: true, name: true },
  });

  /*
  const where = { status: "ACTIVE" };

  if (isAdmin) {
    return prisma.product.findMany({ where, select: { id: true, slug: true, name: true } });
  }

  const visibleProductConditions = [{ isPublic: true }];
  if (userId) {
    visibleProductConditions.push({
      accessTokens: {
        some: {
          assignedUserId: userId,
          status: "ACTIVE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    });
  }

  return prisma.product.findMany({
    where: { ...where, OR: visibleProductConditions },
    select: { id: true, slug: true, name: true },
  });
  */
};

// List archived tips with tier, sport, outcome, search and date filters
const getArchive = async (query, userId, isAdmin = false) => {
  const visibleProducts = await getVisibleProducts(userId, isAdmin);
  const visibleTiers = visibleProducts.map(({ slug, name }) => ({ slug, name }));

  // Validate the requested tier
  const requestedTier = String(query.tier || "").toLowerCase();
  if (requestedTier && !archiveTiers.includes(requestedTier)) {
    throw createError("Unsupported archive tier.", 400);
  }
  if (requestedTier && !visibleProducts.some((product) => product.slug === requestedTier)) {
    throw createError("Archive tier not found.", 404);
  }

  const selectedProducts = requestedTier
    ? visibleProducts.filter((product) => product.slug === requestedTier)
    : visibleProducts;
  const visibleProductIds = selectedProducts.map((product) => product.id);

  if (visibleProductIds.length === 0) {
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      sports: [],
      tierSports: {},
      tiers: visibleTiers,
      day: query.day || null,
    };
  }

  const { page, limit, skip } = getPagination(query);

  const where = {
    status: { not: "CANCELLED" },
    publications: {
      some: { productId: { in: visibleProductIds }, status: "PUBLISHED" },
    },
  };

  if (query.sport) where.sport = query.sport;

  // Validate and apply the outcome filter
  if (query.outcome) {
    if (!archiveOutcomes.includes(query.outcome.toUpperCase())) {
      throw createError("Unsupported archive outcome.", 400);
    }
    where.outcome = query.outcome.toUpperCase();
  }

  // Search team, competition, league and selection fields
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = ["homeTeam", "awayTeam", "competition", "league", "selection"].map((field) => ({
      [field]: { contains: term, mode: "insensitive" },
    }));
  }

  // Use a single day when given or defaulted, otherwise the from and to range.
  // Like the live tip lists, fall back to the most recent day that has data so
  // the archive is not empty before the current day's scrape runs.
  const defaultDay = !query.day && !query.from && !query.to ? await resolveDefaultDay(query) : null;
  const day = query.day || defaultDay;
  const dateFrom = day ? parseArchiveDate(day) : parseArchiveDate(query.from);
  const dateTo = day ? parseArchiveDate(day, true) : parseArchiveDate(query.to, true);

  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = dateFrom;
    if (dateTo) range.lte = dateTo;

    where.AND = [
      {
        OR: [{ scrapedAt: range }, { scrapedAt: null, createdAt: range }],
      },
    ];
  }

  const [tips, total, sports] = await Promise.all([
    prisma.tip.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ scrapedAt: "desc" }, { createdAt: "desc" }],
      include: {
        publications: {
          where: { productId: { in: visibleProductIds }, status: "PUBLISHED" },
          select: { product: { select: { name: true, slug: true } } },
        },
      },
    }),
    prisma.tip.count({ where }),
    prisma.tip.groupBy({
      by: ["sport"],
      where: {
        status: { not: "CANCELLED" },
        publications: {
          some: { productId: { in: visibleProductIds }, status: "PUBLISHED" },
        },
      },
      orderBy: { sport: "asc" },
    }),
  ]);

  // Collect the distinct sports available in each visible tier
  const tierSports = {};
  for (const product of visibleProducts) {
    const tierTips = await prisma.tip.findMany({
      where: {
        ...where,
        publications: { some: { productId: product.id, status: "PUBLISHED" } },
      },
      distinct: ["sport"],
      select: { sport: true },
      orderBy: { sport: "asc" },
    });
    tierSports[product.slug] = tierTips.map((tip) => tip.sport);
  }

  return {
    data: tips.map((tip) => {
      const tiers = [...new Set(tip.publications.map((publication) => publication.product.slug))];
      return formatTip({ ...tip, tier: tiers[0] || "free", tiers });
    }),
    pagination: buildPagination(page, limit, total),
    sports: sports.map((item) => item.sport),
    tierSports,
    tiers: visibleTiers,
    // Report the day actually served so a client can show and reuse it when it
    // had defaulted to today but today had no records.
    day: day || null,
  };
};

// Get a tip if it is published to a product the user can see
const getTipById = async (tipId, userId, isAdmin = false) => {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: {
      publications: {
        where: { status: "PUBLISHED" },
        select: {
          product: { select: { id: true, name: true, slug: true, type: true } },
          publishedAt: true,
        },
      },
    },
  });

  if (!tip) throw createError("Tip not found.", 404);

  // Keep only publications for visible products
  const visibleProducts = await getVisibleProducts(userId, isAdmin);
  const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
  const visiblePublications = tip.publications.filter((publication) =>
    visibleProductIds.has(publication.product.id)
  );

  if (visiblePublications.length === 0) throw createError("Tip not found.", 404);

  tip.publications = visiblePublications;
  return formatTip(tip);
};

// Create a tip owned by the user
const createTip = async (userId, tipData = {}) => {
  const {
    source,
    externalId,
    sport,
    competition,
    league,
    country,
    homeTeam,
    awayTeam,
    kickoff,
    market,
    selection,
    odds,
    stakeUnits,
    previewTitle,
    preview,
    verdict,
    tips,
    analytics,
    confidenceIndex,
    predictedScore,
    detailsUrl,
    extraTips,
    status,
    outcome,
  } = tipData;

  const tip = await prisma.tip.create({
    data: {
      source,
      externalId,
      sport,
      competition,
      league,
      country,
      homeTeam,
      awayTeam,
      kickoff,
      market,
      selection,
      odds,
      stakeUnits,
      previewTitle,
      preview,
      verdict,
      tips,
      analytics,
      confidenceIndex,
      predictedScore,
      detailsUrl,
      extraTips,
      status: status || "PENDING",
      outcome: outcome || "PENDING",
      createdById: userId,
    },
  });

  return formatTip(tip);
};

// Update a tip and keep publish and settle timestamps in step
const updateTip = async (tipId, userId, tipData = {}) => {
  const existingTip = await prisma.tip.findUnique({ where: { id: tipId } });

  if (!existingTip) throw createError("Tip not found.", 404);

  const {
    source,
    externalId,
    sport,
    competition,
    league,
    country,
    homeTeam,
    awayTeam,
    kickoff,
    market,
    selection,
    odds,
    stakeUnits,
    previewTitle,
    preview,
    verdict,
    tips,
    analytics,
    confidenceIndex,
    predictedScore,
    detailsUrl,
    extraTips,
    status,
    outcome,
  } = tipData;

  const tip = await prisma.tip.update({
    where: { id: tipId },
    data: {
      source,
      externalId,
      sport,
      competition,
      league,
      country,
      homeTeam,
      awayTeam,
      kickoff,
      market,
      selection,
      odds,
      stakeUnits,
      previewTitle,
      preview,
      verdict,
      tips,
      analytics,
      confidenceIndex,
      predictedScore,
      detailsUrl,
      extraTips,
      status,
      outcome,
      publishedAt: status === "PUBLISHED" ? existingTip.publishedAt || new Date() : existingTip.publishedAt,
      publishedById: status === "PUBLISHED" ? userId : existingTip.publishedById,
      settledAt: outcome && settledOutcomes.includes(outcome) ? new Date() : existingTip.settledAt,
    },
  });

  return formatTip(tip);
};

// Update a tip's result and settle it when the outcome is final
const updateTipResult = async (tipId, userId, resultData = {}) => {
  const { result, outcome } = resultData;

  const existingTip = await prisma.tip.findUnique({ where: { id: tipId } });

  if (!existingTip) throw createError("Tip not found.", 404);

  const isSettled = settledOutcomes.includes(outcome);

  // Keep the existing settle time when no outcome is sent
  const settledAt = outcome === undefined ? existingTip.settledAt : isSettled ? new Date() : null;

  const tip = await prisma.tip.update({
    where: { id: tipId },
    data: {
      result,
      outcome,
      status: isSettled ? "SETTLED" : existingTip.status,
      settledAt,
    },
  });

  return formatTip(tip);
};

// Soft delete a tip by marking it cancelled
const deleteTip = async (tipId, userId) => {
  const existingTip = await prisma.tip.findUnique({ where: { id: tipId } });

  if (!existingTip) throw createError("Tip not found.", 404);

  await prisma.tip.update({
    where: { id: tipId },
    data: { status: "CANCELLED", outcome: "CANCELLED", settledAt: new Date() },
  });

  return { message: "Tip cancelled successfully." };
};

module.exports = {
  getTips,
  getFreeTips,
  getVipTips,
  getMaxbetTips,
  getArchive,
  getTipById,
  createTip,
  updateTip,
  updateTipResult,
  deleteTip,
  getLatestPublishedDay,
};