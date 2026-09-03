import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useModal } from '../../context/ModalContext';
import { ActiveTab } from '../../types';
import { calculateProratedRule } from '../../utils/budgetCalculations';
import { formatCurrency, formatReadableDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface DashboardViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenAddTransaction?: () => void;
  onOpenAddProrated?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAddTransaction,
  onOpenAddProrated,
}) => {
  const { transactions, categories, proratedRules, proratedSpends, savingsGoals, debts, settings } = useExpense();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleNavigate = (tab: ActiveTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      const paths: Record<string, string> = {
        transactions: '/transactions',
        prorated: '/prorated',
        budgets: '/budgets',
        savings_debt: '/savings-debt',
        reports: '/reports',
        categories: '/categories',
        trash: '/trash',
      };
      if (paths[tab]) navigate(paths[tab]);
    }
  };

  const handleAddTransaction = () => {
    if (onOpenAddTransaction) {
      onOpenAddTransaction();
    } else {
      openModal('add_transaction');
    }
  };

  const handleAddProrated = () => {
    if (onOpenAddProrated) {
      onOpenAddProrated();
    } else {
      openModal('add_prorated');
    }
  };

  const currentMonthStr = settings.selectedMonth || getCurrentMonthString();

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

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

  // Prorated rules overview
  const proratedCalculations = useMemo(() => {
    return proratedRules.map((rule) => calculateProratedRule(rule, transactions, proratedSpends, new Date()));
  }, [proratedRules, transactions, proratedSpends]);

  // Recent transactions (last 6)
  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 6);
  }, [transactions]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-[#18181b] border border-zinc-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Hi, {settings.userName || 'Budget Master'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Month of <span className="text-zinc-200 font-semibold">{currentMonth}</span> &bull; SQLite Persistence Online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddTransaction}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Spend</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('prorated')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span>Prorated Limits</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Income</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white">
              {formatCurrency(totalIncome, settings.currency)}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Received this month</span>
        </div>

        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Spent</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white">
              {formatCurrency(totalExpense, settings.currency)}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Total outgoing expenses</span>
        </div>

        <div className="bg-[#16161a] border border-[#27272a] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Net Surplus</span>
            <div className={`p-1.5 rounded-lg ${netSavings >= 0 ? 'bg-[#c1ff72]/10 text-[#c1ff72]' : 'bg-rose-500/10 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-bold ${netSavings >= 0 ? 'text-[#c1ff72]' : 'text-rose-400'}`}>
              {formatCurrency(netSavings, settings.currency)}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Current monthly savings</span>
        </div>
      </div>

      {/* Prorated Daily Limits Highlight */}
      <div className="bg-[#16161a] border border-[#27272a] p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#c1ff72]/10 text-[#c1ff72] rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Prorated Daily Budget Tracking</h3>
              <p className="text-xs text-zinc-400">Remaining daily allowable spend based on days left in month</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigate('prorated')}
            className="text-xs text-[#c1ff72] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {proratedCalculations.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-400">No prorated rules configured yet.</p>
            <button
              type="button"
              onClick={handleAddProrated}
              className="mt-2 px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg cursor-pointer"
            >
              Create Prorated Rule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proratedCalculations.slice(0, 4).map((calc) => (
              <div
                key={calc.rule.id}
                className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{calc.rule.name}</h4>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      calc.status === 'overspent'
                        ? 'bg-rose-500/20 text-rose-300'
                        : calc.status === 'danger'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {calc.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Today's Allowable:</span>
                    <span className="text-base font-bold text-[#c1ff72]">
                      {formatCurrency(calc.actualDailyLimit, settings.currency)}/day
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Spent Today:</span>
                    <span className="text-base font-semibold text-white">
                      {formatCurrency(calc.spentToday, settings.currency)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Month Progress: {formatCurrency(calc.totalSpent, settings.currency)}</span>
                    <span>Cap: {formatCurrency(calc.effectiveBudget, settings.currency)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        calc.percentSpent >= 100 ? 'bg-rose-500' : 'bg-[#c1ff72]'
                      }`}
                      style={{ width: `${Math.min(100, calc.percentSpent)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="bg-[#16161a] border border-[#27272a] p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
          <button
            type="button"
            onClick={() => handleNavigate('transactions')}
            className="text-xs text-[#c1ff72] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No transactions found. Click &quot;Add Spend&quot; above to log your first record.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentTransactions.map((tx) => {
              const cat = categoryMap.get(tx.category);
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat?.color || '#6366F1'}20` }}
                    >
                      <CategoryIcon
                        name={cat?.icon || 'Tag'}
                        className="w-4 h-4"
                        color={cat?.color || '#6366F1'}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{tx.title}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {formatReadableDate(tx.date)} &bull; {cat?.name || tx.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block capitalize">
                      {tx.paymentMethod.replace('_', ' ')}
                    </span>
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
