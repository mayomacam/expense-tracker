# Expense & Prorated Budget Tracker

A modern, full-stack personal finance application built with **React 19**, **Tailwind CSS v4**, **Node.js (Express)**, and **SQLite (sql.js WASM with durable disk persistence)**. 

Designed for precise daily financial control, this application goes beyond conventional monthly budgeting by introducing **Prorated Daily Spend Limits**, enabling real-time pace tracking, automated recurring items, debt snowball tracking, savings goals, soft-deleted transaction recovery, and comprehensive financial reports.

---

## Key Highlights

- **Prorated Daily Limit Budgeting**: Automatically calculates daily spending allowances for dynamic expense categories (e.g., dining, groceries, entertainment) across the exact days in any month, tracking cumulative pacing, pace alerts, and rollover surpluses.
- **Durable SQLite Storage (Zero Mock)**: Complete relational database engine running via SQLite WASM (`sql.js`) with atomic file writes to `data/budget.sqlite`. No volatile in-memory loss on server reboot.
- **Trash Bin & Soft Deletes**: Transactions are protected with a two-stage deletion lifecycle—deleted items move to the Trash Bin where they can be inspected and restored or permanently purged.
- **Automated Month-Start Recurring Engine**: Scheduled recurring monthly bills, subscriptions, and paychecks are automatically cloned into the live database at the start of each month, with per-item enable/disable controls, deduplication guards, and live execution status.
- **Hash-Based Bookmarkable Routing**: Full browser history integration supporting direct URLs (`/#/dashboard`, `/#/transactions`, `/#/prorated`, `/#/budgets`, `/#/savings-debt`, `/#/reports`, `/#/categories`, `/#/trash`) with back/forward navigation and refresh persistence.
- **Resilient UI Architecture**: Built-in animated layout loading skeletons during SQLite hydration, global React Error Boundary with recovery triggers, and centralized modal management.
- **Savings Goals & Debt Paydown**: Visual progress bars, target date timelines, deposit/withdrawal histories for savings, and principal/interest amortization tracking for debts.
- **Export & Reporting**: Multi-format reporting engine offering CSV exports (itemized transactions, category breakdowns, daily pace metrics) and browser-based printable/PDF financial statements.
- **Security-Hardened Docker Packaging**: Production multi-stage Alpine Dockerfile adhering to least-privilege principles (unprivileged `node` user, `0700` data directory permissions, `tini` PID 1 process management, `--ignore-scripts`, and container healthchecks).

---

## Documentation Index

Detailed architectural and technical guides are available in the [`docs/`](./docs) directory:

| Document | Description |
| :--- | :--- |
| [**Architecture Overview**](./docs/architecture.md) | Deep dive into client-server design, state management, and component hierarchy. |
| [**Prorated Budgeting Model**](./docs/prorated-budgeting.md) | Mathematical formulation of daily pace curves, month length factors, and rollover dynamics. |
| [**API Reference**](./docs/api-reference.md) | Comprehensive REST API endpoints, request schemas, parameters, and status codes. |
| [**SQLite Database Guide**](./docs/database-sqlite.md) | Table schemas, relations, transaction repositories, and data maintenance procedures. |
| [**Docker & Deployment**](./docs/docker-deployment.md) | Container architecture, security hardening rationale, Docker Compose, and Cloud Run setup. |

---

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Data Visualization**: Recharts (Prorated daily pace curves, spending distributions, monthly comparisons)
- **Icons**: Lucide React
- **Build Tool**: Vite 6

### Backend & Storage
- **Server**: Node.js 20+ with Express
- **TypeScript Runner**: tsx
- **Database**: SQLite (via `sql.js` WebAssembly + Node.js filesystem persistence)
- **Data Location**: `/data/budget.sqlite`

### Deployment & Containerization
- **Container**: Docker Multi-Stage (Alpine Linux)
- **Init System**: `tini` (PID 1 zombie reaping and signal routing)
- **Port**: `3000` (Internal & External)

---

## Quickstart

### Prerequisites
- Node.js `20.x` or later
- npm `10.x` or later

### Installation & Local Run

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd expense-prorated-budget-tracker
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application boots Express with Vite middleware and mounts on `http://localhost:3000`.

3. **Verify Database Initialization:**
   ```bash
   curl http://localhost:3000/api/db/status
   ```
   You should receive a JSON response confirming `budget.sqlite` is online with active table counts.

4. **Production Build & Execution:**
   ```bash
   npm run build
   npm start
   ```

---

## Core Application Modules

### 1. Prorated Daily Limit Tracker
Standard monthly budgets fail when spending is frontloaded early in the month. The Prorated Daily Limit model divides a category's monthly cap (plus any rollover balance) by the exact number of calendar days in the month:
$$\text{Daily Allowance} = \frac{\text{Monthly Cap} + \text{Rollover Balance}}{\text{Days in Month}}$$

- Tracks whether your spending on day $D$ is below or above the cumulative expected expenditure:
$$\text{Cumulative Expected Spend} = \text{Daily Allowance} \times D$$
- Provides visual pace indicators: *Under Budget* (Green), *Watch Pace* (Amber), or *Over Pace* (Rose).

### 2. Transaction Management & Trash Bin
- Add income and expense transactions with custom categories, tags, notes, payment methods, and receipt URLs.
- Filter and search transactions by date range, category, payment method, or title keywords.
- Deleted transactions are placed in `/api/deleted-transactions`. Users can restore accidentally deleted records at any time.

### 3. Automated Recurring Bills & Subscriptions
- Configure recurring expenses and incomes with custom amounts, categories, and payment days.
- **Automated Month-Start Service**: Automatically clones enabled recurring entries into the live SQLite database at the beginning of each month upon initial load, calendar transition, or browser refocus.
- **Granular Item Controls**: Toggle auto-cloning on/off per individual subscription or bill without deleting the template.
- **Deduplication Safeguards**: Tracks `lastAppliedMonth` to guarantee records are never duplicated within the same billing period.
- **Manual Overrides**: Execute on-demand auto-clone checks or apply all active items with one click.

### 4. Savings Goals & Debt Paydown
- Track savings targets with target dates, visual progress bars, and full deposit/withdrawal logs.
- Manage debt items (principal, interest rates, minimum payments) with payment history and balance reduction curves.

### 5. SQLite Data Manager Modal
- Built directly into the UI: Inspect live SQLite table counts, trigger demo dataset population, export SQLite backups, or perform a clean zero-state reset.

---

## REST API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/db/status` | Returns SQLite engine status, disk size, and table row counts |
| `POST` | `/api/db/reset` | Resets database to clean zero-record state |
| `POST` | `/api/db/load-demo` | Populates rich demonstration dataset |
| `GET` | `/api/transactions` | List all active transactions (sorted by date descending) |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/:id` | Update an existing transaction |
| `DELETE` | `/api/transactions/:id` | Soft-delete a transaction (moves to Trash Bin) |
| `GET` | `/api/deleted-transactions` | Retrieve soft-deleted transactions in Trash Bin |
| `POST` | `/api/deleted-transactions/:id/restore` | Restore a soft-deleted transaction |
| `DELETE` | `/api/deleted-transactions` | Permanently purge all items in Trash Bin |
| `GET` | `/api/categories` | List all budget categories |
| `GET` | `/api/prorated-rules` | List all prorated daily spend rules |
| `POST` | `/api/prorated-rules` | Create a prorated budget tracking rule |
| `GET` | `/api/savings-goals` | List all savings goals and deposit histories |
| `GET` | `/api/debts` | List all debts and payment histories |
| `GET` | `/api/recurring` | List all recurring templates with `autoApply` flags |
| `POST` | `/api/recurring` | Create recurring template (`autoApply`, `dayOfMonth`) |
| `PUT` | `/api/recurring/:id` | Update recurring item or toggle `autoApply` status |
| `POST` | `/api/recurring/apply` | Clone pending recurring items (`month`, `forceAll`) into transactions |
| `GET` | `/api/settings` | Retrieve user preferences and alert thresholds |

*For complete endpoint schemas, query parameters, and payloads, refer to the [API Reference](./docs/api-reference.md).*

---

## Docker Deployment

The application includes an enterprise-grade, hardened `Dockerfile`:

```bash
# Build the production Docker image
docker build -t expense-tracker:latest .

# Run container with persistent data volume
docker run -d \
  --name expense-tracker \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  expense-tracker:latest
```

### Key Security Features
1. **Multi-stage build**: Compiles assets in `builder` stage, keeping developer toolchains and devDependencies out of the final container.
2. **Non-root user (`node`)**: Runs under UID `1000` to prevent host privilege escalation.
3. **Restricted data volume**: `/app/data` is initialized with `0700` permissions.
4. **Init process (`tini`)**: Properly reaps zombie processes and relays `SIGTERM`/`SIGINT` signals for clean SQLite persistence during container stops.
5. **Built-in Healthcheck**: Monitors `/api/db/status` every 30 seconds.

*For detailed container configuration, see [Docker & Deployment Guide](./docs/docker-deployment.md).*

---

## License

MIT License. Free for personal and commercial use.
