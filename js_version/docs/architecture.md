# System Architecture

This document provides a comprehensive overview of the design patterns, software architecture, data flow, multi-view routing, and directory structure of the **Expense & Prorated Budget Tracker**.

---

## Architectural Principles

The application is structured as a **Full-Stack Application** featuring a **Multi-View Client Router** on the frontend, powered by a lightweight Express REST API backend and an embedded SQLite database engine with atomic disk persistence.

```
┌─────────────────────────────────────────────────────────────┐
│                       Web Browser                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │       React 19 Multi-View Router Architecture         │  │
│  │  - Tailwind CSS v4 Presentation Layer                 │  │
│  │  - Recharts Visualization Engine                      │  │
│  │  - ExpenseContext (Centralized Reactive State)        │  │
│  │  - 9 Dedicated Navigation Views (Dashboard, Ledger,   │  │
│  │    Prorated, Budgets, Savings/Debts, Gulak, Reports,  │  │
│  │    Categories, Trash)                                 │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP / REST API (/api/* on Port 16001)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express Server                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    REST Routes                        │  │
│  │  - /api/transactions & /api/deleted-transactions      │  │
│  │  - /api/categories & /api/prorated-rules              │  │
│  │  - /api/prorated-spends                               │  │
│  │  - /api/savings-goals & /api/debts                    │  │
│  │  - /api/gulak/pots                                    │  │
│  │  - /api/recurring & /api/settings                     │  │
│  │  - /api/db/status & /api/db/reset-to-zero             │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ Data Access Layer            │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │               Repository Data Layer                   │  │
│  │  - TransactionRepo / DeletedTransactionRepo           │  │
│  │  - CategoryRepo / ProratedRuleRepo / ProratedSpendRepo│  │
│  │  - SavingsRepo / DebtRepo / GulakRepo / RecurringRepo │  │
│  │  - SettingsRepo / ReadAlertsRepo                      │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ WASM SQL Engine              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                SQLite WASM (sql.js)                   │  │
│  │  - Relational query execution & foreign constraints   │  │
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

## Frontend Multi-View Architecture

### 1. Hash-Based Bookmarkable Routing (9 Distinct Views)
The application provides full client-side navigation and deep linking across 9 independent views by monitoring `window.location.hash`:

| View Route | Component | Purpose & Description |
| :--- | :--- | :--- |
| `/#/dashboard` | `DashboardView` | Summary KPIs (Income, Expense, Surplus), prorated rule daily allowable gauges, category spending distribution, and recent ledger. |
| `/#/transactions` | `TransactionsView` | Full searchable transaction ledger with filters by date/category/tags, CSV export, inline editing, and trash deletion. |
| `/#/prorated` | `ProratedBudgetView` | Daily prorated limit rule manager, live pacing indicators (SAFE/WARNING/OVER), rollover toggles, and dedicated spend logging. |
| `/#/budgets` | `BudgetsAndRecurringView` | Monthly category spending caps with actual progress meters, recurring payment schedules, and auto-clone service controls. |
| `/#/savings-debt` | `SavingsAndDebtView` | Savings goal target meters with deposit/withdrawal timelines, debt payoff amortization, minimum payment alerts, and individual payment log deletion. |
| `/#/gulak` | `GulakView` | Dedicated digital piggy bank vault for micro-savings and spare change. Features banknote drops (₹10–₹2000), denomination tally counters, celebratory confetti, and 🔨 smash piggy bank workflows. |
| `/#/reports` | `MonthlyReportView` | Financial statement generator with monthly breakdowns, CSV export, and printable PDF statements. |
| `/#/categories` | `CategorySettingsView` | Category manager for creating custom spending categories, assigning Lucide icons, color accents, and monthly budget caps. |
| `/#/trash` | `TrashView` | Soft-deleted transaction inspection panel with 1-click restore to ledger or permanent purge. |

Users can navigate using native browser Back/Forward controls, refresh any page without losing state, or bookmark direct views.

---

### 2. Centralized Reactive State (`ExpenseContext`)
All global domain entities and interaction handlers are consolidated in `src/context/ExpenseContext.tsx`:
- **State Properties**: `transactions`, `deletedTransactions`, `categories`, `proratedRules`, `proratedSpends`, `savingsGoals`, `debts`, `gulakPots`, `recurringItems`, `settings`, `readAlertIds`, and `autoCloneStatus`.
- **Derived Real-Time Analytics**:
  - `activeAlerts`: Dynamically generated warnings for categories or prorated rules that exceed safety thresholds.
  - `unreadAlertCount`: Count of unread budget and debt due notifications.
- **Automated Month-Start Recurring Service**:
  - Automatically clones recurring subscriptions and bills into the live SQLite database at the beginning of each month.
  - Evaluates `autoApply` flags per item. Non-duplicating logic guarantees items are cloned at most once per month.
- **Persistence Syncing**: Every mutation dispatches an HTTP call to the Express backend and updates the React state.

---

### 3. Centralized Modal Layer (`ModalContext`)
Write workflows and auxiliary dialogs are coordinated through `ModalContext.tsx` and mounted via `ModalContainer.tsx`:
- Supported modals:
  - `AddTransactionModal`: Income/expense entry, category tagging, recurring flags, and edit mode prefilling.
  - `AddProratedBudgetModal`: Daily spend limits with rollover support and customizable pace alert thresholds.
  - `LogProratedSpendModal`: Dedicated prorated expense logger with optional ledger mirroring toggle.
  - `AddSavingsGoalModal` & `AddDebtModal`: Guided goal targets and liability amortization.
  - `AddGulakPotModal`: Piggy bank creation with target amount, icon, and color.
  - `SqliteManagerModal`: Operational dashboard for inspecting SQLite table counts, dumping backups, loading demo data, or password-protected reset to zero.
  - `ExportReportModal`: Multi-dimensional report generator for CSV and print formats.

---

### 4. UI Resilience & Error Handling
- **`ErrorBoundary`**: Global React component boundary that catches uncaught rendering errors, presenting a recovery action with technical stack details.
- **`AppSkeleton`**: Smooth animated loading skeleton displayed while SQLite records are hydrated on initial load.

---

## Backend Architecture

### 1. Server Entry Point (`server.ts`)
The server listens on internal port `3000` (mapped to host port **`16001`** via Docker):
- **Development Mode (`process.env.NODE_ENV !== 'production'`)**: Mounts Vite in middleware mode (`appType: 'spa'`), allowing hot compilation of TypeScript React components while serving `/api/*` endpoints directly.
- **Production Mode**: Serves the pre-compiled static assets from `/app/dist` and provides fallback routing to `index.html` for single-page client routing.

### 2. Data Access Layer & Repositories (`src/server/db.ts`)
A Repository Pattern isolates business logic from SQL dialect specifics:
- **Query / Execution Abstraction**:
  - `query(sql, params)`: Executes parameterized statements against `sql.js` and maps rows into JavaScript objects.
  - `run(sql, params)`: Executes write mutations and automatically triggers atomic persistence to `data/budget.sqlite`.
- **Repositories**: `transactionRepo`, `deletedTransactionRepo`, `categoryRepo`, `proratedRuleRepo`, `proratedSpendRepo`, `savingsRepo`, `debtRepo`, `gulakRepo`, `recurringRepo`, `settingsRepo`, `readAlertsRepo`.

---

## Project Directory Structure

```
├── .dockerignore                 # Exclusions for container builds
├── Dockerfile                    # Production multi-stage Alpine container
├── docker-compose.yml            # Docker compose configuration (Port 16001:3000)
├── README.md                     # Project overview and quickstart guide
├── package.json                  # Scripts and dependencies
├── server.ts                     # Express server & Vite middleware entrypoint
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite & Tailwind CSS v4 build plugin
├── data/
│   └── budget.sqlite             # Persistent binary SQLite database file
├── docs/
│   ├── api-reference.md          # Full REST endpoint schemas
│   ├── architecture.md           # Multi-view architecture guide (this document)
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
    │   ├── Navbar.tsx            # Header with search, quick actions, theme toggle
    │   ├── Sidebar.tsx           # Primary desktop navigation sidebar (9 tabs)
    │   ├── SidebarDrawer.tsx     # Responsive mobile navigation drawer
    │   ├── common/
    │   │   ├── AppSkeleton.tsx   # Initial hydration skeleton loader
    │   │   ├── CategoryIcon.tsx  # Dynamic Lucide icon mapper
    │   │   ├── ErrorBoundary.tsx # Catch-all React error boundary
    │   │   └── ProgressBar.tsx   # Visual progress indicator
    │   ├── modals/
    │   │   ├── ModalContainer.tsx # Centralized modal switchboard
    │   │   └── ...               # Transaction, Prorated, Goal, Debt, Gulak modals
    │   └── views/                # 9 Full-screen tab views
    ├── context/
    │   ├── ExpenseContext.tsx    # Global React state & recurring auto-clone service
    │   └── ModalContext.tsx      # Modal state dispatcher
    ├── server/
    │   └── db.ts                 # SQLite schema, repositories, and disk sync
    └── utils/
        ├── budgetCalculations.ts # Daily prorated formulas and pace calculators
        └── formatters.ts         # Currency, dates, and CSV/PDF export helpers
```
