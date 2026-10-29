import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  resetAllDataToZero,
  transactionRepo,
  deletedTransactionRepo,
  categoryRepo,
  proratedRuleRepo,
  proratedSpendRepo,
  savingsRepo,
  debtRepo,
  recurringRepo,
  settingsRepo,
  readAlertsRepo,
  gulakRepo,
  getDatabaseStats,
} from './src/server/db';
import {
  securityHeadersMiddleware,
  createRateLimiter,
  validateAndSanitizeTransaction,
  isValidId,
  sanitizeText,
} from './src/server/security';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function getExpectedResetPassword(): string {
  const secretFilePath = process.env.RESET_PASSWORD_FILE || path.join(process.cwd(), 'data', '.secret_reset_password.key');
  try {
    if (fs.existsSync(secretFilePath)) {
      const pass = fs.readFileSync(secretFilePath, 'utf-8').trim();
      if (pass) return pass;
    }
  } catch (err) {
    console.warn('Warning reading password file:', err);
  }

  const defaultPass = process.env.RESET_PASSWORD || 'admin123';
  try {
    const dir = path.dirname(secretFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(secretFilePath, defaultPass, 'utf-8');
    console.log(`🔐 Persistent reset password file initialized at: ${secretFilePath}`);
  } catch (err) {
    // Ignore file system write errors
  }
  return defaultPass;
}

// ---------------------------------------------------------------------------
// Rate Limiters
// ---------------------------------------------------------------------------
const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please wait 1 minute before retrying.',
});

const sensitiveActionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
  message: 'Too many administrative attempts. Please wait 1 minute before retrying.',
});

async function startServer() {
  const app = express();

  console.log('Initializing SQLite database engine...');
  await initDatabase();
  console.log('SQLite database ready.');

  // Global security headers
  app.use(securityHeadersMiddleware);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Gracefully handle malformed JSON syntax errors in request body
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON format in request body.' });
    }
    next(err);
  });

  // Apply general rate limiting to all /api/ endpoints
  app.use('/api/', generalApiLimiter);

  // Database status and management
  app.get('/api/db/status', (req, res) => {
    try {
      const stats = getDatabaseStats();
      res.json({ success: true, ...stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const handleResetToZeroEndpoint = (req: express.Request, res: express.Response) => {
    try {
      const isConfirmed =
        req.headers['x-confirm-action'] === 'confirmed' || req.body?.confirmed === true;
      if (!isConfirmed) {
        return res.status(400).json({
          error:
            'Confirmation required: Must provide header X-Confirm-Action: confirmed or body { confirmed: true }.',
        });
      }

      const { password } = req.body || {};
      const expectedPassword = getExpectedResetPassword();
      if (!password || password !== expectedPassword) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing reset password.' });
      }
      resetAllDataToZero();
      res.json({ success: true, message: 'Database wiped clean: all fake data reset to zero.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/db/reset', sensitiveActionLimiter, handleResetToZeroEndpoint);
  app.post('/api/db/reset-to-zero', sensitiveActionLimiter, handleResetToZeroEndpoint);

  // Transactions
  app.get('/api/transactions', (req, res) => {
    try {
      const txs = transactionRepo.getAll();
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/transactions/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid transaction identifier.' });
      }
      const tx = transactionRepo.getById(req.params.id);
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transactions', (req, res) => {
    try {
      const validation = validateAndSanitizeTransaction(req.body);
      if (!validation.valid || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid transaction data.' });
      }

      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newTx = {
        id,
        ...validation.data,
        proratedRuleId: body.proratedRuleId && isValidId(body.proratedRuleId) ? body.proratedRuleId : undefined,
      };
      const created = transactionRepo.create(newTx);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transactions/import', sensitiveActionLimiter, (req, res) => {
    try {
      const { transactions } = req.body;
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: 'transactions array is required' });
      }
      if (transactions.length > 500) {
        return res.status(400).json({ error: 'Bulk import limited to 500 records per request.' });
      }
      const sanitizedList: any[] = [];
      for (const raw of transactions) {
        const val = validateAndSanitizeTransaction(raw);
        if (val.valid && val.data) {
          const id = (raw.id && isValidId(raw.id)) ? raw.id : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          sanitizedList.push({ id, ...val.data });
        }
      }
      const imported = transactionRepo.bulkInsert(sanitizedList);
      res.status(201).json({ success: true, count: imported.length, transactions: imported });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/transactions/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid transaction identifier.' });
      }
      const updated = transactionRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Transaction not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/transactions/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid transaction identifier.' });
      }
      transactionRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Deleted Transactions
  app.get('/api/deleted-transactions', (req, res) => {
    try {
      const deleted = deletedTransactionRepo.getAll();
      res.json(deleted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/deleted-transactions/:id/restore', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid transaction identifier.' });
      }
      const restored = deletedTransactionRepo.restore(req.params.id);
      if (!restored) return res.status(404).json({ error: 'Deleted transaction not found' });
      res.json({ success: true, restored });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/deleted-transactions', (req, res) => {
    try {
      deletedTransactionRepo.emptyTrash();
      res.json({ success: true, message: 'Trash bin emptied clean.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    try {
      const cats = categoryRepo.getAll();
      res.json(cats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const name = sanitizeText(body.name, 64);
      if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
      }
      const newCat = {
        id,
        name,
        icon: sanitizeText(body.icon || 'Tag', 32),
        color: sanitizeText(body.color || '#6366F1', 32),
        monthlyBudget: Number(body.monthlyBudget || 0),
        isCustom: true,
      };
      const created = categoryRepo.create(newCat);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid category identifier.' });
      }
      const updated = categoryRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Category not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid category identifier.' });
      }
      categoryRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Prorated Budget Rules
  app.get('/api/prorated-rules', (req, res) => {
    try {
      const rules = proratedRuleRepo.getAll();
      res.json(rules);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/prorated-rules', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const name = sanitizeText(body.name, 64);
      if (!name) {
        return res.status(400).json({ error: 'Prorated rule name is required.' });
      }
      const newRule = {
        id,
        name,
        categoryId: body.categoryId ? sanitizeText(body.categoryId, 64) : undefined,
        targetTags: Array.isArray(body.targetTags)
          ? body.targetTags.slice(0, 20).map((t: any) => sanitizeText(t, 40))
          : [],
        monthlyMaxSpend: Number(body.monthlyMaxSpend || 0),
        month: body.month || new Date().toISOString().slice(0, 7),
        rolloverEnabled: Boolean(body.rolloverEnabled),
        rolloverAmount: Number(body.rolloverAmount || 0),
        alertThresholdPercent: Number(body.alertThresholdPercent || 100),
        notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
      };
      const created = proratedRuleRepo.create(newRule);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/prorated-rules/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid rule identifier.' });
      }
      const updated = proratedRuleRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Prorated rule not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/prorated-rules/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid rule identifier.' });
      }
      proratedRuleRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Prorated Spends (Dedicated Isolated Spends Table)
  app.get('/api/prorated-spends', (req, res) => {
    try {
      const ruleId = req.query.ruleId as string | undefined;
      const spends = ruleId ? proratedSpendRepo.getByRuleId(ruleId) : proratedSpendRepo.getAll();
      res.json(spends);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/prorated-spends', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `pspend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const title = sanitizeText(body.title, 255);
      if (!title) {
        return res.status(400).json({ error: 'Prorated spend title is required.' });
      }
      const newSpend = {
        id,
        ruleId: sanitizeText(body.ruleId, 64),
        title,
        amount: Number(body.amount || 0),
        date: body.date || new Date().toISOString().slice(0, 10),
        notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
        addToMainTransactions: Boolean(body.addToMainTransactions),
      };
      const created = proratedSpendRepo.create(newSpend);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/prorated-spends/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid spend identifier.' });
      }
      proratedSpendRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Savings Goals
  app.get('/api/savings-goals', (req, res) => {
    try {
      const goals = savingsRepo.getAll();
      res.json(goals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/savings-goals', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const name = sanitizeText(body.name, 64);
      if (!name) {
        return res.status(400).json({ error: 'Goal name is required.' });
      }
      const newGoal = savingsRepo.create({
        id,
        name,
        targetAmount: Number(body.targetAmount || 0),
        currentAmount: Number(body.currentAmount || 0),
        targetDate: body.targetDate || new Date().toISOString().slice(0, 10),
        icon: sanitizeText(body.icon || 'PiggyBank', 32),
        color: sanitizeText(body.color || '#10B981', 32),
        category: sanitizeText(body.category || 'General', 64),
        notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
        history: [],
      });
      res.status(201).json(newGoal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/savings-goals/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid goal identifier.' });
      }
      const updated = savingsRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Goal not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/savings-goals/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid goal identifier.' });
      }
      savingsRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/savings-goals/:id/contributions', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid goal identifier.' });
      }
      const { amount, note, type } = req.body;
      const historyItem = {
        id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toISOString().slice(0, 10),
        amount: Number(amount || 0),
        note: note ? sanitizeText(note, 500) : undefined,
        type: (type === 'withdraw' ? 'withdraw' : 'deposit') as 'deposit' | 'withdraw',
      };
      const updatedGoal = savingsRepo.addContribution(req.params.id, historyItem);
      if (!updatedGoal) return res.status(404).json({ error: 'Goal not found' });
      res.status(201).json(updatedGoal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Debts
  app.get('/api/debts', (req, res) => {
    try {
      const debts = debtRepo.getAll();
      res.json(debts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/debts', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const name = sanitizeText(body.name, 64);
      if (!name) {
        return res.status(400).json({ error: 'Debt name is required.' });
      }
      const principal = Number(body.totalPrincipal || 0);
      const newDebt = debtRepo.create({
        id,
        name,
        totalPrincipal: principal,
        remainingBalance: Number(body.remainingBalance ?? principal),
        interestRate: Number(body.interestRate || 0),
        minimumPayment: Number(body.minimumPayment || 0),
        dueDay: Number(body.dueDay || 1),
        notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
        color: sanitizeText(body.color || '#F43F5E', 32),
        payments: [],
      });
      res.status(201).json(newDebt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/debts/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid debt identifier.' });
      }
      const updated = debtRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Debt not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/debts/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid debt identifier.' });
      }
      debtRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/debts/:id/payments', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid debt identifier.' });
      }
      const { amount, principalPaid, interestPaid, date, note } = req.body;
      const paymentItem = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: date || new Date().toISOString().slice(0, 10),
        amount: Number(amount || 0),
        principalPaid: Number(principalPaid ?? amount ?? 0),
        interestPaid: Number(interestPaid || 0),
        note: note ? sanitizeText(note, 500) : undefined,
      };
      const updatedDebt = debtRepo.recordPayment(req.params.id, paymentItem);
      if (!updatedDebt) return res.status(404).json({ error: 'Debt not found' });
      res.status(201).json(updatedDebt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/debts/:debtId/payments/:paymentId', (req, res) => {
    try {
      if (!isValidId(req.params.debtId) || !isValidId(req.params.paymentId)) {
        return res.status(400).json({ error: 'Invalid debt or payment identifier.' });
      }
      const updatedDebt = debtRepo.deletePayment(req.params.debtId, req.params.paymentId);
      if (!updatedDebt) return res.status(404).json({ error: 'Debt or payment log not found' });
      res.json(updatedDebt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Recurring Items
  app.get('/api/recurring', (req, res) => {
    try {
      const items = recurringRepo.getAll();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/recurring', (req, res) => {
    try {
      const body = req.body;
      const id = (body.id && isValidId(body.id)) ? body.id : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const title = sanitizeText(body.title, 255);
      if (!title) {
        return res.status(400).json({ error: 'Recurring item title is required.' });
      }
      const newItem = {
        id,
        title,
        amount: Number(body.amount || 0),
        type: body.type || 'expense',
        category: sanitizeText(body.category || 'General', 64),
        frequency: body.frequency || 'monthly',
        dayOfMonth: Number(body.dayOfMonth || 1),
        autoApply: body.autoApply !== false,
        tags: Array.isArray(body.tags)
          ? body.tags.slice(0, 20).map((t: any) => sanitizeText(t, 40))
          : [],
        paymentMethod: body.paymentMethod || 'credit_card',
        lastAppliedMonth: body.lastAppliedMonth || undefined,
        isActive: body.isActive !== false,
      };
      const created = recurringRepo.create(newItem);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/recurring/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid recurring identifier.' });
      }
      const updated = recurringRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Recurring item not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/recurring/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid recurring identifier.' });
      }
      recurringRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/recurring/apply', (req, res) => {
    try {
      const { month, forceAll } = req.body;
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const allRecurring = recurringRepo.getAll();
      let addedCount = 0;
      const clonedTitles: string[] = [];

      for (const rec of allRecurring) {
        if (!rec.isActive) continue;
        if (!forceAll && rec.autoApply === false) continue;
        if (rec.lastAppliedMonth === targetMonth) continue;

        const dayStr = String(Math.min(28, Math.max(1, rec.dayOfMonth || 1))).padStart(2, '0');
        const txDate = `${targetMonth}-${dayStr}`;
        const newTx = {
          id: `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `${rec.title} (Recurring)`,
          amount: rec.amount,
          type: rec.type,
          category: rec.category,
          date: txDate,
          tags: [...(rec.tags || []), 'recurring_auto'],
          paymentMethod: rec.paymentMethod,
          isRecurring: true,
          recurringFrequency: rec.frequency,
          notes: `Auto-cloned recurring item for ${targetMonth}`,
        };

        transactionRepo.create(newTx);
        recurringRepo.update(rec.id, { lastAppliedMonth: targetMonth });
        addedCount++;
        clonedTitles.push(rec.title);
      }

      res.json({ success: true, addedCount, month: targetMonth, clonedTitles });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    try {
      const settings = settingsRepo.get();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings', (req, res) => {
    try {
      const updated = settingsRepo.update(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Alerts
  app.get('/api/alerts/read', (req, res) => {
    try {
      const ids = readAlertsRepo.getAllReadIds();
      res.json(ids);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/alerts/read', (req, res) => {
    try {
      const { alertId } = req.body;
      if (alertId && isValidId(alertId)) readAlertsRepo.markRead(alertId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/alerts/read/all', (req, res) => {
    try {
      const { alertIds } = req.body;
      if (Array.isArray(alertIds)) {
        const validIds = alertIds.filter((id) => isValidId(id));
        readAlertsRepo.markAllRead(validIds);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/alerts/read', (req, res) => {
    try {
      readAlertsRepo.clearAll();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Gulak (Piggy Bank) Endpoints
  app.get('/api/gulak/pots', (req, res) => {
    try {
      const pots = gulakRepo.getAll();
      res.json(pots);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gulak/pots', (req, res) => {
    try {
      const pot = gulakRepo.create(req.body);
      res.status(201).json(pot);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/gulak/pots/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid pot identifier.' });
      }
      const updated = gulakRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Gulak pot not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/gulak/pots/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid pot identifier.' });
      }
      gulakRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gulak/pots/:id/entries', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid pot identifier.' });
      }
      const updatedPot = gulakRepo.addEntry(req.params.id, req.body);
      if (!updatedPot) return res.status(404).json({ error: 'Gulak pot not found' });
      res.json(updatedPot);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gulak/pots/:id/smash', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid pot identifier.' });
      }
      const { note } = req.body || {};
      const updatedPot = gulakRepo.smash(req.params.id, note ? sanitizeText(note, 500) : undefined);
      if (!updatedPot) return res.status(404).json({ error: 'Gulak pot not found' });
      res.json(updatedPot);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/gulak/entries/:id', (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid entry identifier.' });
      }
      const updatedPot = gulakRepo.deleteEntry(req.params.id);
      res.json({ success: true, pot: updatedPot });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware in dev or static files in prod
  const hasDist = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
  const isDev = process.env.NODE_ENV === 'development' || (!hasDist && process.env.NODE_ENV !== 'production');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server with SQLite running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
