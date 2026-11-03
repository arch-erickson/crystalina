/* Shared request helpers for the Crystalina server boundary.
   Dependency free: Node 18+ on Vercel provides global fetch. */

export function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
}

/* Reject anything that is not the expected verb. */
export function methodGuard(req, res, method = 'POST') {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    json(res, 405, { error: 'Method not allowed.' });
    return false;
  }
  return true;
}

export async function readJson(req, { limitBytes = 64 * 1024 } = {}) {
  if (req.body && typeof req.body === 'object') return req.body;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('Payload too large.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : (fwd || '')).split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
}

/* Best-effort in-process rate limit.
   A Worker isolate is short lived and there are many at once, so this
   counts per isolate rather than per caller: it stops a double submit and
   not much else. Kept as the fallback for durableRateLimit below, which
   is what the routes actually call. */
const buckets = new Map();
export function rateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(limit - entry.count, 0) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = value => typeof value === 'string' && value.length <= 200 && EMAIL_RE.test(value);
export const cleanText = (value, max) =>
  typeof value === 'string' ? value.replace(/\u0000/g, '').trim().slice(0, max) : '';

/* A rate limit that survives the isolate.
 *
 * Counts in Postgres rather than in memory, through consume_rate_limit,
 * which increments and decides in one statement so two requests arriving
 * together cannot both be allowed on the last slot.
 *
 * It fails open. If the database is unreachable the in-process limiter
 * answers instead and the request goes through: a contact form that
 * refuses everyone because the database is briefly down is a worse
 * outcome than a few unthrottled submissions. The failure is logged so
 * it is not silent.
 *
 * Cloudflare WAF rate limiting is still better and rejects at the edge
 * before any of this runs. This works today, on what already exists.
 */
export async function durableRateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
  try {
    const { admin } = await import('./supabase.mjs');
    const rows = await admin('rpc/consume_rate_limit', {
      method: 'POST',
      body: { p_bucket: key, p_limit: limit, p_window_seconds: windowSeconds },
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row && typeof row.allowed === 'boolean') {
      return { allowed: row.allowed, remaining: row.remaining, durable: true };
    }
    throw new Error('Unexpected response from consume_rate_limit.');
  } catch (error) {
    console.error('[ratelimit] durable check unavailable, falling back', error);
    return { ...rateLimit(key, { limit, windowMs }), durable: false };
  }
}
