# The Expertise Wins — Next.js Frontend Application

The `frontend` directory contains the Next.js 14 Web Application (App Router, JavaScript/JSX) for **The Expertise Wins**.

## 📌 Features & Modules

- **SEO & Server-Side Structure**: Built with Next.js 14 App Router, semantic metadata, and dynamic routing for optimal search engine visibility.
- **Dedicated Request API Layer (`src/api`)**: Dedicated modules defining API client calls for every backend endpoint:
  - `auth.api.js` — Register, Login, Logout, Profile, Password Update, Avatar Upload
  - `tips.api.js` — Free, VIP, MaxBet, Single Tip Detail, Tip Creation & Result Updates
  - `stats.api.js` — Overview, Time-based Stats, Win Rate, ROI, Sport & Market Analytics
  - `products.api.js` — Free & Premium VIP Tier Offerings
  - `subscriptions.api.js` — Active Subscriptions, Token Redemption, Access Verification
  - `admin.api.js` — Full Admin Operations (Users, Tips, Bulk Settle/Publish, Tokens, Products)
- **Authentication & Token State (`src/lib/auth.js`)**: Manages JWT tokens in `localStorage` and `js-cookie`, exposes role helper functions (`isAdmin`, `isSuperAdmin`).
- **Axios HTTP Client (`src/lib/axios.js`)**: Configured Axios instance automatically attaching Bearer JWT tokens and handling 401 unauthenticated redirects.
- **Isolated Admin Dashboard Module (`/admin`)**:
  - Secure route isolation with client-side role guards
  - Admin Overview (`/admin`)
  - User Accounts & Roles (`/admin/users`)
  - Tips & Curation Engine (`/admin/tips`) with bulk publish/settle options
  - VIP Access Tokens (`/admin/tokens`) with single and bulk code generation
  - Products & Tiers (`/admin/products`)
- **Public & User Account Pages**:
  - Home (`/`) — Hero, analytics counters, today's free tips ticker, product highlights
  - Tips Hub (`/tips`) — Tabbed predictions (Free, VIP, MaxBet) with search & sport filters
  - Tip Detail (`/tips/[id]`) — Match info, market, odds, status, and outcome
  - Stats & Analytics (`/stats`) — Win rate, ROI, sport/market performance charts
  - Products & Membership (`/products`) — Tier breakdown and token redemption modal
  - User Profile (`/profile`) — Avatar upload, password security, active subscriptions history

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript / JSX (No TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## 🚀 Running the Frontend

From the root directory:

```bash
# Start frontend dev server on port 3001
npm run dev:frontend

# Build frontend for production
npm run --prefix frontend build
```

From inside `frontend`:

```bash
npm run dev
npm run build
npm run start
```
