export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string; // Category ID
  date: string; // YYYY-MM-DD
  tags: string[];
  notes?: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  receiptUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon key
  color: string; // HEX color
  monthlyBudget: number; // 0 if none
  isCustom?: boolean;
}

export interface ProratedBudgetRule {
  id: string;
  name: string; // e.g. "Snacks", "Coffee & Drinks", "Dining Out", "Weekend Fun"
  categoryId?: string; // matched category or custom item
  targetTags?: string[]; // optional tag matcher
  monthlyMaxSpend: number; // e.g. 500
  month: string; // "YYYY-MM"
  rolloverEnabled: boolean; // Carry over surplus or deficit
  rolloverAmount: number; // amount from previous month
  alertThresholdPercent: number; // % to warn (e.g. 100% of daily limit)
  notes?: string;
}

export interface DailySpendRecord {
  day: number; // 1..31
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue...
  amountSpent: number;
  cumulativeSpent: number;
  dailyProratedLimit: number;
  cumulativeProratedLimit: number;
  isOverLimit: boolean;
  delta: number; // amountSpent - dailyProratedLimit
  transactions: Transaction[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  icon?: string;
  color?: string;
  category?: string;
  notes?: string;
  history: {
    id: string;
    date: string;
    amount: number;
    note?: string;
    type: 'deposit' | 'withdrawal';
  }[];
}

export interface DebtItem {
  id: string;
  name: string;
  lenderName?: string; // "From Who" (e.g., "HDFC Bank", "Friend - Rahul", "Uncle Ramesh")
  debtType?: 'borrowed' | 'lent'; // 'borrowed' (taken from someone) | 'lent' (given to someone)
  totalPrincipal: number;
  remainingBalance: number;
  interestRate: number; // Annual %
  minimumPayment: number;
  dueDay: number; // 1-31
  notes?: string;
  color?: string;
  payments: {
    id: string;
    date: string;
    amount: number;
    principalPaid: number;
    interestPaid: number;
    note?: string;
  }[];
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth: number; // 1-31
  autoApply: boolean;
  tags: string[];
  paymentMethod: PaymentMethod;
  lastAppliedMonth?: string; // YYYY-MM
  isActive: boolean;
}

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface BudgetAlert {
  id: string;
  type: 
    | 'daily_prorated_exceeded' 
    | 'monthly_budget_warning' 
    | 'monthly_budget_exceeded' 
    | 'bill_due' 
    | 'savings_milestone' 
    | 'rollover_applied';
  title: string;
  message: string;
  date: string; // ISO or YYYY-MM-DD
  severity: AlertSeverity;
  read: boolean;
  relatedItemId?: string;
  linkTab?: string;
}

export interface UserSettings {
  currency: string;
  currencyCode: string;
  pushNotificationsEnabled: boolean;
  dailyBudgetAlertThreshold: number; // e.g. 100%
  monthlyBudgetWarningThreshold: number; // e.g. 80%
  enableRolloverByDefault: boolean;
  selectedMonth: string; // "YYYY-MM"
  userName: string;
}
