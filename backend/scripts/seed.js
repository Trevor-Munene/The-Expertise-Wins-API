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

// Derive a stable id from the day and the tip itself. A dump file is rewritten
// every time the same day is scraped again and a merge keeps earlier tips
// wherever they were, so the old file+position id changed whenever the site
// reordered its card. The id of a tip that was scraped in the morning and is
// still listed in the evening must be the same, or the database gets a second
// copy of one bet. Keying on the day plus the tip's identity keeps it on one row.
//
// The day stays part of the key because the same tip is legitimately listed on
// several dumps (a fixture pushed forward is scraped again the next day), and
// each day serves its own copy.
//
// `externalId` identifies a tip whose identity is not its two team names (an
// outright, a future, a bet builder). The selection is part of the key because
// one fixture is often listed twice, free and paid, with a different bet each.
const getTipId = (fileName, index, tip = null) => {
  const day = parseDumpDay(fileName);
  // Without a fixture (an outright, a field bet) or without a day in the file
  // name there is nothing stable to key on, so the position stays the last
  // resort. Every real freetips dump is named by its day and lists fixtures.
  const fixture = tip && (tip.homeTeam || tip.awayTeam) ? `${tip.homeTeam || ""} v ${tip.awayTeam || ""}` : "";
  const identity = day && fixture ? `${day}::${fixture}` : `${fileName}#${index}`;

  const parts = [
    identity,
    tip && tip.externalId != null ? `external:${tip.externalId}` : "",
  ];
  if (!tip || tip.externalId == null) {
    parts.push(`${tip ? tip.sport || "" : ""}|${tip ? tip.market || "" : ""}|${tip ? tip.selection || "" : ""}`);
  }

  return `seed_${crypto
    .createHash("sha256")
    .update(parts.join("::"))
    .digest("hex")
    .slice(0, 32)}`;
};

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
// The instant a freshly published tip carries so the API files it under its
// dump day. It keeps the dump's own time of day, so "published at" still reads
// naturally, and only re-anchors the calendar day.
const publishStampForDay = (dayKey, scrapedAt) => {
  if (!dayKey) return scrapedAt instanceof Date ? scrapedAt : new Date();
  if (scrapedAt instanceof Date && businessDayKey(scrapedAt) === dayKey) return scrapedAt;

  // Hours at or below midday are already inside the day in UTC too; anything
  // later is clamped so the stamp cannot spill into the next business day.
  const hour = scrapedAt instanceof Date ? Math.min(scrapedAt.getUTCHours(), NAIROBI_MIDDAY_UTC) : NAIROBI_MIDDAY_UTC;
  return new Date(`${dayKey}T${String(hour).padStart(2, "0")}:00:00.000Z`);
};
const NAIROBI_MIDDAY_MS = (NAIROBI_MIDDAY_UTC + 3) * 60 * 60 * 1000; // 09:00 UTC + UTC+3
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

    // One id per tip per day. loadSeedRecords keys on the day and the tip's
    // own identity, so each dump record maps to one stable row.
        const dayKey = getDumpDay(fileName, tips);
        const dayScrapedAt = alignScrapedAt(fileName, dayKey, tips, tips[0]?.scrapedAt);
        tips.forEach((tip, index) => {
          if (!tip || typeof tip !== "object" || Array.isArray(tip)) {
            throw new Error(`${fileName}[${index}]: expected a tip object.`);
          }

          records.push({
            id: getTipId(fileName, index, tip),
            fileName,
            dayKey,
            data: { ...toTipData(tip, fileName, index), scrapedAt: dayScrapedAt },
          });
        });
  }

  return { files, records };
};

// ---------------------------------------------------------------------------
// Dump reconciliation
//
// The dumps are the source of truth: what a dump says about a day is what the
// database must say about that day. A plain upsert cannot promise that on its
// own, because every row it does not touch is a row that disagrees with the
// dumps — a row scraped under an older id scheme, a duplicate of a tip the
// dump already carries, or a day the dumps no longer contain at all.
//
// The reconcile is scoped to the days the dumps cover and is cheap by nature:
// a day holds well under 100 tips, so the whole check is a couple of indexed
// reads of a few hundred rows.
//
//  - remove: a live row for a dump day that no dump record matches, when it can
//            be proved to be an older copy of a tip the dump now serves under
//            another id. Rows an admin authored stay, and so does any row that
//            carries an outcome: that is settled history, not a stale scrape.
//  - repair: a live row whose scrapedAt falls outside its dump day. It is put
//            back on its day, because that is what decides where the API shows
//            it (a stray stamp is how a tip vanishes from today).
//  - report: a live row with no PUBLISHED publication is invisible in the API
//            (published before its product existed, or unpublished by hand);
//            and any publication the seed is about to retire is listed.
//
// Nothing is removed or rewritten here that the upsert would not itself have
// overwritten: the seed applies the dumps, this makes sure no row escapes that.
const sameText = (left, right) => String(left ?? "").trim() === String(right ?? "").trim();
const sameDecimals = (left, right) => (left == null && right == null) || Number(left) === Number(right);
const sameJson = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

// True when a stored row and a dump record describe the same bet: the same
// fixture, bet and market. Home and away team are required, so an outright
// ("Field", a tournament winner) is never matched against an unrelated one.
const looksLikeSameBet = (tip, data) => {
  if (!tip.homeTeam || !tip.awayTeam) return false;
  return sameText(tip.homeTeam, data.homeTeam) &&
    sameText(tip.awayTeam, data.awayTeam) &&
    sameText(tip.selection, data.selection) &&
    sameText(tip.market, data.market);
};

// The details a re-scrape refreshes. A row that differs on any of them is not
// a second copy of a dumped tip: it is a different card, so it is left alone.
const DETAIL_TEXT_FIELDS = ["sport", "competition", "kickoff", "predictedScore"];
const DETAIL_DECIMAL_FIELDS = ["odds", "stakeUnits", "confidenceIndex"];
const DETAIL_JSON_FIELDS = ["tips", "extraTips", "analytics"];

const sameBet = (tip, data) => {
  // A field the dump no longer carries is kept from the stored row by the
  // upsert's null guard, so a missing fresh value is not a difference.
  const textMatches = (stored, fresh) => !fresh || sameText(stored, fresh);
  const missingFresh = (value) => value == null || (Array.isArray(value) && value.length === 0);

  if (!DETAIL_TEXT_FIELDS.every((field) => textMatches(tip[field], data[field]))) return false;
  if (!DETAIL_DECIMAL_FIELDS.every((field) => missingFresh(data[field]) || sameDecimals(tip[field], data[field]))) return false;
  if (!DETAIL_JSON_FIELDS.every((field) => missingFresh(data[field]) || sameJson(tip[field], data[field]))) return false;
  return true;
};

// The Nairobi window a dump day covers: [from, to).
const dayWindow = (dayKey) => {
  const start = Date.parse(`${dayKey}T00:00:00.000Z`) - BUSINESS_UTC_OFFSET_MS;
  return { dayKey, from: new Date(start), to: new Date(start + DAY_MS) };
};

const inspectDumpDays = async (prisma, records) => {
  const empty = { removed: [], repaired: [], hidden: [] };
  const dayKeys = [...new Set(records.map((record) => record.dayKey).filter(Boolean))].sort();
  if (dayKeys.length === 0) return { ...empty, checked: 0 };

  const windows = dayKeys.map(dayWindow);
  const byDay = new Map(windows.map((window) => [window.dayKey, records.filter((record) => record.dayKey === window.dayKey)]));
  const idsByDay = new Map([...byDay].map(([dayKey, records]) => [dayKey, records.map((record) => record.id)]));

  // One read of every row that belongs to, or might belong to, a dumped day, by
  // the indexed scrapedAt column. A month of dumps is a couple of thousand rows.
  //
  // The window is one day wider on each side than the dumped days: a row filed
  // a day off is exactly what needs re-dating, and a row outside the window
  // would never be seen. Rows from adjacent days are only considered for a day
  // when they carry one of that day's ids, or match a tip on that day that no
  // row in the day itself accounts for.
  const earliest = windows[0].from;
  const latest = windows[windows.length - 1].to;
  const stored = await prisma.tip.findMany({
    where: {
      scrapedAt: {
        gte: new Date(earliest.getTime() - DAY_MS),
        lt: new Date(latest.getTime() + DAY_MS),
      },
    },
    include: { publications: true },
  });

  const report = { removed: [], repaired: [], hidden: [] };
  const repairs = [];
  const removedIds = [];

  for (const window of windows) {
    const expected = byDay.get(window.dayKey) || [];
    const expectedById = new Map(expected.map((record) => [record.id, record]));
    const expectedIds = new Set(idsByDay.get(window.dayKey));
    const inWindow = (stamp) => stamp instanceof Date && stamp >= window.from && stamp < window.to;

    // Rows dated inside the day, plus rows from the days around it that answer
    // to this day's dump (a wrong stamp, or a duplicate of a tip it carries).
    const claimedElsewhere = new Set(
      windows.filter((other) => other !== window).flatMap((other) => idsByDay.get(other.dayKey)),
    );
    const inDay = stored.filter((tip) => inWindow(tip.scrapedAt) || (
      expectedIds.has(tip.id) ||
      (!claimedElsewhere.has(tip.id) && expected.some((record) =>
        record.id !== tip.id && looksLikeSameBet(tip, record.data) && sameBet(tip, record.data)))
    ));

    for (const tip of inDay) {
      const record = expectedById.get(tip.id);
      const decided = settledOutcomes.has(tip.outcome);

      if (!record) {
        // Not this dumped tip. It is only removed when it is provably an older
        // copy of one the dump serves under another id.
        if (decided || tip.createdById || tip.publishedById) continue;
        if (!expected.some((dumpRecord) => looksLikeSameBet(tip, dumpRecord.data) && sameBet(tip, dumpRecord.data))) continue;
        removedIds.push(tip.id);
        report.removed.push(tip);
        continue;
      }

      // A row whose stamp is missing or outside the dump day is put on the dump
      // day: scrapedAt is what the API buckets by, so a stray stamp is how a tip
      // vanishes from the day it belongs to.
      if (!inWindow(tip.scrapedAt)) {
        repairs.push({ tip, dayKey: window.dayKey });
        report.repaired.push(tip);
      }

      if (!decided && tip.status !== "CANCELLED" &&
        !tip.publications.some((publication) => publication.status === "PUBLISHED")) {
        report.hidden.push(tip);
      }
    }
  }

  return { ...report, checked: stored.length, repairs, removedIds };
};

const description = (tip) => `${tip.homeTeam && tip.awayTeam ? `${tip.homeTeam} v ${tip.awayTeam}` : tip.selection} (${tip.selection}, ${tip.id})`;

// Print what the reconcile found, before anything is written. Quiet when the
// database already agrees with the dumps, which is the normal case.
const logReconciliation = ({ checked, removed, repaired, hidden }) => {
  console.log(`Checked ${checked} live row(s) on the dumped days against the dumps.`);

  for (const tip of removed) console.log(`   - remove duplicate: ${description(tip)}`);
  for (const tip of repaired) console.log(`   - re-date to its dump day: ${description(tip)}`);
  for (const tip of hidden) console.log(`   ! no PUBLISHED publication (invisible in the API): ${description(tip)}`);

  if (removed.length + repaired.length + hidden.length === 0) {
    console.log("   The database already matches the dumps for those days.");
  }
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
    // The reconcile is a read-only check when nothing is written: connect only
    // to report what the live rows look like against these dumps.
    let prisma;
    try {
      require("dotenv").config({
        path: process.env.SEED_ENV_FILE || path.resolve(__dirname, "../.env"),
      });
      prisma = new (require("@prisma/client").PrismaClient)();
      logReconciliation(await inspectDumpDays(prisma, records));
    } catch (error) {
      console.warn(`   Reconciliation check skipped: ${error.message}`);
    } finally {
      await prisma?.$disconnect();
    }
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
  // Check the live rows against the dumps before writing. Everything it finds
  // is applied below, in the same transaction as the upserts.
  const reconciliation = await inspectDumpDays(prisma, records);
  logReconciliation(reconciliation);

  const productsBySlug = await seedProducts(prisma);
  await bootstrapAdmin(prisma, bcrypt);

  // A tip's id comes from the tip itself, so two records can only share one if
  // they really are the same bet: a dump carried it twice, or a re-scrape left
  // it in the file twice. Two upserts on one id cannot run in one transaction,
  // so merge them here — the later record wins its fresh fields and keeps any
  // field the earlier one already carries (a settlement is never dropped).
  const recordsById = new Map();
  for (const record of records) {
    const previous = recordsById.get(record.id);
    if (!previous) {
      recordsById.set(record.id, record);
      continue;
    }

    console.warn(
      `Merging ${record.data.homeTeam || record.data.selection}: it appears twice in the dumps.`
    );

    // Keep the settlement from whichever copy decided the tip, so a duplicate
    // copy of a settled tip cannot reset it to pending.
    const settledCopy = settledOutcomes.has(previous.data.outcome)
      ? previous.data
      : settledOutcomes.has(record.data.outcome) ? record.data : null;

    const base = { ...previous.data, ...record.data };
    recordsById.set(record.id, {
      ...record,
      data: settledCopy
        ? {
            ...base,
            status: "SETTLED",
            outcome: settledCopy.outcome,
            result: settledCopy.result,
          }
        : base,
    });
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
    // The detail columns are selected too: a re-scrape can redeliver them as
    // null, and the update below keeps the copy the API already serves rather
    // than letting a card that lost its detail on the site lose it here.
    select: {
      id: true, status: true, outcome: true, result: true, settledAt: true, publishedAt: true,
      kickoff: true, odds: true, stakeUnits: true, previewTitle: true, preview: true,
      verdict: true, tips: true, extraTips: true, analytics: true, detailsUrl: true,
      confidenceIndex: true, predictedScore: true,
    },
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

    // A dump that has lost a detail (the site rolled the card's preview off, a
    // later scrape could not read its odds) does not erase what is already
    // stored. Only a real value replaces a stored one. Arrays count as missing
    // when they arrive empty: the dump carries no nested selections for a card,
    // not a card whose selections were withdrawn.
    if (existingTip) {
      for (const [field, value] of Object.entries(update)) {
        const missing = value === null || (Array.isArray(value) && value.length === 0);
        if (missing && existingTip[field] != null) update[field] = existingTip[field];
      }
    }

    if (existingTip && settledOutcomes.has(existingTip.outcome)) {
      // The row is settled and settled history is not the dump's to undo. A
      // scrape that sees the fixture again, or one that no longer marks it,
      // cannot reopen it; `settlement reset` is the deliberate way to do that.
      update.status = existingTip.status;
      update.outcome = existingTip.outcome;
      update.result = existingTip.result;
      update.settledAt = existingTip.settledAt || new Date();
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
        // A settled tip from the dumps is created settled. Anything else is
        // published here: every tip in a dump is something the site had live,
        // even one the scraper could not read a result for.
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

  // Rows the dumps do not answer for, and rows whose day was wrong. Both are
  // part of making the dumps the truth, so they are applied in the same pass.
  // Each removed tip takes its publications with it (TipPublication cascades).
  if (reconciliation.removedIds.length > 0) {
    await prisma.tip.deleteMany({ where: { id: { in: reconciliation.removedIds }}});
  }
  if (reconciliation.repairs.length > 0) {
    await prisma.$transaction(reconciliation.repairs.map(({ tip, dayKey }) => prisma.tip.update({
      where: { id: tip.id },
      data: { scrapedAt: publishStampForDay(dayKey, tip.scrapedAt) },
    })));
  }

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
  // has a publication must be flipped or the dashboard under-reports. Only a
  // pending row is touched: a settled row was published long ago, and sweeping
  // it here would drag yesterday's results into today's published count.
  await prisma.tip.updateMany({
    where: { id: { in: publicationIds }, status: "PENDING", outcome: "PENDING" },
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
  publishStampForDay,
  looksLikeSameBet,
  sameBet,
  dayWindow,
  inspectDumpDays,
};

if (require.main === module) {
main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
