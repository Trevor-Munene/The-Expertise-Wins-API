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
- **Authentication & Token State (`src/lib/auth.js`)**: Stores JWTs in `localStorage` and `js-cookie`, dispatches same-tab auth changes, and provides client-side role helpers. Admin entry refreshes the current user from the API so a newly promoted active admin does not rely on a stale cached role; the API still enforces authorization.
- **Axios HTTP Client (`src/lib/axios.js`)**: Configured Axios instance automatically attaching Bearer JWT tokens and handling 401 unauthenticated redirects.
- **Isolated Admin Dashboard Module (`/admin`)**:
  - Client-side role checks for navigation; the backend must enforce authorization independently
  - Admin Overview (`/admin`)
  - User Accounts & Roles (`/admin/users`)
  - Tips & Curation Engine (`/admin/tips`) with bulk publish/settle options
  - VIP Access Tokens (`/admin/tokens`) with single and bulk code generation, each issued to a registered user
  - Products & Tiers (`/admin/products`)
- **Public & User Account Pages**:
  - Home (`/`) — Hero, analytics counters, today's free tips ticker, product highlights, and scraper sport coverage
  - Tips Hub (`/tips`) — Current Nairobi-day predictions with Free, VIP, and MaxBet tabs; signed-in users landing on the page go to VIP when entitled, otherwise MaxBet when entitled, otherwise Free. Search and sport filters are available.
  - Tip Archive (`/archive`) — Historical selections with filters for day, tier, sport, outcome, or search
  - Tip Detail (`/tips/[id]`) — Match preview, market, odds, status, and recorded outcome
  - Stats & Analytics (`/stats`) — Win rate, ROI, sport/market performance charts
  - Products & Membership (`/products`) — Tier breakdown and token redemption modal
  - User Profile (`/profile`) — Avatar upload, password security, redeemed-token/access history, and membership actions

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
| `NEXT_PUBLIC_SITE_URL` | Public canonical domain used by page metadata, social cards, sitemap, and robots (example: `https://theexpertisewins.com`) |

> **This is the most common cause of "the pages load but show no data."** The value must be `http://localhost:3000/api`. Because the variable is read at build time, recreate the app service after changing it with `docker compose up -d app`.

Because `process.env.NEXT_PUBLIC_*` is inlined at build time, these values are only correct for a local/dev frontend. For production, build the image with the correct public API URL.

To view logs or rebuild the Docker image:

```powershell
docker compose logs -f app
docker compose up -d --build app
```

The frontend and backend share the Docker app service; configure both env files and initialize PostgreSQL before using API-backed pages.

## Current Readiness (8 October 2026)

The running local Docker services returned HTTP 200 for the API root and frontend home, tips, archive, stats, sitemap, and robots routes on 8 October. Frontend lint passed with one existing profile-page `img` optimization warning. The backend service tests passed. A production Next.js build was not run during this review. These checks do not constitute end-to-end acceptance of login, redemption, avatar upload, all admin actions, settlement against the live database, or production deployment; real-user workflow acceptance remains open.

### Known Data Behavior

- `/tips` is scoped to the current Nairobi day across all tiers; older selections belong in `/archive`. The admin tips list defaults to today and can be switched between today and yesterday for review and settlement.
- Settlement results reach PostgreSQL after local `npm run settlement` and `docker compose run --rm app npm run sync`; current dump and database outcomes still need reconciliation.
- Premium feeds require the matching product entitlement. A signed-in user who lacks that tier sees an access-options prompt without a sign-in prompt. A plain `/tips` visit selects VIP first when the account has both premium entitlements, otherwise MaxBet, otherwise Free. The public tips list exposes public (Free) tips.
- The product, tips, home, and about pages list scraper-supported sports. The free channel remains football-focused; availability of an individual premium sport or market can vary by day.
- The profile access history reads all tokens assigned to the account, including redeemed tokens. Avatar uploads are stored under the backend uploads directory and served from `/uploads`.
- Settlement defaults: an unmarked **free-channel** pick settles as a win and an unmarked **paid-group** pick settles as a loss; explicit markers always override the default.

### Access tokens

The admin token form always requires selecting a registered user, for both single and bulk creation. A token can only be redeemed by that account while signed in, and it cannot be reassigned afterwards. Admins can revoke a token (kept for audit) or permanently delete it through the admin API.

### Admin settlement

For one tip, choose **Settle**, select the overall result, and set an outcome for each selection in the card. **Apply overall result to all** is a shortcut; individual selection results can differ. Saving sends the overall result and every selection result together to the backend. Supported outcomes are Won, Half Won, Lost, Half Lost, Void, Push, and Cancelled.

### Security Notes

The admin UI's role checks are client-side presentation only; the API independently enforces an active `ADMIN` account for protected routes and admin tip mutations. Admin curation controls use `/api/admin/*`; the routine source-of-truth workflow remains CLI scrape/settlement followed by `docker compose run --rm app npm run sync`. Backend service-logic tests use mocked persistence; end-to-end and database-backed acceptance remains operator testing.

### SEO Notes

Page canonical metadata, Open Graph/Twitter URLs, JSON-LD, sitemap, and robots share `NEXT_PUBLIC_SITE_URL` (fallback `https://theexpertisewins.com`). The sitemap lists public product, tips, archive, stats, informational, and blog pages; it excludes login, registration, account, admin, and individual tip-detail pages. Set the production domain before building the frontend. Login, registration, profile, admin, and tip detail are marked noindex; robots also excludes admin, profile, and API paths.
