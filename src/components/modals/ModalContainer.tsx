import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import { ActiveTab } from '../../types';
import { AddTransactionModal } from './AddTransactionModal';
import { AddCategoryModal } from './AddCategoryModal';
import { AddProratedBudgetModal } from './AddProratedBudgetModal';
import { AddSavingsGoalModal } from './AddSavingsGoalModal';
import { AddDebtModal } from './AddDebtModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { SqliteManagerModal } from './SqliteManagerModal';
import { ExportReportModal } from './ExportReportModal';

export const ModalContainer: React.FC = () => {
  const { activeModal, closeModal } = useModal();
  const navigate = useNavigate();

  const handleNavigateTab = (tab: ActiveTab) => {
    const route = tab === 'savings_debt' ? '/savings-debt' : `/${tab}`;
    navigate(route);
  };

  return (
    <>
      <AddTransactionModal
        isOpen={activeModal === 'add_transaction'}
        onClose={closeModal}
      />

      <AddCategoryModal
        isOpen={activeModal === 'add_category'}
        onClose={closeModal}
      />

      <AddProratedBudgetModal
        isOpen={activeModal === 'add_prorated'}
        onClose={closeModal}
      />

      <AddSavingsGoalModal
        isOpen={activeModal === 'add_savings'}
        onClose={closeModal}
      />

      <AddDebtModal
        isOpen={activeModal === 'add_debt'}
        onClose={closeModal}
      />

      <NotificationCenterModal
        isOpen={activeModal === 'notifications'}
        onClose={closeModal}
        onNavigateTab={handleNavigateTab}
      />

      <SqliteManagerModal
        isOpen={activeModal === 'sqlite_manager'}
        onClose={closeModal}
      />

      <ExportReportModal
        isOpen={activeModal === 'export_report'}
        onClose={closeModal}
      />
    </>
  );
};
