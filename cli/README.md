# The Expertise Wins — CLI Engine & Orchestrator

The `cli` directory contains the data collection, scraping, prediction normalization, and daily settlement engine behind **The Expertise Wins**.

## 📌 Architecture & Responsibilities

- **Scrapers** (`scrapers/freetips.scraper.js`): Collect raw predictions from trusted external tipster sources.
- **Normalizers** (`normalizers/freetips.normalizer.js`): Map raw tip strings into standardized market definitions (`1X2`, `OVER_UNDER_2_5`, `BOTH_TEAMS_TO_SCORE`, `HANDICAP`).
- **Orchestrator** (`orchestrator/run-freetips.js`): Executes scrape-and-normalize pipelines and exports structured tip dumps to `orchestrator/test-results/freetips.json`.
- **Settlement Engine** (`settlement/settlement.js`): Evaluates yesterday's tips against real match scores, marks outcomes (`WON`, `LOST`, `VOID`, `HALF_WON`, `HALF_LOST`), and prints formatted markdown reports.
- **Services Client** (`services/tips.client.js`): Modular client allowing CLI outputs to be sent directly to the `backend` REST API.

## 🚀 CLI Commands

Run these commands from the root directory:

```bash
# Run scrape & normalize pipeline (generates today's free tip cards)
npm run expertise

# Run settlement orchestrator (processes results & prints settled report)
npm run settlement
```

Or from within the `cli` folder:

```bash
cd cli
npm run expertise
npm run settlement
```

## 📁 Directory Layout

```text
cli/
├── normalizers/       # Market & odds normalization functions
├── orchestrator/      # Scrape runner & snapshot result dumps
├── scrapers/          # Puppeteer/Cheerio web scrapers
├── services/          # API integration client
├── settlement/        # Result evaluator & text report template
└── tests/             # Contract & unit test suites
```
