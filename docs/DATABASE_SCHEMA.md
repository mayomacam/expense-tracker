# 🗃️ SQLite Database Schema Reference

The **Expense & Prorated Budget Tracker** persists data using an embedded SQLite database (`data/budget.sqlite`). Below is the complete relational schema, table structures, column definitions, and constraint specifications.

---

## 1. Relational Entity Relationship Diagram (ERD)

```
┌──────────────────────────┐         ┌──────────────────────────┐
│        categories        │         │       user_settings      │
├──────────────────────────┤         ├──────────────────────────┤
│ id (PK)                  │         │ id (PK)                  │
│ name                     │         │ currency                 │
│ icon                     │         │ currencyCode             │
│ color                    │         │ pushNotificationsEnabled │
│ monthlyBudget            │         │ dailyBudgetAlertThreshold│
│ isCustom                 │         │ monthlyBudgetWarning...  │
└────────────┬─────────────┘         │ enableRolloverByDefault  │
             │                       │ selectedMonth            │
             │ 1:N                   │ userName                 │
             ▼                       └──────────────────────────┘
┌──────────────────────────┐
│       transactions       │         ┌──────────────────────────┐
├──────────────────────────┤         │      prorated_rules      │
│ id (PK)                  │         ├──────────────────────────┤
│ title                    │         │ id (PK)                  │
│ amount                   │         │ name                     │
│ type                     │         │ categoryId (FK)          │
│ category (FK)            │         │ targetTags (JSON)        │
│ date                     │         │ monthlyMaxSpend          │
│ tags (JSON)              │         │ month                    │
│ notes                    │         │ rolloverEnabled          │
│ paymentMethod            │         │ rolloverAmount           │
│ isRecurring              │         │ alertThresholdPercent    │
│ recurringFrequency       │         │ notes                    │
│ receiptUrl               │         └──────────────────────────┘
│ createdAt                │
└──────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│      savings_goals       │ 1:N     │     savings_history      │
├──────────────────────────┤────────►├──────────────────────────┤
│ id (PK)                  │         │ id (PK)                  │
│ name                     │         │ goalId (FK)              │
│ targetAmount             │         │ date                     │
│ currentAmount            │         │ amount                   │
│ targetDate               │         │ note                     │
│ icon                     │         │ type (deposit/withdraw)  │
│ color                    │         └──────────────────────────┘
│ category                 │
│ notes                    │
└──────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│          debts           │ 1:N     │      debt_payments       │
├──────────────────────────┤────────►├──────────────────────────┤
│ id (PK)                  │         │ id (PK)                  │
│ name                     │         │ debtId (FK)              │
│ totalPrincipal           │         │ date                     │
│ remainingBalance         │         │ amount                   │
│ interestRate             │         │ principalPaid            │
│ minimumPayment           │         │ interestPaid             │
│ dueDay                   │         │ note                     │
│ notes                    │         └──────────────────────────┘
│ color                    │
└──────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│     recurring_items      │         │       read_alerts        │
├──────────────────────────┤         ├──────────────────────────┤
│ id (PK)                  │         │ id (PK)                  │
│ title                    │         │ ruleId                   │
│ amount                   │         │ date                     │
│ type                     │         │ acknowledgedAt           │
│ category (FK)            │         └──────────────────────────┘
│ frequency                │
│ dayOfMonth               │
│ autoApply                │
│ tags (JSON)              │
│ paymentMethod            │
│ lastAppliedMonth         │
│ isActive                 │
└──────────────────────────┘
```

---

## 2. Table Specifications

### A. `transactions`
Records all individual income and expense line items.
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,                -- 'income' | 'expense'
  category TEXT NOT NULL,            -- category id or custom name
  date TEXT NOT NULL,                -- 'YYYY-MM-DD'
  tags TEXT,                         -- JSON array of strings e.g. '["snacks", "coffee"]'
  notes TEXT,
  paymentMethod TEXT DEFAULT 'credit_card', -- 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet'
  isRecurring INTEGER DEFAULT 0,     -- boolean 0 or 1
  recurringFrequency TEXT,           -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  receiptUrl TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### B. `categories`
Stores default and user-created spending and income categories with monthly budget caps.
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

### C. `prorated_rules`
Defines dynamic daily pacing limits and tags/category mappings.
```sql
CREATE TABLE IF NOT EXISTS prorated_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId TEXT,
  targetTags TEXT,                   -- JSON array of strings
  monthlyMaxSpend REAL NOT NULL,
  month TEXT NOT NULL,               -- 'YYYY-MM'
  rolloverEnabled INTEGER DEFAULT 1,
  rolloverAmount REAL DEFAULT 0,
  alertThresholdPercent REAL DEFAULT 100,
  notes TEXT
);
```

### D. `savings_goals` & `savings_history`
Manages milestone savings targets and individual transaction logs.
```sql
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL DEFAULT 0,
  targetDate TEXT NOT NULL,           -- 'YYYY-MM-DD'
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
  type TEXT DEFAULT 'deposit',       -- 'deposit' | 'withdraw'
  FOREIGN KEY (goalId) REFERENCES savings_goals(id) ON DELETE CASCADE
);
```

### E. `debts` & `debt_payments`
Manages liabilities, loans, and historical amortization payments.
```sql
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  totalPrincipal REAL NOT NULL,
  remainingBalance REAL NOT NULL,
  interestRate REAL DEFAULT 0,       -- Annual Percentage Rate (APR) e.g. 5.5
  minimumPayment REAL DEFAULT 0,
  dueDay INTEGER DEFAULT 1,          -- 1 - 31
  notes TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debtId TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  principalPaid REAL NOT NULL,
  interestPaid REAL NOT NULL,
  note TEXT,
  FOREIGN KEY (debtId) REFERENCES debts(id) ON DELETE CASCADE
);
```

### F. `recurring_items`
Tracks automated recurring bills and subscriptions.
```sql
CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,                -- 'expense' | 'income'
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,           -- 'monthly' | 'weekly' | 'yearly'
  dayOfMonth INTEGER NOT NULL,       -- 1 - 31
  autoApply INTEGER DEFAULT 1,
  tags TEXT,                         -- JSON array
  paymentMethod TEXT DEFAULT 'credit_card',
  lastAppliedMonth TEXT,             -- 'YYYY-MM'
  isActive INTEGER DEFAULT 1
);
```

### G. `user_settings`
Persists user preferences, currency symbols, and notification thresholds.
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  currency TEXT DEFAULT '₹',
  currencyCode TEXT DEFAULT 'INR',
  pushNotificationsEnabled INTEGER DEFAULT 1,
  dailyBudgetAlertThreshold REAL DEFAULT 100,
  monthlyBudgetWarningThreshold REAL DEFAULT 80,
  enableRolloverByDefault INTEGER DEFAULT 1,
  selectedMonth TEXT,
  userName TEXT DEFAULT 'Financial Explorer'
);
```

---

## 3. Database Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_savings_hist_goal ON savings_history(goalId);
CREATE INDEX IF NOT EXISTS idx_debt_pay_debt ON debt_payments(debtId);
CREATE INDEX IF NOT EXISTS idx_prorated_month ON prorated_rules(month);
```
