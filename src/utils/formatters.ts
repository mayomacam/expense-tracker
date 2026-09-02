import { Transaction, Category, ProratedBudgetRule } from '../types';

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  // month is 1-indexed in "YYYY-MM", passing month directly to Date(year, month, 0) gives last day of that month
  return new Date(year, month, 0).getDate();
}

export function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getShortMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Trigger browser file download of CSV data
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert Transactions to CSV
 */
export function generateTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  currency: string = '₹'
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Tags', 'Notes', 'Recurring'];

  const rows = transactions.map((t) => {
    const catName = categoryMap.get(t.category) || t.category;
    const tagsStr = (t.tags || []).join('; ');
    const safeTitle = `"${(t.title || '').replace(/"/g, '""')}"`;
    const safeNotes = `"${(t.notes || '').replace(/"/g, '""')}"`;
    return [
      t.date,
      safeTitle,
      t.type.toUpperCase(),
      `"${catName.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      currency,
      t.paymentMethod,
      `"${tagsStr.replace(/"/g, '""')}"`,
      safeNotes,
      t.isRecurring ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate Comprehensive Monthly Financial Statement CSV
 */
export function generateMonthlyReportCSV(
  month: string,
  transactions: Transaction[],
  categories: Category[],
  proratedRules: ProratedBudgetRule[],
  currency: string = '₹'
): string {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(month));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending: Record<string, { spent: number; budget: number }> = {};

  categories.forEach((cat) => {
    categorySpending[cat.id] = { spent: 0, budget: cat.monthlyBudget || 0 };
  });

  monthTransactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (!categorySpending[t.category]) {
        categorySpending[t.category] = { spent: 0, budget: 0 };
      }
      categorySpending[t.category].spent += t.amount;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

  const lines: string[] = [];
  lines.push(`MONTHLY BUDGET & EXPENSE REPORT - ${getMonthName(month).toUpperCase()}`);
  lines.push(`Generated On,${new Date().toISOString()}`);
  lines.push('');
  lines.push('--- EXECUTIVE SUMMARY ---');
  lines.push(`Total Income,${currency}${totalIncome.toFixed(2)}`);
  lines.push(`Total Expenses,${currency}${totalExpense.toFixed(2)}`);
  lines.push(`Net Savings,${currency}${netSavings.toFixed(2)}`);
  lines.push(`Savings Rate,${savingsRate}%`);
  lines.push('');

  lines.push('--- CATEGORY BREAKDOWN ---');
  lines.push('Category,Allocated Budget,Actual Spent,Remaining / Over,Status');
  Object.entries(categorySpending).forEach(([catId, data]) => {
    const cat = categoryMap.get(catId);
    const catName = cat ? cat.name : catId;
    const diff = data.budget > 0 ? data.budget - data.spent : 0;
    const status = data.budget === 0 ? 'No Budget' : diff >= 0 ? 'Within Budget' : 'OVER BUDGET';
    lines.push(`"${catName}",${data.budget.toFixed(2)},${data.spent.toFixed(2)},${diff.toFixed(2)},${status}`);
  });

  lines.push('');
  lines.push('--- PRORATED DAILY SPEND TRACKERS ---');
  lines.push('Item/Rule Name,Monthly Max Spend,Daily Prorated Limit,Days In Month,Total Spent,Status');
  const daysInMon = getDaysInMonth(month);
  proratedRules.forEach((rule) => {
    const dailyLimit = (rule.monthlyMaxSpend + (rule.rolloverAmount || 0)) / daysInMon;
    const ruleTransactions = monthTransactions.filter(
      (t) =>
        t.type === 'expense' &&
        (t.category === rule.categoryId ||
          t.title.toLowerCase().includes(rule.name.toLowerCase()) ||
          (rule.targetTags && rule.targetTags.some((tag) => t.tags?.includes(tag))))
    );
    const totalSpent = ruleTransactions.reduce((sum, t) => sum + t.amount, 0);
    const effBudget = rule.monthlyMaxSpend + (rule.rolloverAmount || 0);
    const status = totalSpent <= effBudget ? 'Within Budget' : 'Exceeded';
    lines.push(`"${rule.name}",${effBudget.toFixed(2)},${dailyLimit.toFixed(2)},${daysInMon},${totalSpent.toFixed(2)},${status}`);
  });

  lines.push('');
  lines.push('--- ITEMIZED TRANSACTIONS FOR MONTH ---');
  lines.push('Date,Title,Type,Category,Amount,Payment Method,Tags,Notes');
  monthTransactions.forEach((t) => {
    const catName = categoryMap.get(t.category)?.name || t.category;
    lines.push(
      `${t.date},"${t.title.replace(/"/g, '""')}",${t.type},"${catName}",${t.amount.toFixed(2)},${t.paymentMethod},"${(t.tags || []).join(';')}",`
    );
  });

  return lines.join('\n');
}
