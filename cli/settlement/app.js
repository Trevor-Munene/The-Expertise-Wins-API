const path = require("path");
const {
    processSettlement,
    resetSettlement,
    findCarriedForwardDate,
    getFormattedDate,
} = require("./settlement");
const { TipsConsumptionClient } = require("../services/tips.client");

// The settlement layer marks paid (VIP) winning tips with a fire emoji after the
// ticks so they read differently from the free picks. Losses (❎) never get
// heat. The tips client itself stays heat-free; this decoration lives only here.
function withHeat(card) {
    if (!card) return card;
    // Consume each whole run of ✅ ticks plus an optional trailing 🔥 so a
    // greedy match can never be split mid-run. Only add fire when absent.
    // The `u` flag is required because 🔥 is a surrogate pair.
    return card.replace(/(✅+)(🔥?)/gu, (_match, ticks, fire) => `${ticks}${fire || "🔥"}`);
}

function parseArgs(argv) {
    let dateArg = null;
    let txtArg = null;

    for (const arg of argv) {
        if (arg.startsWith("--date=")) dateArg = arg.split("=")[1];
        else if (arg === "--date" && argv[argv.indexOf(arg) + 1]) dateArg = argv[argv.indexOf(arg) + 1];
        else if (!arg.startsWith("--")) txtArg = arg;
    }

    // Default to the checked-in template so `npm run settlement` settles whatever
    // data has been pasted into settlement/settlement-template.txt.
    if (!txtArg) {
        txtArg = path.resolve(__dirname, "settlement-template.txt");
    }

    return { dateArg, txtArg };
}

// Without --date, settle yesterday's dump; an explicit date still targets
// exactly the requested previous-day-results file.
function resolveSettlementDate(dateArg) {
    return dateArg || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Put a day's dump back to pending so it can be settled again. Used when a
// fixture the channel pushed forward has now played and is ready to settle.
async function runReset(argv = process.argv.slice(2)) {
    const { dateArg } = parseArgs(argv);
    const settlementDate = resolveSettlementDate(dateArg);
    resetSettlement(settlementDate);
    console.log(`🔄 Re-run \`npm run sync\` to republish ${settlementDate} as pending, then settle it again.`);
}

// Settle the day that holds the real results for fixtures carried forward from
// an earlier day. A "Plays today...♻️♻️" fixture is listed again on the next
// day's card (the operator scrapes it the next day), so its tick/cross is in
// that day's settlement text, not in the older card's. Without --date this
// picks the youngest day whose tips were all settled and some carried.
async function runNext(argv = process.argv.slice(2)) {
    const { dateArg, txtArg } = parseArgs(argv);
    const targetDate = findCarriedForwardDate(resolveSettlementDate(dateArg));

    if (!targetDate) {
        console.log("No day is waiting on a carried-forward fixture; nothing to settle next.");
        return;
    }

    console.log(`\n♻️  Settling ${getFormattedDate(targetDate)}, which holds the carried-forward results\n`);
    await run([`--date=${targetDate}`, txtArg]);
}

async function run(argv = process.argv.slice(2)) {
    const { dateArg, txtArg } = parseArgs(argv);
    const settlementDate = resolveSettlementDate(dateArg);
    const tips = processSettlement(settlementDate, txtArg);

    const result = await new TipsConsumptionClient().loadFromData(tips);
    const freeTips = result.freeTips || [];
    const premiumTips = result.premiumTips || [];

    console.log("\n========================================");
    console.log("     SETTLEMENT OUTPUT");
    console.log("========================================\n");

    console.log("💰 MAXBET TIPS");
    console.log("----------------------------------------");
    result.maxbetVipCards.forEach((card, index) => {
        console.log(`\nCARD ${index + 1}\n`);
        console.log(withHeat(card));
        console.log("\n----------------------------------------");
    });

    console.log("\n💎 VIP TIPS");
    console.log("----------------------------------------");
    result.pikkBetterVipCards.forEach((card, index) => {
        console.log(`\nCARD ${index + 1}\n`);
        console.log(withHeat(card));
        console.log("\n----------------------------------------");
    });

    console.log("\n🆓 The Expertise Wins Free Tips 📣 \n");
    result.freeCards.forEach((card, index) => {
        console.log(card);
        if (index < result.freeCards.length - 1) console.log("");
    });

    // Fixtures the channel pushed forward settle as a win for this day and are
    // listed here as carried forward, so the operator knows where their real
    // result will be settled (the next day's dump and pasted results).
    const carriedForward = tips.filter(tip => tip.postponed);
    if (carriedForward.length > 0) {
        console.log("\n♻️  CARRIED FORWARD (played on a later day, settled as a win here)");
        console.log("----------------------------------------");
        carriedForward.forEach(tip => {
            const fixture = tip.homeTeam ? `${tip.homeTeam} vs ${tip.awayTeam}` : tip.selection;
            console.log(`• ${fixture}`);
        });
        console.log("   Their real results settle the next day: `npm run --prefix cli settlement next`.");
    }

    console.log("\n========================================");
    console.log("             SUMMARY");
    console.log("==========================================");
    console.log(`Maxbet tips:      ${result.maxbetVipCards.length}`);
    console.log(`VIP tips:         ${result.pikkBetterVipCards.length}`);
    console.log(`Free tips:        ${result.freeCards.length}`);
    console.log("----------------------------------------");
    console.log(`Total tips:       ${freeTips.length + premiumTips.length}`);
    if (carriedForward.length > 0) {
        console.log(`Carried forward:  ${carriedForward.length}`);
    }
    console.log("========================================\n");
}

if (require.main === module) {
    if (process.argv[2] === "reset") runReset(process.argv.slice(3));
    else if (process.argv[2] === "next") runNext(process.argv.slice(3));
    else run();
}

module.exports = { withHeat, run, runReset, runNext, parseArgs };