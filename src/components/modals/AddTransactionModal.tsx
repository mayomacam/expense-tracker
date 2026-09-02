import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Calendar, Tag as TagIcon, CreditCard, FileText, Check } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { getCurrentDateString } from '../../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultCategory?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
  defaultType = 'expense',
  defaultCategory,
}) => {
  const { categories, addTransaction, updateTransaction, allTags, settings } = useExpense();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getCurrentDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setTags(editingTransaction.tags || []);
      setNotes(editingTransaction.notes || '');
      setIsRecurring(!!editingTransaction.isRecurring);
    } else {
      setType(defaultType);
      setTitle('');
      setAmount('');
      setCategory(defaultCategory || categories[0]?.id || '');
      setDate(getCurrentDateString());
      setPaymentMethod('credit_card');
      setTags([]);
      setTagInput('');
      setNotes('');
      setIsRecurring(false);
    }
  }, [editingTransaction, isOpen, defaultType, defaultCategory, categories]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleQuickTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !category) {
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        tags,
        notes: notes.trim() || undefined,
        isRecurring,
      });
    } else {
      addTransaction({
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        tags,
        notes: notes.trim() || undefined,
        isRecurring,
      });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                {editingTransaction ? 'Edit Transaction' : 'Log New Transaction'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Record your daily outflow or inflow</p>
            </div>
            <button
              id="close-tx-modal-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto font-mono">
            {/* Type Switcher */}
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                type="button"
                id="type-expense-btn"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-[#ff5f5f] text-white shadow-[0_0_10px_rgba(255,95,95,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                OUTFLOW / EXPENSE (-)
              </button>
              <button
                type="button"
                id="type-income-btn"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                INFLOW / INCOME (+)
              </button>
            </div>

            {/* Amount & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Amount ({settings.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                    {settings.currency}
                  </span>
                  <input
                    id="tx-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-bold text-base focus:bg-white/[0.06] focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Description / Title
                </label>
                <input
                  id="tx-title-input"
                  type="text"
                  required
                  placeholder="e.g. Afternoon Latte & Snack"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:bg-white/[0.06] focus:outline-none focus:border-[#c1ff72]"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white/[0.02] border border-white/10 rounded-xl">
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      id={`cat-select-${cat.id}`}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)] font-bold'
                          : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/10"
                        style={{
                          backgroundColor: isSelected ? '#00000020' : cat.color,
                          color: '#ffffff',
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Transaction Date
                </label>
                <div className="relative">
                  <input
                    id="tx-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Payment Method
                </label>
                <select
                  id="tx-payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-[#c1ff72]"
                >
                  <option value="credit_card" className="bg-[#111114] text-white">💳 Credit Card</option>
                  <option value="debit_card" className="bg-[#111114] text-white">💳 Debit Card</option>
                  <option value="digital_wallet" className="bg-[#111114] text-white">📱 Digital Wallet</option>
                  <option value="bank_transfer" className="bg-[#111114] text-white">🏛️ Bank Transfer</option>
                  <option value="cash" className="bg-[#111114] text-white">💵 Cash</option>
                </select>
              </div>
            </div>

            {/* Tag System */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  id="tx-tag-input"
                  type="text"
                  placeholder="Add tag (e.g. snacks, treats, work)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                />
                <button
                  type="button"
                  id="add-tag-btn"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg uppercase"
                >
                  Add
                </button>
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#c1ff72]/10 text-[#c1ff72] border border-[#c1ff72]/30"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-[#c1ff72] hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Tag Suggestions */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-400">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Suggestions:</span>
                  {allTags.slice(0, 6).map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleQuickTagToggle(suggested)}
                      className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                        tags.includes(suggested)
                          ? 'bg-[#c1ff72]/20 text-[#c1ff72] border-[#c1ff72]/40'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
                      }`}
                    >
                      #{suggested}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes & Recurring */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="tx-notes-input"
                rows={2}
                placeholder="Any special context, vendor name, or receipt note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#c1ff72] resize-none"
              />
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/10 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-white block">Mark as Recurring</span>
                <span className="text-[11px] text-zinc-400">
                  Auto-sync each month for fixed expenses/incomes
                </span>
              </div>
              <input
                id="tx-recurring-checkbox"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-[#c1ff72] bg-white/5 rounded-sm border-white/20 accent-[#c1ff72]"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                id="cancel-tx-modal-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-tx-btn"
                className="px-5 py-2 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Check className="w-3.5 h-3.5" />
                {editingTransaction ? 'Save Changes' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
