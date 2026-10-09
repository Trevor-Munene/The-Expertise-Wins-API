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
| [`docs/runbook.md`](./docs/runbook.md) | Docker-first setup, database initialization, syncing, and local CLI operations |
| [`docs/roadmap.md`](./docs/roadmap.md) | Development phases, current status, and open work |
| [`docs/v2-ideation.md`](./docs/v2-ideation.md) | Open, non-committal V2 ideas for discussion |
| [`docs/packages/backend.md`](./docs/packages/backend.md) | Express API, Prisma schema, route map, database setup |
| [`docs/packages/frontend.md`](./docs/packages/frontend.md) | Next.js app, pages, API layer, SEO notes |
| [`docs/packages/cli.md`](./docs/packages/cli.md) | Scraper, normalizer, card formatting, settlement, syncing |

## Quick Start (Docker)

Docker runs the API, frontend, and PostgreSQL. Node.js is only needed on the host if you choose to run the CLI locally.

Install Docker Desktop with Linux container support enabled. From the repository root in PowerShell, configure the local admin password in the ignored `backend/.env` file, then initialize the database:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
docker compose config --quiet
docker compose up -d db
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose run --rm app npm run sync
docker compose up -d app
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before syncing. The sync promotes an existing user with that email without changing its password, or creates an active admin if the user does not exist. Passwords are stored as bcrypt hashes.

The first `docker compose run app` builds the shared image, including frontend dependencies, and can take a few minutes; later runs reuse the image.

Run daily CLI commands on the host when you want to edit and inspect dumps directly. Install CLI dependencies once:

```powershell
npm ci --prefix cli
npm run expertise
npm run settlement
```

These commands write to the shared CLI files; they do not start another API or database. Sync reviewed dumps into the Docker database with `docker compose run --rm app npm run sync`. The scrape and settlement commands can also run in Docker with `docker compose run --rm app npm run expertise` and `docker compose run --rm app npm run settlement`.

Before the first CLI run in Docker, install its dependencies into the persistent volume with `docker compose run --rm --no-deps app npm ci --prefix cli`.

Stop the services while preserving data:

```powershell
docker compose down
```

`docker compose down --volumes` also erases PostgreSQL data and dependency caches. That is destructive and resets the environment.

The API, frontend, and PostgreSQL use the same ports on the host and in their containers: API `3000`, frontend `3001`, and database `5432`. Frontend settings live in `frontend/.env`; API/database and admin settings live in `backend/.env`. The API container connects to PostgreSQL at `db:5432`; host-run CLI sync uses `localhost:5432`. Dependency and database data live in Docker volumes, so `docker compose down` keeps them.

## Daily Workflow

```powershell
# Morning: scrape and print cards locally, then sync the reviewed dumps into Docker
npm run expertise
docker compose run --rm app npm run sync

# Later: paste yesterday's results into cli/settlement/settlement-template.txt
npm run settlement
docker compose run --rm app npm run sync
```

`docker compose run --rm app npm run sync:prod` targets production and uses `.env.production`.

## Default Ports

| Service | Host URL | Docker Compose URL |
|---|---|---|
| Backend API | `http://localhost:3000` | `http://localhost:3000` (inside containers: `app:3000`) |
| Frontend | `http://localhost:3001` | `http://localhost:3001` |
| PostgreSQL | `localhost:5432` | `localhost:5432` (inside containers: `db:5432`) |

Use `docker compose run --rm app npm run sync` to run the local sync against the Compose database. `docker compose run --rm app npm run sync:prod` remains an explicit production operation and uses `.env.production`.

## API Areas

| Area | Current purpose |
|---|---|
| Authentication | Registration, login, profiles, password changes, and avatar upload |
| Tips | Public Free tips, entitlement-gated VIP/MaxBet tips, a tier-aware historical archive, and admin curation under `/api/admin/tips`. Routine daily production and settlement use CLI dump → review → sync. |
| Statistics | Win rate, ROI, odds, sport/market/competition breakdowns, time-filtered analytics, and admin-only application usage |
| Products and access | Product tiers plus access tokens, which are **always issued by an admin to a registered user** |
| Administration | User, access-token, and product management; admin routes and mutation services enforce an active `ADMIN` role. Daily tip production/settlement remains CLI dump → review → sync. |

Subscription-style access is represented by access tokens; the Prisma schema has no separate `Subscription` model.

### Access tokens

Tokens are issued **only by an admin** and **only for a specific registered, active user**:

- Creating or bulk-creating a token requires a product and an assigned user; the API rejects a missing, unknown, or suspended user.
- A token can only be redeemed by the account it was issued to, while signed in. Anonymous redemption is no longer supported.
- A token's owner cannot be changed after creation, so access cannot be transferred.
- Revoke disables a token while retaining its record; `DELETE /api/admin/subscription-tokens/:id` permanently deletes it.
- Run backend service-logic checks in Docker with `docker compose run --rm --no-deps app npm run --prefix backend test`; they use mocked persistence and do not require PostgreSQL.

## V1 Status (8 October 2026)

V1 is an actively tested and hardened product, not yet declared production-ready. The current codebase includes the daily scrape → review → sync workflow; public Free tips; access-controlled VIP and MaxBet feeds; archives and transparent performance statistics; accounts, admin curation, access-token redemption, and a content/blog area. The API, frontend, and PostgreSQL are intended to run through Docker Compose. CLI scrape and settlement commands can be run locally when an operator prefers direct access to the generated files.

This document records the implementation and intended workflow as of this writing. It does not claim a fresh production deployment check or acceptance of every browser/database workflow. Before launch, complete the remaining V1 acceptance, security, backup/restore, and operational checks tracked in [`docs/roadmap.md`](./docs/roadmap.md).

### Verification recorded 8 October 2026

- Docker Compose reports the application container running and PostgreSQL healthy.
- API root (`http://localhost:3000/`) and frontend home, tips, archive, stats, sitemap, and robots endpoints respond successfully.
- Backend service tests pass; frontend lint passes with one existing `img` optimization warning in the profile page.
- CLI scraper/contract/settlement tests pass; the Docker sync dry run validated 417 tips across 14 files without changing the database.
- The production frontend build, authentication/entitlement flows, settlement against a live database, and full browser acceptance were not re-run in this review. Treat those as open checks, not verified behavior.
- SEO now uses `NEXT_PUBLIC_SITE_URL` for canonical URLs, social metadata, sitemap, and robots. The local example uses `https://theexpertisewins.com`; set the actual public domain in `frontend/.env` before a production build.
- Admins can settle a single tip and assign an outcome to every selection in that tip in one save. The overall tip result and each selection result are stored together.

| Area | Implemented in V1 | Still needs work or validation |
|---|---|---|
| CLI | Scrape/normalize/export, sport-aware channel formatting, local JSON dumps, manual settlement, and repeatable database sync. | Telegram publishing and live-score settlement are not automated. Review scrape and settlement output before sync. |
| Backend | Express/Prisma REST API, accounts, token-based product access, tip administration, archives, statistics, and usage tracking. | Developer API services are a V2 idea. Finish real-user/database-backed acceptance and reconcile data before launch. |
| Frontend | Next.js public pages, account/profile pages, transparent archives and stats, product access, editorial content, and admin pages. | UI-to-API acceptance is still required across the full set of customer and admin workflows. |
| Operations | Docker Compose for API, frontend, and PostgreSQL; separate `backend/.env` and `frontend/.env`; standard host/container ports. | Production deployment, security review, backups/restores, monitoring, and release acceptance remain open. |

The current release scope and remaining acceptance work are in [`docs/roadmap.md`](./docs/roadmap.md). [`docs/v2-ideation.md`](./docs/v2-ideation.md) is a separate, open proposal for possible future enhancements; it is not a V1 commitment.

### Operational Notes

- **Settlement flows to the database.** `npm run settlement` records results in the dump (defaulting to yesterday's file, or an explicit `--date`); `docker compose run --rm app npm run sync` publishes them, so win rate and ROI update automatically. Review the generated settlement before syncing.
- **Settlement defaults are channel-aware.** An unmarked free-channel pick settles as a win; an unmarked paid-group pick settles as a loss. Explicit `✅✅` / `❎❎` markers always override the default.
- **Live tips are day-scoped.** Daily tips are intended to show the current Nairobi day across tiers; historical tips belong in the archive. Admin tip management defaults to today and provides today/yesterday filters for daily review and settlement.
- **Admins see every tier.** The tips page loads Free, VIP, and MaxBet for an admin account; the public tips list intentionally exposes only the public (Free) product.
- **Single-tip settlement supports every selection.** From Admin → Tips, choose Settle, set the overall outcome, then set each selection's outcome (or apply the overall outcome to all) and save once.
- **Syncing is safe and idempotent.** The Docker sync command validates every dump before writing, masks the database password in its output, and refuses to run against a half-configured environment. Running it repeatedly never duplicates tips or discards settled results.
- **Regenerate the Prisma client** after any `schema.prisma` change (`docker compose run --rm app npm run --prefix backend prisma:generate`). A stale client silently omits newly added models and causes runtime failures in code that references them.

## License

MIT License.
