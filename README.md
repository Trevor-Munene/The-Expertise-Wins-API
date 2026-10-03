# The Expertise Wins

> [The Expertise Wins on Telegram](https://t.me/+D_jIXFB807E0NmRk)

The Expertise Wins is a monorepo containing a sports-tip CLI, an Express/Prisma API, and a Next.js frontend. The CLI currently writes local JSON snapshots and formatted cards; channel publication and result settlement are manual.

## Project Structure

- `cli/` collects and normalizes FreeTips records, writes local snapshots, formats cards, and applies manually pasted settlement markers.
- `backend/` contains the Express API, PostgreSQL Prisma schema, and a seed importer for the dated CLI dumps.
- `frontend/` contains the Next.js public site, blog, account pages, and admin dashboard UI.

See the [CLI guide](./cli/README.md), [backend guide](./backend/README.md), and [frontend guide](./frontend/README.md) for package-specific details.

## Current Readiness

This is the state of the local development workspace as of 2026-10-03; a passing build or local route check does not mean the service is production-ready.

| Application | Current status | Boundaries |
|---|---|---|
| CLI | Local scrape/normalize/export, card formatting, and manual settlement workflows are implemented. | Writes JSON locally; it does not publish to Telegram or send tips to the API. CLI tests were not rerun in this review. |
| Backend API | Compose PostgreSQL is migrated and seeded with 271 tips from nine dated dumps, including product publications. The tier-aware archive, source redaction, API health, and protected routes were verified locally. | Tip mutations still lack role/ownership enforcement, and there is no backend test script. The CLI dumps carry pending outcomes; results still require manual settlement. |
| Frontend | Next.js lint passes; the archive, sport/date/outcome filters, detail previews, and entitlement-aware tiers were verified locally. | Lint reports an existing `<img>` optimization warning on the profile page. Full UI-to-API integration tests are not automated. |

The CLI remains independent of the API. See [Run.md](./Run.md), [backend/README.md](./backend/README.md), and [frontend/README.md](./frontend/README.md) for package-specific details and setup.

## Docker Development

Install Docker Desktop with Linux container support enabled. From the repository root in PowerShell, configure the local admin password in the ignored `backend/.env` file, then initialize PostgreSQL, apply the schema, and load the historical tips:

```powershell
docker compose config --quiet
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose up -d db
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose run --rm app npm run --prefix backend seed
docker compose up -d app
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before seeding. The seed promotes an existing user with that email without changing its password, or creates an active admin if the user does not exist. Passwords are stored as bcrypt hashes. The seed imports 271 tips from nine dated dumps, creates missing tier products and published tip assignments, and is safe to rerun. Free football is public; VIP and MaxBet remain access-controlled.

The first `docker compose run app` builds the shared image, including frontend dependencies, and can take a few minutes; later runs reuse the image. Compose exposes the frontend at `http://localhost:3181`, the API at `http://localhost:3180`, and PostgreSQL at `localhost:55432`. Inside containers, the database host is `db`. Dependencies and database data are stored in Docker volumes; `docker compose down` stops services while preserving data.

Run the CLI test suite in the container (install CLI dependencies once first):

```powershell
docker compose run --rm --no-deps app npm ci --prefix cli
docker compose run --rm --no-deps app npm run --prefix cli test
```

See [Run.md](./Run.md) for container-based CLI workflows, cleanup commands, and the host-based alternative.

Optional port and local database overrides can be placed in a root `.env` file (ignored by Git): `API_HOST_PORT`, `FRONTEND_HOST_PORT`, `POSTGRES_HOST_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `JWT_SECRET`. Defaults are intended only for local development.

## Host Development

Install the root runner and the packages you plan to use:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm install --prefix cli
```

Configure `backend/.env` and migrate a reachable PostgreSQL database before starting both web applications from the repository root:

```bash
npm run dev
```

Run the independent CLI workflows from the repository root:

```bash
npm run expertise
npm run settlement
```

## API Areas

| Area | Current purpose |
|---|---|
| Authentication | Registration, login, profiles, password changes, and avatar upload |
| Tips | Public today-only live tips, paid VIP/MaxBet tiers, and an all-access historical archive grouped into Free, VIP, and MaxBet with current-day and sport filters; historical baseline tips are marked WON for progress tracking |
| Statistics | Performance summaries, time-filtered analytics, and admin-only application usage tracking for the last 30 days |
| Products and access | Product information, registered-user-linked tokens, and anonymous token redemption for time-limited access without login |
| Administration | User, tip, publication, access-token, and product management; admin API routes enforce the `ADMIN` role |

Subscription-style access is represented by access tokens; the Prisma schema has no separate `Subscription` or analytics-record model.

Source identifiers, source URLs, provider/bookmaker labels, and source analytics are withheld from public tip responses and pages. Source analytics and application usage are admin-only. Live VIP and MaxBet tips require paid entitlement. The archive is intentionally open to all visitors, defaults to the current day, and keeps Free, VIP, and MaxBet records in separate groups with sports populated from each tier. Admins may link a generated token to a registered user, while redemption also works anonymously. Historical seed records are currently normalized to WON as a temporary baseline while the settlement workflow progresses.

## License

MIT License.