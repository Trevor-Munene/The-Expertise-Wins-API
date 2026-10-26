#!/usr/bin/env node
/**
 * Push the local CLI tip dumps into a PostgreSQL database.
 *
 * The same script serves local development and production. The target is
 * chosen by an environment file, so a developer never edits this code to
 * deploy:
 *
 *   Local        npm run sync
 *   Production   npm run sync:prod
 *
 * It reuses the backend seed pipeline, which upserts tips by deterministic id
 * and creates any missing product publications, so running it after every
 * scrape and after every settlement is safe and idempotent.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { businessDayKey, parseDumpDay } = require("./lib/dump-day");

const repoRoot = path.resolve(__dirname, "..");
const seedScript = path.join(repoRoot, "backend", "scripts", "seed.js");
const dumpDirectory = path.join(__dirname, "settlement", "previous-day-results");

const targets = {
  local: {
    label: "local database",
    envFile: path.join(repoRoot, "backend", ".env"),
    envExample: path.join(repoRoot, "backend", ".env.example"),
  },
  production: {
    label: "production database",
    envFile: path.join(repoRoot, ".env.production"),
    envExample: path.join(repoRoot, ".env.production.example"),
  },
};

function parseArgs(argv) {
  const args = { target: "local", dryRun: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run" || arg === "-n") args.dryRun = true;
    else if (arg === "--target=local" || arg === "--local") args.target = "local";
    else if (arg === "--target=production" || arg === "--prod" || arg === "--production") args.target = "production";
    else if (arg === "--target" && argv[i + 1]) args.target = argv[++i];
  }

  return args;
}

// Read a .env file without executing it. Returns the first value found for a
// key so a later duplicate line cannot silently override the real config.
function readEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) return null;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] !== key) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return null;
}

// Hide the password so connection details are never printed to a shared log.
function describeDatabase(url) {
  try {
    const parsed = new URL(url);
    const user = parsed.username ? `${parsed.username}:***@` : "";
    return `${parsed.protocol}//${user}${parsed.host}${parsed.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function findMissingDate(target) {
  if (!fs.existsSync(dumpDirectory)) return null;

  const formatted = fs
    .readdirSync(dumpDirectory)
    .filter((file) => /^freetips-.*\.json$/i.test(file))
    .sort();

  if (formatted.length === 0) return "No freetips dumps were found.";

  const latest = formatted[formatted.length - 1];
  console.log(`   Newest dump: ${latest}`);

  // Warn when today has no dump, because the web pages default to today.
  const today = businessDayKey();
  const day = new Date().getDate();
  const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
  const month = new Date().toLocaleString("en-GB", { month: "short" });
  const expected = `freetips-${day}${suffix} ${month} ${new Date().getFullYear()}.json`;

  if (expected !== latest) {
    console.log(
      `   Note: there is no dump for today (${today}). /tips and /archive default to today, so they may look empty until you scrape.`
    );
  }

  // A dump dated after today is filed in the future, where no page can ever
  // show it: the live list is pinned to today and the archive refuses future
  // days. That is almost always a scrape that ran with the wrong system clock.
  const future = formatted.filter((file) => (parseDumpDay(file) || "") > today);
  if (future.length > 0) {
    return (
      `These dumps are dated after today (${today}) and would be filed in the future:\n` +
      future.map((file) => `     ${file}`).join("\n") +
      "\n   Fix the file name or the system clock, then re-run."
    );
  }

  return null;
}

// The same fixture, market and selection listed twice in one dump. The seed and
// the dumps key a tip on exactly this, so a duplicate is a mistake upstream.
function findDuplicateTips(directory) {
  if (!fs.existsSync(directory)) return [];

  const duplicates = [];
  for (const fileName of fs.readdirSync(directory).filter((file) => /^freetips-.*\.json$/i.test(file))) {
    let tips;
    try {
      tips = JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8"));
    } catch {
      continue; // the seed reports an unreadable dump with the file name
    }
    if (!Array.isArray(tips)) continue;

    const counts = new Map();
    for (const tip of tips) {
      if (!tip || typeof tip !== "object") continue;
      const key = `${tip.homeTeam || ""}|${tip.awayTeam || ""}|${tip.selection || ""}|${tip.market || ""}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count > 1) duplicates.push({ fileName, key, count });
    }
  }

  return duplicates;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = targets[args.target];

  if (!target) {
    console.error(`Unknown sync target "${args.target}". Use "local" or "production".`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n🔄 Syncing CLI tips to the ${target.label}\n`);

  // 1. Refuse to run without real credentials. The shipped .env.example still
  // contains USER:PASSWORD placeholders, which produce a confusing auth error
  // deep inside the database driver instead of a clear message here.
  if (!fs.existsSync(target.envFile)) {
    console.error(`❌ Missing env file: ${target.envFile}`);
    if (fs.existsSync(target.envExample)) {
      console.error(`   Create it from the template: ${target.envExample}`);
    }
    console.error("   Then set DATABASE_URL to your real connection string.");
    process.exitCode = 1;
    return;
  }

  const databaseUrl = readEnvValue(target.envFile, "DATABASE_URL");
  if (!databaseUrl) {
    console.error(`❌ DATABASE_URL is not set in ${target.envFile}.`);
    process.exitCode = 1;
    return;
  }

  if (/USER:PASSWORD/i.test(databaseUrl)) {
    console.error(`❌ DATABASE_URL in ${target.envFile} still contains the USER:PASSWORD placeholder.`);
    console.error("   Replace it with a real connection string, for example:");
    console.error('   DATABASE_URL="postgresql://user:password@localhost:55432/expertise_wins?schema=public"');
    process.exitCode = 1;
    return;
  }

  console.log(`   Target: ${describeDatabase(databaseUrl)}`);

  const dumpProblem = findMissingDate(args.target);
  if (dumpProblem) {
    console.error(`❌ ${dumpProblem}`);
    process.exitCode = 1;
    return;
  }

  // 2. Validate the dumps before touching the database so a malformed file
  // cannot half-apply an import. The seed then reconciles every row on the
  // dumped days against the dumps: a stale duplicate (a row scraped under the
  // older position-based id) is removed, a row filed on the wrong day is
  // re-dated, and any live row with no publication is named. A day holds well
  // under 100 tips, so the check is a few hundred rows.
  //
  // A dump that lists the same tip twice would land on one row, so the second
  // copy would silently disappear. That is a scrape bug, not a database fact,
  // so refuse to sync until it is fixed: a dump that contradicts itself is not
  // a truth yet.
  const duplicates = findDuplicateTips(dumpDirectory);
  if (duplicates.length > 0) {
    console.error(`❌ ${duplicates.length} tip(s) appear twice in their own dump:`);
    for (const { fileName, key, count } of duplicates) {
      console.error(`     ${fileName}: ${key} (${count} copies)`);
    }
    console.error("   They would collapse onto one row. Remove the duplicate from the dump, then re-run.");
    process.exitCode = 1;
    return;
  }

  const command = args.dryRun ? ["--dry-run"] : [];
  const result = spawnSync(process.execPath, [seedScript, ...command], {
    stdio: "inherit",
    env: {
      ...process.env,
      SEED_ENV_FILE: target.envFile,
      SEED_DUMP_DIR: dumpDirectory,
    },
  });

  if (result.status !== 0) {
    console.error(`\n❌ Sync failed. The ${target.label} was not updated.`);
    process.exitCode = result.status ?? 1;
    return;
  }

  console.log(
    args.dryRun
      ? `\n✅ Dry run passed. Re-run without --dry-run to write to the ${target.label}.`
      : `\n✅ Synced to the ${target.label}.`
  );
}

if (require.main === module) main();

module.exports = { parseArgs, readEnvValue, describeDatabase, findMissingDate, findDuplicateTips, targets };