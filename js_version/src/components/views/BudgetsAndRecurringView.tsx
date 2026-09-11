import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Check, RefreshCw, Zap, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
    autoCloneRecurringService,
    toggleRecurringAutoApply,
    autoCloneStatus,
    settings,
    transactions,
  } = useExpense();

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.id || 'utilities');
  const [newDay, setNewDay] = useState('1');
  const [newAutoApply, setNewAutoApply] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentMonth = settings.selectedMonth || new Date().toISOString().slice(0, 7);

  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth) && !t.proratedRuleId);
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
      dayOfMonth: Math.min(31, Math.max(1, Number(newDay) || 1)),
      autoApply: newAutoApply,
      tags: ['recurring'],
      paymentMethod: 'credit_card',
      isActive: true,
    });

    setNewTitle('');
    setNewAmount('');
    setNewDay('1');
    setActionNotice(`Added "${newTitle.trim()}" with auto-clone ${newAutoApply ? 'enabled' : 'disabled'}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRunAutoCloneService = async () => {
    try {
      setIsApplying(true);
      const res = await autoCloneRecurringService(currentMonth, false);
      if (res.addedCount > 0) {
        setActionNotice(`Auto-clone service cloned ${res.addedCount} transaction(s) into database: ${res.clonedTitles.join(', ')}.`);
      } else {
        setActionNotice(`Auto-clone check complete: all enabled items are already up to date for ${currentMonth}.`);
      }
      setTimeout(() => setActionNotice(null), 4500);
    } catch (err: any) {
      setActionNotice('Auto-clone check encountered an error: ' + err.message);
      setTimeout(() => setActionNotice(null), 4500);
    } finally {
      setIsApplying(false);
    }
  };

  const handleForceApplyAll = async () => {
    try {
      setIsApplying(true);
      const count = await applyRecurringForMonth(currentMonth, true);
      setActionNotice(`Applied ${count} recurring item(s) to ${currentMonth}.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice('Error applying recurring items: ' + err.message);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleAutoApply = async (id: string, currentVal: boolean, title: string) => {
    const nextVal = !currentVal;
    await toggleRecurringAutoApply(id, nextVal);
    setActionNotice(`Auto-clone ${nextVal ? 'enabled' : 'disabled'} for "${title}".`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const enabledCount = recurringItems.filter((r) => r.autoApply !== false && r.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Action Banner Feedback */}
      {actionNotice && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-white text-xs font-semibold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

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
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#c1ff72]" />
              <span>Recurring Subscriptions &amp; Bills</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Auto-generate monthly obligations (Netflix, Rent, Internet, SIPs) into your database
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRunAutoCloneService}
              disabled={isApplying}
              className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Runs the automatic clone service for enabled items"
            >
              <Zap className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span>Run Auto-Clone Check</span>
            </button>
            <button
              type="button"
              onClick={handleForceApplyAll}
              disabled={isApplying}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
              title="Force apply all active recurring items regardless of auto-clone flag"
            >
              <RefreshCw className={`w-3 h-3 ${isApplying ? 'animate-spin' : ''}`} />
              <span>Apply All</span>
            </button>
          </div>
        </div>

        {/* Automated Month-Start Service Status Box */}
        <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-tight">
                Monthly Auto-Clone Service
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-medium">
                Active &bull; Runs at Month Start
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>Status:</span>
              <span className="text-white font-medium">
                {enabledCount} of {recurringItems.length} items configured to auto-clone
              </span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            When a new month starts, the background service automatically checks recurring items with auto-clone enabled and inserts them into your SQLite database without duplicating entries.
            {autoCloneStatus.lastRunTimestamp && (
              <span className="text-zinc-300 ml-1">
                Last checked at {autoCloneStatus.lastRunTimestamp} for {autoCloneStatus.lastRunMonth || currentMonth} ({autoCloneStatus.lastClonedCount} cloned).
              </span>
            )}
          </p>
        </div>

        {/* Add Recurring Form */}
        <form onSubmit={handleCreateRecurring} className="space-y-2.5 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="text-xs font-semibold text-zinc-300">Add New Recurring Item</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              required
              placeholder="Title (e.g. WiFi, Netflix)"
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
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 shrink-0">Day:</span>
              <input
                type="number"
                min="1"
                max="31"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#c1ff72]"
                title="Day of month to clone"
              />
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={newAutoApply}
                onChange={(e) => setNewAutoApply(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-[#c1ff72] focus:ring-0 cursor-pointer"
              />
              <span>Enable automatic cloning at start of each month for this item</span>
            </label>
          </div>
        </form>

        {/* Recurring List */}
        <div className="divide-y divide-zinc-800/60 pt-2">
          {recurringItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No recurring items added yet. Add your subscriptions above to enable automated monthly cloning.
            </div>
          ) : (
            recurringItems.map((item) => {
              const isAppliedForThisMonth = item.lastAppliedMonth === currentMonth;
              const isAutoEnabled = item.autoApply !== false;
              const cat = categories.find((c) => c.id === item.category);

              return (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      {cat && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {cat.name}
                        </span>
                      )}
                      {isAppliedForThisMonth ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3 h-3" />
                          <span>Cloned for {currentMonth}</span>
                        </span>
                      ) : isAutoEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300">
                          <Clock className="w-3 h-3" />
                          <span>Auto-clone enabled (Pending)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                          <span>Auto-clone disabled</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Day {item.dayOfMonth || 1} of month &bull; Frequency: {item.frequency || 'monthly'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5">
                    {/* Per-Item Auto-Clone Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoApply(item.id, isAutoEnabled, item.title)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAutoEnabled ? 'bg-[#c1ff72]' : 'bg-zinc-700'
                        }`}
                        title={isAutoEnabled ? 'Click to disable auto-clone for this item' : 'Click to enable auto-clone for this item'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isAutoEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-zinc-300 whitespace-nowrap">
                        {isAutoEnabled ? (
                          <span className="text-emerald-400 font-medium">Auto-Clone ON</span>
                        ) : (
                          <span className="text-zinc-500">Auto-Clone OFF</span>
                        )}
                      </span>
                    </div>

                    {/* Amount */}
                    <span className="text-xs font-bold text-white min-w-[70px] text-right">
                      {formatCurrency(item.amount, settings.currency)}
                    </span>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteRecurringItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
                      title="Delete recurring item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
