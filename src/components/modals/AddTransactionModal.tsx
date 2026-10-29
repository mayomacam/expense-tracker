import React, { useState } from 'react';
import { X, Zap, ArrowRightLeft, Sparkles, ClipboardPaste } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { PaymentMethod, TransactionType, SpendNature, QuickPresetChip } from '../../types';
import { getCurrentDateString } from '../../utils/formatters';
import { DEFAULT_MICRO_PRESETS, parseUpiSms } from '../../utils/microSpendParser';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  defaultDate?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultCategoryId,
  defaultDate,
}) => {
  const { categories, addTransaction, settings } = useExpense();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(defaultCategoryId || (categories[0]?.id ?? 'cat-snacks'));
  const [date, setDate] = useState(defaultDate || getCurrentDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [nature, setNature] = useState<SpendNature>('need');
  const [amortizationMonths, setAmortizationMonths] = useState<number>(1);
  const [transferFrom, setTransferFrom] = useState('Bank Account');
  const [transferTo, setTransferTo] = useState('Credit Card Bill');
  const [tagsStr, setTagsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [smsRaw, setSmsRaw] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (chip: QuickPresetChip) => {
    setTitle(chip.title);
    setAmount(chip.amount.toString());
    const catExists = categories.some((c) => c.id === chip.category);
    setCategory(catExists ? chip.category : categories[0]?.id || 'cat-snacks');
    setPaymentMethod(chip.paymentMethod);
    setNature(chip.nature);
    setTagsStr(chip.tags.join(', '));
    setNotes(chip.notes || '');
    setAmortizationMonths(1);
    setType('expense');
  };

  const handleParseSms = (text: string) => {
    setSmsRaw(text);
    if (!text.trim()) return;
    const parsed = parseUpiSms(text);
    if (parsed.success && parsed.amount !== null) {
      setTitle(parsed.inferredTitle);
      setAmount(parsed.amount.toString());
      setPaymentMethod(parsed.paymentMethod);
      setNature(parsed.nature);
      const catExists = categories.some((c) => c.id === parsed.category);
      setCategory(catExists ? parsed.category : categories[0]?.id || 'cat-snacks');
      if (parsed.refNumber) {
        setNotes(`Ref: ${parsed.refNumber}`);
      }
      setShowPasteBox(false);
      setSmsRaw('');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleParseSms(text);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

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
        nature,
        amortizationMonths,
        transferFrom: type === 'transfer' ? transferFrom : undefined,
        transferTo: type === 'transfer' ? transferTo : undefined,
      });

      onClose();
      setTitle('');
      setAmount('');
      setTagsStr('');
      setNotes('');
      setNature('need');
      setAmortizationMonths(1);
      setType('expense');
    } catch (err) {
      console.error('Error adding transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Add Transaction</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c1ff72]/15 text-[#c1ff72] border border-[#c1ff72]/30">
              Micro & Full Log
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap Quick Micro Spend Presets */}
        <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#c1ff72]" /> 1-Tap Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="text-[#c1ff72] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>{showPasteBox ? 'Close SMS Parser' : 'Paste SMS'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {DEFAULT_MICRO_PRESETS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleApplyPreset(chip)}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:border-[#c1ff72] border border-zinc-700 text-zinc-200 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
              >
                +{settings.currency}
                {chip.amount} {chip.title.split(' ')[1] || chip.title}
              </button>
            ))}
          </div>

          {showPasteBox && (
            <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Paste bank debit SMS or notification:</span>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#c1ff72]/20 text-[#c1ff72] font-medium hover:bg-[#c1ff72]/30"
                >
                  Paste from Clipboard
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="e.g. Rs. 20 debited on 20-09 to Auto Transit UPI Ref..."
                value={smsRaw}
                onChange={(e) => handleParseSms(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72] resize-none"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Transaction Type: Expense, Income, Transfer */}
          <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                type === 'transfer'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Transfer / CC Pay</span>
            </button>
          </div>

          {/* Transfer Accounts Row (Shown if type === 'transfer') */}
          {type === 'transfer' && (
            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-indigo-200 mb-1">
                  Transfer From
                </label>
                <input
                  type="text"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  placeholder="e.g. Bank Account"
                  className="w-full bg-zinc-900 border border-indigo-500/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-indigo-200 mb-1">
                  Transfer To
                </label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="e.g. Credit Card Bill"
                  className="w-full bg-zinc-900 border border-indigo-500/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Title / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Chai, Auto, Groceries, Salary, CC Bill Payment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          {/* Amount and Date */}
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

          {/* Category and Payment Method */}
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
                <option value="upi">UPI / Online</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Need vs. Want Spend Nature */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Spend Nature (Eliminate Ambiguity)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNature('need')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    nature === 'need'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🟢 Need (Essential: Food, Transit, Meds)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNature('want')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    nature === 'want'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🟡 Want / Impulse (Coffee, Dining)</span>
                </button>
              </div>
            </div>
          )}

          {/* Staple Multi-Month Amortization */}
          {type === 'expense' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  Consumption Cycle & Amortization:
                </label>
                <span className="text-[10px] text-zinc-400">
                  {amortizationMonths > 1
                    ? `Spreads ${settings.currency}${amount ? (parseFloat(amount) / amortizationMonths).toFixed(1) : 0}/mo`
                    : '1-month standard'}
                </span>
              </div>
              <select
                value={amortizationMonths}
                onChange={(e) => setAmortizationMonths(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value={1}>1 Month (Standard single month spend)</option>
                <option value={2}>2 Months (Staple lasting 2 months)</option>
                <option value={3}>3 Months (Quarterly supply e.g. Coffee/Detergent)</option>
                <option value={6}>6 Months (Bulk grocery / annual supply)</option>
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="transit, snacks, office, staples"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          {/* Notes */}
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

          {/* Submit / Cancel buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
