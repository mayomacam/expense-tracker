import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface AddProratedBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProratedBudgetModal: React.FC<AddProratedBudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addProratedRule, settings } = useExpense();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [targetTagsStr, setTargetTagsStr] = useState('');
  const [monthlyMaxSpend, setMonthlyMaxSpend] = useState('');
  const [month, setMonth] = useState(settings.selectedMonth || new Date().toISOString().slice(0, 7));
  const [rolloverEnabled, setRolloverEnabled] = useState(settings.enableRolloverByDefault);
  const [rolloverAmount, setRolloverAmount] = useState('0');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState('90');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !monthlyMaxSpend || Number(monthlyMaxSpend) <= 0) return;

    try {
      setIsSubmitting(true);
      const targetTags = targetTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await addProratedRule({
        name: name.trim(),
        categoryId: categoryId || undefined,
        targetTags,
        monthlyMaxSpend: Number(monthlyMaxSpend),
        month,
        rolloverEnabled,
        rolloverAmount: Number(rolloverAmount) || 0,
        alertThresholdPercent: Number(alertThresholdPercent) || 90,
        notes: notes.trim() || undefined,
      });

      onClose();
      setName('');
      setMonthlyMaxSpend('');
      setTargetTagsStr('');
      setNotes('');
    } catch (err) {
      console.error('Error creating prorated rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-semibold text-white">Create Prorated Daily Budget Rule</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Rule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Dining & Snacks, Weekend Fun"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Monthly Cap ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="5000"
                value={monthlyMaxSpend}
                onChange={(e) => setMonthlyMaxSpend(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target Month</label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="">Any / Tag-based</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Alert Threshold (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={alertThresholdPercent}
                onChange={(e) => setAlertThresholdPercent(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Matching Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="dining, snacks, takeout"
              value={targetTagsStr}
              onChange={(e) => setTargetTagsStr(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-medium">Daily Limit Rollover</span>
              <input
                type="checkbox"
                checked={rolloverEnabled}
                onChange={(e) => setRolloverEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#c1ff72] rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              When enabled, unspent daily allowance rolls over to recalculate higher daily limits for the remaining days.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Activate Prorated Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
