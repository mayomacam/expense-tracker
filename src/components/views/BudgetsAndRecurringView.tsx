import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

export const BudgetsAndRecurringView: React.FC = () => {
  const {
    categories,
    updateCategory,
    recurringItems,
    deleteRecurringItem,
    addRecurringItem,
    applyRecurringForMonth,
    settings,
    transactions,
  } = useExpense();

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.id || 'utilities');
  const [newDay, setNewDay] = useState('1');
  const [isApplying, setIsApplying] = useState(false);

  const currentMonth = settings.selectedMonth || new Date().toISOString().slice(0, 7);

  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth));
  const catSpentMap: Record<string, number> = {};
  for (const tx of monthlyExpenses) {
    catSpentMap[tx.category] = (catSpentMap[tx.category] || 0) + tx.amount;
  }

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || Number(newAmount) <= 0) return;

    await addRecurringItem({
      title: newTitle.trim(),
      amount: Number(newAmount),
      type: 'expense',
      category: newCategory,
      frequency: 'monthly',
      dayOfMonth: Number(newDay) || 1,
      autoApply: true,
      tags: ['recurring'],
      paymentMethod: 'credit_card',
      isActive: true,
    });

    setNewTitle('');
    setNewAmount('');
  };

  const handleApplyRecurring = async () => {
    try {
      setIsApplying(true);
      const count = await applyRecurringForMonth(currentMonth);
      alert(`Applied ${count} recurring items for ${currentMonth}.`);
    } catch (err: any) {
      alert('Error applying recurring items: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Budgets */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Category Monthly Budgets</h2>
        <p className="text-xs text-zinc-400">
          Set targets for each spending category. Track actual consumption for {currentMonth}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const spent = catSpentMap[cat.id] || 0;
            const budget = cat.monthlyBudget || 0;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            return (
              <div
                key={cat.id}
                className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={cat.icon} className="w-4 h-4" color={cat.color} />
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {formatCurrency(spent, settings.currency)} /{' '}
                    <strong className="text-zinc-200">
                      {budget > 0 ? formatCurrency(budget, settings.currency) : 'No limit'}
                    </strong>
                  </span>
                </div>

                {budget > 0 && (
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pct >= 100 ? 'bg-rose-500' : 'bg-[#c1ff72]'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recurring Subscriptions & Bills */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recurring Subscriptions &amp; Bills
            </h2>
            <p className="text-xs text-zinc-400">
              Auto-generate monthly obligations (Netflix, Rent, Internet, SIPs)
            </p>
          </div>
          <button
            type="button"
            onClick={handleApplyRecurring}
            disabled={isApplying}
            className="px-3.5 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
            <span>Apply to {currentMonth}</span>
          </button>
        </div>

        {/* Add Recurring Form */}
        <form onSubmit={handleCreateRecurring} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            required
            placeholder="Subscription title (e.g. WiFi Bill)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
          />
          <input
            type="number"
            required
            min="1"
            placeholder={`Amount (${settings.currency})`}
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </form>

        {/* Recurring List */}
        <div className="divide-y divide-zinc-800/60 pt-2">
          {recurringItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No recurring items added yet.
            </div>
          ) : (
            recurringItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="text-[11px] text-zinc-500">
                    Day {item.dayOfMonth} of month &bull;{' '}
                    {item.lastAppliedMonth === currentMonth ? (
                      <span className="text-emerald-400">Applied for {currentMonth}</span>
                    ) : (
                      <span className="text-amber-400">Pending this month</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">
                    {formatCurrency(item.amount, settings.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteRecurringItem(item.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
