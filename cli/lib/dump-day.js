/**
 * Shared day helpers for the CLI dump pipeline.
 *
 * Every tip is bucketed into a day by `scrapedAt`, and the backend serves that
 * day in the business timezone (Africa/Nairobi, a fixed UTC+3). The scraper and
 * the sync must therefore agree on the same rules, or a dump named "23rd Oct"
 * can land on the 24th and the UI shows it under the wrong day.
 *
 * Keep this module free of dependencies so both the orchestrator and the
 * backend seed can require it.
 */

const BUSINESS_TIME_ZONE = "Africa/Nairobi";
const BUSINESS_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Tips are scraped shortly after midnight in the business timezone, which is
// still the previous day in UTC. A scrape before 03:00 UTC would therefore be
// stamped with yesterday's UTC date. Anything scraped before this hour is
// pinned to the business day it actually belongs to.
const SCRAPE_DAY_BOUNDARY_UTC_HOUR = 3;

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (value) => String(value).padStart(2, "0");

// "freetips-21st Oct 2026.json" -> "2026-10-21". Returns null for any other name.
// The month is mapped explicitly instead of parsed with `new Date(...)`, which
// returns Invalid Date for "Sept" and silently shifts the day for other inputs.
function parseDumpDay(fileName) {
  const match = /^freetips-(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]+)\s+(\d{4})\.json$/i.exec(fileName);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
  const year = Number(match[3]);
  if (!month || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates such as the 31st of February.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return date.toISOString().slice(0, 10);
}

// The business day a timestamp belongs to, as YYYY-MM-DD.
function businessDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + BUSINESS_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

// The UTC instant to stamp on a freshly scraped tip so it is filed under the
// requested business day. Nairobi midnight is 21:00 UTC the previous evening,
// so a scrape at 05:35 Nairobi would otherwise keep the previous UTC date.
function scrapeStampForDay(dayKey, now = new Date()) {
  const noon = `${dayKey}T12:00:00.000Z`;
  const stamp = new Date(noon).getTime() - BUSINESS_UTC_OFFSET_MS;
  if (Number.isNaN(stamp)) return now;

  // Keep the real scrape time when it already falls inside the requested day.
  if (businessDayKey(now) === dayKey && now.getTime() >= stamp && now.getTime() < stamp + DAY_MS) {
    return now;
  }

  const parsed = new Date(stamp);
  parsed.setUTCHours(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
  // Re-check in case the wall-clock hour pushed the stamp past midnight.
  return businessDayKey(parsed) === dayKey ? parsed : new Date(stamp);
}

module.exports = {
  BUSINESS_TIME_ZONE,
  BUSINESS_UTC_OFFSET_MS,
  DAY_MS,
  SCRAPE_DAY_BOUNDARY_UTC_HOUR,
  parseDumpDay,
  businessDayKey,
  scrapeStampForDay,
  pad,
};
