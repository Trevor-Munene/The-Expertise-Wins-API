# 🚀 The Expertise Wins API — Development Roadmap

This roadmap reflects the **current state and architectural milestones** of **The Expertise Wins**.

> **Make the workflow work → build the API & database → scaffold the Next.js frontend → brand & optimize for SEO → scale.**

---

## 📌 Overall Project Status (September 2026)

The project has evolved from a CLI-only pipeline into a **full-stack monorepo web platform**:

```text
The-Expertise-Wins-API/
├── cli/              # Scraping, market normalization & daily settlement engine
├── backend/          # Express REST API, Prisma ORM database & JWT authentication
├── frontend/         # Next.js 14 Web UI, Markdown Blog & Isolated Admin Dashboard
└── package.json      # Dual start commands for concurrent backend & frontend development
```

---

# Phase 0 — Validate the Operating Model

**Goal:** Prove that the software automates a workflow that is useful manually.

* [x] Identify trusted free-tip sources already used in the workflow
* [x] Define the free vs paid distribution model
* [x] Establish The Expertise Wins as the primary product/channel
* [x] Decide that Telegram is the primary distribution channel
* [x] Define a normalized tip contract (26 fields)
* [x] Establish a CLI-first operating loop (produce → paste → settle)
* [x] Establish a consistent daily publishing routine
* [x] Begin collecting a transparent historical record

---

# Phase 1 — Working Scrapers & Pipeline

**Goal:** Reliably collect tips from external tipster sources.

* [x] Build FreeTips / MaxBet scraper
* [x] Extract matches/events, selections, odds, timestamps, and source URLs
* [x] Handle source-specific failures (incl. Cloudflare / browser fetch)
* [x] Narrow the pipeline to reliable active sources

---

# Phase 2 — Normalization & Contracts

**Goal:** Give every source a predictable internal representation.

* [x] Create the source normalizer (`freetips.normalizer.js`)
* [x] Normalize sport, competition, teams, market/selection fields, and odds
* [x] Define the 26-field normalized tip contract
* [x] Add contract tests (`tips.contract.test.js`)

---

# Phase 3 — Daily Snapshots & Orchestration

**Goal:** Make daily tip collection repeatable and exportable.

* [x] Build CLI orchestrator (`cli/orchestrator/run-freetips.js`)
* [x] Run scraper + normalization as a repeatable workflow
* [x] Export JSON snapshots into `settlement/previous-day-results/`
* [x] Fallback to newest dated JSON dumps automatically

---

# Phase 4 — Consumption & Formatting

**Goal:** Turn normalized data into channel-ready cards and service structures.

* [x] Create consumption boundary
* [x] Format Maxbet VIP cards
* [x] Format Better VIP (PikkBetter) cards
* [x] Format Free Tips cards
* [x] Support featured "Bet of the Day" and "Tennis Bet of the Day"
* [x] Print channel-ready output via CLI (`services/app.js`)

---

# Phase 5 — Product Pricing & Tier Strategy

**Goal:** Structure transparent, multi-currency membership offerings.

* [x] **Public Free Channel**: 1-3 daily public tips, transparent stats.
* [x] **❇️ PIKK BETTER VIP GROUP ❇️**:
  * Premium Daily Betting Tips, Curated Selections with Reasons, Multiple Sports & Markets.
  * Pricing: 2,000 KSH (Monthly) | 1,200 KSH (2 Weeks) | 55 EUR | 60 USD | 40,000 NGN | 350 GHS | $500 Lifetime.
* [x] **🥇 PIKK MAXBET VIP GROUP 🥇**:
  * Highest-Tier & Best Selections, Strongest Curation with Reasons, Premium Maxbet Opportunities.
  * Pricing: 3,500 KSH (Monthly) | 2,000 KSH (2 Weeks) | 100 EUR | 120 USD | 70,000 NGN | 600 GHS | $1,000 Lifetime.
* [x] **Direct Operator Telegram DM Addition**: Direct integration with `@PIKKBETTER` (`https://t.me/pikkbetter`).

---

# Phase 5.5 — Settlement & Result Evaluation

**Goal:** Evaluate match results and record accurate win/loss outcomes.

* [x] Build settlement evaluator (`cli/settlement/settlement.js`)
* [x] Match tips by fixture and selection (incl. `WON`, `LOST`, `VOID`, `HALF_WON`, `HALF_LOST`)
* [x] Require explicit markers for featured / VIP tips
* [x] Write annotated results back to disk
* [x] Print settled reports via CLI (`cli/settlement/app.js`)

---

# Phase 6 — Results & Performance Analytics

**Goal:** Calculate system ROI, win rates, and market performance metrics.

* [x] Calculate overall win rates and estimated ROI
* [x] Calculate average odds and stake performance
* [x] Track performance by sport (Football, Basketball, Tennis)
* [x] Track performance by market type (`1X2`, `OVER_UNDER`, `BTTS`)
* [x] Compute time-based analytics (Today, 7 Days, 14 Days, Month, Year, All-Time)

---

# Phase 7 — Persistent Database (Prisma ORM)

**Goal:** Store users, tips, subscriptions, access tokens, and publications in a relational database.

* [x] Configure Prisma ORM database models (`User`, `Tip`, `Product`, `Subscription`, `AccessToken`, `TipPublication`)
* [x] Define user roles (`USER`, `TIPSTER`, `EDITOR`, `ADMIN`) and account status (`ACTIVE`, `SUSPENDED`)
* [x] Model single and bulk access token redemption codes
* [x] Enable static avatar file uploads (`/public/profiles`)

---

# Phase 8 — Express REST API Backend

**Goal:** Expose secure HTTP endpoints powering the web interface and external clients.

* [x] Build Express API server (`backend/app.js`)
* [x] Stateless Passport.js & JWT authentication middleware
* [x] Role-based access control guards
* [x] `/api/auth`: Register, Login, Logout, Profile, Password Update, Avatar Upload
* [x] `/api/tips`: Free, VIP, MaxBet, single detail views, CRUD curation
* [x] `/api/stats`: Overview, time-based analytics, ROI, sport/market breakdowns
* [x] `/api/products`: Available product tier details
* [x] `/api/subscriptions`: Active access check, token redemption, subscription history
* [x] `/api/admin`: User roles, bulk publish/settle, single/bulk access token generation

---

# Phase 9 — Next.js 14 Frontend Application & SEO

**Goal:** Provide an SEO-optimized, responsive web application and isolated Admin module.

* [x] **Next.js 14 App Router in Pure JavaScript / JSX**: Built without TypeScript complexity.
* [x] **Photo-Inspired Cyan Theme**: Electric Cyan (`#00f0ff`), Sapphire Blue, and Midnight Dark backdrop featuring the brand badge avatar silhouette.
* [x] **Full SEO Optimization**:
  * Dynamic XML sitemap (`/sitemap.xml`) indexing all pages and blog posts.
  * Dynamic `robots.txt` (`/robots.txt`).
  * Structured JSON-LD schema markup (`WebSite`, `BlogPosting`).
  * OpenGraph and Twitter card metadata tags.
* [x] **Markdown Blog Engine (`content/blog/`)**:
  * Drop any `.md` file into `frontend/content/blog/`.
  * Parsed automatically via `gray-matter` & `marked`.
  * Blog index (`/blog`) & article reader (`/blog/[slug]`).
* [x] **Isolated Admin Dashboard Module (`/admin`)**:
  * Dedicated route hierarchy with client-side role guards (`/admin`, `/admin/users`, `/admin/tips`, `/admin/tokens`, `/admin/products`).
* [x] **Responsive Across Devices**: Mobile drawer menu, tablet layouts, and desktop support.
* [x] **Dual Start Commands**: `npm run dev` launches backend (port 3000) and frontend (port 3001) concurrently.

---

# Phase 10 — Next Steps & Future Capabilities

**Goal:** Automate scheduled execution and expand distribution channels.

* [ ] Schedule automated daily scraping cron jobs
* [ ] Build direct Telegram Bot publisher client for automated channel posting
* [ ] Add automated result confirmation via live sports score APIs
* [ ] Expand external API key management for third-party B2B consumers

---

# 🧭 Current Roadmap Summary

| Phase | Milestone | Status |
| :--- | :--- | :--- |
| **Phase 0** | Workflow & Contract Validation | ✅ Completed |
| **Phase 1** | Scraping Engine | ✅ Completed |
| **Phase 2** | Normalization & Contracts | ✅ Completed |
| **Phase 3** | Daily Orchestration & Snapshots | ✅ Completed |
| **Phase 4** | Card Consumption & Formatting | ✅ Completed |
| **Phase 5** | Pricing & Multi-Currency Tiers | ✅ Completed |
| **Phase 5.5** | Settlement Engine | ✅ Completed |
| **Phase 6** | Performance Analytics & ROI Engine | ✅ Completed |
| **Phase 7** | Prisma ORM Database Models | ✅ Completed |
| **Phase 8** | Express REST API & JWT Auth | ✅ Completed |
| **Phase 9** | Next.js 14 Frontend, SEO & Markdown Blog | ✅ Completed |
| **Phase 10** | Telegram Bot Automation & Cron Scheduling | ⏳ Next Up |