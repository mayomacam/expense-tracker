-- Cloudflare D1 Schema for Expense & Prorated Budget Tracker
-- Engineered with explicit indexes to prevent full-table scans on D1 Free Tier.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  monthlyBudget REAL DEFAULT 0,
  isCustom INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
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
  nature TEXT DEFAULT 'need',
  amortizationMonths INTEGER DEFAULT 1,
  transferFrom TEXT,
  transferTo TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_prorated ON transactions(proratedRuleId);

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
  nature TEXT DEFAULT 'need',
  amortizationMonths INTEGER DEFAULT 1,
  transferFrom TEXT,
  transferTo TEXT,
  deleted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deleted_transactions_date ON deleted_transactions(deleted_at DESC);

CREATE TABLE IF NOT EXISTS prorated_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId TEXT,
  targetTags TEXT DEFAULT '[]',
  monthlyMaxSpend REAL NOT NULL,
  month TEXT NOT NULL,
  rolloverEnabled INTEGER DEFAULT 0,
  rolloverAmount REAL DEFAULT 0,
  alertThresholdPercent REAL DEFAULT 100,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS prorated_spends (
  id TEXT PRIMARY KEY,
  ruleId TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  addToMainTransactions INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prorated_spends_rule ON prorated_spends(ruleId, date DESC);

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
  type TEXT NOT NULL,
  FOREIGN KEY(goalId) REFERENCES savings_goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_savings_history_goal ON savings_history(goalId, date DESC);

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

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debtId, date DESC);

CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  dayOfMonth INTEGER DEFAULT 1,
  autoApply INTEGER DEFAULT 1,
  tags TEXT DEFAULT '[]',
  paymentMethod TEXT NOT NULL,
  lastAppliedMonth TEXT,
  isActive INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  currency TEXT DEFAULT '₹',
  currencyCode TEXT DEFAULT 'INR',
  pushNotificationsEnabled INTEGER DEFAULT 1,
  dailyBudgetAlertThreshold REAL DEFAULT 100,
  monthlyBudgetWarningThreshold REAL DEFAULT 80,
  enableRolloverByDefault INTEGER DEFAULT 1,
  selectedMonth TEXT NOT NULL,
  userName TEXT DEFAULT 'Financial Explorer'
);

CREATE TABLE IF NOT EXISTS read_alerts (
  alertId TEXT PRIMARY KEY
);

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
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  breakdown TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(potId) REFERENCES gulak_pots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gulak_entries_pot ON gulak_entries(potId, date DESC);

-- Persistent Edge Rate Limiting for sensitive administrative/import endpoints
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  windowStart INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(windowStart);
