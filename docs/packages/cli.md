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
An unmarked **free-channel** selection defaults to a loss; an unmarked **paid-group** (VIP/MaxBet) selection defaults to a win. Explicit markers override the channel default. This is the operator's manual daily workflow: paste verified outcomes in the settlement file, review the generated report, then sync.

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

A day can be scraped more than once. Every scrape **merges into that day's dump**:

- A game the site has pushed off its list (settled, or rolled off the card) stays in the dump with its result.
- A game seen again is **updated in place**, not duplicated: fresh odds and detail replace the stored copy.
- A scrape never settles, unsettles or reopens a game, and never erases detail the site stopped printing (preview, verdict, nested tips). Settlement is the only thing that decides outcomes.

A tip is keyed by its day plus its fixture, market and selection, so the database row follows the tip when the site reorders its card instead of being re-created.

`sync` treats the dumps as the source of truth for the days they cover:

1. **Refuses a dump that contradicts itself.** The same fixture, market and selection listed twice in one dump would collapse onto one row, so the sync stops and names it.
2. **Reconciles every row on a dumped day** before writing. A live row with no matching dump record that is provably an older copy of a dumped tip (a row scraped under the previous position-based id) is removed, together with its publications. Settled rows, rows an admin authored, and rows describing a different bet are kept.
3. **Re-dates a dumped row** whose `scrapedAt` falls outside its dump day, because that is what decides where the API shows it.
4. **Names a live row with no `PUBLISHED` publication**, which no API list can show.
5. **Applies the dumps**, keeping a settlement and keeping any detail the site stopped printing.

A day holds well under 100 tips, so the check reads a few hundred rows. `sync:dry` runs the same check and reports it without writing.

`CLI_DUMP_DIR` points the dumps and the working snapshot at another directory; the tests use it so a run never rewrites the real dumps.

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

### Settlement rules

Settlement decides what the pasted channel text says about each card:

- `✅✅` settles the selection as a **win**, `❎❎` as a **loss**.
- A `Refunded ♻️♻️` note (or any `refunded` / `money back` wording) on a card settles every selection on that card as **void**. The stake is returned, so a refund is never a win, a loss, or an unmarked default.
- A `Plays today...♻️♻️` note (or any `postponed` / `rearranged` wording) means the fixture was pushed forward. It still belongs to the day it was published, so that day's settlement records it as a **win** and flags it `postponed` (**CARRIED FORWARD** in the report).
- A fixture the pasted text does not mention at all uses the channel-aware unmarked default: **free = lose, paid (VIP/MaxBet) = win**.
- Matching is per card. A refund or push note only applies to the fixture whose card it closes, and a selection that is one word must match whole words, so a note or a neighbouring card can never flip another tip.

The operator scrapes again the next day, so a carried fixture appears on the next day's card with its real tick or cross. Settle that day to record it:

```powershell
npm run --prefix cli settlement next
```

`settlement next` finds the youngest earlier day whose tips are all settled with some flagged carried forward, and settles that day's dump (defaults to yesterday). Pass `--date=` a later date to look further back. Re-running settlement for a day is idempotent: settled tips, including carried-forward wins, keep their outcomes.

To rebuild a day from scratch (for example after pasting the wrong text), reset it and settle it again:

```powershell
npm run --prefix cli settlement:reset -- --date=2026-10-19
npm run settlement -- --date=2026-10-19
```

The reset clears every outcome and carried-forward flag for that dump and leaves the tips pending; follow it with a normal sync.

## Current Data State

The dated dumps under `settlement/previous-day-results/` currently hold **572 tip records across 21 files: 419 wins, 37 losses, and 116 pending**. The 14th and 15th October dumps are empty placeholders (`[]`) because no tips were exported for those days; the 13th October dump is the most recent populated one with 24 tips. Reconcile the dumps against the database after each sync before relying on combined performance totals.

Review settlement output before syncing it into Docker PostgreSQL. The live `/api/tips` feeds are restricted to the current Nairobi day and do not fall back to older tips; the archive is used for previous days.
