import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalType =
  | 'add_transaction'
  | 'add_category'
  | 'add_prorated'
  | 'add_savings'
  | 'add_debt'
  | 'notifications'
  | 'sqlite_manager'
  | 'export_report'
  | null;

interface ModalContextType {
  activeModal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  isOpen: (type: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = useCallback((type: ModalType) => {
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isOpen = useCallback(
    (type: ModalType) => activeModal === type,
    [activeModal]
  );

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal, isOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
