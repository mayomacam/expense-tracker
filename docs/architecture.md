# System Architecture

This document provides a comprehensive overview of the design patterns, software architecture, data flow, and directory structure of the **Expense & Prorated Budget Tracker**.

---

## Architectural Principles

The application is structured as a **Full-Stack Single-Page Application (SPA)** with an integrated Express server serving as both the REST API host and the Vite static asset server.

```
┌─────────────────────────────────────────────────────────────┐
│                       Web Browser                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     React 19                          │  │
│  │  - Tailwind CSS v4 Presentation Layer                 │  │
│  │  - Recharts Visualization Engine                      │  │
│  │  - ExpenseContext (Centralized Reactive State)        │  │
│  │  - Custom Hooks & Mathematical Prorated Calculators   │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP / REST API (/api/*)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express Server                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    REST Routes                        │  │
│  │  - /api/transactions & /api/deleted-transactions      │  │
│  │  - /api/categories & /api/prorated-rules              │  │
│  │  - /api/savings-goals & /api/debts                    │  │
│  │  - /api/recurring & /api/settings                     │  │
│  │  - /api/db/status & /api/db/reset                     │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ Data Access Layer            │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │               Repository Data Layer                   │  │
│  │  - TransactionRepo / DeletedTransactionRepo           │  │
│  │  - CategoryRepo / ProratedRuleRepo                    │  │
│  │  - SavingsRepo / DebtRepo / RecurringRepo             │  │
│  │  - SettingsRepo / ReadAlertsRepo                      │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ WASM SQL Engine              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                SQLite WASM (sql.js)                   │  │
│  │  - In-memory relational query execution               │  │
│  │  - Atomic binary export upon write mutations          │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ Synchronous Buffer Write
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Local Filesystem                        │
│                 /app/data/budget.sqlite                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### 1. Centralized Reactive State (`ExpenseContext`)
All global domain entities and interaction handlers are consolidated in `src/context/ExpenseContext.tsx`:
- **State Properties**: `transactions`, `deletedTransactions`, `categories`, `proratedRules`, `savingsGoals`, `debts`, `recurringItems`, `settings`, `readAlertIds`, and `autoCloneStatus`.
- **Derived Real-Time Analytics**:
  - `activeAlerts`: Dynamically generated warnings for categories or prorated rules that exceed safety thresholds.
  - `summary`: Live metrics computing total income, total expense, net balance, and active savings rate.
- **Automated Month-Start Recurring Service**:
  - Automatically clones recurring subscriptions and bills into the live SQLite database at the beginning of each month.
  - **Lifecycle Triggers**: Executes on initial application hydration, checks every 30 seconds for calendar month rollovers, and re-verifies whenever the browser tab re-gains focus via `visibilitychange`.
  - **Item-Level Control**: Evaluates `autoApply` flags per item. Non-duplicating logic guarantees items are cloned at most once per month.
- **Persistence Syncing**: Every mutation (e.g., `addTransaction`, `updateProratedRule`, `restoreTransaction`) immediately dispatches an HTTP call to the Express backend and optimistically updates the local React state.

### 2. Hash-Based Bookmarkable Routing
The application provides full client-side navigation without external routing libraries by listening to `window.location.hash`:
- **Route Mapping**:
  - `/#/dashboard` → `DashboardView`: KPIs, prorated daily limit cards, category distributions, recent ledger.
  - `/#/transactions` → `TransactionsView`: Searchable, filterable master ledger with sorting and tagging.
  - `/#/prorated` → `ProratedBudgetView`: Daily spend limits, pace indicators, and cumulative charts.
  - `/#/budgets` → `BudgetsAndRecurringView`: Category caps, recurring subscriptions, and auto-clone service controls.
  - `/#/savings-debt` → `SavingsAndDebtView`: Savings target progress meters and debt payment amortization.
  - `/#/reports` → `MonthlyReportView`: Financial summaries with CSV generation and printable PDF statements.
  - `/#/categories` → `CategorySettingsView`: Custom category creation, icon assignment, and budget allocation.
  - `/#/trash` → `TrashView`: Two-stage soft-deleted transaction inspection and restoration panel.
- **Browser History Support**: Users can navigate using native browser Back/Forward buttons, refresh without losing context, or bookmark direct views.

### 3. Centralized Modal Layer (`ModalContext`)
Write workflows and auxiliary dialogs are coordinated through `ModalContext.tsx` and mounted via `ModalContainer.tsx`:
- Decouples modal open/close state from view layouts, eliminating prop drilling.
- Supported modals:
  - `AddTransactionModal`: Dual-mode income/expense, receipt URLs, category tagging, and recurring flags.
  - `AddProratedBudgetModal`: Daily spend limits with rollover support and customizable pace alert thresholds.
  - `AddSavingsGoalModal` & `AddDebtModal`: Guided goal targets and liability amortization.
  - `SqliteManagerModal`: Operational dashboard for inspecting SQLite table counts, dumping backups, loading demo data, or resetting to zero.
  - `ExportReportModal`: Multi-dimensional report generator for CSV and print formats.

### 4. UI Resilience & Error Handling
- **`ErrorBoundary`**: Global React component boundary that catches uncaught rendering errors, preventing white-screen crashes and presenting a recovery action with technical stack details.
- **`AppSkeleton`**: Smooth animated loading skeleton displayed while SQLite records are hydrated on initial load, preventing visual layout shifts.

---

## Backend Architecture

### 1. Server Entry Point (`server.ts`)
The server operates in two distinct execution modes:
- **Development Mode (`process.env.NODE_ENV !== 'production'`)**: Mounts Vite in middleware mode (`appType: 'spa'`), allowing hot compilation of TypeScript React components while serving `/api/*` endpoints directly.
- **Production Mode**: Serves the pre-compiled static assets from `/app/dist` and provides fallback routing to `index.html` for single-page client routing.

### 2. Data Access Layer & Repositories (`src/server/db.ts`)
A clean Repository Pattern isolates business logic from SQL dialect specifics:
- **Query / Execution Abstraction**:
  - `query(sql, params)`: Executes parameterized statements against `sql.js` and maps rows into JavaScript objects.
  - `run(sql, params)`: Executes write mutations and automatically triggers atomic persistence to `data/budget.sqlite`.
- **Atomic Disk Synchronization**:
  ```ts
  function persistDb() {
    if (!db) return;
    const data = db.export(); // Binary SQLite buffer
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  }
  ```

---

## Project Directory Structure

```
├── .dockerignore                 # Exclusions for container builds
├── Dockerfile                    # Production multi-stage Alpine container
├── README.md                     # Project overview and quickstart guide
├── metadata.json                 # AI Studio configuration manifest
├── package.json                  # Scripts and dependencies
├── server.ts                     # Express server & Vite middleware entrypoint
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite & Tailwind CSS v4 build plugin
├── data/
│   └── budget.sqlite             # Persistent binary SQLite database file
├── docs/
│   ├── api-reference.md          # Full REST endpoint schemas
│   ├── architecture.md           # System architecture (this document)
│   ├── database-sqlite.md        # Relational schema and queries
│   ├── docker-deployment.md      # Containerization and production guide
│   └── prorated-budgeting.md     # Daily limit formula and pace mechanics
└── src/
    ├── App.tsx                   # Main layout and hash routing coordinator
    ├── index.css                 # Global Tailwind CSS entrypoint
    ├── main.tsx                  # React DOM bootstrap wrapped with ErrorBoundary
    ├── types.ts                  # Shared TypeScript interfaces & types
    ├── api/                      # Client API HTTP client functions
    ├── components/
    │   ├── Navbar.tsx            # Header with search, quick actions, and status
    │   ├── Sidebar.tsx           # Primary desktop navigation sidebar
    │   ├── SidebarDrawer.tsx     # Responsive mobile navigation drawer
    │   ├── common/
    │   │   ├── AppSkeleton.tsx   # Initial hydration skeleton loader
    │   │   ├── CategoryIcon.tsx  # Dynamic Lucide icon mapper
    │   │   ├── ErrorBoundary.tsx # Catch-all React error boundary
    │   │   └── ProgressBar.tsx   # Visual progress indicator
    │   ├── modals/
    │   │   ├── ModalContainer.tsx # Centralized modal switchboard
    │   │   └── ...               # Transaction, Prorated, Goal, Debt modals
    │   └── views/                # Full-screen tab views
    ├── context/
    │   ├── ExpenseContext.tsx    # Global React state & recurring auto-clone service
    │   └── ModalContext.tsx      # Modal state dispatcher
    ├── data/
    │   └── seedData.ts           # Demo datasets and clean initialization presets
    ├── server/
    │   └── db.ts                 # SQLite schema, repositories, and disk sync
    └── utils/
        ├── budgetCalculations.ts # Daily prorated formulas and pace calculators
        └── formatters.ts         # Currency, dates, and CSV/PDF export helpers
```
