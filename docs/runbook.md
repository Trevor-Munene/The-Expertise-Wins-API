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
docker compose config --quiet
docker compose up -d db
docker compose ps
```

PostgreSQL is exposed on `localhost:55432`. The app container talks to PostgreSQL using the Compose service name `db`; do not change that URL to `localhost` from inside a container.

### Initialize the API database

From the repository root, copy `backend/.env.example` to `backend/.env`. Keep the admin password in this ignored local file; do not commit it. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` there. Then initialize the schema and check the historical dump files:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose up -d app
```

The first `docker compose run app` builds the shared development image, including frontend dependencies; that initial build can take a few minutes. Subsequent commands reuse the image. Once the API is running at `http://localhost:3180`, sign up the configured email through `POST /api/auth/register` with a username and the password from `backend/.env`. Then import the dated dumps and promote that account:

```powershell
docker compose run --rm app npm run --prefix backend seed
```

The seed imports the historical tips from the current 10 dated dumps, creates missing Free/VIP/MaxBet products, and assigns each tip to a published tier based on the CLI classification rules. The 10 dumps hold **288 tip records**. Free football is public; VIP and MaxBet lists require access. The seed is safe to rerun and preserves already-settled outcomes. It promotes the existing `ADMIN_EMAIL` account without changing its password. If no account exists, it creates an active admin using `ADMIN_PASSWORD`. Sign in through `POST /api/auth/login` to obtain a JWT for protected routes. The seeded database remains in the named `postgres_data` volume when containers stop.

> Prefer `npm run sync` over calling the seed directly — see [Syncing the CLI dumps to a database](#syncing-the-cli-dumps-to-a-database).

The API health endpoint is `http://localhost:3180/`; the frontend is at `http://localhost:3181` after the app service starts. See [`packages/backend.md`](./packages/backend.md) for host-based PostgreSQL setup and known API authorization gaps.

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

Do not expose the API publicly yet: tip create/update/result/delete routes accept any authenticated JWT without enforcing role or ownership, and several tip routes still need stricter access controls. This does not prevent local route testing. See [`packages/backend.md`](./packages/backend.md) for the current readiness notes.

## Host-based web development (API + frontend)

You can run PostgreSQL in Docker while running the API and frontend directly on the host. This is the path verified on 2026-10-04 and is the quickest way to iterate on the web app.

```powershell
# 1. Start only the database in Docker
docker compose up -d db

# 2. Create env files
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Then edit the two files so they agree with each other:

- `backend/.env` → set `DATABASE_URL="postgresql://tew:tew_local_dev@localhost:55432/expertise_wins?schema=public"`, set a strong `JWT_SECRET`, keep `PORT=3000`, and set `CORS_ORIGIN="http://localhost:3001,http://localhost:3181"`.
- `frontend/.env` → set `NEXT_PUBLIC_API_URL=http://localhost:3000/api` and `NEXT_PUBLIC_APP_URL=http://localhost:3001`.

> **Do not skip this.** `.env.example` ships `postgresql://USER:PASSWORD@...` placeholders. Starting the API without a real `backend/.env` makes **every** route return HTTP 500, and a frontend pointed at the wrong port renders pages with no data. Both failures look identical to a broken frontend.

Then install, migrate, seed, and run:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend

npm run --prefix backend prisma:generate
npm run --prefix backend prisma:migrate
npm run --prefix backend seed:check
npm run --prefix backend seed

npm run dev
```

The API is then at `http://localhost:3000` and the frontend at `http://localhost:3001`. Verify with `GET http://localhost:3000/` (health) and `POST http://localhost:3000/api/auth/login` (auth).

> Regenerate the Prisma client whenever `schema.prisma` changes. A stale client omits newly added models and produces runtime errors on any route that touches them.

---

## Host-based CLI (alternative)

If you prefer not to use Docker for the CLI, install Node.js and npm on the host, then install CLI dependencies:

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
| `npm run sync` | Push the local dumps into the development database |
| `npm run sync:prod` | Push the local dumps into the production database |
| `npm run sync:dry` | Validate the dumps without writing to any database |
| `npm run expertise:sync` | Scrape, print, then sync in one step |
| `npm run settlement:sync` | Settle, then sync in one step |
| `npm run --prefix cli test` | Run the CLI FreeTips, contract, and settlement tests |
| `npm run --prefix cli test:settlement` | Run only the CLI settlement tests |

---

## Syncing the CLI dumps to a database

The CLI writes local JSON; the web app reads PostgreSQL. `npm run sync` bridges the two, and the same script serves local development and production — only the env file differs.

```powershell
# Push the local dumps to the development database (backend/.env)
npm run sync

# Push to production (.env.production)
npm run sync:prod

# Validate the dumps without writing
npm run sync:dry
```

Configure production once:

```powershell
Copy-Item .env.production.example .env.production
# then set the real DATABASE_URL in .env.production (gitignored)
```

The script validates every dump before writing, masks the database password in its output, and refuses to run when the env file is missing, `DATABASE_URL` is unset, or the shipped `USER:PASSWORD` placeholder is still in place. It is idempotent: it upserts tips and creates only missing publications, so it never duplicates tips or discards settled results.

### Daily routine

```powershell
# Morning: scrape, print cards, publish to the database
npm run expertise
npm run sync

# Later: paste yesterday's results into settlement/settlement-template.txt
npm run settlement
npm run sync
```

`npm run expertise:sync` and `npm run settlement:sync` chain both steps.

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

By default this uses today's UTC date and requires the exact matching dated dump. It does not fall back to the latest available dump. Paste the results into the template first.

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
| A **free** football tip is **not present** in your pasted text | **loss** (never marked as won is accounted as a loss on your end) |
| A **paid** tip (featured or non-football) has no marker | left **unsettled** (needs an explicit marker) |

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
| Every web page returns 500 / loads with no data | `backend/.env` is missing or still has `USER:PASSWORD` placeholders, or `frontend/.env` points at the wrong API port. See [Host-based web development](#host-based-web-development-api--frontend). |
| `/tips` or `/archive` shows no records | These routes default to **today's UTC date**. Run the CLI scrape for today, or pick a day that has data (the API accepts `?day=YYYY-MM-DD`). The newest dump is `freetips-4th Oct 2026.json`. |
| Win rate and ROI show `0` | Every seeded tip has outcome `PENDING`. Settle results through the CLI workflow, then re-run the backend seed. |

---

## Not built yet (by design)

These are **not** automated in the current workflow:

* scheduled daily scraping
* direct Telegram bot publishing
* automatic result verification from live scores

Also not yet built: server-side role/ownership enforcement on tip mutations, an automated backend test suite, and UI-to-API integration tests.

The backend and frontend exist in this repository; see [`packages/backend.md`](./packages/backend.md) and [`packages/frontend.md`](./packages/frontend.md) for setup and current limitations. See [`roadmap.md`](./roadmap.md) for planned work.
