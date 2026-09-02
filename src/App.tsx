/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { ProratedBudgetView } from './components/views/ProratedBudgetView';
import { TransactionsView } from './components/views/TransactionsView';
import { MonthlyReportView } from './components/views/MonthlyReportView';
import { BudgetsAndRecurringView } from './components/views/BudgetsAndRecurringView';
import { SavingsAndDebtView } from './components/views/SavingsAndDebtView';
import { CategorySettingsView } from './components/views/CategorySettingsView';

// Modals
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
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultCategoryForTx, setDefaultCategoryForTx] = useState<string | undefined>(undefined);

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
        }}
        initialTransaction={editingTransaction}
        defaultCategoryId={defaultCategoryForTx}
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
<<<<<<< HEAD

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
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
