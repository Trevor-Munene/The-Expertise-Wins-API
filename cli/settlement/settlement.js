const fs = require("fs");
const path = require("path");

function getFormattedDate(dateIso) {
    const d = dateIso ? new Date(dateIso) : new Date();
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
}

// How far past a fixture's first mention the pasted text is searched for its
// selection lines. Big enough to span a full card (fixture, preview, verdict,
// selections), because a card that is cut off mid-preview reads as unmarked.
const BLOCK_WINDOW = 2000;

function determineOutcome(textLine) {
    if (!textLine) return null;
    if (textLine.includes("✅✅")) return "win";
    if (textLine.includes("❎❎")) return "lose";
    return null;
}

// The channel often does not settle the whole card straight away. Instead of a
// tick/cross it replies with a note such as "Plays today...♻️♻️": the fixture
// was pushed forward to a later day, so it is neither won nor lost yet. Those
// lines carry no outcome marker of their own, and treating them as an ordinary
// silent selection is what used to make a postponed fixture settle as a loss
// (free) or as an unmarked win (paid). Detect the note so the selection can be
// carried to the postponed set instead.
const POSTPONED_PATTERN = /plays?\s+(?:today|later|tomorrow)|\bpostponed\b|\brearranged\b|\bplay(?:ed|s)?\s+on\s+a\s+later|♻/i;

function isPostponedLine(textLine) {
    if (!textLine) return false;
    return POSTPONED_PATTERN.test(textLine);
}

// Normalize a string for comparison: strip punctuation that differs between
// the dump and the pasted results (parentheses, slashes, dashes) so that a
// selection like "Over (9/10)" can match a pasted "Over 9/10".
function normalizeForMatch(value) {
    return String(value == null ? "" : value)
        .toLowerCase()
        .replace(/[()[\]{}]/g, " ")
        .replace(/[/\\|,-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// True when a result line plausibly describes this selection. The dump stores
// a cleaned selection (for example "Over (9/10)") while the pasted channel
// text carries the original wording (for example "Over Total Goals"). A
// strict substring test therefore misses real markers and wrongly leaves
// those tips unsettled, so fall back to comparing the price/stake line.
function selectionMatchesLine(selection, odds, stakeUnits, line) {
    const cleanLine = normalizeForMatch(line);
    if (!cleanLine) return false;

    const cleanSelection = normalizeForMatch(selection);
    if (cleanSelection && cleanLine.includes(cleanSelection)) return true;

    // Fall back to the bet's printed line. Every pasted result line ends with
    // "<odds> - <n> Unit(s)", which stays stable even when the bet is reworded.
    // Compare prices numerically because the dump may store 1.9 while the
    // channel prints 1.90, and a text pattern cannot bridge that difference.
    const oddsValue = Number(odds);
    const stakeValue = Number(stakeUnits);
    if (!Number.isFinite(oddsValue) || !Number.isFinite(stakeValue)) return false;

    const priceOnLine = line.match(/@\s*(\d+(?:\.\d+)?)/);
    if (!priceOnLine || Math.abs(Number(priceOnLine[1]) - oddsValue) > 0.001) return false;

    const stakePattern = new RegExp(`(?:^|[^\\d])${stakeValue}\\s*units?\\b`, "i");
    return stakePattern.test(line);
}

// Collect candidate blocks for a fixture. The home team's name can appear in
// an unrelated fixture earlier in the text (for example "South Korea U23 vs
// Japan U23" before the real "Japan v Iran" card), so every occurrence is
// returned and each is tried until one yields a marker.
function collectFixtureBlocks(txtContent, txtLower, tip) {
    const blocks = [];
    const home = String(tip.homeTeam || "").toLowerCase().trim();

    if (home) {
        // Use a generous window: a pasted card can list the fixture, then the
        // league/preview/verdict prose, then the selection lines. A short window
        // cuts the card off before those lines and wrongly reports the fixture
        // as unmarked.
        let from = 0;
        while (blocks.length < 12) {
            const index = txtLower.indexOf(home, from);
            if (index === -1) break;
            blocks.push(txtContent.substring(index, index + BLOCK_WINDOW));
            from = index + home.length;
        }
    }

    // Tips without a fixture (outrights) can only be matched on the selection.
    if (blocks.length === 0 && tip.selection) {
        const needle = String(tip.selection).toLowerCase();
        const index = txtLower.indexOf(needle);
        if (index !== -1) blocks.push(txtContent.substring(index, index + BLOCK_WINDOW));
    }

    return blocks;
}

// Find the outcome for one selection across the fixture's candidate blocks.
// Returns { outcome, marker } where `marker` is the raw line that decided it: a
// tick/cross line, a "Plays today...♻️♻️" note line, or null when nothing in
// the pasted text addressed the selection. Keep the marker so callers can tell
// a genuine cross (❎❎) apart from a replayed/postponed fixture.
function findSelectionResult(selection, odds, stakeUnits, blocks) {
    for (const blockText of blocks) {
        for (const line of blockText.split("\n")) {
            if (!selectionMatchesLine(selection, odds, stakeUnits, line)) continue;
            const outcome = determineOutcome(line);
            if (outcome) return { outcome, marker: line };
            if (isPostponedLine(line)) return { outcome: null, marker: line };
        }
    }
    return { outcome: null, marker: null };
}

// A tip is "free" only when it is a non-featured football listing. Paid tiers
// (featured/Bet of the Day, and every non-football sport such as basketball,
// tennis, ice hockey) use the paid-group default outcome.
function isFreeFootballTip(tip) {
    const sport = String(tip.sport || "").toLowerCase();
    if (sport !== "football" && sport !== "soccer") return false;

    const label = `${tip.competition || ""} ${tip.previewTitle || ""}`.toLowerCase();
    const isFeatured = Boolean(tip.isFeatured) || /bet of the day/.test(label);
    return !isFeatured;
}

// Apply an outcome to the tip and any nested selections it carries.
function applyOutcome(tip, outcome) {
    if (!outcome) return false;
    tip.outcome = outcome;
    tip.status = "settled";
    // A selection that is now really settled must not still be flagged as
    // postponed from an earlier run.
    if (tip.postponed) delete tip.postponed;
    return true;
}

// A fixture the channel pushed forward ("Plays today...♻️♻️", or a fixture the
// pasted text did not mention at all) is NOT a loss. It simply has not finished,
// so it must survive to the next settlement run instead of being settled by the
// channel's unmarked default. Mark it pending and postponed; `settlement` treats
// such entries as already handled so a previous day can be settled repeatedly
// without flipping them, and `reset-settlement` can put a day back to pending.
function markPostponed(tip) {
    tip.status = "pending";
    tip.outcome = null;
    tip.postponed = true;
}

// True when a tip was already carried forward by an earlier settlement run.
function isCarriedForward(tip) {
    return Boolean(tip && tip.postponed && (!tip.outcome || tip.status === "pending"));
}

// Undo a settlement for a day: put every tip back to pending (outcomes and
// nested outcomes cleared, postponed flags dropped) so the day can be pasted
// and settled again. Useful when a pushed-forward fixture has now played.
function resetSettlement(dateIso) {
    const jsonPath = resolveJsonPath(dateIso);
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: JSON dump not found for date ${dateIso} at ${jsonPath}`);
        process.exit(1);
    }

    const tips = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const resetOne = t => {
        t.outcome = null;
        t.status = "pending";
        if (t.postponed) delete t.postponed;
    };

    tips.forEach(tip => {
        resetOne(tip);
        if (Array.isArray(tip.tips)) tip.tips.forEach(resetOne);
        if (Array.isArray(tip.extraTips)) tip.extraTips.forEach(resetOne);
    });

    fs.writeFileSync(jsonPath, JSON.stringify(tips, null, 2), "utf8");
    console.log(`🔄 Reset ${tips.length} tip(s) to pending in ${jsonPath}`);
    return tips;
}

function resolveJsonPath(dateIso) {
    const jsonDir = path.resolve(__dirname, "previous-day-results");
    const settlementDate = dateIso || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const formattedDate = getFormattedDate(settlementDate);
    const dated = path.join(jsonDir, `freetips-${formattedDate}.json`);

    // Require a JSON dump for the exact specified date; do not fall back to
    // the most recent dump, because settling the wrong day would silently
    // corrupt that day's record.
    return dated;
}

function processSettlement(dateIso, txtFilePath) {
    const jsonPath = resolveJsonPath(dateIso);

    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: JSON dump not found for date ${dateIso} at ${jsonPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(txtFilePath)) {
        console.error(`Error: Text file not found at ${txtFilePath}`);
        process.exit(1);
    }

    const tips = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    // An empty dated dump means no tips were exported for that day (for example a
    // day the scraper did not run). There is nothing to settle, and reporting a
    // cheerful "Settled 0 tips" here is misleading — it looks like the settlement
    // ran but found no markers. Fail loudly so the operator notices the gap
    // instead of publishing a day with no results.
    if (!Array.isArray(tips) || tips.length === 0) {
        console.error(`Error: JSON dump for date ${dateIso} is empty (no tips to settle) at ${jsonPath}`);
        console.error("   Run `npm run expertise` to scrape and export that day's tips before settling.");
        process.exit(1);
    }

    const txtContent = fs.readFileSync(txtFilePath, "utf8");
    const txtLower = txtContent.toLowerCase();

    let settledCount = 0;
    let carriedForwardCount = 0;

    // Resolve one selection against the pasted text.
    //  - a tick/cross marker decides it;
    //  - a "Plays today...♻️♻️" note means pushed forward, so it stays pending;
    //  - silence (no line, or a fixture absent from the text) is NOT a loss. The
    //    channel only settles the previous day, so a fixture it did not address
    //    is almost always one that got pushed forward with the rest of the card.
    const resolveSelection = (selection, odds, stakeUnits, blocks) => {
        const { outcome } = findSelectionResult(selection, odds, stakeUnits, blocks);
        if (outcome) return { outcome };
        // Anything unresolved is carried forward rather than guessed, which keeps
        // settlement conservative and idempotent for a day settled more than once.
        return { outcome: null };
    };

    // Process each tip
    tips.forEach(tip => {
        // A tip carried forward by an earlier run stays untouched, so re-running
        // the settlement for the same day is idempotent and never re-decides it.
        if (isCarriedForward(tip)) {
            carriedForwardCount++;
            return;
        }

        const blocks = collectFixtureBlocks(txtContent, txtLower, tip);
        const results = [];

        // Main selection
        if (tip.selection) {
            results.push({
                tip,
                result: resolveSelection(tip.selection, tip.odds, tip.stakeUnits, blocks),
            });
        }

        // Nested selections and extra tips share the fixture's blocks.
        if (Array.isArray(tip.tips)) {
            tip.tips.forEach(t => {
                results.push({
                    tip: t,
                    result: resolveSelection(
                        t.selection,
                        t.odds ?? tip.odds,
                        t.stakeUnits ?? t.units ?? tip.stakeUnits,
                        blocks
                    ),
                });
            });
        }

        if (Array.isArray(tip.extraTips)) {
            tip.extraTips.forEach(t => {
                results.push({
                    tip: t,
                    result: resolveSelection(
                        t.selection,
                        t.odds ?? tip.odds,
                        t.stakeUnits ?? t.units ?? tip.stakeUnits,
                        blocks
                    ),
                });
            });
        }

        // Nothing on this tip was decided: carry the whole fixture forward.
        if (results.every(r => !r.result.outcome)) {
            markPostponed(tip);
            results.forEach(r => markPostponed(r.tip));
            carriedForwardCount++;
            return;
        }

        // At least one selection landed, so the fixture did play: settle it.
        // Any individual selection that still has no outcome falls back to the
        // channel's unmarked default (free = lose, paid = win), which is now only
        // used for a fixture that provably played.
        const defaultOutcome = isFreeFootballTip(tip) ? "lose" : "win";
        results.forEach(r => {
            applyOutcome(r.tip, r.result.outcome || defaultOutcome);
        });
        settledCount++;
    });

    // Write the settled dump back so the next sync can publish it.
    fs.writeFileSync(jsonPath, JSON.stringify(tips, null, 2), "utf8");
    console.log(`✅ Settled ${settledCount} tips in ${jsonPath}`);
    if (carriedForwardCount > 0) {
        console.log(
            `♻️  ${carriedForwardCount} tip(s) had no result marker (pushed forward) and stay pending, not lost.`
        );
    }
    console.log(`🔄 Re-run \`npm run sync\` to publish these results to the database.`);

    return tips;
}

module.exports = {
    processSettlement,
    resetSettlement,
    resolveJsonPath,
    getFormattedDate,
    isFreeFootballTip,
    isPostponedLine,
};