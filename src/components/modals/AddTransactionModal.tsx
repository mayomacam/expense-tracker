import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { PaymentMethod, TransactionType, Transaction } from '../../types';
import { getCurrentDateString } from '../../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  defaultDate?: string;
  transactionToEdit?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
  defaultDate,
  transactionToEdit,
}) => {
  const { categories, proratedRules, addTransaction, updateTransaction, settings } = useExpense();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(defaultCategoryId || (categories[0]?.id ?? 'food'));
  const [date, setDate] = useState(defaultDate || getCurrentDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [proratedRuleId, setProratedRuleId] = useState<string>('');
  const [tagsStr, setTagsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title);
      setAmount(String(transactionToEdit.amount));
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setProratedRuleId(transactionToEdit.proratedRuleId || '');
      setTagsStr(transactionToEdit.tags ? transactionToEdit.tags.join(', ') : '');
      setNotes(transactionToEdit.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory(defaultCategoryId || (categories[0]?.id ?? 'food'));
      setDate(defaultDate || getCurrentDateString());
      setPaymentMethod('credit_card');
      setProratedRuleId('');
      setTagsStr('');
      setNotes('');
    }
  }, [transactionToEdit, isOpen, defaultCategoryId, defaultDate, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, {
          title: title.trim(),
          amount: Number(amount),
          type,
          category,
          date,
          paymentMethod,
          tags,
          notes: notes.trim() || undefined,
          proratedRuleId: proratedRuleId || undefined,
        });
      } else {
        await addTransaction({
          title: title.trim(),
          amount: Number(amount),
          type,
          category,
          date,
          paymentMethod,
          tags,
          notes: notes.trim() || undefined,
          isRecurring: false,
          proratedRuleId: proratedRuleId || undefined,
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-semibold text-white">
            {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Title / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Grocery store, Coffee, Salary"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
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
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI / Online</option>
                <option value="cash">Cash</option>
                <option value="net_banking">Net Banking</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {type === 'expense' && proratedRules.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Allocate to Prorated Budget Rule (Optional)
              </label>
              <select
                value={proratedRuleId}
                onChange={(e) => setProratedRuleId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="">None (Independent General Expense)</option>
                {proratedRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Cap: {settings.currency}{r.monthlyMaxSpend})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="food, dinner, weekend"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Additional details..."
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
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
