import { Transaction, DebtItem, SavingsGoal, RecurringItem, SafeDailySpendSummary } from '../types';

export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

export function isFixedExpense(tx: Transaction): boolean {
  if (tx.type !== 'expense') return false;
  const lowerTags = (tx.tags || []).map((t) => t.toLowerCase());
  const lowerTitle = tx.title.toLowerCase();
  const lowerCategory = tx.category.toLowerCase();

  // Fixed tags & keywords
  if (
    lowerTags.includes('fixed') ||
    lowerTags.includes('rent') ||
    lowerTags.includes('emi') ||
    lowerTags.includes('bills') ||
    lowerTags.includes('mortgage') ||
    lowerTags.includes('loan') ||
    lowerTags.includes('essential')
  ) {
    return true;
  }

  if (
    lowerTitle.includes('rent') ||
    lowerTitle.includes('emi') ||
    lowerTitle.includes('loan repayment') ||
    lowerTitle.includes('electricity bill') ||
    lowerTitle.includes('water bill') ||
    lowerTitle.includes('fiber') ||
    lowerTitle.includes('internet')
  ) {
    return true;
  }

  if (lowerCategory === 'cat-housing' || lowerCategory === 'cat-utilities') {
    return true;
  }

  return false;
}

export function calculateSafeDailySpend(
  transactions: Transaction[],
  debts: DebtItem[] = [],
  savingsGoals: SavingsGoal[] = [],
  recurringItems: RecurringItem[] = [],
  targetMonthStr?: string
): SafeDailySpendSummary {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();
  const currentDay = today.getDate();

  const monthStr = targetMonthStr || `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const [targetYStr, targetMStr] = monthStr.split('-');
  const targetYear = parseInt(targetYStr, 10);
  const targetMonthIdx = parseInt(targetMStr, 10) - 1;

  const daysInMonth = getDaysInMonth(targetYear, targetMonthIdx);
  const isCurrentActiveMonth =
    targetYear === currentYear && targetMonthIdx === currentMonthIdx;

  const daysRemaining = isCurrentActiveMonth
    ? Math.max(1, daysInMonth - currentDay + 1)
    : daysInMonth;

  const todayDateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(
    currentDay
  ).padStart(2, '0')}`;

  // 1. Total Salary / Income for the month
  const monthTransactions = transactions.filter((tx) => tx.date && tx.date.startsWith(monthStr));

  const directIncome = monthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Fallback: If salary hasn't hit yet (e.g., month start), check recurring income items
  const recurringIncome = recurringItems
    .filter((r) => r.type === 'income' && r.isActive !== false)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalSalary = directIncome > 0 ? directIncome : recurringIncome > 0 ? recurringIncome : 5000;

  // 2. Fixed Costs (Rent + EMI + Bills + Debt Min Payments + Planned Savings)
  // A. Month Fixed Transactions
  const fixedTransactionsSum = monthTransactions
    .filter((tx) => isFixedExpense(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);

  // B. Recurring fixed items not yet logged in transactions
  const loggedRecurringTitles = new Set(
    monthTransactions.map((tx) => tx.title.toLowerCase())
  );
  const unloggedRecurringFixed = recurringItems
    .filter(
      (r) =>
        r.type === 'expense' &&
        r.isActive !== false &&
        !loggedRecurringTitles.has(r.title.toLowerCase()) &&
        (r.tags?.includes('fixed') || r.tags?.includes('rent') || r.category === 'cat-housing' || r.category === 'cat-utilities')
    )
    .reduce((sum, r) => sum + r.amount, 0);

  // C. Debt EMI minimum payments
  const debtMinPayments = debts.reduce(
    (sum, d) => sum + (d.remainingBalance > 0 ? Number(d.minimumPayment || 0) : 0),
    0
  );

  // D. Planned savings allocations this month (10% of salary or active goal targets)
  const savingsAllocations = savingsGoals.reduce((sum, g) => {
    // If user has active emergency or savings goals, allocate standard portion
    return sum + (g.targetAmount > g.currentAmount ? Math.min(500, (g.targetAmount - g.currentAmount) / 6) : 0);
  }, 0);

  const totalFixedCosts = Math.max(
    0,
    fixedTransactionsSum + unloggedRecurringFixed + debtMinPayments + savingsAllocations
  );

  // 3. Discretionary Spends (Non-fixed expenses, excluding transfers)
  // Also account for staple multi-month amortization!
  const discretionaryTxs = monthTransactions.filter(
    (tx) => tx.type === 'expense' && !isFixedExpense(tx)
  );

  let discretionarySpentSoFar = 0;
  let spentToday = 0;

  for (const tx of discretionaryTxs) {
    // Effective expense for this month considering amortization
    const months = tx.amortizationMonths && tx.amortizationMonths > 1 ? tx.amortizationMonths : 1;
    const effectiveAmount = tx.amount / months;

    discretionarySpentSoFar += effectiveAmount;

    if (tx.date === todayDateStr) {
      spentToday += effectiveAmount;
    }
  }

  const spentBeforeToday = Math.max(0, discretionarySpentSoFar - spentToday);

  // 4. Formulas:
  // Base daily allowance across whole month: (Salary - Fixed Costs) / DaysInMonth
  const netMonthlyPool = Math.max(0, totalSalary - totalFixedCosts);
  const baseDailyAllowance = Math.round((netMonthlyPool / daysInMonth) * 10) / 10;

  // Dynamic daily safe spend for today:
  // (Salary - Fixed Costs - Discretionary Spent So Far Before Today) / Days Left
  const remainingDiscretionaryPool = Math.max(0, netMonthlyPool - spentBeforeToday);
  const dynamicDailySafeSpend =
    daysRemaining > 0
      ? Math.round((remainingDiscretionaryPool / daysRemaining) * 10) / 10
      : 0;

  // Remaining safe spend today:
  const remainingSafeSpendToday =
    Math.round((dynamicDailySafeSpend - spentToday) * 10) / 10;

  // Tomorrow's projected allowance if today ends right now:
  const daysLeftAfterToday = Math.max(1, daysInMonth - currentDay);
  const poolAfterToday = Math.max(0, netMonthlyPool - discretionarySpentSoFar);
  const tomorrowProjectedAllowance =
    Math.round((poolAfterToday / daysLeftAfterToday) * 10) / 10;

  // Leftover spare change today (if under budget today):
  const leftoverSpareChange = Math.max(
    0,
    Math.round((dynamicDailySafeSpend - spentToday) * 10) / 10
  );

  return {
    totalSalary,
    totalFixedCosts,
    discretionarySpentSoFar,
    daysInMonth,
    currentDay,
    daysRemaining,
    spentToday,
    baseDailyAllowance,
    dynamicDailySafeSpend,
    remainingSafeSpendToday,
    tomorrowProjectedAllowance,
    leftoverSpareChange,
  };
}
