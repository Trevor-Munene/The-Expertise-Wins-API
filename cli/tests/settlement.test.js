const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    processSettlement,
    resetSettlement,
    resolveJsonPath,
    getFormattedDate,
    isPostponedLine,
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

// Tips settle by tick/cross markers. A fixture the channel did not address at
// all (pushed forward, or absent from the pasted text) stays pending instead of
// defaulting to a loss. The unmarked default only applies to the individual
// selections of a fixture that provably played.
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
    // Free tip whose fixture is NOT present in the results text -> carried
    // forward (pending), never silently settled as a loss.
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
    // Fixture explicitly pushed forward by the channel note line.
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
// result, so it must never be read as a tick or a cross.
assert.ok(isPostponedLine("Plays today...♻️♻️"), "'Plays today...♻️♻️' must be recognised as pushed forward");
assert.ok(isPostponedLine("Plays today ✓"), "'Plays today' wording must be recognised");
assert.ok(isPostponedLine("Match postponed"), "'postponed' must be recognised");
assert.ok(!isPostponedLine("Bet @1.90 - 2 Units ✅✅"), "A win marker is not a pushed-forward note");
assert.ok(!isPostponedLine("Bet @1.90 - 2 Units ❎❎"), "A lose marker is not a pushed-forward note");

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
        assert.strictEqual(settled.length, 7, "All tips should be returned");

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

        // Free football absent from the settlement text is pushed forward, NOT lost.
        const ajax = byHome("Ajax");
        assert.strictEqual(ajax.outcome, null, "A free tip missing from results text must not be settled as a loss");
        assert.strictEqual(ajax.status, "pending", "A pushed-forward free tip must stay pending");
        assert.strictEqual(ajax.postponed, true, "A pushed-forward free tip must be flagged postponed");
        assert.strictEqual(ajax.tips[0].outcome, null, "Nested tips of a pushed-forward free tip stay pending");

        // Paid tip absent from the settlement text is also pushed forward.
        const olympiacos = byHome("Olympiacos");
        assert.strictEqual(olympiacos.outcome, null, "An unmarked paid tip must not be guessed");
        assert.strictEqual(olympiacos.status, "pending", "An unmarked paid tip must stay pending");
        assert.strictEqual(olympiacos.tips[0].outcome, null, "Nested paid tips stay pending");

        // Explicit "Plays today...♻️♻️" note: pushed forward, never a loss.
        const tottenham = byHome("Tottenham");
        assert.strictEqual(tottenham.outcome, null, "A 'Plays today' fixture must not settle");
        assert.strictEqual(tottenham.status, "pending", "A 'Plays today' fixture must stay pending");
        assert.strictEqual(tottenham.postponed, true, "A 'Plays today' fixture must be flagged postponed");
        assert.strictEqual(tottenham.tips[0].outcome, null, "Nested selections of a carried fixture stay pending");

        // Non-football premium tip: explicit lose marker.
        const basketball = byHome("Real Madrid");
        assert.strictEqual(basketball.outcome, "lose", "Premium non-football tip should settle from its marker");

        // The dump on disk must be rewritten with the settled outcomes.
        processSettlement(TEST_DATE, tempTxtPath);
        const persisted = JSON.parse(fs.readFileSync(testJsonPath, "utf8"));
        const persistedBesiktas = persisted.find((tip) => tip.homeTeam === "Besiktas");
        assert.strictEqual(persistedBesiktas.outcome, "win", "Settled outcomes must be written back to the JSON dump");

        const persistedAjax = persisted.find((tip) => tip.homeTeam === "Ajax");
        assert.strictEqual(persistedAjax.outcome, null, "A carried-forward fixture must not be written back as a loss");
        assert.strictEqual(persistedAjax.postponed, true, "Carried-forward flags must be written back to the JSON dump");
        const persistedOlympiacos = persisted.find((tip) => tip.homeTeam === "Olympiacos");
        assert.strictEqual(persistedOlympiacos.outcome, null, "A carried-forward paid tip must not be written back as a win");

        // Re-running settlement for the same day is idempotent: carried tips stay
        // carried and already-settled tips keep their outcomes.
        const reSettled = processSettlement(TEST_DATE, tempTxtPath);
        assert.strictEqual(reSettled.find((t) => t.homeTeam === "Besiktas").outcome, "win", "A settled tip keeps its outcome on re-run");
        assert.strictEqual(reSettled.find((t) => t.homeTeam === "Ajax").outcome, null, "A carried tip stays pending on re-run");

        // resetSettlement puts the whole day back to pending so a pushed-forward
        // fixture can be re-settled once it has actually played.
        const reset = resetSettlement(TEST_DATE);
        assert.ok(reset.every((t) => t.status === "pending" && t.outcome === null), "Reset must clear every outcome");
        assert.ok(reset.every((t) => !t.postponed), "Reset must drop the postponed flag");
        assert.strictEqual(reset.find((t) => t.homeTeam === "Besiktas").tips[1].outcome, null, "Reset must clear nested outcomes");

        // A pushed-forward fixture that has now played settles on the next pass:
        // its loser is no longer a loss, and a later tick in the pasted text settles it.
        const replayTxtPath = path.join(os.tmpdir(), `settlement-replay-${Date.now()}.txt`);
        fs.writeFileSync(
            replayTxtPath,
            RESULTS_TXT + `\n[02/01/1999 09:30] ᴛʜᴇ ᴇxᴘᴇʀᴛɪsᴇ ᴡɪɴs!!!:\n> Ajax vs Feyenoord\nBTTS Yes @1.80 - 2 Units ✅✅`,
            "utf8"
        );
        try {
            const replayed = processSettlement(TEST_DATE, replayTxtPath);
            assert.strictEqual(replayed.find((t) => t.homeTeam === "Ajax").outcome, "win", "A carried tip settles once its result is pasted later");
            assert.ok(!replayed.find((t) => t.homeTeam === "Ajax").postponed, "A finally-settled tip must drop its postponed flag");
        } finally {
            fs.rmSync(replayTxtPath, { force: true });
        }

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
        // 6. Verify that saveTestResults does NOT mutate the dump once created,
        //    ensuring settlement is the only command that mutates the json
        //    awaiting the sync command.
        // -------------------------------------------------------------------
        const { saveTestResults } = require("../orchestrator/test-results");
        const freetipsWorkingPath = path.resolve(__dirname, "..", "orchestrator", "test-results", "freetips.json");
        const workingBefore = fs.existsSync(freetipsWorkingPath) ? fs.readFileSync(freetipsWorkingPath, "utf8") : null;
        try {
            const dumpBefore = fs.readFileSync(testJsonPath, "utf8");
            saveTestResults("freetips", [{ homeTeam: "Different", awayTeam: "Team", selection: "X", market: "M", scrapedAt: `${TEST_DATE}T12:00:00Z` }], { date: TEST_DATE });
            const dumpAfter = fs.readFileSync(testJsonPath, "utf8");
            assert.strictEqual(dumpAfter, dumpBefore, "saveTestResults must not mutate an existing dump awaiting sync");

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

        console.log(`✅ Settled ${settled.length} fixture tips, wrote back to the previous-day dump, and verified the fire emoji rules.`);
        console.log("settlement test passed");
    } finally {
        fs.rmSync(testJsonPath, { force: true });
        fs.rmSync(tempTxtPath, { force: true });
    }
})();
