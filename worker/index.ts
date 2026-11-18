import { Hono } from 'hono';
import type { Env } from './types';
import {
  ensureSeeded,
  resetAllDataToZero,
  loadDemoData,
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
} from './db';
import {
  securityHeadersMiddleware,
  checkInMemoryRateLimit,
  checkD1RateLimit,
  getClientIp,
  verifyResetPassword,
  isActionConfirmed,
  isValidId,
  sanitizeText,
  validateAndSanitizeTransaction,
} from './security';

const app = new Hono<{ Bindings: Env }>();

// Helper: safely parse JSON body without crashing on malformed syntax
async function safeJsonBody(req: Request): Promise<{ ok: true; body: any } | { ok: false }> {
  try {
    const body = await req.json();
    return { ok: true, body: body ?? {} };
  } catch {
    return { ok: false };
  }
}

// Helper: Edge Cache lookup & purge for read-mostly catalog endpoints
async function getEdgeCachedJson(
  reqUrl: string,
  fetcher: () => Promise<unknown>,
  maxAgeSeconds = 60
): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(reqUrl, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  const res = new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    },
  });
  await cache.put(cacheKey, res.clone());
  return res;
}

async function purgeEdgeCachePaths(origin: string, paths: string[]): Promise<void> {
  const cache = (caches as unknown as { default: Cache }).default;
  await Promise.all(
    paths.map((p) => cache.delete(new Request(new URL(p, origin).toString(), { method: 'GET' })))
  );
}

// Global security headers & CORS
app.use('/api/*', securityHeadersMiddleware);

// General fast isolate-local rate limiter + lazy 1-time seed check
app.use('/api/*', async (c, next) => {
  const ip = getClientIp(c);
  const rl = checkInMemoryRateLimit(ip, 60_000, 300);
  c.header('X-RateLimit-Limit', '300');
  c.header('X-RateLimit-Remaining', String(rl.remaining));

  if (!rl.allowed) {
    c.header('Retry-After', String(rl.retryAfterSeconds));
    return c.json(
      {
        error: 'API rate limit exceeded. Please wait 1 minute before retrying.',
        retryAfterSeconds: rl.retryAfterSeconds,
      },
      429
    );
  }

  await ensureSeeded(c.env.DB);
  await next();
});

// ---------------------------------------------------------------------------
// Health & Database Management
// ---------------------------------------------------------------------------
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    version: c.env.WORKER_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db/status', async (c) => {
  try {
    const stats = await getDatabaseStats(c.env.DB, c.env.WORKER_VERSION || '1.0.0');
    return c.json({ success: true, ...stats });
  } catch (err: any) {
    return c.json({ error: err.message || 'Database error' }, 500);
  }
});

const handleResetToZero = async (c: any) => {
  try {
    const ip = getClientIp(c);
    const rl = await checkD1RateLimit(c.env.DB, `sensitive:${ip}`, 60_000, 25, c.executionCtx);
    if (!rl.allowed) {
      c.header('Retry-After', String(rl.retryAfterSeconds));
      return c.json(
        { error: 'Too many administrative attempts. Please wait 1 minute before retrying.' },
        429
      );
    }

    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    if (!isActionConfirmed(c, parsed.body)) {
      return c.json(
        {
          error:
            'Confirmation required: Must provide header X-Confirm-Action: confirmed or body { confirmed: true }.',
        },
        400
      );
    }

    const providedPassword = String(parsed.body?.password || '');
    const expectedPassword = c.env.RESET_PASSWORD || 'admin123';
    const isValidPass = await verifyResetPassword(providedPassword, expectedPassword);
    if (!isValidPass) {
      return c.json({ error: 'Unauthorized: Invalid or missing reset password.' }, 401);
    }

    await resetAllDataToZero(c.env.DB);
    const origin = new URL(c.req.url).origin;
    await purgeEdgeCachePaths(origin, ['/api/categories', '/api/settings']);
    return c.json({ success: true, message: 'Database wiped clean: all fake data reset to zero.' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Reset failed' }, 500);
  }
};

app.post('/api/db/reset', handleResetToZero);
app.post('/api/db/reset-to-zero', handleResetToZero);

app.post('/api/db/load-demo', async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = await checkD1RateLimit(c.env.DB, `sensitive:${ip}`, 60_000, 25, c.executionCtx);
    if (!rl.allowed) {
      c.header('Retry-After', String(rl.retryAfterSeconds));
      return c.json({ error: 'Too many administrative attempts. Please wait 1 minute.' }, 429);
    }

    const parsed = await safeJsonBody(c.req.raw);
    const body = parsed.ok ? parsed.body : {};
    if (!isActionConfirmed(c, body)) {
      return c.json({ error: 'Confirmation required.' }, 400);
    }

    await loadDemoData(c.env.DB);
    const origin = new URL(c.req.url).origin;
    await purgeEdgeCachePaths(origin, ['/api/categories', '/api/settings']);
    return c.json({ success: true, message: 'Demo dataset loaded into Cloudflare D1.' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to load demo data' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
app.get('/api/transactions', async (c) => {
  try {
    const txs = await transactionRepo.getAll(c.env.DB);
    return c.json(txs);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid transaction identifier.' }, 400);
    const tx = await transactionRepo.getById(c.env.DB, id);
    if (!tx) return c.json({ error: 'Transaction not found' }, 404);
    return c.json(tx);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/transactions', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;

    const validation = validateAndSanitizeTransaction(body);
    if (!validation.valid || !validation.data) {
      return c.json({ error: validation.error || 'Invalid transaction data.' }, 400);
    }

    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTx = {
      id,
      ...validation.data,
      proratedRuleId: body.proratedRuleId && isValidId(body.proratedRuleId) ? body.proratedRuleId : undefined,
    };
    const created = await transactionRepo.create(c.env.DB, newTx);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/transactions/import', async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = await checkD1RateLimit(c.env.DB, `sensitive:${ip}`, 60_000, 25, c.executionCtx);
    if (!rl.allowed) {
      c.header('Retry-After', String(rl.retryAfterSeconds));
      return c.json({ error: 'Too many import attempts. Please wait 1 minute.' }, 429);
    }

    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const { transactions } = parsed.body;

    if (!Array.isArray(transactions)) {
      return c.json({ error: 'transactions array is required' }, 400);
    }
    if (transactions.length > 500) {
      return c.json({ error: 'Bulk import limited to 500 records per request.' }, 400);
    }

    const sanitizedList: any[] = [];
    for (const raw of transactions) {
      const val = validateAndSanitizeTransaction(raw);
      if (val.valid && val.data) {
        const id =
          raw.id && isValidId(raw.id)
            ? raw.id
            : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        sanitizedList.push({ id, ...val.data });
      }
    }

    // D1 batch limit is generous, chunk into batches of 100 to stay super fast
    for (let i = 0; i < sanitizedList.length; i += 100) {
      await transactionRepo.bulkInsert(c.env.DB, sanitizedList.slice(i, i + 100));
    }

    return c.json({ success: true, count: sanitizedList.length, transactions: sanitizedList }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid transaction identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    const updated = await transactionRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Transaction not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid transaction identifier.' }, 400);
    await transactionRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Deleted Transactions (Trash)
// ---------------------------------------------------------------------------
app.get('/api/deleted-transactions', async (c) => {
  try {
    const deleted = await deletedTransactionRepo.getAll(c.env.DB);
    return c.json(deleted);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/deleted-transactions/:id/restore', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid transaction identifier.' }, 400);
    const restored = await deletedTransactionRepo.restore(c.env.DB, id);
    if (!restored) return c.json({ error: 'Deleted transaction not found' }, 404);
    return c.json({ success: true, restored });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/deleted-transactions', async (c) => {
  try {
    await deletedTransactionRepo.emptyTrash(c.env.DB);
    return c.json({ success: true, message: 'Trash bin emptied clean.' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Categories (Edge Cached GET + Automatic Purge on Mutations)
// ---------------------------------------------------------------------------
app.get('/api/categories', async (c) => {
  try {
    return await getEdgeCachedJson(c.req.url, () => categoryRepo.getAll(c.env.DB), 300);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/categories', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = sanitizeText(body.name, 64);
    if (!name) return c.json({ error: 'Category name is required.' }, 400);

    const newCat = {
      id,
      name,
      icon: sanitizeText(body.icon || 'Tag', 32),
      color: sanitizeText(body.color || '#6366F1', 32),
      monthlyBudget: Number(body.monthlyBudget || 0),
      isCustom: true,
    };
    const created = await categoryRepo.create(c.env.DB, newCat);
    await purgeEdgeCachePaths(new URL(c.req.url).origin, ['/api/categories']);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/categories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid category identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    const updated = await categoryRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Category not found' }, 404);
    await purgeEdgeCachePaths(new URL(c.req.url).origin, ['/api/categories']);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/categories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid category identifier.' }, 400);
    await categoryRepo.delete(c.env.DB, id);
    await purgeEdgeCachePaths(new URL(c.req.url).origin, ['/api/categories']);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Prorated Budget Rules & Spends
// ---------------------------------------------------------------------------
app.get('/api/prorated-rules', async (c) => {
  try {
    const rules = await proratedRuleRepo.getAll(c.env.DB);
    return c.json(rules);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/prorated-rules', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = sanitizeText(body.name, 64);
    if (!name) return c.json({ error: 'Prorated rule name is required.' }, 400);

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
    const created = await proratedRuleRepo.create(c.env.DB, newRule);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/prorated-rules/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid rule identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updated = await proratedRuleRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Prorated rule not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/prorated-rules/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid rule identifier.' }, 400);
    await proratedRuleRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/prorated-spends', async (c) => {
  try {
    const ruleId = c.req.query('ruleId');
    if (ruleId && !isValidId(ruleId)) {
      return c.json({ error: 'Invalid ruleId filter.' }, 400);
    }
    const spends = ruleId
      ? await proratedSpendRepo.getByRuleId(c.env.DB, ruleId)
      : await proratedSpendRepo.getAll(c.env.DB);
    return c.json(spends);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/prorated-spends', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `pspend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const title = sanitizeText(body.title, 255);
    if (!title) return c.json({ error: 'Prorated spend title is required.' }, 400);

    const newSpend = {
      id,
      ruleId: sanitizeText(body.ruleId, 64),
      title,
      amount: Number(body.amount || 0),
      date: body.date || new Date().toISOString().slice(0, 10),
      notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
      addToMainTransactions: Boolean(body.addToMainTransactions),
    };
    const created = await proratedSpendRepo.create(c.env.DB, newSpend);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/prorated-spends/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid spend identifier.' }, 400);
    await proratedSpendRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Savings Goals
// ---------------------------------------------------------------------------
app.get('/api/savings-goals', async (c) => {
  try {
    const goals = await savingsRepo.getAll(c.env.DB);
    return c.json(goals);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/savings-goals', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = sanitizeText(body.name, 64);
    if (!name) return c.json({ error: 'Goal name is required.' }, 400);

    const newGoal = await savingsRepo.create(c.env.DB, {
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
    return c.json(newGoal, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/savings-goals/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid goal identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    const updated = await savingsRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Goal not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/savings-goals/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid goal identifier.' }, 400);
    await savingsRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/savings-goals/:id/contributions', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid goal identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    const { amount, note, type } = parsed.body;
    const historyItem = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(amount || 0),
      note: note ? sanitizeText(note, 500) : undefined,
      type: (type === 'withdraw' ? 'withdraw' : 'deposit') as 'deposit' | 'withdraw',
    };
    const updatedGoal = await savingsRepo.addContribution(c.env.DB, id, historyItem);
    if (!updatedGoal) return c.json({ error: 'Goal not found' }, 404);
    return c.json(updatedGoal, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Debts & Payments
// ---------------------------------------------------------------------------
app.get('/api/debts', async (c) => {
  try {
    const debts = await debtRepo.getAll(c.env.DB);
    return c.json(debts);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/debts', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = sanitizeText(body.name, 64);
    if (!name) return c.json({ error: 'Debt name is required.' }, 400);

    const principal = Number(body.totalPrincipal || 0);
    const newDebt = await debtRepo.create(c.env.DB, {
      id,
      name,
      lenderName: body.lenderName ? sanitizeText(body.lenderName, 64) : undefined,
      debtType: body.debtType ? sanitizeText(body.debtType, 32) : 'borrowed',
      totalPrincipal: principal,
      remainingBalance: Number(body.remainingBalance ?? principal),
      interestRate: Number(body.interestRate || 0),
      minimumPayment: Number(body.minimumPayment || 0),
      dueDay: Number(body.dueDay || 1),
      notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
      color: sanitizeText(body.color || '#F43F5E', 32),
      payments: [],
    });
    return c.json(newDebt, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/debts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid debt identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updated = await debtRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Debt not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/debts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid debt identifier.' }, 400);
    await debtRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/debts/:id/payments', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid debt identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);

    const { amount, principalPaid, interestPaid, date, note } = parsed.body;
    const paymentItem = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: date || new Date().toISOString().slice(0, 10),
      amount: Number(amount || 0),
      principalPaid: Number(principalPaid ?? amount ?? 0),
      interestPaid: Number(interestPaid || 0),
      note: note ? sanitizeText(note, 500) : undefined,
    };
    const updatedDebt = await debtRepo.recordPayment(c.env.DB, id, paymentItem);
    if (!updatedDebt) return c.json({ error: 'Debt not found' }, 404);
    return c.json(updatedDebt, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/debts/:debtId/payments/:paymentId', async (c) => {
  try {
    const debtId = c.req.param('debtId');
    const paymentId = c.req.param('paymentId');
    if (!isValidId(debtId) || !isValidId(paymentId)) {
      return c.json({ error: 'Invalid debt or payment identifier.' }, 400);
    }
    const updatedDebt = await debtRepo.deletePayment(c.env.DB, debtId, paymentId);
    if (!updatedDebt) return c.json({ error: 'Debt or payment log not found' }, 404);
    return c.json(updatedDebt);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Recurring Items
// ---------------------------------------------------------------------------
app.get('/api/recurring', async (c) => {
  try {
    const items = await recurringRepo.getAll(c.env.DB);
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/recurring', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const body = parsed.body;
    const id =
      body.id && isValidId(body.id)
        ? body.id
        : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const title = sanitizeText(body.title, 255);
    if (!title) return c.json({ error: 'Recurring item title is required.' }, 400);

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
    const created = await recurringRepo.create(c.env.DB, newItem);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/recurring/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid recurring identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updated = await recurringRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Recurring item not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/recurring/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid recurring identifier.' }, 400);
    await recurringRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/recurring/apply', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    const body = parsed.ok ? parsed.body : {};
    const targetMonth = body.month || new Date().toISOString().slice(0, 7);
    const forceAll = Boolean(body.forceAll);
    const result = await recurringRepo.applyForMonth(c.env.DB, targetMonth, forceAll);
    return c.json({
      success: true,
      addedCount: result.addedCount,
      month: targetMonth,
      clonedTitles: result.clonedTitles,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Settings (Edge Cached GET + Automatic Purge on PUT)
// ---------------------------------------------------------------------------
app.get('/api/settings', async (c) => {
  try {
    return await getEdgeCachedJson(c.req.url, () => settingsRepo.get(c.env.DB), 120);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/settings', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updated = await settingsRepo.update(c.env.DB, parsed.body);
    await purgeEdgeCachePaths(new URL(c.req.url).origin, ['/api/settings']);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Read Alerts
// ---------------------------------------------------------------------------
app.get('/api/alerts/read', async (c) => {
  try {
    const ids = await readAlertsRepo.getAllReadIds(c.env.DB);
    return c.json(ids);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/alerts/read', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const { alertId } = parsed.body;
    if (alertId && isValidId(alertId)) await readAlertsRepo.markRead(c.env.DB, alertId);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/alerts/read/all', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const { alertIds } = parsed.body;
    if (Array.isArray(alertIds)) {
      const validIds = alertIds.filter((id) => isValidId(id));
      await readAlertsRepo.markAllRead(c.env.DB, validIds);
    }
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/alerts/read', async (c) => {
  try {
    await readAlertsRepo.clearAll(c.env.DB);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Gulak (Piggy Bank) Endpoints
// ---------------------------------------------------------------------------
app.get('/api/gulak/pots', async (c) => {
  try {
    const pots = await gulakRepo.getAll(c.env.DB);
    return c.json(pots);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/gulak/pots', async (c) => {
  try {
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const pot = await gulakRepo.create(c.env.DB, parsed.body);
    return c.json(pot, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/gulak/pots/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid pot identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updated = await gulakRepo.update(c.env.DB, id, parsed.body);
    if (!updated) return c.json({ error: 'Gulak pot not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/gulak/pots/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid pot identifier.' }, 400);
    await gulakRepo.delete(c.env.DB, id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/gulak/pots/:id/entries', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid pot identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    if (!parsed.ok) return c.json({ error: 'Invalid JSON format in request body.' }, 400);
    const updatedPot = await gulakRepo.addEntry(c.env.DB, id, parsed.body);
    if (!updatedPot) return c.json({ error: 'Gulak pot not found' }, 404);
    return c.json(updatedPot);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/gulak/pots/:id/smash', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid pot identifier.' }, 400);
    const parsed = await safeJsonBody(c.req.raw);
    const note = parsed.ok ? parsed.body?.note : undefined;
    const updatedPot = await gulakRepo.smash(
      c.env.DB,
      id,
      note ? sanitizeText(note, 500) : undefined
    );
    if (!updatedPot) return c.json({ error: 'Gulak pot not found' }, 404);
    return c.json(updatedPot);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/gulak/entries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidId(id)) return c.json({ error: 'Invalid entry identifier.' }, 400);
    const updatedPot = await gulakRepo.deleteEntry(c.env.DB, id);
    return c.json({ success: true, pot: updatedPot });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Fallback: Delegate any non-API routes directly to Static Assets binding (0 ms SPA delivery)
app.all('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
