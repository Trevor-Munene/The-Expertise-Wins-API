# The Expertise Wins — Express Backend API

The `backend` directory contains the Express API, Prisma schema, and historical-tip importer for **The Expertise Wins**. The API starts and responds in the local Compose environment; it is not ready for public deployment until the authorization gaps below are fixed.

## 📌 Features & Responsibilities

- **Authentication**: Passport Local and JWT authentication are implemented in source. Admin endpoints enforce the `ADMIN` role.
- **Tips & Curation Engine**: Includes free and token-gated VIP/MaxBet endpoints, an entitlement-aware historical archive, tip details, and management. Tip mutations still need server-side role/ownership checks.
- **Performance & Analytics Engine**: Calculates real-time win rates, estimated ROI, average odds, sport breakdowns, market performance, time-based reports, and admin-only application usage summaries for the last 30 days.
- **Products & Access**: Manages products and access-token issuance/redemption. Access is represented by tokens; there is no separate `Subscription` database model.
- **Admin Management API**: Endpoints for tip publication/settlement, access tokens, user roles, and products. Routes require an authenticated admin account.
- **Source privacy**: Public tip responses strip source identifiers, source URLs, provider labels, and source-only metadata; source analytics endpoints are admin-only.
- **Media Uploads**: Avatar upload handling is present, but the upload path currently does not align with the configured static-file path.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma ORM with PostgreSQL
- **Authentication**: Passport.js & JWT (`jsonwebtoken`)
- **Validation**: Joi validation schemas

## 📡 API Route Architecture

- `/api/auth`: User registration, login, logout, me, password updates, avatar upload.
- `/api/tips`: Public free tips (`/free`), VIP tips (`/vip`), MaxBet tips (`/maxbet`), tier-aware historical archive (`/archive`), tip details, and management.
- `/api/stats`: Comprehensive analytics, win rates, ROI, sport/market breakdowns, and time period statistics.
- `/api/products`: Public and authenticated product tier information.
- `/api/subscriptions`: Active subscriptions, token redemption (`/redeem`), token verification, and subscription history.
- `/api/admin`: Isolated admin endpoints for user role management, bulk tip publication/settlement, single/bulk access token generation, and product management.

## Setup and Readiness

## Remaining Readiness Notes

Verified locally on 2026-10-03: the Compose PostgreSQL database is migrated and seeded with 271 tips from nine dated dumps. The API health route, paginated tip list, day/tier archive, admin login, and JWT-protected profile route responded successfully. This verifies a local development path, not production readiness.

Do not expose the API publicly yet. `/api/admin` and `/api/stats/usage` enforce the `ADMIN` role, public tip list and detail paths enforce publication visibility, and VIP/MaxBet routes apply paid product access. The archive is public and grouped into Free, VIP, and MaxBet records with current-day and sport filters. Tip create/update/result/delete operations still require only a JWT and do not enforce role or ownership. The backend package currently has no automated test script. Historical seed records are temporarily settled as WON for baseline progress reporting until verified settlement data is available.

## Local PostgreSQL Setup

For host-based development, copy the backend example environment file and set `DATABASE_URL` to your PostgreSQL connection string and `JWT_SECRET` to a strong random value. The example Docker database URL from the host is `postgresql://tew:tew_local_dev@localhost:55432/expertise_wins?schema=public`. Then install and initialize the backend:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
npm install --prefix backend
npm run --prefix backend prisma:generate
npm run --prefix backend prisma:migrate
npm run --prefix backend seed:check
npm run --prefix backend seed
```

Before running `seed`, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the ignored `backend/.env` file. The email is prefilled in `.env.example`; enter the password locally and never commit `.env`. Register that email through `/api/auth/register` first if you want to keep the normal signup flow; `seed` then promotes the existing account without changing its password. If no account exists for that email, `seed` creates an active admin using the password from the environment. Passwords are stored as bcrypt hashes.

The seed command imports tips from `cli/settlement/previous-day-results`; it does not modify the CLI files or dumps. It also ensures the default Free, VIP, and MaxBet products exist and creates missing published product assignments: non-featured football goes to Free, featured tips go to MaxBet, and other sports go to VIP. Only the Free product is public by default; premium lists remain access-controlled. When refreshing an already-settled tip, the seed preserves its saved outcome, result, status, and settlement timestamp. Run `seed:check` first to validate dump data without writing to PostgreSQL. The repository contains nine dated dumps (271 tips at this update); the seed is idempotent and can be rerun.

### Docker development

From the repository root, start PostgreSQL, then initialize the schema and seed the historical tips:

```powershell
docker compose up -d db
docker compose run --rm app npm run --prefix backend prisma:generate
docker compose run --rm app npm run --prefix backend prisma:migrate -- --name init
docker compose run --rm app npm run --prefix backend seed:check
docker compose run --rm app npm run --prefix backend seed
```

The first `docker compose run app` builds the shared development image, including frontend dependencies, so that first run can take a few minutes. Later runs reuse the image. Compose injects the database URL using the `db` service name; do not use `localhost` from inside a container. Set the admin credentials in `backend/.env` as described above; that file is bind-mounted into the container.

Start the API and frontend after database setup with `docker compose up -d app`. The API health endpoint is `http://localhost:3180/`; the frontend is at `http://localhost:3181`. The Compose database is exposed to host tools at `localhost:55432`. See [Run.md](../Run.md) for ports, testing, and volume cleanup behavior.

## Running the Backend API

From the repository root:

```bash
# Start backend in development mode with nodemon
npm run dev:backend

# Start backend in production mode
npm run start:backend
```

Alternatively, from inside `backend`:

```bash
npm run dev
npm run start
```
