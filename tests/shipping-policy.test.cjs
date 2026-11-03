/* One home for the free shipping threshold.
 *
 * The figure lived in ten places across six files, six of them
 * arithmetic. They all agreed, which is the dangerous state: nothing was
 * broken, so nothing drew attention to the fact that changing it meant
 * finding ten lines and getting all ten right.
 *
 * The database is the authority on money (AD4), so it lives in
 * shipping_policy and everything else reads it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const MIGRATIONS = path.join(root, 'supabase', 'migrations');
const POLICY = '20261103040000_one_shipping_policy.sql';

const read = (f) => fs.readFileSync(path.join(MIGRATIONS, f), 'utf8');

test('the policy is one row, and the row is enforced', () => {
  const sql = read(POLICY);
  assert.match(sql, /create table if not exists public\.shipping_policy/);
  assert.match(sql, /id boolean primary key default true check \(id\)/,
    'two rows would be a policy nobody can read with confidence');
  assert.match(sql, /values \(true, 9900, 999\)/, 'the current figures, $99 and $9.99');
});

test('the threshold is readable by anyone and writable only by an admin', () => {
  const sql = read(POLICY);
  assert.match(sql, /for select\s*\n\s*using \(true\)/,
    'the threshold is on the front of the site in large type');
  assert.match(sql, /for update\s*\n\s*using \(private\.has_role\('admin'\)\)/);
});

test('create_order reads the policy instead of a literal', () => {
  const sql = read(POLICY);
  assert.match(sql, /select threshold_cents, fee_cents into v_free_over, v_ship_fee/);
  assert.match(sql, /v_shipping := case when v_subtotal >= v_free_over then 0 else v_ship_fee end/);
  assert.doesNotMatch(sql, /v_subtotal >= 9900/,
    'the literal is what this migration exists to remove');
});

test('re-creating the function kept its grants', () => {
  const sql = read(POLICY);
  assert.match(sql, /grant execute on function public\.create_order\(jsonb, jsonb, boolean\) to authenticated/,
    'create or replace resets grants, so they have to be restated');
});

test('no later migration puts the literal back', () => {
  const after = fs.readdirSync(MIGRATIONS).filter((f) => f > POLICY && f.endsWith('.sql'));
  for (const f of after) {
    assert.doesNotMatch(read(f), /v_subtotal\s*>=\s*9900/,
      `${f} reintroduces the hardcoded threshold`);
  }
});
