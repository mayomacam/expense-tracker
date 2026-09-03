# 📐 Prorated Daily Budgeting Guide & Mathematical Formulas

This guide explains the concept, mathematical formulas, and pacing mechanics powering the **Prorated Daily Budget Engine**.

---

## 1. The Core Philosophy of Prorated Budgeting

Standard budgeting methods allocate a lump sum for an entire month (e.g., *"I have ₹5,000 to spend on snacks and coffee this month"*). However, lump-sum budgets suffer from the **"Front-Loading Trap"**:
- People often overspend in the first 10 days of the month without realizing they are burning through their allocation too fast.
- By day 20, they run out of budget and either experience financial stress or give up on tracking altogether.

**Prorated Daily Budgeting** solves this problem by converting monthly caps into **dynamic daily spending allowances**. By knowing exactly how much you can spend *each individual day*, you maintain steady financial pacing throughout the entire month.

---

## 2. Mathematical Formulas

### A. Days in Month ($D_m$)
For any year $Y$ and month $M \in [1, 12]$:
$$D_m = \text{Date}(Y, M, 0).\text{getDate}()$$
*Example: September 2026 has $D_m = 30$ days. February in a leap year has 29 days.*

---

### B. Daily Spending Limit ($L_d$)
The daily spending limit represents the exact amount of money you are allowed to spend per calendar day in that month:

$$L_d = \frac{B_m + S_r}{D_m}$$

Where:
- $B_m$ = Monthly Maximum Budget Cap (e.g., ₹6,000)
- $S_r$ = Rollover Surplus from previous month (e.g., ₹300)
- $D_m$ = Total days in the month (e.g., 30)

*Example calculation:*
$$L_d = \frac{6000 + 300}{30} = \frac{6300}{30} = ₹210.00 \text{ per day}$$

---

### C. Linear Expected Spend at Day $k$ ($E_k$)
The cumulative amount you theoretically expect to have spent by the end of Day $k$ ($1 \le k \le D_m$):

$$E_k = k \times L_d$$

*Example for Day 10:*
$$E_{10} = 10 \times 210 = ₹2,100.00$$

---

### D. Actual Month-to-Date Spend at Day $k$ ($A_k$)
The sum of all qualifying transactions recorded between Day 1 and Day $k$:

$$A_k = \sum_{i=1}^{k} \text{Spend}(i)$$

---

### E. Pacing Variance & Financial Health ($\Delta_k$)
The difference between what you have actually spent versus the linear benchmark:

$$\Delta_k = A_k - E_k$$

- If $\Delta_k < 0$: **Under Budget / Ahead of Target** (Favorable surplus of $|\Delta_k|$).
- If $\Delta_k = 0$: **Exactly On Pace**.
- If $\Delta_k > 0$: **Over Budget / Pacing Danger** (Deficit of $\Delta_k$).

---

### F. Dynamic Daily Safe Allowance Remaining ($L_{\text{rem}}$)
If you have overspent or underspent, the system calculates the adjusted daily ceiling for the remaining $(D_m - k)$ days of the month:

$$L_{\text{rem}} = \frac{(B_m + S_r) - A_k}{D_m - k}$$

*Example on Day 15 if actual spend is ₹2,800 out of ₹6,300 with 15 days remaining:*
$$L_{\text{rem}} = \frac{6300 - 2800}{15} = \frac{3500}{15} = ₹233.33 \text{ per day for the rest of the month}$$

---

## 3. Rollover Surplus Mechanics

When a month concludes, any unused budget can be rolled over to the next month if `rolloverEnabled` is set to `true`:

$$S_{\text{next}} = \max(0, (B_m + S_r) - A_{D_m})$$

If the month ended with an overspend, the deficit is not penalized by default unless configured, protecting your baseline allowance for the upcoming month.

---

## 4. Alert Threshold Logic

The system continuously evaluates alert conditions:
1. **Daily Limit Trigger**: Triggered whenever $\text{Spend}(k) > L_d \times \frac{\text{Threshold}\%}{100}$.
2. **Monthly Pacing Trigger**: Triggered whenever $A_k > E_k \times \frac{\text{Threshold}\%}{100}$.
3. **Hard Cap Warning**: Triggered whenever $A_k \ge B_m \times 0.90$ (90% of total monthly pool exhausted).

---

## 5. Visual Pacing Summary Matrix

| Metric | Formula | Meaning |
| :--- | :--- | :--- |
| **Daily Benchmark** | $(B_m + S_r) / D_m$ | Target ceiling per day |
| **Linear Expected** | $k \times L_d$ | Target cumulative spend by day $k$ |
| **Actual Spend** | $\sum \text{Day}(1..k)$ | Real cumulative spend |
| **Variance** | $A_k - E_k$ | Net surplus or deficit |
| **Adjusted Allowance** | $(B_{\text{total}} - A_k) / (D_m - k)$ | Rebalanced daily budget for remainder of month |
| **Utilization Rate** | $(A_k / B_{\text{total}}) \times 100\%$ | Total monthly budget consumption |

---

## 6. Streamlined Prorated Quick Spend Logger & Switcher

To ensure zero friction when logging prorated daily spend:

1. **`LogProratedSpendModal.tsx`**:
   - Opens pre-filled with the active tracker's name, category, and daily target.
   - Accepts simple **Amount** and optional **Description** to log spend in 1 click.
2. **1-Click Tracker Switcher**:
   - Switch between prorated trackers (*Snacks & Treats*, *Travel*, *Food*, etc.) with a single click using the **Sidebar Menu** or the top **Pill Tab Bar**.

