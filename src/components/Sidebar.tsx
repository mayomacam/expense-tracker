import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  CalendarClock,
  PiggyBank,
  Coins,
  FileBarChart,
  Tag,
  Trash2,
  Database,
  Download,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useExpense } from '../context/ExpenseContext';
import { useModal } from '../context/ModalContext';

interface SidebarProps {
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenExportModal?: () => void;
  onOpenSqliteManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab: propActiveTab,
  onSelectTab,
  onOpenExportModal,
  onOpenSqliteManager,
}) => {
  const { deletedTransactions } = useExpense();
  const { openModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route or prop
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
  };

  const handleExport = () => {
    if (onOpenExportModal) {
      onOpenExportModal();
    } else {
      openModal('export_report');
    }
  };

  const handleSqliteManager = () => {
    if (onOpenSqliteManager) {
      onOpenSqliteManager();
    } else {
      openModal('sqlite_manager');
    }
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transactions', icon: Receipt },
    { id: 'prorated' as ActiveTab, label: 'Prorated Limits', icon: Scale, highlight: true },
    { id: 'budgets' as ActiveTab, label: 'Budgets & Recurring', icon: CalendarClock },
    { id: 'savings_debt' as ActiveTab, label: 'Savings & Debts', icon: PiggyBank },
    { id: 'gulak' as ActiveTab, label: 'Gulak (गुलक)', icon: Coins },
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
    <aside className="w-64 bg-[#111114] border-r border-[#27272a] flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-1">
        <div className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#c1ff72]' : item.highlight ? 'text-[#c1ff72]/80' : ''}`} />
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

      <div className="p-4 border-t border-[#27272a] space-y-2">
        <button
          type="button"
          onClick={handleExport}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#c1ff72]" />
          <span>Export CSV &amp; PDF</span>
        </button>

        <button
          type="button"
          onClick={handleSqliteManager}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#c1ff72]" />
            <span>SQLite Status</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        </button>
      </div>
    </aside>
  );
};
