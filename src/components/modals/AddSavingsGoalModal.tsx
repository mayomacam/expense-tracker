import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, PiggyBank, Calendar, Target } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { SavingsGoal } from '../../types';
import { PRESET_COLORS, AVAILABLE_ICONS } from '../common/CategoryIcon';
import { CategoryIcon } from '../common/CategoryIcon';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal | null;
}

export const AddSavingsGoalModal: React.FC<AddSavingsGoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
}) => {
  const { addSavingsGoal, updateSavingsGoal, settings } = useExpense();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('#10B981');
  const [category, setCategory] = useState('Emergency Fund');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount.toString());
      setTargetDate(editingGoal.targetDate);
      setIcon(editingGoal.icon || 'PiggyBank');
      setColor(editingGoal.color || '#10B981');
      setCategory(editingGoal.category || 'General');
      setNotes(editingGoal.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      const nextYear = new Date().getFullYear() + 1;
      setTargetDate(`${nextYear}-12-31`);
      setIcon('PiggyBank');
      setColor('#10B981');
      setCategory('General');
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!name.trim() || isNaN(numTarget) || numTarget <= 0 || !targetDate) return;

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: numTarget,
        targetDate,
        icon,
        color,
        category,
        notes: notes.trim() || undefined,
      });
    } else {
      addSavingsGoal({
        name: name.trim(),
        targetAmount: numTarget,
        targetDate,
        icon,
        color,
        category,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
                {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h3>
            </div>
            <button
              id="close-savings-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Goal Title *
              </label>
              <input
                id="savings-name-input"
                type="text"
                required
                placeholder="e.g. Vacation Trip to Japan, Emergency Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Amount ({settings.currency}) *
                </label>
                <input
                  id="savings-amount-input"
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Completion Date *
                </label>
                <input
                  id="savings-date-input"
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Icon & Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Goal Icon
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto">
                {AVAILABLE_ICONS.slice(0, 16).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      icon === iconName
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryIcon name={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="savings-notes-input"
                rows={2}
                placeholder="High-yield savings allocation plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="cancel-savings-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-savings-btn"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
