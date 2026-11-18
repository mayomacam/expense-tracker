const DEFAULT_CATEGORIES = [
  { id: 'cat-snacks', name: 'Snacks & Bites', icon: 'Cookie', color: '#F59E0B', monthlyBudget: 0, isCustom: true },
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#10B981', monthlyBudget: 0, isCustom: false },
  { id: 'cat-dining', name: 'Dining Out & Cafes', icon: 'Utensils', color: '#EC4899', monthlyBudget: 0, isCustom: false },
  { id: 'cat-housing', name: 'Rent & Housing', icon: 'Home', color: '#6366F1', monthlyBudget: 0, isCustom: false },
  { id: 'cat-utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#3B82F6', monthlyBudget: 0, isCustom: false },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#8B5CF6', monthlyBudget: 0, isCustom: false },
  { id: 'cat-entertainment', name: 'Entertainment & Subs', icon: 'Tv', color: '#06B6D4', monthlyBudget: 0, isCustom: false },
  { id: 'cat-shopping', name: 'Shopping & Gear', icon: 'Tag', color: '#F43F5E', monthlyBudget: 0, isCustom: false },
  { id: 'cat-health', name: 'Health & Fitness', icon: 'HeartPulse', color: '#14B8A6', monthlyBudget: 0, isCustom: false },
  { id: 'cat-salary', name: 'Salary & Wages', icon: 'Banknote', color: '#22C55E', monthlyBudget: 0, isCustom: false },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', icon: 'Laptop', color: '#EAB308', monthlyBudget: 0, isCustom: false },
  { id: 'cat-investments', name: 'Investments / Returns', icon: 'TrendingUp', color: '#3B82F6', monthlyBudget: 0, isCustom: false },
];

let isolateSeedChecked = false;

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildSeedStatements(db: D1Database, includeGulak = true): D1PreparedStatement[] {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const stmts: D1PreparedStatement[] = [];

  for (const cat of DEFAULT_CATEGORIES) {
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO categories (id, name, icon, color, monthlyBudget, isCustom)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(cat.id, cat.name, cat.icon, cat.color, 0, cat.isCustom ? 1 : 0)
    );
  }

  stmts.push(
    db
      .prepare(
        `INSERT OR IGNORE INTO user_settings (
          id, currency, currencyCode, pushNotificationsEnabled,
          dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold,
          enableRolloverByDefault, selectedMonth, userName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('default', '₹', 'INR', 1, 100, 80, 1, currentMonth, 'Financial Explorer')
  );

  if (includeGulak) {
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          'pot-main',
          'Main Piggy Bank (गुलक)',
          10000,
          1500,
          'PiggyBank',
          '#10B981',
          'Primary digital piggy bank for spare change and secret savings',
          0
        )
    );
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          'pot-change',
          'Daily Loose Change Jar',
          2000,
          450,
          'Coins',
          '#F59E0B',
          'Small daily cash notes & coins stash',
          0
        )
    );
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          'ge-seed-1',
          'pot-main',
          'deposit',
          1500,
          'Initial Piggy Bank Deposit',
          today,
          'Saved from cash budget',
          JSON.stringify({ '500': 3 })
        )
    );
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          'ge-seed-2',
          'pot-change',
          'deposit',
          450,
          'Grocery Change',
          today,
          'Spare change dropped in jar',
          JSON.stringify({ '100': 4, '50': 1 })
        )
    );
  }

  return stmts;
}

export async function ensureSeeded(db: D1Database): Promise<void> {
  if (isolateSeedChecked) return;
  try {
    const row = await db.prepare('SELECT COUNT(*) as count FROM categories').first<{ count: number }>();
    if (!row || Number(row.count) === 0) {
      await db.batch(buildSeedStatements(db, true));
    }
    isolateSeedChecked = true;
  } catch {
    // Allow retry if migrations haven't been run yet
  }
}

export async function resetAllDataToZero(db: D1Database): Promise<void> {
  const deleteStmts: D1PreparedStatement[] = [
    db.prepare('DELETE FROM transactions'),
    db.prepare('DELETE FROM deleted_transactions'),
    db.prepare('DELETE FROM categories'),
    db.prepare('DELETE FROM prorated_rules'),
    db.prepare('DELETE FROM prorated_spends'),
    db.prepare('DELETE FROM savings_history'),
    db.prepare('DELETE FROM savings_goals'),
    db.prepare('DELETE FROM debt_payments'),
    db.prepare('DELETE FROM debts'),
    db.prepare('DELETE FROM recurring_items'),
    db.prepare('DELETE FROM read_alerts'),
    db.prepare('DELETE FROM user_settings'),
    db.prepare('DELETE FROM gulak_entries'),
    db.prepare('DELETE FROM gulak_pots'),
  ];

  await db.batch([...deleteStmts, ...buildSeedStatements(db, true)]);
  isolateSeedChecked = true;
}

export async function loadDemoData(db: D1Database): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const makeDate = (day: number) => `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;

  const clearStmts: D1PreparedStatement[] = [
    db.prepare('DELETE FROM transactions'),
    db.prepare('DELETE FROM deleted_transactions'),
    db.prepare('DELETE FROM categories'),
    db.prepare('DELETE FROM prorated_rules'),
    db.prepare('DELETE FROM prorated_spends'),
    db.prepare('DELETE FROM savings_history'),
    db.prepare('DELETE FROM savings_goals'),
    db.prepare('DELETE FROM debt_payments'),
    db.prepare('DELETE FROM debts'),
    db.prepare('DELETE FROM recurring_items'),
    db.prepare('DELETE FROM read_alerts'),
    db.prepare('DELETE FROM user_settings'),
    db.prepare('DELETE FROM gulak_entries'),
    db.prepare('DELETE FROM gulak_pots'),
  ];

  const demoBudgets: Record<string, number> = {
    'cat-snacks': 500,
    'cat-groceries': 600,
    'cat-dining': 350,
    'cat-housing': 1500,
    'cat-utilities': 220,
    'cat-transport': 200,
    'cat-entertainment': 120,
    'cat-shopping': 250,
    'cat-health': 100,
  };

  const seedStmts: D1PreparedStatement[] = [];
  for (const cat of DEFAULT_CATEGORIES) {
    seedStmts.push(
      db
        .prepare(
          `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(cat.id, cat.name, cat.icon, cat.color, demoBudgets[cat.id] || 0, cat.isCustom ? 1 : 0)
    );
  }

  seedStmts.push(
    db
      .prepare(
        `INSERT INTO user_settings (
          id, currency, currencyCode, pushNotificationsEnabled,
          dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold,
          enableRolloverByDefault, selectedMonth, userName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('default', '₹', 'INR', 1, 100, 80, 1, currentMonth, 'Alex Morgan')
  );

  const demoRules = [
    {
      id: 'rule-snacks-500',
      name: 'Snacks & Treats',
      categoryId: 'cat-snacks',
      targetTags: ['snacks', 'candy', 'coffee_break', 'chips'],
      monthlyMaxSpend: 500,
      rolloverEnabled: 1,
      rolloverAmount: 35,
      notes: 'Max 500/mo divided across days in month with daily prorated overspend warnings.',
    },
    {
      id: 'rule-dining-350',
      name: 'Dining & Takeout',
      categoryId: 'cat-dining',
      targetTags: ['dining', 'takeout', 'restaurant'],
      monthlyMaxSpend: 350,
      rolloverEnabled: 0,
      rolloverAmount: 0,
      notes: 'Prorated daily allowance for eating out at restaurants.',
    },
  ];
  for (const r of demoRules) {
    seedStmts.push(
      db
        .prepare(
          `INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          r.id,
          r.name,
          r.categoryId,
          JSON.stringify(r.targetTags),
          r.monthlyMaxSpend,
          currentMonth,
          r.rolloverEnabled,
          r.rolloverAmount,
          100,
          r.notes
        )
    );
  }

  const demoTxs = [
    { id: 'tx-inc-1', title: 'Primary Tech Salary', amount: 4500, type: 'income', category: 'cat-salary', date: makeDate(1), tags: ['salary', 'direct_deposit'], paymentMethod: 'bank_transfer', isRecurring: 1, nature: 'need' },
    { id: 'tx-inc-2', title: 'UI Design Client Project', amount: 850, type: 'income', category: 'cat-freelance', date: makeDate(5), tags: ['freelance', 'side_gig'], paymentMethod: 'digital_wallet', isRecurring: 0, nature: 'need' },
    { id: 'tx-exp-rent', title: 'Apartment Monthly Rent', amount: 1450, type: 'expense', category: 'cat-housing', date: makeDate(1), tags: ['fixed', 'essential', 'rent'], paymentMethod: 'bank_transfer', isRecurring: 1, nature: 'need' },
    { id: 'tx-exp-electric', title: 'City Power & Electric Bill', amount: 84.5, type: 'expense', category: 'cat-utilities', date: makeDate(3), tags: ['utilities', 'electricity'], paymentMethod: 'credit_card', isRecurring: 1, nature: 'need' },
    { id: 'tx-exp-groc-1', title: 'Whole Foods Market Weekly Stock', amount: 142.8, type: 'expense', category: 'cat-groceries', date: makeDate(2), tags: ['groceries', 'organic'], paymentMethod: 'credit_card', isRecurring: 0, nature: 'need' },
    { id: 'tx-exp-snack-1', title: 'Artisan Espresso & Almond Croissant', amount: 9.75, type: 'expense', category: 'cat-snacks', date: makeDate(1), tags: ['snacks', 'coffee_break'], paymentMethod: 'digital_wallet', isRecurring: 0, nature: 'want' },
    { id: 'tx-exp-dining-1', title: 'Tokyo Ramen Bar Dinner', amount: 48.5, type: 'expense', category: 'cat-dining', date: makeDate(2), tags: ['dining', 'restaurant'], paymentMethod: 'credit_card', isRecurring: 0, nature: 'want' },
    { id: 'tx-exp-trans-1', title: 'Metro Rail Monthly Transit Pass', amount: 90, type: 'expense', category: 'cat-transport', date: makeDate(1), tags: ['transport', 'commute'], paymentMethod: 'credit_card', isRecurring: 0, nature: 'need' },
  ];
  for (const tx of demoTxs) {
    seedStmts.push(
      db
        .prepare(
          `INSERT INTO transactions (id, title, amount, type, category, date, tags, paymentMethod, isRecurring, nature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(tx.id, tx.title, tx.amount, tx.type, tx.category, tx.date, JSON.stringify(tx.tags), tx.paymentMethod, tx.isRecurring, tx.nature)
    );
  }

  seedStmts.push(
    db
      .prepare(
        `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('goal-emergency', '6-Month Emergency Safety Net', 12000, 8500, `${year}-12-31`, 'ShieldCheck', '#10B981', 'Safety', 'High-yield savings vault for 6 months living runway')
  );
  seedStmts.push(
    db
      .prepare(
        `INSERT INTO savings_history (id, goalId, date, amount, note, type) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind('h-1', 'goal-emergency', makeDate(1), 500, 'Monthly automated transfer', 'deposit')
  );

  seedStmts.push(
    db
      .prepare(
        `INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('debt-student-loan', 'Federal Student Education Loan', 'Bank of Baroda / Govt Aid', 'borrowed', 14000, 5200, 3.9, 320, 20, 'Personal loan repayment schedule', '#EC4899')
  );

  await db.batch([...clearStmts, ...seedStmts, ...buildSeedStatements(db, true)]);
  isolateSeedChecked = true;
}

// ---------------------------------------------------------------------------
// Transactions Repository
// ---------------------------------------------------------------------------
function mapTransactionRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    amount: Number(r.amount),
    type: r.type,
    category: r.category,
    date: r.date,
    tags: safeJsonParse<string[]>(r.tags, []),
    notes: r.notes || undefined,
    paymentMethod: r.paymentMethod,
    isRecurring: Boolean(r.isRecurring),
    recurringFrequency: r.recurringFrequency || undefined,
    receiptUrl: r.receiptUrl || undefined,
    proratedRuleId: r.proratedRuleId || undefined,
    nature: r.nature || 'need',
    amortizationMonths: Number(r.amortizationMonths || 1),
    transferFrom: r.transferFrom || undefined,
    transferTo: r.transferTo || undefined,
  };
}

export const transactionRepo = {
  async getAll(db: D1Database) {
    const { results } = await db
      .prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC')
      .all();
    return (results || []).map(mapTransactionRow);
  },

  async getById(db: D1Database, id: string) {
    const row = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    return row ? mapTransactionRow(row) : null;
  },

  async create(db: D1Database, tx: any) {
    await db
      .prepare(
        `INSERT INTO transactions (
          id, title, amount, type, category, date, tags, notes, paymentMethod,
          isRecurring, recurringFrequency, receiptUrl, proratedRuleId,
          nature, amortizationMonths, transferFrom, transferTo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        tx.id,
        tx.title,
        tx.amount,
        tx.type,
        tx.category,
        tx.date,
        JSON.stringify(tx.tags || []),
        tx.notes || null,
        tx.paymentMethod,
        tx.isRecurring ? 1 : 0,
        tx.recurringFrequency || null,
        tx.receiptUrl || null,
        tx.proratedRuleId || null,
        tx.nature || 'need',
        tx.amortizationMonths || 1,
        tx.transferFrom || null,
        tx.transferTo || null
      )
      .run();
    return tx;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE transactions SET
          title = ?, amount = ?, type = ?, category = ?, date = ?,
          tags = ?, notes = ?, paymentMethod = ?, isRecurring = ?,
          recurringFrequency = ?, receiptUrl = ?, proratedRuleId = ?,
          nature = ?, amortizationMonths = ?, transferFrom = ?, transferTo = ?
         WHERE id = ?`
      )
      .bind(
        merged.title,
        merged.amount,
        merged.type,
        merged.category,
        merged.date,
        JSON.stringify(merged.tags || []),
        merged.notes || null,
        merged.paymentMethod,
        merged.isRecurring ? 1 : 0,
        merged.recurringFrequency || null,
        merged.receiptUrl || null,
        merged.proratedRuleId || null,
        merged.nature || 'need',
        merged.amortizationMonths || 1,
        merged.transferFrom || null,
        merged.transferTo || null,
        id
      )
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    const existing = await this.getById(db, id);
    const stmts: D1PreparedStatement[] = [];
    if (existing) {
      stmts.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO deleted_transactions (
              id, title, amount, type, category, date, tags, notes, paymentMethod,
              isRecurring, recurringFrequency, receiptUrl, proratedRuleId,
              nature, amortizationMonths, transferFrom, transferTo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            existing.id,
            existing.title,
            existing.amount,
            existing.type,
            existing.category,
            existing.date,
            JSON.stringify(existing.tags || []),
            existing.notes || null,
            existing.paymentMethod,
            existing.isRecurring ? 1 : 0,
            existing.recurringFrequency || null,
            existing.receiptUrl || null,
            existing.proratedRuleId || null,
            existing.nature || 'need',
            existing.amortizationMonths || 1,
            existing.transferFrom || null,
            existing.transferTo || null
          )
      );
    }
    stmts.push(db.prepare('DELETE FROM transactions WHERE id = ?').bind(id));
    await db.batch(stmts);
    return true;
  },

  async bulkInsert(db: D1Database, txs: any[]) {
    if (txs.length === 0) return [];
    const stmts = txs.map((tx) =>
      db
        .prepare(
          `INSERT INTO transactions (
            id, title, amount, type, category, date, tags, notes, paymentMethod,
            isRecurring, recurringFrequency, receiptUrl, proratedRuleId,
            nature, amortizationMonths, transferFrom, transferTo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          tx.id,
          tx.title,
          tx.amount,
          tx.type,
          tx.category,
          tx.date,
          JSON.stringify(tx.tags || []),
          tx.notes || null,
          tx.paymentMethod,
          tx.isRecurring ? 1 : 0,
          tx.recurringFrequency || null,
          tx.receiptUrl || null,
          tx.proratedRuleId || null,
          tx.nature || 'need',
          tx.amortizationMonths || 1,
          tx.transferFrom || null,
          tx.transferTo || null
        )
    );
    await db.batch(stmts);
    return txs;
  },
};

// ---------------------------------------------------------------------------
// Deleted Transactions (Trash) Repository
// ---------------------------------------------------------------------------
export const deletedTransactionRepo = {
  async getAll(db: D1Database) {
    const { results } = await db
      .prepare('SELECT * FROM deleted_transactions ORDER BY deleted_at DESC')
      .all();
    return (results || []).map(mapTransactionRow);
  },

  async restore(db: D1Database, id: string) {
    const row = await db.prepare('SELECT * FROM deleted_transactions WHERE id = ?').bind(id).first();
    if (!row) return null;
    const restoredTx = mapTransactionRow(row);
    await db.batch([
      db.prepare('DELETE FROM deleted_transactions WHERE id = ?').bind(id),
      db
        .prepare(
          `INSERT OR REPLACE INTO transactions (
            id, title, amount, type, category, date, tags, notes, paymentMethod,
            isRecurring, recurringFrequency, receiptUrl, proratedRuleId,
            nature, amortizationMonths, transferFrom, transferTo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          restoredTx.id,
          restoredTx.title,
          restoredTx.amount,
          restoredTx.type,
          restoredTx.category,
          restoredTx.date,
          JSON.stringify(restoredTx.tags || []),
          restoredTx.notes || null,
          restoredTx.paymentMethod,
          restoredTx.isRecurring ? 1 : 0,
          restoredTx.recurringFrequency || null,
          restoredTx.receiptUrl || null,
          restoredTx.proratedRuleId || null,
          restoredTx.nature || 'need',
          restoredTx.amortizationMonths || 1,
          restoredTx.transferFrom || null,
          restoredTx.transferTo || null
        ),
    ]);
    return restoredTx;
  },

  async emptyTrash(db: D1Database) {
    await db.prepare('DELETE FROM deleted_transactions').run();
    return true;
  },
};

// ---------------------------------------------------------------------------
// Categories Repository
// ---------------------------------------------------------------------------
export const categoryRepo = {
  async getAll(db: D1Database) {
    const { results } = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return (results || []).map((r: any) => ({
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    }));
  },

  async getById(db: D1Database, id: string) {
    const r = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<any>();
    if (!r) return null;
    return {
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    };
  },

  async create(db: D1Database, cat: any) {
    await db
      .prepare(
        `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0)
      .run();
    return cat;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE categories SET name = ?, icon = ?, color = ?, monthlyBudget = ?, isCustom = ? WHERE id = ?`
      )
      .bind(merged.name, merged.icon, merged.color, merged.monthlyBudget || 0, merged.isCustom ? 1 : 0, id)
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return true;
  },
};

// ---------------------------------------------------------------------------
// Prorated Rules & Spends Repositories
// ---------------------------------------------------------------------------
export const proratedRuleRepo = {
  async getAll(db: D1Database) {
    const { results } = await db.prepare('SELECT * FROM prorated_rules ORDER BY name ASC').all();
    return (results || []).map((r: any) => ({
      ...r,
      monthlyMaxSpend: Number(r.monthlyMaxSpend),
      rolloverEnabled: Boolean(r.rolloverEnabled),
      rolloverAmount: Number(r.rolloverAmount || 0),
      alertThresholdPercent: Number(r.alertThresholdPercent || 100),
      targetTags: safeJsonParse<string[]>(r.targetTags, []),
    }));
  },

  async getById(db: D1Database, id: string) {
    const r = await db.prepare('SELECT * FROM prorated_rules WHERE id = ?').bind(id).first<any>();
    if (!r) return null;
    return {
      ...r,
      monthlyMaxSpend: Number(r.monthlyMaxSpend),
      rolloverEnabled: Boolean(r.rolloverEnabled),
      rolloverAmount: Number(r.rolloverAmount || 0),
      alertThresholdPercent: Number(r.alertThresholdPercent || 100),
      targetTags: safeJsonParse<string[]>(r.targetTags, []),
    };
  },

  async create(db: D1Database, rule: any) {
    await db
      .prepare(
        `INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        rule.id,
        rule.name,
        rule.categoryId || null,
        JSON.stringify(rule.targetTags || []),
        rule.monthlyMaxSpend,
        rule.month,
        rule.rolloverEnabled ? 1 : 0,
        rule.rolloverAmount || 0,
        rule.alertThresholdPercent || 100,
        rule.notes || null
      )
      .run();
    return rule;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE prorated_rules SET
          name = ?, categoryId = ?, targetTags = ?, monthlyMaxSpend = ?,
          month = ?, rolloverEnabled = ?, rolloverAmount = ?,
          alertThresholdPercent = ?, notes = ?
         WHERE id = ?`
      )
      .bind(
        merged.name,
        merged.categoryId || null,
        JSON.stringify(merged.targetTags || []),
        merged.monthlyMaxSpend,
        merged.month,
        merged.rolloverEnabled ? 1 : 0,
        merged.rolloverAmount || 0,
        merged.alertThresholdPercent || 100,
        merged.notes || null,
        id
      )
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    await db.batch([
      db.prepare('DELETE FROM prorated_spends WHERE ruleId = ?').bind(id),
      db.prepare('DELETE FROM prorated_rules WHERE id = ?').bind(id),
    ]);
    return true;
  },
};

export const proratedSpendRepo = {
  async getAll(db: D1Database) {
    const { results } = await db
      .prepare('SELECT * FROM prorated_spends ORDER BY date DESC, created_at DESC')
      .all();
    return (results || []).map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      addToMainTransactions: Boolean(r.addToMainTransactions),
    }));
  },

  async getByRuleId(db: D1Database, ruleId: string) {
    const { results } = await db
      .prepare('SELECT * FROM prorated_spends WHERE ruleId = ? ORDER BY date DESC, created_at DESC')
      .bind(ruleId)
      .all();
    return (results || []).map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      addToMainTransactions: Boolean(r.addToMainTransactions),
    }));
  },

  async create(db: D1Database, spend: any) {
    const stmts: D1PreparedStatement[] = [
      db
        .prepare(
          `INSERT INTO prorated_spends (id, ruleId, title, amount, date, notes, addToMainTransactions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          spend.id,
          spend.ruleId,
          spend.title,
          spend.amount,
          spend.date,
          spend.notes || null,
          spend.addToMainTransactions ? 1 : 0
        ),
    ];

    if (spend.addToMainTransactions) {
      const rule = await proratedRuleRepo.getById(db, spend.ruleId);
      const txId = `tx-prorated-${spend.id}`;
      stmts.push(
        db
          .prepare(
            `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, proratedRuleId, nature, amortizationMonths)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            txId,
            spend.title,
            spend.amount,
            'expense',
            rule?.categoryId || 'cat-snacks',
            spend.date,
            JSON.stringify(['prorated']),
            spend.notes || `Prorated spend for ${rule?.name || spend.ruleId}`,
            'credit_card',
            0,
            spend.ruleId,
            'want',
            1
          )
      );
    }

    await db.batch(stmts);
    return spend;
  },

  async delete(db: D1Database, id: string) {
    await db.batch([
      db.prepare('DELETE FROM prorated_spends WHERE id = ?').bind(id),
      db.prepare('DELETE FROM transactions WHERE id = ?').bind(`tx-prorated-${id}`),
    ]);
    return true;
  },
};

// ---------------------------------------------------------------------------
// Savings Goals Repository (D1 Batch Single Round-Trip)
// ---------------------------------------------------------------------------
export const savingsRepo = {
  async getAll(db: D1Database) {
    const [goalsRes, historyRes] = await db.batch([
      db.prepare('SELECT * FROM savings_goals ORDER BY targetDate ASC'),
      db.prepare('SELECT * FROM savings_history ORDER BY date DESC'),
    ]);
    const goals = (goalsRes.results || []) as any[];
    const allHistory = (historyRes.results || []) as any[];

    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount || 0),
      targetDate: g.targetDate,
      icon: g.icon || undefined,
      color: g.color || undefined,
      category: g.category || undefined,
      notes: g.notes || undefined,
      history: allHistory
        .filter((h) => h.goalId === g.id)
        .map((h) => ({
          id: h.id,
          date: h.date,
          amount: Number(h.amount),
          note: h.note || undefined,
          type: h.type,
        })),
    }));
  },

  async getById(db: D1Database, id: string) {
    const [goalRes, histRes] = await db.batch([
      db.prepare('SELECT * FROM savings_goals WHERE id = ?').bind(id),
      db.prepare('SELECT * FROM savings_history WHERE goalId = ? ORDER BY date DESC').bind(id),
    ]);
    const g = (goalRes.results || [])[0] as any;
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount || 0),
      targetDate: g.targetDate,
      icon: g.icon || undefined,
      color: g.color || undefined,
      category: g.category || undefined,
      notes: g.notes || undefined,
      history: ((histRes.results || []) as any[]).map((h) => ({
        id: h.id,
        date: h.date,
        amount: Number(h.amount),
        note: h.note || undefined,
        type: h.type,
      })),
    };
  },

  async create(db: D1Database, goal: any) {
    const fullGoal = {
      ...goal,
      currentAmount: goal.currentAmount || 0,
      history: goal.history || [],
    };
    await db
      .prepare(
        `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        fullGoal.id,
        fullGoal.name,
        fullGoal.targetAmount,
        fullGoal.currentAmount,
        fullGoal.targetDate,
        fullGoal.icon || null,
        fullGoal.color || null,
        fullGoal.category || null,
        fullGoal.notes || null
      )
      .run();
    return fullGoal;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE savings_goals SET
          name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?,
          icon = ?, color = ?, category = ?, notes = ?
         WHERE id = ?`
      )
      .bind(
        merged.name,
        merged.targetAmount,
        merged.currentAmount,
        merged.targetDate,
        merged.icon || null,
        merged.color || null,
        merged.category || null,
        merged.notes || null,
        id
      )
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    await db.batch([
      db.prepare('DELETE FROM savings_history WHERE goalId = ?').bind(id),
      db.prepare('DELETE FROM savings_goals WHERE id = ?').bind(id),
    ]);
    return true;
  },

  async addContribution(db: D1Database, goalId: string, item: any) {
    const existing = await this.getById(db, goalId);
    if (!existing) return null;
    const delta = item.type === 'deposit' ? item.amount : -item.amount;
    const newCurrent = Math.max(0, existing.currentAmount + delta);
    await db.batch([
      db
        .prepare(
          `INSERT INTO savings_history (id, goalId, date, amount, note, type) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(item.id, goalId, item.date, item.amount, item.note || null, item.type),
      db.prepare(`UPDATE savings_goals SET currentAmount = ? WHERE id = ?`).bind(newCurrent, goalId),
    ]);
    return this.getById(db, goalId);
  },
};

// ---------------------------------------------------------------------------
// Debts Repository (D1 Batch Single Round-Trip)
// ---------------------------------------------------------------------------
export const debtRepo = {
  async getAll(db: D1Database) {
    const [debtsRes, paymentsRes] = await db.batch([
      db.prepare('SELECT * FROM debts ORDER BY dueDay ASC'),
      db.prepare('SELECT * FROM debt_payments ORDER BY date DESC'),
    ]);
    const debts = (debtsRes.results || []) as any[];
    const allPayments = (paymentsRes.results || []) as any[];

    return debts.map((d) => ({
      id: d.id,
      name: d.name,
      lenderName: d.lenderName || undefined,
      debtType: d.debtType || 'borrowed',
      totalPrincipal: Number(d.totalPrincipal),
      remainingBalance: Number(d.remainingBalance),
      interestRate: Number(d.interestRate),
      minimumPayment: Number(d.minimumPayment),
      dueDay: Number(d.dueDay),
      notes: d.notes || undefined,
      color: d.color || undefined,
      payments: allPayments
        .filter((p) => p.debtId === d.id)
        .map((p) => ({
          id: p.id,
          date: p.date,
          amount: Number(p.amount),
          principalPaid: Number(p.principalPaid),
          interestPaid: Number(p.interestPaid),
          note: p.note || undefined,
        })),
    }));
  },

  async getById(db: D1Database, id: string) {
    const [debtRes, payRes] = await db.batch([
      db.prepare('SELECT * FROM debts WHERE id = ?').bind(id),
      db.prepare('SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC').bind(id),
    ]);
    const d = (debtRes.results || [])[0] as any;
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      lenderName: d.lenderName || undefined,
      debtType: d.debtType || 'borrowed',
      totalPrincipal: Number(d.totalPrincipal),
      remainingBalance: Number(d.remainingBalance),
      interestRate: Number(d.interestRate),
      minimumPayment: Number(d.minimumPayment),
      dueDay: Number(d.dueDay),
      notes: d.notes || undefined,
      color: d.color || undefined,
      payments: ((payRes.results || []) as any[]).map((p) => ({
        id: p.id,
        date: p.date,
        amount: Number(p.amount),
        principalPaid: Number(p.principalPaid),
        interestPaid: Number(p.interestPaid),
        note: p.note || undefined,
      })),
    };
  },

  async create(db: D1Database, debt: any) {
    const fullDebt = {
      ...debt,
      debtType: debt.debtType || 'borrowed',
      remainingBalance: debt.remainingBalance ?? debt.totalPrincipal,
      payments: debt.payments || [],
    };
    await db
      .prepare(
        `INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        fullDebt.id,
        fullDebt.name,
        fullDebt.lenderName || null,
        fullDebt.debtType,
        fullDebt.totalPrincipal,
        fullDebt.remainingBalance,
        fullDebt.interestRate,
        fullDebt.minimumPayment,
        fullDebt.dueDay,
        fullDebt.notes || null,
        fullDebt.color || null
      )
      .run();
    return fullDebt;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE debts SET
          name = ?, lenderName = ?, debtType = ?, totalPrincipal = ?, remainingBalance = ?,
          interestRate = ?, minimumPayment = ?, dueDay = ?,
          notes = ?, color = ?
         WHERE id = ?`
      )
      .bind(
        merged.name,
        merged.lenderName || null,
        merged.debtType || 'borrowed',
        merged.totalPrincipal,
        merged.remainingBalance,
        merged.interestRate,
        merged.minimumPayment,
        merged.dueDay,
        merged.notes || null,
        merged.color || null,
        id
      )
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    await db.batch([
      db.prepare('DELETE FROM debt_payments WHERE debtId = ?').bind(id),
      db.prepare('DELETE FROM debts WHERE id = ?').bind(id),
    ]);
    return true;
  },

  async recordPayment(db: D1Database, debtId: string, payment: any) {
    const existing = await this.getById(db, debtId);
    if (!existing) return null;
    const newBalance = Math.max(0, existing.remainingBalance - payment.principalPaid);
    await db.batch([
      db
        .prepare(
          `INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          payment.id,
          debtId,
          payment.date,
          payment.amount,
          payment.principalPaid,
          payment.interestPaid,
          payment.note || null
        ),
      db.prepare(`UPDATE debts SET remainingBalance = ? WHERE id = ?`).bind(newBalance, debtId),
    ]);
    return this.getById(db, debtId);
  },

  async deletePayment(db: D1Database, debtId: string, paymentId: string) {
    const p = await db
      .prepare('SELECT * FROM debt_payments WHERE id = ? AND debtId = ?')
      .bind(paymentId, debtId)
      .first<any>();
    if (!p) return null;
    const debt = await this.getById(db, debtId);
    const stmts: D1PreparedStatement[] = [
      db.prepare('DELETE FROM debt_payments WHERE id = ?').bind(paymentId),
    ];
    if (debt) {
      const newBalance = Math.min(debt.totalPrincipal, debt.remainingBalance + Number(p.principalPaid));
      stmts.push(db.prepare('UPDATE debts SET remainingBalance = ? WHERE id = ?').bind(newBalance, debtId));
    }
    await db.batch(stmts);
    return this.getById(db, debtId);
  },
};

// ---------------------------------------------------------------------------
// Recurring Items Repository
// ---------------------------------------------------------------------------
export const recurringRepo = {
  async getAll(db: D1Database) {
    const { results } = await db
      .prepare('SELECT * FROM recurring_items ORDER BY dayOfMonth ASC')
      .all();
    return (results || []).map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      dayOfMonth: Number(r.dayOfMonth),
      autoApply: Boolean(r.autoApply),
      isActive: Boolean(r.isActive),
      tags: safeJsonParse<string[]>(r.tags, []),
    }));
  },

  async getById(db: D1Database, id: string) {
    const r = await db.prepare('SELECT * FROM recurring_items WHERE id = ?').bind(id).first<any>();
    if (!r) return null;
    return {
      ...r,
      amount: Number(r.amount),
      dayOfMonth: Number(r.dayOfMonth),
      autoApply: Boolean(r.autoApply),
      isActive: Boolean(r.isActive),
      tags: safeJsonParse<string[]>(r.tags, []),
    };
  },

  async create(db: D1Database, item: any) {
    await db
      .prepare(
        `INSERT INTO recurring_items (id, title, amount, type, category, frequency, dayOfMonth, autoApply, tags, paymentMethod, lastAppliedMonth, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        item.id,
        item.title,
        item.amount,
        item.type,
        item.category,
        item.frequency,
        item.dayOfMonth,
        item.autoApply ? 1 : 0,
        JSON.stringify(item.tags || []),
        item.paymentMethod,
        item.lastAppliedMonth || null,
        item.isActive ? 1 : 0
      )
      .run();
    return item;
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE recurring_items SET
          title = ?, amount = ?, type = ?, category = ?,
          frequency = ?, dayOfMonth = ?, autoApply = ?,
          tags = ?, paymentMethod = ?, lastAppliedMonth = ?,
          isActive = ?
         WHERE id = ?`
      )
      .bind(
        merged.title,
        merged.amount,
        merged.type,
        merged.category,
        merged.frequency,
        merged.dayOfMonth,
        merged.autoApply ? 1 : 0,
        JSON.stringify(merged.tags || []),
        merged.paymentMethod,
        merged.lastAppliedMonth || null,
        merged.isActive ? 1 : 0,
        id
      )
      .run();
    return merged;
  },

  async delete(db: D1Database, id: string) {
    await db.prepare('DELETE FROM recurring_items WHERE id = ?').bind(id).run();
    return true;
  },

  async applyForMonth(db: D1Database, targetMonth: string, forceAll: boolean) {
    const allRecurring = await this.getAll(db);
    const stmts: D1PreparedStatement[] = [];
    const clonedTitles: string[] = [];

    for (const rec of allRecurring) {
      if (!rec.isActive) continue;
      if (!forceAll && rec.autoApply === false) continue;
      if (rec.lastAppliedMonth === targetMonth) continue;

      const dayStr = String(Math.min(28, Math.max(1, rec.dayOfMonth || 1))).padStart(2, '0');
      const txDate = `${targetMonth}-${dayStr}`;
      const txId = `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      stmts.push(
        db
          .prepare(
            `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, nature, amortizationMonths)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            txId,
            `${rec.title} (Recurring)`,
            rec.amount,
            rec.type,
            rec.category,
            txDate,
            JSON.stringify([...(rec.tags || []), 'recurring_auto']),
            `Auto-cloned recurring item for ${targetMonth}`,
            rec.paymentMethod,
            1,
            rec.frequency,
            'need',
            1
          )
      );
      stmts.push(
        db.prepare('UPDATE recurring_items SET lastAppliedMonth = ? WHERE id = ?').bind(targetMonth, rec.id)
      );
      clonedTitles.push(rec.title);
    }

    if (stmts.length > 0) {
      await db.batch(stmts);
    }

    return { addedCount: clonedTitles.length, clonedTitles };
  },
};

// ---------------------------------------------------------------------------
// Settings & Read Alerts Repositories
// ---------------------------------------------------------------------------
export const settingsRepo = {
  async get(db: D1Database) {
    const r = await db.prepare('SELECT * FROM user_settings LIMIT 1').first<any>();
    if (!r) {
      return {
        currency: '₹',
        currencyCode: 'INR',
        pushNotificationsEnabled: true,
        dailyBudgetAlertThreshold: 100,
        monthlyBudgetWarningThreshold: 80,
        enableRolloverByDefault: true,
        selectedMonth: new Date().toISOString().slice(0, 7),
        userName: 'Financial Explorer',
      };
    }
    return {
      currency: r.currency || '₹',
      currencyCode: r.currencyCode || 'INR',
      pushNotificationsEnabled: Boolean(r.pushNotificationsEnabled),
      dailyBudgetAlertThreshold: Number(r.dailyBudgetAlertThreshold || 100),
      monthlyBudgetWarningThreshold: Number(r.monthlyBudgetWarningThreshold || 80),
      enableRolloverByDefault: Boolean(r.enableRolloverByDefault),
      selectedMonth: r.selectedMonth || new Date().toISOString().slice(0, 7),
      userName: r.userName || 'Financial Explorer',
    };
  },

  async update(db: D1Database, updates: any) {
    const existing = await this.get(db);
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `INSERT OR REPLACE INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'default',
        merged.currency,
        merged.currencyCode,
        merged.pushNotificationsEnabled ? 1 : 0,
        merged.dailyBudgetAlertThreshold,
        merged.monthlyBudgetWarningThreshold,
        merged.enableRolloverByDefault ? 1 : 0,
        merged.selectedMonth,
        merged.userName
      )
      .run();
    return merged;
  },
};

export const readAlertsRepo = {
  async getAllReadIds(db: D1Database) {
    const { results } = await db.prepare('SELECT alertId FROM read_alerts').all();
    return (results || []).map((r: any) => r.alertId);
  },

  async markRead(db: D1Database, alertId: string) {
    await db.prepare('INSERT OR IGNORE INTO read_alerts (alertId) VALUES (?)').bind(alertId).run();
  },

  async markAllRead(db: D1Database, alertIds: string[]) {
    if (alertIds.length === 0) return;
    await db.batch(
      alertIds.slice(0, 200).map((id) =>
        db.prepare('INSERT OR IGNORE INTO read_alerts (alertId) VALUES (?)').bind(id)
      )
    );
  },

  async clearAll(db: D1Database) {
    await db.prepare('DELETE FROM read_alerts').run();
  },
};

// ---------------------------------------------------------------------------
// Gulak (Piggy Bank) Repository (D1 Batch Single Round-Trip)
// ---------------------------------------------------------------------------
export const gulakRepo = {
  async getAll(db: D1Database) {
    const [potsRes, entriesRes] = await db.batch([
      db.prepare('SELECT * FROM gulak_pots ORDER BY created_at ASC'),
      db.prepare('SELECT * FROM gulak_entries ORDER BY date DESC, created_at DESC'),
    ]);
    const pots = (potsRes.results || []) as any[];
    const entries = (entriesRes.results || []) as any[];

    return pots.map((p) => ({
      id: p.id,
      name: p.name,
      targetAmount: Number(p.targetAmount || 0),
      currentBalance: Number(p.currentBalance || 0),
      icon: p.icon || 'PiggyBank',
      color: p.color || '#10B981',
      notes: p.notes || undefined,
      isLocked: Boolean(p.isLocked),
      lockUntilDate: p.lockUntilDate || undefined,
      created_at: p.created_at,
      entries: entries
        .filter((e) => e.potId === p.id)
        .map((e) => ({
          id: e.id,
          potId: e.potId,
          type: e.type,
          amount: Number(e.amount),
          title: e.title,
          date: e.date,
          notes: e.notes || undefined,
          breakdown: e.breakdown ? safeJsonParse(e.breakdown, undefined) : undefined,
          created_at: e.created_at,
        })),
    }));
  },

  async getById(db: D1Database, id: string) {
    const [potRes, entryRes] = await db.batch([
      db.prepare('SELECT * FROM gulak_pots WHERE id = ?').bind(id),
      db.prepare('SELECT * FROM gulak_entries WHERE potId = ? ORDER BY date DESC, created_at DESC').bind(id),
    ]);
    const p = (potRes.results || [])[0] as any;
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      targetAmount: Number(p.targetAmount || 0),
      currentBalance: Number(p.currentBalance || 0),
      icon: p.icon || 'PiggyBank',
      color: p.color || '#10B981',
      notes: p.notes || undefined,
      isLocked: Boolean(p.isLocked),
      lockUntilDate: p.lockUntilDate || undefined,
      created_at: p.created_at,
      entries: ((entryRes.results || []) as any[]).map((e) => ({
        id: e.id,
        potId: e.potId,
        type: e.type,
        amount: Number(e.amount),
        title: e.title,
        date: e.date,
        notes: e.notes || undefined,
        breakdown: e.breakdown ? safeJsonParse(e.breakdown, undefined) : undefined,
        created_at: e.created_at,
      })),
    };
  },

  async create(db: D1Database, pot: any) {
    const id = pot.id || `pot-${Date.now()}`;
    await db
      .prepare(
        `INSERT INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked, lockUntilDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        pot.name,
        pot.targetAmount || 0,
        pot.currentBalance || 0,
        pot.icon || 'PiggyBank',
        pot.color || '#10B981',
        pot.notes || null,
        pot.isLocked ? 1 : 0,
        pot.lockUntilDate || null
      )
      .run();
    return this.getById(db, id);
  },

  async update(db: D1Database, id: string, updates: any) {
    const existing = await this.getById(db, id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .prepare(
        `UPDATE gulak_pots SET
          name = ?, targetAmount = ?, currentBalance = ?, icon = ?, color = ?, notes = ?, isLocked = ?, lockUntilDate = ?
         WHERE id = ?`
      )
      .bind(
        merged.name,
        merged.targetAmount || 0,
        merged.currentBalance || 0,
        merged.icon || 'PiggyBank',
        merged.color || '#10B981',
        merged.notes || null,
        merged.isLocked ? 1 : 0,
        merged.lockUntilDate || null,
        id
      )
      .run();
    return this.getById(db, id);
  },

  async delete(db: D1Database, id: string) {
    await db.batch([
      db.prepare('DELETE FROM gulak_entries WHERE potId = ?').bind(id),
      db.prepare('DELETE FROM gulak_pots WHERE id = ?').bind(id),
    ]);
    return true;
  },

  async addEntry(db: D1Database, potId: string, entry: any) {
    const pot = await this.getById(db, potId);
    if (!pot) return null;
    const entryId = entry.id || `ge-${Date.now()}`;
    const amount = Number(entry.amount);
    const type = entry.type === 'withdraw' ? 'withdraw' : 'deposit';
    const breakdown = entry.breakdown ? JSON.stringify(entry.breakdown) : '{}';
    const delta = type === 'deposit' ? amount : -amount;
    const newBalance = Math.max(0, pot.currentBalance + delta);

    await db.batch([
      db
        .prepare(
          `INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          entryId,
          potId,
          type,
          amount,
          entry.title || (type === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'),
          entry.date || new Date().toISOString().slice(0, 10),
          entry.notes || null,
          breakdown
        ),
      db.prepare('UPDATE gulak_pots SET currentBalance = ? WHERE id = ?').bind(newBalance, potId),
    ]);
    return this.getById(db, potId);
  },

  async smash(db: D1Database, potId: string, note?: string) {
    const pot = await this.getById(db, potId);
    if (!pot || pot.currentBalance <= 0) return pot;
    const entryId = `ge-smash-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);

    await db.batch([
      db
        .prepare(
          `INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(entryId, potId, 'withdraw', pot.currentBalance, '🔨 Smashed Piggy Bank Payout', date, note || 'Gulak broken & cash withdrawn'),
      db.prepare('UPDATE gulak_pots SET currentBalance = 0 WHERE id = ?').bind(potId),
    ]);
    return this.getById(db, potId);
  },

  async deleteEntry(db: D1Database, id: string) {
    const e = await db.prepare('SELECT * FROM gulak_entries WHERE id = ?').bind(id).first<any>();
    if (!e) return null;
    const pot = await this.getById(db, e.potId);
    const stmts: D1PreparedStatement[] = [
      db.prepare('DELETE FROM gulak_entries WHERE id = ?').bind(id),
    ];
    if (pot) {
      const delta = e.type === 'deposit' ? -Number(e.amount) : Number(e.amount);
      const newBalance = Math.max(0, pot.currentBalance + delta);
      stmts.push(db.prepare('UPDATE gulak_pots SET currentBalance = ? WHERE id = ?').bind(newBalance, e.potId));
    }
    await db.batch(stmts);
    return this.getById(db, e.potId);
  },
};

// ---------------------------------------------------------------------------
// Single-Batch Database Status Query (1 Round-Trip)
// ---------------------------------------------------------------------------
export async function getDatabaseStats(db: D1Database, workerVersion = '1.0.0') {
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as count FROM transactions'),
    db.prepare('SELECT COUNT(*) as count FROM categories'),
    db.prepare('SELECT COUNT(*) as count FROM prorated_rules'),
    db.prepare('SELECT COUNT(*) as count FROM prorated_spends'),
    db.prepare('SELECT COUNT(*) as count FROM savings_goals'),
    db.prepare('SELECT COUNT(*) as count FROM debts'),
    db.prepare('SELECT COUNT(*) as count FROM recurring_items'),
    db.prepare('SELECT COUNT(*) as count FROM gulak_pots'),
  ]);

  const countAt = (idx: number) => Number(((results[idx]?.results || [])[0] as any)?.count || 0);

  return {
    engine: 'Cloudflare D1 (Edge SQLite)',
    databaseFile: 'Cloudflare D1 Binding (DB)',
    fileSizeKb: 0,
    workerVersion,
    tables: {
      transactions: countAt(0),
      categories: countAt(1),
      prorated_rules: countAt(2),
      prorated_spends: countAt(3),
      savings_goals: countAt(4),
      debts: countAt(5),
      recurring_items: countAt(6),
      gulak_pots: countAt(7),
    },
    status: 'online',
    lastSync: new Date().toISOString(),
  };
}
