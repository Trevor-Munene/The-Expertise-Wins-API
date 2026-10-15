const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const statsServicePath = path.resolve(__dirname, "../services/stats.service.js");

// Load the stats service with a fake Prisma client that records every where
// clause so we can assert the exact filter each filter combination produces.
function loadStatsService() {
  const calls = [];
  const state = {
    cards: [],
    countValue: 0,
    product: { id: "prod-maxbet", name: "Pikk MaxBet VIP", slug: "maxbet", type: "MAXBET" },
  };

  const prisma = {
    tip: {
      count: async ({ where }) => {
        calls.push(["tip.count", where]);
        return state.countValue;
      },
      findMany: async ({ where }) => {
        calls.push(["tip.findMany", where]);
        return state.cards;
      },
    },
    product: {
      findUnique: async ({ where }) => {
        calls.push(["product.findUnique", where]);
        return state.product;
      },
      findMany: async () => [],
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "../lib/prisma" && parent?.filename === statsServicePath) {
      return prisma;
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[statsServicePath];
  const service = require(statsServicePath);
  Module._load = originalLoad;

  return { service, calls, state };
}

// Collect every OR branch's date range from a where clause so a test can assert
// what window the filter describes.
function extractDayRanges(where) {
  const branches = where.OR ?? [];
  return branches.map((branch) => {
    const key = branch.scrapedAt ? "scrapedAt" : branch.publishedAt ? "publishedAt" : "createdAt";
    return { key, range: branch[key] };
  });
}

test("volume: product filter reaches the where clause", async () => {
  const { service, calls } = loadStatsService();

  await service.getVolumeStats({ periodId: "yesterday", productId: "maxbet" });

  const countCall = calls.find(([name]) => name === "tip.count");
  assert.ok(countCall, "volume must run a tip.count");
  assert.equal(
    countCall[1].publications.some.productId,
    "prod-maxbet",
    "maxbet product filter must reach the where clause"
  );
  assert.equal(countCall[1].publications.some.status, "PUBLISHED");
});

test("volume: day filter buckets on scrapedAt, not createdAt", async () => {
  const { service, calls } = loadStatsService();

  await service.getVolumeStats({ periodId: "yesterday", productId: "ALL" });

  const countCall = calls.find(([name]) => name === "tip.count");
  const branches = extractDayRanges(countCall[1]);
  assert.equal(branches.length, 3, "scrapedAt, publishedAt and createdAt fallbacks present");
  // The primary branch must be scrapedAt: the day a tip belongs to is the day
  // it was scraped, matching the archive and admin services.
  assert.equal(branches[0].key, "scrapedAt");
  assert.ok(branches[0].range.gte instanceof Date);
  assert.ok(branches[0].range.lte instanceof Date);
  assert.ok(branches[0].range.gte < branches[0].range.lte);
  // No top-level createdAt-only filter should remain.
  assert.equal(countCall[1].createdAt, undefined, "must not filter on createdAt alone");
});

test("volume: distinguishes cards from selections", async () => {
  const { service, state } = loadStatsService();
  state.cards = [
    { tips: [{ selection: "A" }, { selection: "B" }, { selection: "C" }, { selection: "D" }] },
    { tips: [{ selection: "E" }] },
    { tips: null },
  ];

  const volume = await service.getVolumeStats({ periodId: "yesterday", productId: "maxbet" });

  assert.equal(volume.total, 0, "card count comes from tip.count");
  assert.equal(volume.selections, 6, "4 + 1 + 1 fallback for a null tips array");
});

test("summary: avgOdds is computed for the same scope", async () => {
  const { service, calls } = loadStatsService();

  await service.getSummaryStats({ periodId: "week", productId: "vip" });

  // getOddsStatsFor runs tip.findMany with the product publication filter.
  const findCall = calls.find(([name]) => name === "tip.findMany");
  assert.ok(findCall, "summary must compute odds for the summarised scope");
  const branches = extractDayRanges(findCall[1]);
  assert.equal(branches[0].key, "scrapedAt");
  assert.ok(findCall[1].publications?.some, "vip scope must apply the publication filter");
});

test("periods: all-time has no date filter, unknown period is rejected", async () => {
  const { service, calls } = loadStatsService();

  await service.getVolumeStats({ periodId: "all-time", productId: "ALL" });
  const allTimeCount = calls.find(([name]) => name === "tip.count")[1];
  assert.equal(allTimeCount.OR, undefined, "all-time must not restrict by day");

  await assert.rejects(
    service.getVolumeStats({ periodId: "nonsense", productId: "ALL" }),
    (error) => error.status === 400,
    "an unsupported period must be a 400"
  );
});

test("periods: every advertised period resolves to a positive window", async () => {
  const { service, calls } = loadStatsService();

  for (const period of ["yesterday", "week", "14-days", "month", "year"]) {
    calls.length = 0;
    await service.getVolumeStats({ periodId: period, productId: "ALL" });
    const branches = extractDayRanges(calls.find(([name]) => name === "tip.count")[1]);
    assert.ok(branches[0].range.gte < branches[0].range.lte, `${period} window must be positive`);
  }
});

test("products: an unsupported product filter is rejected", async () => {
  const { service } = loadStatsService();

  await assert.rejects(
    service.getVolumeStats({ periodId: "all-time", productId: "gold" }),
    (error) => error.status === 400,
    "an unsupported product must be a 400"
  );
});

test("scoring: parent WON with stale nested LOST selections is a loss, not a win", async () => {
  const { service, state } = loadStatsService();
  // The exact shape a bulk settlement used to leave behind: parent says WON,
  // selections still say LOST. The metric cards must follow the selections.
  state.cards = [
    {
      outcome: "WON",
      odds: 2.7,
      stakeUnits: 2,
      tips: [{ odds: 2.7, units: 2, outcome: "LOST" }],
    },
  ];

  const summary = await service.getSummaryStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(summary.wins, 0, "a stale selection must not be counted as a win");
  assert.equal(summary.losses, 1, "the stale selection is a loss");
  assert.equal(summary.profit, -2, "profit subtracts the losing stake");
  assert.equal(summary.roi, -100, "one losing unit on one staked unit is -100% ROI");
});

test("scoring: parent and selections settled WON produce a positive ROI", async () => {
  const { service, state } = loadStatsService();
  state.cards = [
    {
      outcome: "WON",
      odds: 2.7,
      stakeUnits: 2,
      tips: [{ odds: 2.7, units: 2, outcome: "WON" }],
    },
  ];

  const summary = await service.getSummaryStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(summary.wins, 1);
  assert.equal(summary.losses, 0);
  assert.equal(summary.profit, 3.4, "2 units at 2.70 returns 1.70 profit per unit");
  assert.equal(summary.roi, 170);
});

test("grouped: sport/market/competition panels carry the period and product filter", async () => {
  const { service, calls } = loadStatsService();

  await service.getSportStats({ periodId: "yesterday", productId: "maxbet" });

  const findCall = calls.find(([name]) => name === "tip.findMany");
  assert.ok(findCall, "grouped stats must run a tip.findMany");
  const branches = extractDayRanges(findCall[1]);
  assert.equal(branches[0].key, "scrapedAt", "grouped panels must bucket on the business day");
  assert.equal(
    findCall[1].publications.some.productId,
    "prod-maxbet",
    "grouped panels must apply the product publication filter"
  );
  assert.equal(findCall[1].publications.some.status, "PUBLISHED");
});

// The exact stale-settlement shape that mis-scored the headline metrics. A
// grouped panel that reads the parent row would report Sport: 1 win, while the
// metric cards score the nested selection as a loss. The panels must follow the
// nested tips[] array, exactly like getTipStats.
test("grouped: a stale parent WON with a nested LOST selection is not a win", async () => {
  const { service, state } = loadStatsService();
  state.cards = [
    {
      sport: "Esports",
      outcome: "WON",
      odds: 2.7,
      stakeUnits: 2,
      tips: [{ odds: 2.7, units: 2, outcome: "LOST" }],
    },
  ];

  const sports = await service.getSportStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(sports.Esports.wins, 0, "the stale parent win must not reach the panel");
  assert.equal(sports.Esports.losses, 1, "the nested selection is the canonical loss");
  assert.equal(sports.Esports.settled, 1);
  assert.equal(sports.Esports.winRate, 0);
});

test("grouped: panels count every selection in a multi-selection card", async () => {
  const { service, state } = loadStatsService();
  state.cards = [
    {
      sport: "Tennis",
      outcome: "WON",
      odds: 2,
      stakeUnits: 2,
      tips: [
        { odds: 1.84, units: 2, outcome: "WON" },
        { odds: 1.84, units: 2, outcome: "LOST" },
      ],
    },
  ];

  const sports = await service.getSportStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(sports.Tennis.wins, 1);
  assert.equal(sports.Tennis.losses, 1);
  assert.equal(sports.Tennis.settled, 2);
  assert.equal(sports.Tennis.winRate, 50);
  assert.equal(sports.Tennis.avgOdds, 1.84, "average odds read the selection odds, not the parent odds");
});

// The real 13 Oct VIP slate: 10 wins / 7 losses at short prices is a genuine
// break-even day. If the four Esports cards are settled WON, the same slate is
// a +59% day. This guards the exact case that produced a "0.2%" ROI report.
const VIP_SLATE = [
  { sport: "Tennis", tips: [{ odds: 1.84, units: 2, outcome: "WON" }, { odds: 1.84, units: 2, outcome: "WON" }] },
  { sport: "Tennis", tips: [{ odds: 1.65, units: 2, outcome: "WON" }, { odds: 1.53, units: 2, outcome: "LOST" }] },
  { sport: "Esports", tips: [{ odds: 2.7, units: 2, outcome: "LOST" }] },
  { sport: "Esports", tips: [{ odds: 1.78, units: 3, outcome: "LOST" }] },
  { sport: "Esports", tips: [{ odds: 2.6, units: 2, outcome: "LOST" }] },
  { sport: "Esports", tips: [{ odds: 2, units: 3, outcome: "LOST" }] },
  { sport: "Ice Hockey", tips: [{ odds: 1.5, units: 3, outcome: "WON" }, { odds: 1.7, units: 2, outcome: "WON" }] },
  { sport: "Basketball", tips: [{ odds: 1.9, units: 2, outcome: "WON" }] },
  { sport: "Basketball", tips: [{ odds: 1.9, units: 2, outcome: "WON" }] },
  { sport: "Basketball", tips: [{ odds: 1.9, units: 2, outcome: "LOST" }] },
  { sport: "Basketball", tips: [{ odds: 1.9, units: 2, outcome: "WON" }] },
  { sport: "Basketball", tips: [{ odds: 1.9, units: 2, outcome: "WON" }] },
  { sport: "Tennis", tips: [{ odds: 1.53, units: 2, outcome: "LOST" }, { odds: 1.65, units: 2, outcome: "WON" }] },
];

test("scoring: the real 13 Oct VIP slate is a genuine break-even (10W/7L)", async () => {
  const { service, state } = loadStatsService();
  state.cards = VIP_SLATE;

  const summary = await service.getSummaryStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(summary.wins, 10);
  assert.equal(summary.losses, 7);
  assert.equal(summary.totalStake, 37);
  assert.equal(summary.profit, 0.06, "short-price winners barely cover the losses");
  assert.equal(summary.roi, 0.16, "0.16% is the correct ROI for this slate as settled");
});

test("scoring: settling the four Esports cards WON turns the same slate into +59%", async () => {
  const { service, state } = loadStatsService();
  // Simulate the repaired data: parent and selections both moved to WON.
  state.cards = VIP_SLATE.map((card) =>
    card.sport === "Esports"
      ? { ...card, outcome: "WON", tips: card.tips.map((p) => ({ ...p, outcome: "WON" })) }
      : card
  );

  const summary = await service.getSummaryStats({ periodId: "all-time", productId: "ALL" });

  assert.equal(summary.wins, 14, "four Esports selections flip from loss to win");
  assert.equal(summary.losses, 3);
  assert.equal(summary.profit, 22);
  assert.equal(summary.roi, 59.46, "the same slate is a strong day once the wins are recorded");
});
