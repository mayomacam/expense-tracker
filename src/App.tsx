import React, { useState } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { ProratedBudgetView } from './components/views/ProratedBudgetView';
import { TransactionsView } from './components/views/TransactionsView';
import { MonthlyReportView } from './components/views/MonthlyReportView';
import { BudgetsAndRecurringView } from './components/views/BudgetsAndRecurringView';
import { SavingsAndDebtView } from './components/views/SavingsAndDebtView';
import { CategorySettingsView } from './components/views/CategorySettingsView';

// Modals & Sidebar
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { AddProratedBudgetModal } from './components/modals/AddProratedBudgetModal';
import { AddSavingsGoalModal } from './components/modals/AddSavingsGoalModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { AddCategoryModal } from './components/modals/AddCategoryModal';
import { ExportReportModal } from './components/modals/ExportReportModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { SqliteManagerModal } from './components/modals/SqliteManagerModal';
import { SidebarDrawer } from './components/SidebarDrawer';
import { Sidebar } from './components/Sidebar';

// Types
import {
  Transaction,
  ProratedBudgetRule,
  SavingsGoal,
  DebtItem,
  Category,
} from './types';
import { Plus, Calculator } from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProratedRuleId, setSelectedProratedRuleId] = useState<string>('');

  // Modal & Sidebar States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultCategoryForTx, setDefaultCategoryForTx] = useState<string | undefined>(undefined);
  const [defaultDateForTx, setDefaultDateForTx] = useState<string | undefined>(undefined);

  const [isProratedModalOpen, setIsProratedModalOpen] = useState(false);
  const [editingProratedRule, setEditingProratedRule] = useState<ProratedBudgetRule | null>(null);

  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<SavingsGoal | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSqliteOpen, setIsSqliteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Handlers
  const handleOpenAddTransaction = (defaultCategoryId?: string, defaultDate?: string) => {
    setEditingTransaction(null);
    setDefaultCategoryForTx(defaultCategoryId);
    setDefaultDateForTx(defaultDate);
    setIsAddTxOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDefaultCategoryForTx(undefined);
    setDefaultDateForTx(undefined);
    setIsAddTxOpen(true);
  };

  const handleOpenAddProrated = () => {
    setEditingProratedRule(null);
    setIsProratedModalOpen(true);
  };

  const handleEditProrated = (rule: ProratedBudgetRule) => {
    setEditingProratedRule(rule);
    setIsProratedModalOpen(true);
  };

  const handleOpenAddSavings = () => {
    setEditingSavingsGoal(null);
    setIsSavingsModalOpen(true);
  };

  const handleEditSavings = (goal: SavingsGoal) => {
    setEditingSavingsGoal(goal);
    setIsSavingsModalOpen(true);
  };

  const handleOpenAddDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const handleEditDebt = (debt: DebtItem) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased relative selection:bg-[#c1ff72] selection:text-black">
      {/* Ambient background glows */}
      <div className="glow-bg" />
      <div className="glow-bg-secondary" />

      {/* Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddTransaction={() => handleOpenAddTransaction()}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSqliteManager={() => setIsSqliteOpen(true)}
        onOpenSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area + Side-by-Side Persistent Sidebar Panel */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8 relative z-10 flex gap-6">
        {/* Main View Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddTransaction={() => handleOpenAddTransaction()}
              onNavigateTab={setActiveTab}
              onOpenAddProrated={handleOpenAddProrated}
            />
          )}

          {activeTab === 'prorated' && (
            <ProratedBudgetView
              selectedRuleId={selectedProratedRuleId}
              onSelectRuleId={setSelectedProratedRuleId}
              onOpenAddTransaction={handleOpenAddTransaction}
              onOpenAddProratedModal={handleOpenAddProrated}
              onEditProratedRule={handleEditProrated}
              onOpenAddCategory={handleOpenAddCategory}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              onOpenAddTransaction={() => handleOpenAddTransaction()}
              onEditTransaction={handleEditTransaction}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <MonthlyReportView onOpenExport={() => setIsExportModalOpen(true)} />
          )}

          {activeTab === 'budgets' && (
            <BudgetsAndRecurringView
              onOpenAddCategory={handleOpenAddCategory}
              onEditCategory={handleEditCategory}
              onOpenAddTransaction={() => handleOpenAddTransaction()}
            />
          )}

          {activeTab === 'savings_debt' && (
            <SavingsAndDebtView
              onOpenAddSavings={handleOpenAddSavings}
              onEditSavings={handleEditSavings}
              onOpenAddDebt={handleOpenAddDebt}
              onEditDebt={handleEditDebt}
            />
          )}

          {activeTab === 'settings' && (
            <CategorySettingsView
              onOpenAddCategory={handleOpenAddCategory}
              onEditCategory={handleEditCategory}
            />
          )}
        </main>

        {/* Persistent Desktop Sidebar (Visible by default, toggled via SIDEBAR button!) */}
        {isSidebarOpen && (
          <aside className="w-80 md:w-88 lg:w-96 shrink-0 hidden md:block">
            <Sidebar
              activeTab={activeTab}
              selectedRuleId={selectedProratedRuleId}
              onSelectRuleId={setSelectedProratedRuleId}
              onOpenAddTransaction={handleOpenAddTransaction}
              onOpenAddProratedModal={handleOpenAddProrated}
              onEditProratedRule={handleEditProrated}
              onNavigateTab={setActiveTab}
            />
          </aside>
        )}
      </div>

      {/* Mobile Floating Action Bar */}
      <div className="sm:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('prorated')}
          className="w-12 h-12 rounded-full bg-[#111114] border border-[#c1ff72]/40 text-[#c1ff72] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          title="Prorated Daily Limit"
        >
          <Calculator className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => handleOpenAddTransaction()}
          className="w-14 h-14 rounded-full bg-[#c1ff72] text-black font-bold flex items-center justify-center shadow-[0_0_20px_rgba(193,255,114,0.4)] active:scale-95 transition-transform"
          title="Log Transaction"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* All Application Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setEditingTransaction(null);
          setDefaultDateForTx(undefined);
        }}
        initialTransaction={editingTransaction}
        defaultCategoryId={defaultCategoryForTx}
        defaultDate={defaultDateForTx}
      />

      <AddProratedBudgetModal
        isOpen={isProratedModalOpen}
        onClose={() => {
          setIsProratedModalOpen(false);
          setEditingProratedRule(null);
        }}
        initialRule={editingProratedRule}
      />

      <AddSavingsGoalModal
        isOpen={isSavingsModalOpen}
        onClose={() => {
          setIsSavingsModalOpen(false);
          setEditingSavingsGoal(null);
        }}
        initialGoal={editingSavingsGoal}
      />

      <AddDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        initialDebt={editingDebt}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        initialCategory={editingCategory}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={setActiveTab}
      />

      <SqliteManagerModal
        isOpen={isSqliteOpen}
        onClose={() => setIsSqliteOpen(false)}
      />

      {/* Mobile Drawer (When sidebar toggled on mobile) */}
      <div className="md:hidden">
        <SidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          selectedRuleId={selectedProratedRuleId}
          onSelectRuleId={setSelectedProratedRuleId}
          onOpenAddTransaction={handleOpenAddTransaction}
          onOpenAddProratedModal={handleOpenAddProrated}
          onEditProratedRule={handleEditProrated}
          onNavigateTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <MainApp />
    </ExpenseProvider>
  );
}
