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
   Serverless instances are short lived and not shared, so this blunts casual
   abuse and accidental double submits. For hard guarantees put Vercel KV or
   Upstash behind this function, or enable Vercel's WAF rate limiting. */
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
