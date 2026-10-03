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
  - VIP Access Tokens (`/admin/tokens`) with single and bulk code generation
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

Install and run the frontend from the repository root. For host development, `frontend/.env.example` points to the default host API at port 3000; `frontend/.env.local` can override these values.

```powershell
npm install --prefix frontend
if (-not (Test-Path frontend/.env.local)) { Copy-Item frontend/.env.example frontend/.env.local }
npm run --prefix frontend dev
```

The local Next.js server is at `http://localhost:3001`. With Docker Compose, use `docker compose up -d app`; Compose maps the frontend to `http://localhost:3181` and the API to `http://localhost:3180`. See the root [README](../README.md) and [runbook](../Run.md) for database initialization and the full stack workflow.

Available checks and production commands:

```powershell
npm run --prefix frontend lint
npm run --prefix frontend build
npm run --prefix frontend start
```

`start` requires a successful production build first. The root `npm run dev` starts the backend and frontend together; configure and migrate PostgreSQL before using API-backed pages.

## Current Readiness

As of 2026-10-03, `next build` completes and `next lint` passes with one `<img>` optimization warning in `src/app/profile/page.jsx`. The local Compose page returns HTTP 200. These checks confirm compilation and serving, not end-to-end API behavior; the API must be available for authentication, tips, stats, products, tokens, and admin workflows.

The admin UI's role checks are client-side only. Admin API routes also enforce the `ADMIN` role server-side; tip mutation endpoints still need role/ownership authorization. See the backend readiness notes.

The archive defaults to today's recorded scrape date because many records store kickoff as a time only. Choosing a day and tier shows only that day's records in the corresponding MaxBet, VIP, or Free channel-card format modeled on the CLI pretty print. The archive shows recorded database outcomes; source dumps do not provide independent final-score verification. Guests see public Free tips, members see products they can access, and admins can review all tiers. Source names and URLs are not rendered in public pages or returned by public tip endpoints.

The sitemap and robots files default to `https://expertise-wins.com`, while the root layout's metadata base is `https://theexpertisewins.com`. Setting `NEXT_PUBLIC_SITE_URL` changes sitemap/robots but does not change the hard-coded metadata base. Align these before deployment. The current sitemap includes a selected set of public routes and blog posts, not every public page.
