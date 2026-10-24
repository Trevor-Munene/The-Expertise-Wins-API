/**
 * Guards for the scan → dump → database path.
 *
 * These cover the failure modes that made scraped tips go missing from the UI
 * while still counting as present in the JSON dumps:
 *
 *   1. A tip in the database with no PUBLISHED product row is invisible to
 *      every API list, even though the row exists.
 *   2. A dump was filed one day early because `scrapedAt` was stamped in UTC
 *      while the UI buckets by the Nairobi business day.
 *   3. A sync stamped `publishedAt` with the wall clock, which moved old days
 *      forward on every re-run.
 *   4. Merging the working results could silently drop tips.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { businessDayKey, parseDumpDay, scrapeStampForDay } = require("../lib/dump-day");
const seed = require("../../backend/scripts/seed");

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
};

console.log("\ndump-day helpers");

// 05:35 Nairobi is still the previous day in UTC. The scrape must be filed
// under the day the operator asked for, not the UTC date.
test("scrapeStampForDay files an early-morning scrape under the dump day", () => {
  const now = new Date("2026-10-23T02:35:46.871Z"); // 05:35 Nairobi
  const stamp = scrapeStampForDay("2026-10-23", now);
  assert.strictEqual(businessDayKey(stamp), "2026-10-23");
  // The real scrape time is preserved when it already falls inside the day.
  assert.strictEqual(stamp.toISOString(), now.toISOString());
});

test("scrapeStampForDay moves a wrong-day scrape onto the dump day", () => {
  // A UTC "today" of the 23rd while the operator asked for the 24th.
  const now = new Date("2026-10-23T02:35:46.871Z");
  const stamp = scrapeStampForDay("2026-10-24", now);
  assert.strictEqual(businessDayKey(stamp), "2026-10-24");
});

test("businessDayKey uses the Nairobi day, not UTC", () => {
  assert.strictEqual(businessDayKey("2026-10-22T22:30:00.000Z"), "2026-10-23");
  assert.strictEqual(businessDayKey("2026-10-23T02:35:46.871Z"), "2026-10-23");
  assert.strictEqual(businessDayKey("2026-10-23T20:59:59.999Z"), "2026-10-23");
  assert.strictEqual(businessDayKey("2026-10-23T21:00:00.000Z"), "2026-10-24");
});

test("parseDumpDay handles September, whose short name broke the old parser", () => {
  assert.strictEqual(parseDumpDay("freetips-25th Sept 2026.json"), "2026-09-25");
  assert.strictEqual(parseDumpDay("freetips-30th Sept 2026.json"), "2026-09-30");
  assert.strictEqual(parseDumpDay("freetips-1st Oct 2026.json"), "2026-10-01");
  assert.strictEqual(parseDumpDay("freetips-3rd Nov 2026.json"), "2026-11-03");
  assert.strictEqual(parseDumpDay("freetips-31st Feb 2026.json"), null); // impossible date
  assert.strictEqual(parseDumpDay("not-a-dump.json"), null);
});

test("settlement.parseDumpDate now resolves September dumps", () => {
  const { parseDumpDate } = require("../settlement/settlement");
  assert.strictEqual(parseDumpDate("freetips-25th Sept 2026.json"), "2026-09-25");
});

console.log("\nseed day alignment");

test("alignScrapedAt keeps a timestamp that already belongs to the dump day", () => {
  const iso = "2026-10-23T02:35:46.871Z"; // 05:35 Nairobi on the 23rd
  const out = seed.alignScrapedAt("freetips-23rd Oct 2026.json", "2026-10-23", [{}], iso);
  assert.strictEqual(out.toISOString(), iso);
});

test("alignScrapedAt re-anchors a timestamp filed on the wrong day", () => {
  // The real 14th dump carried the 13th's scrapedAt, so its tips were served
  // under the 13th and the 14th looked empty.
  const out = seed.alignScrapedAt("freetips-14th Oct 2026.json", "2026-10-14", [{}], "2026-10-13T05:00:00.000Z");
  assert.strictEqual(businessDayKey(out), "2026-10-14");
});

test("alignScrapedAt clamps an early-UTC scrape that would land on the previous day", () => {
  // 21:19 UTC is 00:19 Nairobi the NEXT day, so keeping the hour would misfile it.
  const out = seed.alignScrapedAt("freetips-25th Sept 2026.json", "2026-09-25", [{}], "2026-09-25T21:19:29.699Z");
  assert.strictEqual(businessDayKey(out), "2026-09-25");
});

test("getDumpDay prefers the file name over an off-by-one scrapedAt", () => {
  assert.strictEqual(
    seed.getDumpDay("freetips-14th Oct 2026.json", [{ scrapedAt: "2026-10-13T05:00:00.000Z" }]),
    "2026-10-14",
  );
});

console.log("\ndump counts");

test("every real dump keeps all of its tips, and every day is unique", () => {
  const dir = path.resolve(__dirname, "..", "settlement", "previous-day-results");
  if (!fs.existsSync(dir)) return; // fixtures only; nothing to check in a bare checkout

  const files = fs.readdirSync(dir).filter((file) => /^freetips-.*\.json$/i.test(file));
  const seenDays = new Map();

  for (const file of files) {
    const tips = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const dayKey = seed.getDumpDay(file, tips);

    assert.ok(dayKey, `${file}: could not resolve a dump day`);
    assert.ok(Array.isArray(tips), `${file}: expected a JSON array`);

    // A dump must resolve to the day in its own name, or the archive will
    // serve its tips under a day the operator never scraped.
    const named = parseDumpDay(file);
    if (named) assert.strictEqual(dayKey, named, `${file}: resolved to ${dayKey}, not its file-name day`);

    assert.ok(!seenDays.has(dayKey), `${file} and ${seenDays.get(dayKey)} both resolve to ${dayKey}`);
    seenDays.set(dayKey, file);

    // Every record must survive validation, so a bad record cannot abort a sync
    // after some rows were already written.
    tips.forEach((tip, index) => {
      assert.doesNotThrow(() => seed.toTipData(tip, index, file), `${file}[${index}] is invalid`);
      assert.ok(
        seed.getProductSlug(tip),
        `${file}[${index}] has no product tier, so it would have no publication and stay invisible`,
      );
    });
  }
});

test("every tier a tip can belong to is a real product slug", () => {
  const slugs = new Set(seed.defaultProducts.map((product) => product.slug));
  const samples = [
    { sport: "Football", competition: "Bet of the Day" },
    { sport: "Football", competition: "Premier League" },
    { sport: "Tennis", competition: "Ningbo Open" },
    { sport: "Esports", competition: "LoL Worlds 2026" },
  ];
  for (const tip of samples) {
    assert.ok(slugs.has(seed.getProductSlug(tip)), `${JSON.stringify(tip)} resolved outside the products`);
  }
});

console.log("\nsaveTestResults");

test("saveTestResults stamps the given instant and reports the count", () => {
  const { saveTestResults } = require("../orchestrator/test-results");
  const dumpDir = path.resolve(__dirname, "..", "settlement", "previous-day-results");
  const stamp = new Date("1999-03-04T02:00:00.000Z");
  const dumpPath = path.join(dumpDir, "freetips-4th Mar 1999.json");
  const workingPath = path.resolve(__dirname, "..", "orchestrator", "test-results", "freetips.json");
  const workingBefore = fs.existsSync(workingPath) ? fs.readFileSync(workingPath, "utf8") : null;

  const tips = [
    { homeTeam: "A", awayTeam: "B", selection: "Win", market: "1X2", scrapedAt: "1999-03-03T21:00:00.000Z" },
    { homeTeam: "C", awayTeam: "D", selection: "Win", market: "1X2", scrapedAt: "1999-03-03T21:00:00.000Z" },
  ];

  try {
    const result = saveTestResults("freetips", tips, { date: "1999-03-04", scrapedAt: stamp });
    assert.strictEqual(result.count, 2, "both tips must be reported");
    assert.strictEqual(result.written, true, "a missing dump must be written");

    const written = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
    assert.strictEqual(written.length, 2);
    for (const tip of written) {
      assert.strictEqual(tip.scrapedAt, stamp.toISOString(), "the caller's instant must win over the tip's own");
      assert.strictEqual(businessDayKey(tip.scrapedAt), "1999-03-04", "the tip must be filed under the dump day");
    }
  } finally {
    if (fs.existsSync(dumpPath)) fs.rmSync(dumpPath, { force: true });
    if (workingBefore === null) {
      if (fs.existsSync(workingPath)) fs.rmSync(workingPath, { force: true });
    } else {
      fs.writeFileSync(workingPath, workingBefore, "utf8");
    }
  }
});

test("saveTestResults refuses to drop tips during the merge", () => {
  const { saveTestResults } = require("../orchestrator/test-results");
  const workingPath = path.resolve(__dirname, "..", "orchestrator", "test-results", "freetips.json");
  const snapshotDir = path.resolve(__dirname, "..", "orchestrator", "test-results");
  const workingBefore = fs.existsSync(workingPath) ? fs.readFileSync(workingPath, "utf8") : null;
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(workingPath, "[]", "utf8");

  try {
    // Same fixture, two different markets: the identity key includes the market,
    // so both must survive. If the key ever stops doing that, the merge would
    // silently return one tip and this assertion catches it.
    const tips = [
      { homeTeam: "A", awayTeam: "B", selection: "Over", market: "Total Goals", scrapedAt: "1999-03-05T10:00:00.000Z" },
      { homeTeam: "A", awayTeam: "B", selection: "Yes", market: "BTTS", scrapedAt: "1999-03-05T10:00:00.000Z" },
    ];
    const result = saveTestResults("freetips", tips, { date: "1999-03-05" });
    assert.ok(result.count >= 2, `merge returned ${result.count} tips; both must survive`);
  } finally {
    if (workingBefore === null) fs.rmSync(workingPath, { force: true });
    else fs.writeFileSync(workingPath, workingBefore, "utf8");
    const leftover = path.join(__dirname, "..", "settlement", "previous-day-results", "freetips-5th Mar 1999.json");
    if (fs.existsSync(leftover)) fs.rmSync(leftover, { force: true });
  }
});

console.log("\nsync.js guards");

// This is the bug that made yesterday's scraped tips look missing: the tip row
// existed, but it had no publication, so every API list filtered it out. The
// seed must publish every tip it writes, or fail instead of leaving a gap.
test("every seeded tip resolves to exactly one product publication", () => {
  const { records } = seed.loadSeedRecords();
  assert.ok(records.length > 0, "expected at least one dump record");

  const slugs = new Set(seed.defaultProducts.map((product) => product.slug));
  const perTip = new Map();

  for (const { id, data } of records) {
    const slug = seed.getProductSlug(data);
    assert.ok(slugs.has(slug), `${id} resolved to unknown product "${slug}"`);
    perTip.set(id, (perTip.get(id) || 0) + 1);
  }

  // One tier per tip: the seed retires stale publications using this same rule.
  for (const [id, count] of perTip) assert.strictEqual(count, 1, `${id} resolved to ${count} tiers`);
});

test("sync refuses dumps dated after today", () => {
  const { findMissingDate } = require("../sync");
  const dir = path.resolve(__dirname, "..", "settlement", "previous-day-results");
  const futureFile = path.join(dir, "freetips-1st Jan 2999.json");
  fs.writeFileSync(futureFile, "[]", "utf8");
  try {
    const problem = findMissingDate("local");
    assert.ok(problem, "a future-dated dump must be rejected");
    assert.match(problem, /dated after today/);
  } finally {
    fs.rmSync(futureFile, { force: true });
  }
});

console.log(`\n${passed} test(s) passed.`);
