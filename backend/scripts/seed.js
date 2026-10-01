const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

const main = async () => {
  const { files, records } = loadSeedRecords();
  console.log(`Loaded ${records.length} tips from ${files.length} dump files.`);

  if (process.argv.includes("--dry-run")) {
    console.log("Dry run complete; the database was not changed.");
    return;
  }

  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
  await prisma.$transaction(
    records.map(({ id, data }) =>
      prisma.tip.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      })
    )
  );
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
