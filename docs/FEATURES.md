# 💡 Application Features & User Guide

A comprehensive feature-by-feature guide for the **Expense & Prorated Budget Tracker**.

---

## 1. 📊 Executive Dashboard (`DashboardView.tsx`)

The central financial command center providing instant visibility into your economic health.

### Key Capabilities:
- **Financial Metric Cards (KPIs)**:
  - **Total Monthly Income**: Aggregation of all income transactions logged in the active month.
  - **Total Monthly Expenses**: Aggregation of all expense transactions logged in the active month.
  - **Net Savings**: `Income - Expenses`, color-coded in green for positive or red for deficit.
  - **Savings Rate Percentage**: `(Net Savings / Income) * 100`.
- **Spotlight Prorated Daily Tracker**: Highlights the primary prorated rule (e.g. Snacks & Treats or Dining Out) with daily limit gauges, today's spend progress, and safe spending ceiling for the day.
- **Spending Pace & Daily Trend**: Linear benchmark vs. cumulative actual spending curve across all calendar days of the month.
- **Category Spending Distribution**: Interactive visual breakdown of where funds are allocated across categories.
- **Recent Transactions Ledger**: Quick snapshot of the most recent 5 records with category badges, payment tags, and one-click edit/delete actions.
- **Quick Action Bar**: Fast launcher buttons to log transactions, create prorated rules, add savings goals, or record debt payments.

---

## 2. ⏱️ Prorated Daily Budget Engine (`ProratedBudgetView.tsx`)

A unique budgeting method that transforms coarse monthly budget limits into actionable daily spending allowances.

### Key Capabilities:
- **Daily Spending Limit Formula**:
  $$\text{Daily Limit} = \frac{\text{Monthly Budget} + \text{Rollover Surplus}}{\text{Days in Selected Month}}$$
- **Day-by-Day Calendar Ledger**:
  - Displays every day in the month from Day 1 to Day 28/30/31.
  - Shows date, day of week, individual day spend, daily limit benchmark, cumulative month-to-date total, and current status (`On Track`, `Over Daily Limit`, or `Under Budget`).
- **Rollover Surplus Management**:
  - Option to roll over leftover unused budget from the previous month into the current month's allowance pool.
- **Pacing & Burn Rate Analytics**:
  - Compares **Linear Expected Spend** (`Current Day * Daily Limit`) against **Actual Spend**.
  - Calculates remaining days in the month and projected end-of-month surplus or overspend.
- **Proactive Threshold Alerts**:
  - Configurable alert trigger percentages (e.g. 80%, 100%, 120%) that notify the user when daily or cumulative limits are exceeded.

---

## 3. 💳 Transactions Ledger & CSV Manager (`TransactionsView.tsx`)

A full-fledged double-entry-style transaction manager with filtering, searching, and bulk data portability.

### Key Capabilities:
- **Multi-Field Filtering**:
  - Filter by Category (e.g. Groceries, Housing, Dining, Snacks, Utilities, etc.).
  - Filter by Transaction Type (`Income` vs. `Expense`).
  - Filter by Payment Method (`Credit Card`, `Debit Card`, `Cash`, `Bank Transfer`, `Digital Wallet`).
  - Filter by Custom Tags (e.g. `#groceries`, `#coffee_break`, `#fixed`, `#treats`).
- **Live Search**: Instant real-time filtering across titles, merchant names, amounts, tags, and transaction notes.
- **Column Sorting**: Sort ascending or descending by Date, Title, Category, or Amount.
- **Pagination**: Clean, responsive table pagination with configurable items-per-page.
- **CSV Export**: One-click generation and download of complete transaction statements in RFC 4180 CSV format.
- **CSV Import**: Upload external bank CSV files with automatic column mapping and validation.
- **Receipt & Note Attachment**: Optional receipt URL and notes field for every transaction record.

---

## 4. 🔁 Budgets & Recurring Bill Automation (`BudgetsAndRecurringView.tsx`)

Manage category-level monthly spending limits and automate predictable recurring commitments.

### Key Capabilities:
- **Category Monthly Spending Caps**:
  - Set specific monthly spending allowances for each category (e.g., ₹15,000 for Housing, ₹6,000 for Groceries).
  - Visual progress bars showing percentage utilized and remaining balance.
  - Warning indicators when spending reaches 80% and overspend flags when reaching 100%+.
- **Recurring Commitment Registry**:
  - Track fixed recurring bills (Rent, Internet, Gym, Cloud Subscriptions, Insurance).
  - Configure billing frequency (`Monthly`, `Weekly`, `Yearly`), due day of month, payment method, and default tags.
- **"Apply Recurring for Month" Batch Generator**:
  - Scans all active recurring items and automatically generates matching transaction records for the active month with a single click.
  - Skips items that have already been applied for the current month to prevent duplicate entries.

---

## 5. 🎯 Savings Goals & Debt Payoff Engine (`SavingsAndDebtView.tsx`)

Track wealth building and debt elimination in a single cohesive view.

### Key Capabilities:
- **Savings Milestone Vaults**:
  - Create targeted savings goals (e.g., Emergency Fund, Vacation, New Laptop, Vehicle Down Payment).
  - Set target monetary amount and target completion date.
  - Log incremental deposits or withdrawals with time-stamped audit history.
  - Interactive confetti celebrations triggered automatically upon reaching 100% of target amount!
- **Debt & Loan Amortization Portfolio**:
  - Track student loans, vehicle financing, mortgages, personal loans, and credit card balances.
  - Track original principal, remaining balance, annual interest rate (APR), and monthly minimum payment.
  - Log installment payments with automated breakdown between **Principal Reduction** and **Interest Paid**.
  - Historical payment ledger with notes and dates.

---

## 6. 📈 Executive Monthly Performance Reports (`MonthlyReportView.tsx`)

In-depth financial retrospective reports and health indicators for any selected calendar month.

### Key Capabilities:
- **Executive Summary Box**: High-level overview summarizing total cash inflow, total outflow, net retained capital, and financial savings efficiency.
- **Burn Rate & Daily Velocity**:
  - Average daily expenditure throughout the month.
  - Peak spending day identification and lowest spending day analysis.
- **Category Allocation Matrix**: Detailed table displaying each category's budget, actual spend, utilization percentage, variance (under/over budget), and percentage share of total monthly expenses.
- **Audit Export**: Download a full executive financial report summary formatted as a structured CSV document.

---

## 7. ⚙️ Category Customization & System Settings (`CategorySettingsView.tsx`)

Configure system preferences, currency formats, and taxonomy.

### Key Capabilities:
- **Custom Categories**: Add new spending or income categories with custom names, vector icon selection, color pickers, and default budgets.
- **Currency Selection**: Switch between **₹ Indian Rupee (Default)**, `$ US Dollar`, `€ Euro`, `£ British Pound`, `¥ Japanese Yen`, `C$ Canadian Dollar`, and `A$ Australian Dollar`.
- **Threshold Configuration**: Adjust daily budget alert thresholds and monthly warning percentages.
- **Notification System**: Enable or disable in-app notifications and browser notification prompts.

---

## 8. 🗄️ SQLite Database Manager (`SqliteManagerModal.tsx`)

A database management tool accessible directly from the application header.

### Key Capabilities:
- **Real-Time Storage Telemetry**: Inspect SQLite database engine version, physical file path, binary storage size on disk, and table row counts.
- **Zero-State Wipe ("Reset All Data to Zero")**: Clears all transactions, savings, debts, and recurring commitments, returning the system to a clean ₹0 slate.
- **Demo Data Loader ("Load Demo Data")**: One-click population of sample transactions, goals, debts, and prorated rules for demonstrations or testing.
- **Manual Table Refresh**: Sync memory cache with disk at any time.
