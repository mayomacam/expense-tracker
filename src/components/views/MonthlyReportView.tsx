import React, { useState, useMemo } from 'react';
import { FileBarChart, Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import {
  formatCurrency,
  generateMonthlyReportCSV,
  downloadCSV,
  generatePDFReportWindow,
} from '../../utils/formatters';

export const MonthlyReportView: React.FC = () => {
  const { transactions, categories, proratedRules, proratedSpends, savingsGoals, debts, settings } = useExpense();
  const [selectedMonth, setSelectedMonth] = useState(
    settings.selectedMonth || new Date().toISOString().slice(0, 7)
  );

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const totalIncome = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const totalExpense = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'expense' && !t.proratedRuleId)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const netSavings = totalIncome - totalExpense;

  // Category breakdown (General Expenses only)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of monthlyTransactions.filter((t) => t.type === 'expense' && !t.proratedRuleId)) {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlyTransactions]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const handleExportCSV = () => {
    const csv = generateMonthlyReportCSV(
      selectedMonth,
      transactions,
      categories,
      proratedRules,
      proratedSpends,
      settings.currency
    );
    downloadCSV(csv, `report-${selectedMonth}.csv`);
  };

  const handlePrintPDF = () => {
    generatePDFReportWindow(
      selectedMonth,
      transactions,
      categories,
      proratedRules,
      savingsGoals,
      debts,
      proratedSpends,
      settings.currency
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-[#c1ff72]" />
            <h2 className="text-lg font-bold text-white tracking-tight">Financial Reports &amp; Analytics</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Summaries, category breakdown, and exportable statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <span className="text-xs text-zinc-400">Total Income</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalIncome, settings.currency)}
          </div>
        </div>
        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <span className="text-xs text-zinc-400">Total Expenses</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalExpense, settings.currency)}
          </div>
        </div>
        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <span className="text-xs text-zinc-400">Net Surplus</span>
          <div
            className={`text-xl font-bold mt-1 ${
              netSavings >= 0 ? 'text-[#c1ff72]' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netSavings, settings.currency)}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Expense Distribution by Category</h3>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No expense records found for {selectedMonth}.
          </div>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map(([catId, amount]) => {
              const cat = categoryMap.get(catId);
              const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
              return (
                <div key={catId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium">{cat?.name || catId}</span>
                    <span className="text-zinc-400">
                      {formatCurrency(amount, settings.currency)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat?.color || '#6366F1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
