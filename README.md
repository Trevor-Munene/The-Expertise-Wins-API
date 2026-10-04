# The Expertise Wins

> [The Expertise Wins on Telegram](https://t.me/+D_jIXFB807E0NmRk)

The Expertise Wins is a monorepo containing a sports-tip CLI, an Express/Prisma API, and a Next.js frontend. The CLI collects and normalizes FreeTips records into local JSON dumps; `npm run sync` pushes those dumps into PostgreSQL, which is what the web app reads. Channel publication remains manual.

## Project Structure

- `cli/` collects and normalizes FreeTips records, writes local snapshots and dated dumps, formats cards, applies manually pasted settlement markers, and syncs dumps to a database.
- `backend/` contains the Express API, PostgreSQL Prisma schema, and the importer that `npm run sync` uses.
- `frontend/` contains the Next.js public site, blog, account pages, and admin dashboard UI.

## Documentation

All documentation lives in [`docs/`](./docs):

| Document | What it covers |
|---|---|
| [`docs/runbook.md`](./docs/runbook.md) | How to run the project — Docker and host workflows, seeding, syncing, CLI operations |
| [`docs/roadmap.md`](./docs/roadmap.md) | Development phases, current status, and open work |
| [`docs/packages/backend.md`](./docs/packages/backend.md) | Express API, Prisma schema, route map, database setup |
| [`docs/packages/frontend.md`](./docs/packages/frontend.md) | Next.js app, pages, API layer, SEO notes |
| [`docs/packages/cli.md`](./docs/packages/cli.md) | Scraper, normalizer, card formatting, settlement, syncing |

## Quick Start (Host Development)

The API and frontend both need a reachable PostgreSQL database and local env files. **Skipping the env files is the most common cause of every endpoint returning a 500** — see [`docs/runbook.md`](./docs/runbook.md) for the full troubleshooting table.

```powershell
# 1. Install
npm install
npm install --prefix backend
npm install --prefix frontend
npm install --prefix cli

# 2. Create env files (gitignored)
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env

# 3. Point backend/.env at your database, then set ADMIN_EMAIL / ADMIN_PASSWORD
#    Host default: postgresql://tew:tew_local_dev@localhost:55432/expertise_wins?schema=public

# 4. Start the Docker database
docker compose up -d db

# 5. Generate the Prisma client, apply the schema, load historical tips
npm run --prefix backend prisma:generate
npm run --prefix backend prisma:migrate -- --name init
npm run sync

# 6. Run the API (port 3000) and frontend (port 3001)
npm run dev
```

For the fully containerized path, see [`docs/runbook.md`](./docs/runbook.md).

## Daily Workflow

```powershell
# Morning: scrape, print today's channel cards, publish to the database
npm run expertise
npm run sync

# Later: paste yesterday's results into cli/settlement/settlement-template.txt
npm run settlement
npm run sync
```

`npm run expertise:sync` and `npm run settlement:sync` chain both steps. `npm run sync:prod` does the same against production, configured through `.env.production`.

## Default Ports

| Service | Host URL | Docker Compose URL |
|---|---|---|
| Backend API | `http://localhost:3000` | `http://localhost:3180` |
| Frontend | `http://localhost:3001` | `http://localhost:3181` |
| PostgreSQL | `localhost:55432` | `localhost:55432` (inside containers: `db:5432`) |

## API Areas

| Area | Current purpose |
|---|---|
| Authentication | Registration, login, profiles, password changes, and avatar upload |
| Tips | Public Free tips, entitlement-gated VIP/MaxBet tips, and a tier-aware historical archive. Admins can read every tier. |
| Statistics | Win rate, ROI, odds, sport/market/competition breakdowns, time-filtered analytics, and admin-only application usage |
| Products and access | Product tiers plus access tokens, which are **always issued by an admin to a registered user** |
| Administration | User, tip, publication, access-token, and product management; admin API routes enforce the `ADMIN` role |

Subscription-style access is represented by access tokens; the Prisma schema has no separate `Subscription` model.

### Access tokens

Tokens are issued **only by an admin** and **only for a specific registered, active user**:

- Creating or bulk-creating a token requires a product and an assigned user; the API rejects a missing, unknown, or suspended user.
- A token can only be redeemed by the account it was issued to, while signed in. Anonymous redemption is no longer supported.
- A token's owner cannot be changed after creation, so access cannot be transferred.

## Current Readiness

Verified locally on **2026-10-04** with a host-based stack (Next.js dev server + Node API + Dockerized PostgreSQL).

| Application | Current status | Boundaries |
|---|---|---|
| CLI | Scrape/normalize/export, card formatting, settlement, and database sync are implemented and tested. | Writes JSON locally; it does not publish to Telegram. Settlement is manual — results are pasted as markers. |
| Backend API | Connected to a migrated, seeded PostgreSQL database. All API routes return HTTP 200 with live data; admin login issues a working JWT. | Tip mutations still lack role/ownership enforcement, and there is no backend test script. |
| Frontend | Next.js lint passes with one `<img>` warning. Login, tips, archive, stats, profile, products, and all four admin pages were verified in a headless browser rendering live database values with no console errors. | Admin role checks are client-side only. UI-to-API integration is verified manually, not by automated tests. |

Authentication, data retrieval, settlement, token issuance, and admin workflows were confirmed working end-to-end on 2026-10-04. This is a local development baseline, not production approval.

### Operational Notes

- **Data:** the dumps in `cli/settlement/previous-day-results/` hold **288 tip records** across 10 days, which map to 288 rows in the database.
- **Settlement flows to the database.** `npm run settlement` records results in the dump and `npm run sync` publishes them, so win rate and ROI update automatically.
- **Paid tips never default to a loss.** Only non-featured football tips become losses when unmarked; featured and non-football tips stay unsettled so a gap in your results text is never recorded as a false loss.
- **Empty "today" views fall back.** Tip and archive lists return today when today's scrape has run, and otherwise the most recent day that has records, so the pages are never blank before the daily scrape. The tips page labels when it is showing an earlier day.
- **Syncing is safe and idempotent.** `npm run sync` validates every dump before writing, masks the database password in its output, and refuses to run against a half-configured environment. Running it repeatedly never duplicates tips or discards settled results.
- **Regenerate the Prisma client** after any `schema.prisma` change (`npm run --prefix backend prisma:generate`). A stale client silently omits newly added models and causes runtime failures in code that references them.

## License

MIT License.