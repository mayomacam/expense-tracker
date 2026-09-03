import React from 'react';
import { Menu, Bell, Database, Plus, RefreshCw } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { ThemeToggle } from './common/ThemeToggle';

interface NavbarProps {
  onOpenSidebar: () => void;
  onOpenAddTransaction: () => void;
  onOpenNotifications: () => void;
  onOpenSqliteManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  onOpenAddTransaction,
  onOpenNotifications,
  onOpenSqliteManager,
}) => {
  const { unreadAlertCount, refreshFromDb, isLoading } = useExpense();

  return (
    <header className="h-16 bg-[#111114] border-b border-[#27272a] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 focus:outline-none"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#c1ff72] to-[#00f2fe] flex items-center justify-center font-bold text-black text-sm">
            ₹
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight leading-none">
              Expense &amp; Prorated Budget
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
              Daily Prorated Limits &amp; SQLite Storage
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <button
          type="button"
          onClick={() => refreshFromDb()}
          disabled={isLoading}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Sync with SQLite"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#c1ff72]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onOpenSqliteManager}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-[#c1ff72]" />
          <span>SQLite DB</span>
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenAddTransaction}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>
    </header>
  );
};
