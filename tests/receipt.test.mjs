/* The confirmation email.
 *
 * It had gone missing without anyone noticing. /api/orders/create sent
 * it, and that route closes itself the moment Stripe is configured, so
 * turning payment on would have taken money and said nothing. The
 * confirmation now belongs to the webhook, which is also the only place
 * that knows the money arrived.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirmationEmail, money } from '../api/_lib/receipt.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ORDER = {
  number: 1042,
  name: 'Erick',
  email: 'someone@example.com',
  subtotalCents: 48900,
  shippingCents: 0,
  taxCents: 0,
  totalCents: 48900,
  installation: false,
  items: [
    { name: 'Five Stage Under Sink System', qty: 1, unitCents: 39900 },
    { name: 'Replacement Cartridge Set', qty: 2, unitCents: 4500 },
  ],
};

test('cents are never shown as cents', () => {
  assert.equal(money(48900), '$489.00');
  assert.equal(money(999), '$9.99');
  assert.equal(money(0), '$0.00');
  assert.equal(money(null), '$0.00');
});

test('the confirmation names the order and the total', () => {
  const mail = confirmationEmail(ORDER);
  assert.match(mail.subject, /CW-1042/);
  assert.match(mail.html, /Thank you, Erick/);
  assert.match(mail.html, /\$489\.00/);
});

test('every line is itemised with its own total, not its unit price', () => {
  const mail = confirmationEmail(ORDER);
  assert.match(mail.html, /Five Stage Under Sink System/);
  assert.match(mail.html, /\$399\.00/);
  assert.match(mail.html, /\$90\.00/, 'two cartridge sets at $45.00 is $90.00');
});

test('free shipping is said as free rather than as nothing', () => {
  assert.match(confirmationEmail(ORDER).html, /Shipping[\s\S]{0,120}Free/);
  assert.match(
    confirmationEmail({ ...ORDER, shippingCents: 999 }).html,
    /Shipping[\s\S]{0,120}\$9\.99/,
  );
});

test('a figure that is absent is left out, not printed empty', () => {
  const bare = confirmationEmail({ number: 7, name: 'Ada', totalCents: 1999 });
  assert.doesNotMatch(bare.html, /Subtotal/);
  assert.doesNotMatch(bare.html, /Shipping/);
  assert.doesNotMatch(bare.html, /Tax/);
  assert.doesNotMatch(bare.html, /undefined|NaN|\$0\.00/);
  assert.match(bare.html, /\$19\.99/);
});

test('tax is shown only when there is tax', () => {
  assert.doesNotMatch(confirmationEmail(ORDER).html, /Tax/);
  assert.match(confirmationEmail({ ...ORDER, taxCents: 434 }).html, /Tax/);
});

test('an installation is acknowledged, and silence is kept when there is none', () => {
  assert.match(confirmationEmail({ ...ORDER, installation: true }).html,
    /asked us to fit it/);
  assert.doesNotMatch(confirmationEmail(ORDER).html, /asked us to fit it/);
});

test('a product name cannot inject HTML into the email', () => {
  const mail = confirmationEmail({
    ...ORDER,
    name: '<script>alert(1)</script>',
    items: [{ name: '<img src=x onerror=alert(1)>', qty: 1, unitCents: 100 }],
  });
  /* What matters is that no tag is formed. The words survive as text,
     escaped, which is correct: a customer called their system that. */
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(!mail.html.includes('<img'));
  assert.match(mail.html, /&lt;script&gt;/);
  assert.match(mail.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('a missing name does not leave a blank greeting', () => {
  assert.match(confirmationEmail({ number: 1, totalCents: 100 }).html,
    /Thank you, there/);
});

test('the copy follows the voice guide', () => {
  for (const order of [ORDER, { ...ORDER, installation: true, taxCents: 434, shippingCents: 999 }]) {
    const mail = confirmationEmail(order);
    const text = `${mail.subject} ${mail.html}`;
    assert.doesNotMatch(text, /[—–]/, 'no em or en dashes');
    assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, 'no emoji');
    assert.doesNotMatch(text, /placeholder|coming soon|TODO/i);
  }
});

/* ---------------------------------------------------------------- *
 * Who sends it, and when.
 * ---------------------------------------------------------------- */

test('both routes send the same email rather than their own', () => {
  for (const file of [['orders', 'create.mjs'], ['stripe', 'webhook.mjs']]) {
    const src = readFileSync(join(ROOT, 'api', ...file), 'utf8');
    assert.ok(src.includes('confirmationEmail'), `${file.join('/')} must use the shared copy`);
    assert.doesNotMatch(src, /subject: `Crystalina order/,
      `${file.join('/')} must not carry its own version of the email`);
  }
});

test('the thank you is sent only by the delivery that moved the order', () => {
  /* Stripe redelivers an event after any non-2xx, a timeout, or for no
     reason at all. mark_order_paid answers false the second time, and
     that answer is what stops a second email. */
  const src = readFileSync(join(ROOT, 'api', 'stripe', 'webhook.mjs'), 'utf8');
  assert.match(src, /if \(moved !== true\) return \{ applied: false, thanked: false \}/);
  const after = src.slice(src.indexOf('if (moved !== true)'));
  assert.ok(after.indexOf('order_receipt') > 0,
    'the receipt is fetched after that check, not before');
});

test('a refused email does not turn into a Stripe retry', () => {
  /* A 500 would make Stripe try again, mark_order_paid would answer
     false, and the email would then never be sent at all. */
  const src = readFileSync(join(ROOT, 'api', 'stripe', 'webhook.mjs'), 'utf8');
  const helper = src.slice(src.indexOf('async function markPaidAndThank'),
    src.indexOf('export default'));
  assert.match(helper, /catch \(error\)[\s\S]{0,200}console\.error/);
  assert.doesNotMatch(helper, /throw/);
});

test('the receipt function cannot be called from a browser', () => {
  const sql = readFileSync(
    join(ROOT, 'supabase', 'migrations', '20261103060000_paid_order_receipt.sql'), 'utf8',
  );
  assert.match(sql, /revoke all on function public\.order_receipt\(text\) from public, anon, authenticated/,
    'it returns a customer name, email and address');
  assert.match(sql, /where o\.stripe_session_id = p_session_id/);
  assert.ok(!/\binsert\b|\bupdate\b|\bdelete\b/i.test(sql.slice(sql.indexOf('as $$'), sql.indexOf('$$;'))),
    'it only reads');
});
