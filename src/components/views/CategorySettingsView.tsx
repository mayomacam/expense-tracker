import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Bell,
  RefreshCw,
  Sliders,
  DollarSign,
  Palette,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { Category } from '../../types';
import { CategoryIcon, AVAILABLE_ICONS } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/formatters';

interface CategorySettingsViewProps {
  onOpenAddCategory: () => void;
  onEditCategory: (cat: Category) => void;
}

export const CategorySettingsView: React.FC<CategorySettingsViewProps> = ({
  onOpenAddCategory,
  onEditCategory,
}) => {
  const {
    categories,
    deleteCategory,
    settings,
    updateSettings,
    resetToDefaultData,
  } = useExpense();

  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleTestPushNotification = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('SpendWise Budget Alert', {
          body: 'Automated notification test: Your daily snack spending is on track today!',
          icon: '/favicon.ico',
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('SpendWise Budget Alert', {
            body: 'Push notifications successfully activated!',
          });
          setTestNotificationSent(true);
          setTimeout(() => setTestNotificationSent(false), 3000);
        }
      }
    } else {
      alert('Your browser does not support HTML5 desktop notifications.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Categories & Application Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Configure custom category icons, budget caps, automated push notifications, and currencies
          </p>
        </div>

        <button
          type="button"
          id="add-new-category-btn"
          onClick={onOpenAddCategory}
          className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 font-mono uppercase tracking-wider text-[11px]"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Preferences & Notifications Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Currency & Thresholds */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4 font-mono">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-[#c1ff72]" />
            <span>Currency & Regional Settings</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-400 mb-1">
                Display Currency Symbol
              </label>
              <select
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#c1ff72]"
              >
                <option value="$" className="bg-[#111114] text-white">USD ($) - US Dollar</option>
                <option value="€" className="bg-[#111114] text-white">EUR (€) - Euro</option>
                <option value="£" className="bg-[#111114] text-white">GBP (£) - British Pound</option>
                <option value="¥" className="bg-[#111114] text-white">JPY (¥) - Japanese Yen</option>
                <option value="₹" className="bg-[#111114] text-white">INR (₹) - Indian Rupee</option>
                <option value="C$" className="bg-[#111114] text-white">CAD (C$) - Canadian Dollar</option>
                <option value="A$" className="bg-[#111114] text-white">AUD (A$) - Australian Dollar</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-between font-semibold text-zinc-300 cursor-pointer">
                <span>Enable Budget Rollover by Default</span>
                <input
                  type="checkbox"
                  checked={settings.enableRolloverByDefault}
                  onChange={(e) => updateSettings({ enableRolloverByDefault: e.target.checked })}
                  className="rounded border-white/20 bg-white/5 text-[#c1ff72] focus:ring-[#c1ff72] w-4 h-4 accent-[#c1ff72]"
                />
              </label>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Automatically carries unspent budget surplus to the following month.
              </p>
            </div>
          </div>
        </div>

        {/* Automated Push Notifications */}
        <div className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4 font-mono">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Automated Push Notifications</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between font-semibold text-zinc-300 cursor-pointer">
              <span>Enable In-App & Browser Alerts</span>
              <input
                type="checkbox"
                checked={settings.pushNotificationsEnabled}
                onChange={(e) => updateSettings({ pushNotificationsEnabled: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-[#c1ff72] focus:ring-[#c1ff72] w-4 h-4 accent-[#c1ff72]"
              />
            </label>
            <p className="text-[11px] text-zinc-500">
              Receive instant alerts whenever a daily prorated spending limit is breached or a monthly category budget nears cap.
            </p>

            <button
              type="button"
              onClick={handleTestPushNotification}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-400/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Send Test Notification</span>
            </button>

            {testNotificationSent && (
              <span className="text-[11px] text-[#c1ff72] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Notification dispatched!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Management List */}
      <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Custom Category Palette</h3>
            <p className="text-xs text-zinc-400 font-mono">
              Manage custom icons, accent colors, and monthly default budgets
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-zinc-500">
            {categories.length} categories active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 truncate">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div className="truncate font-mono">
                  <h4 className="text-xs font-bold text-white truncate">{cat.name}</h4>
                  <span className="text-[11px] text-zinc-400">
                    Cap: {cat.monthlyBudget ? formatCurrency(cat.monthlyBudget, settings.currency) : 'None'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditCategory(cat)}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-zinc-500 hover:text-[#ff5f5f] hover:bg-[#ff5f5f]/10 rounded-lg transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Reset to Default Data */}
      <div className="p-5 rounded-2xl border border-[#ff5f5f]/20 bg-[#ff5f5f]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <h4 className="text-xs font-bold text-[#ff5f5f] flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#ff5f5f]" />
            Reset Initial Sample Data
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
            Restore sample data including the $500 Snacks prorated daily tracker, sample transactions, savings goals, and debts.
          </p>
        </div>

        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetToDefaultData();
                setShowResetConfirm(false);
              }}
              className="px-3 py-1.5 bg-[#ff5f5f] text-white text-xs font-bold rounded-lg hover:bg-[#ee4e4e] uppercase"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 bg-white/5 text-zinc-400 text-xs font-medium rounded-lg hover:bg-white/10 uppercase"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-1.5 bg-[#ff5f5f]/10 text-[#ff5f5f] border border-[#ff5f5f]/30 rounded-xl text-xs font-semibold hover:bg-[#ff5f5f]/20 transition-colors self-start sm:self-auto uppercase tracking-wider text-[11px]"
          >
            Reset to Sample Data
          </button>
        )}
      </div>
    </div>
  );
};
