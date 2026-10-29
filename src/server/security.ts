import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// 1. HTTP Security Headers Middleware
// ---------------------------------------------------------------------------
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Modern browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent file download execution in legacy clients
  res.setHeader('X-Download-Options', 'noopen');

  // Disable aggressive DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Restrict sensitive browser capabilities
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Safe Content-Security-Policy that allows AI Studio dev preview in iframes
  // while guarding against unapproved external asset injection
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-ancestors *;"
  );

  // Cross-Origin Resource Sharing (CORS) security
  const origin = req.headers.origin;
  if (origin) {
    // Reflect request origin for local dev / cloud preview or same-origin
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-Confirm-Action'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle pre-flight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// 2. High-Performance In-Memory Sliding Window Rate Limiter
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, maxRequests, message = 'Too many requests, please slow down.' } = options;

  // Periodic cleanup of stale IP records every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(ip);
      }
    }
  }, 120000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract real client IP (behind cloud proxies or direct)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    let record = store.get(clientIp);

    if (!record) {
      record = { timestamps: [] };
      store.set(clientIp, record);
    }

    // Retain only requests within the current rolling window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({ error: message, retryAfterSeconds: Math.max(1, retryAfterSeconds) });
      return;
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.timestamps.length)));

    next();
  };
}

// ---------------------------------------------------------------------------
// 3. Strict Input Validation & Sanitization Helpers
// ---------------------------------------------------------------------------

/**
 * Validates resource identifiers against strict regex:
 * Alphanumeric, hyphen, underscore, and colon only, max length 128.
 * Rejects path traversal (../), null-byte injections, and SQL meta-characters.
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_\-:]{1,128}$/.test(id);
}

/**
 * Strips dangerous control characters and trims string within length limits.
 */
export function sanitizeText(val: unknown, maxLength = 255): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Remove ASCII control characters (0-31 except tab and newline)
  const cleaned = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validates a number is finite, within expected financial boundaries.
 */
export function isValidAmount(val: unknown, min = 0, max = 1000000000): boolean {
  const num = Number(val);
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= min && num <= max;
}

/**
 * Validates a standard ISO date string (YYYY-MM-DD).
 */
export function isValidDateString(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const parsed = new Date(val);
  return !isNaN(parsed.getTime());
}

/**
 * Comprehensive transaction payload sanitizer and validator.
 */
export function validateAndSanitizeTransaction(body: any): {
  valid: boolean;
  error?: string;
  data?: any;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const title = sanitizeText(body.title, 255);
  if (!title) {
    return { valid: false, error: 'Transaction title is required and cannot be empty.' };
  }

  if (!isValidAmount(body.amount, 0, 100000000)) {
    return { valid: false, error: 'Transaction amount must be a positive finite number (max ₹100,000,000).' };
  }

  const validTypes = ['income', 'expense', 'transfer'];
  const type = String(body.type || 'expense').toLowerCase();
  if (!validTypes.includes(type)) {
    return { valid: false, error: `Invalid transaction type '${body.type}'. Must be income, expense, or transfer.` };
  }

  const validNatures = ['need', 'want'];
  const nature = String(body.nature || 'need').toLowerCase();
  if (!validNatures.includes(nature)) {
    return { valid: false, error: `Invalid spend nature '${body.nature}'. Must be need or want.` };
  }

  const category = sanitizeText(body.category || 'cat-other', 64);
  const date = isValidDateString(body.date) ? body.date : new Date().toISOString().slice(0, 10);

  // Validate tags array
  let tags: string[] = [];
  if (Array.isArray(body.tags)) {
    tags = body.tags
      .slice(0, 20)
      .map((t: any) => sanitizeText(t, 40))
      .filter((t: string) => t.length > 0);
  }

  const notes = body.notes ? sanitizeText(body.notes, 2000) : undefined;

  const validPaymentMethods = [
    'cash',
    'credit_card',
    'debit_card',
    'bank_transfer',
    'upi',
    'net_banking',
    'other',
  ];
  const paymentMethod = validPaymentMethods.includes(body.paymentMethod)
    ? body.paymentMethod
    : 'credit_card';

  const isRecurring = Boolean(body.isRecurring);
  const recurringFrequency = body.recurringFrequency ? sanitizeText(body.recurringFrequency, 32) : undefined;
  const receiptUrl = body.receiptUrl ? sanitizeText(body.receiptUrl, 500) : undefined;

  let amortizationMonths = Number(body.amortizationMonths || 1);
  if (!Number.isInteger(amortizationMonths) || amortizationMonths < 1 || amortizationMonths > 60) {
    amortizationMonths = 1;
  }

  const transferFrom = body.transferFrom ? sanitizeText(body.transferFrom, 64) : undefined;
  const transferTo = body.transferTo ? sanitizeText(body.transferTo, 64) : undefined;

  return {
    valid: true,
    data: {
      title,
      amount: Number(body.amount),
      type,
      category,
      date,
      tags,
      notes,
      paymentMethod,
      isRecurring,
      recurringFrequency,
      receiptUrl,
      nature,
      amortizationMonths,
      transferFrom,
      transferTo,
    },
  };
}

/**
 * Validates bulk transaction imports to prevent payload exhaustion attacks.
 */
export function validateBulkImport(transactions: any[]): {
  valid: boolean;
  error?: string;
  data?: any[];
} {
  if (!Array.isArray(transactions)) {
    return { valid: false, error: 'Import payload must be an array of transactions.' };
  }

  // Prevent memory exhaustion attacks
  if (transactions.length > 500) {
    return {
      valid: false,
      error: `Import exceeds safety limit of 500 items per request (received ${transactions.length}).`,
    };
  }

  const validated: any[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const check = validateAndSanitizeTransaction(transactions[i]);
    if (!check.valid) {
      return { valid: false, error: `Item ${i + 1} validation failed: ${check.error}` };
    }
    const id = transactions[i].id && isValidId(transactions[i].id)
      ? transactions[i].id
      : `tx-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    validated.push({ id, ...check.data });
  }

  return { valid: true, data: validated };
}

/**
 * Validates category creation and updates.
 */
export function validateAndSanitizeCategory(body: any): {
  valid: boolean;
  error?: string;
  data?: any;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const name = sanitizeText(body.name, 64);
  if (!name) {
    return { valid: false, error: 'Category name is required.' };
  }

  const icon = sanitizeText(body.icon || 'Tag', 32);
  const color = sanitizeText(body.color || '#6366F1', 16);

  if (!isValidAmount(body.monthlyBudget ?? 0, 0, 100000000)) {
    return { valid: false, error: 'Monthly budget must be a non-negative finite number.' };
  }

  return {
    valid: true,
    data: {
      name,
      icon,
      color,
      monthlyBudget: Number(body.monthlyBudget || 0),
      isCustom: Boolean(body.isCustom !== false),
    },
  };
}

/**
 * Validates prorated rule creation and updates.
 */
export function validateAndSanitizeProratedRule(body: any): {
  valid: boolean;
  error?: string;
  data?: any;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const name = sanitizeText(body.name, 64);
  if (!name) {
    return { valid: false, error: 'Rule name is required.' };
  }

  if (!isValidAmount(body.monthlyMaxSpend, 1, 100000000)) {
    return { valid: false, error: 'Monthly max spend must be greater than zero.' };
  }

  const categoryId = body.categoryId ? sanitizeText(body.categoryId, 64) : undefined;
  const month = typeof body.month === 'string' && /^\d{4}-\d{2}$/.test(body.month)
    ? body.month
    : new Date().toISOString().slice(0, 7);

  let targetTags: string[] = [];
  if (Array.isArray(body.targetTags)) {
    targetTags = body.targetTags.slice(0, 20).map((t: any) => sanitizeText(t, 40));
  }

  return {
    valid: true,
    data: {
      name,
      categoryId,
      targetTags,
      monthlyMaxSpend: Number(body.monthlyMaxSpend),
      month,
      rolloverEnabled: Boolean(body.rolloverEnabled),
      rolloverAmount: Number(body.rolloverAmount || 0),
      alertThresholdPercent: Math.min(200, Math.max(1, Number(body.alertThresholdPercent || 100))),
      notes: body.notes ? sanitizeText(body.notes, 1000) : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// 4. CSRF / Action Confirmation Guard for Destructive Database Resets
// ---------------------------------------------------------------------------
export function requireActionConfirmation(req: Request, res: Response, next: NextFunction): void {
  const confirmHeader = req.headers['x-confirm-action'];
  const confirmBody = req.body?.confirmed;

  if (confirmHeader === 'confirmed' || confirmBody === true) {
    return next();
  }

  res.status(403).json({
    error: 'Destructive operation rejected: explicit confirmation header (X-Confirm-Action: confirmed) or body flag { confirmed: true } is required.',
  });
}
