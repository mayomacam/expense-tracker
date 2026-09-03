export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  tags: string[];
  notes?: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurringFrequency?: string;
  receiptUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  isCustom?: boolean;
}

export interface ProratedBudgetRule {
  id: string;
  name: string;
  categoryId?: string;
  targetTags: string[];
  monthlyMaxSpend: number;
  month: string;
  rolloverEnabled: boolean;
  rolloverAmount: number;
  alertThresholdPercent: number;
  notes?: string;
}

export interface SavingsHistoryItem {
  id: string;
  goalId?: string;
  date: string;
  amount: number;
  note?: string;
  type: 'deposit' | 'withdraw';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon?: string;
  color?: string;
  category?: string;
  notes?: string;
  history?: SavingsHistoryItem[];
}

export interface DebtPaymentItem {
  id: string;
  debtId?: string;
  date: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  note?: string;
}

export interface DebtItem {
  id: string;
  name: string;
  lenderName?: string;
  debtType: 'borrowed' | 'lent' | 'credit_card' | 'loan' | 'mortgage' | 'other';
  totalPrincipal: number;
  remainingBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDay: number;
  notes?: string;
  color?: string;
  payments?: DebtPaymentItem[];
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth: number;
  autoApply: boolean;
  tags: string[];
  paymentMethod: PaymentMethod;
  lastAppliedMonth?: string;
  isActive: boolean;
}

export interface AutoCloneServiceStatus {
  lastRunMonth: string;
  lastRunTimestamp: string | null;
  lastClonedCount: number;
  lastClonedTitles: string[];
  isRunning: boolean;
  totalConfigured: number;
  autoApplyEnabledCount: number;
}

export interface UserSettings {
  id?: string;
  currency: string;
  currencyCode: string;
  pushNotificationsEnabled: boolean;
  dailyBudgetAlertThreshold: number;
  monthlyBudgetWarningThreshold: number;
  enableRolloverByDefault: boolean;
  selectedMonth: string;
  userName: string;
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  date: string;
  category?: string;
  isRead: boolean;
}

export type ActiveTab = 
  | 'dashboard'
  | 'transactions'
  | 'prorated'
  | 'budgets'
  | 'savings_debt'
  | 'reports'
  | 'categories'
  | 'trash';
