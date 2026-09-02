# 💰 Expense & Prorated Budget Tracker

A full-stack personal finance application and prorated daily budget pacing system built with **React**, **TypeScript**, **Tailwind CSS**, **Express.js**, and an embedded **SQLite** database engine.

---

## 🌟 Highlights & Core Capabilities

- ⏱️ **Prorated Daily Budget Engine**: Break down monthly budgets into dynamic daily spending limits `(Monthly Cap + Rollover) / Days in Month`. Real-time daily allowance tracking, pacing pace indicators, and overspend threshold alerts.
- 🇮🇳 **Default Currency (₹ INR) & Multi-Currency**: Native support for Indian Rupee (`₹` / `INR`) with Indian numbering format (`en-IN`), plus instant switching between `$`, `€`, `£`, `¥`, `C$`, and `A$`.
- 🗄️ **Persistent SQLite Database**: Embedded SQLite database (`data/budget.sqlite`) backed by RESTful API endpoints for resilient local and containerized data persistence.
- 💳 **Complete Transactions Ledger**: Filter by categories, payment methods, transaction types, custom tags, date ranges, and search keywords. Includes CSV import and export with instant statement generation.
- 🔁 **Recurring Bills & Auto-Apply**: Track subscriptions, utilities, and rent with automatic monthly transaction batch generation.
- 🎯 **Savings Goals & Celebrations**: Create milestone vaults, log deposits/withdrawals, track progress percentages, and celebrate completions with interactive confetti.
- 📉 **Debt Payoff & Amortization**: Track student loans, car loans, mortgages, and credit cards with principal vs. interest breakdown and installment history.
- 📊 **Executive Monthly Reports**: Comprehensive financial summaries, savings rates, burn rates, category distributions, and downloadable monthly audit CSVs.
- 🛠️ **SQLite Manager**: Live disk storage inspector, table row counters, database re-seed, zero-state wipe, and demo data loader.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Client (React + Vite)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   ExpenseContext (React State & Sync Engine)     │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │    REST API Client (/src/api/client.ts)          │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼─────────────────────────────┐
│                 Backend (Express.js)                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Routes (server.ts /api/*)            │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │    SQLite Repository Layer (src/server/db.ts)    │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │      data/budget.sqlite (Persistent File)        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
├── docs/                        # Complete Documentation Suite
│   ├── ARCHITECTURE.md          # Technical architecture & state management
│   ├── FEATURES.md              # Deep dive into all 7 views and tool modals
│   ├── PRORATED_BUDGETING_GUIDE.md # Math formulas and pacing logic
│   ├── API_REFERENCE.md         # Full REST API endpoint reference
│   └── DATABASE_SCHEMA.md       # SQLite schema, tables, and relationships
├── src/
│   ├── api/
│   │   └── client.ts            # Client-side API fetch client
│   ├── components/
│   │   ├── modals/              # Action modals (Transaction, Rule, Goal, Debt, etc.)
│   │   ├── views/               # Primary application views (Dashboard, Ledger, etc.)
│   │   └── Navbar.tsx           # Global header with stats & currency selector
│   ├── context/
│   │   └── ExpenseContext.tsx   # React global state provider & sync engine
│   ├── data/
│   │   └── seedData.ts          # Default categories and seed data generators
│   ├── server/
│   │   └── db.ts                # SQLite database repositories and initialization
│   ├── types.ts                 # TypeScript type definitions and interfaces
│   └── utils/
│   │   └── formatters.ts        # Currency, date, and CSV formatting utilities
├── data/
│   └── budget.sqlite            # SQLite database file
├── server.ts                    # Express server & API endpoints
├── index.html                   # Application entry point
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project overview (this file)
```

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Development Mode

Starts both the Vite client and the Express backend on port `3000`:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 3. Production Build

Builds the static assets and bundles the Node backend server:

```bash
npm run build
npm start
```

---

## 📖 Detailed Documentation

For in-depth guides and references, explore the **`docs/`** directory:

- 🏛️ **[System Architecture](docs/ARCHITECTURE.md)**: Full-stack design, component structure, state synchronization, and styling standards.
- 💡 **[Feature Overview](docs/FEATURES.md)**: Detailed breakdown of the Dashboard, Prorated Budgeting, Transactions, Recurring Items, Savings & Debt, and Reports.
- 📐 **[Prorated Budgeting Guide](docs/PRORATED_BUDGETING_GUIDE.md)**: Complete mathematical breakdown of daily allowances, linear vs. dynamic burn rates, and rollover surplus management.
- 🔌 **[REST API Reference](docs/API_REFERENCE.md)**: Specifications for all backend endpoints including payload formats and response examples.
- 🗃️ **[Database Schema](docs/DATABASE_SCHEMA.md)**: SQLite table structures, indexes, column types, and migration rules.

---

## 🧰 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (SQL.js embedded engine with auto-persistence to disk).
- **Tooling**: Vite, esbuild, tsx.

---

## 🔒 Security & Privacy

- All user data is stored locally in the embedded SQLite database on disk (`data/budget.sqlite`).
- No external third-party data tracking or telemetry.
- Support for complete data reset and backup directly from the UI.
