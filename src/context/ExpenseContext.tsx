import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Transaction,
  Category,
  ProratedBudgetRule,
  SavingsGoal,
  SavingsHistoryItem,
  DebtItem,
  DebtPaymentItem,
  RecurringItem,
  UserSettings,
  NotificationAlert,
  AutoCloneServiceStatus,
} from '../types';
import { api } from '../api/client';
import { calculateProratedRule } from '../utils/budgetCalculations';

interface ExpenseContextType {
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  categories: Category[];
  proratedRules: ProratedBudgetRule[];
  savingsGoals: SavingsGoal[];
  debts: DebtItem[];
  recurringItems: RecurringItem[];
  settings: UserSettings;
  readAlertIds: string[];
  alerts: NotificationAlert[];
  unreadAlertCount: number;
  isLoading: boolean;
  error: string | null;
  dbStatus: any;

  refreshFromDb: () => Promise<void>;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkImportTransactions: (txs: Omit<Transaction, 'id'>[]) => Promise<void>;

  // Deleted Transactions
  restoreTransaction: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Categories
  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Prorated Rules
  addProratedRule: (rule: Omit<ProratedBudgetRule, 'id'>) => Promise<ProratedBudgetRule>;
  updateProratedRule: (id: string, rule: Partial<ProratedBudgetRule>) => Promise<void>;
  deleteProratedRule: (id: string) => Promise<void>;

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsContribution: (goalId: string, item: Omit<SavingsHistoryItem, 'id'>) => Promise<void>;

  // Debts
  addDebt: (debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'>) => Promise<DebtItem>;
  updateDebt: (id: string, debt: Partial<DebtItem>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  recordDebtPayment: (debtId: string, payment: Omit<DebtPaymentItem, 'id'>) => Promise<void>;

  // Recurring Items & Auto-Clone Service
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => Promise<RecurringItem>;
  updateRecurringItem: (id: string, item: Partial<RecurringItem>) => Promise<void>;
  deleteRecurringItem: (id: string) => Promise<void>;
  applyRecurringForMonth: (month?: string, forceAll?: boolean) => Promise<number>;
  autoCloneRecurringService: (targetMonth?: string, forceAll?: boolean) => Promise<{ addedCount: number; clonedTitles: string[] }>;
  toggleRecurringAutoApply: (id: string, autoApply?: boolean) => Promise<void>;
  autoCloneStatus: AutoCloneServiceStatus;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

  // Alerts
  markAlertRead: (id: string) => Promise<void>;
  markAllAlertsRead: () => Promise<void>;
  clearReadAlerts: () => Promise<void>;

  // Database actions
  resetToZero: (password?: string) => Promise<void>;
  resetAllDataToZero: (password?: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [proratedRules, setProratedRules] = useState<ProratedBudgetRule[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    currency: '₹',
    currencyCode: 'INR',
    pushNotificationsEnabled: true,
    dailyBudgetAlertThreshold: 100,
    monthlyBudgetWarningThreshold: 80,
    enableRolloverByDefault: true,
    selectedMonth: new Date().toISOString().slice(0, 7),
    userName: 'Financial Explorer',
  });
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const [autoCloneStatus, setAutoCloneStatus] = useState<AutoCloneServiceStatus>({
    lastRunMonth: '',
    lastRunTimestamp: null,
    lastClonedCount: 0,
    lastClonedTitles: [],
    isRunning: false,
    totalConfigured: 0,
    autoApplyEnabledCount: 0,
  });

  const [serviceAlerts, setServiceAlerts] = useState<NotificationAlert[]>([]);
  const hasInitializedAutoCloneRef = useRef(false);
  const lastAutoClonedMonthRef = useRef('');

  // Keep counts in autoCloneStatus in sync with recurringItems
  useEffect(() => {
    setAutoCloneStatus((prev) => ({
      ...prev,
      totalConfigured: recurringItems.length,
      autoApplyEnabledCount: recurringItems.filter((r) => r.autoApply !== false && r.isActive !== false).length,
    }));
  }, [recurringItems]);

  const refreshFromDb = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [txs, delTxs, cats, rules, goals, dbs, recs, sets, readIds, status] = await Promise.all([
        api.getTransactions().catch(() => []),
        api.getDeletedTransactions().catch(() => []),
        api.getCategories().catch(() => []),
        api.getProratedRules().catch(() => []),
        api.getSavingsGoals().catch(() => []),
        api.getDebts().catch(() => []),
        api.getRecurring().catch(() => []),
        api.getSettings().catch(() => ({
          currency: '₹',
          currencyCode: 'INR',
          pushNotificationsEnabled: true,
          dailyBudgetAlertThreshold: 100,
          monthlyBudgetWarningThreshold: 80,
          enableRolloverByDefault: true,
          selectedMonth: new Date().toISOString().slice(0, 7),
          userName: 'Financial Explorer',
        })),
        api.getReadAlerts().catch(() => []),
        api.getDbStatus().catch(() => null),
      ]);

      setTransactions(txs);
      setDeletedTransactions(delTxs);
      setCategories(cats);
      setProratedRules(rules);
      setSavingsGoals(goals);
      setDebts(dbs);
      setRecurringItems(recs);
      setSettings(sets);
      setReadAlertIds(readIds);
      setDbStatus(status);
    } catch (err: any) {
      console.error('Error refreshing from SQLite DB:', err);
      setError(err.message || 'Failed to sync with local database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Derived Alerts
  const alerts = useMemo<NotificationAlert[]>(() => {
    const list: NotificationAlert[] = [];
    const targetDate = new Date();
    const currentMonth = settings.selectedMonth || new Date().toISOString().slice(0, 7);

    // Prorated rules alerts
    for (const rule of proratedRules) {
      if (rule.month && rule.month !== currentMonth) continue;
      const calc = calculateProratedRule(rule, transactions, targetDate);

      if (calc.status === 'overspent') {
        list.push({
          id: `alert-rule-over-${rule.id}`,
          title: `Over Budget: ${rule.name}`,
          message: `You exceeded the monthly budget limit by ${settings.currency}${calc.isOverBudget.toFixed(2)}.`,
          type: 'danger',
          date: new Date().toISOString().slice(0, 10),
          isRead: readAlertIds.includes(`alert-rule-over-${rule.id}`),
        });
      } else if (calc.status === 'danger') {
        list.push({
          id: `alert-rule-danger-${rule.id}`,
          title: `Budget Alert: ${rule.name}`,
          message: `You reached ${calc.percentSpent.toFixed(0)}% of your limit (${settings.currency}${calc.totalSpent.toFixed(2)} / ${settings.currency}${calc.effectiveBudget.toFixed(2)}).`,
          type: 'warning',
          date: new Date().toISOString().slice(0, 10),
          isRead: readAlertIds.includes(`alert-rule-danger-${rule.id}`),
        });
      }
    }

    // Category monthly budget alerts (excluding isolated prorated rule spends)
    const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth) && !t.proratedRuleId);
    const catSpentMap: Record<string, number> = {};
    for (const tx of monthlyExpenses) {
      catSpentMap[tx.category] = (catSpentMap[tx.category] || 0) + tx.amount;
    }

    for (const cat of categories) {
      if (cat.monthlyBudget && cat.monthlyBudget > 0) {
        const spent = catSpentMap[cat.id] || 0;
        const pct = (spent / cat.monthlyBudget) * 100;
        if (pct >= settings.monthlyBudgetWarningThreshold) {
          const alertId = `alert-cat-${cat.id}-${currentMonth}`;
          list.push({
            id: alertId,
            title: pct >= 100 ? `Category Overbudget: ${cat.name}` : `Category Warning: ${cat.name}`,
            message: `Spent ${settings.currency}${spent.toFixed(2)} of ${settings.currency}${cat.monthlyBudget.toFixed(2)} (${pct.toFixed(0)}%).`,
            type: pct >= 100 ? 'danger' : 'warning',
            date: new Date().toISOString().slice(0, 10),
            category: cat.name,
            isRead: readAlertIds.includes(alertId),
          });
        }
      }
    }

    // Debt due date alerts
    const currentDay = targetDate.getDate();
    for (const debt of debts) {
      if (debt.remainingBalance > 0 && debt.dueDay) {
        const daysUntilDue = debt.dueDay - currentDay;
        if (daysUntilDue >= 0 && daysUntilDue <= 3) {
          const alertId = `alert-debt-due-${debt.id}-${currentMonth}`;
          list.push({
            id: alertId,
            title: `Payment Due Soon: ${debt.name}`,
            message: `Payment of ${settings.currency}${debt.minimumPayment} is due in ${daysUntilDue === 0 ? 'today' : `${daysUntilDue} day(s)`}.`,
            type: 'info',
            date: new Date().toISOString().slice(0, 10),
            isRead: readAlertIds.includes(alertId),
          });
        }
      }
    }

    // Include auto-clone service notifications
    for (const sAlert of serviceAlerts) {
      list.push({
        ...sAlert,
        isRead: readAlertIds.includes(sAlert.id),
      });
    }

    return list;
  }, [proratedRules, transactions, categories, debts, settings, readAlertIds, serviceAlerts]);

  const unreadAlertCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  // Actions
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const created = await api.createTransaction(tx);
    setTransactions((prev) => [created, ...prev]);
    return created;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, updates);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (tx) {
      setDeletedTransactions((prev) => [tx, ...prev]);
    }
  };

  const bulkImportTransactions = async (txs: Omit<Transaction, 'id'>[]) => {
    const res = await api.bulkImportTransactions(txs);
    if (res.transactions) {
      setTransactions((prev) => [...res.transactions, ...prev]);
    }
  };

  const restoreTransaction = async (id: string) => {
    const res = await api.restoreDeletedTransaction(id);
    if (res.restored) {
      setDeletedTransactions((prev) => prev.filter((t) => t.id !== id));
      setTransactions((prev) => [res.restored, ...prev]);
    }
  };

  const emptyTrash = async () => {
    await api.emptyTrash();
    setDeletedTransactions([]);
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const created = await api.createCategory(cat);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await api.updateCategory(id, updates);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const deleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addProratedRule = async (rule: Omit<ProratedBudgetRule, 'id'>) => {
    const created = await api.createProratedRule(rule);
    setProratedRules((prev) => [...prev, created]);
    return created;
  };

  const updateProratedRule = async (id: string, updates: Partial<ProratedBudgetRule>) => {
    const updated = await api.updateProratedRule(id, updates);
    setProratedRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteProratedRule = async (id: string) => {
    await api.deleteProratedRule(id);
    setProratedRules((prev) => prev.filter((r) => r.id !== id));
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => {
    const created = await api.createSavingsGoal(goal);
    setSavingsGoals((prev) => [...prev, created]);
    return created;
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    const updated = await api.updateSavingsGoal(id, updates);
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const deleteSavingsGoal = async (id: string) => {
    await api.deleteSavingsGoal(id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addSavingsContribution = async (goalId: string, item: Omit<SavingsHistoryItem, 'id'>) => {
    const updated = await api.addSavingsContribution(goalId, item);
    setSavingsGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
  };

  const addDebt = async (debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'>) => {
    const created = await api.createDebt(debt);
    setDebts((prev) => [...prev, created]);
    return created;
  };

  const updateDebt = async (id: string, updates: Partial<DebtItem>) => {
    const updated = await api.updateDebt(id, updates);
    setDebts((prev) => prev.map((d) => (d.id === id ? updated : d)));
  };

  const deleteDebt = async (id: string) => {
    await api.deleteDebt(id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const recordDebtPayment = async (debtId: string, payment: Omit<DebtPaymentItem, 'id'>) => {
    const updated = await api.recordDebtPayment(debtId, payment);
    setDebts((prev) => prev.map((d) => (d.id === debtId ? updated : d)));
  };

  const addRecurringItem = async (item: Omit<RecurringItem, 'id'>) => {
    const created = await api.createRecurring(item);
    setRecurringItems((prev) => [...prev, created]);
    return created;
  };

  const updateRecurringItem = async (id: string, updates: Partial<RecurringItem>) => {
    const updated = await api.updateRecurring(id, updates);
    setRecurringItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteRecurringItem = async (id: string) => {
    await api.deleteRecurring(id);
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleRecurringAutoApply = async (id: string, autoApply?: boolean) => {
    const item = recurringItems.find((r) => r.id === id);
    if (!item) return;
    const newSetting = autoApply !== undefined ? autoApply : !item.autoApply;
    await updateRecurringItem(id, { autoApply: newSetting });
  };

  const autoCloneRecurringService = useCallback(
    async (targetMonth?: string, forceAll?: boolean) => {
      const month = targetMonth || new Date().toISOString().slice(0, 7);
      setAutoCloneStatus((prev) => ({ ...prev, isRunning: true }));
      try {
        const res = await api.applyRecurringItems(month, forceAll);
        lastAutoClonedMonthRef.current = month;
        if (res.addedCount > 0) {
          const [updatedTxs, updatedRecs] = await Promise.all([
            api.getTransactions().catch(() => []),
            api.getRecurring().catch(() => []),
          ]);
          setTransactions(updatedTxs);
          setRecurringItems(updatedRecs);

          const alertId = `alert-autoclone-${month}-${Date.now()}`;
          const newAlert: NotificationAlert = {
            id: alertId,
            title: `Auto-Cloned Recurring (${month})`,
            message: `Auto-clone service cloned ${res.addedCount} recurring item(s) for ${month}: ${res.clonedTitles?.join(', ') || ''}.`,
            type: 'success',
            date: new Date().toISOString().slice(0, 10),
            isRead: false,
          };
          setServiceAlerts((prev) => [newAlert, ...prev]);
        }

        setAutoCloneStatus((prev) => ({
          ...prev,
          lastRunMonth: month,
          lastRunTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastClonedCount: res.addedCount,
          lastClonedTitles: res.clonedTitles || [],
          isRunning: false,
          totalConfigured: recurringItems.length,
          autoApplyEnabledCount: recurringItems.filter((r) => r.autoApply !== false && r.isActive !== false).length,
        }));

        return { addedCount: res.addedCount, clonedTitles: res.clonedTitles || [] };
      } catch (err: any) {
        console.error('Failed to execute auto-clone recurring service:', err);
        setAutoCloneStatus((prev) => ({ ...prev, isRunning: false }));
        return { addedCount: 0, clonedTitles: [] };
      }
    },
    [recurringItems]
  );

  const applyRecurringForMonth = async (month?: string, forceAll?: boolean) => {
    const res = await api.applyRecurringItems(month, forceAll);
    await refreshFromDb();
    return res.addedCount;
  };

  // Service Lifecycle Hook 1: Automatically clone recurring transactions on initial load at start of month
  useEffect(() => {
    if (!isLoading && !hasInitializedAutoCloneRef.current) {
      hasInitializedAutoCloneRef.current = true;
      const currentMonth = new Date().toISOString().slice(0, 7);
      autoCloneRecurringService(currentMonth, false);
    }
  }, [isLoading, autoCloneRecurringService]);

  // Service Lifecycle Hook 2: Monitor for month rollover (runs periodically & on window visibility change)
  useEffect(() => {
    const checkMonthTransition = () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (lastAutoClonedMonthRef.current && lastAutoClonedMonthRef.current !== currentMonth) {
        console.log(`[AutoCloneService] Calendar month rollover detected: ${lastAutoClonedMonthRef.current} -> ${currentMonth}`);
        autoCloneRecurringService(currentMonth, false);
      }
    };

    const interval = setInterval(checkMonthTransition, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMonthTransition();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autoCloneRecurringService]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const updated = await api.updateSettings(updates);
    setSettings(updated);
  };

  const markAlertRead = async (id: string) => {
    await api.markAlertRead(id);
    setReadAlertIds((prev) => [...prev, id]);
  };

  const markAllAlertsRead = async () => {
    const allIds = alerts.map((a) => a.id);
    await api.markAllAlertsRead(allIds);
    setReadAlertIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const clearReadAlerts = async () => {
    await api.clearReadAlerts();
    setReadAlertIds([]);
  };

  const resetToZero = async (password?: string) => {
    await api.resetToZero(password);
    await refreshFromDb();
  };

  const resetAllDataToZero = async (password?: string) => {
    await api.resetToZero(password);
    await refreshFromDb();
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        deletedTransactions,
        categories,
        proratedRules,
        savingsGoals,
        debts,
        recurringItems,
        settings,
        readAlertIds,
        alerts,
        unreadAlertCount,
        isLoading,
        error,
        dbStatus,
        refreshFromDb,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkImportTransactions,
        restoreTransaction,
        emptyTrash,
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
        autoCloneRecurringService,
        toggleRecurringAutoApply,
        autoCloneStatus,
        updateSettings,
        markAlertRead,
        markAllAlertsRead,
        clearReadAlerts,
        resetToZero,
        resetAllDataToZero,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
