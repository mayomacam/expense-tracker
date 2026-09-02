# 🔌 REST API Reference

The backend exposes a comprehensive set of RESTful JSON endpoints under the `/api` prefix. All payloads and responses are encoded in standard `application/json`.

---

## 1. System & Database Endpoints

### `GET /api/health`
Checks server status and uptime.
- **Response**: `200 OK`
  ```json
  { "status": "ok" }
  ```

### `GET /api/db/status`
Retrieves physical SQLite database metrics, engine status, and table row counts.
- **Response**: `200 OK`
  ```json
  {
    "dbType": "sqlite",
    "engine": "sql.js (WebAssembly)",
    "fileSizeKb": 48.0,
    "dbPath": "data/budget.sqlite",
    "tables": {
      "transactions": 0,
      "categories": 12,
      "prorated_rules": 0,
      "savings_goals": 0,
      "savings_history": 0,
      "debts": 0,
      "debt_payments": 0,
      "recurring_items": 0,
      "user_settings": 1,
      "read_alerts": 0
    },
    "lastSync": "2026-09-02T14:50:00.000Z"
  }
  ```

### `POST /api/db/reset-to-zero`
Clears all transactions, savings, debts, and recurring commitments, resetting the database to a clean zero state with default categories.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Database wiped clean: all fake data reset to zero."
  }
  ```

### `POST /api/db/load-demo`
Populates sample demo transactions, goals, debts, and recurring items for testing and demonstration.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Loaded demo dataset into SQLite."
  }
  ```

---

## 2. Transactions API

### `GET /api/transactions`
Returns an array of all recorded transactions.
- **Response**: `200 OK` `Transaction[]`

### `POST /api/transactions`
Creates a new transaction record.
- **Request Body**:
  ```json
  {
    "id": "tx-123456",
    "title": "Groceries at Supermarket",
    "amount": 145.50,
    "type": "expense",
    "category": "cat-groceries",
    "date": "2026-09-02",
    "tags": ["groceries", "weekly"],
    "paymentMethod": "credit_card",
    "isRecurring": false,
    "recurringFrequency": null,
    "notes": "Weekly produce and pantry items",
    "receiptUrl": null
  }
  ```
- **Response**: `201 Created`

### `PUT /api/transactions/:id`
Updates an existing transaction.
- **Response**: `200 OK`

### `DELETE /api/transactions/:id`
Deletes a transaction record.
- **Response**: `200 OK`

---

## 3. Categories API

### `GET /api/categories`
Returns all categories with their monthly budget allocations.
- **Response**: `200 OK` `Category[]`

### `POST /api/categories`
Creates a new custom category.
- **Request Body**:
  ```json
  {
    "id": "cat-pets",
    "name": "Pet Care & Supplies",
    "icon": "PawPrint",
    "color": "#14B8A6",
    "monthlyBudget": 150.00,
    "isCustom": true
  }
  ```
- **Response**: `201 Created`

### `PUT /api/categories/:id`
Updates category details or budget limits.
- **Response**: `200 OK`

### `DELETE /api/categories/:id`
Deletes a custom category.
- **Response**: `200 OK`

---

## 4. Prorated Budget Rules API

### `GET /api/prorated-rules`
Returns all active prorated budgeting rules.
- **Response**: `200 OK` `ProratedBudgetRule[]`

### `POST /api/prorated-rules`
Creates a new prorated rule.
- **Request Body**:
  ```json
  {
    "id": "rule-snacks-500",
    "name": "Snacks & Coffee",
    "categoryId": "cat-snacks",
    "targetTags": ["snacks", "coffee_break", "candy"],
    "monthlyMaxSpend": 500.00,
    "month": "2026-09",
    "rolloverEnabled": true,
    "rolloverAmount": 25.00,
    "alertThresholdPercent": 100,
    "notes": "Daily limit capped across 30 days"
  }
  ```
- **Response**: `201 Created`

### `PUT /api/prorated-rules/:id`
Updates an existing prorated rule.
- **Response**: `200 OK`

### `DELETE /api/prorated-rules/:id`
Deletes a prorated rule.
- **Response**: `200 OK`

---

## 5. Savings Goals API

### `GET /api/savings`
Returns all savings goals along with their deposit/withdrawal history.
- **Response**: `200 OK` `SavingsGoal[]`

### `POST /api/savings`
Creates a new savings goal.
- **Request Body**:
  ```json
  {
    "id": "goal-emergency",
    "name": "6-Month Emergency Vault",
    "targetAmount": 10000.00,
    "currentAmount": 0.00,
    "targetDate": "2026-12-31",
    "icon": "ShieldCheck",
    "color": "#10B981",
    "category": "Emergency",
    "notes": "High-yield savings runway"
  }
  ```
- **Response**: `201 Created`

### `POST /api/savings/:id/deposit`
Logs a deposit or withdrawal against a savings goal and creates an audit history entry.
- **Request Body**:
  ```json
  {
    "amount": 250.00,
    "date": "2026-09-02",
    "note": "Bi-weekly direct allocation",
    "type": "deposit"
  }
  ```
- **Response**: `200 OK`

### `DELETE /api/savings/:id`
Deletes a savings goal and its associated history.
- **Response**: `200 OK`

---

## 6. Debt & Loan Amortization API

### `GET /api/debts`
Returns all debt items and their payment history.
- **Response**: `200 OK` `DebtItem[]`

### `POST /api/debts`
Registers a new loan or liability.
- **Request Body**:
  ```json
  {
    "id": "debt-student",
    "name": "Federal Education Loan",
    "totalPrincipal": 15000.00,
    "remainingBalance": 15000.00,
    "interestRate": 4.5,
    "minimumPayment": 180.00,
    "dueDay": 15,
    "notes": "Subsidized student loan",
    "color": "#3B82F6"
  }
  ```
- **Response**: `201 Created`

### `POST /api/debts/:id/payment`
Records a payment towards a debt, automatically reducing the remaining balance and saving the principal/interest split.
- **Request Body**:
  ```json
  {
    "amount": 200.00,
    "date": "2026-09-02",
    "principalPaid": 155.00,
    "interestPaid": 45.00,
    "note": "Regular monthly installment"
  }
  ```
- **Response**: `200 OK`

### `DELETE /api/debts/:id`
Deletes a debt record.
- **Response**: `200 OK`

---

## 7. Recurring Items API

### `GET /api/recurring`
Returns all recurring bills and subscriptions.
- **Response**: `200 OK` `RecurringItem[]`

### `POST /api/recurring`
Registers a new recurring commitment.
- **Request Body**:
  ```json
  {
    "id": "rec-rent",
    "title": "Apartment Monthly Rent",
    "amount": 1200.00,
    "type": "expense",
    "category": "cat-housing",
    "frequency": "monthly",
    "dayOfMonth": 1,
    "autoApply": true,
    "tags": ["rent", "fixed"],
    "paymentMethod": "bank_transfer",
    "isActive": true
  }
  ```
- **Response**: `201 Created`

### `POST /api/recurring/apply-month`
Automatically generates transaction records for all recurring items for the specified month.
- **Request Body**:
  ```json
  { "month": "2026-09" }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "createdCount": 4,
    "appliedMonth": "2026-09"
  }
  ```

---

## 8. User Settings API

### `GET /api/settings`
Returns application preferences, active currency, alert thresholds, and user profile name.
- **Response**: `200 OK`
  ```json
  {
    "currency": "₹",
    "currencyCode": "INR",
    "pushNotificationsEnabled": true,
    "dailyBudgetAlertThreshold": 100,
    "monthlyBudgetWarningThreshold": 80,
    "enableRolloverByDefault": true,
    "selectedMonth": "2026-09",
    "userName": "Financial Explorer"
  }
  ```

### `PUT /api/settings`
Updates user preferences.
- **Request Body**: Partial or complete `UserSettings` object.
- **Response**: `200 OK`
