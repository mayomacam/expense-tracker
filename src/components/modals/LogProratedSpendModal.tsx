import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Calendar, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { ProratedBudgetRule } from '../../types';
import { getCurrentDateString, formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface LogProratedSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: ProratedBudgetRule | null;
  defaultDate?: string;
}

export const LogProratedSpendModal: React.FC<LogProratedSpendModalProps> = ({
  isOpen,
  onClose,
  rule,
  defaultDate,
}) => {
  const { categories, addTransaction, settings } = useExpense();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || getCurrentDateString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const matchedCategory = rule
    ? categories.find((c) => c.id === rule.categoryId) || null
    : null;

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setTitle('');
    setDate(defaultDate || getCurrentDateString());
    setErrorMsg(null);
  }, [isOpen, defaultDate, rule]);

  if (!isOpen || !rule) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive spend amount.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a date for this spend.');
      return;
    }

    const categoryId = rule.categoryId || matchedCategory?.id || 'c2';
    const spendTitle = title.trim() || `${rule.name} Spend`;

    addTransaction({
      title: spendTitle,
      amount: numAmount,
      type: 'expense',
      category: categoryId,
      date,
      tags: rule.targetTags || [],
      paymentMethod: 'credit_card',
      notes: `Logged via ${rule.name} Prorated Limit Tracker`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c1ff72]/10 border border-[#c1ff72]/30 flex items-center justify-center text-[#c1ff72] shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c1ff72]">
                Prorated Tracker Quick Log
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Log {rule.name} Spend
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Tracker Badge Info */}
        <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {matchedCategory && (
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 text-[10px]"
                style={{ backgroundColor: matchedCategory.color }}
              >
                <CategoryIcon name={matchedCategory.icon} className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-bold text-white">{rule.name}</span>
          </div>

          <span className="text-[11px] text-zinc-400">
            Cap: <strong className="text-[#c1ff72]">{formatCurrency(rule.monthlyMaxSpend, settings.currency)}/mo</strong>
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#ff5f5f]/10 border border-[#ff5f5f]/30 text-[#ff5f5f] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Spend Amount */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Amount ({settings.currency}) <span className="text-[#ff5f5f]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                {settings.currency}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 20.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          {/* Description / Title */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Title / Description <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder={`e.g. ${rule.name} Purchase`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          {/* Spend Date */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Date <span className="text-[#ff5f5f]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#c1ff72]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-zinc-400 hover:text-white font-semibold rounded-xl text-xs uppercase"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-extrabold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] flex items-center gap-1.5 uppercase transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
              <span>Record Spend</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
