# The Expertise Wins — V1 Status and Roadmap

This document distinguishes the implemented V1 baseline from the remaining acceptance work. Code and documentation snapshot date: **8 October 2026**. The operational data figures below are a dated 6 October snapshot and are not a current live-system check. Phase checkboxes record milestones; they do not imply that production deployment or every real-user workflow has been accepted.

> V1 now has a Dockerized application stack. The current focus is data reconciliation, operational hardening, and real-user acceptance.

---

## Current status (8 October 2026 code snapshot)

The repository contains the CLI workflow, Express/Prisma REST API, Next.js frontend, and Docker Compose setup. The API and frontend run in the Docker `app` service; PostgreSQL is a separate healthy container. The published local ports are API `3000`, frontend `3001`, and database `5432`. The frontend and backend settings are held in separate ignored env files.

The Compose application runs the API, frontend, and PostgreSQL together, with separate frontend and backend environment files and standard ports. Current code includes the public/archive/stats experience, tier-specific access, admin tip management with today/yesterday selection, and daily CLI scrape/settlement sync. A fresh local verification on 8 October confirmed the app container is running, PostgreSQL is healthy, the API readiness route and public frontend/SEO routes respond, backend and CLI test suites pass, frontend lint passes, and Docker sync dry-run validation passes. This is development-stack and automated-check evidence, not full browser or real-user acceptance. Login, customer, end-to-end admin, backup, and recovery workflows still require acceptance. The 4 October browser check and 6 October data checkpoint remain historical evidence.

### V1 capabilities in the repository

- **CLI:** scrape and normalize FreeTips records, write dated JSON, format channel-ready cards, settle a chosen day's dump from manually pasted markers, and sync dumps to PostgreSQL. Scrape and settlement can run locally; the API, frontend, database, and standard sync workflow are Dockerized.
- **Backend:** Express REST API with JWT accounts, public Free and access-gated VIP/MaxBet reads, archive and tip details, aggregate stats, products, token redemption, user/admin routes, and active-admin tip curation. Admin curation is protected under `/api/admin/tips`; the public tips router is read-only. There is no developer API key product or live channel-publishing integration.
- **Frontend:** public site and blog, tips and archive pages, stats, products, login/registration, user profile, and admin pages for users, tips, access tokens, and products. Client-side role checks are for presentation; the API enforces protected operations.
- **Access and data handling:** tokens are assigned to registered users, can be revoked or deleted, and source identifiers are removed from public tip responses. Settlement is manual; live result verification is not implemented.

### Data snapshot

After the verified local Docker sync on 6 October, the stats API reports **356 tips: 304 wins, 5 losses, and 47 pending** (309 settled; 98.38% win rate, 119.67% ROI, average odds 2.64). The 12 dated JSON dumps also total 356 tips, listing **301 wins and 55 pending**, with no losses. Eight outcomes therefore differ between the dump and database; reconcile the settlement source of truth before relying on the combined record. The newest dump is `freetips-6th Oct 2026.json`. These are a dated development snapshot and will change as tips are settled and synced.

### V1 acceptance still open

- Reconcile the eight database outcome differences with the dated CLI dumps and document which state is authoritative after corrections.
- Exercise the actual registration/login, access-token, entitlement, admin, scrape, settlement, and sync workflows with real users and a fresh database.
- Add repeatable UI-to-API acceptance coverage and verify migration, backup, and restore procedures.
- Set `NEXT_PUBLIC_SITE_URL` to the production domain before deployment; page canonical/Open Graph metadata, structured data, sitemap, and robots now share that setting.
- Complete production configuration and security review. Local Docker health is not production readiness.

V2 ideas are collected separately in [`v2-ideation.md`](./v2-ideation.md). They are open proposals, not approved scope or current V1 commitments.

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
* [x] Apply channel-aware defaults: unmarked free-channel picks settle as wins, unmarked paid-group picks settle as losses
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
* [x] Import historical CLI dumps with the backend seed script (initial 10-dump / 288-tip checkpoint, verified 2026-10-04; current state is in the snapshot above)
* [x] Accept the settlement layer's `win`/`lose`/`settled` values so settled results reach the database

---

# Phase 8 — Express REST API Backend

**Goal:** Expose HTTP endpoints powering the web interface and external clients.

* [x] Build Express API source (`backend/app.js`)
* [x] Repair duplicate declarations in authentication middleware so the server can load
* [x] Enforce `ADMIN` role authorization on admin routes
* [x] Require an active admin for tip-management mutations; keep operator changes CLI-driven
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
* [x] Settle one tip and all of its selection outcomes atomically through one admin action

---

# Phase 9 — Next.js 14 Frontend Application & SEO

**Goal:** Provide an SEO-optimized, responsive web application and isolated Admin module.

* [x] **Next.js 14 App Router in Pure JavaScript / JSX**: Built without TypeScript complexity.
* [x] Responsive branded UI with light/dark theme preference.
* [x] **SEO foundations**:
  * Dynamic XML sitemap (`/sitemap.xml`) for a configured subset of public routes and blog posts.
* [x] Align page metadata, structured data, sitemap, and robots to `NEXT_PUBLIC_SITE_URL` and include all public informational pages.
* [x] **Admin Dashboard UI (`/admin`)**:
  * Client-side role checks support navigation; the API independently enforces active-admin access. Admin tip curation exists, while routine daily production and settlement remain CLI-driven.
* [x] Historical tip archive (`/archive`) with detail previews and recorded outcomes.
* [x] **Responsive Across Devices**: Mobile drawer menu, tablet layouts, and desktop support.
* [x] **Docker Compose development stack**: API, frontend, and PostgreSQL run in containers on standardized ports 3000, 3001, and 5432.
* [x] Manual headless-browser review on 2026-10-04: login reached `/admin`; stats, tips, archive, profile, products, and admin pages rendered live API data. This is historical verification, not the 2026-10-06 acceptance status.

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

# Phase 11 — V1 Hardening & Acceptance

**Goal:** Verify the implemented application with real workflows and make its current data and operations dependable.

* [x] Keep the public tips router read-only and protect admin curation and token management with active-admin authorization
* [x] Add backend service-logic tests with mocked persistence
* [ ] Reconcile the eight differing outcomes across the 356 database and dated dump records
* [ ] Complete operator real-user and fresh-database acceptance of V1
* [ ] Add UI-to-API acceptance coverage
* [ ] Verify backup and restore procedures
* [x] Align page metadata, sitemap, robots, and structured data to `NEXT_PUBLIC_SITE_URL`
* [ ] Complete a production configuration and security review

V2 automation, developer API services, commercial installation packaging, deeper sport analytics, richer tipping and personal workflows, and a historical-tips calculator are ideation topics in [`v2-ideation.md`](./v2-ideation.md), not Phase 11 commitments.

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
| **Phase 6** | Performance Analytics & ROI Engine | ✅ Aggregate metrics and sport/market breakdowns are implemented; current settlement totals need reconciliation |
| **Phase 7** | Prisma ORM, Docker PostgreSQL & Historical Seed | ✅ Compose database is healthy and seeded; eight outcome differences remain between the 356 database and dump records |
| **Phase 8** | Express REST API, Archive & JWT Auth | ✅ Public tips API is read-only; admin curation is active-admin-only, token revoke/delete and mocked-persistence service tests are in place; V1 acceptance is operator real-user/database testing |
| **Phase 9** | Next.js 14 Frontend, Archive, SEO & Blog | 🟡 Docker public routes and SEO endpoints respond; lint passes; full browser acceptance and end-to-end coverage remain |
| **Phase 10** | CLI ↔ Database Sync | ✅ Docker sync command is available and idempotent; daily scrape, review, settlement, and sync remain operator-driven |
| **Phase 11** | V1 Hardening & Acceptance | 🟡 Data reconciliation, real-user acceptance, UI/API coverage, recovery procedures, and deployment review remain |
