-- Default clean initial seed data for Expense & Prorated Budget Tracker on Cloudflare D1

INSERT OR IGNORE INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES
  ('cat-snacks', 'Snacks & Bites', 'Cookie', '#F59E0B', 0, 1),
  ('cat-groceries', 'Groceries', 'ShoppingBag', '#10B981', 0, 0),
  ('cat-dining', 'Dining Out & Cafes', 'Utensils', '#EC4899', 0, 0),
  ('cat-housing', 'Rent & Housing', 'Home', '#6366F1', 0, 0),
  ('cat-utilities', 'Utilities & Bills', 'Zap', '#3B82F6', 0, 0),
  ('cat-transport', 'Transportation', 'Car', '#8B5CF6', 0, 0),
  ('cat-entertainment', 'Entertainment & Subs', 'Tv', '#06B6D4', 0, 0),
  ('cat-shopping', 'Shopping & Gear', 'Tag', '#F43F5E', 0, 0),
  ('cat-health', 'Health & Fitness', 'HeartPulse', '#14B8A6', 0, 0),
  ('cat-salary', 'Salary & Wages', 'Banknote', '#22C55E', 0, 0),
  ('cat-freelance', 'Freelance & Side Gig', 'Laptop', '#EAB308', 0, 0),
  ('cat-investments', 'Investments / Returns', 'TrendingUp', '#3B82F6', 0, 0);

INSERT OR IGNORE INTO user_settings (
  id, currency, currencyCode, pushNotificationsEnabled,
  dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold,
  enableRolloverByDefault, selectedMonth, userName
) VALUES (
  'default', '₹', 'INR', 1, 100, 80, 1, strftime('%Y-%m', 'now'), 'Financial Explorer'
);

INSERT OR IGNORE INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked) VALUES
  ('pot-main', 'Main Piggy Bank (गुलक)', 10000, 1500, 'PiggyBank', '#10B981', 'Primary digital piggy bank for spare change and secret savings', 0),
  ('pot-change', 'Daily Loose Change Jar', 2000, 450, 'Coins', '#F59E0B', 'Small daily cash notes & coins stash', 0);

INSERT OR IGNORE INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown) VALUES
  ('ge-seed-1', 'pot-main', 'deposit', 1500, 'Initial Piggy Bank Deposit', date('now'), 'Saved from cash budget', '{"500":3}'),
  ('ge-seed-2', 'pot-change', 'deposit', 450, 'Grocery Change', date('now'), 'Spare change dropped in jar', '{"100":4,"50":1}');
