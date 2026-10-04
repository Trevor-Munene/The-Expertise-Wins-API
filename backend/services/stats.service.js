const prisma = require("../lib/prisma");

// List outcomes that count as settled
const settledOutcomes = ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST"];

// Create an error with an HTTP status the error handler can read
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  return error;
};

// Get the date a number of days ago
const getPeriodStart = (days) => {
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start;
};

// Get midnight at the start of today
const getStartOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

// Get midnight on January 1 of the current year
const getStartOfYear = () => {
  const start = new Date();
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Calculate outcome counts, win rate, profit and ROI for matching tips
const getTipStats = async (where = {}) => {
  const tips = await prisma.tip.findMany({
    where,
    select: {
      id: true,
      odds: true,
      stakeUnits: true,
      outcome: true,
      status: true,
    },
  });

  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let voids = 0;
  let halfWins = 0;
  let halfLosses = 0;
  let cancelled = 0;
  let pending = 0;

  let totalStake = 0;
  let profit = 0;

  for (const tip of tips) {
    const odds = tip.odds ? Number(tip.odds) : 0;
    const stake = tip.stakeUnits ? Number(tip.stakeUnits) : 1;

    switch (tip.outcome) {
      case "WON":
        wins += 1;
        profit += stake * (odds - 1);
        break;

      case "LOST":
        losses += 1;
        profit -= stake;
        break;

      case "PUSH":
        pushes += 1;
        break;

      case "VOID":
        voids += 1;
        break;

      case "HALF_WON":
        halfWins += 1;
        profit += (stake * (odds - 1)) / 2;
        break;

      case "HALF_LOST":
        halfLosses += 1;
        profit -= stake / 2;
        break;

      // Count cancelled tips separately so they are not reported as pending
      case "CANCELLED":
        cancelled += 1;
        break;

      default:
        pending += 1;
        break;
    }

    // Count stake only for settled tips so open tips do not dilute ROI
    if (settledOutcomes.includes(tip.outcome)) totalStake += stake;
  }

  const settled = wins + losses + pushes + voids + halfWins + halfLosses;

  const winRate = settled > 0 ? ((wins + halfWins * 0.5) / settled) * 100 : 0;

  const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;

  return {
    totalTips: tips.length,
    settled,
    wins,
    losses,
    pushes,
    voids,
    halfWins,
    halfLosses,
    cancelled,
    pending,
    winRate: Number(winRate.toFixed(2)),
    totalStake: Number(totalStake.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    roi: Number(roi.toFixed(2)),
  };
};

// Get a product by slug or throw when it does not exist
const getProduct = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  });

  if (!product) throw createError("Product not found.", 404);

  return product;
};

// Calculate stats for tips published to a product
const getProductStats = async (slug, where = {}) => {
  const product = await getProduct(slug);

  return getTipStats({
    ...where,
    publications: {
      some: {
        productId: product.id,
        status: "PUBLISHED",
      },
    },
  });
};

// Calculate stats for tips created since a date
const getTimeStats = async (startDate) => {
  return getTipStats({
    createdAt: { gte: startDate },
  });
};

// Summarise usage events from the last 30 days
const getUsageStats = async () => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalEvents, uniqueUsers, topPaths, daily] = await Promise.all([
    prisma.usageEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.usageEvent.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.usageEvent.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.usageEvent.groupBy({
      by: ["event"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { event: "desc" } },
      take: 10,
    }),
  ]);

  return { periodDays: 30, totalEvents, uniqueUsers: uniqueUsers.length, topPaths, daily };
};

// Get headline counts and overall performance
const getOverview = async () => {
  const [totalTips, publishedTips, settledTips, pendingTips, wins, losses] = await Promise.all([
    prisma.tip.count(),
    prisma.tip.count({ where: { status: "PUBLISHED" } }),
    prisma.tip.count({ where: { outcome: { in: settledOutcomes } } }),
    prisma.tip.count({ where: { outcome: "PENDING" } }),
    prisma.tip.count({ where: { outcome: "WON" } }),
    prisma.tip.count({ where: { outcome: "LOST" } }),
  ]);

  const performance = await getTipStats();

  return {
    totalTips,
    publishedTips,
    settledTips,
    pendingTips,
    wins,
    losses,
    winRate: performance.winRate,
    roi: performance.roi,
    profit: performance.profit,
    totalStake: performance.totalStake,
  };
};

// Get stats for tips created today
const getTodayStats = async () => {
  return getTimeStats(getStartOfToday());
};

// Get stats for the last 7 days
const getWeeklyStats = async () => {
  return getTimeStats(getPeriodStart(7));
};

// Get stats for the last 14 days
const getFourteenDayStats = async () => {
  return getTimeStats(getPeriodStart(14));
};

// Get stats for the last 30 days
const getMonthlyStats = async () => {
  return getTimeStats(getPeriodStart(30));
};

// Get stats since the start of the year
const getYearlyStats = async () => {
  return getTimeStats(getStartOfYear());
};

// Get stats for all tips
const getAllTimeStats = async () => {
  return getTipStats();
};

// Get stats for the free product
const getFreeStats = async () => {
  return getProductStats("free");
};

// Get stats for the VIP product after checking access
const getVipStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "vip", isAdmin);
  return getProductStats("vip");
};

// Get stats for the MaxBet product after checking access
const getMaxbetStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "maxbet", isAdmin);
  return getProductStats("maxbet");
};

// Get free product stats for the last 7 days
const getFreeWeeklyStats = async () => {
  return getProductStats("free", { createdAt: { gte: getPeriodStart(7) } });
};

// Get free product stats for the last 30 days
const getFreeMonthlyStats = async () => {
  return getProductStats("free", { createdAt: { gte: getPeriodStart(30) } });
};

// Get VIP product stats for the last 7 days after checking access
const getVipWeeklyStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "vip", isAdmin);
  return getProductStats("vip", { createdAt: { gte: getPeriodStart(7) } });
};

// Get VIP product stats for the last 30 days after checking access
const getVipMonthlyStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "vip", isAdmin);
  return getProductStats("vip", { createdAt: { gte: getPeriodStart(30) } });
};

// Get MaxBet product stats for the last 7 days after checking access
const getMaxbetWeeklyStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "maxbet", isAdmin);
  return getProductStats("maxbet", { createdAt: { gte: getPeriodStart(7) } });
};

// Get MaxBet product stats for the last 30 days after checking access
const getMaxbetMonthlyStats = async (userId, isAdmin = false) => {
  await verifyProductAccess(userId, "maxbet", isAdmin);
  return getProductStats("maxbet", { createdAt: { gte: getPeriodStart(30) } });
};

// Get stats for settled tips
const getResults = async () => {
  return getTipStats({ outcome: { in: settledOutcomes } });
};

// Get stats for won tips
const getWins = async () => {
  return getTipStats({ outcome: "WON" });
};

// Get stats for lost tips
const getLosses = async () => {
  return getTipStats({ outcome: "LOST" });
};

// Get stats for pending tips
const getPending = async () => {
  return getTipStats({ outcome: "PENDING" });
};

// Get the overall win rate with its counts
const getWinRate = async () => {
  const stats = await getTipStats();

  return {
    winRate: stats.winRate,
    settled: stats.settled,
    wins: stats.wins,
    losses: stats.losses,
  };
};

// Get the overall ROI with profit and stake
const getRoi = async () => {
  const stats = await getTipStats();

  return {
    roi: stats.roi,
    profit: stats.profit,
    totalStake: stats.totalStake,
  };
};

// Calculate count, average, minimum and maximum odds
const getOddsStats = async () => {
  const tips = await prisma.tip.findMany({
    where: { odds: { not: null } },
    select: { odds: true },
  });

  const odds = tips.map((tip) => Number(tip.odds));

  if (odds.length === 0) {
    return { count: 0, average: 0, minimum: 0, maximum: 0 };
  }

  const total = odds.reduce((sum, value) => sum + value, 0);

  return {
    count: odds.length,
    average: Number((total / odds.length).toFixed(2)),
    minimum: Math.min(...odds),
    maximum: Math.max(...odds),
  };
};

// Calculate count, total, average, minimum and maximum stakes
const getStakeStats = async () => {
  const tips = await prisma.tip.findMany({
    where: { stakeUnits: { not: null } },
    select: { stakeUnits: true },
  });

  const stakes = tips.map((tip) => Number(tip.stakeUnits));

  if (stakes.length === 0) {
    return { count: 0, total: 0, average: 0, minimum: 0, maximum: 0 };
  }

  const total = stakes.reduce((sum, value) => sum + value, 0);

  return {
    count: stakes.length,
    total: Number(total.toFixed(2)),
    average: Number((total / stakes.length).toFixed(2)),
    minimum: Math.min(...stakes),
    maximum: Math.max(...stakes),
  };
};

// Group tips by a field and calculate win rate per group
const getGroupedStats = async (field) => {
  const where = field === "competition" ? { [field]: { not: null } } : {};
  const tips = await prisma.tip.findMany({
    where,
    select: {
      [field]: true,
      outcome: true,
      odds: true,
      stakeUnits: true,
    },
  });

  const groups = {};

  for (const tip of tips) {
    const key = tip[field] || "Unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(tip);
  }

  const results = {};

  for (const [key, group] of Object.entries(groups)) {
    const wins = group.filter((tip) => tip.outcome === "WON").length;
    const losses = group.filter((tip) => tip.outcome === "LOST").length;
    const settled = group.filter((tip) => settledOutcomes.includes(tip.outcome)).length;

    results[key] = {
      totalTips: group.length,
      wins,
      losses,
      settled,
      winRate: settled > 0 ? Number(((wins / settled) * 100).toFixed(2)) : 0,
    };
  }

  return results;
};

// Get stats grouped by sport
const getSportStats = async () => {
  return getGroupedStats("sport");
};

// Get stats grouped by market
const getMarketStats = async () => {
  return getGroupedStats("market");
};

// Get stats grouped by competition
const getCompetitionStats = async () => {
  return getGroupedStats("competition");
};

// Get stats grouped by source
const getSourceStats = async () => {
  return getGroupedStats("source");
};

// Count tips by volume category
const getVolumeStats = async () => {
  const [total, pending, settled, published, cancelled] = await Promise.all([
    prisma.tip.count(),
    prisma.tip.count({ where: { outcome: "PENDING" } }),
    prisma.tip.count({ where: { outcome: { in: settledOutcomes } } }),
    prisma.tip.count({ where: { status: "PUBLISHED" } }),
    prisma.tip.count({ where: { status: "CANCELLED" } }),
  ]);

  return { total, pending, settled, published, cancelled };
};

// Count scraped and manual tips
const getScrapedStats = async () => {
  const [total, withScrapedAt] = await Promise.all([
    prisma.tip.count(),
    prisma.tip.count({ where: { scrapedAt: { not: null } } }),
  ]);

  return {
    totalTips: total,
    scrapedTips: withScrapedAt,
    manualTips: total - withScrapedAt,
  };
};

// Count published tips overall and per active product
const getPublishedStats = async () => {
  const [publishedTips, publications, products] = await Promise.all([
    prisma.tip.count({ where: { publishedAt: { not: null } } }),
    prisma.tipPublication.count({ where: { status: "PUBLISHED" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const productStats = await Promise.all(
    products.map(async (product) => {
      const count = await prisma.tipPublication.count({
        where: { productId: product.id, status: "PUBLISHED" },
      });

      return {
        product: product.name,
        slug: product.slug,
        publishedTips: count,
      };
    })
  );

  return { publishedTips, publications, products: productStats };
};

// Build the full report with overview, products, sports and markets
const getPerformanceReport = async () => {
  const [overview, products, sports, markets] = await Promise.all([
    getAllTimeStats(),
    getProductReports(),
    getSportStats(),
    getMarketStats(),
  ]);

  return { overview, products, sports, markets };
};

// Build the report for the last 7 days
const getWeeklyReport = async () => {
  return getReportForPeriod(getPeriodStart(7));
};

// Build the report for the last 30 days
const getMonthlyReport = async () => {
  return getReportForPeriod(getPeriodStart(30));
};

// Build the report since the start of the year
const getYearlyReport = async () => {
  return getReportForPeriod(getStartOfYear());
};

// Build a report for tips created since a date
const getReportForPeriod = async (startDate) => {
  const performance = await getTimeStats(startDate);

  return {
    periodStart: startDate,
    periodEnd: new Date(),
    performance,
  };
};

// Build performance stats for every active product
const getProductReports = async () => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { name: true, slug: true },
  });

  return Promise.all(
    products.map(async (product) => ({
      product: product.name,
      slug: product.slug,
      performance: await getProductStats(product.slug),
    }))
  );
};

// Check that a user can view a product, allowing free products and admins
const verifyProductAccess = async (userId, productSlug, isAdmin = false) => {
  const product = await getProduct(productSlug);

  if (product.slug === "free" || isAdmin) return product;

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

// Build performance stats for products the user can access
const getMyAccessStats = async (userId) => {
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
    select: { id: true, name: true, slug: true },
  });

  const stats = await Promise.all(
    products.map(async (product) => ({
      product: product.name,
      slug: product.slug,
      performance: await getProductStats(product.slug),
    }))
  );

  return stats;
};

module.exports = {
  getOverview,
  getUsageStats,
  getTodayStats,
  getWeeklyStats,
  getFourteenDayStats,
  getMonthlyStats,
  getYearlyStats,
  getAllTimeStats,
  getFreeStats,
  getVipStats,
  getMaxbetStats,
  getFreeWeeklyStats,
  getFreeMonthlyStats,
  getVipWeeklyStats,
  getVipMonthlyStats,
  getMaxbetWeeklyStats,
  getMaxbetMonthlyStats,
  getResults,
  getWins,
  getLosses,
  getPending,
  getWinRate,
  getRoi,
  getOddsStats,
  getStakeStats,
  getSportStats,
  getMarketStats,
  getCompetitionStats,
  getSourceStats,
  getVolumeStats,
  getScrapedStats,
  getPublishedStats,
  getPerformanceReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  getMyAccessStats,
};