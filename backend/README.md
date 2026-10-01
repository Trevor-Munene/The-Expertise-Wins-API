# The Expertise Wins — Express Backend API

The `backend` directory contains the Express API and Prisma schema for **The Expertise Wins**. The source is not currently launch-ready; see the readiness notes below.

## 📌 Features & Responsibilities

- **Authentication**: Passport Local and JWT authentication are implemented in source. Admin routes currently authenticate but do not enforce the `ADMIN` role.
- **Tips & Curation Engine**: Includes free and token-gated VIP/MaxBet endpoints, tip details, and management. Public list/detail visibility and write authorization still need stricter checks.
- **Performance & Analytics Engine**: Calculates real-time win rates, estimated ROI, average odds, sport breakdowns, market performance, and time-based reports (today, week, 14 days, month, year, all-time).
- **Products & Access**: Manages products and access-token issuance/redemption. Access is represented by tokens; there is no separate `Subscription` database model.
- **Admin Management API**: Endpoints for tip publication/settlement, access tokens, user roles, and products. Current routes authenticate requests but do not enforce the admin role.
- **Media Uploads**: Avatar upload handling is present, but the upload path currently does not align with the configured static-file path.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma ORM with PostgreSQL
- **Authentication**: Passport.js & JWT (`jsonwebtoken`)
- **Validation**: Joi validation schemas

## 📡 API Route Architecture

- `/api/auth`: User registration, login, logout, me, password updates, avatar upload.
- `/api/tips`: Public free tips (`/free`), VIP tips (`/vip`), MaxBet tips (`/maxbet`), tip details, and management.
- `/api/stats`: Comprehensive analytics, win rates, ROI, sport/market breakdowns, and time period statistics.
- `/api/products`: Public and authenticated product tier information.
- `/api/subscriptions`: Active subscriptions, token redemption (`/redeem`), token verification, and subscription history.
- `/api/admin`: Isolated admin endpoints for user role management, bulk tip publication/settlement, single/bulk access token generation, and product management.

## Setup and Readiness

## Current Blockers

The API currently fails to load because `middleware/authentication.js` contains duplicate top-level declarations. Admin routes do not enforce the `ADMIN` role, authenticated tip-management routes lack role/ownership checks, and the public tip list/detail queries do not consistently restrict records to published product access. Fix and verify these issues before exposing the API.

## Local PostgreSQL Setup

For host-based development, copy the backend example environment file and fill in a local PostgreSQL URL and a strong JWT secret, then install and initialize the backend:

```powershell
Copy-Item backend/.env.example backend/.env
npm install --prefix backend
npm run --prefix backend prisma:generate
npm run --prefix backend prisma:migrate
npm run --prefix backend seed:check
npm run --prefix backend seed
```

The seed command imports tips from `cli/settlement/previous-day-results`; it does not modify the CLI files or dumps. Run `seed:check` first to validate the dump data without writing to PostgreSQL.

### Docker development

The root Compose setup provides PostgreSQL as the `db` service and injects its connection URL into the app container. Do not use `localhost` as the database host from inside a container. After opening the workspace with **Dev Containers: Reopen in Container**, use the integrated terminal to initialize the database and seed the historical tips:

```bash
npm run --prefix backend prisma:migrate
npm run --prefix backend seed:check
npm run --prefix backend seed
```

The Dockerized frontend is available at `http://localhost:3181`; the API is intended for `http://localhost:3180` once the current authentication syntax error is fixed. See the root README for Compose ports and volume behavior.

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
