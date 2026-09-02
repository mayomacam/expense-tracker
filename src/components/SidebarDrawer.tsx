import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { ProratedBudgetRule } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  selectedRuleId?: string;
  onSelectRuleId?: (id: string) => void;
  onOpenAddTransaction: (defaultCategory?: string) => void;
  onOpenAddProratedModal: () => void;
  onEditProratedRule: (rule: ProratedBudgetRule) => void;
  onNavigateTab: (tab: string) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  selectedRuleId,
  onSelectRuleId,
  onOpenAddTransaction,
  onOpenAddProratedModal,
  onEditProratedRule,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full overflow-y-auto p-4"
        >
          <Sidebar
            activeTab={activeTab}
            selectedRuleId={selectedRuleId}
            onSelectRuleId={onSelectRuleId}
            onOpenAddTransaction={onOpenAddTransaction}
            onOpenAddProratedModal={onOpenAddProratedModal}
            onEditProratedRule={onEditProratedRule}
            onNavigateTab={onNavigateTab}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
