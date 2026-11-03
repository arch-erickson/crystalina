/* The payment path.
 *
 * This is the one flow that has to be right the first time. A payment
 * taken twice, or an order marked paid that was not, is not a bug you
 * apologise your way out of. So the signature check and the idempotency
 * are tested directly rather than trusted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formEncode, verifyWebhook } from '../api/_lib/stripe.mjs';
import worker from '../worker.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET = 'whsec_test_secret_value';

/* Sign a body the way Stripe does, so the test exercises the real path
   rather than a mock of it. */
async function sign(body, { secret = SECRET, at = Math.floor(Date.now() / 1000) } = {}) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${at}.${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${at},v1=${hex}`;
}

/* ---------------------------------------------------------------- *
 * Form encoding. Stripe takes nested square brackets, not JSON.
 * ---------------------------------------------------------------- */

test('nested objects and arrays encode the way Stripe reads them', () => {
  const out = formEncode({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: 1999 } }],
  }).join('&');
  assert.ok(out.includes('mode=payment'));
  assert.ok(out.includes(encodeURIComponent('line_items[0][quantity]') + '=1'));
  assert.ok(out.includes(encodeURIComponent('line_items[0][price_data][unit_amount]') + '=1999'));
});

test('values are escaped, so a product name cannot inject a parameter', () => {
  const out = formEncode({ metadata: { note: 'a&b=c' } }).join('&');
  assert.ok(out.includes('a%26b%3Dc'), 'ampersand and equals must be encoded');
  assert.equal(out.split('&').length, 1, 'one parameter, not three');
});

test('null and undefined are left out rather than sent as strings', () => {
  const out = formEncode({ a: 1, b: null, c: undefined }).join('&');
  assert.equal(out, 'a=1');
});

/* ---------------------------------------------------------------- *
 * Signature verification.
 * ---------------------------------------------------------------- */

test('a correctly signed body is accepted and parsed', async () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
  const result = await verifyWebhook(body, await sign(body), { secret: SECRET });
  assert.equal(result.ok, true);
  assert.equal(result.event.id, 'evt_1');
});

test('a tampered body is rejected even though the signature is well formed', async () => {
  const body = JSON.stringify({ id: 'evt_1', amount: 100 });
  const header = await sign(body);
  const tampered = JSON.stringify({ id: 'evt_1', amount: 1 });
  const result = await verifyWebhook(tampered, header, { secret: SECRET });
  assert.equal(result.ok, false);
});

test('a signature from a different secret is rejected', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  const header = await sign(body, { secret: 'whsec_someone_elses_secret' });
  const result = await verifyWebhook(body, header, { secret: SECRET });
  assert.equal(result.ok, false);
});

test('an old signature is rejected, so a captured request cannot be replayed', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  const stale = Math.floor(Date.now() / 1000) - 3600;
  const header = await sign(body, { at: stale });
  const result = await verifyWebhook(body, header, { secret: SECRET });
  assert.equal(result.ok, false);
  assert.match(result.reason, /tolerance/i);
});

test('a signature from the near future is still accepted, for clock drift', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  const header = await sign(body, { at: Math.floor(Date.now() / 1000) + 30 });
  const result = await verifyWebhook(body, header, { secret: SECRET });
  assert.equal(result.ok, true);
});

test('a missing or malformed header is rejected rather than throwing', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  for (const header of [undefined, '', 'nonsense', 't=123', 'v1=abc', 't=abc,v1=def']) {
    const result = await verifyWebhook(body, header, { secret: SECRET });
    assert.equal(result.ok, false, `header ${JSON.stringify(header)} must be refused`);
  }
});

test('several v1 signatures are accepted if any matches, for secret rotation', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  const real = await sign(body);
  const [t, v1] = real.split(',');
  const header = `${t},v1=${'0'.repeat(64)},${v1}`;
  const result = await verifyWebhook(body, header, { secret: SECRET });
  assert.equal(result.ok, true);
});

test('a signature of the wrong length cannot pass the comparison', async () => {
  const body = JSON.stringify({ id: 'evt_1' });
  const t = Math.floor(Date.now() / 1000);
  const result = await verifyWebhook(body, `t=${t},v1=abcd`, { secret: SECRET });
  assert.equal(result.ok, false);
});

/* ---------------------------------------------------------------- *
 * Routing and refusals.
 * ---------------------------------------------------------------- */

const call = (path, init) =>
  worker.fetch(new Request(`https://crystalina.org${path}`, init), {}, {});

test('both payment routes are reachable through the Worker', async () => {
  for (const path of ['/api/checkout/session', '/api/stripe/webhook']) {
    const res = await call(path, { method: 'GET' });
    assert.equal(res.status, 405, `${path} should answer, not fall through to assets`);
  }
});

test('the webhook refuses an unsigned request', async () => {
  const res = await call('/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed' }),
  });
  assert.notEqual(res.status, 200, 'an unsigned webhook must never be accepted');
});

test('checkout refuses a request with no session', async () => {
  const res = await call('/api/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [] }),
  });
  assert.equal(res.status, 401);
});

/* ---------------------------------------------------------------- *
 * The rules this flow depends on, checked in the source so they
 * cannot be quietly removed.
 * ---------------------------------------------------------------- */

test('the checkout route never computes a price', () => {
  const src = readFileSync(join(ROOT, 'api', 'checkout', 'session.mjs'), 'utf8');
  assert.ok(src.includes('create_order'), 'the database must do the pricing');
  assert.ok(src.includes('order.total_cents'), 'Stripe is charged the database total');
  assert.doesNotMatch(src, /unit_amount:\s*(?!order\.total_cents)[^,\n]*[*+]/,
    'no arithmetic may produce the amount charged');
  assert.doesNotMatch(src, /body\.(price|total|amount)/,
    'a price from the browser must never be read');
});

/* The functions the webhook calls that only read. Named here rather than
   detected, so adding a write and forgetting the event id fails below
   instead of quietly passing. */
const READERS = new Set(['order_receipt']);

test('every webhook write is keyed on the Stripe event id', () => {
  const src = readFileSync(join(ROOT, 'api', 'stripe', 'webhook.mjs'), 'utf8');
  /* Only the invocations, not the one-line definition of the helper. */
  const calls = [...src.matchAll(/callRpc\(\s*'([a-z_]+)'\s*,\s*\{([\s\S]*?)\}\s*\)/g)];
  const writes = calls.filter(([, fn]) => !READERS.has(fn));
  assert.ok(writes.length >= 2, 'the webhook should call the ledgered functions');
  for (const [, fn, args] of writes) {
    assert.ok(args.includes('p_event_id'), `callRpc('${fn}') must pass the event id`);
  }
});

test('the functions the webhook reads from really are read only', () => {
  const migrations = join(ROOT, 'supabase', 'migrations');
  const sql = readdirSync(migrations)
    .filter((f) => f.endsWith('.sql')).sort()
    .map((f) => readFileSync(join(migrations, f), 'utf8')).join('\n');
  for (const fn of READERS) {
    const body = sql.slice(sql.indexOf(`function public.${fn}(`));
    const definition = body.slice(body.indexOf('as $$'), body.indexOf('$$;'));
    assert.ok(definition.length > 10, `${fn} must be findable in a migration`);
    assert.doesNotMatch(definition, /\b(insert into|update|delete from)\b/i,
      `${fn} is exempt from the event-id rule and must therefore not write`);
  }
});

test('the migration refuses to release an order that has been paid', () => {
  const sql = readFileSync(
    join(ROOT, 'supabase', 'migrations', '20261103020000_stripe_payments.sql'), 'utf8',
  );
  assert.match(sql, /payment_status = 'paid'[\s\S]{0,200}return false/,
    'release_order must leave a paid order alone');
  assert.match(sql, /unique_violation[\s\S]{0,80}return false/,
    'a repeated event id must be a no-op');
  assert.ok(sql.includes('create unique index if not exists orders_stripe_session_id_key'),
    'one Stripe session must map to at most one order');
});

test('payment is built but not switched on', () => {
  const checkout = readFileSync(join(ROOT, 'checkout', 'index.html'), 'utf8');
  assert.match(checkout, /disabled/,
    'the checkout button stays disabled until the owner says otherwise');
});

/* ---------------------------------------------------------------- *
 * The unpaid-order route closes itself when payment exists.
 * ---------------------------------------------------------------- */

const withEnv = async (vars, fn) => {
  const before = { ...process.env };
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  try { return await fn(); } finally {
    for (const k of Object.keys(vars)) {
      if (k in before) process.env[k] = before[k]; else delete process.env[k];
    }
  }
};

test('with no Stripe key, the old order route still works', () => withEnv(
  { STRIPE_SECRET_KEY: undefined },
  async () => {
    const res = await call('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(res.status, 401, 'it should get as far as asking for a session');
  },
));

test('once Stripe is configured, the unpaid order route is gone', () => withEnv(
  { STRIPE_SECRET_KEY: 'sk_test_anything' },
  async () => {
    const res = await call('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(res.status, 410,
      'an account could otherwise hold every unit in the catalogue without paying');
  },
));

test('turning payment on is what closes it, with no second switch to forget', () => {
  const src = readFileSync(join(ROOT, 'api', 'orders', 'create.mjs'), 'utf8');
  assert.match(src, /process\.env\.STRIPE_SECRET_KEY[\s\S]{0,200}410/,
    'the gate must be the presence of the payment key itself');
});
