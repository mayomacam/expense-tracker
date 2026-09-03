import React from 'react';
import {
  X,
  PieChart,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calculator,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Zap,
  Trash2,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { ProratedBudgetRule } from '../types';
import { calculateProratedDailyBreakdown } from '../utils/budgetCalculations';

interface SidebarProps {
  activeTab: string;
  selectedRuleId?: string;
  onSelectRuleId?: (id: string) => void;
  onOpenAddTransaction: (defaultCategory?: string) => void;
  onOpenAddProratedModal: () => void;
  onEditProratedRule: (rule: ProratedBudgetRule) => void;
  onNavigateTab: (tab: string) => void;
  onClose?: () => void; // Optional for mobile close button
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectedRuleId,
  onSelectRuleId,
  onOpenAddTransaction,
  onOpenAddProratedModal,
  onEditProratedRule,
  onNavigateTab,
  onClose,
}) => {
  const {
    transactions,
    categories,
    proratedRules,
    debts,
    savingsGoals,
    settings,
    selectedMonth,
  } = useExpense();

  // Active Prorated Rule for Prorated Tab
  const activeRule =
    proratedRules.find((r) => r.id === selectedRuleId) || proratedRules[0] || null;

  const proratedBreakdown = activeRule
    ? calculateProratedDailyBreakdown(activeRule, transactions, selectedMonth)
    : null;

  // Monthly Cashflow Calculations
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const creditCardExpense = monthTransactions
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'credit_card')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Category spending & left money calculation
  const categoryStats = categories.map((cat) => {
    const catSpent = monthTransactions
      .filter((t) => t.category === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const budget = cat.monthlyBudget || 0;
    const amountLeft = budget - catSpent;
    const isOver = budget > 0 && catSpent > budget;
    const pct = budget > 0 ? Math.min(100, (catSpent / budget) * 100) : 0;

    return {
      cat,
      spent: catSpent,
      budget,
      amountLeft,
      isOver,
      pct,
    };
  });

  const categoriesWithBudgets = categoryStats.filter((c) => c.budget > 0 || c.spent > 0);

  return (
    <div className="bg-[#111114] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-md flex flex-col space-y-5 font-mono shadow-2xl">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#c1ff72] text-black flex items-center justify-center font-bold shadow-[0_0_10px_rgba(193,255,114,0.3)]">
            <PieChart className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">
              Financial Overview
            </h3>
            <p className="text-[10px] text-zinc-400">
              {getMonthName(selectedMonth)} Stats
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. Cashflow & Salary Card (Shown on all tabs) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
          Monthly Cashflow
        </span>

        {/* Salary / Income */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#c1ff72]/10 border border-[#c1ff72]/20">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span className="text-[11px] font-semibold text-zinc-200">Salary / Income</span>
          </div>
          <span className="text-xs font-extrabold text-[#c1ff72]">
            +{formatCurrency(totalIncome, settings.currency)}
          </span>
        </div>

        {/* Total Spend */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#ff5f5f]/10 border border-[#ff5f5f]/20">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-[#ff5f5f]" />
            <span className="text-[11px] font-semibold text-zinc-200">Total Spend</span>
          </div>
          <span className="text-xs font-extrabold text-[#ff5f5f]">
            -{formatCurrency(totalExpense, settings.currency)}
          </span>
        </div>

        {/* Credit Card Spend */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-zinc-200">Credit Card</span>
          </div>
          <span className="text-xs font-extrabold text-purple-300">
            {formatCurrency(creditCardExpense, settings.currency)}
          </span>
        </div>

        {/* Net Salary Remaining */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] font-bold text-white uppercase">Net Remaining</span>
          <span
            className={`text-sm font-extrabold ${
              netBalance >= 0 ? 'text-[#c1ff72]' : 'text-[#ff5f5f]'
            }`}
          >
            {formatCurrency(netBalance, settings.currency)}
          </span>
        </div>
      </div>

      {/* 2. DYNAMIC CONTEXTUAL CONTENT BASED ON ACTIVE TAB */}
      
      {/* TAB: PRORATED LIMITS - Shows Prorated Trackers Menu & Bright Green Log Button */}
      {activeTab === 'prorated' && (
        <div className="space-y-4 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#c1ff72] uppercase tracking-widest flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Prorated Trackers
            </h4>
            <button
              type="button"
              onClick={onOpenAddProratedModal}
              className="text-[10px] font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1 uppercase"
            >
              <Plus className="w-3 h-3 text-[#c1ff72]" />
              New Tracker
            </button>
          </div>

          {/* Prorated Trackers List (Replaces Dropdown!) */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {proratedRules.map((rule) => {
              const isSelected = activeRule?.id === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => onSelectRuleId && onSelectRuleId(rule.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#c1ff72]/10 border-[#c1ff72]/50 shadow-[0_0_12px_rgba(193,255,114,0.15)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#c1ff72]' : 'text-white'}`}>
                      {rule.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatCurrency(rule.monthlyMaxSpend, settings.currency)}/mo
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                    <span>
                      Daily Limit: {formatCurrency(rule.monthlyMaxSpend / 30, settings.currency)}/day
                    </span>
                    {isSelected && <span className="text-[#c1ff72] font-bold">Active ★</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bright Green "+ LOG SPEND" Button Moved into Sidebar! */}
          {activeRule && (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="sidebar-log-spend-btn"
                onClick={() => onOpenAddTransaction(activeRule.categoryId)}
                className="w-full py-3 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(193,255,114,0.4)] transition-all uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>LOG {activeRule.name.toUpperCase()} SPEND</span>
              </button>

              <button
                type="button"
                onClick={() => onEditProratedRule(activeRule)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors uppercase"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit {activeRule.name} Settings</span>
              </button>
            </div>
          )}

          {/* Selected Rule Daily Pacing Summary */}
          {proratedBreakdown && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Today's Daily Allowance
              </span>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Daily Target:</span>
                <span className="font-bold text-[#c1ff72]">
                  {formatCurrency(proratedBreakdown.dailyProratedLimit, settings.currency)}/day
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Over-Limit Days:</span>
                <span
                  className={`font-bold ${
                    proratedBreakdown.exceededDaysCount > 0 ? 'text-[#ff5f5f]' : 'text-[#c1ff72]'
                  }`}
                >
                  {proratedBreakdown.exceededDaysCount} Days
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: BUDGETS & RECURRING OR DASHBOARD - Shows Category Spent vs Left Gauges */}
      {(activeTab === 'budgets' || activeTab === 'dashboard') && (
        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Category Left Money Gauges
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab('budgets')}
              className="text-[10px] text-[#c1ff72] font-semibold hover:underline"
            >
              Caps →
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoriesWithBudgets.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 text-center">
                No monthly category caps configured.
              </div>
            ) : (
              categoriesWithBudgets.map(({ cat, spent, budget, amountLeft, isOver, pct }) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-white truncate">{cat.name}</span>
                    </div>

                    {budget > 0 ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          isOver
                            ? 'bg-[#ff5f5f]/20 text-[#ff5f5f] border-[#ff5f5f]/30'
                            : 'bg-[#c1ff72]/20 text-[#c1ff72] border-[#c1ff72]/30'
                        }`}
                      >
                        {isOver
                          ? `Over ${formatCurrency(Math.abs(amountLeft), settings.currency)}`
                          : `${formatCurrency(amountLeft, settings.currency)} Left`}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">No Cap</span>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>Spent: {formatCurrency(spent, settings.currency)}</span>
                    {budget > 0 && <span>Limit: {formatCurrency(budget, settings.currency)}</span>}
                  </div>

                  {budget > 0 && (
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-[#ff5f5f]' : pct >= 80 ? 'bg-amber-400' : 'bg-[#c1ff72]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: SAVINGS & DEBT - Shows Active Debts ("From Who") & Savings Progress */}
      {activeTab === 'savings_debt' && (
        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#ff5f5f] uppercase tracking-widest flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5" />
              Debts & Borrowed Money
            </h4>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {debts.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 text-center">
                No active loans or borrowed money logged.
              </div>
            ) : (
              debts.map((debt) => (
                <div
                  key={debt.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{debt.name}</span>
                    <span className="font-extrabold text-[#ff5f5f]">
                      {formatCurrency(debt.remainingBalance, settings.currency)}
                    </span>
                  </div>
                  {debt.lenderName && (
                    <p className="text-[10px] text-[#c1ff72] font-semibold">
                      {debt.debtType === 'lent' ? 'Borrower' : 'Lender / From'}: {debt.lenderName}
                    </p>
                  )}
                  <span className="text-[10px] text-zinc-500 block">Due Day {debt.dueDay} of month</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: TRANSACTIONS & REPORTS - Shows Quick Actions & Export */}
      {(activeTab === 'transactions' || activeTab === 'reports' || activeTab === 'trash') && (
        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Ledger Quick Actions
          </h4>
          <button
            type="button"
            onClick={() => onOpenAddTransaction()}
            className="w-full py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(193,255,114,0.3)] uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Log Transaction</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('trash')}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors uppercase"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#ff5f5f]" />
            <span>View Trash Bin & Restore</span>
          </button>
        </div>
      )}
    </div>
  );
};
