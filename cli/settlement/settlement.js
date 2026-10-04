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

function determineOutcome(textLine) {
    if (!textLine) return null;
    if (textLine.includes("✅✅")) return "win";
    if (textLine.includes("❎❎")) return "lose";
    return null;
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
        let from = 0;
        while (blocks.length < 12) {
            const index = txtLower.indexOf(home, from);
            if (index === -1) break;
            blocks.push(txtContent.substring(index, index + 1000));
            from = index + home.length;
        }
    }

    // Tips without a fixture (outrights) can only be matched on the selection.
    if (blocks.length === 0 && tip.selection) {
        const needle = String(tip.selection).toLowerCase();
        const index = txtLower.indexOf(needle);
        if (index !== -1) blocks.push(txtContent.substring(index, index + 500));
    }

    return blocks;
}

// Find the outcome for one selection across the fixture's candidate blocks.
function checkTipOutcome(selection, odds, stakeUnits, blocks, defaultOutcome = null) {
    for (const blockText of blocks) {
        for (const line of blockText.split("\n")) {
            if (selectionMatchesLine(selection, odds, stakeUnits, line)) {
                const outcome = determineOutcome(line);
                if (outcome) return outcome;
            }
        }
    }
    return defaultOutcome;
}

// A tip is "free" only when it is a non-featured football listing. Paid tiers
// (featured/Bet of the Day, and every non-football sport such as basketball,
// tennis, ice hockey) must never be auto-marked as a loss: if their marker is
// missing from the pasted text they stay unsettled so the operator can supply
// it rather than silently recording a false loss.
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
    return true;
}

function resolveJsonPath(dateIso) {
    const jsonDir = path.resolve(__dirname, "previous-day-results");
    const formattedDate = getFormattedDate(dateIso);
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
    const txtContent = fs.readFileSync(txtFilePath, "utf8");
    const txtLower = txtContent.toLowerCase();

    let settledCount = 0;
    let unsettledCount = 0;

    // Process each tip
    tips.forEach(tip => {
        const isFreeTip = isFreeFootballTip(tip);

        // Only free football tips default to a loss when unmarked; paid tips
        // stay unsettled so a missing marker is never recorded as a false loss.
        const defaultOutcome = isFreeTip ? "lose" : null;

        const blocks = collectFixtureBlocks(txtContent, txtLower, tip);

        if (blocks.length === 0) {
            // The fixture is absent from the pasted results entirely.
            if (isFreeTip) {
                applyOutcome(tip, "lose");
                if (Array.isArray(tip.tips)) tip.tips.forEach(t => applyOutcome(t, "lose"));
                if (Array.isArray(tip.extraTips)) tip.extraTips.forEach(t => applyOutcome(t, "lose"));
                settledCount++;
            } else {
                unsettledCount++;
            }
            return;
        }

        // Main selection
        if (tip.selection) {
            const outcome = checkTipOutcome(tip.selection, tip.odds, tip.stakeUnits, blocks, defaultOutcome);
            if (applyOutcome(tip, outcome)) {
                settledCount++;
            } else {
                unsettledCount++;
            }
        }

        // Nested selections and extra tips share the fixture's blocks.
        if (Array.isArray(tip.tips)) {
            tip.tips.forEach(t => {
                const out = checkTipOutcome(
                    t.selection,
                    t.odds ?? tip.odds,
                    t.stakeUnits ?? t.units ?? tip.stakeUnits,
                    blocks,
                    defaultOutcome
                );
                applyOutcome(t, out);
            });
        }

        if (Array.isArray(tip.extraTips)) {
            tip.extraTips.forEach(t => {
                const out = checkTipOutcome(
                    t.selection,
                    t.odds ?? tip.odds,
                    t.stakeUnits ?? t.units ?? tip.stakeUnits,
                    blocks,
                    defaultOutcome
                );
                applyOutcome(t, out);
            });
        }
    });

    // Write the settled dump back so the next sync can publish it.
    fs.writeFileSync(jsonPath, JSON.stringify(tips, null, 2), "utf8");
    console.log(`✅ Settled ${settledCount} tips in ${jsonPath}`);
    if (unsettledCount > 0) {
        console.log(`⏳ ${unsettledCount} paid tip(s) have no marker yet and stay unsettled.`);
    }
    console.log(`🔄 Re-run \`npm run sync\` to publish these results to the database.`);

    return tips;
}

module.exports = { processSettlement, resolveJsonPath, getFormattedDate, isFreeFootballTip };