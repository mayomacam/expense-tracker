import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  Transaction,
  Category,
  ProratedBudgetRule,
  SavingsGoal,
  DebtItem,
  RecurringItem,
  UserSettings,
} from '../types';
import { getInitialSeedData, getDemoSeedData, DEFAULT_CATEGORIES } from '../data/seedData';

let db: Database | null = null;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'budget.sqlite');

function persistDb() {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(filebuffer);
      console.log('✅ SQLite database loaded successfully from disk:', DB_FILE);
    } catch (e) {
      console.error('Error loading existing SQLite db file, creating new:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('🌱 Creating new SQLite database at:', DB_FILE);
  }

  createSchema();
  seedIfEmpty();
  return db;
}

function createSchema() {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      monthlyBudget REAL DEFAULT 0,
      isCustom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      notes TEXT,
      paymentMethod TEXT NOT NULL,
      isRecurring INTEGER DEFAULT 0,
      recurringFrequency TEXT,
      receiptUrl TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prorated_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT,
      targetTags TEXT DEFAULT '[]',
      monthlyMaxSpend REAL NOT NULL,
      month TEXT NOT NULL,
      rolloverEnabled INTEGER DEFAULT 0,
      rolloverAmount REAL DEFAULT 0,
      alertThresholdPercent REAL DEFAULT 100,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL DEFAULT 0,
      targetDate TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      category TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS savings_history (
      id TEXT PRIMARY KEY,
      goalId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      type TEXT NOT NULL,
      FOREIGN KEY(goalId) REFERENCES savings_goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
<<<<<<< HEAD
      lenderName TEXT,
      debtType TEXT DEFAULT 'borrowed',
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      totalPrincipal REAL NOT NULL,
      remainingBalance REAL NOT NULL,
      interestRate REAL NOT NULL,
      minimumPayment REAL NOT NULL,
      dueDay INTEGER NOT NULL,
      notes TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      debtId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      principalPaid REAL NOT NULL,
      interestPaid REAL NOT NULL,
      note TEXT,
      FOREIGN KEY(debtId) REFERENCES debts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurring_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL,
      dayOfMonth INTEGER NOT NULL,
      autoApply INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      paymentMethod TEXT NOT NULL,
      lastAppliedMonth TEXT,
      isActive INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      currency TEXT DEFAULT '₹',
      currencyCode TEXT DEFAULT 'INR',
      pushNotificationsEnabled INTEGER DEFAULT 1,
      dailyBudgetAlertThreshold REAL DEFAULT 100,
      monthlyBudgetWarningThreshold REAL DEFAULT 80,
      enableRolloverByDefault INTEGER DEFAULT 1,
      selectedMonth TEXT,
      userName TEXT DEFAULT 'Financial Explorer'
    );

    CREATE TABLE IF NOT EXISTS read_alerts (
      alertId TEXT PRIMARY KEY,
      readAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  persistDb();
}

function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  persistDb();
}

function seedIfEmpty() {
  const catCount = query<{ count: number }>('SELECT COUNT(*) as count FROM categories')[0]?.count || 0;
  if (catCount === 0) {
    console.log('⚡ SQLite is empty. Seeding initial data from seedData.ts...');
    resetToSeedData();
  }
}

export function resetToSeedData() {
  if (!db) throw new Error('Database not initialized');

  db.run(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM prorated_rules;
    DELETE FROM savings_history;
    DELETE FROM savings_goals;
    DELETE FROM debt_payments;
    DELETE FROM debts;
    DELETE FROM recurring_items;
    DELETE FROM user_settings;
    DELETE FROM read_alerts;
  `);

  const seed = getInitialSeedData();

  // Categories
  for (const cat of seed.categories) {
    run(
      `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
  }

  // Transactions
  for (const tx of seed.transactions) {
    run(
      `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );
  }

  // Prorated Rules
  for (const rule of seed.proratedRules) {
    run(
      `INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.id,
        rule.name,
        rule.categoryId || null,
        JSON.stringify(rule.targetTags || []),
        rule.monthlyMaxSpend,
        rule.month,
        rule.rolloverEnabled ? 1 : 0,
        rule.rolloverAmount || 0,
        rule.alertThresholdPercent || 100,
        rule.notes || null,
      ]
    );
  }

  // Savings Goals + History
  for (const goal of seed.savingsGoals) {
    run(
      `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.targetDate,
        goal.icon || null,
        goal.color || null,
        goal.category || null,
        goal.notes || null,
      ]
    );

    if (goal.history && goal.history.length > 0) {
      for (const h of goal.history) {
        run(
          `INSERT INTO savings_history (id, goalId, date, amount, note, type) VALUES (?, ?, ?, ?, ?, ?)`,
          [h.id, goal.id, h.date, h.amount, h.note || null, h.type]
        );
      }
    }
  }

  // Debts + Payments
  for (const debt of seed.debts) {
    run(
      `INSERT INTO debts (id, name, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debt.id,
        debt.name,
        debt.totalPrincipal,
        debt.remainingBalance,
        debt.interestRate,
        debt.minimumPayment,
        debt.dueDay,
        debt.notes || null,
        debt.color || null,
      ]
    );

    if (debt.payments && debt.payments.length > 0) {
      for (const p of debt.payments) {
        run(
          `INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.id, debt.id, p.date, p.amount, p.principalPaid, p.interestPaid, p.note || null]
        );
      }
    }
  }

  // Recurring
  for (const rec of seed.recurring) {
    run(
      `INSERT INTO recurring_items (id, title, amount, type, category, frequency, dayOfMonth, autoApply, tags, paymentMethod, lastAppliedMonth, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.id,
        rec.title,
        rec.amount,
        rec.type,
        rec.category,
        rec.frequency,
        rec.dayOfMonth,
        rec.autoApply ? 1 : 0,
        JSON.stringify(rec.tags || []),
        rec.paymentMethod,
        rec.lastAppliedMonth || null,
        rec.isActive ? 1 : 0,
      ]
    );
  }

  // User Settings
  run(
    `INSERT INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'default',
      seed.settings.currency,
      seed.settings.currencyCode,
      seed.settings.pushNotificationsEnabled ? 1 : 0,
      seed.settings.dailyBudgetAlertThreshold,
      seed.settings.monthlyBudgetWarningThreshold,
      seed.settings.enableRolloverByDefault ? 1 : 0,
      seed.settings.selectedMonth,
      seed.settings.userName,
    ]
  );

  persistDb();
  console.log('✅ SQLite seeded successfully with clean initial zero records.');
}

/**
 * Explicitly reset all database data to clean zero-slate
 */
export function resetAllDataToZero() {
  resetToSeedData();
}

/**
 * Populate demo sample transactions, goals, debts, and rules
 */
export function populateDemoData() {
  if (!db) throw new Error('Database not initialized');

  db.run(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM prorated_rules;
    DELETE FROM savings_history;
    DELETE FROM savings_goals;
    DELETE FROM debt_payments;
    DELETE FROM debts;
    DELETE FROM recurring_items;
    DELETE FROM user_settings;
    DELETE FROM read_alerts;
  `);

  const demo = getDemoSeedData();

  // Categories
  for (const cat of demo.categories) {
    run(
      `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
  }

  // Transactions
  for (const tx of demo.transactions) {
    run(
      `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );
  }

  // Prorated Rules
  for (const rule of demo.proratedRules) {
    run(
      `INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.id,
        rule.name,
        rule.categoryId || null,
        JSON.stringify(rule.targetTags || []),
        rule.monthlyMaxSpend,
        rule.month,
        rule.rolloverEnabled ? 1 : 0,
        rule.rolloverAmount || 0,
        rule.alertThresholdPercent || 100,
        rule.notes || null,
      ]
    );
  }

  // Savings Goals + History
  for (const goal of demo.savingsGoals) {
    run(
      `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.targetDate,
        goal.icon || null,
        goal.color || null,
        goal.category || null,
        goal.notes || null,
      ]
    );

    if (goal.history && goal.history.length > 0) {
      for (const h of goal.history) {
        run(
          `INSERT INTO savings_history (id, goalId, date, amount, note, type) VALUES (?, ?, ?, ?, ?, ?)`,
          [h.id, goal.id, h.date, h.amount, h.note || null, h.type]
        );
      }
    }
  }

  // Debts + Payments
  for (const debt of demo.debts) {
    run(
<<<<<<< HEAD
      `INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debt.id,
        debt.name,
        debt.lenderName || null,
        debt.debtType || 'borrowed',
=======
      `INSERT INTO debts (id, name, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debt.id,
        debt.name,
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        debt.totalPrincipal,
        debt.remainingBalance,
        debt.interestRate,
        debt.minimumPayment,
        debt.dueDay,
        debt.notes || null,
        debt.color || null,
      ]
    );

    if (debt.payments && debt.payments.length > 0) {
      for (const p of debt.payments) {
        run(
          `INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.id, debt.id, p.date, p.amount, p.principalPaid, p.interestPaid, p.note || null]
        );
      }
    }
  }

  // Recurring
  for (const rec of demo.recurring) {
    run(
      `INSERT INTO recurring_items (id, title, amount, type, category, frequency, dayOfMonth, autoApply, tags, paymentMethod, lastAppliedMonth, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.id,
        rec.title,
        rec.amount,
        rec.type,
        rec.category,
        rec.frequency,
        rec.dayOfMonth,
        rec.autoApply ? 1 : 0,
        JSON.stringify(rec.tags || []),
        rec.paymentMethod,
        rec.lastAppliedMonth || null,
        rec.isActive ? 1 : 0,
      ]
    );
  }

  // User Settings
  run(
    `INSERT INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'default',
      demo.settings.currency,
      demo.settings.currencyCode,
      demo.settings.pushNotificationsEnabled ? 1 : 0,
      demo.settings.dailyBudgetAlertThreshold,
      demo.settings.monthlyBudgetWarningThreshold,
      demo.settings.enableRolloverByDefault ? 1 : 0,
      demo.settings.selectedMonth,
      demo.settings.userName,
    ]
  );

  persistDb();
  console.log('✅ SQLite seeded with demo sample records.');
}

// =================== CRUD REPOSITORIES ===================

// --- TRANSACTIONS ---
export const transactionRepo = {
  getAll(): Transaction[] {
    const rows = query<any>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
    }));
  },
  getById(id: string): Transaction | null {
    const rows = query<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
    };
  },
  create(tx: Transaction): Transaction {
    run(
      `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );
    return tx;
  },
  update(id: string, updates: Partial<Transaction>): Transaction | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: Transaction = { ...existing, ...updates };
    run(
      `UPDATE transactions SET 
        title = ?, amount = ?, type = ?, category = ?, date = ?, 
        tags = ?, notes = ?, paymentMethod = ?, isRecurring = ?, 
        recurringFrequency = ?, receiptUrl = ?
       WHERE id = ?`,
      [
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
        id,
      ]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  },
  bulkInsert(txs: Transaction[]): Transaction[] {
    for (const tx of txs) {
      this.create(tx);
    }
    return txs;
  },
};

// --- CATEGORIES ---
export const categoryRepo = {
  getAll(): Category[] {
    const rows = query<any>('SELECT * FROM categories ORDER BY name ASC');
    return rows.map((r) => ({
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    }));
  },
  getById(id: string): Category | null {
    const rows = query<any>('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    };
  },
  create(cat: Category): Category {
    run(
      `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
    return cat;
  },
  update(id: string, updates: Partial<Category>): Category | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: Category = { ...existing, ...updates };
    run(
      `UPDATE categories SET name = ?, icon = ?, color = ?, monthlyBudget = ?, isCustom = ? WHERE id = ?`,
      [merged.name, merged.icon, merged.color, merged.monthlyBudget || 0, merged.isCustom ? 1 : 0, id]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  },
};

// --- PRORATED RULES ---
export const proratedRuleRepo = {
  getAll(): ProratedBudgetRule[] {
    const rows = query<any>('SELECT * FROM prorated_rules ORDER BY name ASC');
    return rows.map((r) => ({
      ...r,
      monthlyMaxSpend: Number(r.monthlyMaxSpend),
      rolloverEnabled: Boolean(r.rolloverEnabled),
      rolloverAmount: Number(r.rolloverAmount || 0),
      alertThresholdPercent: Number(r.alertThresholdPercent || 100),
      targetTags: JSON.parse(r.targetTags || '[]'),
    }));
  },
  getById(id: string): ProratedBudgetRule | null {
    const rows = query<any>('SELECT * FROM prorated_rules WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      monthlyMaxSpend: Number(r.monthlyMaxSpend),
      rolloverEnabled: Boolean(r.rolloverEnabled),
      rolloverAmount: Number(r.rolloverAmount || 0),
      alertThresholdPercent: Number(r.alertThresholdPercent || 100),
      targetTags: JSON.parse(r.targetTags || '[]'),
    };
  },
  create(rule: ProratedBudgetRule): ProratedBudgetRule {
    run(
      `INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.id,
        rule.name,
        rule.categoryId || null,
        JSON.stringify(rule.targetTags || []),
        rule.monthlyMaxSpend,
        rule.month,
        rule.rolloverEnabled ? 1 : 0,
        rule.rolloverAmount || 0,
        rule.alertThresholdPercent || 100,
        rule.notes || null,
      ]
    );
    return rule;
  },
  update(id: string, updates: Partial<ProratedBudgetRule>): ProratedBudgetRule | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: ProratedBudgetRule = { ...existing, ...updates };
    run(
      `UPDATE prorated_rules SET 
        name = ?, categoryId = ?, targetTags = ?, monthlyMaxSpend = ?, 
        month = ?, rolloverEnabled = ?, rolloverAmount = ?, 
        alertThresholdPercent = ?, notes = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.categoryId || null,
        JSON.stringify(merged.targetTags || []),
        merged.monthlyMaxSpend,
        merged.month,
        merged.rolloverEnabled ? 1 : 0,
        merged.rolloverAmount || 0,
        merged.alertThresholdPercent || 100,
        merged.notes || null,
        id,
      ]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM prorated_rules WHERE id = ?', [id]);
    return true;
  },
};

// --- SAVINGS GOALS ---
export const savingsRepo = {
  getAll(): SavingsGoal[] {
    const goals = query<any>('SELECT * FROM savings_goals ORDER BY targetDate ASC');
    const allHistory = query<any>('SELECT * FROM savings_history ORDER BY date DESC');

    return goals.map((g) => {
      const history = allHistory
        .filter((h) => h.goalId === g.id)
        .map((h) => ({
          id: h.id,
          date: h.date,
          amount: Number(h.amount),
          note: h.note,
          type: h.type as 'deposit' | 'withdrawal',
        }));

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
        history,
      };
    });
  },
  getById(id: string): SavingsGoal | null {
    const rows = query<any>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const g = rows[0];
    const history = query<any>('SELECT * FROM savings_history WHERE goalId = ? ORDER BY date DESC', [id]).map(
      (h) => ({
        id: h.id,
        date: h.date,
        amount: Number(h.amount),
        note: h.note,
        type: h.type as 'deposit' | 'withdrawal',
      })
    );
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
      history,
    };
  },
  create(goal: Omit<SavingsGoal, 'currentAmount' | 'history'> & { currentAmount?: number; history?: any[] }): SavingsGoal {
    const fullGoal: SavingsGoal = {
      ...goal,
      currentAmount: goal.currentAmount || 0,
      history: goal.history || [],
    };
    run(
      `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullGoal.id,
        fullGoal.name,
        fullGoal.targetAmount,
        fullGoal.currentAmount,
        fullGoal.targetDate,
        fullGoal.icon || null,
        fullGoal.color || null,
        fullGoal.category || null,
        fullGoal.notes || null,
      ]
    );
    return fullGoal;
  },
  update(id: string, updates: Partial<SavingsGoal>): SavingsGoal | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: SavingsGoal = { ...existing, ...updates };
    run(
      `UPDATE savings_goals SET 
        name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?, 
        icon = ?, color = ?, category = ?, notes = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.targetAmount,
        merged.currentAmount,
        merged.targetDate,
        merged.icon || null,
        merged.color || null,
        merged.category || null,
        merged.notes || null,
        id,
      ]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM savings_history WHERE goalId = ?', [id]);
    run('DELETE FROM savings_goals WHERE id = ?', [id]);
    return true;
  },
  addContribution(goalId: string, item: { id: string; date: string; amount: number; note?: string; type: 'deposit' | 'withdrawal' }): SavingsGoal | null {
    const existing = this.getById(goalId);
    if (!existing) return null;

    run(
      `INSERT INTO savings_history (id, goalId, date, amount, note, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [item.id, goalId, item.date, item.amount, item.note || null, item.type]
    );

    const delta = item.type === 'deposit' ? item.amount : -item.amount;
    const newCurrent = Math.max(0, existing.currentAmount + delta);

    run(`UPDATE savings_goals SET currentAmount = ? WHERE id = ?`, [newCurrent, goalId]);
    return this.getById(goalId);
  },
};

// --- DEBTS ---
export const debtRepo = {
  getAll(): DebtItem[] {
    const debts = query<any>('SELECT * FROM debts ORDER BY dueDay ASC');
    const allPayments = query<any>('SELECT * FROM debt_payments ORDER BY date DESC');

    return debts.map((d) => {
      const payments = allPayments
        .filter((p) => p.debtId === d.id)
        .map((p) => ({
          id: p.id,
          date: p.date,
          amount: Number(p.amount),
          principalPaid: Number(p.principalPaid),
          interestPaid: Number(p.interestPaid),
          note: p.note,
        }));

      return {
        id: d.id,
        name: d.name,
<<<<<<< HEAD
        lenderName: d.lenderName || undefined,
        debtType: (d.debtType as 'borrowed' | 'lent') || 'borrowed',
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        totalPrincipal: Number(d.totalPrincipal),
        remainingBalance: Number(d.remainingBalance),
        interestRate: Number(d.interestRate),
        minimumPayment: Number(d.minimumPayment),
        dueDay: Number(d.dueDay),
        notes: d.notes || undefined,
        color: d.color || undefined,
        payments,
      };
    });
  },
  getById(id: string): DebtItem | null {
    const rows = query<any>('SELECT * FROM debts WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const d = rows[0];
    const payments = query<any>('SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC', [id]).map((p) => ({
      id: p.id,
      date: p.date,
      amount: Number(p.amount),
      principalPaid: Number(p.principalPaid),
      interestPaid: Number(p.interestPaid),
      note: p.note,
    }));
    return {
      id: d.id,
      name: d.name,
<<<<<<< HEAD
      lenderName: d.lenderName || undefined,
      debtType: (d.debtType as 'borrowed' | 'lent') || 'borrowed',
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      totalPrincipal: Number(d.totalPrincipal),
      remainingBalance: Number(d.remainingBalance),
      interestRate: Number(d.interestRate),
      minimumPayment: Number(d.minimumPayment),
      dueDay: Number(d.dueDay),
      notes: d.notes || undefined,
      color: d.color || undefined,
      payments,
    };
  },
  create(debt: Omit<DebtItem, 'remainingBalance' | 'payments'> & { remainingBalance?: number; payments?: any[] }): DebtItem {
    const fullDebt: DebtItem = {
      ...debt,
<<<<<<< HEAD
      debtType: debt.debtType || 'borrowed',
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      remainingBalance: debt.remainingBalance ?? debt.totalPrincipal,
      payments: debt.payments || [],
    };
    run(
<<<<<<< HEAD
      `INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullDebt.id,
        fullDebt.name,
        fullDebt.lenderName || null,
        fullDebt.debtType || 'borrowed',
=======
      `INSERT INTO debts (id, name, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullDebt.id,
        fullDebt.name,
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        fullDebt.totalPrincipal,
        fullDebt.remainingBalance,
        fullDebt.interestRate,
        fullDebt.minimumPayment,
        fullDebt.dueDay,
        fullDebt.notes || null,
        fullDebt.color || null,
      ]
    );
    return fullDebt;
  },
  update(id: string, updates: Partial<DebtItem>): DebtItem | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: DebtItem = { ...existing, ...updates };
    run(
      `UPDATE debts SET 
<<<<<<< HEAD
        name = ?, lenderName = ?, debtType = ?, totalPrincipal = ?, remainingBalance = ?, 
=======
        name = ?, totalPrincipal = ?, remainingBalance = ?, 
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        interestRate = ?, minimumPayment = ?, dueDay = ?, 
        notes = ?, color = ?
       WHERE id = ?`,
      [
        merged.name,
<<<<<<< HEAD
        merged.lenderName || null,
        merged.debtType || 'borrowed',
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        merged.totalPrincipal,
        merged.remainingBalance,
        merged.interestRate,
        merged.minimumPayment,
        merged.dueDay,
        merged.notes || null,
        merged.color || null,
        id,
      ]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM debt_payments WHERE debtId = ?', [id]);
    run('DELETE FROM debts WHERE id = ?', [id]);
    return true;
  },
  recordPayment(debtId: string, payment: { id: string; date: string; amount: number; principalPaid: number; interestPaid: number; note?: string }): DebtItem | null {
    const existing = this.getById(debtId);
    if (!existing) return null;

    run(
      `INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payment.id, debtId, payment.date, payment.amount, payment.principalPaid, payment.interestPaid, payment.note || null]
    );

    const newBalance = Math.max(0, existing.remainingBalance - payment.principalPaid);
    run(`UPDATE debts SET remainingBalance = ? WHERE id = ?`, [newBalance, debtId]);
    return this.getById(debtId);
  },
};

// --- RECURRING ITEMS ---
export const recurringRepo = {
  getAll(): RecurringItem[] {
    const rows = query<any>('SELECT * FROM recurring_items ORDER BY dayOfMonth ASC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      dayOfMonth: Number(r.dayOfMonth),
      autoApply: Boolean(r.autoApply),
      isActive: Boolean(r.isActive),
      tags: JSON.parse(r.tags || '[]'),
    }));
  },
  getById(id: string): RecurringItem | null {
    const rows = query<any>('SELECT * FROM recurring_items WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      amount: Number(r.amount),
      dayOfMonth: Number(r.dayOfMonth),
      autoApply: Boolean(r.autoApply),
      isActive: Boolean(r.isActive),
      tags: JSON.parse(r.tags || '[]'),
    };
  },
  create(item: RecurringItem): RecurringItem {
    run(
      `INSERT INTO recurring_items (id, title, amount, type, category, frequency, dayOfMonth, autoApply, tags, paymentMethod, lastAppliedMonth, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        item.isActive ? 1 : 0,
      ]
    );
    return item;
  },
  update(id: string, updates: Partial<RecurringItem>): RecurringItem | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged: RecurringItem = { ...existing, ...updates };
    run(
      `UPDATE recurring_items SET 
        title = ?, amount = ?, type = ?, category = ?, 
        frequency = ?, dayOfMonth = ?, autoApply = ?, 
        tags = ?, paymentMethod = ?, lastAppliedMonth = ?, 
        isActive = ?
       WHERE id = ?`,
      [
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
        id,
      ]
    );
    return merged;
  },
  delete(id: string): boolean {
    run('DELETE FROM recurring_items WHERE id = ?', [id]);
    return true;
  },
};

// --- USER SETTINGS ---
export const settingsRepo = {
  get(): UserSettings {
    const rows = query<any>('SELECT * FROM user_settings LIMIT 1');
    if (rows.length === 0) {
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
    const r = rows[0];
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
  update(updates: Partial<UserSettings>): UserSettings {
    const existing = this.get();
    const merged: UserSettings = { ...existing, ...updates };
    run(
      `INSERT OR REPLACE INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        merged.currency,
        merged.currencyCode,
        merged.pushNotificationsEnabled ? 1 : 0,
        merged.dailyBudgetAlertThreshold,
        merged.monthlyBudgetWarningThreshold,
        merged.enableRolloverByDefault ? 1 : 0,
        merged.selectedMonth,
        merged.userName,
      ]
    );
    return merged;
  },
};

// --- READ ALERTS ---
export const readAlertsRepo = {
  getAllReadIds(): string[] {
    const rows = query<{ alertId: string }>('SELECT alertId FROM read_alerts');
    return rows.map((r) => r.alertId);
  },
  markRead(alertId: string) {
    run('INSERT OR IGNORE INTO read_alerts (alertId) VALUES (?)', [alertId]);
  },
  markAllRead(alertIds: string[]) {
    for (const id of alertIds) {
      this.markRead(id);
    }
  },
  clearAll() {
    run('DELETE FROM read_alerts');
  },
};

// --- DATABASE STATUS & STATS ---
export function getDatabaseStats() {
  const txCount = query<{ count: number }>('SELECT COUNT(*) as count FROM transactions')[0]?.count || 0;
  const catCount = query<{ count: number }>('SELECT COUNT(*) as count FROM categories')[0]?.count || 0;
  const rulesCount = query<{ count: number }>('SELECT COUNT(*) as count FROM prorated_rules')[0]?.count || 0;
  const savingsCount = query<{ count: number }>('SELECT COUNT(*) as count FROM savings_goals')[0]?.count || 0;
  const debtCount = query<{ count: number }>('SELECT COUNT(*) as count FROM debts')[0]?.count || 0;
  const recCount = query<{ count: number }>('SELECT COUNT(*) as count FROM recurring_items')[0]?.count || 0;

  let fileSizeKb = 0;
  if (fs.existsSync(DB_FILE)) {
    try {
      const stat = fs.statSync(DB_FILE);
      fileSizeKb = Math.round(stat.size / 1024);
    } catch {}
  }

  return {
    engine: 'SQLite (sql.js WASM + File Persistence)',
    databaseFile: 'data/budget.sqlite',
    fileSizeKb,
    tables: {
      transactions: txCount,
      categories: catCount,
      prorated_rules: rulesCount,
      savings_goals: savingsCount,
      debts: debtCount,
      recurring_items: recCount,
    },
    status: 'online',
    lastSync: new Date().toISOString(),
  };
}
