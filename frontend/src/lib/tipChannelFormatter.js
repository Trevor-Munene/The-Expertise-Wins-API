import { getSettlementMarker } from "./settlementMarker";

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

const formatOutcome = (outcome, tier, showSettlementMarkers = false) => {
  if (showSettlementMarkers) return ` ${getSettlementMarker(outcome, tier)}`.trimEnd();
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

const cleanLeagueCandidate = (candidate) =>
  String(candidate || "")
    .trim()
    .replace(/\s+(?:Invites|Tips|Predictions|Preview|Matchups?|Clashes?|Matches?|Today|Live|Now)\s*$/i, "")
    .replace(/^(?:[A-Z]{2,}\s+(?:and\s+)?[A-Z]{2,}\s+Clash\s+for\s+|[A-Z]{2,}\s+Clash\s+for\s+)/i, "")
    .replace(/\s+[–—-]\s*.*$/, "")
    .trim();

const extractLeagueFromTitle = (title) => {
  if (!title) return null;
  const isValidLeague = (candidate) => Boolean(
    candidate && candidate.length >= 2 && candidate.length <= 60 &&
    !/betting tips|bet of the day|live stream|predictions|tips$/i.test(candidate) &&
    /^[A-Z]/.test(candidate)
  );
  const patterns = [
    /\bin\s+the\s+([A-Z][A-Za-z0-9\s&]+?)(?:$|\s*[-–—|])/,
    /\bIn\s+([A-Z]{2,6})(?:\s+[A-Za-z]+)?$/,
    /\bIn\s+((?:[A-Z][a-z]+\s?){1,3})$/,
    /[–—]\s*.{0,80}\bat\s+(?:the\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:\s+Strong\b|\s+this\b|\s+tonight\b|$)/,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (!match) continue;
    const candidate = cleanLeagueCandidate(match[1]);
    if (isValidLeague(candidate)) return candidate;
  }
  const trailingDash = title.match(/[-–—|]\s*([A-Z][A-Za-z0-9&\s]*\d{4}?[A-Za-z0-9\s&]*)$/);
  if (trailingDash && isValidLeague(trailingDash[1].trim())) return cleanLeagueCandidate(trailingDash[1]);
  const verbBridge = title.match(/[–—]\s*.+\b(?:Start|Handle|Win|Begin|Enter|Face|Dominate|Take|Tackle|Compete|Play)\s+((?:[A-Z][A-Za-z0-9]*(?:\s+|\s*&\s*))+\d{4}(?:\s+[A-Za-z]+)*)\s+Strong\s*$/);
  if (verbBridge) {
    const candidate = cleanLeagueCandidate(verbBridge[1]);
    if (isValidLeague(candidate)) return candidate;
  }
  const yearBeforeStrong = title.match(/([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*\s+\d{4}(?:\s+[A-Z][A-Za-z]+)*)\s+Strong\s*$/);
  if (yearBeforeStrong) {
    const candidate = cleanLeagueCandidate(yearBeforeStrong[1]);
    if (isValidLeague(candidate)) return candidate;
  }
  const atMatch = title.match(/\bat\s+(?:the\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:\s+Strong\b|\s+this\b|\s+tonight\b|$|\s*[-–—|])/);
  if (atMatch) {
    const candidate = cleanLeagueCandidate(atMatch[1]);
    if (isValidLeague(candidate) && (/\d{4}/.test(candidate) || candidate.split(/\s+/).length >= 3)) return candidate;
  }
  return null;
};

const leagueText = (tip) => {
  if (!tip) return "";
  const directLeague = String(tip.league || "").trim();
  const competition = String(tip.competition || "").trim();
  const previewTitle = String(tip.previewTitle || "").trim();
  const sport = String(tip.sport || "").trim();
  const genericSportNames = /^(football|soccer|cricket|volleyball|esports|baseball|basketball|tennis|rugby|boxing|golf|ice hockey|darts|snooker|horse racing|american football|rugby league|rugby union|australian rules)$/i;
  const placeholders = /^(some data here|n\/a|na|null|undefined|unknown|tbd|to be determined)$/i;
  const isProbableLocation = (value) => /(North Carolina|California|Florida|Texas|Georgia|Arizona|South Carolina|Nevada|Ohio|Tennessee|Washington|Pennsylvania|New York|England|Scotland|Wales|Ireland|France|Spain|Germany|Italy|Portugal|United States|USA|Canada|Mexico|Australia|New Zealand|South Africa|Japan|Korea|Brazil|Argentina)/i.test(String(value || "").trim());
  const isMeaningful = (value) => {
    const lower = String(value || "").toLowerCase();
    return Boolean(lower && !placeholders.test(lower) && !/bet of the day|tennis bet of the day|betting tips/i.test(lower) && lower !== sport.toLowerCase() && !genericSportNames.test(lower) && !(sport.toLowerCase() === "golf" && isProbableLocation(value)));
  };
  for (const candidate of [directLeague, competition]) {
    if (isMeaningful(candidate)) return normalizeLabel(candidate);
  }
  const fixtureTournament = [tip.homeTeam, tip.awayTeam, previewTitle].find((value) => {
    if (!value) return false;
    const clean = normalizeLabel(value);
    return Boolean(clean && clean.toLowerCase() !== "field" && !(sport.toLowerCase() === "golf" && isProbableLocation(clean)) && /championship|open|masters|cup|classic|international|finals|tour|pga|wta|atp|tournament/i.test(clean));
  });
  if (fixtureTournament) return normalizeLabel(fixtureTournament);
  if (previewTitle) {
    const extracted = extractLeagueFromTitle(previewTitle);
    if (extracted) return normalizeLabel(extracted);
    const titleLooksLikeTournament = !/\s+(?:v|vs)\s+/i.test(previewTitle) && !/bet of the day|betting tips|predictions|tips/i.test(previewTitle) && (sport.toLowerCase() === "golf" || /championship|open|masters|cup|classic|international|finals|tour/i.test(previewTitle));
    if (titleLooksLikeTournament) return normalizeLabel(previewTitle);
  }
  if (tip.preview || tip.verdict) {
    const narrative = String(tip.preview || tip.verdict || "");
    const locationMatch = narrative.match(/\bin\s+(?:the\s+)?([A-Z][A-Za-z0-9\s&]+?)(?:[.!?]|$)/);
    if (locationMatch) {
      const candidate = normalizeLabel(locationMatch[1]);
      if (candidate && !/bet of the day|betting tips|predictions|tips/i.test(candidate) && !(sport.toLowerCase() === "golf" && isProbableLocation(candidate))) return candidate;
    }
    const eventLocationMatch = narrative.match(/\b(?:at|in)\s+([A-Z][A-Za-z0-9\s&]+?)(?:[.!?]|$)/);
    if (eventLocationMatch) {
      const candidate = normalizeLabel(eventLocationMatch[1]);
      if (candidate && !/bet of the day|betting tips|predictions|tips/i.test(candidate) && !(sport.toLowerCase() === "golf" && isProbableLocation(candidate))) return candidate;
    }
  }
  if (sport.toLowerCase() === "tennis") {
    const venueMatch = String(tip.preview || tip.verdict || "").match(/\bin\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/);
    if (venueMatch) {
      const candidate = normalizeLabel(venueMatch[1]);
      if (candidate && candidate !== "US" && candidate !== "Open") return `WTA ${candidate}`;
    }
  }
  return "";
};

export function formatTipChannelCard(tip, { tier = "VIP", showSettlementMarkers = false } = {}) {
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
      const selectionWithMarket = formatSelection(selection.selection, selection.market);
      // Older and bulk-settled tips may only have an outcome on the parent
      // record. Use each selection's explicit result when present, otherwise
      // mirror the parent result so archive markers match the card status.
      const outcome = selection.outcome || tip.outcome || tip.result?.outcome;
      lines.push(`${selectionWithMarket || name}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(outcome, tier, showSettlementMarkers)}`);
    }
  } else {
    const odds = formatOdds(mainTip.odds);
    const units = Number(mainTip.units ?? mainTip.stakeUnits ?? 2);
    lines.push(`${normalizeLabel(mainTip.selection)}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(mainTip.outcome || tip.outcome, tier, showSettlementMarkers)}`);
  }

  return lines.join("\n").trim();
}
export function formatFreeTipChannelCard(tip) {
  if (!tip) return "";

  // Mirror the CLI's formatExpertiseWinsFreeCard heading exactly.
  const lines = ["The Expertise Wins Free Tips:", ""];
  const fixture = tip.homeTeam && tip.awayTeam
    ? `${tip.homeTeam} vs ${tip.awayTeam}`
    : tip.selection || "Match";
  lines.push(fixture);

  const selections = Array.isArray(tip.tips) ? tip.tips : [];

  if (selections.length) {
    for (const selection of selections) {
      const name = formatSelection(
        selection.selection || selection.market || "Tip",
        selection.market
      );
      const odds = formatOdds(selection.odds);
      const units = Number(selection.units ?? selection.stakeUnits ?? 1);
      lines.push(`${name}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(selection.outcome)}`);
    }
  } else if (tip.selection) {
    const name = formatSelection(tip.selection, tip.market);
    const odds = formatOdds(tip.odds);
    const units = Number(tip.stakeUnits ?? tip.units ?? 1);
    lines.push(`${name}${odds ? ` @${odds}` : ""} - ${units} Unit${units === 1 ? "" : "s"}${formatOutcome(tip.outcome)}`);
  }

  return lines.join("\n").trim();
}
