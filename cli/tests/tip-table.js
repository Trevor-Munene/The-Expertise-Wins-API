const assert = require("assert");

const DISPLAY_FIELDS = [
    "index",
    "tier",
    "sport",
    "competition",
    "homeTeam",
    "awayTeam",
    "kickoff",
    "market",
    "selection",
    "odds",
    "extraTips",
    "detailsUrl",
    "status",
];

// Mirrors frontend/src/app/tips/page.jsx: MAXBET -> VIP -> FREE.
const TIER_PRIORITY = { MAXBET: 0, VIP: 1, FREE: 2 };
// Mirrors frontend/src/app/tips/page.jsx sport ordering.
const SPORT_PRIORITY = { FOOTBALL: 0, SOCCER: 0, TENNIS: 1, BASKETBALL: 2 };

function normalizeSport(value) {
    return String(value || "").trim().toUpperCase();
}

// Read the tier the same way the frontend does, without changing the contract.
function getTipTier(tip) {
    const value =
        tip?._tier ??
        tip?.tier ??
        tip?.product ??
        tip?.productSlug ??
        "";
    const normalized = String(value).trim().toUpperCase().replace(/[\s_-]/g, "");

    if (normalized === "MAXBET" || normalized === "MAXBETVIP" || normalized === "MAXBETVI" || normalized === "PREMIUMMAXBET") {
        return "MAXBET";
    }
    if (normalized === "VIP" || normalized === "PREMIUM" || normalized === "VIPCHANNEL") {
        return "VIP";
    }
    if (normalized === "FREE") {
        return "FREE";
    }

    const productSlug = String(tip?.publications?.[0]?.product?.slug ?? "").toUpperCase();
    if (productSlug === "MAXBET") return "MAXBET";
    if (productSlug === "VIP") return "VIP";
    if (productSlug === "FREE") return "FREE";

    const label = `${tip?.competition ?? ""} ${tip?.previewTitle ?? ""}`.toLowerCase();
    if (tip?.isFeatured || /bet of the day/.test(label)) return "MAXBET";
    const sport = normalizeSport(tip?.sport);
    if (sport === "FOOTBALL" || sport === "SOCCER") return "FREE";
    return "VIP";
}

function getTierRank(tip) {
    const tier = getTipTier(tip);
    return TIER_PRIORITY[tier] ?? 3;
}

function getSportRank(tip) {
    return SPORT_PRIORITY[normalizeSport(tip?.sport)] ?? 3;
}

// Minutes past midnight used to order tips within a sport. Mirrors
// frontend/src/app/tips/page.jsx getKickoffMinutes: a "HH:MM" clock time is used
// directly, and a relative countdown ("2h 30m") is resolved against the current
// Nairobi time. Tips with no usable kickoff sink to the end.
function getKickoffMinutes(tip) {
    const value = String(tip?.kickoff ?? "").trim();
    const time = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (time) return Number(time[1]) * 60 + Number(time[2]);

    const duration = value.match(/^(?:(\d+)\s*h(?:ours?)?\s*)?(?:(\d+)\s*m(?:in(?:utes?))?)?$/i);
    if (duration && (duration[1] || duration[2])) {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false,
        }).formatToParts(new Date());
        const nowMinutes = Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
            Number(parts.find((part) => part.type === "minute")?.value || 0);
        return (nowMinutes + Number(duration[1] || 0) * 60 + Number(duration[2] || 0)) % 1440;
    }

    return Number.MAX_SAFE_INTEGER;
}

// Tier first, then sport, then beginning time -- the same order the frontend prints.
function sortTipsForDisplay(tips) {
    return [...tips].sort((a, b) =>
        getTierRank(a) - getTierRank(b) ||
        getSportRank(a) - getSportRank(b) ||
        getKickoffMinutes(a) - getKickoffMinutes(b)
    );
}

function validateNormalizedTips(tips, source) {
    assert.ok(Array.isArray(tips), `${source} normalized output should be an array`);
    assert.ok(tips.length > 0, `${source} should return at least one normalized tip`);

    for (const [index, tip] of tips.entries()) {
        assert.ok(tip.source, `${source} tip ${index} is missing source`);
        assert.ok(tip.sport, `${source} tip ${index} is missing sport`);
        assert.ok(tip.homeTeam, `${source} tip ${index} is missing homeTeam`);
        assert.ok(tip.awayTeam, `${source} tip ${index} is missing awayTeam`);
        assert.ok(tip.market || tip.selection, `${source} tip ${index} is missing market and selection`);
        assert.ok(!/^Raffle\.?$/i.test(tip.selection || ""), `${source} tip ${index} contains a placeholder selection`);
    }
}

function printNormalizedTips(source, tips) {
    validateNormalizedTips(tips, source);

    const sortedTips = sortTipsForDisplay(tips);

    console.log(`\n${source} normalized tips (${sortedTips.length}):`);
    console.table(sortedTips.map((tip, index) => {

        const row = { index };

        for (const field of DISPLAY_FIELDS.slice(1)) {
            let value = field === "tier" ? getTipTier(tip) : tip[field] ?? null;
            if (field === "extraTips") value = Array.isArray(value) ? value.length : 0;
            if (field === "detailsUrl" && typeof value === "string" && value.length > 90) {
                value = `${value.slice(0, 87)}...`;
            }
            row[field] = value;
        }

        return row;
    }));
}

module.exports = { printNormalizedTips, validateNormalizedTips, sortTipsForDisplay };