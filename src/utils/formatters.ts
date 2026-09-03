import { Transaction, Category, ProratedBudgetRule, SavingsGoal, DebtItem } from '../types';

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
    'Tags',
    'Notes',
    'Recurring',
  ];

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
    } else if (!t.proratedRuleId) {
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
  lines.push('--- EXECUTIVE SUMMARY (GENERAL EXPENSES) ---');
  lines.push(`Total Income,${currency}${totalIncome.toFixed(2)}`);
  lines.push(`Total General Expenses,${currency}${totalExpense.toFixed(2)}`);
  lines.push(`Net Savings,${currency}${netSavings.toFixed(2)}`);
  lines.push(`Savings Rate,${savingsRate}%`);
  lines.push('');
  lines.push('--- CATEGORY BREAKDOWN (GENERAL EXPENSES) ---');
  lines.push('Category,Allocated Budget,Actual Spent,Remaining / Over,Status');

  Object.entries(categorySpending).forEach(([catId, data]) => {
    const cat = categoryMap.get(catId);
    const catName = cat ? cat.name : catId;
    const diff = data.budget > 0 ? data.budget - data.spent : 0;
    const status = data.budget === 0 ? 'No Budget' : diff >= 0 ? 'Within Budget' : 'OVER BUDGET';
    lines.push(
      `"${catName}",${data.budget.toFixed(2)},${data.spent.toFixed(2)},${diff.toFixed(2)},${status}`
    );
  });

  lines.push('');
  lines.push('--- PRORATED DAILY SPEND TRACKERS (ISOLATED) ---');
  lines.push('Item/Rule Name,Monthly Max Spend,Daily Prorated Limit,Days In Month,Total Spent,Status');

  const daysInMon = getDaysInMonth(month);
  proratedRules.forEach((rule) => {
    const dailyLimit = (rule.monthlyMaxSpend + (rule.rolloverAmount || 0)) / daysInMon;
    const ruleTransactions = monthTransactions.filter(
      (t) => t.type === 'expense' && t.proratedRuleId === rule.id
    );
    const totalSpent = ruleTransactions.reduce((sum, t) => sum + t.amount, 0);
    const effBudget = rule.monthlyMaxSpend + (rule.rolloverAmount || 0);
    const status = totalSpent <= effBudget ? 'Within Budget' : 'Exceeded';
    lines.push(
      `"${rule.name}",${effBudget.toFixed(2)},${dailyLimit.toFixed(2)},${daysInMon},${totalSpent.toFixed(2)},${status}`
    );
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

export function generatePDFReportWindow(
  month: string,
  transactions: Transaction[],
  categories: Category[],
  proratedRules: ProratedBudgetRule[],
  savingsGoals: SavingsGoal[] = [],
  debts: DebtItem[] = [],
  currency: string = '₹'
): void {
  const monthName = getMonthName(month);
  const monthTxs = transactions.filter((t) => t.date.startsWith(month));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const totalIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTxs
    .filter((t) => t.type === 'expense' && !t.proratedRuleId)
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Report - ${monthName}</title>
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
          <p>Period: ${monthName} | Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary-grid">
          <div class="card">
            <span>Total Income</span>
            <h2 class="income">${formatCurrency(totalIncome, currency)}</h2>
          </div>
          <div class="card">
            <span>Total Expenses</span>
            <h2 class="expense">${formatCurrency(totalExpense, currency)}</h2>
          </div>
          <div class="card">
            <span>Net Balance</span>
            <h2 class="net">${formatCurrency(netBalance, currency)}</h2>
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
                  <td><strong>${rule.name}</strong></td>
                  <td>${formatCurrency(eff, currency)}</td>
                  <td>${formatCurrency(dailyLimit, currency)}/day</td>
                  <td>${formatCurrency(spent, currency)}</td>
                  <td>${spent <= eff ? 'Within Budget' : 'Exceeded'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <h3>Recent Transactions (${monthName})</h3>
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
                <td>${t.date}</td>
                <td>${t.title}</td>
                <td>${categoryMap.get(t.category) || t.category}</td>
                <td>${t.type.toUpperCase()}</td>
                <td><strong>${formatCurrency(t.amount, currency)}</strong></td>
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

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(html);
    printWin.document.close();
  }
}
