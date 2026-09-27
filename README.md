# The Expertise Wins — Monorepo Architecture

> 📣 **Live Channel:** [The Expertise Wins — Telegram](https://t.me/+D_jIXFB807E0NmRk)

**The Expertise Wins** is a complete data pipeline, Express REST backend, and Next.js web application designed for sports prediction collection, market normalization, transparent ROI tracking, and VIP channel access management.

---

## 🏗 Project Architecture & Modules

The repository is organized into three decoupled, complementary applications:

```text
The-Expertise-Wins-API/
├── cli/              # Scraping, market normalization & daily settlement engine
├── backend/          # Express REST API, Prisma ORM database & JWT authentication
├── frontend/         # Next.js 14 Web UI & Isolated Admin Dashboard (JavaScript/JSX)
├── package.json      # Monorepo configuration with dual start & dev commands
└── README.md         # Main project documentation
```

### 1. ⚙️ CLI Engine (`/cli`) — [*Read CLI Documentation*](./cli/README.md)
- **Scrapers**: Automated Puppeteer/Cheerio scrapers collecting raw tipster predictions.
- **Normalizers**: Converts market strings into uniform types (`1X2`, `OVER_UNDER_2_5`, `BOTH_TEAMS_TO_SCORE`).
- **Settlement Engine**: Evaluates tips against actual match results and outputs channel-ready markdown summaries.

### 2. 🔌 Backend API (`/backend`) — [*Read Backend Documentation*](./backend/README.md)
- **Express REST API**: Serves JSON endpoints for tips, statistics, products, subscriptions, and administration.
- **Prisma ORM**: Relational schema storing users, tips, tip publications, subscription tokens, and analytics records.
- **Security**: Passport.js & JWT stateless authentication with role-based authorization (`USER`, `TIPSTER`, `EDITOR`, `ADMIN`).

### 3. 🌐 Frontend Application (`/frontend`) — [*Read Frontend Documentation*](./frontend/README.md)
- **Next.js 14 App Router**: SEO-optimized web application built in JavaScript / JSX.
- **Dedicated Request API Layer (`src/api`)**: Dedicated modules mapping all backend API routes exhaustively (`auth`, `tips`, `stats`, `products`, `subscriptions`, `admin`).
- **Authentication State (`src/lib/auth.js`)**: JWT token management and role helpers.
- **Public Application**: Home overview, Tips Hub, Tip details, Stats & Analytics, Products & Token redemption, User Profile.
- **Isolated Admin Dashboard Module (`/admin`)**: Dedicated administration area accessible only to authorized roles for tip curation, bulk settlement, token generation, and user management.

---

## ⚡ Quick Start & Dual Commands

You can start both the Express Backend API and the Next.js Frontend App concurrently using a single command:

```bash
# Start both Backend (Port 3000) and Frontend (Port 3001) concurrently
npm run dev
```

### Starting Applications Independently

```bash
# Start Express Backend API independently
npm run dev:backend

# Start Next.js Frontend UI independently
npm run dev:frontend

# Execute CLI tip collection & normalization
npm run expertise

# Execute CLI tip settlement orchestrator
npm run settlement
```

---

## 📊 Endpoints & Feature Mapping

| Application Module | Responsibilities & Coverage |
| :--- | :--- |
| **Authentication** | Sign up, sign in, logout, user profile, password change, avatar upload |
| **Tips Hub** | Public free tips, VIP channel tips, MaxBet tips, individual tip detail views |
| **Analytics & ROI** | Overall win rate, ROI percentages, sport/market breakdowns, time-period filtering |
| **Subscriptions** | Access token redemption, token verification, active membership checks |
| **Admin Module** | User role editing, bulk tip publishing/settling, single/bulk access token generation |

---

## 📜 Sub-Application Documentation Links

- 📖 [CLI Application Documentation](./cli/README.md)
- 📖 [Backend API Documentation](./backend/README.md)
- 📖 [Frontend App Documentation](./frontend/README.md)

---

## 🛡 License

MIT License.