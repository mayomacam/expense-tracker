import {
  Category,
  Transaction,
  ProratedBudgetRule,
  SavingsGoal,
  DebtItem,
  RecurringItem,
  UserSettings,
} from '../types';
import { getCurrentYearMonth } from '../utils/formatters';

/**
 * Standard default categories initialized with ₹0.00 monthly budget.
 * Users can customize budgets, names, icons, and colors as needed.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-snacks', name: 'Snacks & Bites', icon: 'Cookie', color: '#F59E0B', monthlyBudget: 0, isCustom: true },
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#10B981', monthlyBudget: 0 },
  { id: 'cat-dining', name: 'Dining Out & Cafes', icon: 'Utensils', color: '#EC4899', monthlyBudget: 0 },
  { id: 'cat-housing', name: 'Rent & Housing', icon: 'Home', color: '#6366F1', monthlyBudget: 0 },
  { id: 'cat-utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#3B82F6', monthlyBudget: 0 },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#8B5CF6', monthlyBudget: 0 },
  { id: 'cat-entertainment', name: 'Entertainment & Subs', icon: 'Tv', color: '#06B6D4', monthlyBudget: 0 },
  { id: 'cat-shopping', name: 'Shopping & Gear', icon: 'Tag', color: '#F43F5E', monthlyBudget: 0 },
  { id: 'cat-health', name: 'Health & Fitness', icon: 'HeartPulse', color: '#14B8A6', monthlyBudget: 0 },
  { id: 'cat-salary', name: 'Salary & Wages', icon: 'Banknote', color: '#22C55E', monthlyBudget: 0 },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', icon: 'Laptop', color: '#EAB308', monthlyBudget: 0 },
  { id: 'cat-investments', name: 'Investments / Returns', icon: 'TrendingUp', color: '#3B82F6', monthlyBudget: 0 },
];

/**
 * Clean initial state with all fake data reset to zero.
 * All transactions, debts, savings, recurring items, and prorated rules start at zero.
 */
export function getInitialSeedData() {
  const currentMonth = getCurrentYearMonth(); // e.g. "2026-09"

  const initialProratedRules: ProratedBudgetRule[] = [];
  const initialTransactions: Transaction[] = [];
  const initialSavingsGoals: SavingsGoal[] = [];
  const initialDebts: DebtItem[] = [];
  const initialRecurring: RecurringItem[] = [];

  const initialSettings: UserSettings = {
    currency: '₹',
    currencyCode: 'INR',
    pushNotificationsEnabled: true,
    dailyBudgetAlertThreshold: 100,
    monthlyBudgetWarningThreshold: 80,
    enableRolloverByDefault: true,
    selectedMonth: currentMonth,
    userName: 'Financial Explorer',
  };

  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, monthlyBudget: 0 })),
    transactions: initialTransactions,
    proratedRules: initialProratedRules,
    savingsGoals: initialSavingsGoals,
    debts: initialDebts,
    recurring: initialRecurring,
    settings: initialSettings,
  };
}

/**
 * Returns clean zero-data state helper
 */
export function getZeroInitialData() {
  return getInitialSeedData();
}

/**
 * Optional demo dataset generator for manual reference if needed.
 */
export function getDemoSeedData() {
  const currentMonth = getCurrentYearMonth();
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const makeDate = (day: number) => {
    const dStr = String(day).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dStr}`;
  };

  const demoCategories: Category[] = [
    { id: 'cat-snacks', name: 'Snacks & Bites', icon: 'Cookie', color: '#F59E0B', monthlyBudget: 500, isCustom: true },
    { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#10B981', monthlyBudget: 600 },
    { id: 'cat-dining', name: 'Dining Out & Cafes', icon: 'Utensils', color: '#EC4899', monthlyBudget: 350 },
    { id: 'cat-housing', name: 'Rent & Housing', icon: 'Home', color: '#6366F1', monthlyBudget: 1500 },
    { id: 'cat-utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#3B82F6', monthlyBudget: 220 },
    { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#8B5CF6', monthlyBudget: 200 },
    { id: 'cat-entertainment', name: 'Entertainment & Subs', icon: 'Tv', color: '#06B6D4', monthlyBudget: 120 },
    { id: 'cat-shopping', name: 'Shopping & Gear', icon: 'Tag', color: '#F43F5E', monthlyBudget: 250 },
    { id: 'cat-health', name: 'Health & Fitness', icon: 'HeartPulse', color: '#14B8A6', monthlyBudget: 100 },
    { id: 'cat-salary', name: 'Salary & Wages', icon: 'Banknote', color: '#22C55E', monthlyBudget: 0 },
    { id: 'cat-freelance', name: 'Freelance & Side Gig', icon: 'Laptop', color: '#EAB308', monthlyBudget: 0 },
    { id: 'cat-investments', name: 'Investments / Returns', icon: 'TrendingUp', color: '#3B82F6', monthlyBudget: 0 },
  ];

  const demoRules: ProratedBudgetRule[] = [
    {
      id: 'rule-snacks-500',
      name: 'Snacks & Treats',
      categoryId: 'cat-snacks',
      targetTags: ['snacks', 'candy', 'coffee_break', 'chips'],
      monthlyMaxSpend: 500,
      month: currentMonth,
      rolloverEnabled: true,
      rolloverAmount: 35.0,
      alertThresholdPercent: 100,
      notes: 'Max 500/mo divided across days in month with daily prorated overspend warnings.',
    },
    {
      id: 'rule-dining-350',
      name: 'Dining & Takeout',
      categoryId: 'cat-dining',
      targetTags: ['dining', 'takeout', 'restaurant'],
      monthlyMaxSpend: 350,
      month: currentMonth,
      rolloverEnabled: false,
      rolloverAmount: 0,
      alertThresholdPercent: 100,
      notes: 'Prorated daily allowance for eating out at restaurants.',
    },
  ];

  const demoTransactions: Transaction[] = [
    {
      id: 'tx-inc-1',
      title: 'Primary Tech Salary',
      amount: 4500,
      type: 'income',
      category: 'cat-salary',
      date: makeDate(1),
      tags: ['salary', 'direct_deposit'],
      paymentMethod: 'bank_transfer',
      isRecurring: true,
      notes: 'Monthly direct deposit payout',
    },
    {
      id: 'tx-inc-2',
      title: 'UI Design Client Project',
      amount: 850,
      type: 'income',
      category: 'cat-freelance',
      date: makeDate(5),
      tags: ['freelance', 'side_gig'],
      paymentMethod: 'digital_wallet',
      notes: 'Website landing page redesign completion',
    },
    {
      id: 'tx-exp-rent',
      title: 'Apartment Monthly Rent',
      amount: 1450,
      type: 'expense',
      category: 'cat-housing',
      date: makeDate(1),
      tags: ['fixed', 'essential', 'rent'],
      paymentMethod: 'bank_transfer',
      isRecurring: true,
      notes: 'Main apartment monthly lease installment',
    },
    {
      id: 'tx-exp-electric',
      title: 'City Power & Electric Bill',
      amount: 84.5,
      type: 'expense',
      category: 'cat-utilities',
      date: makeDate(3),
      tags: ['utilities', 'electricity'],
      paymentMethod: 'credit_card',
      isRecurring: true,
    },
    {
      id: 'tx-exp-internet',
      title: 'Fiber Gigabit Internet',
      amount: 65.0,
      type: 'expense',
      category: 'cat-utilities',
      date: makeDate(2),
      tags: ['internet', 'utilities'],
      paymentMethod: 'credit_card',
      isRecurring: true,
    },
    {
      id: 'tx-exp-groc-1',
      title: 'Whole Foods Market Weekly Stock',
      amount: 142.8,
      type: 'expense',
      category: 'cat-groceries',
      date: makeDate(2),
      tags: ['groceries', 'organic', 'weekly'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-groc-2',
      title: 'Trader Joes Essentials & Produce',
      amount: 88.25,
      type: 'expense',
      category: 'cat-groceries',
      date: makeDate(8),
      tags: ['groceries', 'food'],
      paymentMethod: 'debit_card',
    },
    {
      id: 'tx-exp-snack-1',
      title: 'Artisan Espresso & Almond Croissant',
      amount: 9.75,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(1),
      tags: ['snacks', 'coffee_break'],
      paymentMethod: 'digital_wallet',
      notes: 'Morning fuel at Blue Bottle',
    },
    {
      id: 'tx-exp-snack-2',
      title: 'Matcha Latte & Dark Chocolate Bar',
      amount: 14.5,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(1),
      tags: ['snacks', 'candy', 'coffee_break'],
      paymentMethod: 'digital_wallet',
      notes: 'Afternoon treat & snack with coworker',
    },
    {
      id: 'tx-exp-snack-3',
      title: 'Boba Milk Tea & Mochi Donuts',
      amount: 18.2,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(2),
      tags: ['snacks', 'treats'],
      paymentMethod: 'digital_wallet',
      notes: 'Boba time with friends',
    },
    {
      id: 'tx-exp-snack-4',
      title: 'Gourmet Potato Chips & Kombucha',
      amount: 11.4,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(3),
      tags: ['snacks', 'chips'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-snack-5',
      title: 'Gelato Double Scoop & Waffle Cone',
      amount: 8.5,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(4),
      tags: ['snacks', 'candy'],
      paymentMethod: 'cash',
    },
    {
      id: 'tx-exp-snack-6',
      title: 'Cold Brew & Protein Granola Bar',
      amount: 10.25,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(6),
      tags: ['snacks', 'coffee_break'],
      paymentMethod: 'digital_wallet',
    },
    {
      id: 'tx-exp-snack-7',
      title: 'Specialty Bakery Pastries',
      amount: 16.8,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(7),
      tags: ['snacks', 'bakery'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-snack-8',
      title: 'Afternoon Iced Caramel Macchiato',
      amount: 6.95,
      type: 'expense',
      category: 'cat-snacks',
      date: makeDate(9),
      tags: ['snacks', 'coffee_break'],
      paymentMethod: 'digital_wallet',
    },
    {
      id: 'tx-exp-dining-1',
      title: 'Tokyo Ramen Bar Dinner with Team',
      amount: 48.5,
      type: 'expense',
      category: 'cat-dining',
      date: makeDate(2),
      tags: ['dining', 'restaurant'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-dining-2',
      title: 'Woodfired Pizza & Mocktails',
      amount: 62.0,
      type: 'expense',
      category: 'cat-dining',
      date: makeDate(6),
      tags: ['dining', 'takeout'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-dining-3',
      title: 'Mediterranean Mezze Lunch Platter',
      amount: 28.5,
      type: 'expense',
      category: 'cat-dining',
      date: makeDate(8),
      tags: ['dining', 'restaurant'],
      paymentMethod: 'debit_card',
    },
    {
      id: 'tx-exp-trans-1',
      title: 'Metro Rail Monthly Transit Pass',
      amount: 90.0,
      type: 'expense',
      category: 'cat-transport',
      date: makeDate(1),
      tags: ['transport', 'commute'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-trans-2',
      title: 'Rideshare Ride Home from Airport',
      amount: 38.4,
      type: 'expense',
      category: 'cat-transport',
      date: makeDate(5),
      tags: ['transport', 'rideshare'],
      paymentMethod: 'digital_wallet',
    },
    {
      id: 'tx-exp-ent-1',
      title: 'Netflix & Spotify Duo Premium',
      amount: 28.98,
      type: 'expense',
      category: 'cat-entertainment',
      date: makeDate(3),
      tags: ['entertainment', 'subscription'],
      paymentMethod: 'credit_card',
      isRecurring: true,
    },
    {
      id: 'tx-exp-ent-2',
      title: 'Weekend Cinema IMAX Tickets',
      amount: 36.0,
      type: 'expense',
      category: 'cat-entertainment',
      date: makeDate(7),
      tags: ['entertainment', 'movies'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-shop-1',
      title: 'Ergonomic Desk Mat & Cable Organizers',
      amount: 45.0,
      type: 'expense',
      category: 'cat-shopping',
      date: makeDate(4),
      tags: ['shopping', 'workspace'],
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx-exp-health-1',
      title: 'Climbing Gym Monthly Membership',
      amount: 55.0,
      type: 'expense',
      category: 'cat-health',
      date: makeDate(1),
      tags: ['health', 'fitness'],
      paymentMethod: 'credit_card',
      isRecurring: true,
    },
  ];

  const demoSavingsGoals: SavingsGoal[] = [
    {
      id: 'goal-emergency',
      name: '6-Month Emergency Safety Net',
      targetAmount: 12000,
      currentAmount: 8500,
      targetDate: `${year}-12-31`,
      icon: 'ShieldCheck',
      color: '#10B981',
      category: 'Safety',
      notes: 'High-yield savings vault for 6 months living runway',
      history: [
        { id: 'h-1', date: makeDate(1), amount: 500, note: 'Monthly automated transfer', type: 'deposit' },
      ],
    },
    {
      id: 'goal-japan',
      name: 'Autumn Trip to Kyoto & Tokyo',
      targetAmount: 3500,
      currentAmount: 2150,
      targetDate: `${year + 1}-04-15`,
      icon: 'Plane',
      color: '#06B6D4',
      category: 'Travel',
      notes: 'Flights, ryokan stays, rail pass & ramen budget',
      history: [
        { id: 'h-2', date: makeDate(2), amount: 300, note: 'Freelance project allocation', type: 'deposit' },
      ],
    },
    {
      id: 'goal-tech',
      name: 'M4 Max MacBook Pro Workstation',
      targetAmount: 2800,
      currentAmount: 1400,
      targetDate: `${year}-11-30`,
      icon: 'Laptop',
      color: '#8B5CF6',
      category: 'Hardware',
      notes: 'Next-generation development machine upgrade',
      history: [
        { id: 'h-3', date: makeDate(5), amount: 250, note: 'Quarterly hardware savings', type: 'deposit' },
      ],
    },
  ];

  const demoDebts: DebtItem[] = [
    {
      id: 'debt-student-loan',
      name: 'Federal Student Education Loan',
      lenderName: 'Bank of Baroda / Govt Aid',
      debtType: 'borrowed',
      totalPrincipal: 14000,
      remainingBalance: 5200,
      interestRate: 3.9,
      minimumPayment: 320,
      dueDay: 20,
      color: '#EC4899',
      notes: 'Personal loan borrowed for vehicle down payment',
      payments: [
        {
          id: 'p-2',
          date: makeDate(3),
          amount: 320,
          principalPaid: 303.1,
          interestPaid: 16.9,
          note: 'Regular scheduled auto payment',
        },
      ],
    },
  ];

  const demoRecurring: RecurringItem[] = [
    {
      id: 'rec-rent',
      title: 'Apartment Monthly Rent',
      amount: 1450,
      type: 'expense',
      category: 'cat-housing',
      frequency: 'monthly',
      dayOfMonth: 1,
      autoApply: true,
      tags: ['fixed', 'rent'],
      paymentMethod: 'bank_transfer',
      isActive: true,
      lastAppliedMonth: currentMonth,
    },
    {
      id: 'rec-internet',
      title: 'Gigabit Fiber Internet',
      amount: 65,
      type: 'expense',
      category: 'cat-utilities',
      frequency: 'monthly',
      dayOfMonth: 2,
      autoApply: true,
      tags: ['internet', 'utilities'],
      paymentMethod: 'credit_card',
      isActive: true,
      lastAppliedMonth: currentMonth,
    },
    {
      id: 'rec-gym',
      title: 'Health Club & Gym Membership',
      amount: 55,
      type: 'expense',
      category: 'cat-health',
      frequency: 'monthly',
      dayOfMonth: 10,
      autoApply: true,
      tags: ['fitness', 'health'],
      paymentMethod: 'credit_card',
      isActive: true,
    },
    {
      id: 'rec-stream',
      title: 'Netflix & Spotify Streaming',
      amount: 28.98,
      type: 'expense',
      category: 'cat-entertainment',
      frequency: 'monthly',
      dayOfMonth: 3,
      autoApply: true,
      tags: ['subscription', 'entertainment'],
      paymentMethod: 'credit_card',
      isActive: true,
      lastAppliedMonth: currentMonth,
    },
  ];

  const demoSettings: UserSettings = {
    currency: '₹',
    currencyCode: 'INR',
    pushNotificationsEnabled: true,
    dailyBudgetAlertThreshold: 100,
    monthlyBudgetWarningThreshold: 80,
    enableRolloverByDefault: true,
    selectedMonth: currentMonth,
    userName: 'Alex Morgan',
  };

  return {
    categories: demoCategories,
    transactions: demoTransactions,
    proratedRules: demoRules,
    savingsGoals: demoSavingsGoals,
    debts: demoDebts,
    recurring: demoRecurring,
    settings: demoSettings,
  };
}
