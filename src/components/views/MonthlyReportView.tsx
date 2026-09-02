import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, getMonthName, getDaysInMonth } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { calculateProratedDailyBreakdown } from '../../utils/budgetCalculations';

interface MonthlyReportViewProps {
  onOpenExport: () => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ onOpenExport }) => {
  const {
    transactions,
    categories,
    proratedRules,
    selectedMonth,
    settings,
  } = useExpense();

  const daysInMon = getDaysInMonth(selectedMonth);

  // Month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Financial calculations
  const report = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const catMap: Record<string, { spent: number; budget: number }> = {};

    categories.forEach((c) => {
      catMap[c.id] = { spent: 0, budget: c.monthlyBudget || 0 };
    });

    monthTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (!catMap[t.category]) {
          catMap[t.category] = { spent: 0, budget: 0 };
        }
        catMap[t.category].spent += t.amount;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const totalBudget = categories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
    const dailyAverage = totalExpense / daysInMon;

    // Category breakdown list
    const categoryBreakdown = categories
      .map((cat) => {
        const spent = catMap[cat.id]?.spent || 0;
        const budget = cat.monthlyBudget || 0;
        const diff = budget > 0 ? budget - spent : 0;
        const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
        return {
          cat,
          spent,
          budget,
          diff,
          percentUsed,
          isOver: budget > 0 && spent > budget,
        };
      })
      .filter((item) => item.spent > 0 || item.budget > 0);

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      totalBudget,
      dailyAverage,
      categoryBreakdown,
    };
  }, [monthTransactions, categories, daysInMon]);

  // Cashflow comparison bar chart data
  const comparisonData = useMemo(() => {
    return [
      {
        name: getMonthName(selectedMonth),
        Income: Number(report.totalIncome.toFixed(2)),
        Expenses: Number(report.totalExpense.toFixed(2)),
        NetSavings: Number(report.netSavings.toFixed(2)),
      },
    ];
  }, [report, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
              EXECUTIVE STATEMENT
            </span>
            <span className="text-xs text-zinc-600 font-mono">•</span>
            <span className="text-xs font-mono text-zinc-400">
              {getMonthName(selectedMonth)}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 tracking-tight">
            Month-Wise Financial Performance Report
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Full audit of income, expenses, category budget adherence, and prorated rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 uppercase tracking-wider"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
          <button
            type="button"
            id="report-export-csv-btn"
            onClick={onOpenExport}
            className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-1.5 uppercase tracking-wider text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">TOTAL INFLOW</span>
          <div className="text-2xl font-bold font-mono text-[#c1ff72]">
            {formatCurrency(report.totalIncome, settings.currency)}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block font-mono">Monthly earnings</span>
        </div>

        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">TOTAL OUTFLOW</span>
          <div className="text-2xl font-bold font-mono text-white">
            {formatCurrency(report.totalExpense, settings.currency)}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block font-mono">
            Avg: {formatCurrency(report.dailyAverage, settings.currency)} / day
          </span>
        </div>

        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">NET SAVINGS</span>
          <div
            className={`text-2xl font-bold font-mono ${
              report.netSavings >= 0 ? 'text-[#c1ff72]' : 'text-[#ff5f5f]'
            }`}
          >
            {formatCurrency(report.netSavings, settings.currency)}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block font-mono">
            {report.netSavings >= 0 ? 'Surplus retained' : 'Operating deficit'}
          </span>
        </div>

        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">SAVINGS RATE</span>
          <div className="text-2xl font-bold font-mono text-white">
            {report.savingsRate > 0 ? `${report.savingsRate.toFixed(1)}%` : '0.0%'}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block font-mono">
            Target benchmark: 20%+
          </span>
        </div>
      </div>

      {/* Cashflow Comparison Chart */}
      <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-1">
          Monthly Inflow vs Outflow Comparison
        </h3>
        <p className="text-xs text-zinc-400 font-mono mb-4">
          Visual comparison of total monthly income, expenditure, and retained savings
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
              <YAxis
                tickLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickFormatter={(v) => `${settings.currency}${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181c',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [formatCurrency(val, settings.currency)]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#c1ff72" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ff5f5f" radius={[6, 6, 0, 0]} />
              <Bar dataKey="NetSavings" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prorated Daily Rules in Statement */}
      {proratedRules.length > 0 && (
        <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Prorated Daily Spend Allocations
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Items tracked on a daily prorated ceiling basis
              </p>
            </div>
            <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
              {proratedRules.length} TRACKED ITEMS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proratedRules.map((rule) => {
              const ruleBreakdown = calculateProratedDailyBreakdown(
                rule,
                transactions,
                selectedMonth
              );
              const pct = (ruleBreakdown.totalSpentSoFar / ruleBreakdown.effectiveMonthlyBudget) * 100;
              return (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Daily Limit: {formatCurrency(ruleBreakdown.dailyProratedLimit, settings.currency)} / day
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white font-mono">
                        {formatCurrency(ruleBreakdown.totalSpentSoFar, settings.currency)}
                      </span>
                      <span className="text-[11px] text-zinc-500 block font-mono">
                        of {formatCurrency(ruleBreakdown.effectiveMonthlyBudget, settings.currency)} cap
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 100 ? 'bg-[#ff5f5f]' : 'bg-[#c1ff72]'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 font-mono">
                    <span>
                      {ruleBreakdown.exceededDaysCount > 0
                        ? `${ruleBreakdown.exceededDaysCount} days over daily limit`
                        : 'Zero over-limit days'}
                    </span>
                    <span className="font-semibold text-white">{pct.toFixed(0)}% used</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Allocation vs Actual Adherence Matrix */}
      <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white">
            Category Budget Performance Matrix
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Detailed breakdown of allocated budget vs actual spending per category
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181c] text-zinc-400 font-bold border-b border-white/[0.08] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Allocated Budget</th>
                <th className="py-3 px-4">Actual Spent</th>
                <th className="py-3 px-4">Variance / Remaining</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {report.categoryBreakdown.map(({ cat, spent, budget, diff, percentUsed, isOver }) => {
                return (
                  <tr key={cat.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 border border-white/10"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white">{cat.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      {budget > 0 ? formatCurrency(budget, settings.currency) : 'No Cap'}
                    </td>

                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {formatCurrency(spent, settings.currency)}
                    </td>

                    <td className="py-3 px-4 font-semibold font-mono">
                      {budget > 0 ? (
                        <span className={diff >= 0 ? 'text-[#c1ff72]' : 'text-[#ff5f5f]'}>
                          {diff >= 0 ? '+' : ''}
                          {formatCurrency(diff, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 min-w-[120px]">
                      {budget > 0 ? (
                        <div className="space-y-1">
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver
                                  ? 'bg-[#ff5f5f]'
                                  : percentUsed > 80
                                  ? 'bg-amber-400'
                                  : 'bg-[#c1ff72]'
                              }`}
                              style={{ width: `${Math.min(100, percentUsed)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {percentUsed.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {budget === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                          Unbudgeted
                        </span>
                      ) : isOver ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff5f5f]/10 text-[#ff5f5f] border border-[#ff5f5f]/30">
                          Over Budget
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#c1ff72]/10 text-[#c1ff72] border border-[#c1ff72]/30">
                          On Track
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
