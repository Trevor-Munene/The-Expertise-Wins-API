# 🚀 The Expertise Wins API — Development Roadmap

This roadmap reflects the **current state and architectural milestones** of **The Expertise Wins**.

> **Make the workflow work → build the API & database → scaffold the Next.js frontend → brand & optimize for SEO → scale.**

---

## 📌 Overall Project Status (October 2026)

The repository contains three distinct applications: a local-file CLI workflow, an Express/Prisma API, and a Next.js frontend. The local Docker database is migrated and seeded; the API and frontend have both been started and checked in this workspace. This is a development baseline, not production approval.

**Verified locally on 2026-10-04:** PostgreSQL is healthy; Prisma reports the schema in sync; the database holds 288 tips imported from the CLI dated dumps; admin login issues a working JWT; all API routes across auth, tips, stats, products, subscriptions, and admin return HTTP 200 with live data; settlement results sync into the database and update win rate and ROI; and the frontend renders that live data on login, stats, tips, archive, profile, products, and all four admin pages with zero console errors. Frontend lint has one `<img>` optimization warning. The CLI remains a separate manual publish/settle workflow.

**Release blockers:** Tip mutations do not enforce server-side role/ownership checks, and frontend client-side role checks are not security controls. The backend has no automated test script, and end-to-end UI-to-API workflows are verified manually rather than by automated tests. Source identifiers and URLs are withheld from public tip responses; source analytics and admin operations require the admin role.

**Data state:** 13 tips are settled (8 won, 5 lost), giving a 61.54% win rate. Remaining tips are `PENDING` until their fixtures are settled through the CLI workflow and published with `npm run sync`.

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
* [x] Use explicitly dated JSON dumps for settlement; no automatic latest-dump fallback

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

**Goal:** Apply manually supplied result markers to a dated dump.

* [x] Build the settlement evaluator (`cli/settlement/settlement.js`)
* [x] Match fixture selections against pasted text using `✅✅` and `❎❎` markers
* [x] Leave featured tips without explicit markers unsettled; unmarked regular tips default to losses
* [x] Write annotated outcomes back to the exact dated dump
* [x] Print formatted reports through the local CLI consumer
* [ ] Integrate live scores or automatic result verification

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

**Goal:** Define relational storage for users, tips, products, access tokens, and publications.

* [x] Define Prisma models (`User`, `Tip`, `Product`, `AccessToken`, `TipPublication`); there is no separate `Subscription` model
* [x] Define user roles (`USER`, `TIPSTER`, `EDITOR`, `ADMIN`) and account statuses
* [x] Model single and bulk access token redemption codes
* [x] Add avatar upload handling
* [x] Configure and migrate the local Compose PostgreSQL database in the development workspace
* [x] Import the historical CLI dumps with the backend seed script (10 dumps / 288 tips at this update)
* [x] Accept the settlement layer's `win`/`lose`/`settled` values so settled results reach the database

---

# Phase 8 — Express REST API Backend

**Goal:** Expose HTTP endpoints powering the web interface and external clients.

* [x] Build Express API source (`backend/app.js`)
* [x] Repair duplicate declarations in authentication middleware so the server can load
* [x] Enforce `ADMIN` role authorization on admin routes
* [ ] Enforce role/ownership authorization on tip-management mutations
* [x] Restrict public tip list to active public product publications
* [x] Restrict public tip detail to published product access
* [x] Add a current-day-by-default tier-aware archive with a selected-day picker and sport/outcome/search filters
* [x] Remove source identifiers/URLs from public tip payloads; restrict source analytics to admins
* [x] Make usage-event tracking failure-safe so analytics can never crash a live request
* [x] `/api/auth`: Register, Login, Logout, Profile, Password Update, Avatar Upload
* [x] `/api/tips`: Free, VIP, MaxBet, tier-aware archive, detail previews, CRUD curation
* [x] `/api/stats`: Overview, time-based analytics, ROI, sport/market breakdowns
* [x] `/api/products`: Available product tier details
* [x] `/api/subscriptions`: Active access check, token redemption, subscription history
* [x] `/api/admin`: User roles, bulk publish/settle, single/bulk access token generation

---

# Phase 9 — Next.js 14 Frontend Application & SEO

**Goal:** Provide an SEO-optimized, responsive web application and isolated Admin module.

* [x] **Next.js 14 App Router in Pure JavaScript / JSX**: Built without TypeScript complexity.
* [x] Responsive branded UI with light/dark theme preference.
* [x] **SEO foundations**:
  * Dynamic XML sitemap (`/sitemap.xml`) for a configured subset of public routes and blog posts.
  * [ ] Align sitemap/robots URLs with the metadata canonical domain and include remaining public pages.
* [x] **Admin Dashboard UI (`/admin`)**:
  * Admin UI checks roles client-side; admin endpoints enforce roles server-side, while tip mutation ownership checks remain open.
* [x] Historical tip archive (`/archive`) with detail previews and recorded outcomes.
* [x] **Responsive Across Devices**: Mobile drawer menu, tablet layouts, and desktop support.
* [x] **Dual Start Commands**: `npm run dev` launches backend (port 3000) and frontend (port 3001) concurrently.
* [x] Verified end-to-end in a headless browser: login issues a JWT and reaches `/admin`; stats, tips, archive, profile, products, and admin pages all render live API data without console errors.

---

# Phase 10 — CLI ↔ Database Sync

**Goal:** Keep the web application in step with the CLI without manual re-seeding.

* [x] Build a single sync script (`cli/sync.js`) reused by both local and production targets
* [x] Validate dumps before writing, and refuse to run against a half-configured environment
* [x] Mask database credentials in command output
* [x] Wire `npm run sync`, `sync:prod`, `sync:dry`, and chained `expertise:sync` / `settlement:sync` commands
* [x] Keep sync idempotent: upsert tips, create only missing publications, never discard settled results
* [ ] Add scheduled or CI-triggered sync so the production database updates without a manual step

---

# Phase 11 — Next Steps & Future Capabilities

**Goal:** Automate scheduled execution and expand distribution channels.

* [ ] Enforce role/ownership authorization on tip-management mutations (release blocker)
* [ ] Add an automated backend test script and API integration tests
* [ ] Align sitemap/robots domains with the metadata canonical domain
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
| **Phase 6** | Performance Analytics & ROI Engine | ✅ Implemented and verified against live data; metrics move as settlement results are synced |
| **Phase 7** | Prisma ORM, Local PostgreSQL & Historical Seed | ✅ Complete in this development workspace; fresh setups must follow the database guide |
| **Phase 8** | Express REST API, Archive & JWT Auth | ⚠️ All routes verified returning live data, including auth; tip mutation authorization and automated backend tests remain |
| **Phase 9** | Next.js 14 Frontend, Archive, SEO & Blog | ⚠️ Lint passes with one warning and pages were verified rendering live data in a browser; sitemap/domain alignment and automated end-to-end tests remain |
| **Phase 10** | CLI ↔ Database Sync | ✅ `npm run sync` / `sync:prod` push scrapes and settlements to the database; automation still manual |