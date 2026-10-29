export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'other';

export type SpendNature = 'need' | 'want';

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
  proratedRuleId?: string;
  nature?: SpendNature;
  amortizationMonths?: number;
  transferFrom?: string;
  transferTo?: string;
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

export interface ProratedSpend {
  id: string;
  ruleId: string;
  title: string;
  amount: number;
  date: string;
  notes?: string;
  addToMainTransactions?: boolean;
  created_at?: string;
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

export interface GulakEntry {
  id: string;
  potId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  title: string;
  date: string;
  notes?: string;
  breakdown?: Record<string, number>;
  created_at?: string;
}

export interface GulakPot {
  id: string;
  name: string;
  targetAmount?: number;
  currentBalance: number;
  icon?: string;
  color?: string;
  notes?: string;
  isLocked?: boolean;
  lockUntilDate?: string;
  created_at?: string;
  entries?: GulakEntry[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'transactions'
  | 'prorated'
  | 'budgets'
  | 'savings_debt'
  | 'gulak'
  | 'reports'
  | 'categories'
  | 'trash';

export interface QuickPresetChip {
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  nature: SpendNature;
  icon?: string;
  tags?: string[];
  notes?: string;
}

export interface SafeDailySpendSummary {
  totalSalary: number;
  totalFixedCosts: number;
  discretionarySpentSoFar: number;
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  spentToday: number;
  baseDailyAllowance: number;
  dynamicDailySafeSpend: number;
  remainingSafeSpendToday: number;
  tomorrowProjectedAllowance: number;
  leftoverSpareChange: number;
}

export interface PantryStapleItem {
  id: string;
  title: string;
  totalAmount: number;
  amortizationMonths: number;
  monthlyCost: number;
  purchaseDate: string;
  expectedRefillDate: string;
  daysRemaining: number;
  status: 'fresh' | 'halfway' | 'refill_soon' | 'depleted';
  category: string;
}

export interface NeedsWantsSummary {
  needsTotal: number;
  wantsTotal: number;
  totalDiscretionary: number;
  wantsPercentage: number;
  needsPercentage: number;
  needsCount?: number;
  wantsCount?: number;
  topWants?: Transaction[];
  wantsCategoryBreakdown?: Array<{
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
    percentage: number;
  }>;
}

export interface CreditCardReconciliationSummary {
  totalUnbilledSwipes: number;
  totalPaymentsMade: number;
  netOutstanding: number;
  dueDay: number;
  nextDueDate: string;
  unbilledTransactions: Transaction[];
}
