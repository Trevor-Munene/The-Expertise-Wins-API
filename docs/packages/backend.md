# The Expertise Wins — Express Backend API

The `backend` directory contains the Express API, Prisma schema, and historical-tip importer for **The Expertise Wins**. Tip mutations and admin operations require an active admin account. Service-logic tests run with persistence mocked; final MVP acceptance still requires operator testing against a configured database.

## 📌 Features & Responsibilities

- **Authentication**: Passport Local and JWT authentication are implemented in source. Admin endpoints enforce the `ADMIN` role.
- **Tips & Curation Engine**: Includes free and token-gated VIP/MaxBet endpoints, an entitlement-aware historical archive, tip details, and admin-only mutations.
- **Performance & Analytics Engine**: Calculates real-time win rates, estimated ROI, average odds, sport breakdowns, market performance, time-based reports, and admin-only application usage summaries for the last 30 days.
- **Products & Access**: Manages products and access-token issuance/redemption. Access is represented by tokens; there is no separate `Subscription` database model.
- **Access token issuance**: Tokens are created only through admin routes and are always assigned to one registered, active user. A missing, unknown, or suspended user is rejected, redemption requires signing in as that user, and a token's owner cannot be changed after creation.
- **Admin Management API**: Endpoints for tip publication/settlement, access tokens, user roles, and products. Routes require an authenticated admin account.
- **Source privacy**: Public tip responses strip source identifiers, source URLs, provider labels, and source-only metadata; source analytics endpoints are admin-only.
- **Usage tracking**: Every finished `/api` request records a `UsageEvent` row (path, user, status code) for the admin usage dashboard. This tracking is best-effort and can never fail a real API response.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma ORM with PostgreSQL
- **Authentication**: Passport.js & JWT (`jsonwebtoken`)
- **Validation**: Joi validation schemas

## 📡 API Route Architecture

- `/api/auth`: User registration, login, logout, me, password updates, avatar upload.
- `/api/tips`: Public Free reads (`/`, `/free`), entitlement-gated VIP/MaxBet reads, archive and details. This router is read-only; routine tip curation and settlement start from CLI dumps.
- `/api/stats`: Comprehensive analytics, win rates, ROI, sport/market breakdowns, and time period statistics.
- `/api/products`: Public and authenticated product tier information.
- `/api/subscriptions`: Active subscriptions, token redemption (`/redeem`, requires the assigned user to sign in), token verification, and subscription history.
- `/api/admin`: Active-admin-only user, tip curation/publication, access-token, and product management. Tokens can be revoked (retain audit record) or permanently deleted. Routine daily tip settlement remains CLI dump → review → sync.

## Verification Status (6 October 2026)

The current Docker Compose configuration validates, PostgreSQL is healthy, and the API health endpoint plus `/api/stats/summary` return HTTP 200. The frontend home route also returns HTTP 200. This verifies startup and basic service reachability only; the current snapshot does not include a fresh full authentication, entitlement, or admin workflow run. A broader browser/API review was recorded on 4 October against an earlier database snapshot and should be treated as historical.

### Known Data State

After the verified local sync on **2026-10-06**, the stats API reports **356 tips: 304 wins, 5 losses, and 47 pending**, with a 98.38% win rate, 119.67% ROI, and average odds of 2.64. The repository's 12 dated dumps total 356 records but report 301 wins and 55 pending. Eight outcomes differ and still need reconciliation. Metrics change as records are settled and synced; see [`../roadmap.md`](../roadmap.md) for the dated project status.

Tip lists return today's published records when present, otherwise the most recent day with data.

## Access Token Rules

Access tokens are minted only by an admin and always belong to one registered account:

- `POST /api/admin/subscription-tokens` and the bulk variant require both a product and an `assignedUserId`. The API rejects a missing user, an unknown user id, or a user whose status is not `ACTIVE`.
- `POST /api/subscriptions/redeem` requires authentication. Only the account a token was issued to can redeem it; a token assigned to someone else returns 403, and an unassigned token is rejected.
- `PATCH /api/admin/subscription-tokens/:id` refuses to change `assignedUserId`, so access cannot be transferred after a token is created.
- The raw token code is returned only in the create response; only a hash is stored.
- `POST /api/admin/subscription-tokens/:id/revoke` disables a token but keeps the row for audit. `DELETE /api/admin/subscription-tokens/:id` permanently removes it (404 when the id does not exist).

Because redemption is account-bound, the anonymous redemption path described in earlier revisions no longer exists.

## Tip and Archive Day Selection

`/api/tips` (and its tier variants) and `/api/tips/archive` return **today** when today has published tips. When today has no records — before the day's scrape has run — they fall back to the **most recent day that has data** instead of returning an empty page. An explicit `day`, `from`, or `to` always wins. Both responses include a `day` field naming the day that was served, so a client can label the result.

Admins can read every tier through `/api/tips/vip` and `/api/tips/maxbet`. The public `/api/tips` list intentionally exposes only public (Free) products.

## Mutation and authorization rules
- The public `/api/tips` router is read-only. Tip mutations are available only under `/api/admin/tips` and require an active admin JWT; AdminService independently verifies the actor before each mutation. The routine source-of-truth workflow is CLI dump → review → sync.
- Every `/api/admin` route is protected by JWT authentication and the active-admin guard. AdminService mutation methods also require an actor id and independently verify the actor is an active `ADMIN`, so direct service calls cannot bypass the route guard.
- The JWT strategy reloads the current user and rejects missing or non-active accounts. The admin guard separately requires `role === ADMIN` and an active status.
- Public and protected read visibility continues to be enforced by publication and product entitlements. Paid tips require a current user entitlement (admins may inspect them).
- Tip/source-of-truth operating workflow: edit/scrape/settle CLI dump files, review output, then sync into Docker PostgreSQL. The frontend admin page also includes protected tip curation controls; access-token and product controls remain active-admin-only.
- Token revoke preserves history. `DELETE /api/admin/subscription-tokens/:id` permanently removes a token and is deliberately distinct from revoke.

## Backend logic tests
Run the backend service-logic checks in Docker with `docker compose run --rm --no-deps app npm run --prefix backend test`. These tests exercise service validation and decisions with mocked Prisma persistence; they do not require PostgreSQL and do not test Prisma itself. They cover active-admin authorization, tip mutation and settlement invariants, token ownership/hash behavior, revocation versus permanent deletion, and invalid/missing inputs. They are an MVP logic baseline, not full HTTP/database integration coverage.

## Docker Database Setup

The Compose database is the supported local database. From the repository root, create both application env files and start the stack:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
docker compose up -d db
```

The database is available on the host at `localhost:5432` for optional local CLI sync. The API container connects to `db:5432`. Initialize the schema and verify the seed data inside Docker:

```powershell
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose run --rm app npm run sync
docker compose up -d app
```

### Environment Variables

`backend/.env` is gitignored. `.env.example` contains local Docker database defaults; replace the JWT secret and admin credentials before use. The backend container overrides the database hostname to `db`, while host-run CLI sync uses `localhost`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL URL (`localhost:5432` for host-run sync; Compose uses `db:5432` for the API) |
| `JWT_SECRET` | Signing key for issued JWTs; use a strong random value in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | API port (`3000` in the container and on the host) |
| `CORS_ORIGIN` | Comma-separated list of allowed browser origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials the seed promotes or creates as an admin |

### Seeding

Before running `seed`, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`. Register that email through `/api/auth/register` first if you want the normal signup flow; `seed` then promotes the existing account **without changing its password**. If no account exists for that email, `seed` creates an active admin using `ADMIN_PASSWORD`. Passwords are stored as bcrypt hashes.

The seed imports tips from `cli/settlement/previous-day-results/`, ensures the default Free, VIP, and MaxBet products exist, and creates published product assignments: non-featured football goes to Free, featured tips go to MaxBet, and other sports go to VIP. Only the Free product is public; premium lists remain access-controlled.

Tip ids are derived from the dump filename and the tip's position within it, so re-running the seed updates the same rows instead of duplicating them, and a tip that appears in several daily dumps stays one row per day. When refreshing an already-settled tip, the seed preserves its saved outcome, result, status, and settlement timestamp. A dump that carries a real settlement result (`win`/`lose`) is recorded as that result rather than being rewritten to `WON`.

> Prefer `docker compose run --rm app npm run sync` over calling the seed directly: it validates the dumps first and checks the database credentials before writing.

> The repository currently contains **12 dated dumps with 356 tip records**. Run `seed:check` first to validate dump data without writing to PostgreSQL.

## Syncing the Database

The CLI ships a single sync script that pushes the local dumps into any PostgreSQL database. It works the same for local development and production; only the env file differs.

```powershell
docker compose run --rm app npm run sync  # local Compose database
docker compose run --rm app npm run sync:prod  # production database (.env.production)
docker compose run --rm app npm run sync:dry   # validate without writing
```

The Docker command is the standard path and does not need host-installed backend dependencies. The script refuses to run when the env file is missing or when `DATABASE_URL` is absent. For production, copy `.env.production.example` to `.env.production` (gitignored) and set the real connection string. The password is masked in all output.

Sync is idempotent: it upserts tips, creates only missing publications, and never duplicates or deletes settled history.

## Running the Backend API

The API runs with the frontend in the Docker app service:

```bash
docker compose up -d app
docker compose logs -f app
```

The health endpoint is `GET /`, returning `{"status":200,"message":"The Expertise Wins API is ready for development."}`.

## Regenerating the Prisma Client

`schema.prisma` defines models that the generated client must match. **After any schema change, regenerate the client:**

```powershell
docker compose run --rm app npm run --prefix backend prisma:generate
```

A stale client silently omits newly added models. Code that references a model missing from the generated client throws at runtime (for example `Cannot read properties of undefined (reading 'create')`), which surfaces as 500 errors on every affected route. The usage tracker in `backend/app.js` is written to tolerate this so analytics can never take down the process.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Every API route returns 500 | Check that `backend/.env` exists, then inspect `docker compose logs app` for the startup error. |
| `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` | The backend env file is missing or Compose was started before it was created. Run `docker compose config --quiet` and recreate the app service. |
| `Authentication failed against database server` | Wrong username/password/database in `DATABASE_URL`. Confirm the credentials match your running PostgreSQL instance. |
| `Cannot read properties of undefined (reading 'create')` | The Prisma client is stale or missing a model. Run `npm run --prefix backend prisma:generate`. |
| API works but the frontend shows no data | `NEXT_PUBLIC_API_URL` in `frontend/.env` should be `http://localhost:3000/api`; recreate the frontend with `docker compose up -d app` after changing it. |
| Frontend requests blocked by CORS | Ensure `http://localhost:3001` appears in `CORS_ORIGIN` in `backend/.env`. |
| Tips or archive pages are empty | Those routes fall back to the latest day with data. If they are still empty, run `npm run expertise`, then `docker compose run --rm app npm run sync`. Check the `day` field in the response to see which day was served. |
| Win rate and ROI show `0` | Run `npm run settlement` to record results, then `docker compose run --rm app npm run sync` to publish them. |
