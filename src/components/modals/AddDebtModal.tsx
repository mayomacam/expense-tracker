import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose }) => {
  const { addDebt, settings } = useExpense();
  const [name, setName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent' | 'credit_card' | 'loan' | 'mortgage' | 'other'>('borrowed');
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [minimumPayment, setMinimumPayment] = useState('0');
  const [dueDay, setDueDay] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalPrincipal || Number(totalPrincipal) <= 0) return;

    try {
      setIsSubmitting(true);
      await addDebt({
        name: name.trim(),
        lenderName: lenderName.trim() || undefined,
        debtType,
        totalPrincipal: Number(totalPrincipal),
        interestRate: Number(interestRate) || 0,
        minimumPayment: Number(minimumPayment) || 0,
        dueDay: Number(dueDay) || 1,
        notes: notes.trim() || undefined,
        color: '#F43F5E',
      });

      onClose();
      setName('');
      setLenderName('');
      setTotalPrincipal('');
      setNotes('');
    } catch (err) {
      console.error('Error adding debt record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-semibold text-white">Add Debt / Loan Tracker</h2>
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
            <label className="block text-xs font-medium text-zinc-300 mb-1">Debt / Loan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Car Loan, Credit Card Bill, Personal Loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Lender / Institution</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, SBI, Friend"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Type</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="borrowed">Borrowed / Loan</option>
                <option value="credit_card">Credit Card Balance</option>
                <option value="mortgage">Mortgage / Home Loan</option>
                <option value="lent">Lent to Someone</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Principal Amount ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="100000"
                value={totalPrincipal}
                onChange={(e) => setTotalPrincipal(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Interest Rate (% APR)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="9.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Min. Monthly Payment ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="2500"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Monthly Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Terms, tenure, contact info..."
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
              {isSubmitting ? 'Saving...' : 'Track Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
