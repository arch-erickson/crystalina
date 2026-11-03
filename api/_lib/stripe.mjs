/* Stripe, without the SDK.
 *
 * The Stripe node library is far larger than this needs and pulls in Node
 * built-ins the Workers runtime does not have. Everything here is two
 * things: a form-encoded POST to api.stripe.com, and an HMAC check on the
 * webhook. Both are a few lines with the platform's own APIs.
 *
 * The secret key never leaves this module's callers, and nothing here is
 * ever imported by browser code.
 */

const API = 'https://api.stripe.com/v1';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/* Stripe takes form encoding, and nests with square brackets:
   line_items[0][price_data][unit_amount]. */
export function formEncode(value, prefix = '', out = []) {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => formEncode(v, `${prefix}[${i}]`, out));
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      formEncode(v, prefix ? `${prefix}[${k}]` : k, out);
    }
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  }
  return out;
}

export async function stripePost(path, payload, { idempotencyKey } = {}) {
  const key = required('STRIPE_SECRET_KEY');
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  /* Stripe deduplicates on this for 24 hours, so a retried request cannot
     create a second session or a second charge. */
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers,
    body: formEncode(payload).join('&'),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data && data.error ? data.error.message : `Stripe ${res.status}`;
    const err = new Error(message);
    err.stripeCode = data && data.error ? data.error.code : null;
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------------------------------------------------------------- *
 * Webhook signatures.
 *
 * Stripe sends `Stripe-Signature: t=<unix>,v1=<hex>,v1=<hex>`. The signed
 * payload is `${t}.${rawBody}`, HMAC-SHA256 with the endpoint secret. More
 * than one v1 can be present while a secret is being rotated, so any match
 * counts.
 *
 * Three things make this safe, and all three matter:
 *   - the raw body, byte for byte, never a reparsed object
 *   - a constant-time comparison, so the check cannot be timed
 *   - a timestamp tolerance, so a captured request cannot be replayed
 * ---------------------------------------------------------------- */

const encoder = new TextEncoder();

function parseSignatureHeader(header) {
  const out = { t: null, v1: [] };
  for (const part of String(header || '').split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') out.t = Number(v);
    else if (k === 'v1' && v) out.v1.push(v.trim());
  }
  return out;
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

/* Length first, then every byte, with no early exit. */
function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyWebhook(rawBody, signatureHeader, {
  secret = null, toleranceSeconds = 300, now = Date.now(),
} = {}) {
  const key = secret || required('STRIPE_WEBHOOK_SECRET');
  const { t, v1 } = parseSignatureHeader(signatureHeader);

  if (!t || !Number.isFinite(t) || !v1.length) {
    return { ok: false, reason: 'Malformed signature header.' };
  }
  const age = Math.abs(Math.floor(now / 1000) - t);
  if (age > toleranceSeconds) {
    return { ok: false, reason: 'Signature timestamp outside the tolerance.' };
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = new Uint8Array(await crypto.subtle.sign(
    'HMAC', cryptoKey, encoder.encode(`${t}.${rawBody}`),
  ));

  for (const candidate of v1) {
    const bytes = hexToBytes(candidate);
    if (bytes && timingSafeEqual(mac, bytes)) {
      let event;
      try { event = JSON.parse(rawBody); } catch { return { ok: false, reason: 'Body is not JSON.' }; }
      return { ok: true, event };
    }
  }
  return { ok: false, reason: 'No signature matched.' };
}
