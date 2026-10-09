# 🏃 Running The Expertise Wins

This is the **operator's runbook** for the whole workspace. Package-specific detail lives in [`packages/cli.md`](./packages/cli.md), [`packages/backend.md`](./packages/backend.md), and [`packages/frontend.md`](./packages/frontend.md).

> **Where this fits:** the root [`README.md`](../README.md) explains what the project is and why it exists. [`roadmap.md`](./roadmap.md) explains where it's going. **This file explains how to actually run it.**

---

## What the app is (right now)

The CLI has two jobs:

1. **Produce** today's tips as channel-ready text you copy into the channels.
2. **Settle** yesterday's/today's results from input you paste in.

The current CLI loop is **produce → publish manually → paste marked results → settle**. It writes local JSON; it does not publish to Telegram or send data to the API.

> **The CLI is not the only way to get data into the web app.** The backend seed imports the CLI's dated JSON dumps into PostgreSQL, and the Next.js frontend reads the API. To get live data on the web pages, you need the database seeded — see the database sections below.

---

## Run and test in Docker

Docker keeps Node.js, npm dependencies, and PostgreSQL in containers instead of using host-installed project tools. Install Docker Desktop with Linux container support enabled, then run these commands from the repository root in PowerShell:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
docker compose config --quiet
docker compose up -d db
docker compose ps
```

The frontend, API, and PostgreSQL are available on `localhost:3001`, `localhost:3000`, and `localhost:5432`. The app container reaches PostgreSQL as `db:5432`; do not use `localhost` from inside a container.

### Initialize the API database

From the repository root, create the two ignored application env files. Keep the admin password and JWT secret in `backend/.env`; do not commit them. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` there. Then initialize the schema and check the historical dump files:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
docker compose config --quiet
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose up -d app
```

The first `docker compose run app` builds the shared development image, including frontend dependencies; that initial build can take a few minutes. Subsequent commands reuse the image. Once the API is running at `http://localhost:3000`, sign up the configured email through `POST /api/auth/register` with a username and the password from `backend/.env`. Then import the dated dumps and promote that account:

```powershell
docker compose run --rm app npm run --prefix backend seed
```

The **6 October 2026 historical checkpoint** had 12 dated dumps and 356 tip records; the Docker database also had 356 tips, with eight outcomes differing between those records. On 8 October, the Docker sync dry-run validated 417 tips from 14 dump files without writing to the database. These counts are time-specific; reconcile live database and dump results before treating performance as authoritative. The seed creates missing Free/VIP/MaxBet products and assigns each tip to a published tier based on the CLI classification rules. Free football is public; VIP and MaxBet lists require access. It preserves valid outcomes already settled in the database. It promotes an existing `ADMIN_EMAIL` account without changing its password, or creates an active admin using `ADMIN_PASSWORD`. Sign in through `POST /api/auth/login` to obtain a JWT for protected routes. Database data remains in the named `postgres_data` volume when containers stop.

> Prefer the Docker sync command over calling the seed directly — see [Syncing the CLI dumps to a database](#syncing-the-cli-dumps-to-a-database).

The API readiness endpoint is `http://localhost:3000/`; the frontend is at `http://localhost:3001` after the app service starts. The current development stack is Docker Compose, with the CLI scrape and settlement commands optionally run on the host. See [`packages/backend.md`](./packages/backend.md) for API routes, settlement behavior, and authorization rules.

The first time you run the CLI, install its dependencies into the persistent Docker volume, then run its tests:

```powershell
docker compose run --rm --no-deps app npm ci --prefix cli
docker compose run --rm --no-deps app npm run --prefix cli test
```

Other CLI commands can run the same way, for example:

```powershell
docker compose run --rm --no-deps app npm run expertise
docker compose run --rm --no-deps app npm run settlement
```

The repository is bind-mounted, so CLI JSON snapshots and settlement updates remain in the workspace. Installed dependencies and PostgreSQL data are kept in named Docker volumes.

Stop the app and database while preserving their data:

```powershell
docker compose down
```

To also erase PostgreSQL data and dependency/cache volumes, use `docker compose down --volumes`. This is destructive and resets the isolated environment.

The Docker configuration and endpoint checks document local development readiness only. Production readiness, including security configuration, backup/restore, monitoring, and real-user acceptance, remains open. See [`roadmap.md`](./roadmap.md) for V1 acceptance items.

## Local CLI workflow with Docker services

The API, frontend, database, migrations, and sync pipeline run in Docker. You can still run the scrape and settlement commands locally so you can edit and review their files directly. Install the CLI dependencies once, then use the root commands:

```powershell
npm ci --prefix cli
npm run expertise
npm run settlement
```

These commands update the shared dump and settlement files without starting local API or database processes. Sync the reviewed data into the Docker database with:

```powershell
docker compose run --rm app npm run sync
```

The same CLI commands can run inside Docker using `docker compose run --rm app npm run expertise` and `docker compose run --rm app npm run settlement`. Before the first scrape in Docker, install CLI dependencies into its persistent volume with `docker compose run --rm --no-deps app npm ci --prefix cli`. The repository bind mount keeps CLI output in your workspace.

Admin tip settlement is separate from the CLI's marker-based daily settlement. In the admin Tips page, one tip can be settled with an overall outcome and one outcome for each nested selection, submitted atomically in a single save. Review database and dump results for consistency before treating either as the authoritative history.

---

## Optional CLI dependencies on the host

Install Node.js and npm on the host only if you want to run scrape and settlement commands outside Docker. Install CLI dependencies:

```powershell
npm ci --prefix cli
```
> On Windows, if `node`/`npm` aren't on your `PATH`, invoke them from `C:\Program Files\nodejs\`.

---

## Commands at a glance

| Command | What it does |
|---|---|
| `npm run expertise` | **Full daily run** — scrape → normalize → save → print cards |
| `npm run --prefix cli start` | Print cards from the **existing** snapshot (no scraping) |
| `npm run settlement` | **Settle results** from the pasted template and print the settled report |
| `docker compose run --rm app npm run sync` | Push local dumps into the Docker database |
| `docker compose run --rm app npm run sync:prod` | Push the local dumps into the production database |
| `docker compose run --rm app npm run sync:dry` | Validate the dumps without writing to any database |
| `npm run expertise:sync` | Host workflow: scrape, print, then sync (requires local CLI/backend dependencies) |
| `npm run settlement:sync` | Host workflow: settle, then sync (requires local CLI/backend dependencies) |
| `npm run --prefix cli test` | Run the CLI FreeTips, contract, and settlement tests |
| `npm run --prefix cli test:settlement` | Run only the CLI settlement tests |

---

## Syncing the CLI dumps to a database

The CLI writes local JSON; the web app reads PostgreSQL. The Docker sync command bridges the two. `npm run sync:prod` targets production and reads `.env.production`.

```powershell
# Push local dumps into the Docker database
docker compose run --rm app npm run sync

# Push to production (.env.production)
docker compose run --rm app npm run sync:prod

# Validate the dumps without writing
docker compose run --rm app npm run sync:dry
```

Configure production once:

```powershell
Copy-Item .env.production.example .env.production
# then set the real DATABASE_URL in .env.production (gitignored)
```

The script validates every dump before writing, masks the database password in its output, and refuses to run when the env file is missing, `DATABASE_URL` is unset, or the shipped `USER:PASSWORD` placeholder is still in place. It is idempotent: it upserts tips and creates only missing publications, so it never duplicates tips or discards settled results.

### Daily routine

```powershell
# Morning: scrape and print cards locally, then publish to Docker PostgreSQL
npm run expertise
docker compose run --rm app npm run sync

# Later: paste yesterday's results into settlement/settlement-template.txt
npm run settlement
docker compose run --rm app npm run sync
```

Scrape and settlement files are shared with the Docker app through the workspace bind mount. Keep the API and database in Docker while using local CLI commands.

---

## 1. Producing today's tips

### Full run (scrape the site and print)

```bash
npm run expertise
```

This runs, in order:

1. `orchestrator/run-freetips.js` — scrapes FreeTips, normalizes records, saves the snapshot and dated dump, cleans up transient HTML, and runs the FreeTips/contract tests. Test errors are logged and do not necessarily stop the run.
2. `services/app.js` — prints the day's channel-ready cards.

Output sections (copy these into your channels):

```text
💰 MAXBET TIPS          → Bet-of-the-Day featured cards
💎 VIP TIPS             → other-sport VIP cards
🆓 The Expertise Wins Free Tips
----------------------------------------
             SUMMARY
```

### Just print (no scraping)

If you already scraped and only want to print the cards again:

```bash
npm run --prefix cli start
```

### Scrape for a specific date

```bash
npm run --prefix cli expertise -- --date=2026-09-17
```

---

## 2. Settling results (manual input)

Results are **not** fetched from sports scores. Paste result text containing the supported markers, and the CLI applies those markers to the matching dated dump.

### Step 1 — paste the results into the template

Open:

```text
settlement/settlement-template.txt
```

Paste the day's results in this shape (ticks win/lose, and `🔥` is optional — you can include it as in the source, it's just cosmetic):

```text
[17/09/2026 09:13] Pikk Maxbet VIP: ⚽️ || Besiktas v Marseille
Bet of the Day
Beginning: 23:00 Kenyan Time
Bet: Besiktas Win
Stake: 4 Units

Besiktas have won all six home matches under Vincenzo Italiano. ...

Besiktas Win @1.75 - 4 Units ✅✅
Dusan Vlahovic Anytime Goalscorer @2.10 - 2 Units ❎❎
```

* **`✅✅`** → win
* **`❎❎`** → loss

### Step 2 — run the settlement

```bash
npm run settlement
```

By default this settles **yesterday's** dated dump and requires that exact file. It does not fall back to the latest available dump. Paste the results into the template first, or pass an explicit `--date=YYYY-MM-DD`.

To be explicit:

```bash
npm run --prefix cli settlement -- --date=2026-09-17
npm run --prefix cli settlement -- --date=2026-09-17 path/to/results.txt
npm run --prefix cli settlement -- path/to/results.txt
```

### What the settlement does

```text
Read exact-date dump  (settlement/previous-day-results/freetips-<date>.json)
        ↓
Match each tip's fixture + selection against your pasted text and doubled markers
        ↓
Mark outcomes  (win / lose, status = settled) — including nested tips & extraTips
        ↓
Write the annotated dump back to disk
        ↓
Print the settled report
```

In the printed report:

* Paid (Maxbet/VIP) **wins** show `✅🔥`
* Losses show `❎` (no fire)
* Free tips print plain

### Settlement rules (important)

| Situation | Result |
|---|---|
| A tip's line shows `✅✅` | **win** |
| A tip's line shows `❎❎` | **lose** |
| An unmarked **free-channel** selection | **win** (the default when no marker is present) |
| An unmarked **paid-group** selection (featured or non-football) | **loss** (the default when no marker is present) |

> Settlement defaults to **yesterday's** dated dump. Pass an explicit `--date=YYYY-MM-DD` to settle another day.

> ⚠️ **Match the text carefully.** A marker is matched by selection text, falling back to the printed odds and stake on the same line, so a selection reworded between the dump and the channel still settles. The matcher checks every occurrence of the team name, so a fixture sharing a name with an earlier card is matched against the right block.

---

## 3. Where data lives

```text
orchestrator/test-results/freetips.json
    → TODAY's working snapshot (what gets printed)

settlement/previous-day-results/freetips-<DDth Mon YYYY>.json
    → the DATED dump the settlement reads and writes back
```

### How tips accumulate (intentional)

Within the same day, `saveTestResults` **merges** new tips into the snapshot rather than overwriting:

* Existing same-day tips are kept.
* New tips are added, matched by `homeTeam|awayTeam|selection|market`.
* A re-scraped tip with the same key is **updated in place**, not duplicated.

So if you have 5 tips in the morning and 5 more appear later, the snapshot holds **10**. Tips from a *previous* day are dropped from the working snapshot — because they're already preserved in that day's dated dump.

This is deliberate: **a tip is only a win if you mark it as won in the public channel — otherwise it counts as a loss and is accounted for on your end.** The settlement layer enforces exactly that.

---

## 4. Tests

```bash
npm run --prefix cli test                 # freetips + contract + settlement
npm run --prefix cli test:settlement      # settlement layer only
npm run --prefix backend test             # backend service logic (mocked persistence; no DB required)
```

The settlement tests run against a self-contained throwaway dump and clean up after themselves.

---

## 5. Typical day (copy-paste recipe)

```bash
# 1. Morning — produce today's output
npm run expertise

#    → copy the Maxbet / VIP / Free cards into your channels

# 2. Later / next morning — settle the results
#    (paste the day's results into settlement/settlement-template.txt first)
npm run settlement

# 3. Sanity check
npm run --prefix cli test
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `JSON dump not found for date ...` | Settlement requires the exact dated dump. Create it with `npm run --prefix cli expertise -- --date=YYYY-MM-DD`, or pass a date that already has a dump. |
| `Text file not found ...` | Your `settlement-template.txt` (or the path you passed) doesn't exist. |
| Settlement marks the wrong outcome | Matcher hit a substring line first — reorder the lines for that fixture (most specific first). |
| `node` / `npm` not found | Use the full path, e.g. `"C:\Program Files\nodejs\npm.cmd" run settlement`. |
| Cards look empty | The snapshot is empty or was reset for a new day. Run `npm run expertise`. |
| Every web page returns 500 / loads with no data | Check that both `backend/.env` and `frontend/.env` exist, then run `docker compose logs app`. Confirm the frontend API URL is `http://localhost:3000/api` and the backend database URL is `db:5432` inside Docker. |
| `/tips` or `/archive` shows no records | `/tips` only shows the current Nairobi day; an empty page means today's tips are not published yet. `/archive` is for previous dates and defaults to yesterday. Inspect the selected day and dated dumps if no records appear. |
| Win rate and ROI do not match the CLI data | The 6 October figures below are a historical checkpoint, not current totals. Reconcile the latest settlement dump with the database after syncing before relying on performance totals. |

---

## Not built yet (by design)

These are **not** automated in the current workflow:

* scheduled daily scraping
* direct Telegram bot publishing
* automatic result verification from live scores

The public `/api/tips` router is read-only. Admin curation routes require an active admin JWT and the admin UI uses those protected routes; AdminService independently checks the actor before mutation. Daily tip source-of-truth changes should be made through CLI dumps, reviewed, then synced. Backend service-logic tests run with `npm run --prefix backend test`; operator real-user and database-backed workflows remain manual acceptance.

The backend and frontend exist in this repository; see [`packages/backend.md`](./packages/backend.md) and [`packages/frontend.md`](./packages/frontend.md) for setup and current limitations. See [`roadmap.md`](./roadmap.md) for planned work.
