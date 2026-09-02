# 🏛️ Technical Architecture Documentation

This document describes the software architecture, design patterns, state management, and persistence layer of the **Expense & Prorated Budget Tracker** application.

---

## 1. High-Level Architectural Overview

The application follows a modern full-stack decoupled architecture running as a single cohesive process:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser / UI Layer                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     React 18 SPA                      │  │
│  │  - Tailwind CSS Styling (Dark Modern UI Palette)      │  │
│  │  - Lucide React Vector Icons                          │  │
│  │  - Responsive Modals & Multi-View Navigation          │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │             ExpenseContext (Global State)             │  │
│  │  - Optimistic UI Updates                              │  │
│  │  - Currency & Math Computation Helpers                │  │
│  │  - Real-time Alert & Notification Dispatches          │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │        API Client Layer (src/api/client.ts)           │  │
│  │  - Standard Fetch wrapper with JSON serialization     │  │
│  │  - Unified error handling and response unwrapping     │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP REST (/api/*)
┌──────────────────────────────▼──────────────────────────────┐
│                  Express.js Backend Server                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               API Controllers (server.ts)             │  │
│  │  - Route validation & HTTP status responses           │  │
│  │  - Express JSON body parser                           │  │
│  │  - Vite Middleware (Dev) / Static Dist Fallback (Prod)│  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │           SQLite Repository Layer (src/server/db.ts)  │  │
│  │  - Prepared SQL statement executions                  │  │
│  │  - In-memory WASM SQL.js runtime                      │  │
│  │  - Atomic disk persistence on write operations        │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │            Physical Storage: data/budget.sqlite       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & Module Decomposition

```
/
├── server.ts                    # Backend entry point, API routes, Vite middleware
├── src/
│   ├── main.tsx                 # React DOM mount entry
│   ├── App.tsx                  # Root shell, Navbar, Tab routers & Global Modals
│   ├── types.ts                 # TypeScript domain types, enums & interfaces
│   ├── index.css                # Global Tailwind CSS imports & theme definitions
│   │
│   ├── api/
│   │   └── client.ts            # Typed HTTP client for interacting with backend
│   │
│   ├── context/
│   │   └── ExpenseContext.tsx   # React global state provider, hooks & sync logic
│   │
│   ├── data/
│   │   └── seedData.ts          # Default category catalog & seed data generators
│   │
│   ├── server/
│   │   └── db.ts                # SQLite schema DDL, repository methods & persistence
│   │
│   ├── utils/
│   │   └── formatters.ts        # Currency (en-IN / en-US), dates, CSV generators
│   │
│   └── components/
│       ├── Navbar.tsx           # Navigation bar, quick-add buttons & currency switcher
│       │
│       ├── views/               # Primary screen views
│       │   ├── DashboardView.tsx          # Executive dashboard, KPIs, charts
│       │   ├── ProratedBudgetView.tsx     # Prorated daily limit tracker & rules
│       │   ├── TransactionsView.tsx       # Searchable & filterable transaction ledger
│       │   ├── BudgetsAndRecurringView.tsx # Category budget caps & recurring bills
│       │   ├── SavingsAndDebtView.tsx     # Savings milestone vaults & loan amortization
│       │   ├── MonthlyReportView.tsx      # Comprehensive monthly financial audits
│       │   └── CategorySettingsView.tsx   # Custom category manager & system options
│       │
│       └── modals/              # Action modals
│           ├── AddTransactionModal.tsx    # Transaction creator / editor
│           ├── AddProratedRuleModal.tsx   # Prorated rule creator / editor
│           ├── AddSavingsGoalModal.tsx    # Savings goal creator / deposit logger
│           ├── AddDebtModal.tsx           # Debt portfolio creator / payment logger
│           ├── AddRecurringModal.tsx      # Recurring bill creator / editor
│           ├── CategoryModal.tsx          # Custom category creator
│           ├── CsvImportExportModal.tsx   # Transaction bulk CSV import & export
│           ├── SqliteManagerModal.tsx     # Database table inspector & zero-reset
│           └── NotificationCenterModal.tsx# In-app budget warning alerts
```

---

## 3. State Management & Lifecycle

### Global Context (`ExpenseContext.tsx`)
The application manages global state through a single comprehensive React Context (`ExpenseContext`):
- **Initial Load**: On component mount, the context dispatches requests to `api.getDbStats()`, `api.getTransactions()`, `api.getCategories()`, `api.getProratedRules()`, `api.getSavingsGoals()`, `api.getDebts()`, `api.getRecurring()`, and `api.getSettings()`.
- **Atomic Operations**: Any user mutation (e.g. adding a transaction, updating a category budget, making a loan payment) updates the SQLite database through the backend API and immediately refreshes the local state.
- **Computed Indicators**: Derived values (e.g. total monthly spending, daily burn rate, rollover balance, savings percentage) are memoized and computed on the fly based on the currently selected month (`selectedMonth`).

---

## 4. SQLite Persistence Engine

### Embedded Engine Design (`src/server/db.ts`)
The server uses `sql.js` (WebAssembly-based SQLite engine) running directly within the Node.js process:
1. **File Bootstrapping**: At server startup, `initDatabase()` checks for the existence of `data/budget.sqlite`. If present, it loads the binary buffer into memory; if absent, it creates the database and initializes all table schemas.
2. **Atomic Write-through Persistence**: Every write operation (INSERT, UPDATE, DELETE) executes the SQL statement and immediately invokes `persistDb()`, which exports the binary database buffer to disk atomically:
   ```typescript
   export function persistDb(): void {
     if (!db) return;
     const data = db.export();
     const buffer = Buffer.from(data);
     fs.writeFileSync(DB_FILE, buffer);
   }
   ```
3. **Resilience**: The database file is safely housed in the root `/data` directory, guaranteeing full persistence across container restarts or local restarts.

---

## 5. Styling & Visual Design Guidelines

- **Palette**: Sophisticated dark-mode palette using deep zinc/neutral tones (`#09090b`, `#121216`, `#18181b`), accented by vibrant semantic highlights:
  - Lime Green (`#c1ff72`) for income, surplus, and healthy financial pacing.
  - Emerald Green (`#10b981`) for savings goals and positive balances.
  - Coral / Amber (`#f59e0b` / `#ff5f5f`) for budget warning thresholds and overspend alerts.
  - Indigo / Violet (`#6366f1` / `#8b5cf6`) for loans, debts, and structural metrics.
- **Typography**: High legibility sans-serif with monospace accents for numbers and currency amounts.
- **Micro-interactions**: Subtle hover state transitions, spring animations, and celebratory confetti for milestone completions.
