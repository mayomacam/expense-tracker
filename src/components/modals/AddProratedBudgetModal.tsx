import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Calculator, AlertTriangle, ArrowRightLeft, Sparkles } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { ProratedBudgetRule } from '../../types';
import { getDaysInMonth, formatCurrency, getMonthName } from '../../utils/formatters';

interface AddProratedBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule?: ProratedBudgetRule | null;
}

export const AddProratedBudgetModal: React.FC<AddProratedBudgetModalProps> = ({
  isOpen,
  onClose,
  editingRule,
}) => {
  const { categories, addProratedRule, updateProratedRule, selectedMonth, settings } = useExpense();

  const [name, setName] = useState('Snacks & Treats');
  const [monthlyMaxSpend, setMonthlyMaxSpend] = useState('500');
  const [categoryId, setCategoryId] = useState('');
  const [targetTagsStr, setTargetTagsStr] = useState('snacks, treats, candy');
  const [rolloverEnabled, setRolloverEnabled] = useState(true);
  const [rolloverAmount, setRolloverAmount] = useState('0');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState('100');
  const [notes, setNotes] = useState('');

  const daysInMon = getDaysInMonth(selectedMonth);
  const numMax = parseFloat(monthlyMaxSpend) || 0;
  const numRoll = parseFloat(rolloverAmount) || 0;
  const effectiveMax = numMax + (rolloverEnabled ? numRoll : 0);
  const calculatedDailyLimit = daysInMon > 0 ? effectiveMax / daysInMon : 0;

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setMonthlyMaxSpend(editingRule.monthlyMaxSpend.toString());
      setCategoryId(editingRule.categoryId || '');
      setTargetTagsStr((editingRule.targetTags || []).join(', '));
      setRolloverEnabled(editingRule.rolloverEnabled);
      setRolloverAmount((editingRule.rolloverAmount || 0).toString());
      setAlertThresholdPercent(editingRule.alertThresholdPercent.toString());
      setNotes(editingRule.notes || '');
    } else {
      setName('Snacks & Treats');
      setMonthlyMaxSpend('500');
      const snackCat = categories.find((c) => c.name.toLowerCase().includes('snack'));
      setCategoryId(snackCat?.id || '');
      setTargetTagsStr('snacks, candy, pastry, treats');
      setRolloverEnabled(true);
      setRolloverAmount('0');
      setAlertThresholdPercent('100');
      setNotes('Track daily snack spend against the prorated monthly allowance.');
    }
  }, [editingRule, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numMax <= 0) return;

    const parsedTags = targetTagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
      .filter(Boolean);

    if (editingRule) {
      updateProratedRule(editingRule.id, {
        name: name.trim(),
        monthlyMaxSpend: numMax,
        categoryId: categoryId || undefined,
        targetTags: parsedTags,
        rolloverEnabled,
        rolloverAmount: rolloverEnabled ? numRoll : 0,
        alertThresholdPercent: parseFloat(alertThresholdPercent) || 100,
        notes: notes.trim() || undefined,
      });
    } else {
      addProratedRule({
        name: name.trim(),
        monthlyMaxSpend: numMax,
        month: selectedMonth,
        categoryId: categoryId || undefined,
        targetTags: parsedTags,
        rolloverEnabled,
        rolloverAmount: rolloverEnabled ? numRoll : 0,
        alertThresholdPercent: parseFloat(alertThresholdPercent) || 100,
        notes: notes.trim() || undefined,
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
          className="w-full max-w-lg bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c1ff72] text-black flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {editingRule ? 'Edit Prorated Daily Tracker' : 'Set Prorated Daily Spending Limit'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Divide monthly cap across {daysInMon} days with automated alerts
                </p>
              </div>
            </div>
            <button
              id="close-prorated-modal-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* Live Calculation Preview Banner */}
            <div className="p-4 bg-[#c1ff72]/5 rounded-xl border border-[#c1ff72]/20">
              <div className="flex items-center justify-between text-xs text-[#c1ff72] mb-1">
                <span className="font-bold uppercase tracking-wider">Prorated Math Preview</span>
                <span>{getMonthName(selectedMonth)} ({daysInMon} days)</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-black text-[#c1ff72]">
                    {formatCurrency(calculatedDailyLimit, settings.currency)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium ml-1">/ day limit</span>
                </div>
                <div className="text-right text-xs text-zinc-300">
                  <div>
                    Monthly Cap: <strong>{formatCurrency(numMax, settings.currency)}</strong>
                  </div>
                  {rolloverEnabled && numRoll !== 0 && (
                    <div className="text-[11px] text-[#c1ff72]">
                      Rollover: {numRoll > 0 ? '+' : ''}{formatCurrency(numRoll, settings.currency)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Item Name & Max Spend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Item / Tracking Name *
                </label>
                <input
                  id="prorated-name-input"
                  type="text"
                  required
                  placeholder="e.g. Snacks, Coffee, Dining Out"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Monthly Max Spend ({settings.currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                    {settings.currency}
                  </span>
                  <input
                    id="prorated-monthly-spend-input"
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="500"
                    value={monthlyMaxSpend}
                    onChange={(e) => setMonthlyMaxSpend(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-bold text-xs placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              </div>
            </div>

            {/* Category Association */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Link to Category (Optional)
              </label>
              <select
                id="prorated-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="" className="bg-[#111114] text-white">-- Match by Name or Tags --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#111114] text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Tags */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Target Tags (Comma separated)
              </label>
              <input
                id="prorated-tags-input"
                type="text"
                placeholder="snacks, coffee_break, pastry, chips"
                value={targetTagsStr}
                onChange={(e) => setTargetTagsStr(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Any expense with these tags will automatically count against this prorated daily budget.
              </p>
            </div>

            {/* Budget Rollover Settings */}
            <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#c1ff72]" />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Budget Rollover Settings
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Carry unspent surplus or overage into next month
                    </span>
                  </div>
                </div>
                <input
                  id="prorated-rollover-toggle"
                  type="checkbox"
                  checked={rolloverEnabled}
                  onChange={(e) => setRolloverEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#c1ff72] bg-white/5 rounded-sm border-white/20 accent-[#c1ff72]"
                />
              </div>

              {rolloverEnabled && (
                <div className="pt-2 border-t border-white/10">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Rollover Amount from Previous Month ({settings.currency})
                  </label>
                  <input
                    id="prorated-rollover-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00 (Positive for surplus, negative for deficit)"
                    value={rolloverAmount}
                    onChange={(e) => setRolloverAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              )}
            </div>

            {/* Daily Alert Threshold */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Daily Limit Alert Trigger
                </span>
                <span className="text-[#c1ff72] font-bold">{alertThresholdPercent}% of limit</span>
              </div>
              <input
                id="prorated-alert-slider"
                type="range"
                min="50"
                max="120"
                step="5"
                value={alertThresholdPercent}
                onChange={(e) => setAlertThresholdPercent(e.target.value)}
                className="w-full accent-[#c1ff72] h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>50% (Early Warning)</span>
                <span>100% (Exact Limit)</span>
                <span>120% (Relaxed)</span>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                id="cancel-prorated-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-prorated-btn"
                className="px-5 py-2 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Check className="w-3.5 h-3.5" />
                {editingRule ? 'Update Tracker' : 'Activate Prorated Limit'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
