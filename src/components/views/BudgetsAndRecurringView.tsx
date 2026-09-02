import React, { useState } from 'react';
import {
  Plus,
  Repeat,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Play,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { RecurringItem, Category } from '../../types';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface BudgetsAndRecurringViewProps {
  onOpenAddCategory: () => void;
  onEditCategory: (cat: Category) => void;
  onOpenAddTransaction: () => void;
}

export const BudgetsAndRecurringView: React.FC<BudgetsAndRecurringViewProps> = ({
  onOpenAddCategory,
  onEditCategory,
  onOpenAddTransaction,
}) => {
  const {
    categories,
    updateCategory,
    recurring,
    addRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    applyRecurringForMonth,
    selectedMonth,
    settings,
    updateSettings,
    transactions,
  } = useExpense();

  const [activeSubTab, setActiveSubTab] = useState<'budgets' | 'recurring'>('budgets');

  // Recurring Form state
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [recCategory, setRecCategory] = useState(categories[0]?.id || '');
  const [recDay, setRecDay] = useState('1');
  const [recTags, setRecTags] = useState('recurring, fixed');

  // Apply result message
  const [applyResultMsg, setApplyResultMsg] = useState<string | null>(null);

  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  const handleApplyRecurring = async () => {
    const result = await applyRecurringForMonth(selectedMonth);
    setApplyResultMsg(
      result.addedCount > 0
        ? `Successfully applied ${result.addedCount} recurring item(s) to ${getMonthName(
            selectedMonth
          )}!`
        : `All recurring items are already logged in ${getMonthName(selectedMonth)}.`
    );
    setTimeout(() => setApplyResultMsg(null), 4000);
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(recAmount);
    if (!recTitle.trim() || isNaN(num) || num <= 0) return;

    addRecurringItem({
      title: recTitle.trim(),
      amount: num,
      type: recType,
      category: recCategory,
      frequency: 'monthly',
      dayOfMonth: parseInt(recDay, 10) || 1,
      autoApply: true,
      tags: recTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      paymentMethod: 'bank_transfer',
      isActive: true,
    });

    setRecTitle('');
    setRecAmount('');
    setShowAddRecurring(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Monthly Budgets & Recurring Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Manage category caps, rollover logic, and automate recurring monthly payments
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            id="tab-budgets-btn"
            onClick={() => setActiveSubTab('budgets')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              activeSubTab === 'budgets'
                ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            CATEGORY BUDGETS
          </button>
          <button
            type="button"
            id="tab-recurring-btn"
            onClick={() => setActiveSubTab('recurring')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              activeSubTab === 'recurring'
                ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            RECURRING ({recurring.length})
          </button>
        </div>
      </div>

      {applyResultMsg && (
        <div className="p-3.5 bg-[#c1ff72]/10 border border-[#c1ff72]/30 rounded-xl text-xs text-[#c1ff72] font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#c1ff72] shrink-0" />
            {applyResultMsg}
          </span>
          <button
            type="button"
            onClick={() => setApplyResultMsg(null)}
            className="text-[#c1ff72] hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {activeSubTab === 'budgets' ? (
        /* CATEGORY BUDGETS SECTION */
        <div className="space-y-6">
          {/* Global Budget Rollover & Warning Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-[#c1ff72] flex items-center justify-center border border-white/10">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Automated Budget Rollover
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Carry forward unspent surplus to next month
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableRolloverByDefault}
                    onChange={(e) =>
                      updateSettings({ enableRolloverByDefault: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c1ff72] peer-checked:after:bg-black"></div>
                </label>
              </div>
            </div>

            <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Warning Threshold
                </span>
                <span className="text-[#c1ff72] font-mono">{settings.monthlyBudgetWarningThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.monthlyBudgetWarningThreshold}
                onChange={(e) =>
                  updateSettings({ monthlyBudgetWarningThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#c1ff72] h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 font-mono">
                Alert trigger when any category spending reaches this percentage of budget cap.
              </p>
            </div>
          </div>

          {/* Category Budgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catSpent = monthTransactions
                .filter((t) => t.type === 'expense' && t.category === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);

              const budget = cat.monthlyBudget || 0;
              const pct = budget > 0 ? (catSpent / budget) * 100 : 0;
              const isOver = budget > 0 && catSpent > budget;

              return (
                <div
                  key={cat.id}
                  className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 border border-white/10"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditCategory(cat)}
                        className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit budget or category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">Outflow</span>
                        <span className="text-base font-bold text-white">
                          {formatCurrency(catSpent, settings.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase block">Monthly Cap</span>
                        <span className="text-xs font-bold text-zinc-300">
                          {budget > 0 ? formatCurrency(budget, settings.currency) : 'No Cap'}
                        </span>
                      </div>
                    </div>

                    {budget > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOver
                                ? 'bg-[#ff5f5f]'
                                : pct >= settings.monthlyBudgetWarningThreshold
                                ? 'bg-amber-400'
                                : 'bg-[#c1ff72]'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>{pct.toFixed(0)}% used</span>
                          <span className={isOver ? 'text-[#ff5f5f] font-bold' : 'text-[#c1ff72]'}>
                            {isOver
                              ? `+${formatCurrency(catSpent - budget, settings.currency)} OVER`
                              : `${formatCurrency(budget - catSpent, settings.currency)} left`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* RECURRING ENGINE SECTION */
        <div className="space-y-6">
          {/* Quick Apply Recurring Banner */}
          <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
                RECURRING AUTOMATION
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Streamline Monthly Recurring Records
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Automatically populate fixed recurring expenses and subscriptions for {getMonthName(selectedMonth)} with one click.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="apply-recurring-now-btn"
                onClick={handleApplyRecurring}
                className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black rounded-xl text-xs font-mono font-bold shadow-[0_0_15px_rgba(193,255,114,0.3)] flex items-center gap-1.5 transition-all uppercase tracking-wider text-[11px]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Apply to {getMonthName(selectedMonth)}</span>
              </button>
              <button
                type="button"
                id="new-recurring-template-btn"
                onClick={() => setShowAddRecurring(true)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-semibold transition-colors flex items-center gap-1 uppercase tracking-wider text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Template</span>
              </button>
            </div>
          </div>

          {/* Add Recurring Template Modal/Form */}
          {showAddRecurring && (
            <div className="p-5 bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">New Recurring Template</h4>
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="text-xs text-zinc-500 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRecurring} className="space-y-3 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Title / Item Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rent, Fiber Internet, Netflix"
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Amount ({settings.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="100.00"
                      value={recAmount}
                      onChange={(e) => setRecAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Category
                    </label>
                    <select
                      value={recCategory}
                      onChange={(e) => setRecCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#111114] text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Type</label>
                    <select
                      value={recType}
                      onChange={(e) => setRecType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72]"
                    >
                      <option value="expense" className="bg-[#111114] text-white">Expense (-)</option>
                      <option value="income" className="bg-[#111114] text-white">Income (+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Day of Month Due
                    </label>
                    <select
                      value={recDay}
                      onChange={(e) => setRecDay(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72]"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d} className="bg-[#111114] text-white">
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Tags</label>
                    <input
                      type="text"
                      placeholder="recurring, bills"
                      value={recTags}
                      onChange={(e) => setRecTags(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRecurring(false)}
                    className="px-3.5 py-1.5 text-xs text-zinc-400 rounded-lg hover:bg-white/5 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#c1ff72] text-black rounded-lg hover:bg-[#b0f05f] uppercase tracking-wider"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recurring List */}
          <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-white/[0.06]">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Configured Recurring Templates ({recurring.length})
              </h4>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {recurring.map((item) => {
                const cat = categories.find((c) => c.id === item.category);
                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10"
                        style={{ backgroundColor: cat?.color || '#27272a' }}
                      >
                        <CategoryIcon name={cat?.icon || 'Repeat'} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                          <span>Day {item.dayOfMonth}</span>
                          <span>•</span>
                          <span>{cat?.name}</span>
                          <span>•</span>
                          <span className="capitalize">{item.frequency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <span
                        className={`text-sm font-bold ${
                          item.type === 'income' ? 'text-[#c1ff72]' : 'text-white'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount, settings.currency)}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteRecurringItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-[#ff5f5f] rounded-lg hover:bg-[#ff5f5f]/10 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
