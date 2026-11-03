/* The life of an order after it is paid.
 *
 * What is tested here is mostly refusal. The dashboard's status dropdown
 * wrote to localStorage until now, so every one of these paths is new,
 * and the two that would cost real money if wrong are a refund typed
 * into a dashboard and a status moved by someone who should not be able
 * to move it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker.js';
import { validateRequest, customerEmail } from '../api/orders/status.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SQL = readFileSync(
  join(ROOT, 'supabase', 'migrations', '20261103050000_order_lifecycle.sql'), 'utf8',
);

const ORDER = '2f3a1c44-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

const call = (path, init) =>
  worker.fetch(new Request(`https://crystalina.org${path}`, init), {}, {});

const post = (body) => call('/api/orders/status', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

/* ---------------------------------------------------------------- *
 * The route.
 * ---------------------------------------------------------------- */

test('the route is reachable and answers only POST', async () => {
  const res = await call('/api/orders/status', { method: 'GET' });
  assert.equal(res.status, 405, 'it should answer, not fall through to assets');
  assert.equal(res.headers.get('Allow'), 'POST');
});

test('an unsigned request cannot move an order', async () => {
  const res = await post({ orderId: ORDER, status: 'shipped' });
  assert.equal(res.status, 401);
});

/* ---------------------------------------------------------------- *
 * What may be asked for.
 * ---------------------------------------------------------------- */

test('an order id that is not an id is refused', () => {
  for (const orderId of [undefined, '', 'CW-1042', '../../etc/passwd', ORDER.slice(0, -1)]) {
    assert.ok(validateRequest({ orderId, status: 'shipped' }).error,
      `${JSON.stringify(orderId)} must be refused`);
  }
});

test('paid is not a status a person may type', () => {
  /* Payment is the only thing that marks an order paid, and
     pending_payment is where one begins. Allowing either here would let
     a dashboard say money arrived when it did not. */
  for (const status of ['paid', 'pending_payment', 'PAID', 'shipped ', 'anything']) {
    assert.ok(validateRequest({ orderId: ORDER, status }).error,
      `${JSON.stringify(status)} must be refused`);
  }
});

test('the five a person may ask for are accepted', () => {
  for (const status of ['processing', 'shipped', 'delivered', 'cancelled', 'refunded']) {
    const asked = validateRequest({ orderId: ORDER, status });
    assert.equal(asked.error, undefined);
    assert.equal(asked.status, status);
  }
});

test('a note and a tracking number are trimmed and bounded', () => {
  const asked = validateRequest({
    orderId: ORDER, status: 'shipped',
    note: `  ${'n'.repeat(900)}  `, trackingNumber: `  ${'1'.repeat(200)}  `,
  });
  assert.equal(asked.note.length, 500);
  assert.equal(asked.tracking.length, 64);
  const empty = validateRequest({ orderId: ORDER, status: 'shipped', note: '   ' });
  assert.equal(empty.note, null, 'blank is nothing, not an empty string');
});

/* ---------------------------------------------------------------- *
 * The lifecycle, which is a table rather than a case tree.
 * ---------------------------------------------------------------- */

const transitions = (() => {
  const block = SQL.match(
    /insert into public\.order_transitions[\s\S]*?values([\s\S]*?)on conflict/,
  );
  assert.ok(block, 'the transition rows must be findable');
  return [...block[1].matchAll(
    /\(\s*'(\w+)'\s*,\s*'(\w+)'\s*,\s*(true|false)\s*,\s*(true|false)\s*\)/g,
  )].map(([, from, to, stock, notifies]) => ({
    from, to, returnsStock: stock === 'true', notifies: notifies === 'true',
  }));
})();

const rule = (from, to) => transitions.find((t) => t.from === from && t.to === to);

test('every move the shop actually makes is legal', () => {
  for (const [from, to] of [
    ['pending_payment', 'cancelled'],
    ['paid', 'processing'], ['paid', 'shipped'], ['paid', 'cancelled'],
    ['processing', 'shipped'], ['processing', 'cancelled'],
    ['shipped', 'delivered'], ['shipped', 'refunded'], ['delivered', 'refunded'],
  ]) {
    assert.ok(rule(from, to), `${from} to ${to} should be allowed`);
  }
});

test('an order that has shipped cannot be cancelled, only refunded', () => {
  assert.equal(rule('shipped', 'cancelled'), undefined);
  assert.equal(rule('delivered', 'cancelled'), undefined);
  assert.ok(rule('shipped', 'refunded'));
});

test('nothing comes back from cancelled or refunded', () => {
  for (const from of ['cancelled', 'refunded']) {
    assert.equal(transitions.filter((t) => t.from === from).length, 0,
      `${from} is where an order stops`);
  }
});

test('stock returns before despatch and never after it', () => {
  /* The units are on the shelf until they leave the building. After
     that a return is received by hand and counted in by hand: a row
     that invented stock would be worse than no row. */
  assert.equal(rule('paid', 'cancelled').returnsStock, true);
  assert.equal(rule('processing', 'cancelled').returnsStock, true);
  assert.equal(rule('paid', 'refunded').returnsStock, true);
  assert.equal(rule('shipped', 'refunded').returnsStock, false);
  assert.equal(rule('delivered', 'refunded').returnsStock, false);
  assert.equal(rule('paid', 'shipped').returnsStock, false);
});

test('the customer is told about despatch, not about our paperwork', () => {
  assert.equal(rule('paid', 'processing').notifies, false);
  assert.equal(rule('paid', 'shipped').notifies, true);
  assert.equal(rule('shipped', 'delivered').notifies, true);
  assert.equal(rule('paid', 'cancelled').notifies, true);
  assert.equal(rule('shipped', 'refunded').notifies, true);
});

/* ---------------------------------------------------------------- *
 * The rules the migration has to carry, checked in the SQL so they
 * cannot be quietly dropped.
 * ---------------------------------------------------------------- */

test('only admin and manager may move an order', () => {
  assert.match(SQL, /create or replace function public\.advance_order[\s\S]*?has_role\('admin'\) or private\.has_role\('manager'\)/,
    'the gate must be inside the function, where auth.uid() is');
  assert.match(SQL, /grant execute on function public\.advance_order[\s\S]*?to authenticated/);
  assert.match(SQL, /revoke all on function public\.advance_order[\s\S]*?from public, anon/);
});

test('a refund cannot be typed into the dashboard', () => {
  /* Money moves in Stripe and the record follows. Two editable copies
     of the same fact eventually disagree, and the one holding the money
     wins the argument. */
  assert.match(SQL, /p_to_status = 'refunded' and v_order\.stripe_payment_intent_id is not null[\s\S]{0,160}raise exception/);
});

test('an order cannot be marked shipped with nothing to track', () => {
  assert.match(SQL, /p_to_status = 'shipped' and v_tracking is null[\s\S]{0,200}raise exception/);
});

test('an illegal move is refused by consulting the table, not a case tree', () => {
  assert.match(SQL, /from public\.order_transitions[\s\S]{0,200}if not found then[\s\S]{0,160}raise exception/);
});

test('every status change is recorded, by a trigger rather than by each caller', () => {
  assert.match(SQL, /create trigger orders_log_status_change\s+after update of status on public\.orders/);
  assert.match(SQL, /new\.status is distinct from old\.status/);
  assert.match(SQL, /insert into public\.order_events[\s\S]{0,200}auth\.uid\(\)/,
    'the person who did it is recorded');
});

test('nothing with a publishable key can write an order event', () => {
  const events = SQL.slice(SQL.indexOf('create table if not exists public.order_events'));
  assert.match(events, /alter table public\.order_events enable row level security/);
  assert.doesNotMatch(events.slice(0, events.indexOf('advance_order')),
    /on public\.order_events for (insert|update|delete)/,
    'only the definer functions write the trail');
  assert.match(events, /for select[\s\S]{0,400}o\.user_id = \(select auth\.uid\(\)\)/,
    'a customer reads the history of their own order');
});

test('a refund from Stripe is ledgered and a partial one changes no status', () => {
  const refund = SQL.slice(SQL.indexOf('create or replace function public.refund_order'));
  assert.match(refund, /insert into public\.stripe_events[\s\S]{0,200}unique_violation[\s\S]{0,40}return false/,
    'a redelivered event must be a no-op');
  assert.match(refund, /if not p_fully_refunded then[\s\S]{0,400}return true/,
    'half refunded is not refunded');
  assert.doesNotMatch(refund, /set stock = stock \+/,
    'a refund says nothing about where the goods are');
  assert.match(SQL, /revoke all on function public\.refund_order[\s\S]*?from public, anon, authenticated/,
    'the webhook calls it with the service role, never a browser');
});

test('the webhook records a refund issued in Stripe', () => {
  const src = readFileSync(join(ROOT, 'api', 'stripe', 'webhook.mjs'), 'utf8');
  assert.match(src, /case 'charge\.refunded'/);
  assert.match(src, /p_fully_refunded: object\.refunded === true/,
    'Stripe decides whether it was the whole amount');
});

/* ---------------------------------------------------------------- *
 * What the customer reads.
 * ---------------------------------------------------------------- */

const result = (toStatus, extra = {}) => ({
  orderNumber: 1042, toStatus, customerName: 'Erick', trackingNumber: '1Z999AA10123456784',
  totalCents: 48900, ...extra,
});

test('every notified status has copy, and processing has none', () => {
  for (const status of ['shipped', 'delivered', 'cancelled', 'refunded']) {
    const mail = customerEmail(result(status));
    assert.ok(mail && mail.subject && mail.html, `${status} needs copy`);
    assert.match(mail.subject, /CW-1042/);
  }
  assert.equal(customerEmail(result('processing')), null);
});

test('the despatch email carries the tracking reference, and manages without one', () => {
  assert.match(customerEmail(result('shipped')).html, /1Z999AA10123456784/);
  const none = customerEmail(result('shipped', { trackingNumber: null }));
  assert.doesNotMatch(none.html, /Tracking reference/,
    'an empty tracking line is worse than no line');
});

test('a customer name cannot inject HTML into the email', () => {
  const mail = customerEmail(result('shipped', { customerName: '<script>alert(1)</script>' }));
  assert.ok(!mail.html.includes('<script>'), 'the name must be escaped');
  assert.match(mail.html, /&lt;script&gt;/);
});

test('the copy follows the voice guide', () => {
  for (const status of ['shipped', 'delivered', 'cancelled', 'refunded']) {
    const mail = customerEmail(result(status));
    const text = `${mail.subject} ${mail.html}`;
    assert.doesNotMatch(text, /[—–]/, `${status}: no em or en dashes`);
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${status}: no emoji`);
    assert.doesNotMatch(text, /placeholder|coming soon|TODO/i, `${status}: nothing unbuilt in view`);
  }
});

test('the route never reads a role from the request', () => {
  const src = readFileSync(join(ROOT, 'api', 'orders', 'status.mjs'), 'utf8');
  assert.doesNotMatch(src, /body\.(role|isAdmin|staff)/);
  assert.ok(src.includes('rpcAsUser'),
    'it must run as the signed-in person so has_role decides, not the service role');
  assert.ok(!src.includes("admin("), 'the service role has no business here');
});
