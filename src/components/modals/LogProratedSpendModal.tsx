import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { ProratedBudgetRule } from '../../types';
import { getCurrentDateString } from '../../utils/formatters';

interface LogProratedSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: ProratedBudgetRule;
}

export const LogProratedSpendModal: React.FC<LogProratedSpendModalProps> = ({
  isOpen,
  onClose,
  rule,
}) => {
  const { addTransaction, settings, categories } = useExpense();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      const category = rule.categoryId || categories[0]?.id || 'food';
      const tags = rule.targetTags && rule.targetTags.length > 0 ? [...rule.targetTags] : ['prorated'];

      await addTransaction({
        title: title.trim(),
        amount: Number(amount),
        type: 'expense',
        category,
        date,
        tags,
        paymentMethod: 'credit_card',
        notes: `Quick logged against prorated rule: ${rule.name}`,
        isRecurring: false,
      });

      onClose();
      setTitle('');
      setAmount('');
    } catch (err) {
      console.error('Error logging prorated spend:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div>
            <h2 className="text-base font-semibold text-white">Log Prorated Expense</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{rule.name}</p>
          </div>
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
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch at cafe, Taxi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Amount ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
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
              {isSubmitting ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
