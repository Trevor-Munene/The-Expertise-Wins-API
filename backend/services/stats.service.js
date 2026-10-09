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

  // Collect every usable odds value so the average can be reported
  let oddsTotal = 0;
  let oddsCount = 0;

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

    // Average odds across every tip that actually carries odds
    if (Number.isFinite(odds) && odds > 0) {
      oddsTotal += odds;
      oddsCount += 1;
    }
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
    avgOdds: oddsCount > 0 ? Number((oddsTotal / oddsCount).toFixed(2)) : 0,
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

  const [totalEvents, uniqueUsers, topPaths, recentEvents] = await Promise.all([
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
    prisma.usageEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  // Bucket by Nairobi calendar day; a groupBy on `event` was previously
  // returned under the misleading `daily` field and counted event names.
  const dailyCounts = new Map();
  for (const item of recentEvents) {
    const date = new Date(item.createdAt.getTime() + 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
  }
  const daily = [...dailyCounts]
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date));

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
    avgOdds: performance.avgOdds,
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

// Resolve a period id to the date its window starts, or null for all time.
// The frontend period picker sends these ids, so the API owns the mapping and
// the two sides cannot drift apart.
const resolvePeriodStart = (periodId) => {
  switch (String(periodId || "all-time")) {
    case "today":
      return getStartOfToday();
    case "week":
      return getPeriodStart(7);
    case "14-days":
      return getPeriodStart(14);
    case "month":
      return getPeriodStart(30);
    case "year":
      return getStartOfYear();
    case "all-time":
      return null;
    default:
      throw createError("Unsupported reporting period.", 400);
  }
};

// Return every id a product filter may be sent as, mapped to a real slug
const resolveProductSlug = (productId) => {
  switch (String(productId || "ALL").toUpperCase()) {
    case "ALL":
      return null;
    case "FREE":
      return "free";
    case "VIP":
      return "vip";
    case "MAXBET":
    case "MAX_BET":
      return "maxbet";
    default:
      throw createError("Unsupported product filter.", 400);
  }
};

// Build one summary for a period and an optional product. This is the single
// payload the metric cards read from, so win rate, ROI and average odds always
// describe the same set of tips.
const getSummaryStats = async ({ periodId = "all-time", productId = "ALL" } = {}) => {
  const periodStart = resolvePeriodStart(periodId);
  const productSlug = resolveProductSlug(productId);

  const timeWhere = periodStart ? { createdAt: { gte: periodStart } } : {};

  const performance = productSlug
    ? await getProductStats(productSlug, timeWhere)
    : await getTipStats(timeWhere);

  const odds = await getOddsStatsFor(
    productSlug
      ? {
          ...timeWhere,
          publications: {
            some: { productId: (await getProduct(productSlug)).id, status: "PUBLISHED" },
          },
        }
      : timeWhere
  );

  return {
    period: String(periodId || "all-time"),
    product: productSlug ?? "ALL",
    ...performance,
    // getTipStats averages odds over every tip carrying odds; expose it under
    // both names so the cards and the report read the same number
    avgOdds: performance.avgOdds,
    average: performance.avgOdds,
    odds,
  };
};

// Get stats for the free product
const getFreeStats = async () => {
  return getProductStats("free");
};

// Published VIP performance is public so visitors can assess the record.
const getVipStats = async () => {
  return getProductStats("vip");
};

// Published MaxBet performance is public so visitors can assess the record.
const getMaxbetStats = async () => {
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

// Get public VIP product stats for the last 7 days
const getVipWeeklyStats = async () => {
  return getProductStats("vip", { createdAt: { gte: getPeriodStart(7) } });
};

// Get public VIP product stats for the last 30 days
const getVipMonthlyStats = async () => {
  return getProductStats("vip", { createdAt: { gte: getPeriodStart(30) } });
};

// Get public MaxBet product stats for the last 7 days
const getMaxbetWeeklyStats = async () => {
  return getProductStats("maxbet", { createdAt: { gte: getPeriodStart(7) } });
};

// Get public MaxBet product stats for the last 30 days
const getMaxbetMonthlyStats = async () => {
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

// Calculate count, total, average, minimum and maximum odds for matching tips.
// This is the single source for every average odds figure, so the metric cards,
// the performance report and the breakdown panels can never disagree.
const getOddsStatsFor = async (where = {}) => {
  const tips = await prisma.tip.findMany({
    where,
    select: { odds: true },
  });

  const odds = tips
    .map((tip) => Number(tip.odds))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (odds.length === 0) {
    return { count: 0, total: 0, average: 0, minimum: 0, maximum: 0 };
  }

  const total = odds.reduce((sum, value) => sum + value, 0);

  return {
    count: odds.length,
    total: Number(total.toFixed(2)),
    average: Number((total / odds.length).toFixed(2)),
    minimum: Math.min(...odds),
    maximum: Math.max(...odds),
  };
};

// Calculate count, average, minimum and maximum odds
const getOddsStats = async () => {
  return getOddsStatsFor();
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

    const groupOdds = group
      .map((tip) => Number(tip.odds))
      .filter((value) => Number.isFinite(value) && value > 0);

    results[key] = {
      totalTips: group.length,
      wins,
      losses,
      settled,
      winRate: settled > 0 ? Number(((wins / settled) * 100).toFixed(2)) : 0,
      avgOdds:
        groupOdds.length > 0
          ? Number(
              (
                groupOdds.reduce((sum, value) => sum + value, 0) /
                groupOdds.length
              ).toFixed(2)
            )
          : 0,
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
  const oddsStats = await getOddsStatsFor({ createdAt: { gte: startDate } });

  return {
    periodStart: startDate,
    periodEnd: new Date(),
    performance,
    avgOdds: oddsStats.average,
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
  getOddsStatsFor,
  getSummaryStats,
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
