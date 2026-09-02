import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  Layers,
  ChevronRight,
  Cookie,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, getMonthName, getDaysInMonth } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { calculateProratedDailyBreakdown } from '../../utils/budgetCalculations';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddProrated: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onNavigateTab,
  onOpenAddProrated,
}) => {
  const {
    transactions,
    categories,
    proratedRules,
    savingsGoals,
    debts,
    alerts,
    selectedMonth,
    settings,
  } = useExpense();

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Financial summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    monthTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });

    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    const totalBudget = categories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
    const budgetUsedPercent = totalBudget > 0 ? (expense / totalBudget) * 100 : 0;

    return {
      income,
      expense,
      net,
      savingsRate,
      totalBudget,
      budgetUsedPercent,
    };
  }, [monthTransactions, categories]);

  // Category Breakdown for Pie Chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; icon: string }> = {};

    categories.forEach((c) => {
      map[c.id] = { name: c.name, value: 0, color: c.color, icon: c.icon };
    });

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!map[t.category]) {
          map[t.category] = { name: 'Other', value: 0, color: '#94a3b8', icon: 'Tag' };
        }
        map[t.category].value += t.amount;
      });

    return Object.values(map)
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, monthTransactions]);

  // Daily Spending Trend for Area Chart
  const dailySpendData = useMemo(() => {
    const daysInMon = getDaysInMonth(selectedMonth);
    const dayMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMon; d++) dayMap[d] = 0;

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = parseInt(t.date.split('-')[2], 10);
        if (day >= 1 && day <= daysInMon) {
          dayMap[day] = (dayMap[day] || 0) + t.amount;
        }
      });

    return Object.entries(dayMap).map(([day, amount]) => ({
      day: parseInt(day, 10),
      dayLabel: `Day ${day}`,
      amount: Number(amount.toFixed(2)),
    }));
  }, [selectedMonth, monthTransactions]);

  // Primary Prorated Rule Spotlight (e.g. Snacks)
  const primaryProratedRule = proratedRules[0] || null;
  const proratedBreakdown = useMemo(() => {
    if (!primaryProratedRule) return null;
    return calculateProratedDailyBreakdown(primaryProratedRule, transactions, selectedMonth);
  }, [primaryProratedRule, transactions, selectedMonth]);

  // Unread high-priority alerts
  const criticalAlerts = useMemo(() => {
    return alerts.filter((a) => !a.read && (a.severity === 'danger' || a.severity === 'warning'));
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Alert Banner if any critical issues */}
      {criticalAlerts.length > 0 && (
        <div className="bg-[#111114] border-l-4 border-l-[#ff5f5f] border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(255,95,95,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5f5f]/15 border border-[#ff5f5f]/30 text-[#ff5f5f] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ff5f5f] bg-[#ff5f5f]/10 px-2 py-0.5 rounded">
                  CRITICAL ALERT
                </span>
                <h4 className="text-xs font-bold text-white">
                  {criticalAlerts[0].title}
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                {criticalAlerts[0].message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab(criticalAlerts[0].linkTab || 'prorated')}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Review Details →
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Total Income</span>
            <div className="w-7 h-7 rounded-lg bg-[#c1ff72]/10 border border-[#c1ff72]/20 text-[#c1ff72] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value text-[#c1ff72] font-mono">
            {formatCurrency(summary.income, settings.currency)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono uppercase">
            {getMonthName(selectedMonth)} INFLOW
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-[#ff5f5f]/10 border border-[#ff5f5f]/20 text-[#ff5f5f] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value text-white font-mono">
            {formatCurrency(summary.expense, settings.currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {summary.totalBudget > 0 ? (
              <span>
                {summary.budgetUsedPercent.toFixed(0)}% of {formatCurrency(summary.totalBudget, settings.currency)} cap
              </span>
            ) : (
              <span>All recorded outflow</span>
            )}
          </div>
        </div>

        {/* Net Savings & Rate */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Net Savings</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-zinc-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`stat-value font-mono ${
              summary.net >= 0 ? 'text-[#c1ff72]' : 'text-[#ff5f5f]'
            }`}
          >
            {formatCurrency(summary.net, settings.currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Savings Rate:</span>
            <span className="font-mono font-bold text-[#c1ff72]">
              {summary.savingsRate > 0 ? `+${summary.savingsRate.toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Prorated Daily Limit Spotlight */}
        <div
          onClick={() => onNavigateTab('prorated')}
          className="bg-gradient-to-br from-[#c1ff72]/10 via-[#111114] to-[#111114] p-5 rounded-2xl border border-[#c1ff72]/30 shadow-[0_0_15px_rgba(193,255,114,0.07)] cursor-pointer hover:border-[#c1ff72]/60 transition-all group backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#c1ff72] uppercase tracking-wider mb-2">
            <span className="truncate">
              {primaryProratedRule ? `${primaryProratedRule.name} Daily Cap` : 'Prorated Limit'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#c1ff72] text-black font-bold flex items-center justify-center shadow-[0_0_10px_rgba(193,255,114,0.4)]">
              <Cookie className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value text-white font-mono flex items-baseline gap-1">
            <span className="text-[#c1ff72]">
              {proratedBreakdown
                ? formatCurrency(proratedBreakdown.dailyProratedLimit, settings.currency)
                : formatCurrency(0, settings.currency)}
            </span>
            <span className="text-xs text-zinc-400 font-normal">/ day</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>
              {proratedBreakdown
                ? `${formatCurrency(proratedBreakdown.totalSpentSoFar, settings.currency)} spent`
                : 'Click to setup'}
            </span>
            <span className="text-[#c1ff72] font-bold group-hover:translate-x-0.5 transition-transform text-xs">
              View Tracker →
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Trend Line/Area Chart */}
        <div className="lg:col-span-2 bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Expense Trajectory • Daily Spending Flow
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Velocity throughout {getMonthName(selectedMonth)}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold font-mono text-[#c1ff72] hover:underline uppercase tracking-wider"
            >
              Full Reports →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c1ff72" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c1ff72" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickFormatter={(v) => `D${v}`}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickFormatter={(v) => `${settings.currency}${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#18181b] text-white p-3 rounded-xl border border-white/10 shadow-2xl text-xs">
                          <div className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                            Day {payload[0].payload.day}
                          </div>
                          <div className="text-[#c1ff72] font-mono font-bold text-sm mt-0.5">
                            {formatCurrency(payload[0].value as number, settings.currency)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#c1ff72"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                  className="drop-shadow-[0_0_10px_rgba(193,255,114,0.3)]"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Category Distribution
              </h3>
              <span className="tag">{categoryChartData.length} ACTIVE</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Distribution of total monthly spend</p>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [formatCurrency(val, settings.currency), 'Spent']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Total Spent</span>
              <span className="text-xs font-mono font-bold text-white">
                {formatCurrency(summary.expense, settings.currency)}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto mt-2 pt-2 border-t border-white/[0.06]">
            {categoryChartData.slice(0, 5).map((cat) => {
              const pct = summary.expense > 0 ? ((cat.value / summary.expense) * 100).toFixed(0) : '0';
              return (
                <div key={cat.name} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-zinc-300 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-zinc-200">
                    <span>{formatCurrency(cat.value, settings.currency)}</span>
                    <span className="text-zinc-500 text-[10px] w-7 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Prorated Snapshot & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prorated Spending Spotlight Card */}
        {proratedBreakdown && primaryProratedRule && (
          <div className="bg-[#111114] p-6 rounded-2xl border border-[#c1ff72]/20 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#c1ff72]/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
                  Daily Limit Target
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('prorated')}
                  className="text-xs font-bold font-mono text-[#c1ff72] hover:underline uppercase tracking-wider"
                >
                  Analyzer →
                </button>
              </div>
              <h4 className="text-base font-bold text-white mt-3">
                {primaryProratedRule.name} Spending Tracker
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Monthly Cap: {formatCurrency(primaryProratedRule.monthlyMaxSpend, settings.currency)}
              </p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                  <span>Month-to-date Used</span>
                  <span className="text-[#c1ff72] font-bold">
                    {((proratedBreakdown.totalSpentSoFar / proratedBreakdown.effectiveMonthlyBudget) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      proratedBreakdown.totalSpentSoFar > proratedBreakdown.effectiveMonthlyBudget
                        ? 'bg-[#ff5f5f] shadow-[0_0_10px_rgba(255,95,95,0.5)]'
                        : 'bg-[#c1ff72] shadow-[0_0_10px_rgba(193,255,114,0.5)]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (proratedBreakdown.totalSpentSoFar / proratedBreakdown.effectiveMonthlyBudget) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/[0.06] text-xs font-mono">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Daily Target:</span>
                  <span className="font-bold text-[#c1ff72] text-sm">
                    {formatCurrency(proratedBreakdown.dailyProratedLimit, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Over-Limit Days:</span>
                  <span
                    className={`font-bold text-sm ${
                      proratedBreakdown.exceededDaysCount > 0 ? 'text-[#ff5f5f]' : 'text-[#c1ff72]'
                    }`}
                  >
                    {proratedBreakdown.exceededDaysCount} Days
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('prorated')}
              className="mt-5 w-full py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(193,255,114,0.25)] uppercase tracking-wider"
            >
              <Zap className="w-3.5 h-3.5 text-black" />
              View Prorated Trajectory
            </button>
          </div>
        )}

        {/* Recent Transactions List */}
        <div className={`bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md ${proratedBreakdown ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Recent Transactions
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Latest expenses & income logged</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-bold font-mono text-[#c1ff72] hover:underline uppercase tracking-wider"
            >
              View All ({transactions.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {monthTransactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10"
                      style={{ backgroundColor: cat?.color || '#27272a' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">{tx.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="font-mono">{tx.date}</span>
                        <span>•</span>
                        <span>{cat?.name || 'General'}</span>
                        {tx.tags && tx.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[#c1ff72] font-mono">#{tx.tags[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-mono font-bold ${
                        tx.type === 'income' ? 'text-[#c1ff72]' : 'text-zinc-100'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

