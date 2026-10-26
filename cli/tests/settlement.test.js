const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    processSettlement,
    resetSettlement,
    resolveJsonPath,
    findCarriedForwardDate,
    isCarriedForwardDay,
    parseDumpDate,
    getFormattedDate,
    isPostponedLine,
    isRefundedLine,
    determineOutcome,
} = require("../settlement/settlement");
const { withHeat, parseArgs } = require("../settlement/app");
const { TipsConsumptionClient } = require("../services/tips.client");

// ---------------------------------------------------------------------------
// Fixtures are written to a throwaway date so they never collide with the real
// previous-day dumps. Everything created here is removed in the finally block.
// ---------------------------------------------------------------------------
const TEST_DATE = "1999-01-01"; // 1st Jan 1999
const TEST_FORMATTED_DATE = getFormattedDate(TEST_DATE);
const settlementDir = path.resolve(__dirname, "..", "settlement");
const previousDayResultsDir = path.join(settlementDir, "previous-day-results");
const testJsonPath = path.join(previousDayResultsDir, `freetips-${TEST_FORMATTED_DATE}.json`);

const win = (selection, market, units) => ({ selection, market, odds: 1.90, units, outcome: null });
const lose = (selection, market, units) => ({ selection, market, odds: 1.90, units, outcome: null });

// Tips settle by tick/cross markers, a refund voids them, and a "Plays today"
// note settles the fixture as a win for the day it was published, flagged as
// carried forward. A fixture the channel did not address at all (absent from the
// pasted text) still uses the unmarked default: free = lose, paid = win.
const buildFixtureTips = () => ([
    {
        source: "freetips",
        sport: "Football",
        competition: "Bet of the Day",
        league: "Europa League",
        homeTeam: "Besiktas",
        awayTeam: "Marseille",
        kickoff: "23:00",
        market: "Full Time Result",
        selection: "Besiktas Win",
        odds: 1.75,
        stakeUnits: 4,
        previewTitle: "Besiktas vs Marseille Predictions",
        verdict: "A home win is expected here.",
        tips: [win("Besiktas Win", "Full Time Result", 4), lose("Dusan Vlahovic", "Anytime Goalscorer", 2)],
        extraTips: [lose("Dusan Vlahovic", "First Goalscorer", 1)],
        status: "pending",
        outcome: null,
    },
    {
        source: "freetips",
        sport: "Football",
        competition: "Premier League",
        league: "Premier League",
        homeTeam: "Man City",
        awayTeam: "Norwich",
        kickoff: "20:00",
        market: "To Win to Nil",
        selection: "Man City Win to Nil",
        odds: 2.00,
        stakeUnits: 2,
        previewTitle: "Man City vs Norwich",
        verdict: "City should cruise.",
        tips: [win("Man City Win to Nil", "To Win to Nil", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    {
        source: "freetips",
        sport: "Football",
        competition: "Serie A",
        league: "Serie A",
        homeTeam: "Juventus",
        awayTeam: "NEC",
        kickoff: "18:45",
        market: "Full Time Result",
        selection: "Juventus",
        odds: 2.10,
        stakeUnits: 3,
        previewTitle: "Juventus vs NEC",
        verdict: "Juve at home.",
        tips: [win("Juventus", "Win To Nil", 3), lose("Edon Zhegrova", "Anytime Goalscorer", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    // Free tip whose fixture is NOT present in the results text -> the channel
    // did not address it, so the free unmarked default applies (a loss).
    {
        source: "freetips",
        sport: "Football",
        competition: "Eredivisie",
        league: "Eredivisie",
        homeTeam: "Ajax",
        awayTeam: "Feyenoord",
        kickoff: "16:30",
        market: "BTTS",
        selection: "BTTS Yes",
        odds: 1.80,
        stakeUnits: 2,
        previewTitle: "Ajax vs Feyenoord",
        verdict: "Goals expected.",
        tips: [win("BTTS Yes", "BTTS", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    // Paid non-football tip without a marker defaults to win.
    {
        source: "freetips",
        sport: "Basketball",
        competition: "EuroLeague",
        league: "EuroLeague",
        homeTeam: "Olympiacos",
        awayTeam: "Fenerbahce",
        kickoff: "20:00",
        market: "Total Points",
        selection: "Over 150.5",
        odds: 1.90,
        stakeUnits: 2,
        previewTitle: "Olympiacos vs Fenerbahce",
        verdict: "High tempo.",
        tips: [win("Over 150.5", "Total Points", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    // Non-football premium tip (basketball) settled by explicit markers.
    {
        source: "freetips",
        sport: "Basketball",
        competition: "EuroLeague",
        league: "EuroLeague",
        homeTeam: "Real Madrid",
        awayTeam: "Panathinaikos",
        kickoff: "21:00",
        market: "Total Points",
        selection: "Over 160.5",
        odds: 1.90,
        stakeUnits: 2,
        previewTitle: "Real Madrid vs Panathinaikos",
        verdict: "High tempo.",
        tips: [lose("Over 160.5", "Total Points", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    // Fixture explicitly pushed forward by the channel note line: it still
    // belongs to this day's card, so it settles as a win and is carried forward.
    {
        source: "freetips",
        sport: "Football",
        competition: "Premier League",
        league: "Premier League",
        homeTeam: "Tottenham",
        awayTeam: "Coventry",
        kickoff: "22:00",
        market: "BTTS & Over 2.5 Goals",
        selection: "BTTS & Over 2.5 Goals",
        odds: 2.10,
        stakeUnits: 2,
        previewTitle: "Tottenham vs Coventry",
        verdict: "Goals expected.",
        tips: [win("BTTS & Over 2.5 Goals", "BTTS & Over 2.5 Goals", 2)],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
    // Card immediately after a refund: distinct markers, so a refund note must
    // never leak onto a neighbouring card.
    {
        source: "freetips",
        sport: "Basketball",
        competition: "Basketball",
        league: "Basketball",
        homeTeam: "Aris",
        awayTeam: "Peristeri",
        kickoff: "19:00",
        market: "Asian Handicap",
        selection: "Aris -4.5",
        odds: 1.85,
        stakeUnits: 2,
        previewTitle: "Aris vs Peristeri",
        verdict: "Hosts cover.",
        tips: [win("Aris -4.5", "Asian Handicap", 2)],
        extraTips: [win("Under 160.5", "Total Points", 2)],
        status: "pending",
        outcome: null,
    },
    // Refunded card: the channel cancels the bets and returns the stakes.
    {
        source: "freetips",
        sport: "Tennis",
        competition: "Tennis",
        league: "Tennis",
        homeTeam: "Lorenzo Musetti",
        awayTeam: "Jack Draper",
        kickoff: "16:00",
        market: "Match Winner",
        selection: "Musetti Win",
        odds: 1.90,
        stakeUnits: 2,
        previewTitle: "Lorenzo Musetti vs Jack Draper",
        verdict: "Musetti is the pick.",
        tips: [win("Musetti Win", "Match Winner", 2), { ...lose("Over 21.5", "Total Games", 2), odds: 1.50 }],
        extraTips: [],
        status: "pending",
        outcome: null,
    },
]);

const RESULTS_TXT = [
    "[01/01/1999 09:13] Pikk Maxbet VIP: ⚽️ || Besiktas v Marseille",
    "Bet of the Day",
    "Beginning: 23:00 Kenyan Time",
    "Bet: Besiktas Win",
    "Stake: 4 Units",
    "",
    "A home win is expected here.",
    "",
    "Besiktas Win @1.75 - 4 Units ✅✅",
    "Dusan Vlahovic Anytime Goalscorer @2.10 - 2 Units ❎❎",
    "Dusan Vlahovic First Goalscorer @5.00 - 1 Unit ❎❎",
    "",
    "[01/01/1999 09:20] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!! in reply to ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!:",
    "> Man City vs Norwich",
    "Man City Win to Nil @2.00 - 2 Units ✅✅",
    "",
    "[01/01/1999 09:21] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!! in reply to ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!:",
    "> Juventus vs NEC",
    "Juventus @2.10 - 3 Units ✅✅",
    "Edon Zhegrova @2.30 - 2 Units ❎❎",
    "",
    "[01/01/1999 09:22] PikkBetter VIP: Basketball",
    "🏀 || Real Madrid v Panathinaikos",
    "Beginning: 21:00 Kenyan Time",
    "Bet: Over 160.5",
    "Stake: 2 Units",
    "",
    "High tempo.",
    "",
    "Over 160.5 @1.90 - 2 Units ❎❎",
    "",
    "[01/01/1999 09:30] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!! in reply to ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!:",
    "> Tottenham vs Coventry",
    "Plays today...♻️♻️",
    "",
    // The channel refunded this card: no tick or cross, just the refund note.
    "[01/01/1999 09:31] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!: Tennis",
    "🎾 || Lorenzo Musetti v Jack Draper",
    "Bet: Musetti Win",
    "Stake: 2 Units",
    "",
    "Musetti Win @1.90 - 2 Units",
    "Over 21.5 Total Games @1.50 - 2 Units",
    "",
    "Refunded ♻️♻️",
    "[01/01/1999 09:40] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!: Basketball",
    "🏀 || Aris v Peristeri",
    "Bet: Aris -4.5",
    "Stake: 2 Units",
    "",
    "Aris -4.5 @1.85 - 2 Units ✅✅",
    "Under 160.5 @1.90 - 2 Units ✅✅",
].join("\n");

// ---------------------------------------------------------------------------
// 1. Pure helpers
// ---------------------------------------------------------------------------
console.log(" SETTLEMENT TEST ");

assert.strictEqual(getFormattedDate("2026-09-01"), "1st Sept 2026", "Date formatting should use 1st");
assert.strictEqual(getFormattedDate("2026-09-02"), "2nd Sept 2026", "Date formatting should use 2nd");
assert.strictEqual(getFormattedDate("2026-09-03"), "3rd Sept 2026", "Date formatting should use 3rd");
assert.strictEqual(getFormattedDate("2026-09-04"), "4th Sept 2026", "Date formatting should use 4th");
assert.strictEqual(getFormattedDate("2026-09-11"), "11th Sept 2026", "Teens must use th, not st");
assert.strictEqual(getFormattedDate("2026-09-21"), "21st Sept 2026", "21 should use st");
assert.strictEqual(getFormattedDate("2026-09-22"), "22nd Sept 2026", "22 should use nd");
assert.strictEqual(getFormattedDate("2026-09-23"), "23rd Sept 2026", "23 should use rd");

// Pushed-forward detection: the channel's "Plays today...♻️♻️" note is not a
// result marker, so it must never be read as a tick or a cross.
assert.ok(isPostponedLine("Plays today...♻️♻️"), "'Plays today...♻️♻️' must be recognised as pushed forward");
assert.ok(isPostponedLine("Plays today ✓"), "'Plays today' wording must be recognised");
assert.ok(isPostponedLine("Match postponed"), "'postponed' must be recognised");
assert.ok(!isPostponedLine("Bet @1.90 - 2 Units ✅✅"), "A win marker is not a pushed-forward note");
assert.ok(!isPostponedLine("Bet @1.90 - 2 Units ❎❎"), "A lose marker is not a pushed-forward note");

// Refunded detection: a refund shares the ♻️ emoji but is a void, never a push.
assert.ok(isRefundedLine("Refunded ♻️♻️"), "'Refunded ♻️♻️' must be recognised as a refund");
assert.ok(isRefundedLine("Refunds issued"), "'Refunds issued' must be recognised as a refund");
assert.ok(!isPostponedLine("Refunded ♻️♻️"), "A refund line must not be read as pushed forward");
assert.strictEqual(determineOutcome("Refunded ♻️♻️"), "void", "A refund must settle as void");
assert.strictEqual(determineOutcome("Bet @1.90 - 2 Units ✅✅"), "win", "A tick still settles as a win");
assert.strictEqual(determineOutcome("Bet @1.90 - 2 Units ❎❎"), "lose", "A cross still settles as a lose");
assert.ok(isCarriedForwardDay([{ status: "settled", outcome: "win", postponed: true }]), "A carried day is detected");
assert.ok(!isCarriedForwardDay([{ status: "pending", outcome: null }]), "A pending day is not carried");

// ---------------------------------------------------------------------------
// 2. CLI arg parsing (settlement/app.js)
// ---------------------------------------------------------------------------
const defaultArgs = parseArgs([]);
assert.strictEqual(defaultArgs.dateArg, null, "No date should default to null");
assert.ok(/settlement-template\.txt$/.test(defaultArgs.txtArg), "No txt arg should default to the template");

const flaggedArgs = parseArgs(["--date=2026-09-17", "results.txt"]);
assert.strictEqual(flaggedArgs.dateArg, "2026-09-17", "--date= should be parsed");
assert.strictEqual(flaggedArgs.txtArg, "results.txt", "Positional txt path should be captured");

const spacedArgs = parseArgs(["--date", "2026-09-17", "results.txt"]);
assert.strictEqual(spacedArgs.dateArg, "2026-09-17", "--date with a space should be parsed");

// ---------------------------------------------------------------------------
// 3. withHeat: fire only decorates wins, never losses, never free cards
// ---------------------------------------------------------------------------
assert.strictEqual(withHeat("Bet @1.90 - 2 Units ✅✅"), "Bet @1.90 - 2 Units ✅✅🔥", "Wins should gain a fire emoji");
assert.strictEqual(withHeat("Bet @1.90 - 2 Units ❎❎"), "Bet @1.90 - 2 Units ❎❎", "Losses must never gain a fire emoji");
assert.strictEqual(withHeat("Bet @1.90 - 2 Units ✅✅🔥"), "Bet @1.90 - 2 Units ✅✅🔥", "Already-heated wins must not double up");
assert.strictEqual(withHeat(""), "", "Empty text should stay empty");
assert.strictEqual(withHeat(null), null, "Null should pass through untouched");
assert.strictEqual(
    withHeat("A ✅✅\nB ❎❎"),
    "A ✅✅🔥\nB ❎❎",
    "Mixed cards should heat only the winning lines"
);

// ---------------------------------------------------------------------------
// 3b. Empty dated dump must fail loudly instead of reporting a false success
//     (processSettlement calls process.exit, so run it in a child process).
// ---------------------------------------------------------------------------
const emptyDumpDate = "1998-12-31";
const emptyDumpPath = path.join(previousDayResultsDir, `freetips-${getFormattedDate(emptyDumpDate)}.json`);
const emptyResultsPath = path.join(os.tmpdir(), `settlement-empty-results-${Date.now()}.txt`);
fs.mkdirSync(previousDayResultsDir, { recursive: true });
fs.writeFileSync(emptyDumpPath, "[]", "utf8");
fs.writeFileSync(emptyResultsPath, RESULTS_TXT, "utf8");

try {
    const { spawnSync } = require("child_process");
    const emptyRun = spawnSync(
        process.execPath,
        [path.resolve(__dirname, "..", "settlement", "app.js"), `--date=${emptyDumpDate}`, emptyResultsPath],
        { encoding: "utf8" }
    );
    assert.strictEqual(emptyRun.status, 1, "An empty dated dump must exit non-zero, not report success");
    assert.ok(
        /is empty \(no tips to settle\)/.test(emptyRun.stderr || ""),
        "The empty-dump failure must explain that there are no tips to settle"
    );
    assert.ok(
        !/Settled 0 tips/.test(emptyRun.stdout || ""),
        "The empty-dump failure must not print the misleading 'Settled 0 tips' success line"
    );
} finally {
    fs.rmSync(emptyDumpPath, { force: true });
    fs.rmSync(emptyResultsPath, { force: true });
}

// ---------------------------------------------------------------------------
// 4. processSettlement end-to-end (writes + reads a real throwaway dump)
// ---------------------------------------------------------------------------
const tempTxtPath = path.join(os.tmpdir(), `settlement-results-${Date.now()}.txt`);

(async () => {
    fs.mkdirSync(previousDayResultsDir, { recursive: true });
    fs.writeFileSync(testJsonPath, JSON.stringify(buildFixtureTips(), null, 2), "utf8");
    fs.writeFileSync(tempTxtPath, RESULTS_TXT, "utf8");

    try {
        // resolveJsonPath should lock onto the dated dump we just wrote.
        assert.strictEqual(resolveJsonPath(TEST_DATE), testJsonPath, "resolveJsonPath should find the dated dump");

        const settled = processSettlement(TEST_DATE, tempTxtPath);
        assert.ok(Array.isArray(settled), "processSettlement should return the settled tips array");
        assert.strictEqual(settled.length, 9, "All tips should be returned");

        const byHome = (name) => settled.find((tip) => tip.homeTeam === name);

        // Featured football: main tip wins, nested aims fail.
        const besiktas = byHome("Besiktas");
        assert.strictEqual(besiktas.outcome, "win", "Featured main selection should settle as a win");
        assert.strictEqual(besiktas.status, "settled", "Featured tip should be marked settled");
        assert.strictEqual(besiktas.tips[0].outcome, "win", "Nested winning tip should settle");
        assert.strictEqual(besiktas.tips[1].outcome, "lose", "Nested losing tip should settle");
        assert.strictEqual(besiktas.extraTips[0].outcome, "lose", "extraTips should also settle");

        // Free football present in text: settles from its own marker.
        assert.strictEqual(byHome("Man City").outcome, "win", "Free tip with a win marker should settle as a win");
        assert.strictEqual(byHome("Juventus").outcome, "win", "Free tip main selection should settle as a win");
        assert.strictEqual(byHome("Juventus").tips[1].outcome, "lose", "Free tip secondary selection should settle as a lose");

        // Free football the channel never addressed uses the free unmarked default.
        const ajax = byHome("Ajax");
        assert.strictEqual(ajax.outcome, "lose", "An unaddressed free tip uses the free unmarked default");
        assert.strictEqual(ajax.status, "settled", "An unaddressed free tip settles");
        assert.ok(!ajax.postponed, "An unaddressed free tip is not carried forward");

        // Paid tip the channel never addressed uses the paid unmarked default.
        const olympiacos = byHome("Olympiacos");
        assert.strictEqual(olympiacos.outcome, "win", "An unaddressed paid tip uses the paid unmarked default");
        assert.ok(!olympiacos.postponed, "An unaddressed paid tip is not carried forward");

        // Explicit "Plays today...♻️♻️" note: the fixture still belongs to this
        // day, so it settles as a win here and is flagged as carried forward.
        const tottenham = byHome("Tottenham");
        assert.strictEqual(tottenham.outcome, "win", "A 'Plays today' fixture settles as a win for this day");
        assert.strictEqual(tottenham.status, "settled", "A 'Plays today' fixture is settled");
        assert.strictEqual(tottenham.postponed, true, "A 'Plays today' fixture is flagged as carried forward");
        assert.strictEqual(tottenham.tips[0].outcome, "win", "Nested selections of a carried fixture settle as wins");

        // A card next to a refund settles from its own markers.
        const aris = byHome("Aris");
        assert.strictEqual(aris.outcome, "win", "A refunded neighbouring card must not be voided");
        assert.strictEqual(aris.extraTips[0].outcome, "win", "A neighbouring card's extra tips keep their markers");

        // A refunded card settles as void, never by the unmarked default.
        const musetti = byHome("Lorenzo Musetti");
        assert.strictEqual(musetti.outcome, "void", "A refunded tip settles as void");
        assert.strictEqual(musetti.status, "settled", "A refunded tip is settled");
        assert.strictEqual(musetti.tips[1].outcome, "void", "Every selection on a refunded card is voided");
        assert.ok(!musetti.postponed, "A refunded tip is not carried forward");

        // Non-football premium tip: explicit lose marker.
        const basketball = byHome("Real Madrid");
        assert.strictEqual(basketball.outcome, "lose", "Premium non-football tip should settle from its marker");

        // The dump on disk must be rewritten with the settled outcomes.
        processSettlement(TEST_DATE, tempTxtPath);
        const persisted = JSON.parse(fs.readFileSync(testJsonPath, "utf8"));
        const persistedBesiktas = persisted.find((tip) => tip.homeTeam === "Besiktas");
        assert.strictEqual(persistedBesiktas.outcome, "win", "Settled outcomes must be written back to the JSON dump");

        const persistedAjax = persisted.find((tip) => tip.homeTeam === "Ajax");
        assert.strictEqual(persistedAjax.outcome, "lose", "The unmarked default is written back to the JSON dump");
        const persistedTottenham = persisted.find((tip) => tip.homeTeam === "Tottenham");
        assert.strictEqual(persistedTottenham.postponed, true, "Carried-forward flags must be written back to the JSON dump");
        assert.strictEqual(persistedTottenham.outcome, "win", "A carried-forward win must be written back to the JSON dump");

        // Re-running settlement for the same day is idempotent: carried tips stay
        // carried and already-settled tips keep their outcomes.
        const reSettled = processSettlement(TEST_DATE, tempTxtPath);
        assert.strictEqual(reSettled.find((t) => t.homeTeam === "Besiktas").outcome, "win", "A settled tip keeps its outcome on re-run");
        assert.strictEqual(reSettled.find((t) => t.homeTeam === "Tottenham").outcome, "win", "A carried tip keeps its outcome on re-run");
        assert.strictEqual(reSettled.find((t) => t.homeTeam === "Tottenham").postponed, true, "A carried tip keeps its flag on re-run");

        // The carried day is discovered so `settlement next` can settle the day
        // that actually holds its real result (the next day's dump).
        assert.strictEqual(isCarriedForwardDay(reSettled), true, "The settled day reports itself as carried forward");

        // The settled dump renders through the tips client, and the settlement
        // layer's heat decorates only the paid (winning) lines.
        const result = await new TipsConsumptionClient().loadFromData(persisted);
        assert.ok(result.maxbetVipCards.length >= 1, "At least one paid Maxbet card should render");
        assert.ok(result.pikkBetterVipCards.length >= 1, "At least one paid VIP card should render");
        assert.ok(result.freeCards.length >= 1, "Free cards should render");

        const heatedMaxbet = result.maxbetVipCards.map(withHeat).join("\n");
        assert.ok(heatedMaxbet.includes("✅🔥"), "Paid winning lines should carry the fire emoji in the settlement output");
        assert.ok(!heatedMaxbet.includes("❎🔥"), "Paid losing lines must not carry the fire emoji");

        const heatedVip = result.pikkBetterVipCards.map(withHeat).join("\n");
        assert.ok(!heatedVip.includes("❎🔥"), "VIP losing lines must not carry the fire emoji");

        // Free cards are printed unheated: no fire anywhere in that section.
        const freeSection = result.freeCards.join("\n");
        assert.ok(!freeSection.includes("🔥"), "Free tip cards must never carry the fire emoji");

        // -------------------------------------------------------------------
        // 6. Verify that a re-scrape of the same day updates the dump without
        //    erasing it. The dump is the only complete record of a day, so a
        //    later scrape that returns fewer tips (the site paginates, or tips
        //    roll off the list) must merge into it, and the settled outcomes it
        //    already carries must survive the write.
        // -------------------------------------------------------------------
        const { saveTestResults } = require("../orchestrator/test-results");
        const freetipsWorkingPath = path.resolve(__dirname, "..", "orchestrator", "test-results", "freetips.json");
        const workingBefore = fs.existsSync(freetipsWorkingPath) ? fs.readFileSync(freetipsWorkingPath, "utf8") : null;
        try {
            const dumpBefore = JSON.parse(fs.readFileSync(testJsonPath, "utf8"));
            const settledBefore = dumpBefore.filter((tip) => tip.status === "settled");
            assert.ok(settledBefore.length > 0, "The fixture dump must carry settled tips to test the merge");

            const result = saveTestResults(
                "freetips",
                [{ homeTeam: "Different", awayTeam: "Team", selection: "X", market: "M", scrapedAt: `${TEST_DATE}T12:00:00Z` }],
                { date: TEST_DATE }
            );
            const dumpAfter = JSON.parse(fs.readFileSync(testJsonPath, "utf8"));
            const keyOf = (tip) => `${tip.homeTeam}|${tip.awayTeam}|${tip.selection}|${tip.market}`;

            // A re-scrape adds the new tip and keeps every tip already dumped.
            assert.strictEqual(dumpAfter.length, dumpBefore.length + 1, "A re-scrape must merge into the dump, not replace it");
            assert.ok(dumpAfter.some((tip) => keyOf(tip) === "Different|Team|X|M"), "The newly scraped tip must be in the dump");
            assert.strictEqual(result.dumpCount, dumpAfter.length, "The reported dump count must match the file");
            dumpBefore.forEach((tip) => {
                assert.ok(dumpAfter.some((other) => keyOf(other) === keyOf(tip)), `A re-scrape dropped ${keyOf(tip)} from the dump`);
            });

            // Settlement history is not the scraper's to erase: a settled tip that
            // the scrape sees again keeps its outcome and its carried-forward flag.
            const settledKey = keyOf(settledBefore[0]);
            const seenAgain = settledBefore[0];
            saveTestResults(
                "freetips",
                [{ homeTeam: seenAgain.homeTeam, awayTeam: seenAgain.awayTeam, selection: seenAgain.selection, market: seenAgain.market, scrapedAt: `${TEST_DATE}T13:00:00Z` }],
                { date: TEST_DATE }
            );
            const resettled = JSON.parse(fs.readFileSync(testJsonPath, "utf8")).find((tip) => keyOf(tip) === settledKey);
            assert.strictEqual(resettled.status, "settled", "A re-scrape must not clear a settled tip");
            assert.strictEqual(resettled.outcome, seenAgain.outcome, "A re-scrape must not clear a settled outcome");
            if (seenAgain.postponed) {
                assert.strictEqual(resettled.postponed, true, "A re-scrape must not clear a carried-forward flag");
            }

            // An EMPTY placeholder dump protects nothing, so the orchestrator must
            // fill it with the day's tips instead of skipping it — otherwise a day
            // whose tips were not exported stays permanently empty in the archive.
            const emptyPlaceholderDate = "1999-02-02";
            const emptyPlaceholderPath = path.join(previousDayResultsDir, `freetips-${getFormattedDate(emptyPlaceholderDate)}.json`);
            fs.writeFileSync(emptyPlaceholderPath, "[]", "utf8");
            try {
                saveTestResults(
                    "freetips",
                    [{ homeTeam: "Fill", awayTeam: "Me", selection: "Yes", market: "Test", scrapedAt: `${emptyPlaceholderDate}T09:00:00Z` }],
                    { date: emptyPlaceholderDate }
                );
                const filled = JSON.parse(fs.readFileSync(emptyPlaceholderPath, "utf8"));
                assert.ok(Array.isArray(filled) && filled.length === 1, "An empty placeholder dump must be filled with the day's tips");
                assert.strictEqual(filled[0].homeTeam, "Fill", "The filled dump must contain the exported tip");
            } finally {
                fs.rmSync(emptyPlaceholderPath, { force: true });
            }
        } finally {
            if (workingBefore !== null) {
                fs.writeFileSync(freetipsWorkingPath, workingBefore, "utf8");
            }
        }
        // resetSettlement puts the whole day back to pending so it can be settled
        // again from scratch (for example when the pasted text was wrong).
        const reset = resetSettlement(TEST_DATE);
        assert.ok(reset.every((t) => t.status === "pending" && t.outcome === null), "Reset must clear every outcome");
        assert.ok(reset.every((t) => !t.postponed), "Reset must drop the carried-forward flag");
        assert.strictEqual(reset.find((t) => t.homeTeam === "Besiktas").tips[1].outcome, null, "Reset must clear nested outcomes");

        // A day rebuilt from a fresh scrape can reuse a tip's position, and so its
        // dump id, for a different fixture, so the sync must be able to name the
        // day a dump belongs to when it reports the collision.
        assert.strictEqual(parseDumpDate(`freetips-${getFormattedDate(TEST_DATE)}.json`), TEST_DATE, "Dump file names round-trip their date");

        // `next` finds the youngest day before the settlement date whose tips are
        // all decided and at least one carried forward.
        const carriedDate = "1999-01-05";
        const carriedPath = path.join(previousDayResultsDir, `freetips-${getFormattedDate(carriedDate)}.json`);
        fs.writeFileSync(
            carriedPath,
            JSON.stringify([{ homeTeam: "Carried", status: "settled", outcome: "win", postponed: true }], null, 2),
            "utf8"
        );
        try {
            assert.strictEqual(findCarriedForwardDate("1999-02-01"), carriedDate, "`next` picks the youngest carried-forward day");
            assert.strictEqual(findCarriedForwardDate("1999-01-05"), null, "`next` only looks at days before the settlement date");
        } finally {
            fs.rmSync(carriedPath, { force: true });
        }

        console.log(`✅ Settled ${settled.length} fixture tips, wrote back to the previous-day dump, and verified the fire emoji rules.`);
        console.log("settlement test passed");
    } finally {
        fs.rmSync(testJsonPath, { force: true });
        fs.rmSync(tempTxtPath, { force: true });
    }
})();
