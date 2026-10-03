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

const dumpDirectory = path.resolve(
  __dirname,
  "../../cli/settlement/previous-day-results"
);

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

const normalizeEnum = (value, allowedValues, field, fileName, index) => {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  if (!allowedValues.has(normalized)) {
    throw new Error(`${fileName}[${index}]: unsupported ${field} value.`);
  }
  return normalized;
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
    status: normalizeEnum(tip.status ?? "PENDING", allowedStatuses, "status", fileName, index),
    result: tip.result ?? null,
    outcome:
      tip.outcome == null
        ? "PENDING"
        : normalizeEnum(tip.outcome, allowedOutcomes, "outcome", fileName, index),
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

    tips.forEach((tip, index) => {
      if (!tip || typeof tip !== "object" || Array.isArray(tip)) {
        throw new Error(`${fileName}[${index}]: expected a tip object.`);
      }

      const id = `seed_${crypto
        .createHash("sha256")
        .update(`${fileName}:${index}`)
        .digest("hex")
        .slice(0, 32)}`;
      records.push({ id, data: toTipData(tip, fileName, index) });
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

  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
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
    } else if (data.status !== "PENDING" || data.outcome !== "PENDING") {
      update.status = "SETTLED";
      update.outcome = "WON";
      update.result = update.result || "Historical result recorded as WON for baseline progress tracking.";
      update.settledAt = existingTip?.settledAt || new Date();
    } else if (existingTip && existingTip.status !== "PENDING" && data.status === "PENDING") {
      update.status = existingTip.status;
    }

    return prisma.tip.upsert({
      where: { id },
      create: { id, ...data },
      update,
    });
  }));
  const publications = records.map(({ id, data }) => ({
    tipId: id,
    productId: productsBySlug.get(getProductSlug(data)).id,
    status: "PUBLISHED",
    publishedAt: data.scrapedAt ?? new Date(),
  }));
  const publicationResult = await prisma.tipPublication.createMany({
    data: publications,
    skipDuplicates: true,
  });
  console.log(`Created ${publicationResult.count} missing product publications.`);
  console.log(`Seeded ${records.length} tips. Re-running this command is safe.`);
  } finally {
    await prisma.$disconnect();
  }
};

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
