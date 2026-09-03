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
- **Streamlined Prorated Quick-Spend Logger (`LogProratedSpendModal.tsx`)**:
  - Dedicated lightweight spend logger pre-filled with the selected tracker's name, category, and date.
  - Eliminates the need to navigate through the complex general expense modal for daily prorated spend.
- **1-Click Prorated Tracker Switcher**:
  - Switch between trackers (*Snacks & Treats*, *Travel*, *Food*, etc.) with a single click using the **Sidebar Tracker Menu** or the top **Pill Tab Bar**.
- **Manual Expense Connection & Unlinked Items**:
  - **In-Form Connection**: Select a Prorated Tracker directly from `AddTransactionModal` to automatically link any new or edited transaction.
  - **On-Page Unlinked Items Card**: Visual card on `ProratedBudgetView` listing all unlinked month transactions with 1-click `+ Link to [Tracker]` buttons.
- **Day-by-Day Calendar Ledger**:
  - Displays every day in the month from Day 1 to Day 28/30/31.
  - Shows date, day of week, individual day spend, daily limit benchmark, cumulative month-to-date total, and current status (`Under Limit`, `Exceeded`, or `No Spend`).
  - **1-Click Day Log**: Inline `+ Log Spend` button on every row to record daily spend for that specific date.
  - **1-Click Item Delete**: Delete icon on every listed transaction for instant 1-click removal.
- **Rollover Surplus Management**:
  - Option to roll over leftover unused budget from the previous month into the current month's allowance pool.
- **Pacing & Burn Rate Analytics**:
  - Compares **Linear Expected Spend** (`Current Day * Daily Limit`) against **Actual Spend**.
  - Calculates remaining days in the month and projected end-of-month surplus or overspend.

---

## 3. 📄 PDF & CSV Report Generator (`ExportReportModal.tsx` & `formatters.ts`)

Export comprehensive financial statements and raw data.

### Key Capabilities:
- **Printable PDF Financial Statement**:
  - Generates a styled, printable HTML statement document with executive cashflow totals, prorated tracker status, and itemized ledger.
  - Triggers browser `window.print()` for 1-click PDF download or printing.
- **Multi-Format CSV Exports**:
  - Monthly Comprehensive Statement CSV.
  - All Historical Transactions Raw CSV.
  - Prorated Daily Spending Rules & Rollover CSV.
  - Savings Goals & Debt Repayment Portfolio CSV.

---

## 4. 💳 Transactions Ledger & CSV Manager (`TransactionsView.tsx`)

A full-fledged transaction manager with filtering, searching, and bulk data portability.

### Key Capabilities:
- **Multi-Field Filtering**:
  - Filter by Category (e.g. Groceries, Housing, Dining, Snacks, Utilities, etc.).
  - Filter by Transaction Type (`Income` vs. `Expense`).
  - Filter by Payment Method (`Credit Card`, `Debit Card`, `Cash`, `Bank Transfer`, `Digital Wallet`).
  - Filter by Custom Tags (e.g. `#groceries`, `#coffee_break`, `#fixed`, `#treats`).
- **Live Search**: Instant real-time filtering across titles, merchant names, amounts, tags, and transaction notes.
- **Column Sorting**: Sort ascending or descending by Date, Title, Category, or Amount.
- **CSV Export & Import**: Bulk CSV export and bank CSV import with column mapping.

---

## 5. 🔁 Budgets & Recurring Bill Automation (`BudgetsAndRecurringView.tsx`)

Manage category-level monthly spending limits and automate predictable recurring commitments.

### Key Capabilities:
- **Category Monthly Spending Caps**:
  - Set specific monthly spending allowances for each category.
  - Visual progress bars showing percentage utilized and remaining balance.
- **Recurring Commitment Registry**:
  - Track fixed recurring bills (Rent, Internet, Gym, Cloud Subscriptions, Insurance).
  - "Apply Recurring for Month" batch generator creates month transactions with one click.

---

## 6. 🎯 Savings Goals & Debt Payoff Engine (`SavingsAndDebtView.tsx`)

Track wealth building and debt elimination in a single cohesive view.

### Key Capabilities:
- **Savings Milestone Vaults**: Targeted savings goals with progress tracking and confetti celebrations upon completion.
- **Debt & Loan Amortization Portfolio**: Track loan balances, APR, minimum payments, and principal vs. interest breakdown.

---

## 7. ⚙️ Category Customization & System Settings (`CategorySettingsView.tsx`)

Configure system preferences, currency formats, and taxonomy.

### Key Capabilities:
- **Custom Categories**: Add new spending or income categories with custom vector icons, colors, and default budgets.
- **Multi-Currency Support**: Switch between **₹ Indian Rupee (Default)**, `$ US Dollar`, `€ Euro`, `£ British Pound`, `¥ Japanese Yen`, `C$ Canadian Dollar`, and `A$ Australian Dollar`.

---

## 8. 🗄️ SQLite Database Manager (`SqliteManagerModal.tsx`)

Database management tool accessible directly from the header.

### Key Capabilities:
- **Real-Time Storage Telemetry**: Inspect SQLite database engine version, file path, size on disk, and table row counts.
- **Reset & Demo Loaders**: Reset data to zero or populate demo data with one click.
