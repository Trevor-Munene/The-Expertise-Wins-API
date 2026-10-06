# V2 Ideation — Open Proposal

**Status:** early product ideation, recorded 6 October 2026. This is a discussion document, not an approved feature list, delivery promise, estimate, or replacement for V1 acceptance work. Add, revise, combine, reprioritize, or remove ideas as the product and operating experience develop.

## Why keep this document

V1 is being exercised with real operating workflows. Its immediate purpose is to make tip collection, review, publishing, settlement, access control, and transparent reporting dependable. V2 ideas can be explored while that work continues, without treating them as work already underway.

The current application has a manual CLI publishing and settlement workflow, a Dockerized web application, an Express REST API, admin curation and access-token tools, and aggregate statistics. The running database and source dumps also need settlement reconciliation; see the dated V1 status in [`roadmap.md`](./roadmap.md). V2 should build on evidence from V1 rather than assume these workflows are finished.

## Possible V2 directions

These are independent themes for discussion. They are not ranked.

### 1. Telegram channel automation

Explore posting reviewed tips to configured Telegram channels and groups. A future workflow could map a product or tip category to a destination, preview a post, require operator approval where desired, and record delivery status. Consider retries, duplicate prevention, edits or corrections, message formatting, credentials, permissions, and an audit trail. Manual copy-and-paste should remain a clear recovery path.

Questions to explore: Which channels and message formats are in scope? Should posts always require approval? How should a correction, cancellation, or settled result appear in a channel?

### 2. Developer API services

The application already has an internal REST API used by its own frontend. A paid developer-facing service would be a separate product layer: documented and versioned endpoints, developer onboarding, scoped API credentials, usage visibility, quotas, rate limits, support expectations, and possibly billing or service plans.

Questions to explore: Which data may developers access? Are public tips, premium tips, historical results, or analytics separate entitlements? What reliability, privacy, and support commitments can be sustained?

### 3. Installable packages for other administrators

Explore packaging the product so independent administrators can deploy and operate their own instance, potentially as a paid installation or license. This could include guided installation, configuration checks, upgrades, backups and restore, license management, and clear separation between each operator's users, tips, tokens, and channel credentials.

Questions to explore: Is the product a self-hosted package, a centrally hosted multi-tenant service, or both? Who owns hosting, updates, support, data recovery, and license enforcement? Tenant isolation and upgrade safety should be designed before selling installations.

### 4. More granular, sport-specific analytics

V1 already provides overall and grouped statistics, including sport and market breakdowns. V2 could add deeper sport-specific views: useful competition and market filters, time comparisons, tier or source comparisons where access permits, sample sizes, settled-versus-pending counts, and sport-appropriate performance measures. Consider confidence and drawdown alongside win rate and ROI so small samples do not look more certain than they are.

Questions to explore: Which sports have enough consistent data to support dedicated analysis? Which metrics are meaningful for each sport and market? How should voids, half outcomes, pushes, and changing odds be represented?

### 5. Richer tips and operator workflows

Explore stronger tip authoring and review: structured reasoning and context, useful source notes, sport-specific validation, reusable templates, draft/review/approved states, previews for each destination, correction history, and a clear path from creation through publication and settlement. Make provenance and edits visible to the people who need them.

Questions to explore: What context improves a tip without overstating certainty? Which steps need a second reviewer? How should CLI-created tips and admin-entered tips share one history?

### 6. More useful personal pages

The current profile supports account details, avatar, password, and access history. A richer personal area could bring together a member's entitlements, saved preferences, relevant tip history, account activity, and clearly explained personal statistics, subject to privacy and product-access rules.

Questions to explore: What is private to the account, what can be shared, and what data should never be public? Which profile controls reduce support work or improve member experience?

### 7. Calculator based on our own tip history

Explore a calculator that uses this product's recorded tips and outcomes to let an operator or member test hypothetical stake and bankroll approaches. It could compare fixed stakes or other explicitly described rules against historical records and show assumptions, sample size, profit/loss, and drawdown.

Keep this as a retrospective or hypothetical tool, not a promise of future returns. Define how the calculator handles missing or changed odds, pending tips, voids, partial outcomes, overlapping selections, and incomplete history. Make the tested data range and assumptions visible in every result.

## Cross-cutting considerations

- Keep tip and settlement history auditable; distinguish source records from later corrections.
- Protect account, channel, and developer credentials; scope access and make revocation straightforward.
- Design backups, upgrades, failure recovery, and support before expanding installation or API commitments.
- Make sample size, assumptions, and limitations visible in analytics and calculator outputs.
- Preserve a usable manual workflow when an integration is unavailable.
- Decide what can be operated locally, what belongs in Docker, and what requires a hosted service.

## Possible discovery order

This is a suggested discussion sequence, not a commitment: first reconcile and harden the V1 data/workflows; then interview the people who would administer, subscribe to, or integrate with the product; next choose whether the V2 business model is self-hosted licensing, hosted service, developer API, or a combination; finally size and prioritize features based on those findings.

## Open space for more ideas

Add future ideas, questions, user feedback, risks, and rejected approaches here. Keep the status at the top clear until a V2 scope is deliberately approved.
