export function getSettlementMarker(outcome, tier) {
  const value = String(outcome || "").trim().toUpperCase();
  if (value === "WON" || value === "WIN") {
    return String(tier || "").toUpperCase() === "FREE" ? "✅✅" : "✅✅🔥";
  }
  if (value === "LOST" || value === "LOSE") return "❎❎";
  if (value === "VOID" || value === "PUSH") return "♻️";
  return "";
}
