import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  Bell,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Calculator,
  ReceiptText,
  PieChart,
  Repeat,
  Target,
  Settings,
  Database,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { getMonthName } from '../utils/formatters';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddTransaction: () => void;
  onOpenNotifications: () => void;
  onOpenExport: () => void;
  onOpenSqliteManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddTransaction,
  onOpenNotifications,
  onOpenExport,
  onOpenSqliteManager,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    unreadAlertCount,
    settings,
    updateSettings,
    dbStatus,
    isDbSyncing,
  } = useExpense();

  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const currencies = [
    { symbol: '$', code: 'USD', label: '$ USD (US Dollar)' },
    { symbol: '€', code: 'EUR', label: '€ EUR (Euro)' },
    { symbol: '£', code: 'GBP', label: '£ GBP (British Pound)' },
    { symbol: '₹', code: 'INR', label: '₹ INR (Indian Rupee)' },
    { symbol: '¥', code: 'JPY', label: '¥ JPY (Japanese Yen)' },
    { symbol: 'C$', code: 'CAD', label: 'C$ CAD (Canadian Dollar)' },
  ];

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newYear = prevDate.getFullYear();
    const newMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newYear = nextDate.getFullYear();
    const newMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prorated', label: 'Prorated Limits', icon: Calculator, badge: 'Daily' },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'budgets', label: 'Budgets & Recurring', icon: Repeat },
    { id: 'savings_debt', label: 'Savings & Debt', icon: Target },
    { id: 'settings', label: 'Categories', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 text-[#c1ff72] flex items-center justify-center shadow-[0_0_12px_rgba(193,255,114,0.15)]">
              <Wallet className="w-5 h-5 text-[#c1ff72]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                  FINANCE<span className="text-[#c1ff72]">FLOW</span>
                </h1>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#c1ff72]/10 text-[#c1ff72] border border-[#c1ff72]/20 uppercase">
                  PRORATED
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 hidden sm:block">
                Atmospheric Expense Monitoring • {getMonthName(selectedMonth)}
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-[#111114] p-1 rounded-xl border border-white/[0.08] shadow-inner">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              title="Previous month"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 font-semibold text-xs sm:text-sm text-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-[#c1ff72] shrink-0" />
              <span className="min-w-[100px] text-center font-mono text-xs sm:text-sm">
                {getMonthName(selectedMonth)}
              </span>
            </div>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              title="Next month"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Currency Selector */}
            <div className="relative">
              <button
                id="currency-selector-btn"
                type="button"
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="px-2.5 py-1.5 text-xs font-semibold text-zinc-300 bg-[#111114] hover:bg-white/5 border border-white/[0.08] rounded-xl transition-colors flex items-center gap-1.5"
                title="Change Currency"
              >
                <span className="text-[#c1ff72] font-mono font-bold">{settings.currency}</span>
                <span className="text-zinc-500 text-[10px] font-mono">{settings.currencyCode}</span>
              </button>

              {showCurrencyMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#111114] rounded-xl shadow-2xl border border-white/10 p-1.5 z-50 backdrop-blur-xl">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
                    Select Currency
                  </div>
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        updateSettings({ currency: c.symbol, currencyCode: c.code });
                        setShowCurrencyMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        settings.currencyCode === c.code
                          ? 'bg-[#c1ff72]/15 text-[#c1ff72] font-semibold'
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className="font-mono font-bold text-[#c1ff72]">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SQLite DB Status & Manager Trigger */}
            <button
              id="navbar-sqlite-btn"
              type="button"
              onClick={onOpenSqliteManager}
              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#111114] hover:bg-white/5 border border-white/[0.08] rounded-xl transition-all flex items-center gap-1.5"
              title="SQLite Database Status & Management"
            >
              <Database className="w-3.5 h-3.5 text-[#c1ff72]" />
              <span className="hidden sm:inline font-mono uppercase text-[11px] text-[#c1ff72]">
                SQLite
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDbSyncing
                    ? 'bg-amber-400 animate-spin'
                    : dbStatus === 'connected'
                    ? 'bg-[#c1ff72] shadow-[0_0_6px_rgba(193,255,114,0.8)]'
                    : 'bg-zinc-500'
                }`}
              />
            </button>

            {/* Export CSV Button */}
            <button
              id="navbar-export-btn"
              type="button"
              onClick={onOpenExport}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#111114] hover:bg-white/5 border border-white/[0.08] rounded-xl transition-all flex items-center gap-1.5"
              title="Export CSV Reports"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline uppercase text-[11px] tracking-wider">Export CSV</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              id="navbar-notifications-btn"
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/[0.08] transition-colors"
              title="View Budget Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff5f5f] text-black font-mono rounded-full text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(255,95,95,0.6)]">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Primary Add Transaction Button */}
            <button
              id="navbar-add-tx-btn"
              type="button"
              onClick={onOpenAddTransaction}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] hover:shadow-[0_0_20px_rgba(193,255,114,0.45)] transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="uppercase tracking-wider text-[11px]">Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-white/[0.06] no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#c1ff72]/15 text-[#c1ff72] border border-[#c1ff72]/30 shadow-[0_0_10px_rgba(193,255,114,0.1)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c1ff72]' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

