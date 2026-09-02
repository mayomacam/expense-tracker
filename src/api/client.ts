import {
  Transaction,
  Category,
  ProratedBudgetRule,
  SavingsGoal,
  DebtItem,
  RecurringItem,
  UserSettings,
} from '../types';

export interface DatabaseStats {
  engine: string;
  databaseFile: string;
  fileSizeKb: number;
  tables: {
    transactions: number;
    categories: number;
    prorated_rules: number;
    savings_goals: number;
    debts: number;
    recurring_items: number;
  };
  status: string;
  lastSync: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // DB status & operations
  getDbStats: () => request<DatabaseStats>('/api/db/status'),
  resetDb: () => request<{ success: boolean; message: string }>('/api/db/reset', { method: 'POST' }),
  resetDbToZero: () => request<{ success: boolean; message: string }>('/api/db/reset-to-zero', { method: 'POST' }),
  loadDemoData: () => request<{ success: boolean; message: string }>('/api/db/load-demo', { method: 'POST' }),

  // Transactions
  getTransactions: () => request<Transaction[]>('/api/transactions'),
  getTransaction: (id: string) => request<Transaction>(`/api/transactions/${id}`),
  createTransaction: (tx: Omit<Transaction, 'id'> & { id?: string }) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(tx) }),
  updateTransaction: (id: string, updates: Partial<Transaction>) =>
    request<Transaction>(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteTransaction: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/transactions/${id}`, { method: 'DELETE' }),
  importTransactions: (transactions: Transaction[]) =>
    request<{ success: boolean; count: number; transactions: Transaction[] }>('/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    }),

  // Categories
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (cat: Omit<Category, 'id'> & { id?: string }) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (id: string, updates: Partial<Category>) =>
    request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteCategory: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Prorated Budget Rules
  getProratedRules: () => request<ProratedBudgetRule[]>('/api/prorated-rules'),
  createProratedRule: (rule: Omit<ProratedBudgetRule, 'id'> & { id?: string }) =>
    request<ProratedBudgetRule>('/api/prorated-rules', { method: 'POST', body: JSON.stringify(rule) }),
  updateProratedRule: (id: string, updates: Partial<ProratedBudgetRule>) =>
    request<ProratedBudgetRule>(`/api/prorated-rules/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteProratedRule: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/prorated-rules/${id}`, { method: 'DELETE' }),

  // Savings Goals
  getSavingsGoals: () => request<SavingsGoal[]>('/api/savings-goals'),
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'> & { id?: string; currentAmount?: number }) =>
    request<SavingsGoal>('/api/savings-goals', { method: 'POST', body: JSON.stringify(goal) }),
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) =>
    request<SavingsGoal>(`/api/savings-goals/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteSavingsGoal: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/savings-goals/${id}`, { method: 'DELETE' }),
  addSavingsContribution: (goalId: string, amount: number, note?: string, type: 'deposit' | 'withdrawal' = 'deposit') =>
    request<SavingsGoal>(`/api/savings-goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify({ amount, note, type }),
    }),

  // Debts
  getDebts: () => request<DebtItem[]>('/api/debts'),
  createDebt: (debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'> & { id?: string; remainingBalance?: number }) =>
    request<DebtItem>('/api/debts', { method: 'POST', body: JSON.stringify(debt) }),
  updateDebt: (id: string, updates: Partial<DebtItem>) =>
    request<DebtItem>(`/api/debts/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteDebt: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/debts/${id}`, { method: 'DELETE' }),
  recordDebtPayment: (debtId: string, amount: number, principalPaid?: number, interestPaid?: number, note?: string) =>
    request<DebtItem>(`/api/debts/${debtId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amount, principalPaid, interestPaid, note }),
    }),

  // Recurring Items
  getRecurring: () => request<RecurringItem[]>('/api/recurring'),
  createRecurring: (item: Omit<RecurringItem, 'id'> & { id?: string }) =>
    request<RecurringItem>('/api/recurring', { method: 'POST', body: JSON.stringify(item) }),
  updateRecurring: (id: string, updates: Partial<RecurringItem>) =>
    request<RecurringItem>(`/api/recurring/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteRecurring: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/recurring/${id}`, { method: 'DELETE' }),
  applyRecurringForMonth: (month: string) =>
    request<{ success: boolean; addedCount: number; month: string }>('/api/recurring/apply', {
      method: 'POST',
      body: JSON.stringify({ month }),
    }),

  // Settings
  getSettings: () => request<UserSettings>('/api/settings'),
  updateSettings: (updates: Partial<UserSettings>) =>
    request<UserSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(updates) }),

  // Read Alerts
  getReadAlerts: () => request<string[]>('/api/alerts/read'),
  markAlertRead: (alertId: string) =>
    request<{ success: boolean }>('/api/alerts/read', { method: 'POST', body: JSON.stringify({ alertId }) }),
  markAllAlertsRead: (alertIds: string[]) =>
    request<{ success: boolean }>('/api/alerts/read/all', { method: 'POST', body: JSON.stringify({ alertIds }) }),
  clearAllReadAlerts: () =>
    request<{ success: boolean }>('/api/alerts/read', { method: 'DELETE' }),
};
