import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Receipt,
  Scale,
  CalendarClock,
  PiggyBank,
  FileBarChart,
  Tag,
  Trash2,
  Database,
  Download,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useExpense } from '../context/ExpenseContext';
import { useModal } from '../context/ModalContext';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenExportModal?: () => void;
  onOpenSqliteManager?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab: propActiveTab,
  onSelectTab,
  onOpenExportModal,
  onOpenSqliteManager,
}) => {
  const { deletedTransactions } = useExpense();
  const { openModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentPath = location.pathname.replace(/^\//, '') || 'dashboard';
  const derivedTab: ActiveTab =
    currentPath === 'savings-debt' || currentPath === 'savings_debt'
      ? 'savings_debt'
      : (currentPath as ActiveTab);
  const activeTab = propActiveTab || derivedTab;

  const handleSelectTab = (tab: ActiveTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
    const route = tab === 'savings_debt' ? '/savings-debt' : `/${tab}`;
    navigate(route);
    onClose();
  };

  const handleExport = () => {
    if (onOpenExportModal) {
      onOpenExportModal();
    } else {
      openModal('export_report');
    }
    onClose();
  };

  const handleSqliteManager = () => {
    if (onOpenSqliteManager) {
      onOpenSqliteManager();
    } else {
      openModal('sqlite_manager');
    }
    onClose();
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transactions', icon: Receipt },
    { id: 'prorated' as ActiveTab, label: 'Prorated Limits', icon: Scale },
    { id: 'budgets' as ActiveTab, label: 'Budgets & Recurring', icon: CalendarClock },
    { id: 'savings_debt' as ActiveTab, label: 'Savings & Debts', icon: PiggyBank },
    { id: 'reports' as ActiveTab, label: 'Reports & Export', icon: FileBarChart },
    { id: 'categories' as ActiveTab, label: 'Categories', icon: Tag },
    {
      id: 'trash' as ActiveTab,
      label: 'Trash Bin',
      icon: Trash2,
      badge: deletedTransactions.length > 0 ? deletedTransactions.length : undefined,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] bg-[#111114] border-r border-[#27272a] h-full flex flex-col justify-between p-4 z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#c1ff72] to-[#00f2fe] flex items-center justify-center font-bold text-black text-xs">
                ₹
              </div>
              <span className="font-semibold text-white text-sm">Budget Tracker</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#c1ff72]' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] space-y-2">
          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span>Export CSV / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSqliteManager}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-lg cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span>SQLite Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
