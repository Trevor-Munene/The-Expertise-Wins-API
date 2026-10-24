const fs = require("fs");
const path = require("path");
const { parseDumpDay } = require("../lib/dump-day");

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
    // A refund means the bet never ran, so the stake comes back. It settles as
    // a void, never as a win or a loss.
    if (isRefundedLine(textLine)) return "void";
    return null;
}

// The channel sometimes refunds a card instead of marking it: "Refunded ♻️♻️".
// Those lines carry no tick or cross, and treating them as an ordinary silent
// selection is what used to make a refunded bet settle by the unmarked default
// (free = lose, paid = win). Detect the wording so the bet settles as void.
const REFUNDED_PATTERN = /refund(?:ed|s)?|\bmoney\s*back\b|\bstakes?\s+back\b/i;

function isRefundedLine(textLine) {
    if (!textLine) return false;
    return REFUNDED_PATTERN.test(textLine);
}

// The channel often does not settle the whole card straight away. Instead of a
// tick/cross it replies with a note such as "Plays today...♻️♻️": the fixture
// was pushed forward to a later day. It still belongs to the previous day's
// card, so that day settles it as a win and flags it as carried forward. The
// operator scrapes (and settles) the same fixture again with the next day's
// tips, so `next` reads the carried flag to settle the day that actually holds
// the fixture's real result instead of re-settling the older card.
const POSTPONED_PATTERN = /plays?\s+(?:today|later|tomorrow)|\bpostponed\b|\brearranged\b|\bplay(?:ed|s)?\s+on\s+a\s+later|♻/i;

function isPostponedLine(textLine) {
    if (!textLine) return false;
    // "Refunded ♻️♻️" uses the same recycling emoji; it is a refund, not a
    // push-forward, so it must never land here.
    if (isRefundedLine(textLine)) return false;
    return POSTPONED_PATTERN.test(textLine);
}

// A pushed-forward note ("Plays today...♻️♻️") sits on its own line under the
// fixture, not on a selection line. Selection lines end with "@<odds> - <n>
// Units" and can carry the recycling emoji themselves (a heated carried line),
// so only a line without a printed price can decide that the fixture moved.
function isPushForwardNote(textLine) {
    if (!isPostponedLine(textLine)) return false;
    // A pushed-forward note names no market, so a line that prints a selection
    // and a price is a selection line, whatever emoji it may also carry.
    return !/@\s*\d/.test(textLine) && !/\b(?:over|under|btts|both\s+teams|win|draw|money\s*line|spread|handicap|total)\b/i.test(textLine);
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

    // Compare letters and digits only, so a channel "Over 18.5" still matches
    // a stored "Over (18/5)". A selection that is itself a whole word (such as
    // "Win") must match whole words only, otherwise it would match a price or
    // a stake on a neighbouring card.
    const lineKey = cleanLine.replace(/[^a-z0-9]/g, "");
    const selectionKey = normalizeForMatch(selection).replace(/[^a-z0-9]/g, "");
    if (selectionKey) {
        const isSingleWord = !normalizeForMatch(selection).includes(" ");
        if (isSingleWord ? ` ${cleanLine} `.includes(` ${normalizeForMatch(selection)} `) : lineKey.includes(selectionKey)) {
            return true;
        }
    }

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
        // as unmarked. Start from the beginning of the line the fixture is on so
        // the block matches the pasted card as it was written.
        let from = 0;
        while (blocks.length < 12) {
            const match = txtLower.indexOf(home, from);
            if (match === -1) break;
            const index = txtContent.lastIndexOf("\n", match) + 1;
            blocks.push(txtContent.substring(index, index + BLOCK_WINDOW));
            from = match + home.length;
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
            if (isPushForwardNote(line)) return { outcome: null, marker: line };
        }
    }
    return { outcome: null, marker: null };
}

// True when the fixture's card carries a pushed-forward note. The channel posts
// "Plays today...♻️♻️" under the fixture (and sometimes on the selection line),
// so the note is a property of the whole card: every selection of that fixture
// moved, even though no individual line was marked.
function hasPushForwardNote(blocks) {
    return blocks.some(blockText => hasCardNote(blockText, isPushForwardNote));
}

// A card starts at its fixture name; a timestamped message or a sport header
// ("🎾 || Fixture", or a bare "Tennis" line) starts the next card.
const CARD_HEADER_PATTERN = /^\s*(?:\[\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\S{0,4}\s*\|\||(?:tennis|basketball|ice\s*hockey|football|soccer|nfl|golf)\s*:?\s*$)/i;

// A refund note is posted under a card, so it may only be read from the card
// whose selections it follows. The search is limited to the card itself and
// stops at the next card, otherwise a refund on one fixture would void the
// fixture listed after it. Only the preview prose may follow the fixture, so a
// note after the last selection is the card's own closing note.
function hasCardNote(blockText, predicate) {
    const lines = blockText.split("\n");
    const card = [lines[0]];
    let seenSelection = false;

    for (const line of lines.slice(1)) {
        if (CARD_HEADER_PATTERN.test(line)) break;
        if (/@\s*\d/.test(line)) {
            seenSelection = true;
            continue;
        }
        // The refund/push note that closes the card follows the last selection
        // (usually after a blank line); anything else after it belongs to the
        // next card.
        if (seenSelection) {
            if (line.trim() === "") continue;
            if (predicate(line)) card.push(line);
            break;
        }
        card.push(line);
    }

    return card.some(predicate);
}

// True when the fixture's own card carries a refund note ("Refunded ♻️♻️").
// Like a push-forward note it voids every selection on the card, whether or not
// each line was marked.
function hasRefundedNote(blocks) {
    return blocks.some(blockText => hasCardNote(blockText, isRefundedLine));
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
    // A selection that is really settled must not keep an earlier carry marker.
    if (tip.postponed) delete tip.postponed;
    return true;
}

// A fixture the channel pushed forward ("Plays today...♻️♻️") still belongs to
// the previous day's card, so it settles as a win there and is flagged as
// carried forward. The operator scrapes (and settles) the same fixture again
// with the next day's tips, which is why it must not be counted twice.
function applyCarriedWin(tip) {
    tip.outcome = "win";
    tip.status = "settled";
    tip.postponed = true;
}

// True when a tip is a carried-forward win from an earlier run. Such a tip is
// already decided and must never be re-decided or counted again.
function isCarriedForward(tip) {
    return Boolean(tip && tip.postponed);
}

// A dump may carry tips that were already settled or carried by an earlier run
// (a started settlement is idempotent). Those entries are left untouched.
function isAlreadyDecided(tip) {
    return Boolean(tip && (tip.status === "settled" || tip.outcome));
}

// True when a day is waiting on fixtures that were pushed forward. Every tip is
// settled, and at least one is flagged as carried into a later day.
function isCarriedForwardDay(tips) {
    if (!Array.isArray(tips) || tips.length === 0) return false;
    return tips.every(isAlreadyDecided) && tips.some(isCarriedForward);
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

const dumpDirectory = path.resolve(__dirname, "previous-day-results");

// "freetips-21st Oct 2026.json" -> "2026-10-21". Returns null for any other name.
// Delegates to the shared helper: `new Date("Sept 1, 2000")` is Invalid Date, so
// every September dump used to resolve to null here.
function parseDumpDate(fileName) {
    return parseDumpDay(fileName);
}

function resolveJsonPath(dateIso) {
    const settlementDate = dateIso || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const formattedDate = getFormattedDate(settlementDate);
    const dated = path.join(dumpDirectory, `freetips-${formattedDate}.json`);

    // Require a JSON dump for the exact specified date; do not fall back to
    // the most recent dump, because settling the wrong day would silently
    // corrupt that day's record.
    return dated;
}

// The youngest day, before `dateIso`, whose fixtures were pushed forward. A
// fixture carried by day N is included in day N+1's tips (the operator scrapes
// it again), so its real result lives in day N+1's settlement text. Settling
// that dump through `next` is what clears the carried fixture instead of
// re-settling the older day with the wrong text.
function findCarriedForwardDate(dateIso) {
    if (!fs.existsSync(dumpDirectory)) return null;

    const formattedDate = getFormattedDate(dateIso);
    const todayDump = `freetips-${formattedDate}.json`;

    const dated = fs
        .readdirSync(dumpDirectory)
        .filter(file => /^freetips-.*\.json$/i.test(file))
        .map(file => ({ file, dateIso: parseDumpDate(file) }))
        .filter(entry => entry.dateIso && entry.dateIso < dateIso && entry.file !== todayDump)
        .sort((a, b) => (a.dateIso < b.dateIso ? 1 : a.dateIso > b.dateIso ? -1 : 0));

    for (const entry of dated) {
        let tips;
        try {
            tips = JSON.parse(fs.readFileSync(path.join(dumpDirectory, entry.file), "utf8"));
        } catch {
            continue;
        }
        if (isCarriedForwardDay(tips)) return entry.dateIso;
    }

    return null;
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
    //  - a tick/cross decides it, a refund note voids it;
    //  - a "Plays today...♻️♻️" note means pushed forward: the fixture still
    //    belongs to this day's card, so it settles as a win and is flagged as
    //    carried forward so `next` can settle the day that holds its real result;
    //  - silence means the channel did not address it, so the unmarked default
    //    applies to this fixture.
    const resolveSelection = (selection, odds, stakeUnits, blocks) => {
        const { outcome } = findSelectionResult(selection, odds, stakeUnits, blocks);
        return { outcome };
    };

    // Process each tip
    tips.forEach(tip => {
        // A tip decided by an earlier settlement run stays untouched, so
        // re-running for the same day is idempotent. A carried-forward win keeps
        // its flag so the day still lists what moved to the next day.
        if (isAlreadyDecided(tip)) {
            if (isCarriedForward(tip)) carriedForwardCount++;
            else settledCount++;
            return;
        }

        const blocks = collectFixtureBlocks(txtContent, txtLower, tip);
        const bumped = hasPushForwardNote(blocks);
        const refunded = hasRefundedNote(blocks);
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

        // A fixture the channel pushed forward has no tick or cross of its own,
        // so every unsettled selection on it is settled as a win and the tip is
        // flagged as carried forward. Anything marked explicitly (win, lose or
        // refund) is honoured even on a carried card.
        const carried = bumped && results.some(r => !r.result.outcome);

        // A refunded card returns every stake, so any selection the channel did
        // not mark explicitly is void rather than settled by the unmarked default.
        const fallback = refunded ? "void" : carried ? "win" : null;

        // The unmarked default (free = lose, paid = win) applies when the channel
        // left a selection silent on a fixture that did play.
        const defaultOutcome = isFreeFootballTip(tip) ? "lose" : "win";
        results.forEach(r => {
            const resolved = r.result.outcome || fallback || defaultOutcome;
            applyOutcome(r.tip, resolved);
                if (refunded) r.tip.outcome = "void";
        });

        if (refunded) tip.outcome = "void";

        if (carried) {
            applyCarriedWin(tip);
            carriedForwardCount++;
        } else {
            if (tip.postponed) delete tip.postponed;
            settledCount++;
        }
    });

    // Write the settled dump back so the next sync can publish it.
    fs.writeFileSync(jsonPath, JSON.stringify(tips, null, 2), "utf8");
    console.log(`✅ Settled ${settledCount} tips in ${jsonPath}`);
    if (carriedForwardCount > 0) {
        console.log(
            `♻️  ${carriedForwardCount} tip(s) played on a later day ("Plays today"): settled as a win and carried forward.`
        );
    }
    console.log(`🔄 Re-run \`npm run sync\` to publish these results to the database.`);

    return tips;
}

module.exports = {
    processSettlement,
    resetSettlement,
    resolveJsonPath,
    findCarriedForwardDate,
    parseDumpDate,
    isCarriedForwardDay,
    getFormattedDate,
    isFreeFootballTip,
    isPostponedLine,
    isPushForwardNote,
    isRefundedLine,
    determineOutcome,
};