# The Expertise Wins — CLI Engine & Orchestrator

The `cli` package collects FreeTips predictions, normalizes them into the CLI tip contract, writes local JSON snapshots, and prints channel-ready cards. Publication to Telegram and result entry are manual.

## Architecture

- `scrapers/freetips.scraper.js` collects predictions from FreeTips.
- `normalizers/freetips.normalizer.js` maps records into the tip contract and converts supplied numeric odds to JavaScript numbers. It does not parse fractional or American odds formats.
- `orchestrator/run-freetips.js` runs scraping and normalization, saves a working snapshot, exports a dated dump, and runs FreeTips/contract checks.
- `settlement/settlement.js` reads manually pasted `✅✅` / `❎❎` markers, updates the exact dated dump, and does not fetch live scores.
- `services/tips.client.js` consumes local data and formats cards; it does not make requests to the backend API.

## Install

From the repository root:

```bash
npm install --prefix cli
```

## Commands

Run the daily scrape, normalization, snapshot, and card output:

```bash
npm run expertise
```

Print cards from the existing snapshot without scraping:

```bash
npm run --prefix cli start
```

Settle results against a specific dated dump after pasting markers into `cli/settlement/settlement-template.txt`:

```bash
npm run --prefix cli settlement -- --date=2026-10-01
```

Settlement defaults to today's UTC date and requires a dump for that exact date; it does not fall back to the newest available dump. The recognized result markers are doubled: `✅✅` for a win and `❎❎` for a loss. Featured tips without a marker remain unsettled; regular tips default to a loss when no matching marked result is found.

Run the CLI tests:

```bash
npm run --prefix cli test
npm run --prefix cli test:settlement
```

## Data Locations

- `orchestrator/test-results/freetips.json` is the current working snapshot.
- `settlement/previous-day-results/` contains dated JSON dumps that settlement reads and updates.
- `settlement/settlement-template.txt` is the manual result-input template.

The CLI operates independently of the backend database. The backend seed command can import the dated dumps; it does not change the CLI code or dump files.
