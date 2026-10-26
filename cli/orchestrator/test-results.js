const fs = require("fs");
const path = require("path");

const resultsRoot = path.resolve(__dirname, "test-results");
const htmlSnapshotDir = path.resolve(__dirname, "free-tips");
// The settlement layer owns its own dump directory so the previous day's
// results live next to the settlement tooling that reads them.
//
// CLI_DUMP_DIR points the dumps (and the working file beside them) at another
// directory. The tests use it so a test run can never rewrite the real dumps,
// which are the only complete record of a day.
const dumpRoot = process.env.CLI_DUMP_DIR ? path.resolve(process.env.CLI_DUMP_DIR) : null;
const previousDayResultsRoot = dumpRoot || path.resolve(__dirname, "..", "settlement", "previous-day-results");
const workingResultsRoot = dumpRoot ? path.join(dumpRoot, "working") : resultsRoot;

function getFormattedDate(dateIso) {
    // An ISO day key ("2026-10-25") is a calendar date, not an instant: parse it
    // as UTC. `new Date("2026-10-25")` is already UTC, but the accessors below
    // are local, so west of UTC the formatted name would slip to the 24th and
    // the dump would be filed under the wrong day. Explicit parts, no parsing.
    const dayKey = typeof dateIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : null;
    if (dayKey) {
        const [year, month, day] = dayKey.split("-").map(Number);
        const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
        const monthName = new Date(Date.UTC(year, month - 1, day)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
        return `${day}${suffix} ${monthName} ${year}`;
    }

    const d = dateIso ? new Date(dateIso) : new Date();
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
}

// The identity of a tip inside a day: the same bet seen by a later scrape is
// the same record and is updated in place, never appended twice.
const tipKey = (t) => `${t.homeTeam}|${t.awayTeam}|${t.selection}|${t.market}`;

// Fields the settlement layer owns. A scrape must never clear or overwrite them:
// the site rolls a settled tip off the list, so seeing it again with no outcome
// means "still pending" at the source, not "unsettle it".
const SETTLEMENT_FIELDS = ["status", "outcome", "result", "postponed", "settledAt"];

// A tip already settled or carried forward is decided history.
const isDecided = (t) => Boolean(t && (t.status === "settled" || t.outcome || t.postponed));

// Fields a re-scrape carries into an entry already in the dump. The previous
// entry keeps everything else, so fields the site has just dropped (kickoff,
// analytics, extra tips, ...) are not lost when the card is republished.
const REFRESH_FIELDS = [
    "odds", "stakeUnits", "kickoff", "time", "detailsUrl", "previewTitle",
    "preview", "verdict", "tips", "extraTips", "analytics", "sport",
    "competition", "league", "country", "source", "externalId",
];

// A value the site did not print. An empty string and an empty list are how the
// normalizer spells "nothing here", and they must not erase what is stored just
// because the field is present in the fresh record.
const isMissing = (value) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

// Merge one freshly scraped tip over the copy already held for the day.
// The fresh record wins on every scraped field it actually carries; the held
// record keeps anything the fresh one is missing, and keeps its settlement.
function mergeTip(existing, incoming) {
    if (!existing) return incoming;

    const merged = { ...existing, ...incoming };
    for (const field of REFRESH_FIELDS) {
        if (field in existing && isMissing(incoming[field]) && !isMissing(existing[field])) {
            merged[field] = existing[field];
        }
    }

    if (isDecided(existing)) {
        for (const field of SETTLEMENT_FIELDS) {
            if (field in existing) merged[field] = existing[field];
        }
    }

    return merged;
}

function resultPath(source) {
    // Save directly under test-results, not in a date folder
    return path.join(workingResultsRoot, `${source}.json`);
}

function clearDownloadedHtmlFiles() {
    const snapshotDir = htmlSnapshotDir;
    const targetFiles = [
        path.resolve(__dirname, "free-tips.html"),
        path.join(snapshotDir, "freetips.html"),
    ];

    for (const target of targetFiles) {
        try {
            if (fs.existsSync(target)) fs.rmSync(target, { force: true });
        } catch {
            // best effort
        }
    }

    try {
        if (!fs.existsSync(snapshotDir)) return;
        for (const entry of fs.readdirSync(snapshotDir, { withFileTypes: true })) {
            if (!entry.isFile()) continue;
            if (/\.(html?|htm)$/i.test(entry.name)) {
                fs.rmSync(path.join(snapshotDir, entry.name), { force: true });
            }
        }
    } catch {
        // best effort
    }
}

/**
 * Save test results directly into `orchestrator/test-results/<source>.json`.
 * It updates existing tips for the same day without overwriting them.
 * It also exports a dump into `previous-day-results/<source>-<formatted-date>.json`.
 */
function saveTestResults(source, tips, opts = {}) {
    const dateIso = opts.date; // e.g. YYYY-MM-DD
    // A caller that knows the day's true instant (the orchestrator) passes it so
    // a tip cannot be filed under yesterday because the normalizer stamped UTC.
    const scrapedAt = opts.scrapedAt;
    const incoming = (Array.isArray(tips) ? tips : []).map((tip) =>
        scrapedAt && tip && typeof tip === "object" ? { ...tip, scrapedAt } : tip
    );
    fs.mkdirSync(workingResultsRoot, { recursive: true });
    const targetFile = resultPath(source);

    let existingTips = [];
    if (fs.existsSync(targetFile)) {
        try {
            existingTips = JSON.parse(fs.readFileSync(targetFile, "utf8"));
            if (!Array.isArray(existingTips)) existingTips = [];
        } catch (err) {
            existingTips = [];
        }
    }

    // Filter existing tips to only keep those from the current day.
    // If the file contains yesterday's tips, we drop them here because they're
    // already safely saved in the previous day dump.
    if (dateIso) {
        existingTips = existingTips.filter(t => {
            if (!t.scrapedAt) return false;
            return t.scrapedAt.startsWith(dateIso);
        });
    }

    // Merge tips based on unique identifiers to update (not overwrite)
    const map = new Map();
    const getKey = tipKey;

    existingTips.forEach(t => map.set(getKey(t), t));
    incoming.forEach(t => map.set(getKey(t), mergeTip(map.get(getKey(t)), t)));

    const mergedTips = Array.from(map.values());

    // A merge must never drop a tip. If it does, the identity key above is too
    // loose for this input and every later count is suspect, so fail loudly.
    if (mergedTips.length < incoming.length) {
        throw new Error(
            `saveTestResults(${source}): merged ${mergedTips.length} tips from ${incoming.length} incoming ` +
            `records and ${existingTips.length} existing records. A merge must not drop tips.`
        );
    }

    // Save current day's tips directly to test-results/freetips.json
    fs.writeFileSync(targetFile, JSON.stringify(mergedTips, null, 2), "utf8");

    // Export the dump to the previous day results dir (settlement layer) so a
    // dated JSON copy of the day's tips always exists, even if the database
    // later fails — the dumps are the manual record we can reconstruct from.
    //
    // Update the day's dump with this scrape. Earlier runs of the same day are
    // kept and merged, never replaced: the dump is the only complete record of a
    // day, so a later scrape that returns fewer tips (the site paginates, or tips
    // roll off the list) must add to it rather than truncate it.
    //
    // The merge is the same identity key used above and the same field rules as
    // mergeTip, so a tip seen again picks up the fresh odds, keeps the fields
    // the site has just dropped, and keeps the settlement it already carried.
    fs.mkdirSync(previousDayResultsRoot, { recursive: true });
    const formattedDate = getFormattedDate(dateIso);
    const exportFile = path.join(previousDayResultsRoot, `${source}-${formattedDate}.json`);
    let dumpTips = [];
    if (fs.existsSync(exportFile)) {
        try {
            const existingDump = JSON.parse(fs.readFileSync(exportFile, "utf8"));
            // A malformed dump protects nothing; the merged day replaces it. The
            // copy is kept as .corrupt so the bad file can still be inspected.
            if (Array.isArray(existingDump)) dumpTips = existingDump;
            else fs.copyFileSync(exportFile, `${exportFile}.corrupt`);
        } catch {
            try {
                fs.copyFileSync(exportFile, `${exportFile}.corrupt`);
            } catch {
                // best effort
            }
        }
    }
    const dumpMap = new Map();
    const dumpKeys = new Set();
    dumpTips.forEach((t) => {
        if (!t || typeof t !== "object") return;
        dumpKeys.add(getKey(t));
        dumpMap.set(getKey(t), t);
    });

    // Everything the dump ends up holding: what it already held, plus any tip
    // this scrape brings that it did not. A tip the dump already holds is
    // refreshed by the scrape, with its settlement kept.
    for (const t of mergedTips) {
        const key = getKey(t);
        dumpMap.set(key, dumpKeys.has(key) ? mergeTip(dumpMap.get(key), t) : t);
    }
    const nextDumpTips = Array.from(dumpMap.values());

    // Only same-day tips may be protected. The working file can still hold a
    // stray tip from another day; counting it here would let a dropped same-day
    // tip hide behind yesterday's record.
    const expectedCount = dumpTips.length + mergedTips.filter((t) => !dumpKeys.has(getKey(t))).length;
    if (nextDumpTips.length < expectedCount) {
        throw new Error(
            `saveTestResults(${source}): merging into ${exportFile} would keep ${nextDumpTips.length} tips from ` +
            `${dumpTips.length} dumped and ${mergedTips.length} scraped. A dump update must not drop tips.`
        );
    }

    const shouldWriteDump = JSON.stringify(nextDumpTips) !== JSON.stringify(dumpTips);
    if (shouldWriteDump) {
        fs.writeFileSync(exportFile, JSON.stringify(nextDumpTips, null, 2), "utf8");
    }

    // Report what was written so a caller can verify the count after the merge.
    return { targetFile, exportFile, written: shouldWriteDump, count: mergedTips.length, dumpCount: nextDumpTips.length, dateIso: dateIso || null };
}

function loadTestResults(source, opts = {}) {
    // Load from test-results/<source>.json directly
    const filePath = resultPath(source);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing ${source} test results at ${filePath}. Run the orchestrator before running contract tests.`);
    }

    const tips = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(tips)) throw new Error(`Saved ${source} test results must be an array.`);
    return tips;
}

module.exports = { saveTestResults, loadTestResults, clearDownloadedHtmlFiles, getFormattedDate, mergeTip };