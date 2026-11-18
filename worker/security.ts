import type { Context, Next } from 'hono';
import type { Env } from './types';

// ---------------------------------------------------------------------------
// 1. Edge Security Headers Middleware (Hono)
// ---------------------------------------------------------------------------
export function buildCorsHeaders(origin: string | undefined, allowedOriginsEnv?: string): Record<string, string> {
  if (!origin) return {};
  if (allowedOriginsEnv && allowedOriginsEnv.trim().length > 0) {
    const allowed = allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean);
    if (!allowed.includes('*') && !allowed.includes(origin)) {
      return {};
    }
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Confirm-Action',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

export async function securityHeadersMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const origin = c.req.header('origin');
  const corsHeaders = buildCorsHeaders(origin, c.env.ALLOWED_ORIGINS);

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  await next();

  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('X-Download-Options', 'noopen');
  c.res.headers.set('X-DNS-Prefetch-Control', 'off');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.res.headers.set(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-ancestors *;"
  );

  for (const [k, v] of Object.entries(corsHeaders)) {
    c.res.headers.set(k, v);
  }
}

// ---------------------------------------------------------------------------
// 2. Native WebCrypto Constant-Time Password Verification (< 1 ms CPU)
//    Replaces Node bcryptjs (~250ms+ CPU) to avoid Cloudflare Error 1102.
// ---------------------------------------------------------------------------
const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function verifyResetPassword(provided: string, expected: string): Promise<boolean> {
  if (!provided || !expected) return false;

  // Support PBKDF2-SHA256 stored hashes: pbkdf2_sha256$<iterations>$<saltHex>$<hashHex>
  if (expected.startsWith('pbkdf2_sha256$')) {
    const parts = expected.split('$');
    if (parts.length !== 4) return false;
    const iterations = Math.min(100000, Math.max(1000, parseInt(parts[1], 10) || 100000));
    const salt = hexToBytes(parts[2]);
    const expectedHash = hexToBytes(parts[3]);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(provided),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      expectedHash.length * 8
    );

    const actualHash = new Uint8Array(derivedBits);
    if (actualHash.length !== expectedHash.length) return false;
    return crypto.subtle.timingSafeEqual(actualHash, expectedHash);
  }

  // Hash both strings to fixed 32-byte SHA-256 digests so timingSafeEqual has zero length oracle
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);

  return crypto.subtle.timingSafeEqual(
    new Uint8Array(providedDigest),
    new Uint8Array(expectedDigest)
  );
}

// ---------------------------------------------------------------------------
// 3. Hybrid Rate Limiting
//    - General API: Fast isolate-local sliding window (0 D1 writes)
//    - Sensitive endpoints: Persistent D1 rate limiter across all edge POPs
// ---------------------------------------------------------------------------
const isolateRateStore = new Map<string, number[]>();

export function checkInMemoryRateLimit(
  clientIp: string,
  windowMs = 60_000,
  maxRequests = 300
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  let timestamps = isolateRateStore.get(clientIp) || [];
  timestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    isolateRateStore.set(clientIp, timestamps);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  isolateRateStore.set(clientIp, timestamps);

  // Prevent unbounded isolate map growth
  if (isolateRateStore.size > 2000) {
    const firstKey = isolateRateStore.keys().next().value;
    if (firstKey) isolateRateStore.delete(firstKey);
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
  };
}

export async function checkD1RateLimit(
  db: D1Database,
  key: string,
  windowMs = 60_000,
  maxRequests = 25,
  ctx?: { waitUntil: (promise: Promise<unknown>) => void }
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowCutoff = now - windowMs;

  try {
    const row = await db
      .prepare('SELECT count, windowStart FROM rate_limits WHERE key = ?')
      .bind(key)
      .first<{ count: number; windowStart: number }>();

    if (!row || row.windowStart < windowCutoff) {
      await db
        .prepare('INSERT OR REPLACE INTO rate_limits (key, count, windowStart) VALUES (?, 1, ?)')
        .bind(key, now)
        .run();

      // Prune stale rate limit entries asynchronously with 0 ms added latency
      if (ctx) {
        ctx.waitUntil(
          db.prepare('DELETE FROM rate_limits WHERE windowStart < ?').bind(now - windowMs * 10).run()
        );
      }

      return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
    }

    if (row.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((row.windowStart + windowMs - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    await db
      .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
      .bind(key)
      .run();

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - (row.count + 1)),
      retryAfterSeconds: 0,
    };
  } catch {
    // Fallback to in-memory limiter if D1 table isn't initialized yet
    return checkInMemoryRateLimit(`d1-fallback:${key}`, windowMs, maxRequests);
  }
}

export function getClientIp(c: Context<{ Bindings: Env }>): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'edge-client'
  );
}

// ---------------------------------------------------------------------------
// 4. Strict Input Validation & Sanitization Helpers (< 0.1 ms CPU)
// ---------------------------------------------------------------------------
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_\-:]{1,128}$/.test(id);
}

export function sanitizeText(val: unknown, maxLength = 255): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const cleaned = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

export function isValidAmount(val: unknown, min = 0, max = 1_000_000_000): boolean {
  const num = Number(val);
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= min && num <= max;
}

export function isValidDateString(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const parsed = new Date(val);
  return !isNaN(parsed.getTime());
}

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

  if (!isValidAmount(body.amount, 0, 100_000_000)) {
    return {
      valid: false,
      error: 'Transaction amount must be a positive finite number (max ₹100,000,000).',
    };
  }

  const validTypes = ['income', 'expense', 'transfer'];
  const type = String(body.type || 'expense').toLowerCase();
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid transaction type '${body.type}'. Must be income, expense, or transfer.`,
    };
  }

  const validNatures = ['need', 'want'];
  const nature = String(body.nature || 'need').toLowerCase();
  if (!validNatures.includes(nature)) {
    return {
      valid: false,
      error: `Invalid spend nature '${body.nature}'. Must be need or want.`,
    };
  }

  const category = sanitizeText(body.category || 'cat-other', 64);
  const date = isValidDateString(body.date) ? body.date : new Date().toISOString().slice(0, 10);

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
    'digital_wallet',
    'other',
  ];
  const paymentMethod = validPaymentMethods.includes(body.paymentMethod)
    ? body.paymentMethod
    : 'credit_card';

  const isRecurring = Boolean(body.isRecurring);
  const recurringFrequency = body.recurringFrequency
    ? sanitizeText(body.recurringFrequency, 32)
    : undefined;
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

export function isActionConfirmed(c: Context, body?: any): boolean {
  return c.req.header('x-confirm-action') === 'confirmed' || body?.confirmed === true;
}
