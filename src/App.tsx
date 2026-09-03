import React, { useState } from 'react';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { ProratedBudgetView } from './components/views/ProratedBudgetView';
import { BudgetsAndRecurringView } from './components/views/BudgetsAndRecurringView';
import { SavingsAndDebtView } from './components/views/SavingsAndDebtView';
import { MonthlyReportView } from './components/views/MonthlyReportView';
import { CategorySettingsView } from './components/views/CategorySettingsView';
import { TrashView } from './components/views/TrashView';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { AddCategoryModal } from './components/modals/AddCategoryModal';
import { AddProratedBudgetModal } from './components/modals/AddProratedBudgetModal';
import { AddSavingsGoalModal } from './components/modals/AddSavingsGoalModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { SqliteManagerModal } from './components/modals/SqliteManagerModal';
import { ExportReportModal } from './components/modals/ExportReportModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);

  // Modals state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProratedOpen, setIsAddProratedOpen] = useState(false);
  const [isAddSavingsOpen, setIsAddSavingsOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSqliteManagerOpen, setIsSqliteManagerOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
            onOpenAddProrated={() => setIsAddProratedOpen(true)}
          />
        );
      case 'transactions':
        return (
          <TransactionsView onOpenAddTransaction={() => setIsAddTransactionOpen(true)} />
        );
      case 'prorated':
        return (
          <ProratedBudgetView onOpenAddProrated={() => setIsAddProratedOpen(true)} />
        );
      case 'budgets':
        return <BudgetsAndRecurringView />;
      case 'savings_debt':
        return (
          <SavingsAndDebtView
            onOpenAddSavings={() => setIsAddSavingsOpen(true)}
            onOpenAddDebt={() => setIsAddDebtOpen(true)}
          />
        );
      case 'reports':
        return <MonthlyReportView />;
      case 'categories':
        return (
          <CategorySettingsView onOpenAddCategory={() => setIsAddCategoryOpen(true)} />
        );
      case 'trash':
        return <TrashView />;
      default:
        return (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
            onOpenAddProrated={() => setIsAddProratedOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      <Navbar
        onOpenSidebar={() => setIsSidebarDrawerOpen(true)}
        onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSqliteManager={() => setIsSqliteManagerOpen(true)}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenExportModal={() => setIsExportReportOpen(true)}
          onOpenSqliteManager={() => setIsSqliteManagerOpen(true)}
        />

        <SidebarDrawer
          isOpen={isSidebarDrawerOpen}
          onClose={() => setIsSidebarDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenExportModal={() => setIsExportReportOpen(true)}
          onOpenSqliteManager={() => setIsSqliteManagerOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
      />

      <AddProratedBudgetModal
        isOpen={isAddProratedOpen}
        onClose={() => setIsAddProratedOpen(false)}
      />

      <AddSavingsGoalModal
        isOpen={isAddSavingsOpen}
        onClose={() => setIsAddSavingsOpen(false)}
      />

      <AddDebtModal
        isOpen={isAddDebtOpen}
        onClose={() => setIsAddDebtOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <SqliteManagerModal
        isOpen={isSqliteManagerOpen}
        onClose={() => setIsSqliteManagerOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
      />
    </div>
  );
};

export default App;
