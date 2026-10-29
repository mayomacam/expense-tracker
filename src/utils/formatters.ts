import { Transaction, Category, ProratedBudgetRule, SavingsGoal, DebtItem, ProratedSpend } from '../types';
import { calculateProratedRule } from './budgetCalculations';

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str}"`;
  }
  return `"${str}"`;
}

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

export function generateTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  currency: string = '₹'
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = [
    'Date',
    'Title',
    'Type',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Nature',
    'Tags',
    'Notes',
    'Recurring',
  ];

  const rows = transactions.map((t) => {
    const catName = categoryMap.get(t.category) || t.category;
    const tagsStr = (t.tags || []).join('; ');
    return [
      t.date,
      sanitizeCsvCell(t.title || ''),
      t.type.toUpperCase(),
      sanitizeCsvCell(catName),
      t.amount.toFixed(2),
      currency,
      t.paymentMethod,
      t.nature || 'need',
      sanitizeCsvCell(tagsStr),
      sanitizeCsvCell(t.notes || ''),
      t.isRecurring ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function generateMonthlyReportCSV(
  month: string,
  transactions: Transaction[],
  categories: Category[],
  proratedRules: ProratedBudgetRule[],
  proratedSpends: ProratedSpend[] = [],
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
    const diff = data.budget - data.spent;
    const status = data.budget === 0 ? 'No Budget' : diff >= 0 ? 'Within Budget' : 'Over Budget';
    lines.push(
      `${sanitizeCsvCell(catName)},${data.budget.toFixed(2)},${data.spent.toFixed(2)},${diff.toFixed(2)},${status}`
    );
  });

  if (proratedRules.length > 0) {
    lines.push('');
    lines.push('--- PRORATED DAILY BUDGET TRACKERS ---');
    lines.push(
      'Tracker Name,Target Category,Monthly Cap,Rollover Carried,Effective Limit,Prorated Spent,Status'
    );

    proratedRules.forEach((rule) => {
      const targetDate = new Date(`${month}-01T00:00:00`);
      const stats = calculateProratedRule(rule, monthTransactions, proratedSpends, targetDate);
      const cat = rule.categoryId ? categoryMap.get(rule.categoryId) : undefined;
      const catName = cat ? cat.name : 'All Categories';
      lines.push(
        `${sanitizeCsvCell(rule.name)},${sanitizeCsvCell(catName)},${rule.monthlyMaxSpend.toFixed(2)},${(rule.rolloverAmount || 0).toFixed(2)},${stats.effectiveBudget.toFixed(2)},${stats.totalSpent.toFixed(2)},${stats.status === 'safe' ? 'On Track' : 'Exceeded'}`
      );
    });
  }

  lines.push('');
  lines.push(`--- DETAILED LEDGER ENTRIES (${monthTransactions.length}) ---`);
  lines.push('Date,Title,Type,Category,Nature,Amount,Payment Method,Tags,Notes');

  monthTransactions.forEach((t) => {
    const cat = categoryMap.get(t.category);
    const catName = cat ? cat.name : t.category;
    const tagsStr = (t.tags || []).join('; ');
    lines.push(
      `${t.date},${sanitizeCsvCell(t.title)},${t.type.toUpperCase()},${sanitizeCsvCell(catName)},${t.nature || 'need'},${t.amount.toFixed(2)},${t.paymentMethod},${sanitizeCsvCell(tagsStr)},${sanitizeCsvCell(t.notes || '')}`
    );
  });

  return lines.join('\n');
}

export function generatePDFReportWindow(
  month: string,
  transactions: Transaction[],
  categories: Category[],
  proratedRules: ProratedBudgetRule[],
  savingsGoals: SavingsGoal[] = [],
  debts: DebtItem[] = [],
  proratedSpendsOrCurrency: ProratedSpend[] | string = [],
  maybeCurrency: string = '₹'
): void {
  const currency = typeof proratedSpendsOrCurrency === 'string'
    ? proratedSpendsOrCurrency
    : maybeCurrency;
  const monthName = getMonthName(month);
  const monthTxs = transactions.filter((t) => t.date.startsWith(month));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const totalIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Report - ${escapeHtml(monthName)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #fff; color: #111; }
          .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 13px; }
          .summary-grid { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px; }
          .card { flex: 1; padding: 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; text-align: center; }
          .card span { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
          .card h2 { margin: 5px 0 0 0; font-size: 20px; }
          .income { color: #2e7d32; }
          .expense { color: #c62828; }
          .net { color: #1565c0; }
          h3 { font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
          th { background: #e9ecef; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          tr:nth-child(even) { background: #f8f9fa; }
          .no-print { margin-top: 20px; text-align: center; }
          .btn-print { padding: 10px 20px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Financial Statement</h1>
          <p>Period: ${escapeHtml(monthName)} | Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary-grid">
          <div class="card">
            <span>Total Income</span>
            <h2 class="income">${escapeHtml(formatCurrency(totalIncome, currency))}</h2>
          </div>
          <div class="card">
            <span>Total Expenses</span>
            <h2 class="expense">${escapeHtml(formatCurrency(totalExpense, currency))}</h2>
          </div>
          <div class="card">
            <span>Net Balance</span>
            <h2 class="net">${escapeHtml(formatCurrency(netBalance, currency))}</h2>
          </div>
        </div>

        <h3>Prorated Daily Limit Trackers</h3>
        <table>
          <thead>
            <tr>
              <th>Tracker Name</th>
              <th>Monthly Cap</th>
              <th>Daily Allowance</th>
              <th>Total Spent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${proratedRules
              .map((rule) => {
                const daysInMon = getDaysInMonth(month);
                const dailyLimit = (rule.monthlyMaxSpend + (rule.rolloverAmount || 0)) / daysInMon;
                const spent = monthTxs
                  .filter((t) => t.type === 'expense' && t.category === rule.categoryId)
                  .reduce((sum, t) => sum + t.amount, 0);
                const eff = rule.monthlyMaxSpend + (rule.rolloverAmount || 0);
                return `
                <tr>
                  <td><strong>${escapeHtml(rule.name)}</strong></td>
                  <td>${escapeHtml(formatCurrency(eff, currency))}</td>
                  <td>${escapeHtml(formatCurrency(dailyLimit, currency))}/day</td>
                  <td>${escapeHtml(formatCurrency(spent, currency))}</td>
                  <td>${spent <= eff ? 'Within Budget' : 'Exceeded'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <h3>Recent Transactions (${escapeHtml(monthName)})</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${monthTxs
              .slice(0, 30)
              .map(
                (t) => `
              <tr>
                <td>${escapeHtml(t.date)}</td>
                <td>${escapeHtml(t.title)}</td>
                <td>${escapeHtml(categoryMap.get(t.category) || t.category)}</td>
                <td>${escapeHtml(t.type.toUpperCase())}</td>
                <td><strong>${escapeHtml(formatCurrency(t.amount, currency))}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="no-print">
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }, 500);
    }
  } catch (err) {
    console.error('Print generation failed:', err);
  }
}
