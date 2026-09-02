import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Layers } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { Category } from '../../types';
import { CategoryIcon, AVAILABLE_ICONS, PRESET_COLORS } from '../common/CategoryIcon';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
}) => {
  const { addCategory, updateCategory, settings } = useExpense();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#6366F1');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
      setMonthlyBudget(editingCategory.monthlyBudget ? editingCategory.monthlyBudget.toString() : '');
    } else {
      setName('');
      setIcon('Tag');
      setColor('#6366F1');
      setMonthlyBudget('');
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBudget = parseFloat(monthlyBudget) || 0;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        icon,
        color,
        monthlyBudget: numBudget,
      });
    } else {
      addCategory({
        name: name.trim(),
        icon,
        color,
        monthlyBudget: numBudget,
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
          className="w-full max-w-md bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md font-mono"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white border border-white/10"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon name={icon} className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create Custom Category'}
                </h3>
                <p className="text-xs text-zinc-400">Customize icon, color & monthly budget</p>
              </div>
            </div>
            <button
              id="close-cat-modal-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Category Name *
              </label>
              <input
                id="cat-name-input"
                type="text"
                required
                placeholder="e.g. Subscriptions, Hobbies, Coffee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Monthly Budget Cap ({settings.currency})
              </label>
              <input
                id="cat-budget-input"
                type="number"
                step="1"
                min="0"
                placeholder="0 (Leave empty for no cap)"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Choose Icon
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-white/[0.02] border border-white/10 rounded-xl max-h-36 overflow-y-auto">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                      icon === iconName
                        ? 'bg-[#c1ff72] text-black border-[#c1ff72] shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                        : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <CategoryIcon name={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Theme Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#c1ff72] ring-offset-[#111114]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                id="cancel-cat-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-cat-btn"
                className="px-5 py-2 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Check className="w-3.5 h-3.5" />
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
