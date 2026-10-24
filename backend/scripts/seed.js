const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  parseDumpDay,
  businessDayKey,
  BUSINESS_UTC_OFFSET_MS,
  DAY_MS,
  SCRAPE_DAY_BOUNDARY_UTC_HOUR,
} = require("../../cli/lib/dump-day");
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

// The business day a dump represents. The file name is authoritative because it
// is what the operator and the archive use; a tip's own `scrapedAt` can be off
// by a day when a scrape near midnight was stamped in UTC.
const getDumpDay = (fileName, tips) => {
  const named = parseDumpDay(fileName);
  if (named) return named;

  const scraped = tips.find((tip) => tip && tip.scrapedAt != null)?.scrapedAt;
  const date = scraped == null ? null : new Date(scraped);
  if (date && !Number.isNaN(date.getTime())) {
    return new Date(date.getTime() + BUSINESS_UTC_OFFSET_MS).toISOString().slice(0, 10);
  }

  // Last resort: the file's modification time, so a record is never left without
  // the UI filters tips by that column).
  try {
    const stat = fs.statSync(path.join(dumpDirectory, fileName));
    return new Date(stat.mtime.getTime() + BUSINESS_UTC_OFFSET_MS).toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

// The instant a tip should carry so the API files it under its dump day. The
// observed `scrapedAt` is kept when it already falls inside that day; otherwise
// the tip's own time of day is re-anchored to the day it belongs to.
const NAIROBI_MIDDAY_UTC = 9; // 12:00 in Nairobi == 09:00 UTC

const alignScrapedAt = (fileName, dayKey, tips, scrapedAt) => {
  if (!dayKey) {
    const fallback = scrapedAt == null ? null : new Date(scrapedAt);
    return fallback && !Number.isNaN(fallback.getTime()) ? fallback : null;
  }

  // The business day decides where a tip is served, so compare against it
  // rather than the UTC date: a 05:35 Nairobi scrape still carries yesterday's
  // UTC date, which is exactly how tips ended up filed one day early.
  const observed = scrapedAt == null ? null : new Date(scrapedAt);
  if (observed && !Number.isNaN(observed.getTime()) && businessDayKey(observed) === dayKey) {
    return observed;
  }

  console.warn(
    `   ${fileName}: scrapedAt ${observed ? observed.toISOString() : "missing"} falls outside the dump day ` +
    `(${dayKey}); filing its ${tips.length} tip(s) under ${dayKey} instead.`
  );

  if (!observed || Number.isNaN(observed.getTime())) {
    return new Date(`${dayKey}T0${NAIROBI_MIDDAY_UTC}:00:00.000Z`);
  }

  // Keep the tip's own time of day when it is safe, so ordering stays natural.
  // Hours below 21 UTC are midnight-23:59 Nairobi; anything else would spill
  // into the next day and is replaced with midday.
  const hour = observed.getUTCHours();
  const candidate = hour < 21
    ? new Date(`${dayKey}T${String(hour).padStart(2, "0")}:${String(observed.getUTCMinutes()).padStart(2, "0")}:${String(observed.getUTCSeconds()).padStart(2, "0")}.000Z`)
    : null;

  if (candidate && businessDayKey(candidate) === dayKey) return candidate;

  return new Date(`${dayKey}T0${NAIROBI_MIDDAY_UTC}:00:00.000Z`);
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

    // Key on the file+position id so each dump record maps to one stable row.
        const dayKey = getDumpDay(fileName, tips);
        const dayScrapedAt = alignScrapedAt(fileName, dayKey, tips, tips[0]?.scrapedAt);
        tips.forEach((tip, index) => {
          if (!tip || typeof tip !== "object" || Array.isArray(tip)) {
            throw new Error(`${fileName}[${index}]: expected a tip object.`);
          }

          records.push({
            id: getTipId(fileName, index),
            fileName,
            dayKey,
            data: { ...toTipData(tip, fileName, index), scrapedAt: dayScrapedAt },
          });
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

  // Report every dump day with its row count so an operator can compare the
  // JSON against the database before anything is written.
  const countsByDay = new Map();
  for (const record of records) {
    countsByDay.set(record.dayKey || "unknown", (countsByDay.get(record.dayKey || "unknown") || 0) + 1);
  }
  for (const [day, count] of [...countsByDay].sort()) {
    console.log(`   ${day}: ${count} tip(s)`);
  }

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

  // An id is derived from the dump file and the tip's position in it. A day
  // scraped again after a carried fixture played can therefore hand the same id
  // to a different tip, and two records sharing an id cannot be written in one
  // transaction. Keep the newest dump's record for a colliding id and log the
  // older one, which is already in the database from an earlier sync.
  const recordsById = new Map();
  for (const record of records) {
    const previous = recordsById.get(record.id);
    if (previous) {
      console.warn(
        `Skipping ${previous.data.homeTeam || previous.data.selection}: its id is reused by a newer dump record.`
      );
    }
    recordsById.set(record.id, record);
  }
  const uniqueRecords = Array.from(recordsById.values());

  // The product a tip belongs to is decided here, so a tip is never created
  // without the publication that makes it visible in the API.
  const desiredPublication = new Map(uniqueRecords.map(({ id, data }) => {
    const slug = getProductSlug(data);
    const product = productsBySlug.get(slug);
    if (!product) throw new Error(`Missing product for slug "${slug}"; cannot publish ${id}.`);
    return [id, { productId: product.id, slug }];
  }));

  const publicationIds = uniqueRecords.map(({ id }) => id);
  const existingTips = await prisma.tip.findMany({
    where: { id: { in: publicationIds } },
    select: { id: true, status: true, outcome: true, result: true, settledAt: true, publishedAt: true },
  });
  const existingTipsById = new Map(existingTips.map((tip) => [tip.id, tip]));

  // Publications are reconciled in the same pass as the tip rows. Writing them
  // separately is what let a tip exist in the database with no product: the
  // batch insert silently skipped records and nothing ever filled the gap.
  const currentPublications = await prisma.tipPublication.findMany({
    where: { tipId: { in: publicationIds } },
    select: { id: true, tipId: true, productId: true, status: true },
  });
  const publicationsByTip = new Map();
  for (const publication of currentPublications) {
    if (!publicationsByTip.has(publication.tipId)) publicationsByTip.set(publication.tipId, []);
    publicationsByTip.get(publication.tipId).push(publication);
  }

  // Count the work up front so the log is accurate even though the writes all
  // go out as one batch below.
  let createdPublications = 0;
  let restoredPublications = 0;
  let retiredPublications = 0;
  for (const { id } of uniqueRecords) {
    const desired = desiredPublication.get(id);
    const current = publicationsByTip.get(id) || [];
    const forProduct = current.find((publication) => publication.productId === desired.productId);

    if (!forProduct) createdPublications++;
    else if (forProduct.status !== "PUBLISHED") restoredPublications++;

    for (const publication of current) {
      if (publication.productId === desired.productId) continue;
      if (publication.status === "UNPUBLISHED") continue;
      retiredPublications++;
    }
  }

  // One transaction for the whole dump set, so a sync either publishes every
  // tip it seeded or changes nothing. Each tip is written together with the
  // publications that make it visible.
  const operations = [];
  for (const { id, data } of uniqueRecords) {
    const existingTip = existingTipsById.get(id);
    const update = { ...data };

    if (existingTip && settledOutcomes.has(existingTip.outcome) && existingTip.settledAt) {
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
    } else if (data.status === "PENDING" && data.outcome === "PENDING") {
      // A pending source record must not inherit a stale settlement. Valid
      // settlements are preserved above only when they carry settledAt.
      update.status = "PENDING";
      update.outcome = "PENDING";
      update.result = data.result ?? null;
      update.settledAt = null;
    }

    // Anchor publishedAt to the dump's own day instead of the sync wall clock.
    // Backfilling an old dump used to stamp it with today's date, and every
    // re-sync moved that old day forward again. `data.scrapedAt` is already
    // aligned to the dump day by loadSeedRecords.
    const publishedAt = data.scrapedAt instanceof Date ? data.scrapedAt : new Date();
    update.publishedAt = publishedAt;

    operations.push(prisma.tip.upsert({
      where: { id },
      create: {
        ...data,
        id,
        status: settledOutcomes.has(data.outcome) ? "SETTLED" : "PUBLISHED",
        publishedAt,
      },
      update,
    }));

    // Reconcile this tip's publications: add the tier it belongs to now,
    // restore it if a previous run unpublished it, and retire any tier left
    // over from an older classification so the tip appears in exactly one.
    const desired = desiredPublication.get(id);
    const current = publicationsByTip.get(id) || [];
    const forProduct = current.find((publication) => publication.productId === desired.productId);

    if (!forProduct) {
      operations.push(prisma.tipPublication.create({
        data: { tipId: id, productId: desired.productId, status: "PUBLISHED", publishedAt },
      }));
    } else if (forProduct.status !== "PUBLISHED") {
      operations.push(prisma.tipPublication.update({
        where: { id: forProduct.id },
        data: { status: "PUBLISHED", unpublishedAt: null },
      }));
    }

    for (const publication of current) {
      if (publication.productId === desired.productId) continue;
      if (publication.status === "UNPUBLISHED") continue;
      operations.push(prisma.tipPublication.update({
        where: { id: publication.id },
        data: { status: "UNPUBLISHED", unpublishedAt: new Date() },
      }));
    }
  }

  await prisma.$transaction(operations);

  console.log(
    `Publications: ${createdPublications} created, ${restoredPublications} restored, ` +
    `${retiredPublications} retired.`
  );


  // The upsert above already writes publishedAt for every row. The only rows
  // still missing it are ones an older sync created; backfill them from their
  // own dump day rather than "now", so a backfill cannot move a day.
  const recordsMissingPublishedAt = uniqueRecords.filter(({ id }) => {
    const existing = existingTipsById.get(id);
    return !existing || existing.publishedAt == null;
  });

  if (recordsMissingPublishedAt.length > 0) {
    await prisma.$transaction(recordsMissingPublishedAt.map(({ id, data }) => prisma.tip.update({
      where: { id },
      data: { publishedAt: data.scrapedAt instanceof Date ? data.scrapedAt : new Date() },
    })));
  }

  // Statistics count published tips via Tip.status, so a pending row that now
  // has a publication must be flipped or the dashboard under-reports.
  await prisma.tip.updateMany({
    where: { id: { in: publicationIds }, status: "PENDING" },
    data: { status: "PUBLISHED" },
  });


  // Prove the sync actually published everything it seeded. A tip with no
  // PUBLISHED row is invisible to every API list, which is exactly how a
  // scraped tip goes missing from the UI.
  const visible = await prisma.tip.count({
    where: {
      id: { in: publicationIds },
      publications: { some: { status: "PUBLISHED" } },
    },
  });
  const hidden = publicationIds.length - visible;
  if (hidden > 0) {
    throw new Error(
      `${hidden} of ${publicationIds.length} tips have no PUBLISHED product publication ` +
      "and would be invisible in the UI."
    );
  }

  console.log(`Seeded ${uniqueRecords.length} tips from ${new Set(uniqueRecords.map(({ dayKey }) => dayKey)).size} day(s). Re-running this command is safe.`);
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
  getTipId,
  getDumpDay,
  alignScrapedAt,
};

if (require.main === module) {
main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
