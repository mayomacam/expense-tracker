import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  Transaction,
  Category,
  ProratedBudgetRule,
  SavingsGoal,
  DebtItem,
  RecurringItem,
  BudgetAlert,
  UserSettings,
} from '../types';
import { getInitialSeedData } from '../data/seedData';
import { evaluateAllAlerts } from '../utils/budgetCalculations';
import { getCurrentYearMonth } from '../utils/formatters';
import { api, DatabaseStats } from '../api/client';

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  proratedRules: ProratedBudgetRule[];
  savingsGoals: SavingsGoal[];
  debts: DebtItem[];
  recurring: RecurringItem[];
  alerts: BudgetAlert[];
  unreadAlertCount: number;
  settings: UserSettings;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // SQLite Database Info
  dbStats: DatabaseStats | null;
  isDbSyncing: boolean;
  dbStatus: 'connected' | 'syncing' | 'offline';
  refreshFromDb: () => Promise<void>;

  // Transaction Actions (SQLite CRUD)
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importTransactions: (txs: Transaction[]) => Promise<void>;

  // Category Actions (SQLite CRUD)
  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Prorated Budget Rule Actions (SQLite CRUD)
  addProratedRule: (rule: Omit<ProratedBudgetRule, 'id'>) => Promise<ProratedBudgetRule>;
  updateProratedRule: (id: string, rule: Partial<ProratedBudgetRule>) => Promise<void>;
  deleteProratedRule: (id: string) => Promise<void>;

  // Savings Goal Actions (SQLite CRUD)
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsContribution: (goalId: string, amount: number, note?: string, type?: 'deposit' | 'withdrawal') => Promise<void>;

  // Debt Actions (SQLite CRUD)
  addDebt: (debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'>) => Promise<DebtItem>;
  updateDebt: (id: string, debt: Partial<DebtItem>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  recordDebtPayment: (debtId: string, amount: number, note?: string) => Promise<void>;

  // Recurring Actions (SQLite CRUD)
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => Promise<RecurringItem>;
  updateRecurringItem: (id: string, item: Partial<RecurringItem>) => Promise<void>;
  deleteRecurringItem: (id: string) => Promise<void>;
  applyRecurringForMonth: (month: string) => Promise<{ addedCount: number }>;

  // Alert Actions
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  clearAlerts: () => void;
  triggerTestNotification: (title?: string, message?: string) => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  resetAllDataToZero: () => Promise<void>;
  loadDemoDataset: () => Promise<void>;

  // Tags
  allTags: string[];
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = useMemo(() => getInitialSeedData(), []);

  const [transactions, setTransactions] = useState<Transaction[]>(seed.transactions);
  const [categories, setCategories] = useState<Category[]>(seed.categories);
  const [proratedRules, setProratedRules] = useState<ProratedBudgetRule[]>(seed.proratedRules);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(seed.savingsGoals);
  const [debts, setDebts] = useState<DebtItem[]>(seed.debts);
  const [recurring, setRecurring] = useState<RecurringItem[]>(seed.recurring);
  const [settings, setSettings] = useState<UserSettings>(seed.settings);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(seed.settings.selectedMonth || getCurrentYearMonth());

  // Database status states
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // Load all data from SQLite database on initial render
  const refreshFromDb = useCallback(async () => {
    setIsDbSyncing(true);
    try {
      const [
        txData,
        catData,
        rulesData,
        savingsData,
        debtsData,
        recData,
        settingsData,
        readAlertsData,
        statsData,
      ] = await Promise.all([
        api.getTransactions().catch(() => seed.transactions),
        api.getCategories().catch(() => seed.categories),
        api.getProratedRules().catch(() => seed.proratedRules),
        api.getSavingsGoals().catch(() => seed.savingsGoals),
        api.getDebts().catch(() => seed.debts),
        api.getRecurring().catch(() => seed.recurring),
        api.getSettings().catch(() => seed.settings),
        api.getReadAlerts().catch(() => []),
        api.getDbStats().catch(() => null),
      ]);

      setTransactions(txData);
      setCategories(catData);
      setProratedRules(rulesData);
      setSavingsGoals(savingsData);
      setDebts(debtsData);
      setRecurring(recData);
      setSettings(settingsData);
      setReadAlertIds(readAlertsData);
      if (settingsData.selectedMonth) {
        setSelectedMonth(settingsData.selectedMonth);
      }
      setDbStats(statsData);
      setDbStatus('connected');
    } catch (err) {
      console.warn('Could not sync with SQLite API, continuing with local state:', err);
      setDbStatus('offline');
    } finally {
      setIsDbSyncing(false);
    }
  }, [seed]);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Request browser notification permission if enabled
  useEffect(() => {
    if (settings.pushNotificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.pushNotificationsEnabled]);

  // Derive dynamic alerts based on live state
  const alerts: BudgetAlert[] = useMemo(() => {
    const rawAlerts = evaluateAllAlerts(
      transactions,
      categories,
      proratedRules,
      recurring,
      debts,
      savingsGoals,
      settings,
      selectedMonth
    );

    return rawAlerts.map((alert) => ({
      ...alert,
      read: readAlertIds.includes(alert.id),
    }));
  }, [
    transactions,
    categories,
    proratedRules,
    recurring,
    debts,
    savingsGoals,
    settings,
    selectedMonth,
    readAlertIds,
  ]);

  const unreadAlertCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  // All distinct tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transactions.forEach((t) => (t.tags || []).forEach((tag) => tagSet.add(tag)));
    recurring.forEach((r) => (r.tags || []).forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [transactions, recurring]);

  // ================= TRANSACTION CRUD =================
  const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const tempId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTx: Transaction = { ...tx, id: tempId };

    // Auto switch selectedMonth if adding transaction to a different month
    const txMonth = tx.date ? tx.date.substring(0, 7) : selectedMonth;
    if (txMonth && txMonth !== selectedMonth) {
      setSettings((prev) => ({ ...prev, selectedMonth: txMonth }));
      api.updateSettings({ selectedMonth: txMonth }).catch(() => {});
    }

    // Optimistic update
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to SQLite
    try {
      const created = await api.createTransaction(newTx);
      setTransactions((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error persisting transaction to SQLite:', e);
    }

    // Push notification check
    if (settings.pushNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const categoryObj = categories.find((c) => c.id === tx.category);
      if (tx.type === 'expense' && tx.amount > 50) {
        new Notification(`Logged Expense: ${tx.title}`, {
          body: `Spent ${settings.currency}${tx.amount.toFixed(2)} under ${categoryObj?.name || 'General'}.`,
        });
      }
    }

    return newTx;
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
    try {
      await api.updateTransaction(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating transaction in SQLite:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTransaction(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting transaction from SQLite:', e);
    }
  };

  const importTransactions = async (imported: Transaction[]) => {
    setTransactions((prev) => [...imported, ...prev]);
    try {
      await api.importTransactions(imported);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error importing transactions into SQLite:', e);
    }
  };

  // ================= CATEGORY CRUD =================
  const addCategory = async (cat: Omit<Category, 'id'>): Promise<Category> => {
    const tempId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCat: Category = { ...cat, id: tempId, isCustom: true };

    setCategories((prev) => [...prev, newCat]);
    try {
      const created = await api.createCategory(newCat);
      setCategories((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error creating category in SQLite:', e);
    }
    return newCat;
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    try {
      await api.updateCategory(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating category in SQLite:', e);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.deleteCategory(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting category from SQLite:', e);
    }
  };

  // ================= PRORATED BUDGET RULE CRUD =================
  const addProratedRule = async (rule: Omit<ProratedBudgetRule, 'id'>): Promise<ProratedBudgetRule> => {
    const tempId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newRule: ProratedBudgetRule = { ...rule, id: tempId };

    setProratedRules((prev) => [...prev, newRule]);
    try {
      const created = await api.createProratedRule(newRule);
      setProratedRules((prev) => prev.map((r) => (r.id === tempId ? created : r)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error creating prorated rule in SQLite:', e);
    }
    return newRule;
  };

  const updateProratedRule = async (id: string, updated: Partial<ProratedBudgetRule>) => {
    setProratedRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
    try {
      await api.updateProratedRule(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating prorated rule in SQLite:', e);
    }
  };

  const deleteProratedRule = async (id: string) => {
    setProratedRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await api.deleteProratedRule(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting prorated rule from SQLite:', e);
    }
  };

  // ================= SAVINGS GOAL CRUD & CONTRIBUTIONS =================
  const addSavingsGoal = async (
    goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>
  ): Promise<SavingsGoal> => {
    const tempId = `goal-${Date.now()}`;
    const newGoal: SavingsGoal = {
      ...goal,
      id: tempId,
      currentAmount: 0,
      history: [],
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    try {
      const created = await api.createSavingsGoal(newGoal);
      setSavingsGoals((prev) => prev.map((g) => (g.id === tempId ? created : g)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error creating savings goal in SQLite:', e);
    }
    return newGoal;
  };

  const updateSavingsGoal = async (id: string, updated: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
    );
    try {
      await api.updateSavingsGoal(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating savings goal in SQLite:', e);
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await api.deleteSavingsGoal(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting savings goal from SQLite:', e);
    }
  };

  const addSavingsContribution = async (
    goalId: string,
    amount: number,
    note?: string,
    type: 'deposit' | 'withdrawal' = 'deposit'
  ) => {
    const contributionAmount = type === 'deposit' ? Math.abs(amount) : -Math.abs(amount);

    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newBalance = Math.max(0, g.currentAmount + contributionAmount);
        const newHistoryItem = {
          id: `h-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: Math.abs(amount),
          note: note || (type === 'deposit' ? 'Added savings funds' : 'Withdrawn savings funds'),
          type,
        };
        return {
          ...g,
          currentAmount: newBalance,
          history: [newHistoryItem, ...(g.history || [])],
        };
      })
    );

    try {
      const updated = await api.addSavingsContribution(goalId, amount, note, type);
      setSavingsGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error recording contribution in SQLite:', e);
    }
  };

  // ================= DEBT CRUD & PAYMENTS =================
  const addDebt = async (
    debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'>
  ): Promise<DebtItem> => {
    const tempId = `debt-${Date.now()}`;
    const newDebt: DebtItem = {
      ...debt,
      id: tempId,
      remainingBalance: debt.totalPrincipal,
      payments: [],
    };
    setDebts((prev) => [...prev, newDebt]);
    try {
      const created = await api.createDebt(newDebt);
      setDebts((prev) => prev.map((d) => (d.id === tempId ? created : d)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error creating debt in SQLite:', e);
    }
    return newDebt;
  };

  const updateDebt = async (id: string, updated: Partial<DebtItem>) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
    );
    try {
      await api.updateDebt(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating debt in SQLite:', e);
    }
  };

  const deleteDebt = async (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.deleteDebt(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting debt from SQLite:', e);
    }
  };

  const recordDebtPayment = async (debtId: string, amount: number, note?: string) => {
    const payAmount = Math.abs(amount);
    let calculatedPrincipal = payAmount;
    let calculatedInterest = 0;

    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const monthlyInterest = (d.remainingBalance * (d.interestRate / 100)) / 12;
        calculatedInterest = Math.min(payAmount, monthlyInterest);
        calculatedPrincipal = Math.max(0, payAmount - calculatedInterest);
        const newBalance = Math.max(0, d.remainingBalance - calculatedPrincipal);

        const newPayment = {
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: payAmount,
          principalPaid: Number(calculatedPrincipal.toFixed(2)),
          interestPaid: Number(calculatedInterest.toFixed(2)),
          note: note || 'Monthly debt installment',
        };

        return {
          ...d,
          remainingBalance: Number(newBalance.toFixed(2)),
          payments: [newPayment, ...(d.payments || [])],
        };
      })
    );

    try {
      const updated = await api.recordDebtPayment(
        debtId,
        payAmount,
        Number(calculatedPrincipal.toFixed(2)),
        Number(calculatedInterest.toFixed(2)),
        note
      );
      setDebts((prev) => prev.map((d) => (d.id === debtId ? updated : d)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error recording debt payment in SQLite:', e);
    }
  };

  // ================= RECURRING CRUD & APPLY =================
  const addRecurringItem = async (item: Omit<RecurringItem, 'id'>): Promise<RecurringItem> => {
    const tempId = `rec-${Date.now()}`;
    const newItem: RecurringItem = { ...item, id: tempId };

    setRecurring((prev) => [...prev, newItem]);
    try {
      const created = await api.createRecurring(newItem);
      setRecurring((prev) => prev.map((r) => (r.id === tempId ? created : r)));
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error creating recurring item in SQLite:', e);
    }
    return newItem;
  };

  const updateRecurringItem = async (id: string, updated: Partial<RecurringItem>) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
    try {
      await api.updateRecurring(id, updated);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error updating recurring item in SQLite:', e);
    }
  };

  const deleteRecurringItem = async (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    try {
      await api.deleteRecurring(id);
      api.getDbStats().then(setDbStats).catch(() => {});
    } catch (e) {
      console.error('Error deleting recurring item from SQLite:', e);
    }
  };

  const applyRecurringForMonth = async (targetMonth: string): Promise<{ addedCount: number }> => {
    try {
      const res = await api.applyRecurringForMonth(targetMonth);
      await refreshFromDb();
      return { addedCount: res.addedCount };
    } catch (e) {
      console.error('Error applying recurring items in SQLite:', e);
      return { addedCount: 0 };
    }
  };

  // ================= ALERT ACTIONS =================
  const markAlertAsRead = (alertId: string) => {
    setReadAlertIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
    api.markAlertRead(alertId).catch(() => {});
  };

  const markAllAlertsAsRead = () => {
    const allIds = alerts.map((a) => a.id);
    setReadAlertIds(allIds);
    api.markAllAlertsRead(allIds).catch(() => {});
  };

  const clearAlerts = () => {
    const allIds = alerts.map((a) => a.id);
    setReadAlertIds(allIds);
    api.clearAllReadAlerts().catch(() => {});
  };

  const triggerTestNotification = (
    title = 'Budget Alert Notification',
    message = 'Your prorated daily limit on Snacks was exceeded by +$12.50 today.'
  ) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    }
  };

  // ================= SETTINGS & DB RESET =================
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
    } catch (e) {
      console.error('Error updating settings in SQLite:', e);
    }
  };

  const resetToDefaultData = async () => {
    try {
      await api.resetDbToZero();
      await refreshFromDb();
    } catch (e) {
      console.error('Error resetting SQLite db:', e);
      const fresh = getInitialSeedData();
      setTransactions(fresh.transactions);
      setCategories(fresh.categories);
      setProratedRules(fresh.proratedRules);
      setSavingsGoals(fresh.savingsGoals);
      setDebts(fresh.debts);
      setRecurring(fresh.recurring);
      setSettings(fresh.settings);
      setReadAlertIds([]);
      setSelectedMonth(fresh.settings.selectedMonth);
    }
  };

  const resetAllDataToZero = async () => {
    await resetToDefaultData();
  };

  const loadDemoDataset = async () => {
    try {
      await api.loadDemoData();
      await refreshFromDb();
    } catch (e) {
      console.error('Error loading demo data into SQLite:', e);
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        categories,
        proratedRules,
        savingsGoals,
        debts,
        recurring,
        alerts,
        unreadAlertCount,
        settings,
        selectedMonth,
        setSelectedMonth,
        dbStats,
        isDbSyncing,
        dbStatus,
        refreshFromDb,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
        addCategory,
        updateCategory,
        deleteCategory,
        addProratedRule,
        updateProratedRule,
        deleteProratedRule,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addSavingsContribution,
        addDebt,
        updateDebt,
        deleteDebt,
        recordDebtPayment,
        addRecurringItem,
        updateRecurringItem,
        deleteRecurringItem,
        applyRecurringForMonth,
        markAlertAsRead,
        markAllAlertsAsRead,
        clearAlerts,
        triggerTestNotification,
        updateSettings,
        resetToDefaultData,
        resetAllDataToZero,
        loadDemoDataset,
        allTags,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
