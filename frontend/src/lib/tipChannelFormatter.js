const formatOdds = (odds) => {
  const value = Number(odds);
  return Number.isFinite(value) ? value.toFixed(2) : "";
};

const normalizeLabel = (value) =>
  String(value ?? "")
    .replace(/\s+\(/g, " (")
    .replace(/\)\s+/g, ") ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\s*\(\s*\d+\/\d+\s*\)\s*$/i, "")
    .replace(/\s*\(\s*\d+\.\d+\s*\)\s*$/i, "")
    .trim();

const sportEmoji = (sport) => {
  const value = String(sport || "").toLowerCase();
  if (value.includes("american football") || value.includes("nfl")) return "🏈";
  if (value.includes("football") || value.includes("soccer")) return "⚽️";
  if (value.includes("tennis")) return "🎾";
  if (value.includes("cricket")) return "🏏";
  if (value.includes("basketball")) return "🏀";
  if (value.includes("baseball")) return "⚾️";
  if (value.includes("rugby")) return "🏉";
  if (value.includes("volleyball")) return "🏐";
  if (value.includes("boxing")) return "🥊";
  if (value.includes("golf")) return "⛳️";
  if (value.includes("darts") || value.includes("dart")) return "🎯";
  if (value.includes("snooker") || value.includes("pool")) return "🎱";
  if (value.includes("horse")) return "🐎";
  if (value.includes("esport")) return "🎮";
  if (value.includes("hockey")) return "🏒";
  return "💰";
};

const formatKickoff = (kickoff) => {
  const value = String(kickoff || "").trim();
  if (!value) return "";
  if (/kenyan time/i.test(value)) return value;
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) return `${value} Kenyan Time`;

  const duration = value.match(/^(?:(\d+)\s*h(?:ours?)?\s*)?(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/i);
  if (!duration || !(Number(duration[1]) || Number(duration[2]))) return `${value} Kenyan Time`;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const total = (hour * 60 + minute + Number(duration[1] || 0) * 60 + Number(duration[2] || 0)) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")} Kenyan Time`;
};

const formatSelection = (selection, market) => {
  const cleanSelection = normalizeLabel(selection || "");
  const cleanMarket = normalizeLabel(market || "");
  if (!cleanSelection) return cleanMarket || "Tip";
  if (!cleanMarket || cleanSelection.toLowerCase() === cleanMarket.toLowerCase()) return cleanSelection;
  if (cleanSelection.toLowerCase().includes(cleanMarket.toLowerCase())) return cleanSelection;
  if (/match result|full time result|winner|moneyline|to win/i.test(cleanMarket)) return cleanSelection;
  return `${cleanSelection} ${cleanMarket}`;
};

const formatOutcome = (outcome) => {
  if (["win", "won"].includes(String(outcome || "").toLowerCase())) return " ✅✅";
  if (["lose", "lost"].includes(String(outcome || "").toLowerCase())) return " ❎❎";
  return "";
};

const cleanPreview = (preview) =>
  String(preview || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const leagueText = (tip) => {
  const sport = String(tip.sport || "").trim();
  const genericSport = /^(football|soccer|cricket|volleyball|esports|baseball|basketball|tennis|rugby|boxing|golf|ice hockey|darts|snooker|horse racing|american football)$/i;
  for (const value of [tip.league, tip.competition]) {
    const candidate = String(value || "").trim();
    if (!candidate || candidate.toLowerCase() === sport.toLowerCase() || genericSport.test(candidate)) continue;
    if (/bet of the day|tennis bet of the day|betting tips/i.test(candidate)) continue;
    return normalizeLabel(candidate);
  }
  return "";
};

export function formatTipChannelCard(tip) {
  if (!tip) return "";

  const sport = String(tip.sport || "Match");
  const combinedText = `${tip.competition || ""} ${tip.previewTitle || ""}`.toLowerCase();
  const featured = Boolean(tip.isFeatured) || /bet of the day/.test(combinedText);
  const featuredTennis = sport.toLowerCase() === "tennis" && featured;
  const lines = [
    featuredTennis ? "Tennis Bet of the Day" : featured ? "Bet of the Day" : normalizeLabel(sport),
  ];
  const emoji = sportEmoji(sport);

  if (tip.homeTeam && tip.awayTeam) lines.push(`${emoji} || ${tip.homeTeam} v ${tip.awayTeam}`);

  const league = leagueText(tip);
  if (league) lines.push(`League: ${league}`);

  const kickoff = formatKickoff(tip.kickoff);
  if (kickoff) lines.push(`Beginning: ${kickoff}`);

  const selections = Array.isArray(tip.tips) ? tip.tips : [];
  const mainTip = selections.length
    ? selections.reduce((best, current) =>
        Number(current.units ?? current.stakeUnits ?? 0) > Number(best.units ?? best.stakeUnits ?? 0) ? current : best,
      selections[0])
    : { selection: tip.selection || tip.market || "Selected Tip", market: tip.market, odds: tip.odds, units: tip.stakeUnits ?? 2 };
  const mainSelection = formatSelection(mainTip.selection || mainTip.market || tip.selection, mainTip.market || tip.market);
  const mainStake = Number(mainTip.units ?? mainTip.stakeUnits ?? tip.stakeUnits ?? 2);
  lines.push(`Bet: ${mainSelection}`);
  lines.push(`Stake: ${Number.isFinite(mainStake) ? mainStake : 2} Units`);

  const preview = cleanPreview(tip.verdict || tip.preview);
  if (preview) lines.push("", preview, "");

  if (selections.length) {
    for (const selection of selections) {
      const name = normalizeLabel(selection.selection || selection.market || "Tip");
      const odds = formatOdds(selection.odds);
      const units = Number(selection.units ?? selection.stakeUnits ?? 1);
      lines.push(`${name}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(selection.outcome)}`);
    }
  } else {
    const odds = formatOdds(mainTip.odds);
    const units = Number(mainTip.units ?? mainTip.stakeUnits ?? 2);
    lines.push(`${normalizeLabel(mainTip.selection)}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(mainTip.outcome || tip.outcome)}`);
  }

  return lines.join("\n").trim();
}

export function formatFreeTipChannelCard(tip) {
  if (!tip) return "";

  const lines = [
    tip.homeTeam && tip.awayTeam
      ? `${tip.homeTeam} vs ${tip.awayTeam}`
      : tip.selection || "Match",
  ];
  const selections = Array.isArray(tip.tips) ? tip.tips : [];

  if (selections.length) {
    for (const selection of selections) {
      const name = normalizeLabel(selection.selection || selection.market || "Tip");
      const odds = formatOdds(selection.odds);
      const units = Number(selection.units ?? selection.stakeUnits ?? 1);
      lines.push(`${name}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(selection.outcome)}`);
    }
  } else if (tip.selection) {
    const odds = formatOdds(tip.odds);
    const units = Number(tip.stakeUnits ?? tip.units ?? 1);
    lines.push(`${normalizeLabel(tip.selection)}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(tip.outcome)}`);
  }

  return lines.join("\n").trim();
}
