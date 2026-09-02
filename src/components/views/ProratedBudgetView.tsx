import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
  Info,
  Cookie,
  Coffee,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { ProratedBudgetRule, Transaction } from '../../types';
import { calculateProratedDailyBreakdown } from '../../utils/budgetCalculations';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface ProratedBudgetViewProps {
<<<<<<< HEAD
  selectedRuleId?: string;
  onSelectRuleId?: (id: string) => void;
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
  onOpenAddTransaction: (defaultCategory?: string) => void;
  onOpenAddProratedModal: () => void;
  onEditProratedRule: (rule: ProratedBudgetRule) => void;
}

export const ProratedBudgetView: React.FC<ProratedBudgetViewProps> = ({
<<<<<<< HEAD
  selectedRuleId: externalSelectedRuleId,
  onSelectRuleId,
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
  onOpenAddTransaction,
  onOpenAddProratedModal,
  onEditProratedRule,
}) => {
  const {
    proratedRules,
    transactions,
    categories,
    selectedMonth,
    deleteProratedRule,
    deleteTransaction,
    settings,
  } = useExpense();

<<<<<<< HEAD
  const [internalSelectedRuleId, setInternalSelectedRuleId] = useState<string>(
=======
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
    proratedRules[0]?.id || ''
  );
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily'>('daily');

<<<<<<< HEAD
  const selectedRuleId = externalSelectedRuleId || internalSelectedRuleId;

=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
  // Selected Rule
  const activeRule = useMemo(() => {
    return proratedRules.find((r) => r.id === selectedRuleId) || proratedRules[0] || null;
  }, [proratedRules, selectedRuleId]);

  // Breakdown calculations
  const breakdown = useMemo(() => {
    if (!activeRule) return null;
    return calculateProratedDailyBreakdown(activeRule, transactions, selectedMonth);
  }, [activeRule, transactions, selectedMonth]);

  // Chart Data
  const chartData = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.dailyRecords.map((r) => ({
      dayLabel: `Day ${r.day}`,
      day: r.day,
      date: r.date,
      dayOfWeek: r.dayOfWeek,
      dailySpend: r.amountSpent,
      dailyLimit: r.dailyProratedLimit,
      cumulativeSpend: r.cumulativeSpent,
      cumulativeLimit: r.cumulativeProratedLimit,
      isOver: r.isOverLimit,
      delta: r.delta,
    }));
  }, [breakdown]);

  if (proratedRules.length === 0 || !activeRule || !breakdown) {
    return (
      <div className="bg-[#111114] rounded-2xl p-12 text-center border border-white/[0.08] shadow-2xl max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-[#c1ff72]/10 border border-[#c1ff72]/30 text-[#c1ff72] mx-auto flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">
          No Prorated Daily Spending Limits Set
        </h3>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Track specific expenses (like Snacks, Coffee, or Dining Out) by setting a monthly max
          spend that divides evenly across all days in the month with automated overspend alerts.
        </p>
        <button
          id="empty-add-prorated-btn"
          type="button"
          onClick={onOpenAddProratedModal}
          className="mt-6 px-5 py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] inline-flex items-center gap-2 transition-all uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 text-black" />
          Create Prorated Tracker (e.g. Snacks $500/mo)
        </button>
      </div>
    );
  }

  const linkedCategory = categories.find((c) => c.id === activeRule.categoryId);

  return (
    <div className="space-y-6">
<<<<<<< HEAD
      {/* Top Banner */}
=======
      {/* Top Banner / Item Selector */}
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
              Prorated Engine
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs font-mono text-zinc-400">
              {getMonthName(selectedMonth)} ({breakdown.daysInMonth} DAYS)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
            {activeRule.name} Daily Limit & Tracking
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Monthly max spend of {formatCurrency(activeRule.monthlyMaxSpend, settings.currency)} ÷ {breakdown.daysInMonth} days ={' '}
            <strong className="text-[#c1ff72]">
              {formatCurrency(breakdown.dailyProratedLimit, settings.currency)} / day
            </strong>
          </p>
        </div>

<<<<<<< HEAD
        {/* Note indicating controls moved to Sidebar */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#c1ff72] animate-pulse" />
          <span>Tracker selector & Log Spend button in Sidebar 👉</span>
        </div>
      </div>
      </div>
=======
        {/* Rule Switcher & Manage Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {proratedRules.length > 1 && (
            <select
              id="select-prorated-rule-dropdown"
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#c1ff72]"
            >
              {proratedRules.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#111114] text-white">
                  {r.name} ({formatCurrency(r.monthlyMaxSpend, settings.currency)}/mo)
                </option>
              ))}
            </select>
          )}

          <button
            id="edit-active-prorated-btn"
            type="button"
            onClick={() => onEditProratedRule(activeRule)}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium transition-colors"
            title="Edit rule settings"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            id="add-another-prorated-btn"
            type="button"
            onClick={onOpenAddProratedModal}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span>New Tracker</span>
          </button>

          <button
            id="log-snack-spend-btn"
            type="button"
            onClick={() => onOpenAddTransaction(activeRule.categoryId)}
            className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] flex items-center gap-1.5 transition-all uppercase tracking-wider text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Log {activeRule.name} Spend</span>
          </button>
        </div>
      </div>
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Prorated Allowance */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Daily Prorated Limit</span>
            <Calculator className="w-4 h-4 text-[#c1ff72]" />
          </div>
          <div className="stat-value text-[#c1ff72] font-mono">
            {formatCurrency(breakdown.dailyProratedLimit, settings.currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            <span>{formatCurrency(breakdown.effectiveMonthlyBudget, settings.currency)} ÷ {breakdown.daysInMonth} days</span>
          </div>
        </div>

        {/* Total Spent vs Budget */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Total Spent / Cap</span>
            <TrendingUp className="w-4 h-4 text-[#c1ff72]" />
          </div>
          <div className="stat-value text-white font-mono">
            {formatCurrency(breakdown.totalSpentSoFar, settings.currency)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>Cap: {formatCurrency(breakdown.effectiveMonthlyBudget, settings.currency)}</span>
            <span
              className={`font-bold ${
                breakdown.remainingBudget >= 0 ? 'text-[#c1ff72]' : 'text-[#ff5f5f]'
              }`}
            >
              {breakdown.remainingBudget >= 0
                ? `${formatCurrency(breakdown.remainingBudget, settings.currency)} left`
                : `${formatCurrency(Math.abs(breakdown.remainingBudget), settings.currency)} OVER`}
            </span>
          </div>
        </div>

        {/* Over-Limit Days */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Over-Limit Days</span>
            <AlertTriangle className={`w-4 h-4 ${breakdown.exceededDaysCount > 0 ? 'text-[#ff5f5f]' : 'text-[#c1ff72]'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`stat-value font-mono ${
                breakdown.exceededDaysCount > 0 ? 'text-[#ff5f5f]' : 'text-[#c1ff72]'
              }`}
            >
              {breakdown.exceededDaysCount}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / {breakdown.daysPassed} days tracked
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {breakdown.maxDaySpent.amount > 0 ? (
              <span>Peak: {formatCurrency(breakdown.maxDaySpent.amount, settings.currency)} (D{breakdown.maxDaySpent.day})</span>
            ) : (
              <span>No spend recorded</span>
            )}
          </div>
        </div>

        {/* Rollover & Projected */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span>Daily Velocity</span>
            <ArrowRightLeft className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="stat-value text-white font-mono">
            {formatCurrency(breakdown.averageDailySpend, settings.currency)}
            <span className="text-xs text-zinc-400 font-normal ml-1">/ day</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>
              {activeRule.rolloverEnabled
                ? `Rollover: ${activeRule.rolloverAmount > 0 ? '+' : ''}${formatCurrency(
                    activeRule.rolloverAmount,
                    settings.currency
                  )}`
                : 'Rollover Off'}
            </span>
            <span className="text-[#c1ff72] font-semibold">
              Pace: {formatCurrency(breakdown.projectedMonthEndSpend, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Visual Chart: Actual Spending vs Daily Limit */}
      <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Expense Trajectory • Actual vs Daily Limit
              </h3>
              <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
                LIVE CURVE
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daily spend bars and cumulative burn trajectory vs calculated daily allowance
            </p>
          </div>

          {/* Toggle between Daily and Cumulative View */}
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              id="chart-mode-daily-btn"
              type="button"
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'daily'
                  ? 'bg-[#c1ff72] text-black font-bold shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Daily Spending Bars
            </button>
            <button
              id="chart-mode-cumulative-btn"
              type="button"
              onClick={() => setChartMode('cumulative')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'cumulative'
                  ? 'bg-[#c1ff72] text-black font-bold shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cumulative Trend Line
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'daily' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#18181b] text-white p-3 rounded-xl shadow-2xl text-xs space-y-1.5 border border-white/10">
                          <div className="font-bold flex items-center justify-between gap-3 text-zinc-200">
                            <span className="font-mono">{data.date} ({data.dayOfWeek})</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                data.isOver
                                  ? 'bg-[#ff5f5f]/20 text-[#ff5f5f] border border-[#ff5f5f]/30'
                                  : 'bg-[#c1ff72]/20 text-[#c1ff72] border border-[#c1ff72]/30'
                              }`}
                            >
                              {data.isOver ? 'Exceeded' : 'Within Limit'}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-white/10 space-y-1 font-mono">
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Day's Spend:</span>
                              <span className="font-bold text-[#c1ff72]">
                                {formatCurrency(data.dailySpend, settings.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Prorated Limit:</span>
                              <span className="font-medium text-zinc-300">
                                {formatCurrency(data.dailyLimit, settings.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Difference:</span>
                              <span
                                className={`font-bold ${
                                  data.delta > 0 ? 'text-[#ff5f5f]' : 'text-[#c1ff72]'
                                }`}
                              >
                                {data.delta > 0 ? '+' : ''}
                                {formatCurrency(data.delta, settings.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Reference ceiling line for daily limit */}
                <ReferenceLine
                  y={breakdown.dailyProratedLimit}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Target: ${formatCurrency(breakdown.dailyProratedLimit, settings.currency)}`,
                    position: 'insideTopRight',
                    fill: '#c1ff72',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="dailySpend"
                  name="Daily Spend"
                  fill="#c1ff72"
                  radius={[4, 4, 0, 0]}
                  shape={(props: any) => {
                    const { fill, x, y, width, height, payload } = props;
                    const isOver = payload.isOver && payload.dailySpend > 0;
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={isOver ? '#ff5f5f' : '#c1ff72'}
                        rx={3}
                        ry={3}
                      />
                    );
                  }}
                />
              </ComposedChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#18181b] text-white p-3 rounded-xl shadow-2xl text-xs space-y-1.5 border border-white/10 font-mono">
                          <div className="font-bold text-zinc-200">
                            {data.date} (Day {data.day})
                          </div>
                          <div className="pt-1 border-t border-white/10 space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Cumulative Spent:</span>
                              <span className="font-bold text-[#c1ff72]">
                                {formatCurrency(data.cumulativeSpend, settings.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Cumulative Ceiling:</span>
                              <span className="font-medium text-zinc-300">
                                {formatCurrency(data.cumulativeLimit, settings.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLimit"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Prorated Budget Ceiling"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeSpend"
                  stroke="#c1ff72"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#c1ff72', strokeWidth: 1, stroke: '#09090b' }}
                  activeDot={{ r: 6 }}
                  name="Actual Cumulative Spend"
                  className="drop-shadow-[0_0_8px_rgba(193,255,114,0.4)]"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend description */}
        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-4 border-t border-white/[0.06] mt-2 gap-2 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#c1ff72] inline-block shadow-[0_0_5px_rgba(193,255,114,0.4)]" />
              Within Daily Limit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#ff5f5f] inline-block shadow-[0_0_5px_rgba(255,95,95,0.4)]" />
              Exceeded Daily Limit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-white/40 inline-block border-t border-dashed border-white/60" />
              Daily Limit Target ({formatCurrency(breakdown.dailyProratedLimit, settings.currency)})
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Hover over any point to inspect day-by-day delta
          </span>
        </div>
      </div>

      {/* Day-by-Day Itemized Table & Calendar Breakdown */}
      <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Day-by-Day {activeRule.name} Spending Log
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              Prorated timeline for {getMonthName(selectedMonth)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Daily Target:</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#c1ff72]/15 text-[#c1ff72] border border-[#c1ff72]/30 text-xs font-mono font-bold">
              {formatCurrency(breakdown.dailyProratedLimit, settings.currency)} / day
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181c] text-zinc-400 font-bold sticky top-0 border-b border-white/[0.08] z-10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actual Spend</th>
                <th className="py-3 px-4">Prorated Limit</th>
                <th className="py-3 px-4">Status & Delta</th>
                <th className="py-3 px-4">Itemized Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {breakdown.dailyRecords.map((rec) => {
                return (
                  <tr
                    key={rec.day}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      rec.isOverLimit && rec.amountSpent > 0 ? 'bg-[#ff5f5f]/[0.04]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      Day {rec.day}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono whitespace-nowrap">
                      {rec.date} <span className="text-[10px] text-zinc-500">({rec.dayOfWeek})</span>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={
                          rec.amountSpent > 0
                            ? rec.isOverLimit
                              ? 'text-[#ff5f5f] font-bold text-sm'
                              : 'text-white font-bold text-sm'
                            : 'text-zinc-600'
                        }
                      >
                        {formatCurrency(rec.amountSpent, settings.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono whitespace-nowrap">
                      {formatCurrency(rec.dailyProratedLimit, settings.currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      {rec.amountSpent === 0 ? (
                        <span className="tag text-zinc-500 bg-white/[0.02] border-white/5">
                          No Spend
                        </span>
                      ) : rec.isOverLimit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5f5f]/15 text-[#ff5f5f] border border-[#ff5f5f]/30">
                          <AlertCircle className="w-3 h-3" />
                          Exceeded +{formatCurrency(rec.delta, settings.currency)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#c1ff72]/15 text-[#c1ff72] border border-[#c1ff72]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Under {formatCurrency(Math.abs(rec.delta), settings.currency)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rec.transactions.length > 0 ? (
                        <div className="space-y-1">
                          {rec.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-white">{tx.title}</span>
                                {tx.tags && tx.tags.length > 0 && (
                                  <span className="ml-1.5 text-[10px] font-mono text-[#c1ff72]">
                                    {tx.tags.map((t) => `#${t}`).join(' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono">
                                <span className="font-bold text-white">
                                  {formatCurrency(tx.amount, settings.currency)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteTransaction(tx.id)}
                                  className="text-zinc-500 hover:text-[#ff5f5f] p-0.5 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic text-[11px] font-mono">No purchases</span>
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

