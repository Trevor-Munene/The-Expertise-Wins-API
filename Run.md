# 🏃 Running The Expertise Wins API

This is the **CLI operator's runbook**. The repository also contains a backend API and a frontend; their setup is documented in `backend/README.md` and `frontend/README.md`.

> **Where this fits:** `README.md` explains *what* the project is and *why*. `Roadmap.md` explains *where it's going*. **This file explains how to actually run it.**

---

## What the app is (right now)

The CLI has two jobs:

1. **Produce** today's tips as channel-ready text you copy into the channels.
2. **Settle** yesterday's/today's results from input you paste in.

The current CLI loop is **produce → publish manually → paste marked results → settle**. It writes local JSON; it does not publish to Telegram or send data to the API.

---

## Requirements

* **Node.js** (the scripts are plain `.js`; no build step)
* Node dependencies installed in each package you plan to run (`cli`, `backend`, and `frontend`). For this runbook, install the CLI package:

```bash
npm install --prefix cli
```

> On Windows, if `node`/`npm` aren't on your `PATH`, invoke them from `C:\Program Files\nodejs\`.

---

## Commands at a glance

| Command | What it does |
|---|---|
| `npm run expertise` | **Full daily run** — scrape → normalize → save → print cards |
| `npm run --prefix cli start` | Print cards from the **existing** snapshot (no scraping) |
| `npm run settlement` | **Settle results** from the pasted template and print the settled report |
| `npm run --prefix cli test` | Run the CLI FreeTips, contract, and settlement tests |
| `npm run --prefix cli test:settlement` | Run only the CLI settlement tests |

---

## 1. Producing today's tips

### Full run (scrape the site and print)

```bash
npm run expertise
```

This runs, in order:

1. `orchestrator/run-freetips.js` — scrapes FreeTips, normalizes records, saves the snapshot and dated dump, cleans up transient HTML, and runs the FreeTips/contract tests. Test errors are logged and do not necessarily stop the run.
2. `services/app.js` — prints the day's channel-ready cards.

Output sections (copy these into your channels):

```text
💰 MAXBET TIPS          → Bet-of-the-Day featured cards
💎 VIP TIPS             → other-sport VIP cards
🆓 The Expertise Wins Free Tips
----------------------------------------
             SUMMARY
```

### Just print (no scraping)

If you already scraped and only want to print the cards again:

```bash
npm run --prefix cli start
```

### Scrape for a specific date

```bash
npm run --prefix cli expertise -- --date=2026-09-17
```

---

## 2. Settling results (manual input)

Results are **not** fetched from sports scores. Paste result text containing the supported markers, and the CLI applies those markers to the matching dated dump.

### Step 1 — paste the results into the template

Open:

```text
settlement/settlement-template.txt
```

Paste the day's results in this shape (ticks win/lose, and `🔥` is optional — you can include it as in the source, it's just cosmetic):

```text
[17/09/2026 09:13] Pikk Maxbet VIP: ⚽️ || Besiktas v Marseille
Bet of the Day
Beginning: 23:00 Kenyan Time
Bet: Besiktas Win
Stake: 4 Units

Besiktas have won all six home matches under Vincenzo Italiano. ...

Besiktas Win @1.75 - 4 Units ✅✅
Dusan Vlahovic Anytime Goalscorer @2.10 - 2 Units ❎❎
```

* **`✅✅`** → win
* **`❎❎`** → loss

### Step 2 — run the settlement

```bash
npm run settlement
```

By default this uses today's UTC date and requires the exact matching dated dump. It does not fall back to the latest available dump. Paste the results into the template first.

To be explicit:

```bash
npm run --prefix cli settlement -- --date=2026-09-17
npm run --prefix cli settlement -- --date=2026-09-17 path/to/results.txt
npm run --prefix cli settlement -- path/to/results.txt
```

### What the settlement does

```text
Read exact-date dump  (settlement/previous-day-results/freetips-<date>.json)
        ↓
Match each tip's fixture + selection against your pasted text and doubled markers
        ↓
Mark outcomes  (win / lose, status = settled) — including nested tips & extraTips
        ↓
Write the annotated dump back to disk
        ↓
Print the settled report
```

In the printed report:

* Paid (Maxbet/VIP) **wins** show `✅🔥`
* Losses show `❎` (no fire)
* Free tips print plain

### Settlement rules (important)

| Situation | Result |
|---|---|
| A tip's line shows `✅✅` | **win** |
| A tip's line shows `❎❎` | **lose** |
| A **free** tip is **not present** in your pasted text | **loss** (a free tip you never marked as won is accounted as a loss on your end) |
| A featured tip (`isFeatured` or Bet of the Day) has no marker | left **unsettled** (needs an explicit marker) |

> ⚠️ **Match the text carefully.** The matcher finds the **first** line in a fixture's block that contains the selection text. If one selection is a substring of another on the same fixture, put the more specific line in the position you want it matched — otherwise the wrong marker can be applied.

---

## 3. Where data lives

```text
orchestrator/test-results/freetips.json
    → TODAY's working snapshot (what gets printed)

settlement/previous-day-results/freetips-<DDth Mon YYYY>.json
    → the DATED dump the settlement reads and writes back
```

### How tips accumulate (intentional)

Within the same day, `saveTestResults` **merges** new tips into the snapshot rather than overwriting:

* Existing same-day tips are kept.
* New tips are added, matched by `homeTeam|awayTeam|selection|market`.
* A re-scraped tip with the same key is **updated in place**, not duplicated.

So if you have 5 tips in the morning and 5 more appear later, the snapshot holds **10**. Tips from a *previous* day are dropped from the working snapshot — because they're already preserved in that day's dated dump.

This is deliberate: **a tip is only a win if you mark it as won in the public channel — otherwise it counts as a loss and is accounted for on your end.** The settlement layer enforces exactly that.

---

## 4. Tests

```bash
npm run --prefix cli test                 # freetips + contract + settlement
npm run --prefix cli test:settlement      # settlement layer only
```

The settlement tests run against a self-contained throwaway dump and clean up after themselves.

---

## 5. Typical day (copy-paste recipe)

```bash
# 1. Morning — produce today's output
npm run expertise

#    → copy the Maxbet / VIP / Free cards into your channels

# 2. Later / next morning — settle the results
#    (paste the day's results into settlement/settlement-template.txt first)
npm run settlement

# 3. Sanity check
npm run --prefix cli test
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `JSON dump not found for date ...` | Settlement requires the exact dated dump. Create it with `npm run --prefix cli expertise -- --date=YYYY-MM-DD`, or pass a date that already has a dump. |
| `Text file not found ...` | Your `settlement-template.txt` (or the path you passed) doesn't exist. |
| Settlement marks the wrong outcome | Matcher hit a substring line first — reorder the lines for that fixture (most specific first). |
| `node` / `npm` not found | Use the full path, e.g. `"C:\Program Files\nodejs\npm.cmd" run settlement`. |
| Cards look empty | The snapshot is empty or was reset for a new day. Run `npm run expertise`. |

---

## Not built yet (by design)

These are **not** automated in the current workflow:

* scheduled daily scraping
* direct Telegram bot publishing
* automatic result verification from live scores

The backend and frontend exist in this repository; see their package READMEs for setup and current limitations. See `Roadmap.md` for planned work.
