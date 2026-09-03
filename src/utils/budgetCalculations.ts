import { Transaction, ProratedBudgetRule } from '../types';
import { getDaysInMonth } from './formatters';

export interface ProratedCalculationResult {
  rule: ProratedBudgetRule;
  month: string;
  totalDays: number;
  currentDay: number;
  remainingDays: number;
  monthlyMaxSpend: number;
  rolloverAmount: number;
  effectiveBudget: number;
  totalSpent: number;
  remainingBudget: number;
  nominalDailyLimit: number;
  actualDailyLimit: number;
  spentToday: number;
  remainingToday: number;
  percentSpent: number;
  isOverBudget: number;
  status: 'safe' | 'warning' | 'danger' | 'overspent';
}

export function calculateProratedRule(
  rule: ProratedBudgetRule,
  transactions: Transaction[],
  targetDate: Date = new Date()
): ProratedCalculationResult {
  const currentYearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
  const ruleMonth = rule.month || currentYearMonth;
  const totalDays = getDaysInMonth(ruleMonth);
  
  const isCurrentMonth = ruleMonth === currentYearMonth;
  const currentDay = isCurrentMonth ? targetDate.getDate() : totalDays;
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  const effectiveBudget = rule.monthlyMaxSpend + (rule.rolloverEnabled ? (rule.rolloverAmount || 0) : 0);

  // Filter transactions belonging ONLY to this independent prorated rule
  const matchingTransactions = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    if (!tx.date.startsWith(ruleMonth)) return false;

    // Prorated budget rules are completely independent from general category/tag expenses.
    // ONLY transactions explicitly allocated to this prorated rule count towards it.
    if (tx.proratedRuleId) {
      return tx.proratedRuleId === rule.id;
    }
    if (tx.notes && tx.notes.includes(`[prorated:${rule.id}]`)) {
      return true;
    }
    return false;
  });

  const totalSpent = matchingTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const remainingBudget = effectiveBudget - totalSpent;

  const nominalDailyLimit = effectiveBudget / totalDays;
  const actualDailyLimit = Math.max(0, remainingBudget / remainingDays);

  const todayStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  const spentToday = matchingTransactions
    .filter((tx) => tx.date === todayStr)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const remainingToday = Math.max(0, actualDailyLimit - spentToday);
  const percentSpent = effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;
  const isOverBudget = totalSpent > effectiveBudget ? totalSpent - effectiveBudget : 0;

  let status: 'safe' | 'warning' | 'danger' | 'overspent' = 'safe';
  if (totalSpent > effectiveBudget) {
    status = 'overspent';
  } else if (percentSpent >= (rule.alertThresholdPercent || 100)) {
    status = 'danger';
  } else if (percentSpent >= 75) {
    status = 'warning';
  }

  return {
    rule,
    month: ruleMonth,
    totalDays,
    currentDay,
    remainingDays,
    monthlyMaxSpend: rule.monthlyMaxSpend,
    rolloverAmount: rule.rolloverAmount || 0,
    effectiveBudget,
    totalSpent,
    remainingBudget,
    nominalDailyLimit,
    actualDailyLimit,
    spentToday,
    remainingToday,
    percentSpent,
    isOverBudget,
    status,
  };
}
