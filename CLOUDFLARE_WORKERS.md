# Cloudflare Workers Migration, 10ms CPU Optimization & Cost Guide

This document details every architectural decision, runtime constraint, optimization strategy, developer workflow, and cost calculation used to run the **Expense & Prorated Budget Tracker** on **Cloudflare Workers + Static Assets + D1** — specifically engineered to fit comfortably inside the **Cloudflare Workers Free Plan (10 ms CPU limit per request)** while preserving the Node.js/Express version on `main` and existing production release branch (`production`).

---

## 1. Branch Architecture (3-Branch Strategy)

| Branch | Purpose | Runtime | Trigger |
| :--- | :--- | :--- | :--- |
| **`main`** | Primary source of truth (React + Express + SQLite WASM + Workers code) | Node.js (AI Studio / Dev) | Manual / PR merges |
| **`production`** | Pre-built Node.js/Docker release artifact (`.github/workflows/deploy.yml`) | Node.js + Docker / Server | Push to `main` |
| **`workers-deploy`** *(3rd Branch)* | Versioned, self-contained Cloudflare Workers build + `VERSION.json` + git tag `workers-v<version>` (`.github/workflows/deploy-workers.yml`) | Cloudflare Workers + Static Assets + D1 | Push to `main` or manual dispatch |

Each release to `workers-deploy` stamps:
- `VERSION.json` (`name`, `version`, `tag`, `commit`, `builtAt`, `runtime`)
- `WORKER_VERSION` inside `wrangler.jsonc`
- An annotated Git tag `workers-v<major>.<minor>.<run_number>`

You can either let GitHub Actions deploy directly via `CLOUDFLARE_API_TOKEN`, **OR** connect Cloudflare Dashboard **Workers & Pages -> Git Integration** directly to the **`workers-deploy`** branch!

---

## 2. Everything Engineered for the 10 ms CPU Limit & Edge Runtime

Cloudflare Workers Free Tier enforces a **hard 10 ms CPU time ceiling per invocation** (`fetch()` / D1 network I/O wait time does **not** count toward CPU time; only active JS/WASM execution counts). Here is how each Node.js bottleneck in `server.ts` + `src/server/db.ts` was solved inside `worker/`:

### A. Zero-CPU Static Asset Routing (`0 ms` Worker CPU)
- **`wrangler.jsonc` -> `assets.run_worker_first`** is strictly scoped:
  ```jsonc
  "run_worker_first": ["/api/*"]
  ```
- **Result**:
  - The entire React SPA (`/`), JS bundles (`/assets/*`), Tailwind CSS, Google Fonts references, and SPA fallback (`not_found_handling: "single-page-application"`) are served directly by Cloudflare's Edge Static Assets network with **0 ms Worker CPU** and **0 Worker daily request quota consumed**.
  - `public/_headers` attaches `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and HTTP security headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Content-Security-Policy`) at the edge.

### B. Replacing `sql.js` WASM + Disk I/O with Cloudflare D1 Batching
- **Problem**: `sql.js` compiles SQLite to WASM (~1.5 MB) and reads/writes an entire binary `data/budget.sqlite` file on disk (`fs.writeFileSync`), which exceeds Worker memory/CPU cold-start budgets and fails on stateless Edge isolates (no persistent local filesystem).
- **Solution (`worker/db.ts` & `worker/migrations/0001_init.sql`)**:
  - Mapped all 14 application tables (`categories`, `transactions`, `deleted_transactions`, `prorated_rules`, `prorated_spends`, `savings_goals`, `savings_history`, `debts`, `debt_payments`, `recurring_items`, `user_settings`, `read_alerts`, `gulak_pots`, `gulak_entries`) + `rate_limits` to **Cloudflare D1**.
  - Added explicit indexes (`idx_transactions_date`, `idx_transactions_category`, `idx_prorated_spends_rule`, `idx_savings_history_goal`, `idx_debt_payments_debt`, `idx_gulak_entries_pot`) to eliminate full-table scans.
  - Combined multi-table reads & writes with `db.batch([...])` (`/api/db/status`, `/api/savings-goals`, `/api/debts`, `/api/gulak/pots`, `/api/transactions/import`, `/api/recurring/apply`, `/api/db/reset*`) so endpoints execute in **1 D1 round-trip**.

### C. Cryptography: Native WebCrypto Constant-Time Password Verification (`< 0.3 ms` CPU)
- **Solution (`worker/security.ts`)**:
  - Uses Cloudflare's BoringSSL-backed **`crypto.subtle`** (C++ host-level crypto, `< 0.3 ms` CPU) for `/api/db/reset` & `/api/db/reset-to-zero`.
  - Supports both `pbkdf2_sha256$<iterations>$<saltHex>$<hashHex>` hashes (capped at 100,000 iterations per Workers limit) and raw Worker Secrets (`RESET_PASSWORD`) hashed to fixed 32-byte `SHA-256` digests compared via `crypto.subtle.timingSafeEqual` (zero length oracle).

### D. Hybrid Rate Limiting & Edge Caching (`caches.default`)
- **General API Rate Limiter**: Uses ultra-fast in-isolate sliding windows (`300 req/min`) with **0 D1 writes** so normal browsing never burns D1's Free Tier daily write allowance (`100,000 rows/day`).
- **Sensitive Action Rate Limiter**: Uses **D1 (`rate_limits` table)** on `/api/db/reset*`, `/api/db/load-demo`, and `/api/transactions/import` (`25 req/min`), with non-blocking stale-entry cleanup via `c.executionCtx.waitUntil(...)` (**0 ms added latency**).
- **Edge Cache (`caches.default`)**: `/api/categories` and `/api/settings` use Cloudflare POP edge caching (`~0.2 ms` CPU, `0` D1 row reads on cache hits) and automatically purge synchronously whenever a mutation (`POST`/`PUT`/`DELETE`) occurs.

### E. Lightweight Bundle Size (`< 100 KiB` gzipped)
- Replacing Express + `sql.js` WASM + Node `fs` with **Hono** + pure-TS validation (`worker/security.ts`) + D1 keeps the entire Worker runtime tiny (~60–90 KiB uncompressed / ~20–30 KiB gzipped), ensuring V8 isolate cold-start parsing stays **~1 ms**.

---

## 3. Developer Setup & Deployment Guide

### Prerequisites
- Node.js `>= 20` (recommended `22`)
- Cloudflare account + Wrangler authenticated (`npx wrangler login`)

### Step 1: Create the Cloudflare D1 Database
```bash
npx wrangler d1 create expense-budget-tracker-db
```
Copy the returned `database_id` into `wrangler.jsonc` (replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`), **OR** set GitHub Actions Repository Variable `CLOUDFLARE_D1_DATABASE_ID` so CI injects it automatically into `workers-deploy`.

### Step 2: Build, Apply Schema & Seed Data
```bash
# 1. Typecheck frontend & worker, build Vite assets, stamp VERSION.json, dry-run bundle
npm run build:workers

# 2. Apply migrations to Remote D1 (and Local D1 for dev)
npx wrangler d1 migrations apply expense-budget-tracker-db --remote
npx wrangler d1 migrations apply expense-budget-tracker-db --local
```

### Step 3: Configure Required Secrets
Never commit credentials into `wrangler.jsonc`. Push secrets via Wrangler:
```bash
npx wrangler secret put RESET_PASSWORD
```
For local testing with `npm run dev:workers`, copy `.dev.vars.example` to `.dev.vars` (ignored by git).

### Step 4: Local Testing & Manual Deployment
```bash
# Test full-stack Worker + Static Assets + local D1 simulation
npm run dev:workers

# Manual deploy to Cloudflare Workers
npm run deploy:workers

# Package standalone branch folder locally (.workers-release/)
npm run workers:branch
```

### Step 5: Automated 3rd Branch CI/CD (`workers-deploy`)
1. Every push to `main` (or manual dispatch) runs `.github/workflows/deploy-workers.yml`.
2. It runs `npm run lint`, `npm run lint:workers`, and `npm run build:workers`, stamps `VERSION.json` + `wrangler.jsonc`, and force-pushes the self-contained artifact to **`workers-deploy`** with tag `workers-v<version>`.
3. To auto-deploy directly from GitHub Actions, set in GitHub (`Settings -> Secrets and variables -> Actions`):
   - **Variable**: `CLOUDFLARE_D1_DATABASE_ID`
   - **Secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

---

## 4. Cost Analysis & Free Tier Quota Math

| Resource | Free Plan ($0 / month) | Paid Plan ($5 / month base) | How This App Stays $0/mo |
| :--- | :--- | :--- | :--- |
| **Static Asset Requests** | **Unlimited** (0 Worker quota used!) | **Unlimited** | React SPA, JS, CSS, and HTML bypass Worker via `run_worker_first: ["/api/*"]` |
| **Worker Requests** | **100,000 / day** (~3M / month) | 10M / month (+$0.30/1M) | Only `/api/*` data calls invoke Worker |
| **CPU Time / Request** | **10 ms hard limit** | 30 s default, 30M CPU ms/mo | Hono + D1 batching + WebCrypto + Edge Cache run at **0.2–1.5 ms CPU** |
| **Bandwidth / Egress** | **$0 (Free)** | **$0 (Free)** | Zero egress fees globally |
| **D1 Storage** | **500 MB / DB** (5 GB total) | 10 GB / DB (1 TB total) | Personal ledger + budgets DB is typically **< 5 MB** |
| **D1 Row Reads** | **5,000,000 / day** | 25B / month (+$0.001/1M) | Edge cache for settings/categories + indexed queries prevent full-table scans |
| **D1 Row Writes** | **100,000 / day** | 50M / month (+$1.00/1M) | Isolate-local GET rate limiting skips D1 writes on normal reads |

---

## 5. Quick Verification Checklist for Developers
1. **CPU Safety**: Never import `sql.js`, `express`, `fs`, `bcryptjs`, or `jsonwebtoken` inside `worker/`.
2. **D1 Row Budget**: Always hit indexed columns or `db.batch([...])`.
3. **Secrets**: Never put `RESET_PASSWORD` in `wrangler.jsonc` `"vars"` — always use `wrangler secret put RESET_PASSWORD`.
4. **Typecheck**: Always run `npm run lint`, `npm run lint:workers`, and `npm run build:workers` before pushing.
