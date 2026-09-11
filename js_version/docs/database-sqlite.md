# SQLite Database & Storage Engine

The application is powered by an embedded relational SQLite engine implemented using **sql.js (WebAssembly)** coupled with **atomic binary filesystem persistence** in Node.js.

---

## 1. Storage Architecture

```
                 Application Process
┌──────────────────────────────────────────────────────────┐
│                   Express API Layer                      │
│                           │                              │
│                           ▼                              │
│                 Repository Operations                    │
│            (CRUD + Parameterized Queries)                │
│                           │                              │
│                           ▼                              │
│             In-Memory sql.js (WebAssembly)               │
│                  - Fast B-Tree lookups                   │
│                  - ACID transaction isolation            │
│                           │                              │
│                           ▼ (After every write mutation) │
│                     db.export()                          │
│                           │                              │
│                           ▼                              │
│             Node.js Buffer (Uint8Array)                  │
└───────────────────────────┬──────────────────────────────┘
                            │ Synchronous Atomic Write
                            ▼
               Physical Disk File System
                 /app/data/budget.sqlite
```

### Why sql.js + Native Disk Persistence?
1. **Zero Native C-Compiler Dependencies**: Unlike `better-sqlite3` or `sqlite3`, `sql.js` runs as pure WebAssembly. It does not require `node-gyp`, Python, or C++ build tools inside lightweight Alpine containers.
2. **Crash-Resilient Atomic Writes**: Whenever a `run()` write operation occurs, `db.export()` extracts the full binary state and writes it synchronously to `data/budget.sqlite`.
3. **Container-Ready Volume Mounts**: The physical database resides in `/app/data/budget.sqlite`, allowing seamless mounting of Docker persistent volumes.

---

## 2. Relational Schema Definition

The schema is automatically initialized on first server boot if the database file does not exist:

### 2.1 `categories`
Stores user-defined and standard budget categories.
```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  monthlyBudget REAL DEFAULT 0,
  isCustom INTEGER DEFAULT 0
);
```

### 2.2 `transactions`
Primary financial ledger containing income and expenses.
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,                -- 'expense' | 'income'
  category TEXT NOT NULL,            -- References category ID
  date TEXT NOT NULL,                -- 'YYYY-MM-DD'
  tags TEXT DEFAULT '[]',            -- Serialized JSON array of strings
  notes TEXT,
  paymentMethod TEXT NOT NULL,       -- 'credit_card', 'cash', 'upi', etc.
  isRecurring INTEGER DEFAULT 0,
  recurringFrequency TEXT,
  receiptUrl TEXT,
  proratedRuleId TEXT,               -- Links explicitly to isolated prorated daily budget rule
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `deleted_transactions` (Trash Bin)
Soft-deleted transactions reserved for recovery.
```sql
CREATE TABLE IF NOT EXISTS deleted_transactions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  paymentMethod TEXT NOT NULL,
  isRecurring INTEGER DEFAULT 0,
  recurringFrequency TEXT,
  receiptUrl TEXT,
  proratedRuleId TEXT,
  deleted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 `prorated_rules`
Rules for dynamic daily spend tracking.
```sql
CREATE TABLE IF NOT EXISTS prorated_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId TEXT,
  targetTags TEXT DEFAULT '[]',
  monthlyMaxSpend REAL NOT NULL,
  month TEXT NOT NULL,               -- 'YYYY-MM'
  rolloverEnabled INTEGER DEFAULT 0,
  rolloverAmount REAL DEFAULT 0,
  alertThresholdPercent REAL DEFAULT 100,
  notes TEXT
);
```

### 2.5 `savings_goals` & `savings_history`
```sql
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL DEFAULT 0,
  targetDate TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  category TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS savings_history (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  type TEXT NOT NULL,                -- 'deposit' | 'withdrawal'
  FOREIGN KEY(goalId) REFERENCES savings_goals(id) ON DELETE CASCADE
);
```

### 2.6 `debts` & `debt_payments`
```sql
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lenderName TEXT,
  debtType TEXT DEFAULT 'borrowed',
  totalPrincipal REAL NOT NULL,
  remainingBalance REAL NOT NULL,
  interestRate REAL DEFAULT 0,
  minimumPayment REAL DEFAULT 0,
  dueDay INTEGER DEFAULT 1,
  notes TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debtId TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  principalPaid REAL NOT NULL,
  interestPaid REAL DEFAULT 0,
  note TEXT,
  FOREIGN KEY(debtId) REFERENCES debts(id) ON DELETE CASCADE
);
```

### 2.7 `recurring_items`
```sql
CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,           -- 'monthly', 'weekly', 'yearly'
  dayOfMonth INTEGER DEFAULT 1,
  autoApply INTEGER DEFAULT 1,       -- 1: automatically cloned at month start, 0: manual-only
  tags TEXT DEFAULT '[]',
  paymentMethod TEXT NOT NULL,
  lastAppliedMonth TEXT,             -- 'YYYY-MM' of the most recent month applied (prevents duplicate clones)
  isActive INTEGER DEFAULT 1
);
```

> **Automated Month-Start Cloning**: When the backend `/api/recurring/apply` endpoint runs, it selects active records where `isActive = 1` and `lastAppliedMonth != :month`. If `forceAll` is not set, it additionally filters for `autoApply = 1`. Each matching record is inserted into `transactions` with a date corresponding to the item's `dayOfMonth` in the target month, and `lastAppliedMonth` is updated atomically to avoid duplication.

### 2.8 `user_settings` & `read_alerts`
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  currency TEXT DEFAULT '₹',
  currencyCode TEXT DEFAULT 'INR',
  pushNotificationsEnabled INTEGER DEFAULT 1,
  dailyBudgetAlertThreshold REAL DEFAULT 100,
  monthlyBudgetWarningThreshold REAL DEFAULT 80,
  enableRolloverByDefault INTEGER DEFAULT 1,
  selectedMonth TEXT NOT NULL,
  userName TEXT DEFAULT 'User'
);

CREATE TABLE IF NOT EXISTS read_alerts (
  id TEXT PRIMARY KEY,
  dismissed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2.9 `gulak_pots` & `gulak_entries`
Fully isolated piggy banks and micro-savings logs.
```sql
CREATE TABLE IF NOT EXISTS gulak_pots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetAmount REAL DEFAULT 0,
  currentBalance REAL DEFAULT 0,
  icon TEXT,
  color TEXT,
  notes TEXT,
  isLocked INTEGER DEFAULT 0,
  lockUntilDate TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gulak_entries (
  id TEXT PRIMARY KEY,
  potId TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'deposit' or 'withdraw'
  amount REAL NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  breakdown TEXT DEFAULT '{}',      -- JSON note denomination breakdown e.g. {"500": 2}
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(potId) REFERENCES gulak_pots(id) ON DELETE CASCADE
);
```

### 2.10 `prorated_spends`
Dedicated isolated expenses logged directly against prorated daily limit rules.
```sql
CREATE TABLE IF NOT EXISTS prorated_spends (
  id TEXT PRIMARY KEY,
  ruleId TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  addToMainTransactions INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ruleId) REFERENCES prorated_rules(id) ON DELETE CASCADE
);
```

---

## 3. Database Maintenance & Operations

### 3.1 Live Database Statistics
To inspect active storage metrics via curl (host port 16001):
```bash
curl http://localhost:16001/api/db/status
```

### 3.2 Backup & Export
Because the database is a standard SQLite 3 binary file, you can back it up anytime:
```bash
# Manual CLI copy
cp data/budget.sqlite data/backup-$(date +%Y%m%d).sqlite

# Or via the in-app SQLite Manager Modal:
# Navigate to: Navbar -> Database Status (top right) -> "Download Backup"
```

### 3.3 Security-Protected Reset to Zero
- **Clean Slate**: Call `POST /api/db/reset-to-zero` with your admin password to wipe transactions and start tracking your real personal finances with clean zero state.
