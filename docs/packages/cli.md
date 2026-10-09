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

Settlement defaults to **yesterday's** dated dump and requires a dump for that exact date; it does not fall back to the newest available dump. Pass `--date=YYYY-MM-DD` to settle another day. The recognized result markers are doubled: `✅✅` for a win and `❎❎` for a loss.

### Missing marker defaults
An unmarked **free-channel** selection defaults to a win; an unmarked **paid-group** selection defaults to a loss. Explicit markers override the channel default. This is the operator's manual daily workflow: paste verified outcomes in the settlement file, review the generated report, then sync.

A marker is matched by selection text, falling back to the printed odds and stake on the result line, so a selection that was reworded between the dump and the channel (for example `Over (9/10)` versus `Over Total Goals`) still settles correctly. Fixture lookup also considers every occurrence of the team name, so a fixture that shares a name with an earlier card is matched against the right block.

The web admin also supports settling every selection within one stored tip in one save. That operation is part of the backend/web app workflow; it does not modify the local CLI settlement template or dated JSON dumps. Keep CLI settlement and application admin settlement in sync by reviewing and syncing the operator's chosen source of truth.

Run the CLI tests:

```bash
npm run --prefix cli test
npm run --prefix cli test:settlement
```

> Run the commands above whenever settlement or card classification changes; settlement tests use throwaway files and do not alter production dumps.

## Data Locations

- `orchestrator/test-results/freetips.json` is the current working snapshot.
- `settlement/previous-day-results/` contains dated JSON dumps that settlement reads and updates.
- `settlement/settlement-template.txt` is the manual result-input template.

The CLI scrape and settlement commands operate independently of the backend database. Sync local dumps into Docker PostgreSQL with `docker compose run --rm app npm run sync`.

## Syncing with the Database

The CLI ships one sync script that works the same for local development and production. It reuses the backend seed pipeline, which upserts tips by a deterministic id, so it is safe to run repeatedly.

```bash
# Push local dumps to Docker PostgreSQL
docker compose run --rm app npm run sync

# Push to production (.env.production)
docker compose run --rm app npm run sync:prod

# Validate the dumps without writing anything
docker compose run --rm app npm run sync:dry
```

Configure production once by copying the template:

```powershell
Copy-Item .env.production.example .env.production
# then set the real DATABASE_URL in .env.production (gitignored)
```

The script prints the target host with the password masked, and refuses to run when the env file is missing, `DATABASE_URL` is unset, or the shipped `USER:PASSWORD` placeholder is still in place. Validation always runs before any write, so a malformed dump cannot half-apply.

### Typical daily flow

```powershell
# Morning: scrape and print today's cards
npm run expertise

# Publish the scrape to Docker PostgreSQL
docker compose run --rm app npm run sync

# Later: paste yesterday's results into the settlement template, then settle
npm run settlement

# Publish the results
docker compose run --rm app npm run sync
```

`npm run expertise:sync` and `npm run settlement:sync` are optional host-only convenience scripts. They require the local database at `localhost:5432` and both CLI and backend dependencies installed; the Docker sync workflow above is the standard path.

## Current Data State

The figures below are a **historical 2026-10-06 checkpoint**, not current totals. At that point, 12 dated dumps contained 356 tip records; the dump outcomes and synced database outcomes differed by eight results. Later local scrape/settlement files may exist. Review and reconcile the current dated dump and database after each sync before relying on combined performance totals.

Review settlement output before syncing it into Docker PostgreSQL. The live `/api/tips` feeds are restricted to the current Nairobi day and do not fall back to older tips; the archive is used for previous days.
