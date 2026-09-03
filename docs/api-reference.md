# REST API Reference

The Expense & Prorated Budget Tracker exposes a standard RESTful HTTP API on port `3000` (prefixed with `/api`). All request bodies and responses use standard `application/json`.

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
    "fileSizeKb": 92,
    "tables": {
      "transactions": 24,
      "categories": 12,
      "prorated_rules": 2,
      "savings_goals": 3,
      "debts": 1,
      "recurring_items": 4
    },
    "status": "online",
    "lastSync": "2026-09-03T08:48:17.041Z"
  }
  ```

### 1.2 Reset Database to Clean Zero State
- **Method**: `POST /api/db/reset` (or `POST /api/db/reset-to-zero`)
- **Description**: Wipes all transactions, debts, goals, and rules, leaving only default system categories and clean user preferences.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Database reset to clean zero records in SQLite."
  }
  ```

### 1.3 Load Sample Demo Dataset
- **Method**: `POST /api/db/load-demo`
- **Description**: Populates rich demonstration records (realistic transactions, prorated grocery/dining limits, recurring subscriptions, and debt entries).
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Loaded demo dataset into SQLite."
  }
  ```

---

## 2. Transactions API

### 2.1 List All Transactions
- **Method**: `GET /api/transactions`
- **Description**: Returns all non-deleted transactions ordered by date descending.
- **Response**: `200 OK` (Array of Transaction objects)
  ```json
  [
    {
      "id": "tx-1",
      "title": "Grocery Market",
      "amount": 2450.50,
      "type": "expense",
      "category": "groceries",
      "date": "2026-09-02",
      "tags": ["supermarket", "organic"],
      "notes": "Weekly produce and dairy",
      "paymentMethod": "credit_card",
      "isRecurring": false,
      "recurringFrequency": null,
      "receiptUrl": null,
      "created_at": "2026-09-02 14:20:00"
    }
  ]
  ```

### 2.2 Create a Transaction
- **Method**: `POST /api/transactions`
- **Request Body**:
  ```json
  {
    "title": "Freelance Client Payment",
    "amount": 45000,
    "type": "income",
    "category": "freelance",
    "date": "2026-09-03",
    "tags": ["web-dev", "client-a"],
    "paymentMethod": "bank_transfer",
    "isRecurring": false
  }
  ```
- **Response**: `201 Created`

### 2.3 Bulk Import Transactions
- **Method**: `POST /api/transactions/import`
- **Request Body**: `{ "transactions": [ ... ] }`
- **Response**: `201 Created` with `{ "success": true, "count": N }`

### 2.4 Update Transaction
- **Method**: `PUT /api/transactions/:id`
- **Request Body**: Partial or full fields of a Transaction.
- **Response**: `200 OK`

### 2.5 Soft-Delete Transaction (Move to Trash)
- **Method**: `DELETE /api/transactions/:id`
- **Description**: Moves record from `transactions` table into `deleted_transactions` table.
- **Response**: `200 OK`

---

## 3. Trash Bin (Recovery) API

### 3.1 List Deleted Transactions
- **Method**: `GET /api/deleted-transactions`
- **Description**: Returns all soft-deleted records sorted by `deleted_at DESC`.
- **Response**: `200 OK`

### 3.2 Restore Deleted Transaction
- **Method**: `POST /api/deleted-transactions/:id/restore`
- **Description**: Moves record back into `transactions` table and removes it from the trash bin.
- **Response**: `200 OK`

### 3.3 Permanently Empty Trash
- **Method**: `DELETE /api/deleted-transactions`
- **Description**: Permanently purges all records in `deleted_transactions`.
- **Response**: `200 OK` with `{ "success": true, "message": "Trash bin emptied clean." }`

---

## 4. Categories API

### 4.1 List Categories
- **Method**: `GET /api/categories`
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "cat-food",
      "name": "Food & Dining",
      "icon": "Utensils",
      "color": "#F97316",
      "monthlyBudget": 18000,
      "isCustom": false
    }
  ]
  ```

### 4.2 Create Category
- **Method**: `POST /api/categories`
- **Request Body**:
  ```json
  {
    "name": "Subscriptions",
    "icon": "Tv",
    "color": "#8B5CF6",
    "monthlyBudget": 2500
  }
  ```
- **Response**: `201 Created`

### 4.3 Update Category
- **Method**: `PUT /api/categories/:id`
- **Response**: `200 OK`

### 4.4 Delete Category
- **Method**: `DELETE /api/categories/:id`
- **Response**: `200 OK`

---

## 5. Prorated Budget Rules API

### 5.1 List Rules
- **Method**: `GET /api/prorated-rules`
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "rule-groceries",
      "name": "Daily Grocery Cap",
      "categoryId": "groceries",
      "targetTags": ["food", "groceries"],
      "monthlyMaxSpend": 15000,
      "month": "2026-09",
      "rolloverEnabled": true,
      "rolloverAmount": 450,
      "alertThresholdPercent": 100,
      "notes": "Prorated limit for produce & supermarket supplies"
    }
  ]
  ```

### 5.2 Create Prorated Rule
- **Method**: `POST /api/prorated-rules`
- **Request Body**:
  ```json
  {
    "name": "Weekend Leisure",
    "categoryId": "entertainment",
    "monthlyMaxSpend": 8000,
    "month": "2026-09",
    "rolloverEnabled": true,
    "alertThresholdPercent": 95
  }
  ```
- **Response**: `201 Created`

### 5.3 Update Prorated Rule
- **Method**: `PUT /api/prorated-rules/:id`
- **Response**: `200 OK`

### 5.4 Delete Prorated Rule
- **Method**: `DELETE /api/prorated-rules/:id`
- **Response**: `200 OK`

---

## 6. Savings Goals API

### 6.1 List Savings Goals
- **Method**: `GET /api/savings-goals`
- **Response**: `200 OK` (includes embedded `history` array)

### 6.2 Record Contribution / Withdrawal
- **Method**: `POST /api/savings-goals/:id/contributions`
- **Request Body**:
  ```json
  {
    "amount": 5000,
    "type": "deposit",
    "note": "Transferred from bonus payout"
  }
  ```
- **Response**: `201 Created` (returns updated goal object)

---

## 7. Debt Paydown API

### 7.1 List Debts
- **Method**: `GET /api/debts`
- **Response**: `200 OK` (includes embedded `payments` array)

### 7.2 Record Debt Payment
- **Method**: `POST /api/debts/:id/payments`
- **Request Body**:
  ```json
  {
    "amount": 12000,
    "principalPaid": 10500,
    "interestPaid": 1500,
    "note": "September EMI installment"
  }
  ```
- **Response**: `201 Created` (updates `remainingBalance` and returns updated debt object)

---

## 8. Recurring Items Engine

### 8.1 List Recurring Templates
- **Method**: `GET /api/recurring`
- **Response**: `200 OK` (Array of recurring item objects including `autoApply`, `dayOfMonth`, `lastAppliedMonth`, and `isActive`)

### 8.2 Create Recurring Item
- **Method**: `POST /api/recurring`
- **Request Body**:
  ```json
  {
    "title": "Internet Fiber Broadband",
    "amount": 1199,
    "type": "expense",
    "category": "utilities",
    "frequency": "monthly",
    "dayOfMonth": 5,
    "autoApply": true,
    "paymentMethod": "credit_card",
    "tags": ["recurring", "wifi"]
  }
  ```
- **Response**: `201 Created`

### 8.3 Update Recurring Item & Auto-Clone Toggle
- **Method**: `PUT /api/recurring/:id`
- **Request Body**: Partial object of fields to update (e.g. `{ "autoApply": false }` or `{ "amount": 1299 }`)
- **Response**: `200 OK` (returns updated recurring object)

### 8.4 Delete Recurring Item
- **Method**: `DELETE /api/recurring/:id`
- **Response**: `200 OK` (`{ "success": true, "id": "..." }`)

### 8.5 Automated Month-Start & Manual Clone Service
- **Method**: `POST /api/recurring/apply`
- **Request Body**:
  ```json
  {
    "month": "2026-09",
    "forceAll": false
  }
  ```
  - `month` *(string, optional)*: Target billing month in `YYYY-MM` format. Defaults to the current calendar month if omitted.
  - `forceAll` *(boolean, optional)*:
    - When `false` (default): Only items with `autoApply: true` (or not explicitly false) and `isActive: true` that have not yet been applied for `month` are cloned into `transactions`.
    - When `true`: Bypasses the `autoApply` filter and clones **all** active recurring items that have not yet been applied for `month`.
- **Deduplication Logic**: Compares `lastAppliedMonth` against `month`. If an item was already applied for the specified month, it is automatically skipped to prevent double-billing.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "addedCount": 3,
    "month": "2026-09",
    "clonedTitles": [
      "Internet Fiber Broadband",
      "Netflix Subscription",
      "Health Insurance Premium"
    ]
  }
  ```

---

## 9. User Settings & Alerts

### 9.1 Get Settings
- **Method**: `GET /api/settings`
- **Response**: `200 OK`

### 9.2 Update Settings
- **Method**: `PUT /api/settings`
- **Request Body**: Updates currency symbol, thresholds, or default view.
- **Response**: `200 OK`

### 9.3 Notification Alert State
- `GET /api/alerts/read` — List IDs of dismissed alerts.
- `POST /api/alerts/read` — Dismiss single alert `{ "alertId": "..." }`.
- `POST /api/alerts/read/all` — Dismiss multiple alerts `{ "alertIds": [...] }`.
- `DELETE /api/alerts/read` — Reset dismissed alerts.
