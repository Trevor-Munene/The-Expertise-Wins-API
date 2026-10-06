const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const defaultProducts = [
  {
    name: "Free",
    slug: "free",
    description: "Public football selections.",
    type: "FREE",
    status: "ACTIVE",
    isPublic: true,
  },
  {
    name: "Pikk Better VIP",
    slug: "vip",
    description: "Premium selections across sports and markets.",
    type: "VIP",
    status: "ACTIVE",
    isPublic: false,
  },
  {
    name: "Pikk MaxBet VIP",
    slug: "maxbet",
    description: "Featured and highest-tier selections.",
    type: "MAXBET",
    status: "ACTIVE",
    isPublic: false,
  },
];

// Allow an alternate dump directory and env file so the CLI can sync from a
// different checkout without editing this script.
const dumpDirectory =
  process.env.SEED_DUMP_DIR ||
  path.resolve(__dirname, "../../cli/settlement/previous-day-results");

const allowedStatuses = new Set([
  "PENDING",
  "PUBLISHED",
  "LOCKED",
  "SETTLED",
  "CANCELLED",
  "VOID",
]);
const allowedOutcomes = new Set([
  "PENDING",
  "WON",
  "LOST",
  "VOID",
  "PUSH",
  "HALF_WON",
  "HALF_LOST",
  "CANCELLED",
]);
const settledOutcomes = new Set([
  "WON",
  "LOST",
  "VOID",
  "PUSH",
  "HALF_WON",
  "HALF_LOST",
  "CANCELLED",
]);

// The settlement layer writes lowercase, CLI-flavoured values such as
// "win", "lose" and "settled". Map those onto the database enums so a
// settled dump can be synced without the seed rejecting the whole file.
const outcomeAliases = new Map([
  ["WIN", "WON"],
  ["WON", "WON"],
  ["LOSE", "LOST"],
  ["LOST", "LOST"],
  ["LOSS", "LOST"],
  ["PUSH", "PUSH"],
  ["VOID", "VOID"],
  ["HALF_WON", "HALF_WON"],
  ["HALF_LOST", "HALF_LOST"],
  ["CANCELLED", "CANCELLED"],
  ["PENDING", "PENDING"],
]);

const statusAliases = new Map([
  ["SETTLED", "SETTLED"],
  ["PENDING", "PENDING"],
  ["PUBLISHED", "PUBLISHED"],
  ["LOCKED", "LOCKED"],
  ["CANCELLED", "CANCELLED"],
  ["VOID", "VOID"],
]);

const normalizeEnum = (value, allowedValues, field, fileName, index, aliases = null) => {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  const mapped = aliases ? aliases.get(normalized) ?? normalized : normalized;
  if (!allowedValues.has(mapped)) {
    throw new Error(`${fileName}[${index}]: unsupported ${field} value.`);
  }
  return mapped;
};

const toTipData = (tip, fileName, index) => {
  for (const field of ["source", "sport", "market", "selection"]) {
    if (typeof tip[field] !== "string" || tip[field].trim() === "") {
      throw new Error(`${fileName}[${index}]: ${field} is required.`);
    }
  }

  const scrapedAt = tip.scrapedAt == null ? undefined : new Date(tip.scrapedAt);
  if (scrapedAt && Number.isNaN(scrapedAt.getTime())) {
    throw new Error(`${fileName}[${index}]: scrapedAt is not a valid date.`);
  }

  return {
    source: tip.source,
    externalId: tip.externalId ?? null,
    sport: tip.sport,
    competition: tip.competition ?? null,
    league: tip.league ?? null,
    country: tip.country ?? null,
    homeTeam: tip.homeTeam ?? null,
    awayTeam: tip.awayTeam ?? null,
    kickoff: tip.kickoff ?? null,
    market: tip.market,
    selection: tip.selection,
    odds: tip.odds ?? null,
    stakeUnits: tip.stakeUnits ?? null,
    previewTitle: tip.previewTitle ?? null,
    preview: tip.preview ?? null,
    verdict: tip.verdict ?? null,
    tips: tip.tips ?? null,
    analytics: tip.analytics ?? null,
    confidenceIndex: tip.confidenceIndex ?? null,
    predictedScore: tip.predictedScore ?? null,
    detailsUrl: tip.detailsUrl ?? null,
    status: normalizeEnum(tip.status ?? "PENDING", allowedStatuses, "status", fileName, index, statusAliases),
    result: tip.result ?? null,
    outcome:
      tip.outcome == null || tip.outcome === ""
        ? "PENDING"
        : normalizeEnum(tip.outcome, allowedOutcomes, "outcome", fileName, index, outcomeAliases),
    extraTips: tip.extraTips ?? null,
    scrapedAt,
  };
};

const getProductSlug = (tip) => {
  const label = `${tip.competition || ""} ${tip.previewTitle || ""}`.toLowerCase();
  const featured = Boolean(tip.isFeatured) || /bet of the day/.test(label);
  if (featured) return "maxbet";
  if (["football", "soccer"].includes(String(tip.sport || "").toLowerCase())) return "free";
  return "vip";
};

// Derive a stable id from the dump file and the tip's position in it. One dump
// file represents one day, so a re-seed of the same file always produces the
// same ids and simply updates the existing rows.
const getTipId = (fileName, index) =>
  `seed_${crypto
    .createHash("sha256")
    .update(`${fileName}:${index}`)
    .digest("hex")
    .slice(0, 32)}`;

const loadSeedRecords = () => {
  const files = fs
    .readdirSync(dumpDirectory)
    .filter((fileName) => /^freetips-.*\.json$/i.test(fileName))
    .sort();

  if (files.length === 0) {
    throw new Error(`No freetips JSON dumps found in ${dumpDirectory}.`);
  }

  const records = [];
  for (const fileName of files) {
    const filePath = path.join(dumpDirectory, fileName);
    const tips = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(tips)) {
      throw new Error(`${fileName}: expected a JSON array.`);
    }

    // Key on the file+position id so each dump record maps to one stable row.
        tips.forEach((tip, index) => {
          if (!tip || typeof tip !== "object" || Array.isArray(tip)) {
            throw new Error(`${fileName}[${index}]: expected a tip object.`);
          }

          records.push({ id: getTipId(fileName, index), data: toTipData(tip, fileName, index) });
        });
  }

  return { files, records };
};

const bootstrapAdmin = async (prisma, bcrypt) => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email && !password) return;
  if (!email) throw new Error("ADMIN_EMAIL is required when ADMIN_PASSWORD is set.");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existingUser.id }, data: { role: "ADMIN" } });
    }
    console.log(`Admin account ${email} is ready; its existing password was kept.`);
    return;
  }

  if (!password) {
    throw new Error("Set ADMIN_PASSWORD to create the admin account, or sign up with ADMIN_EMAIL first.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, password: hashedPassword, role: "ADMIN", status: "ACTIVE" },
  });
  console.log(`Created admin account ${email} from environment credentials.`);
};

const seedProducts = async (prisma) => {
  const products = await Promise.all(
    defaultProducts.map((product) =>
      prisma.product.upsert({
        where: { slug: product.slug },
        create: product,
        update: {},
      })
    )
  );

  return new Map(products.map((product) => [product.slug, product]));
};

const main = async () => {
  const { files, records } = loadSeedRecords();
  console.log(`Loaded ${records.length} tips from ${files.length} dump files.`);

  if (process.argv.includes("--dry-run")) {
    console.log("Dry run complete; the database was not changed.");
    return;
  }

  // An explicit env file (set by the CLI sync script for production) wins over
// the local development default.
  require("dotenv").config({
    path: process.env.SEED_ENV_FILE || path.resolve(__dirname, "../.env"),
  });
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcrypt");
  const prisma = new PrismaClient();

  try {
  const productsBySlug = await seedProducts(prisma);
  await bootstrapAdmin(prisma, bcrypt);
  const existingTips = await prisma.tip.findMany({
    where: { id: { in: records.map(({ id }) => id) } },
    select: { id: true, status: true, outcome: true, result: true, settledAt: true },
  });
  const existingTipsById = new Map(existingTips.map((tip) => [tip.id, tip]));
  await prisma.$transaction(records.map(({ id, data }) => {
    const existingTip = existingTipsById.get(id);
    const update = { ...data };

    if (existingTip && settledOutcomes.has(existingTip.outcome)) {
      update.status = existingTip.status;
      update.outcome = existingTip.outcome;
      update.result = existingTip.result;
      update.settledAt = existingTip.settledAt;
    } else if (settledOutcomes.has(data.outcome)) {
      // The dump carries a real settlement result. Honour it as recorded
      // instead of rewriting it to WON for baseline reporting.
      update.status = "SETTLED";
      update.result = data.result || null;
      update.settledAt = existingTip?.settledAt || new Date();
    } else if (data.status !== "PENDING" || data.outcome !== "PENDING") {
      update.status = "SETTLED";
      update.outcome = "WON";
      update.result = update.result || "Historical result recorded as WON for baseline progress tracking.";
      update.settledAt = existingTip?.settledAt || new Date();
    } else if (existingTip && existingTip.status !== "PENDING" && data.status === "PENDING") {
      // Keep a tip that is already live from being reverted to PENDING by a
      // re-sync of an unscraped dump record.
      update.status = existingTip.status;
    }

    // Publish/re-publish this record on the sync day. Keep scrapedAt as the
    // historical scrape date; publishedAt is the day the frontend serves it.
    const publishedAt = new Date();
    update.publishedAt = publishedAt;

    const result = {
      ...data,
      status: settledOutcomes.has(data.outcome) ? "SETTLED" : "PUBLISHED",
      publishedAt,
    };

    return prisma.tip.upsert({
      where: { id },
      create: { id, ...result },
      update,
    });
  }));
  const publicationIds = records.map(({ id }) => id);
  const publications = records.map(({ id, data }) => ({
    tipId: id,
    productId: productsBySlug.get(getProductSlug(data)).id,
    status: "PUBLISHED",
    publishedAt: new Date(),
  }));
  const publicationResult = await prisma.tipPublication.createMany({
    data: publications,
    skipDuplicates: true,
  });
  await prisma.tipPublication.updateMany({
    where: { tipId: { in: publicationIds }, status: "PUBLISHED" },
    data: { publishedAt: new Date() },
  });
  console.log(`Created ${publicationResult.count} missing product publications.`);

  // Keep the tip row consistent with its publications. Statistics count
  // published tips via Tip.status and Tip.publishedAt, so leaving these unset
  // makes the admin dashboard report zero published tips even when every tip
  // is live. A settled tip keeps its SETTLED status but still needs publishedAt.
  await prisma.tip.updateMany({
    where: { id: { in: records.map(({ id }) => id) }, publishedAt: null },
    data: { publishedAt: new Date() },
  });

  await prisma.tip.updateMany({
    where: { id: { in: records.map(({ id }) => id) }, status: { in: ["PENDING"] } },
    data: { status: "PUBLISHED" },
  });

  console.log(`Seeded ${records.length} tips. Re-running this command is safe.`);
  } finally {
    await prisma.$disconnect();
  }
};

// Reuse the seed pipeline from the CLI sync script by exposing the pieces.
module.exports = {
  loadSeedRecords,
  defaultProducts,
  outcomeAliases,
  statusAliases,
  normalizeEnum,
  allowedStatuses,
  allowedOutcomes,
  settledOutcomes,
  toTipData,
  getProductSlug,
};

if (require.main === module) {
main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}