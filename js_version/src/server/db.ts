import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from '../data/seedData';

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

function query(sql: string, params: any[] = []): any[] {
  if (!db) return [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql: string, params: any[] = []) {
  if (!db) return;
  db.run(sql, params);
  persistDb();
}

export async function initDatabase(): Promise<Database> {
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
  db.exec(`
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
      proratedRuleId TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deleted_transactions (
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
      deleted_at TEXT DEFAULT CURRENT_TIMESTAMP
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

    CREATE TABLE IF NOT EXISTS prorated_spends (
      id TEXT PRIMARY KEY,
      ruleId TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      addToMainTransactions INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      lenderName TEXT,
      debtType TEXT DEFAULT 'borrowed',
      totalPrincipal REAL NOT NULL,
      remainingBalance REAL NOT NULL,
      interestRate REAL DEFAULT 0,
      minimumPayment REAL DEFAULT 0,
      dueDay INTEGER DEFAULT 1,
      notes TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      debtId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      principalPaid REAL NOT NULL,
      interestPaid REAL DEFAULT 0,
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
      dayOfMonth INTEGER DEFAULT 1,
      autoApply INTEGER DEFAULT 1,
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
      selectedMonth TEXT NOT NULL,
      userName TEXT DEFAULT 'User'
    );

    CREATE TABLE IF NOT EXISTS read_alerts (
      alertId TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS gulak_pots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL DEFAULT 0,
      currentBalance REAL DEFAULT 0,
      icon TEXT,
      color TEXT,
      notes TEXT,
      isLocked INTEGER DEFAULT 0,
      lockUntilDate TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gulak_entries (
      id TEXT PRIMARY KEY,
      potId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      breakdown TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(potId) REFERENCES gulak_pots(id) ON DELETE CASCADE
    );
  `);
  try {
    db.run("ALTER TABLE transactions ADD COLUMN proratedRuleId TEXT");
  } catch (e) {}
}

export function resetAllDataToZero() {
  if (!db) return;
  console.log('🧹 Wiping all data to clean zero state in SQLite...');
  run('DELETE FROM transactions');
  run('DELETE FROM deleted_transactions');
  run('DELETE FROM categories');
  run('DELETE FROM prorated_rules');
  run('DELETE FROM prorated_spends');
  run('DELETE FROM savings_goals');
  run('DELETE FROM savings_history');
  run('DELETE FROM debts');
  run('DELETE FROM debt_payments');
  run('DELETE FROM recurring_items');
  run('DELETE FROM read_alerts');
  run('DELETE FROM user_settings');
  run('DELETE FROM gulak_entries');
  run('DELETE FROM gulak_pots');

  const initial = getInitialSeedData();
  for (const cat of initial.categories) {
    run(
      `INSERT OR REPLACE INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
  }
  run(
    `INSERT OR REPLACE INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'default',
      initial.settings.currency,
      initial.settings.currencyCode,
      initial.settings.pushNotificationsEnabled ? 1 : 0,
      initial.settings.dailyBudgetAlertThreshold,
      initial.settings.monthlyBudgetWarningThreshold,
      initial.settings.enableRolloverByDefault ? 1 : 0,
      initial.settings.selectedMonth,
      initial.settings.userName,
    ]
  );
  seedDefaultGulakPots();
  persistDb();
  console.log('✅ Database reset to clean zero records.');
}

function seedDefaultGulakPots() {
  const potsCount = query("SELECT COUNT(*) as count FROM gulak_pots")[0]?.count || 0;
  if (potsCount === 0) {
    run(
      `INSERT OR IGNORE INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pot-main', 'Main Piggy Bank (गुलक)', 10000, 1500, 'PiggyBank', '#10B981', 'Primary digital piggy bank for spare change and secret savings', 0]
    );
    run(
      `INSERT OR IGNORE INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pot-change', 'Daily Loose Change Jar', 2000, 450, 'Coins', '#F59E0B', 'Small daily cash notes & coins stash', 0]
    );
    const date = new Date().toISOString().slice(0, 10);
    run(
      `INSERT OR IGNORE INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['ge-seed-1', 'pot-main', 'deposit', 1500, 'Initial Piggy Bank Deposit', date, 'Saved from cash budget', JSON.stringify({ "500": 3 })]
    );
    run(
      `INSERT OR IGNORE INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['ge-seed-2', 'pot-change', 'deposit', 450, 'Grocery Change', date, 'Spare change dropped in jar', JSON.stringify({ "100": 4, "50": 1 })]
    );
  }
}

function seedIfEmpty() {
  if (!db) return;
  const rows = query('SELECT COUNT(*) as count FROM categories');
  if (rows[0] && rows[0].count > 0) {
    seedDefaultGulakPots();
    return;
  }
  console.log('🌱 Database categories empty. Seeding default categories safely...');
  const initial = getInitialSeedData();
  for (const cat of initial.categories) {
    run(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
  }
  const sRows = query('SELECT COUNT(*) as count FROM user_settings');
  if (!sRows[0] || sRows[0].count === 0) {
    run(
      `INSERT OR IGNORE INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        initial.settings.currency,
        initial.settings.currencyCode,
        initial.settings.pushNotificationsEnabled ? 1 : 0,
        initial.settings.dailyBudgetAlertThreshold,
        initial.settings.monthlyBudgetWarningThreshold,
        initial.settings.enableRolloverByDefault ? 1 : 0,
        initial.settings.selectedMonth,
        initial.settings.userName,
      ]
    );
  }
  seedDefaultGulakPots();
  persistDb();
}

export const transactionRepo = {
  getAll() {
    const rows = query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
      proratedRuleId: r.proratedRuleId || undefined,
    }));
  },
  getById(id: string) {
    const rows = query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
      proratedRuleId: r.proratedRuleId || undefined,
    };
  },
  create(tx: any) {
    run(
      `INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl, proratedRuleId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        tx.proratedRuleId || null,
      ]
    );
    return tx;
  },
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE transactions SET 
         title = ?, amount = ?, type = ?, category = ?, date = ?, 
         tags = ?, notes = ?, paymentMethod = ?, isRecurring = ?, 
         recurringFrequency = ?, receiptUrl = ?, proratedRuleId = ?
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
        merged.proratedRuleId || null,
        id,
      ]
    );
    return merged;
  },
  delete(id: string) {
    const existing = this.getById(id);
    if (existing) {
      run(
        `INSERT INTO deleted_transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
    }
    run('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  },
  bulkInsert(txs: any[]) {
    for (const tx of txs) {
      this.create(tx);
    }
    return txs;
  },
};

export const deletedTransactionRepo = {
  getAll() {
    const rows = query('SELECT * FROM deleted_transactions ORDER BY deleted_at DESC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
    }));
  },
  restore(id: string) {
    const rows = query('SELECT * FROM deleted_transactions WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    const restoredTx = {
      ...r,
      amount: Number(r.amount),
      tags: JSON.parse(r.tags || '[]'),
      isRecurring: Boolean(r.isRecurring),
    };
    run('DELETE FROM deleted_transactions WHERE id = ?', [id]);
    transactionRepo.create(restoredTx);
    return restoredTx;
  },
  emptyTrash() {
    run('DELETE FROM deleted_transactions');
    return true;
  },
};

export const categoryRepo = {
  getAll() {
    const rows = query('SELECT * FROM categories ORDER BY name ASC');
    return rows.map((r) => ({
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    }));
  },
  getById(id: string) {
    const rows = query('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      monthlyBudget: Number(r.monthlyBudget || 0),
      isCustom: Boolean(r.isCustom),
    };
  },
  create(cat: any) {
    run(
      `INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.monthlyBudget || 0, cat.isCustom ? 1 : 0]
    );
    return cat;
  },
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE categories SET name = ?, icon = ?, color = ?, monthlyBudget = ?, isCustom = ? WHERE id = ?`,
      [merged.name, merged.icon, merged.color, merged.monthlyBudget || 0, merged.isCustom ? 1 : 0, id]
    );
    return merged;
  },
  delete(id: string) {
    run('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  },
};

export const proratedRuleRepo = {
  getAll() {
    const rows = query('SELECT * FROM prorated_rules ORDER BY name ASC');
    return rows.map((r) => ({
      ...r,
      monthlyMaxSpend: Number(r.monthlyMaxSpend),
      rolloverEnabled: Boolean(r.rolloverEnabled),
      rolloverAmount: Number(r.rolloverAmount || 0),
      alertThresholdPercent: Number(r.alertThresholdPercent || 100),
      targetTags: JSON.parse(r.targetTags || '[]'),
    }));
  },
  getById(id: string) {
    const rows = query('SELECT * FROM prorated_rules WHERE id = ?', [id]);
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
  create(rule: any) {
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
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
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
  delete(id: string) {
    run('DELETE FROM prorated_spends WHERE ruleId = ?', [id]);
    run('DELETE FROM prorated_rules WHERE id = ?', [id]);
    return true;
  },
};

export const proratedSpendRepo = {
  getAll() {
    const rows = query('SELECT * FROM prorated_spends ORDER BY date DESC, created_at DESC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      addToMainTransactions: Boolean(r.addToMainTransactions),
    }));
  },
  getByRuleId(ruleId: string) {
    const rows = query(
      'SELECT * FROM prorated_spends WHERE ruleId = ? ORDER BY date DESC, created_at DESC',
      [ruleId]
    );
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      addToMainTransactions: Boolean(r.addToMainTransactions),
    }));
  },
  create(spend: any) {
    run(
      `INSERT INTO prorated_spends (id, ruleId, title, amount, date, notes, addToMainTransactions)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        spend.id,
        spend.ruleId,
        spend.title,
        spend.amount,
        spend.date,
        spend.notes || null,
        spend.addToMainTransactions ? 1 : 0,
      ]
    );
    if (spend.addToMainTransactions) {
      const txId = `tx-prorated-${spend.id}`;
      const rule = proratedRuleRepo.getById(spend.ruleId);
      transactionRepo.create({
        id: txId,
        title: spend.title,
        amount: spend.amount,
        type: 'expense',
        category: rule?.categoryId || 'food',
        date: spend.date,
        tags: ['prorated'],
        notes: spend.notes || `Prorated spend for ${rule?.name || spend.ruleId}`,
        paymentMethod: 'credit_card',
        isRecurring: false,
        proratedRuleId: spend.ruleId,
      });
    }
    return spend;
  },
  delete(id: string) {
    run('DELETE FROM prorated_spends WHERE id = ?', [id]);
    run('DELETE FROM transactions WHERE id = ?', [`tx-prorated-${id}`]);
    return true;
  },
};

export const savingsRepo = {
  getAll() {
    const goals = query('SELECT * FROM savings_goals ORDER BY targetDate ASC');
    const allHistory = query('SELECT * FROM savings_history ORDER BY date DESC');
    return goals.map((g) => {
      const history = allHistory
        .filter((h) => h.goalId === g.id)
        .map((h) => ({
          id: h.id,
          date: h.date,
          amount: Number(h.amount),
          note: h.note,
          type: h.type,
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
  getById(id: string) {
    const rows = query('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const g = rows[0];
    const history = query(
      'SELECT * FROM savings_history WHERE goalId = ? ORDER BY date DESC',
      [id]
    ).map((h) => ({
      id: h.id,
      date: h.date,
      amount: Number(h.amount),
      note: h.note,
      type: h.type,
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
  },
  create(goal: any) {
    const fullGoal = {
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
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
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
  delete(id: string) {
    run('DELETE FROM savings_history WHERE goalId = ?', [id]);
    run('DELETE FROM savings_goals WHERE id = ?', [id]);
    return true;
  },
  addContribution(goalId: string, item: any) {
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

export const debtRepo = {
  getAll() {
    const debts = query('SELECT * FROM debts ORDER BY dueDay ASC');
    const allPayments = query('SELECT * FROM debt_payments ORDER BY date DESC');
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
        lenderName: d.lenderName || undefined,
        debtType: d.debtType || 'borrowed',
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
  getById(id: string) {
    const rows = query('SELECT * FROM debts WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const d = rows[0];
    const payments = query('SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC', [
      id,
    ]).map((p) => ({
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
      lenderName: d.lenderName || undefined,
      debtType: d.debtType || 'borrowed',
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
  create(debt: any) {
    const fullDebt = {
      ...debt,
      debtType: debt.debtType || 'borrowed',
      remainingBalance: debt.remainingBalance ?? debt.totalPrincipal,
      payments: debt.payments || [],
    };
    run(
      `INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        fullDebt.color || null,
      ]
    );
    return fullDebt;
  },
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE debts SET 
         name = ?, lenderName = ?, debtType = ?, totalPrincipal = ?, remainingBalance = ?, 
         interestRate = ?, minimumPayment = ?, dueDay = ?, 
         notes = ?, color = ?
        WHERE id = ?`,
      [
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
        id,
      ]
    );
    return merged;
  },
  delete(id: string) {
    run('DELETE FROM debt_payments WHERE debtId = ?', [id]);
    run('DELETE FROM debts WHERE id = ?', [id]);
    return true;
  },
  recordPayment(debtId: string, payment: any) {
    const existing = this.getById(debtId);
    if (!existing) return null;
    run(
      `INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        debtId,
        payment.date,
        payment.amount,
        payment.principalPaid,
        payment.interestPaid,
        payment.note || null,
      ]
    );
    const newBalance = Math.max(0, existing.remainingBalance - payment.principalPaid);
    run(`UPDATE debts SET remainingBalance = ? WHERE id = ?`, [newBalance, debtId]);
    return this.getById(debtId);
  },
  deletePayment(debtId: string, paymentId: string) {
    const existingPayment = query(
      'SELECT * FROM debt_payments WHERE id = ? AND debtId = ?',
      [paymentId, debtId]
    );
    if (existingPayment.length === 0) return null;
    const p = existingPayment[0];
    run('DELETE FROM debt_payments WHERE id = ?', [paymentId]);
    const debt = this.getById(debtId);
    if (debt) {
      const newBalance = Math.min(debt.totalPrincipal, debt.remainingBalance + Number(p.principalPaid));
      run('UPDATE debts SET remainingBalance = ? WHERE id = ?', [newBalance, debtId]);
    }
    return this.getById(debtId);
  },
};

export const recurringRepo = {
  getAll() {
    const rows = query('SELECT * FROM recurring_items ORDER BY dayOfMonth ASC');
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      dayOfMonth: Number(r.dayOfMonth),
      autoApply: Boolean(r.autoApply),
      isActive: Boolean(r.isActive),
      tags: JSON.parse(r.tags || '[]'),
    }));
  },
  getById(id: string) {
    const rows = query('SELECT * FROM recurring_items WHERE id = ?', [id]);
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
  create(item: any) {
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
  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
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
  delete(id: string) {
    run('DELETE FROM recurring_items WHERE id = ?', [id]);
    return true;
  },
};

export const settingsRepo = {
  get() {
    const rows = query('SELECT * FROM user_settings LIMIT 1');
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
  update(updates: any) {
    const existing = this.get();
    const merged = { ...existing, ...updates };
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

export const readAlertsRepo = {
  getAllReadIds() {
    const rows = query('SELECT alertId FROM read_alerts');
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

export const gulakRepo = {
  getAll() {
    const pots = query('SELECT * FROM gulak_pots ORDER BY created_at ASC');
    const entries = query('SELECT * FROM gulak_entries ORDER BY date DESC, created_at DESC');
    return pots.map((p: any) => {
      const potEntries = entries
        .filter((e: any) => e.potId === p.id)
        .map((e: any) => ({
          id: e.id,
          potId: e.potId,
          type: e.type,
          amount: Number(e.amount),
          title: e.title,
          date: e.date,
          notes: e.notes || undefined,
          breakdown: e.breakdown ? JSON.parse(e.breakdown) : undefined,
          created_at: e.created_at,
        }));
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
        entries: potEntries,
      };
    });
  },

  getById(id: string) {
    const pots = query('SELECT * FROM gulak_pots WHERE id = ?', [id]);
    if (pots.length === 0) return null;
    const p = pots[0];
    const entries = query('SELECT * FROM gulak_entries WHERE potId = ? ORDER BY date DESC, created_at DESC', [id]).map(
      (e: any) => ({
        id: e.id,
        potId: e.potId,
        type: e.type,
        amount: Number(e.amount),
        title: e.title,
        date: e.date,
        notes: e.notes || undefined,
        breakdown: e.breakdown ? JSON.parse(e.breakdown) : undefined,
        created_at: e.created_at,
      })
    );
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
      entries,
    };
  },

  create(pot: any) {
    const id = pot.id || `pot-${Date.now()}`;
    run(
      `INSERT INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked, lockUntilDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        pot.name,
        pot.targetAmount || 0,
        pot.currentBalance || 0,
        pot.icon || 'PiggyBank',
        pot.color || '#10B981',
        pot.notes || null,
        pot.isLocked ? 1 : 0,
        pot.lockUntilDate || null,
      ]
    );
    return this.getById(id);
  },

  update(id: string, updates: any) {
    const existing = this.getById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE gulak_pots SET 
       name = ?, targetAmount = ?, currentBalance = ?, icon = ?, color = ?, notes = ?, isLocked = ?, lockUntilDate = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.targetAmount || 0,
        merged.currentBalance || 0,
        merged.icon || 'PiggyBank',
        merged.color || '#10B981',
        merged.notes || null,
        merged.isLocked ? 1 : 0,
        merged.lockUntilDate || null,
        id,
      ]
    );
    return this.getById(id);
  },

  delete(id: string) {
    run('DELETE FROM gulak_entries WHERE potId = ?', [id]);
    run('DELETE FROM gulak_pots WHERE id = ?', [id]);
    return true;
  },

  addEntry(potId: string, entry: any) {
    const pot = this.getById(potId);
    if (!pot) return null;
    const entryId = entry.id || `ge-${Date.now()}`;
    const amount = Number(entry.amount);
    const type = entry.type === 'withdraw' ? 'withdraw' : 'deposit';
    const breakdown = entry.breakdown ? JSON.stringify(entry.breakdown) : '{}';

    run(
      `INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        potId,
        type,
        amount,
        entry.title || (type === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'),
        entry.date || new Date().toISOString().slice(0, 10),
        entry.notes || null,
        breakdown,
      ]
    );

    const delta = type === 'deposit' ? amount : -amount;
    const newBalance = Math.max(0, pot.currentBalance + delta);
    run('UPDATE gulak_pots SET currentBalance = ? WHERE id = ?', [newBalance, potId]);

    return this.getById(potId);
  },

  smash(potId: string, note?: string) {
    const pot = this.getById(potId);
    if (!pot || pot.currentBalance <= 0) return pot;
    const amount = pot.currentBalance;
    const entryId = `ge-smash-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const title = `🔨 Smashed Piggy Bank Payout`;

    run(
      `INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entryId, potId, 'withdraw', amount, title, date, note || 'Gulak broken & cash withdrawn']
    );

    run('UPDATE gulak_pots SET currentBalance = 0 WHERE id = ?', [potId]);
    return this.getById(potId);
  },

  deleteEntry(id: string) {
    const rows = query('SELECT * FROM gulak_entries WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const e = rows[0];
    const potId = e.potId;
    const amount = Number(e.amount);
    const type = e.type;

    run('DELETE FROM gulak_entries WHERE id = ?', [id]);

    const pot = this.getById(potId);
    if (pot) {
      const delta = type === 'deposit' ? -amount : amount;
      const newBalance = Math.max(0, pot.currentBalance + delta);
      run('UPDATE gulak_pots SET currentBalance = ? WHERE id = ?', [newBalance, potId]);
    }
    return this.getById(potId);
  },
};

export function getDatabaseStats() {
  const txCount = query('SELECT COUNT(*) as count FROM transactions')[0]?.count || 0;
  const catCount = query('SELECT COUNT(*) as count FROM categories')[0]?.count || 0;
  const rulesCount = query('SELECT COUNT(*) as count FROM prorated_rules')[0]?.count || 0;
  const proratedSpendsCount = query('SELECT COUNT(*) as count FROM prorated_spends')[0]?.count || 0;
  const savingsCount = query('SELECT COUNT(*) as count FROM savings_goals')[0]?.count || 0;
  const debtCount = query('SELECT COUNT(*) as count FROM debts')[0]?.count || 0;
  const recCount = query('SELECT COUNT(*) as count FROM recurring_items')[0]?.count || 0;
  const gulakCount = query('SELECT COUNT(*) as count FROM gulak_pots')[0]?.count || 0;

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
      prorated_spends: proratedSpendsCount,
      savings_goals: savingsCount,
      debts: debtCount,
      recurring_items: recCount,
      gulak_pots: gulakCount,
    },
    status: 'online',
    lastSync: new Date().toISOString(),
  };
}
