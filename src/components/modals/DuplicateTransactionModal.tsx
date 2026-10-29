import React, { useState, useEffect } from 'react';
import { X, Copy, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Transaction, PaymentMethod, SpendNature } from '../../types';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/formatters';
import { NeedVsWantToggle } from '../common/NeedVsWantToggle';

interface DuplicateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTransaction: Transaction | null;
}

export const DuplicateTransactionModal: React.FC<DuplicateTransactionModalProps> = ({
  isOpen,
  onClose,
  sourceTransaction,
}) => {
  const { addTransaction, categories, settings } = useExpense();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [nature, setNature] = useState<SpendNature>('need');
  const [note, setNote] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [amortizationMonths, setAmortizationMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (sourceTransaction && isOpen) {
      setTitle(sourceTransaction.title);
      setAmount(sourceTransaction.amount.toString());
      setCategory(sourceTransaction.category || (categories[0]?.id || ''));
      // Default date to today for duplication convenience, while allowing editing
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(sourceTransaction.paymentMethod || 'upi');
      setNature(sourceTransaction.nature || 'need');
      setNote(sourceTransaction.notes ? `Repeat: ${sourceTransaction.notes}` : `Duplicate of ${sourceTransaction.title}`);
      setTagsStr((sourceTransaction.tags || []).join(', '));
      setAmortizationMonths(sourceTransaction.amortizationMonths || 1);
      setShowSuccess(false);
    }
  }, [sourceTransaction, isOpen, categories]);

  if (!isOpen || !sourceTransaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await addTransaction({
        title,
        amount: parseFloat(amount),
        type: sourceTransaction.type || 'expense',
        category: category || categories[0]?.id || 'cat-snacks',
        date,
        paymentMethod,
        tags: parsedTags,
        notes: note.trim() || undefined,
        nature,
        amortizationMonths,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to duplicate transaction:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#16161a] border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#1a1a20]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#c1ff72]/20 text-[#c1ff72]">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Duplicate Spending</h3>
              <p className="text-[11px] text-zinc-400">Clone and customize date or add a note</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Original Source Reference */}
          <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
            <span className="text-zinc-400">Original Spend:</span>
            <span className="font-semibold text-zinc-200">
              {sourceTransaction.title} ({formatCurrency(sourceTransaction.amount, settings.currency)})
            </span>
          </div>

          {/* Title and Amount */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Amount ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          {/* Update Date Field */}
          <div>
            <label className="block text-xs font-medium text-[#c1ff72] mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Update Date for New Spend</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="upi">UPI / Online</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Binary Need vs. Want Toggle */}
          <div className="pt-1 space-y-1.5">
            <NeedVsWantToggle
              value={nature}
              onChange={(newNature) => setNature(newNature)}
              label="Spend Nature: Necessity vs. Impulse"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span>
                {nature === 'need'
                  ? 'Duplicating as essential need'
                  : 'Duplicating as non-essential want'}
              </span>
              <span className={`font-semibold ${nature === 'need' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {nature === 'need' ? '🟢 Essential Need' : '🟡 Impulse Want'}
              </span>
            </div>
            {nature === 'want' ? (
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300/90 flex items-center justify-between">
                <span>⚡ Flagged as impulse spend in your monthly Discretionary Ratio.</span>
                <span className="text-[10px] text-amber-400/70">Wants Tracker</span>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300/90 flex items-center justify-between">
                <span>🛡️ Logged as an essential living need for survival baseline budgeting.</span>
                <span className="text-[10px] text-emerald-400/70">Necessity</span>
              </div>
            )}
          </div>

          {/* Add Custom Note */}
          <div>
            <label className="block text-xs font-medium text-[#c1ff72] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Add / Update Note</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Duplicated for office commute on Friday..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
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
              className="px-5 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
            >
              {showSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Duplicated!</span>
                </>
              ) : isSubmitting ? (
                'Duplicating...'
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Save Duplicate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
