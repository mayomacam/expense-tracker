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
} from '../types';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Database status and reset
  getDbStatus: () => fetch('/api/db/status').then(handleResponse<{ success: boolean; engine: string; databaseFile: string; fileSizeKb: number; tables: Record<string, number>; status: string; lastSync: string }>),
  resetDatabase: () => fetch('/api/db/reset', { method: 'POST' }).then(handleResponse<{ success: boolean; message: string }>),
  resetToZero: () => fetch('/api/db/reset-to-zero', { method: 'POST' }).then(handleResponse<{ success: boolean; message: string }>),
  loadDemoData: () => fetch('/api/db/load-demo', { method: 'POST' }).then(handleResponse<{ success: boolean; message: string }>),

  // Transactions
  getTransactions: () => fetch('/api/transactions').then(handleResponse<Transaction[]>),
  createTransaction: (tx: Omit<Transaction, 'id'>) =>
    fetch('/api/transactions', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(tx) }).then(handleResponse<Transaction>),
  updateTransaction: (id: string, updates: Partial<Transaction>) =>
    fetch(`/api/transactions/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<Transaction>),
  deleteTransaction: (id: string) =>
    fetch(`/api/transactions/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),
  bulkImportTransactions: (transactions: Omit<Transaction, 'id'>[]) =>
    fetch('/api/transactions/import', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ transactions }) }).then(handleResponse<{ success: boolean; count: number; transactions: Transaction[] }>),

  // Deleted Transactions (Trash)
  getDeletedTransactions: () => fetch('/api/deleted-transactions').then(handleResponse<Transaction[]>),
  restoreDeletedTransaction: (id: string) =>
    fetch(`/api/deleted-transactions/${id}/restore`, { method: 'POST' }).then(handleResponse<{ success: boolean; restored: Transaction }>),
  emptyTrash: () =>
    fetch('/api/deleted-transactions', { method: 'DELETE' }).then(handleResponse<{ success: boolean; message: string }>),

  // Categories
  getCategories: () => fetch('/api/categories').then(handleResponse<Category[]>),
  createCategory: (cat: Omit<Category, 'id'>) =>
    fetch('/api/categories', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(cat) }).then(handleResponse<Category>),
  updateCategory: (id: string, updates: Partial<Category>) =>
    fetch(`/api/categories/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<Category>),
  deleteCategory: (id: string) =>
    fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),

  // Prorated Budget Rules
  getProratedRules: () => fetch('/api/prorated-rules').then(handleResponse<ProratedBudgetRule[]>),
  createProratedRule: (rule: Omit<ProratedBudgetRule, 'id'>) =>
    fetch('/api/prorated-rules', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(rule) }).then(handleResponse<ProratedBudgetRule>),
  updateProratedRule: (id: string, updates: Partial<ProratedBudgetRule>) =>
    fetch(`/api/prorated-rules/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<ProratedBudgetRule>),
  deleteProratedRule: (id: string) =>
    fetch(`/api/prorated-rules/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),

  // Savings Goals
  getSavingsGoals: () => fetch('/api/savings-goals').then(handleResponse<SavingsGoal[]>),
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) =>
    fetch('/api/savings-goals', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(goal) }).then(handleResponse<SavingsGoal>),
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) =>
    fetch(`/api/savings-goals/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<SavingsGoal>),
  deleteSavingsGoal: (id: string) =>
    fetch(`/api/savings-goals/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),
  addSavingsContribution: (goalId: string, item: Omit<SavingsHistoryItem, 'id'>) =>
    fetch(`/api/savings-goals/${goalId}/contributions`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(item) }).then(handleResponse<SavingsGoal>),

  // Debts
  getDebts: () => fetch('/api/debts').then(handleResponse<DebtItem[]>),
  createDebt: (debt: Omit<DebtItem, 'id' | 'remainingBalance' | 'payments'>) =>
    fetch('/api/debts', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(debt) }).then(handleResponse<DebtItem>),
  updateDebt: (id: string, updates: Partial<DebtItem>) =>
    fetch(`/api/debts/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<DebtItem>),
  deleteDebt: (id: string) =>
    fetch(`/api/debts/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),
  recordDebtPayment: (debtId: string, payment: Omit<DebtPaymentItem, 'id'>) =>
    fetch(`/api/debts/${debtId}/payments`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payment) }).then(handleResponse<DebtItem>),

  // Recurring Items
  getRecurring: () => fetch('/api/recurring').then(handleResponse<RecurringItem[]>),
  createRecurring: (item: Omit<RecurringItem, 'id'>) =>
    fetch('/api/recurring', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(item) }).then(handleResponse<RecurringItem>),
  updateRecurring: (id: string, updates: Partial<RecurringItem>) =>
    fetch(`/api/recurring/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<RecurringItem>),
  deleteRecurring: (id: string) =>
    fetch(`/api/recurring/${id}`, { method: 'DELETE' }).then(handleResponse<{ success: boolean; id: string }>),
  applyRecurringItems: (month?: string) =>
    fetch('/api/recurring/apply', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ month }) }).then(handleResponse<{ success: boolean; addedCount: number; month: string }>),

  // Settings
  getSettings: () => fetch('/api/settings').then(handleResponse<UserSettings>),
  updateSettings: (updates: Partial<UserSettings>) =>
    fetch('/api/settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(updates) }).then(handleResponse<UserSettings>),

  // Alerts Read State
  getReadAlerts: () => fetch('/api/alerts/read').then(handleResponse<string[]>),
  markAlertRead: (alertId: string) =>
    fetch('/api/alerts/read', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ alertId }) }).then(handleResponse<{ success: boolean }>),
  markAllAlertsRead: (alertIds: string[]) =>
    fetch('/api/alerts/read/all', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ alertIds }) }).then(handleResponse<{ success: boolean }>),
  clearReadAlerts: () =>
    fetch('/api/alerts/read', { method: 'DELETE' }).then(handleResponse<{ success: boolean }>),
};
