import React, { useState } from 'react';
import { Tag, Plus, Trash2, Settings, Check } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CategoryIcon } from '../common/CategoryIcon';

interface CategorySettingsViewProps {
  onOpenAddCategory: () => void;
}

export const CategorySettingsView: React.FC<CategorySettingsViewProps> = ({ onOpenAddCategory }) => {
  const { categories, deleteCategory, settings, updateSettings } = useExpense();
  const [currency, setCurrency] = useState(settings.currency);
  const [userName, setUserName] = useState(settings.userName || '');
  const [warningThreshold, setWarningThreshold] = useState(
    String(settings.monthlyBudgetWarningThreshold)
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      currency,
      userName: userName.trim(),
      monthlyBudgetWarningThreshold: Number(warningThreshold) || 80,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Categories Management */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Manage Categories</h2>
            <p className="text-xs text-zinc-400">Custom categories with color coding and icons</p>
          </div>
          <button
            type="button"
            onClick={onOpenAddCategory}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon name={cat.icon} className="w-4 h-4" color={cat.color} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{cat.name}</h4>
                  <span className="text-[10px] text-zinc-500">
                    {cat.isCustom ? 'Custom' : 'System Default'}
                  </span>
                </div>
              </div>
              {cat.isCustom && (
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Settings */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#c1ff72]" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">App Preferences</h2>
            <p className="text-xs text-zinc-400">Personalize currency, name, and notifications</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="₹">₹ (INR - Indian Rupee)</option>
              <option value="$">$ (USD - US Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - British Pound)</option>
              <option value="¥">¥ (JPY - Japanese Yen)</option>
              <option value="A$">A$ (AUD - Australian Dollar)</option>
              <option value="C$">C$ (CAD - Canadian Dollar)</option>
              <option value="AED">AED (UAE Dirham)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Monthly Budget Warning Alert Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};
