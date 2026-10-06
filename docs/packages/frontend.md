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
  - VIP Access Tokens (`/admin/tokens`) with single and bulk code generation, each issued to a registered user
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

## 🚀 Running the Frontend (Docker)

```powershell
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose up -d app
```

The Next.js frontend runs in the Docker app service at `http://localhost:3001`; the API is at `http://localhost:3000`.

### Environment Variables

`frontend/.env` is gitignored. The API layer reads the base URL once, at startup, from `NEXT_PUBLIC_API_URL`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, **including** the `/api` suffix (e.g. `http://localhost:3000/api`) |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL, used for share/canonical metadata |
| `NEXT_PUBLIC_APP_NAME` | Display name used in metadata |

> **This is the most common cause of "the pages load but show no data."** The value must be `http://localhost:3000/api`. Because the variable is read at build time, recreate the app service after changing it with `docker compose up -d app`.

Because `process.env.NEXT_PUBLIC_*` is inlined at build time, these values are only correct for a local/dev frontend. For production, build the image with the correct public API URL.

To view logs or rebuild the Docker image:

```powershell
docker compose logs -f app
docker compose up -d --build app
```

The frontend and backend share the Docker app service; configure both env files and initialize PostgreSQL before using API-backed pages.

## Current Readiness (6 October 2026)

The Docker frontend home route returns HTTP 200, and the API stats summary used by the frontend returns HTTP 200. This is a startup check, not a current browser acceptance of login, account, or admin journeys. The previous manual browser review was run on 4 October with a smaller data set. There is no automated UI-to-API integration suite; real-user and admin workflow acceptance remains open.

### Known Data Behavior

- `/tips` and `/archive` return today when today's scrape has run. Before that they fall back to the most recent day that has records, so the pages are never blank; the tips page labels when it is showing an earlier day.
- Settlement results reach PostgreSQL after local `npm run settlement` and `docker compose run --rm app npm run sync`; current dump and database outcomes still need reconciliation.
- Admins see every tier on `/tips` (Free, VIP, MaxBet). The public tips list exposes only public (Free) products, which is intentional.
- Settlement defaults: an unmarked **free-channel** pick settles as a win and an unmarked **paid-group** pick settles as a loss; explicit markers always override the default.

### Access tokens

The admin token form always requires selecting a registered user, for both single and bulk creation. A token can only be redeemed by that account while signed in, and it cannot be reassigned afterwards. Admins can revoke a token (kept for audit) or permanently delete it through the admin API.

### Security Notes

The admin UI's role checks are client-side presentation only; the API independently enforces an active `ADMIN` account for protected routes and admin tip mutations. Admin curation controls use `/api/admin/*`; the routine source-of-truth workflow remains CLI scrape/settlement followed by `docker compose run --rm app npm run sync`. Backend service-logic tests use mocked persistence; end-to-end and database-backed acceptance remains operator testing.

### SEO Notes

The sitemap and robots files default to `https://expertise-wins.com`, while the root layout's metadata base is `https://theexpertisewins.com`. Setting `NEXT_PUBLIC_SITE_URL` changes sitemap/robots but does not change the hard-coded metadata base. **Align these before deployment.** The current sitemap includes a selected set of public routes and blog posts, not every public page.
