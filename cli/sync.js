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
  const today = new Date().toISOString().slice(0, 10);
  const day = new Date().getDate();
  const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
  const month = new Date().toLocaleString("en-GB", { month: "short" });
  const expected = `freetips-${day}${suffix} ${month} ${new Date().getFullYear()}.json`;

  if (expected !== latest) {
    console.log(
      `   Note: there is no dump for today (${today}). /tips and /archive default to today, so they may look empty until you scrape.`
    );
  }

  return null;
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
  // cannot half-apply an import.
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

module.exports = { parseArgs, readEnvValue, describeDatabase, findMissingDate, targets };