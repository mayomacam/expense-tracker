import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useExpense } from './context/ExpenseContext';
import { ModalProvider } from './context/ModalContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { ModalContainer } from './components/modals/ModalContainer';
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
import { GulakView } from './components/views/GulakView';

const AppLayout: React.FC = () => {
  const { isLoading } = useExpense();
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      <Navbar onOpenSidebar={() => setIsSidebarDrawerOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar />
        <SidebarDrawer
          isOpen={isSidebarDrawerOpen}
          onClose={() => setIsSidebarDrawerOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/prorated" element={<ProratedBudgetView />} />
            <Route path="/budgets" element={<BudgetsAndRecurringView />} />
            <Route path="/savings-debt" element={<SavingsAndDebtView />} />
            <Route path="/savings_debt" element={<Navigate to="/savings-debt" replace />} />
            <Route path="/gulak" element={<GulakView />} />
            <Route path="/reports" element={<MonthlyReportView />} />
            <Route path="/categories" element={<CategorySettingsView />} />
            <Route path="/trash" element={<TrashView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <ModalContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ModalProvider>
          <AppLayout />
        </ModalProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
