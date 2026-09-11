# REST API Reference

The Expense & Prorated Budget Tracker exposes a standard RESTful HTTP API on internal container port `3000` (mapped to host port **`16001`** under Docker, prefixed with `/api`). All request bodies and responses use standard `application/json`.

---

## 1. System & Database Management

### 1.1 Check Database Health & Stats
- **Method**: `GET /api/db/status`
- **Description**: Returns SQLite engine status, physical file size, and live row counts across all tables.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "engine": "SQLite (sql.js WASM + File Persistence)",
    "databaseFile": "data/budget.sqlite",
    "fileSizeKb": 132,
    "tables": {
      "transactions": 34,
      "categories": 12,
      "prorated_rules": 2,
      "prorated_spends": 4,
      "savings_goals": 0,
      "debts": 2,
      "recurring_items": 2,
      "gulak_pots": 2
    },
    "status": "online",
    "lastSync": "2026-09-04T07:34:47.616Z"
  }
  ```

### 1.2 Reset Database to Clean Zero State
- **Method**: `POST /api/db/reset-to-zero`
- **Description**: Security-protected endpoint that wipes all transactions, debts, goals, and rules, leaving only default system categories and clean zero records. Requires a valid admin password.
- **Request Body**:
  ```json
  {
    "password": "admin123"
  }
  ```
- **Environment Variable**: `RESET_PASSWORD` (defaults to `admin123` if unset)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Database wiped clean: all fake data reset to zero."
  }
  ```

---

## 2. Transactions API

### 2.1 List All Transactions
- **Method**: `GET /api/transactions`
- **Response**: Array of active `Transaction` objects ordered by date descending.

### 2.2 Create Transaction
- **Method**: `POST /api/transactions`
- **Request Body**:
  ```json
  {
    "title": "Grocery Shopping",
    "amount": 1250,
    "type": "expense",
    "category": "food",
    "date": "2026-09-04",
    "tags": ["groceries", "home"],
    "notes": "Weekly vegetable restock",
    "paymentMethod": "credit_card",
    "isRecurring": false
  }
  ```

### 2.3 Update Transaction
- **Method**: `PUT /api/transactions/:id`
- **Request Body**: Partial update object with fields to modify.

### 2.4 Delete Transaction (Soft Delete)
- **Method**: `DELETE /api/transactions/:id`
- **Description**: Moves the transaction from `transactions` to `deleted_transactions` table.

### 2.5 Trash Bin Management
- **`GET /api/deleted-transactions`**: List soft-deleted transactions.
- **`POST /api/deleted-transactions/:id/restore`**: Restore a soft-deleted transaction back to the active ledger.
- **`DELETE /api/deleted-transactions/empty`**: Permanently purge all soft-deleted transactions.

---

## 3. Prorated Budgeting API

### 3.1 Prorated Rules
- **`GET /api/prorated-rules`**: List all prorated daily spend limit rules.
- **`POST /api/prorated-rules`**: Create a new prorated daily rule (`name`, `categoryId`, `targetTags`, `monthlyMaxSpend`, `month`, `rolloverEnabled`, `alertThresholdPercent`).
- **`PUT /api/prorated-rules/:id`**: Update an existing rule or toggle rollover/alert parameters.
- **`DELETE /api/prorated-rules/:id`**: Delete a rule and its logged spends.

### 3.2 Prorated Spends (Dedicated Table)
- **`GET /api/prorated-spends`**: List all isolated spends logged against prorated rules.
- **`POST /api/prorated-spends`**: Log spend for a rule (`ruleId`, `title`, `amount`, `date`, `notes`, `addToMainTransactions`).
- **`DELETE /api/prorated-spends/:id`**: Delete a logged spend.

---

## 4. Savings & Debts API

### 4.1 Savings Goals
- **`GET /api/savings-goals`**: List all active savings goals with contribution history logs.
- **`POST /api/savings-goals`**: Create a savings goal (`name`, `targetAmount`, `currentAmount`, `targetDate`, `icon`, `color`).
- **`POST /api/savings-goals/:id/contributions`**: Deposit or withdraw funds from a goal (`amount`, `note`, `type`).
- **`DELETE /api/savings-goals/:id`**: Delete a savings goal.

### 4.2 Debts & Liabilities
- **`GET /api/debts`**: List all tracked debts with payment history logs.
- **`POST /api/debts`**: Create debt (`name`, `lenderName`, `debtType`, `totalPrincipal`, `interestRate`, `minimumPayment`, `dueDay`).
- **`POST /api/debts/:id/payments`**: Record payment towards principal/interest (`amount`, `principalPaid`, `interestPaid`, `date`, `note`).
- **`DELETE /api/debts/:debtId/payments/:paymentId`**: Delete an individual payment log entry and automatically recalculate remaining balance.
- **`DELETE /api/debts/:id`**: Delete a debt record.

---

## 5. Gulak (Piggy Bank) API

- **`GET /api/gulak/pots`**: List all Gulak micro-savings vaults with banknote deposit history.
- **`POST /api/gulak/pots`**: Create a Gulak pot (`name`, `targetAmount`, `icon`, `color`, `notes`).
- **`POST /api/gulak/pots/:id/drop`**: Drop banknotes (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000) into a Gulak pot.
- **`POST /api/gulak/pots/:id/smash`**: Smash/cash-out a Gulak pot 🔨.
- **`DELETE /api/gulak/pots/:id`**: Delete a Gulak pot.

---

## 6. Recurring Items & Settings API

### 6.1 Recurring Items
- **`GET /api/recurring`**: List recurring templates.
- **`POST /api/recurring`**: Create recurring template (`title`, `amount`, `category`, `frequency`, `dayOfMonth`, `autoApply`).
- **`PUT /api/recurring/:id`**: Update recurring item or toggle `autoApply` status.
- **`POST /api/recurring/apply`**: Execute auto-clone service (`month`, `forceAll`) to clone pending recurring bills into the main ledger.

### 6.2 Settings
- **`GET /api/settings`**: Get user preferences (`currency`, `selectedMonth`, `monthlyBudgetWarningThreshold`, `userName`).
- **`PUT /api/settings`**: Update user preferences.
