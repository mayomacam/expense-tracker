import {
  Transaction,
  Category,
  ProratedBudgetRule,
  DailySpendRecord,
  BudgetAlert,
  RecurringItem,
  DebtItem,
  SavingsGoal,
  UserSettings,
} from '../types';
import { getDaysInMonth, formatCurrency } from './formatters';

/**
 * Filter transactions that match a Prorated Budget Rule
 */
export function getTransactionsForRule(
  rule: ProratedBudgetRule,
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter((t) => {
    if (t.type !== 'expense') return false;

    // Explicit tag link match
    if (t.tags && t.tags.some((tag) => tag.toLowerCase() === `rule:${rule.id}`.toLowerCase())) {
      return true;
    }

    // Direct category match
    if (rule.categoryId && t.category === rule.categoryId) return true;

    // Title match (flexible substring or partial match)
    if (rule.name) {
      const rName = rule.name.toLowerCase().trim();
      const tTitle = t.title.toLowerCase().trim();
      if (tTitle.includes(rName) || rName.includes(tTitle)) return true;

      // Match common partial words (e.g. "biscit" or "biscuit" or "snack")
      const ruleWords = rName.split(/\s+/).filter((w) => w.length > 2);
      const titleWords = tTitle.split(/\s+/).filter((w) => w.length > 2);
      if (ruleWords.some((rw) => titleWords.some((tw) => tw.includes(rw) || rw.includes(tw)))) {
        return true;
      }
    }

    // Tag match
    if (rule.targetTags && rule.targetTags.length > 0 && t.tags) {
      if (
        rule.targetTags.some((tag) =>
          t.tags.some((tTag) => tTag.toLowerCase().includes(tag.toLowerCase()))
        )
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Calculate the full-month daily prorated spend breakdown for a given rule
 */
export function calculateProratedDailyBreakdown(
  rule: ProratedBudgetRule,
  transactions: Transaction[],
  yearMonth: string
): {
  dailyRecords: DailySpendRecord[];
  daysInMonth: number;
  dailyProratedLimit: number;
  effectiveMonthlyBudget: number;
  totalSpentSoFar: number;
  remainingBudget: number;
  exceededDaysCount: number;
  maxDaySpent: { day: number; amount: number };
  averageDailySpend: number;
  projectedMonthEndSpend: number;
  daysPassed: number;
} {
  const daysInMon = getDaysInMonth(yearMonth);
  const effectiveBudget = rule.monthlyMaxSpend + (rule.rolloverAmount || 0);
  const dailyProratedLimit = effectiveBudget / daysInMon;

  const matchedTransactions = getTransactionsForRule(rule, transactions).filter((t) =>
    t.date.startsWith(yearMonth)
  );

  // Group transactions by day (1..daysInMon)
  const dayTxMap: Record<number, Transaction[]> = {};
  for (let d = 1; d <= daysInMon; d++) {
    dayTxMap[d] = [];
  }

  matchedTransactions.forEach((t) => {
    const day = parseInt(t.date.split('-')[2], 10);
    if (day >= 1 && day <= daysInMon) {
      dayTxMap[day].push(t);
    }
  });

  const dailyRecords: DailySpendRecord[] = [];
  let cumulative = 0;
  let exceededDaysCount = 0;
  let maxSpent = { day: 1, amount: 0 };
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Determine today's day number in context of the viewed month
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentDayNumber = isCurrentMonth ? today.getDate() : daysInMon;

  for (let d = 1; d <= daysInMon; d++) {
    const dayDate = new Date(year, month - 1, d);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;

    const txs = dayTxMap[d] || [];
    const amountSpent = txs.reduce((sum, t) => sum + t.amount, 0);
    cumulative += amountSpent;

    const isOver = amountSpent > dailyProratedLimit;
    if (isOver && d <= currentDayNumber && amountSpent > 0) {
      exceededDaysCount++;
    }

    if (amountSpent > maxSpent.amount) {
      maxSpent = { day: d, amount: amountSpent };
    }

    dailyRecords.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      amountSpent,
      cumulativeSpent: cumulative,
      dailyProratedLimit: Number(dailyProratedLimit.toFixed(2)),
      cumulativeProratedLimit: Number((dailyProratedLimit * d).toFixed(2)),
      isOverLimit: isOver,
      delta: Number((amountSpent - dailyProratedLimit).toFixed(2)),
      transactions: txs,
    });
  }

  const totalSpentSoFar = cumulative;
  const remainingBudget = effectiveBudget - totalSpentSoFar;
  const daysPassed = Math.max(1, currentDayNumber);
  const averageDailySpend = totalSpentSoFar / daysPassed;
  const projectedMonthEndSpend = averageDailySpend * daysInMon;

  return {
    dailyRecords,
    daysInMonth: daysInMon,
    dailyProratedLimit: Number(dailyProratedLimit.toFixed(2)),
    effectiveMonthlyBudget: Number(effectiveBudget.toFixed(2)),
    totalSpentSoFar: Number(totalSpentSoFar.toFixed(2)),
    remainingBudget: Number(remainingBudget.toFixed(2)),
    exceededDaysCount,
    maxDaySpent: maxSpent,
    averageDailySpend: Number(averageDailySpend.toFixed(2)),
    projectedMonthEndSpend: Number(projectedMonthEndSpend.toFixed(2)),
    daysPassed,
  };
}

/**
 * Automatically compute alerts for all budgets, prorated limits, bills, and goals
 */
export function evaluateAllAlerts(
  transactions: Transaction[],
  categories: Category[],
  proratedRules: ProratedBudgetRule[],
  recurring: RecurringItem[],
  debts: DebtItem[],
  savings: SavingsGoal[],
  settings: UserSettings,
  currentMonth: string
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const daysInMon = getDaysInMonth(currentMonth);

  // 1. Evaluate Prorated Budget Daily Limit Overages
  proratedRules.forEach((rule) => {
    const breakdown = calculateProratedDailyBreakdown(rule, transactions, currentMonth);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = breakdown.dailyRecords.find((r) => r.date === todayStr);

    if (todayRecord && todayRecord.isOverLimit && todayRecord.amountSpent > 0) {
      alerts.push({
        id: `alert-prorated-today-${rule.id}-${todayRecord.date}`,
        type: 'daily_prorated_exceeded',
        title: `Daily Limit Exceeded: ${rule.name}`,
        message: `Today's spend of ${formatCurrency(todayRecord.amountSpent, settings.currency)} on "${rule.name}" exceeds your daily prorated limit of ${formatCurrency(breakdown.dailyProratedLimit, settings.currency)} by +${formatCurrency(todayRecord.delta, settings.currency)}.`,
        date: todayRecord.date,
        severity: 'danger',
        read: false,
        relatedItemId: rule.id,
        linkTab: 'prorated',
      });
    }

    // Check if total monthly spend exceeded
    if (breakdown.totalSpentSoFar > breakdown.effectiveMonthlyBudget && breakdown.effectiveMonthlyBudget > 0) {
      alerts.push({
        id: `alert-prorated-month-${rule.id}-${currentMonth}`,
        type: 'monthly_budget_exceeded',
        title: `Monthly Cap Exceeded: ${rule.name}`,
        message: `Total spent on "${rule.name}" (${formatCurrency(breakdown.totalSpentSoFar, settings.currency)}) has surpassed the monthly max spend of ${formatCurrency(breakdown.effectiveMonthlyBudget, settings.currency)}.`,
        date: new Date().toISOString().split('T')[0],
        severity: 'danger',
        read: false,
        relatedItemId: rule.id,
        linkTab: 'prorated',
      });
    } else if (
      breakdown.effectiveMonthlyBudget > 0 &&
      breakdown.totalSpentSoFar >= breakdown.effectiveMonthlyBudget * (settings.monthlyBudgetWarningThreshold / 100)
    ) {
      alerts.push({
        id: `alert-prorated-warn-${rule.id}-${currentMonth}`,
        type: 'monthly_budget_warning',
        title: `Budget Warning: ${rule.name} Near Cap`,
        message: `You have used ${((breakdown.totalSpentSoFar / breakdown.effectiveMonthlyBudget) * 100).toFixed(0)}% of your "${rule.name}" budget (${formatCurrency(breakdown.totalSpentSoFar, settings.currency)} / ${formatCurrency(breakdown.effectiveMonthlyBudget, settings.currency)}).`,
        date: new Date().toISOString().split('T')[0],
        severity: 'warning',
        read: false,
        relatedItemId: rule.id,
        linkTab: 'prorated',
      });
    }

    // Check past days in month with excessive overages
    breakdown.dailyRecords.forEach((rec) => {
      if (rec.isOverLimit && rec.delta > breakdown.dailyProratedLimit * 0.5 && rec.date !== todayStr) {
        alerts.push({
          id: `alert-prorated-past-${rule.id}-${rec.date}`,
          type: 'daily_prorated_exceeded',
          title: `Over-Limit Day: ${rule.name} on ${rec.date}`,
          message: `Spent ${formatCurrency(rec.amountSpent, settings.currency)} (Limit: ${formatCurrency(breakdown.dailyProratedLimit, settings.currency)}).`,
          date: rec.date,
          severity: 'warning',
          read: true,
          relatedItemId: rule.id,
          linkTab: 'prorated',
        });
      }
    });
  });

  // 2. Evaluate Category Monthly Budgets
  categories.forEach((cat) => {
    if (cat.monthlyBudget && cat.monthlyBudget > 0) {
      const catSpent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const ratio = catSpent / cat.monthlyBudget;
      if (ratio >= 1) {
        alerts.push({
          id: `alert-cat-exceeded-${cat.id}-${currentMonth}`,
          type: 'monthly_budget_exceeded',
          title: `Category Budget Exceeded: ${cat.name}`,
          message: `You've spent ${formatCurrency(catSpent, settings.currency)} on ${cat.name}, exceeding your ${formatCurrency(cat.monthlyBudget, settings.currency)} monthly budget.`,
          date: new Date().toISOString().split('T')[0],
          severity: 'danger',
          read: false,
          relatedItemId: cat.id,
          linkTab: 'budgets',
        });
      } else if (ratio >= settings.monthlyBudgetWarningThreshold / 100) {
        alerts.push({
          id: `alert-cat-warn-${cat.id}-${currentMonth}`,
          type: 'monthly_budget_warning',
          title: `Category Alert: ${cat.name} at ${(ratio * 100).toFixed(0)}%`,
          message: `You have spent ${formatCurrency(catSpent, settings.currency)} of your ${formatCurrency(cat.monthlyBudget, settings.currency)} budget.`,
          date: new Date().toISOString().split('T')[0],
          severity: 'warning',
          read: false,
          relatedItemId: cat.id,
          linkTab: 'budgets',
        });
      }
    }
  });

  // 3. Evaluate Recurring Items / Bills Due
  const currentDay = new Date().getDate();
  recurring.forEach((item) => {
    if (item.isActive && item.type === 'expense') {
      const daysUntilDue = item.dayOfMonth - currentDay;
      if (daysUntilDue >= 0 && daysUntilDue <= 3) {
        alerts.push({
          id: `alert-bill-due-${item.id}-${currentMonth}`,
          type: 'bill_due',
          title: `Upcoming Bill: ${item.title}`,
          message: `Your recurring payment of ${formatCurrency(item.amount, settings.currency)} is due in ${daysUntilDue === 0 ? 'TODAY' : `${daysUntilDue} day(s)`} (Day ${item.dayOfMonth}).`,
          date: new Date().toISOString().split('T')[0],
          severity: daysUntilDue === 0 ? 'danger' : 'info',
          read: false,
          relatedItemId: item.id,
          linkTab: 'recurring',
        });
      }
    }
  });

  // 4. Savings Goal Milestones
  savings.forEach((goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    if (progress >= 100) {
      alerts.push({
        id: `alert-savings-reached-${goal.id}`,
        type: 'savings_milestone',
        title: `Goal Achieved: ${goal.name}! 🎉`,
        message: `Congratulations! You reached 100% of your savings goal (${formatCurrency(goal.currentAmount, settings.currency)}).`,
        date: new Date().toISOString().split('T')[0],
        severity: 'success',
        read: false,
        relatedItemId: goal.id,
        linkTab: 'savings',
      });
    } else if (progress >= 75) {
      alerts.push({
        id: `alert-savings-75-${goal.id}`,
        type: 'savings_milestone',
        title: `Savings Milestone: ${goal.name}`,
        message: `You've achieved ${progress.toFixed(0)}% of your target (${formatCurrency(goal.currentAmount, settings.currency)} / ${formatCurrency(goal.targetAmount, settings.currency)}).`,
        date: new Date().toISOString().split('T')[0],
        severity: 'info',
        read: true,
        relatedItemId: goal.id,
        linkTab: 'savings',
      });
    }
  });

  return alerts;
}
