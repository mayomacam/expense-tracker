import express from 'express';
import path from 'path';
import {
  initDatabase,
  resetAllDataToZero,
  populateDemoData,
  transactionRepo,
  deletedTransactionRepo,
  categoryRepo,
  proratedRuleRepo,
  savingsRepo,
  debtRepo,
  recurringRepo,
  settingsRepo,
  readAlertsRepo,
  getDatabaseStats,
} from './src/server/db';

const PORT = 3000;

async function startServer() {
  const app = express();

  console.log('Initializing SQLite database engine...');
  await initDatabase();
  console.log('SQLite database ready.');

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Database status and management
  app.get('/api/db/status', (req, res) => {
    try {
      const stats = getDatabaseStats();
      res.json({ success: true, ...stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/reset', (req, res) => {
    try {
      resetAllDataToZero();
      res.json({ success: true, message: 'Database reset to clean zero records in SQLite.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/reset-to-zero', (req, res) => {
    try {
      resetAllDataToZero();
      res.json({ success: true, message: 'Database wiped clean: all fake data reset to zero.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/load-demo', (req, res) => {
    try {
      populateDemoData();
      res.json({ success: true, message: 'Loaded demo dataset into SQLite.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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
      const tx = transactionRepo.getById(req.params.id);
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transactions', (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newTx = {
        id,
        title: body.title,
        amount: Number(body.amount),
        type: body.type,
        category: body.category,
        date: body.date,
        tags: Array.isArray(body.tags) ? body.tags : [],
        notes: body.notes || undefined,
        paymentMethod: body.paymentMethod || 'credit_card',
        isRecurring: Boolean(body.isRecurring),
        recurringFrequency: body.recurringFrequency || undefined,
        receiptUrl: body.receiptUrl || undefined,
      };
      const created = transactionRepo.create(newTx);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transactions/import', (req, res) => {
    try {
      const { transactions } = req.body;
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: 'transactions array is required' });
      }
      const imported = transactionRepo.bulkInsert(transactions);
      res.status(201).json({ success: true, count: imported.length, transactions: imported });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/transactions/:id', (req, res) => {
    try {
      const updated = transactionRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Transaction not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/transactions/:id', (req, res) => {
    try {
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
      const id = body.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newCat = {
        id,
        name: body.name,
        icon: body.icon || 'Tag',
        color: body.color || '#6366F1',
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
      const updated = categoryRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Category not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
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
      const id = body.id || `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRule = {
        id,
        name: body.name,
        categoryId: body.categoryId || undefined,
        targetTags: Array.isArray(body.targetTags) ? body.targetTags : [],
        monthlyMaxSpend: Number(body.monthlyMaxSpend),
        month: body.month || new Date().toISOString().slice(0, 7),
        rolloverEnabled: Boolean(body.rolloverEnabled),
        rolloverAmount: Number(body.rolloverAmount || 0),
        alertThresholdPercent: Number(body.alertThresholdPercent || 100),
        notes: body.notes || undefined,
      };
      const created = proratedRuleRepo.create(newRule);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/prorated-rules/:id', (req, res) => {
    try {
      const updated = proratedRuleRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Prorated rule not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/prorated-rules/:id', (req, res) => {
    try {
      proratedRuleRepo.delete(req.params.id);
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
      const id = body.id || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newGoal = savingsRepo.create({
        id,
        name: body.name,
        targetAmount: Number(body.targetAmount),
        currentAmount: Number(body.currentAmount || 0),
        targetDate: body.targetDate,
        icon: body.icon || 'PiggyBank',
        color: body.color || '#10B981',
        category: body.category || 'General',
        notes: body.notes || undefined,
        history: [],
      });
      res.status(201).json(newGoal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/savings-goals/:id', (req, res) => {
    try {
      const updated = savingsRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Goal not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/savings-goals/:id', (req, res) => {
    try {
      savingsRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/savings-goals/:id/contributions', (req, res) => {
    try {
      const { amount, note, type } = req.body;
      const historyItem = {
        id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toISOString().slice(0, 10),
        amount: Number(amount),
        note: note || undefined,
        type: type || 'deposit',
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
      const id = body.id || `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const principal = Number(body.totalPrincipal);
      const newDebt = debtRepo.create({
        id,
        name: body.name,
        totalPrincipal: principal,
        remainingBalance: Number(body.remainingBalance ?? principal),
        interestRate: Number(body.interestRate || 0),
        minimumPayment: Number(body.minimumPayment || 0),
        dueDay: Number(body.dueDay || 1),
        notes: body.notes || undefined,
        color: body.color || '#F43F5E',
        payments: [],
      });
      res.status(201).json(newDebt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/debts/:id', (req, res) => {
    try {
      const updated = debtRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Debt not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/debts/:id', (req, res) => {
    try {
      debtRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/debts/:id/payments', (req, res) => {
    try {
      const { amount, principalPaid, interestPaid, note } = req.body;
      const paymentItem = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toISOString().slice(0, 10),
        amount: Number(amount),
        principalPaid: Number(principalPaid ?? amount),
        interestPaid: Number(interestPaid || 0),
        note: note || undefined,
      };
      const updatedDebt = debtRepo.recordPayment(req.params.id, paymentItem);
      if (!updatedDebt) return res.status(404).json({ error: 'Debt not found' });
      res.status(201).json(updatedDebt);
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
      const id = body.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newItem = {
        id,
        title: body.title,
        amount: Number(body.amount),
        type: body.type || 'expense',
        category: body.category,
        frequency: body.frequency || 'monthly',
        dayOfMonth: Number(body.dayOfMonth || 1),
        autoApply: body.autoApply !== false, // default true
        tags: Array.isArray(body.tags) ? body.tags : [],
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
      const updated = recurringRepo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Recurring item not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/recurring/:id', (req, res) => {
    try {
      recurringRepo.delete(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clone recurring transactions for month
  // If forceAll is false, only items with autoApply === true are cloned!
  app.post('/api/recurring/apply', (req, res) => {
    try {
      const { month, forceAll } = req.body;
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const allRecurring = recurringRepo.getAll();
      let addedCount = 0;
      const clonedTitles: string[] = [];

      for (const rec of allRecurring) {
        if (!rec.isActive) continue;
        // Check per-item autoApply setting unless forceAll is explicitly requested
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
      if (alertId) readAlertsRepo.markRead(alertId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/alerts/read/all', (req, res) => {
    try {
      const { alertIds } = req.body;
      if (Array.isArray(alertIds)) readAlertsRepo.markAllRead(alertIds);
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

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
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
