import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSavingsGoalModal: React.FC<AddSavingsGoalModalProps> = ({ isOpen, onClose }) => {
  const { addSavingsGoal, settings } = useExpense();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [color, setColor] = useState('#10B981');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || Number(targetAmount) <= 0 || !targetDate) return;

    try {
      setIsSubmitting(true);
      await addSavingsGoal({
        name: name.trim(),
        targetAmount: Number(targetAmount),
        targetDate,
        category,
        color,
        icon: 'PiggyBank',
        notes: notes.trim() || undefined,
      });

      onClose();
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setNotes('');
    } catch (err) {
      console.error('Error adding savings goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-semibold text-white">Create Savings Goal</h2>
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
            <label className="block text-xs font-medium text-zinc-300 mb-1">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund, Vacation, New Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Target Amount ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="Emergency">Emergency</option>
                <option value="Travel">Travel</option>
                <option value="Education">Education</option>
                <option value="Gadgets">Gadgets</option>
                <option value="Investment">Investment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Badge Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-zinc-400 font-mono">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Why this goal matters..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72] resize-none"
            />
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
              {isSubmitting ? 'Saving...' : 'Set Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
