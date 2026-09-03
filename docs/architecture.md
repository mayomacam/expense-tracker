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
- **State Properties**: `transactions`, `deletedTransactions`, `categories`, `proratedRules`, `savingsGoals`, `debts`, `recurringItems`, `settings`, `readAlertIds`.
- **Derived Real-Time Analytics**:
  - `activeAlerts`: Dynamically generated warnings for categories or prorated rules that exceed safety thresholds.
  - `summary`: Live metrics computing total income, total expense, net balance, and active savings rate.
- **Persistence Syncing**: Every mutation (e.g., `addTransaction`, `updateProratedRule`, `restoreTransaction`) immediately dispatches an HTTP call to the Express backend and optimistically updates the local React state.

### 2. View Hierarchy & Routing
The frontend employs a tab-driven single-page architecture without external router dependencies, ensuring fast rendering inside embedded iframe containers:
- **`DashboardView`**: High-level KPIs, prorated daily limit spend cards, category spending distributions, and recent ledger entries.
- **`TransactionsView`**: Searchable and filterable master ledger with sorting, tagging, and pagination.
- **`ProratedBudgetView`**: Dedicated daily allowance dashboard detailing daily spend targets, cumulative pace charts, and rollover adjustments.
- **`BudgetsAndRecurringView`**: Category-level monthly caps alongside the automated recurring template manager.
- **`SavingsAndDebtView`**: Visual savings progress meters, target timelines, debt payoff balances, and payment schedules.
- **`MonthlyReportView`**: Comprehensive financial summaries with one-click CSV generation and printable PDF financial statements.
- **`CategorySettingsView`**: Category creation, color picker, icon assignment, and budget allocation.
- **`TrashView`**: Soft-deleted transaction inspection and restoration panel.

### 3. Modal Layer
Complex write workflows are encapsulated in dedicated modal dialogs:
- `AddTransactionModal`: Supports dual-mode income/expense, receipt URLs, category tagging, and recurring flags.
- `AddProratedBudgetModal`: Configures daily spend limits with rollover support and customizable pace alert thresholds.
- `AddSavingsGoalModal` & `AddDebtModal`: Guides goal targets and liability amortization.
- `SqliteManagerModal`: Operational dashboard for inspecting SQLite table counts, dumping backups, loading demo data, or resetting to zero.
- `ExportReportModal`: Multi-dimensional report generator for CSV and print formats.

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
    ├── App.tsx                   # Main layout and modal manager
    ├── index.css                 # Global Tailwind CSS entrypoint
    ├── main.tsx                  # React DOM client bootstrap
    ├── types.ts                  # Shared TypeScript interfaces & types
    ├── api/                      # Client API HTTP client functions
    ├── components/
    │   ├── Navbar.tsx            # Header with search, quick actions, and status
    │   ├── Sidebar.tsx           # Primary desktop navigation sidebar
    │   ├── SidebarDrawer.tsx     # Responsive mobile navigation drawer
    │   ├── common/               # Shared badges, category icons, progress meters
    │   ├── modals/               # Modal dialog components
    │   └── views/                # Full-screen tab views
    ├── context/
    │   └── ExpenseContext.tsx    # Global React state and action dispatcher
    ├── data/
    │   └── seedData.ts           # Demo datasets and clean initialization presets
    ├── server/
    │   └── db.ts                 # SQLite schema, repositories, and disk sync
    └── utils/
        ├── budgetCalculations.ts # Daily prorated formulas and pace calculators
        └── formatters.ts         # Currency, dates, and CSV/PDF export helpers
```
