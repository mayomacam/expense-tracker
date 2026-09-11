# Prorated Budgeting Model

Traditional personal finance tools operate on rigid monthly budget envelopes. However, monthly limits fail to answer the most critical daily question: **"Can I afford this expense today without overshooting my month-end target?"**

The **Prorated Budgeting Model** introduces mathematical daily spend curves and pace metrics to provide continuous, day-by-day financial guidance.

---

## 1. Core Mathematical Formulation

### 1.1 Effective Monthly Budget ($B_{\text{eff}}$)
When rollover is enabled, unused funds or deficits from previous periods adjust the baseline monthly allowance:

$$B_{\text{eff}} = B_{\text{base}} + R$$

Where:
- $B_{\text{base}}$: Base monthly expenditure cap set by the user.
- $R$: Rollover amount carried over from the prior month (positive for surplus, negative for deficit).

---

### 1.2 Daily Spend Allowance ($A_{\text{daily}}$)
The allowable expenditure per day is distributed evenly across the exact number of calendar days in the target month ($N_{\text{days}}$):

$$A_{\text{daily}} = \frac{B_{\text{eff}}}{N_{\text{days}}}$$

> **Calendar Awareness**: $N_{\text{days}}$ dynamically accounts for leap years and varying month lengths (28, 29, 30, or 31 days). For example:
> - A ₹15,000 Dining out budget in **February (28 days)** yields: ₹535.71 / day
> - The same ₹15,000 budget in **March (31 days)** yields: ₹483.87 / day

---

### 1.3 Cumulative Allowed Spend ($C_{\text{allowed}}(d)$)
On any day of the month $d \in [1, N_{\text{days}}]$, the theoretical maximum amount you should have spent up to that point is:

$$C_{\text{allowed}}(d) = A_{\text{daily}} \times d = B_{\text{eff}} \times \frac{d}{N_{\text{days}}}$$

---

### 1.4 Cumulative Actual Spend ($S_{\text{actual}}(d)$)
The sum of all qualifying expense transactions occurring on or before day $d$:

$$S_{\text{actual}}(d) = \sum_{t \in T,\, \text{day}(t) \le d,\, \text{proratedRuleId}(t) = \text{rule.id}} \text{amount}(t)$$

Where transaction $t$ is explicitly linked to the prorated rule via `proratedRuleId`.

---

## 1.5 Dedicated Database Table & Strict Domain Isolation Guarantees

To ensure complete financial independence:
1. **Dedicated Database Table (`prorated_spends`)**: All daily prorated spends are stored in a separate, isolated SQLite table (`prorated_spends`), completely distinct from general transactions.
2. **Optional Ledger Mirroring**: When logging a spend against a prorated rule, users can optionally check *"Also record in main Transactions ledger"*. By default (unchecked), the spend remains 100% isolated to the prorated budget and does not appear in general transactions.
3. **General Expenses Immunity**: General transactions (e.g. rent, groceries, family outings, utility bills) **do not** reduce your daily prorated allowance unless explicitly allocated to a prorated rule.
4. **Category Budget Immunity**: Spends logged under a Prorated Daily Budget rule **do not** count toward or pollute general monthly category budgets (`catSpentMap`), Dashboard Total Spent, or Net Surplus.
5. **Dedicated Tracking**: Prorated daily budgets serve as an isolated daily pocket-money calculator with its own allowable limit curve and pace indicators.

## 2. Real-Time Pace Evaluation

At any current day $d$, the system compares actual expenditures against cumulative allowances to calculate the **Pace Ratio** ($P$):

$$P = \frac{S_{\text{actual}}(d)}{C_{\text{allowed}}(d)}$$

### Pace Classification
| Pace Ratio ($P$) | Status | Visual Indicator | Meaning |
| :--- | :--- | :--- | :--- |
| $P \le 0.90$ | **Under Budget** | 🟢 Emerald Green | Spending is well below pace; surplus is accumulating. |
| $0.90 < P \le 1.05$ | **On Track** | 🔵 Indigo / Cyan | Spending is perfectly aligned with the daily prorated limit. |
| $1.05 < P \le 1.25$ | **Pace Warning** | 🟡 Amber Yellow | Spending is accelerating ahead of the calendar; pace alert triggered. |
| $P > 1.25$ | **Critical Pace** | 🔴 Crimson Rose | Severe overspend risk; requires immediate cutback to avoid month-end deficit. |

---

## 3. Dynamic Daily Runway Recalculation

If an unexpected expense occurs mid-month (e.g., spending ₹4,000 on day 10 of a ₹15,000 monthly budget), the system recalculates the **Adjusted Daily Allowance for Remaining Days** ($A_{\text{remaining}}$):

$$A_{\text{remaining}} = \frac{B_{\text{eff}} - S_{\text{actual}}(d)}{N_{\text{days}} - d}$$

This dynamic metric instantly advises the user what their *new* safe daily ceiling must be for the rest of the month to finish on budget.

---

## 4. Rollover Surplus Mechanics

At the conclusion of the calendar month ($d = N_{\text{days}}$):
- **Surplus Case ($S_{\text{actual}} < B_{\text{eff}}$)**: The remaining balance can be rolled over into the next month's pool as an initial buffer:
  $$R_{\text{next}} = B_{\text{eff}} - S_{\text{actual}}$$
- **Deficit Case ($S_{\text{actual}} > B_{\text{eff}}$)**: If strict rollover is enabled, the overage reduces the next month's starting capital:
  $$R_{\text{next}} = -(S_{\text{actual}} - B_{\text{eff}})$$

---

## 5. Visual Cumulative Curve (Recharts)

The application renders a dual-line chart for each prorated budget tracker:
1. **Reference Curve (Linear Target)**: A straight reference line plotting $C_{\text{allowed}}(d)$ from day 1 to day $N_{\text{days}}$.
2. **Actual Expenditure Curve**: A stepped line representing $S_{\text{actual}}(d)$ across the calendar month.

```
Spending (₹)
▲
│                                              ● [Month Cap: ₹15,000]
│                                      . - ' /
│                              . - ' /      /  (Actual Spend Curve)
│                      . - ' /      /
│              . - ' /      /
│      . - ' /             /  ▲ [Over-pace divergence on Day 12]
│. - '                    /
└──────────────────────────────────────────────────────────► Day of Month
 1       5      10      15      20      25      31
```

Whenever the actual line crosses above the reference line, an alert is automatically dispatched to the in-app Notification Center.
