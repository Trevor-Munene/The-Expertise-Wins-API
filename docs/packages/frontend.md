# The Expertise Wins — Next.js Frontend Application

The `frontend` directory contains the Next.js 14 Web Application (App Router, JavaScript/JSX) for **The Expertise Wins**.

## 📌 Features & Modules

- **SEO & Server-Side Structure**: Built with Next.js 14 App Router, semantic metadata, and dynamic routing for optimal search engine visibility.
- **Request API Layer (`src/api`)**: Modules for the backend workflows used by the frontend:
  - `auth.api.js` — Register, Login, Logout, Profile, Password Update, Avatar Upload
  - `tips.api.js` — Free, VIP, MaxBet, historical archive, tip detail, tip creation & result updates
  - `stats.api.js` — Overview, Time-based Stats, Win Rate, ROI, Sport & Market Analytics
  - `products.api.js` — Free & Premium VIP Tier Offerings
  - `subscriptions.api.js` — Active Subscriptions, Token Redemption, Access Verification
  - `admin.api.js` — Full Admin Operations (Users, Tips, Bulk Settle/Publish, Tokens, Products)
- **Authentication & Token State (`src/lib/auth.js`)**: Stores JWTs in `localStorage` and `js-cookie`, with client-side role helper functions. These checks are UI behavior, not server-side authorization.
- **Axios HTTP Client (`src/lib/axios.js`)**: Configured Axios instance automatically attaching Bearer JWT tokens and handling 401 unauthenticated redirects.
- **Isolated Admin Dashboard Module (`/admin`)**:
  - Client-side role checks for navigation; the backend must enforce authorization independently
  - Admin Overview (`/admin`)
  - User Accounts & Roles (`/admin/users`)
  - Tips & Curation Engine (`/admin/tips`) with bulk publish/settle options
  - VIP Access Tokens (`/admin/tokens`) with single and bulk code generation, each issued to a registered user, each issued to a registered user
  - Products & Tiers (`/admin/products`)
- **Public & User Account Pages**:
  - Home (`/`) — Hero, analytics counters, today's free tips ticker, product highlights
  - Tips Hub (`/tips`) — Tabbed predictions (Free, VIP, MaxBet) with search & sport filters
  - Tip Archive (`/archive`) — Defaults to today's recorded day; filter by day, tier, sport, outcome, or search
  - Tip Detail (`/tips/[id]`) — Match preview, market, odds, status, and recorded outcome
  - Stats & Analytics (`/stats`) — Win rate, ROI, sport/market performance charts
  - Products & Membership (`/products`) — Tier breakdown and token redemption modal
  - User Profile (`/profile`) — Avatar upload, password security, and access-token/subscription history

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript / JSX (No TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## 🚀 Running the Frontend

```powershell
npm install --prefix frontend
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
npm run --prefix frontend dev
```

The local Next.js server is at `http://localhost:3001`. With Docker Compose, use `docker compose up -d app`; Compose maps the frontend to `http://localhost:3181` and the API to `http://localhost:3180`.

### Environment Variables

`frontend/.env` is gitignored. The API layer reads the base URL once, at startup, from `NEXT_PUBLIC_API_URL`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, **including** the `/api` suffix (e.g. `http://localhost:3000/api`) |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL, used for share/canonical metadata |
| `NEXT_PUBLIC_APP_NAME` | Display name used in metadata |

> **This is the most common cause of "the pages load but show no data."** The value must match the port the backend is actually listening on. The backend defaults to `3000` on the host and is mapped to `3180` under Compose. Because the variable is read at build time, **restart the dev server after changing it.**

Because `process.env.NEXT_PUBLIC_*` is inlined at build time, these values are only correct for a local/dev frontend. For production, build the image with the correct public API URL.

Available checks and production commands:

```powershell
npm run --prefix frontend lint
npm run --prefix frontend build
npm run --prefix frontend start
```

`start` requires a successful production build first. The root `npm run dev` starts the backend and frontend together; configure and migrate PostgreSQL before using API-backed pages.

## Current Readiness

Verified locally on **2026-10-04** with the API and database running:

- `next lint` passes with a single `<img>` optimization warning in `src/app/profile/page.jsx`.
- **Login works end-to-end**: submitting valid credentials stores the JWT and redirects to `/admin`.
- **Pages render live database data**, confirmed in a headless browser with zero console errors:
  - `/stats` — 288 tip volume, average odds 2.80, per-sport breakdowns (Football 92, Golf 5, Esports 46, and others) with no placeholder dashes.
  - `/admin` — totals for 288 tips, 1 user, 1 access token.
  - `/admin/tips` — 20 table rows with teams, selections, odds, and status.
  - `/archive`, `/products`, `/profile` — render without errors.
- These checks were run manually rather than through automated tests; there is no UI-to-API integration test suite.

### Known Data Behavior

- `/tips` and `/archive` return today when today's scrape has run. Before that they fall back to the most recent day that has records, so the pages are never blank; the tips page labels when it is showing an earlier day.
- Settlement results reach the database: after `npm run settlement` and `npm run sync`, win rate and ROI update from recorded results.
- Admins see every tier on `/tips` (Free, VIP, MaxBet). The public tips list exposes only public (Free) products, which is intentional.
- Settlement defaults: an unmarked **free-channel** pick settles as a win and an unmarked **paid-group** pick settles as a loss; explicit markers always override the default.

### Access tokens

The admin token form always requires selecting a registered user, for both single and bulk creation. A token can only be redeemed by that account while signed in, and it cannot be reassigned afterwards. Admins can revoke a token (kept for audit) or permanently delete it through the admin API.

### Security Notes

The admin UI's role checks are client-side presentation only; the API independently enforces an active `ADMIN` account for protected routes and admin tip mutations. Admin curation controls use `/api/admin/*`; the routine source-of-truth workflow remains CLI scrape/settlement followed by `npm run sync`. Backend service-logic tests use mocked persistence; end-to-end and database-backed acceptance remains operator testing.

### SEO Notes

The sitemap and robots files default to `https://expertise-wins.com`, while the root layout's metadata base is `https://theexpertisewins.com`. Setting `NEXT_PUBLIC_SITE_URL` changes sitemap/robots but does not change the hard-coded metadata base. **Align these before deployment.** The current sitemap includes a selected set of public routes and blog posts, not every public page.