/* The boundary between the browser and the data.
 *
 * U1 in the blueprint says the gate in front of the dashboards is
 * browser-side and unproven. The first half of that is true and cannot be
 * otherwise: these are static pages, the session lives in localStorage,
 * and the Worker serving /admin/ has nothing to check. Anyone can ask for
 * the shell and get it.
 *
 * So the shell being public is not the question. The question is whether
 * anything in it works without the role, and that is a question with a
 * mechanical answer, which is what this file is. Every table has row
 * level security. Every privileged function either checks a role, checks
 * that the row is the caller's own, or cannot be called from a browser at
 * all. Nothing can hand itself a role.
 *
 * These are read out of the migrations rather than out of a live
 * database, so they prove what we have written rather than what is
 * running. That is still the useful half: a table added next month
 * without a policy fails the build here, on the commit that adds it,
 * instead of being found by someone who went looking.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'supabase', 'migrations');

const SQL = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql')).sort()
  .map((f) => readFileSync(join(MIGRATIONS, f), 'utf8'))
  .join('\n');

/* ---------------------------------------------------------------- *
 * Every table.
 * ---------------------------------------------------------------- */

const tables = [...new Set(
  [...SQL.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map((m) => m[1]),
)];

test('there are tables to check', () => {
  assert.ok(tables.length >= 28, `expected the whole schema, found ${tables.length}`);
});

test('every table has row level security', () => {
  const enabled = new Set(
    [...SQL.matchAll(/alter table public\.(\w+)\s+enable row level security/g)].map((m) => m[1]),
  );
  const missing = tables.filter((t) => !enabled.has(t));
  assert.deepEqual(missing, [],
    'a table without row level security is readable by anyone with the publishable key');
});

/* ---------------------------------------------------------------- *
 * Every privileged function.
 *
 * A security definer function runs as its owner, so it is the one place
 * where row level security does not protect anything. Each one has to
 * carry its own answer to "who is allowed to do this".
 * ---------------------------------------------------------------- */

const functions = [...SQL.matchAll(
  /create (?:or replace )?function ((?:public|private)\.\w+)\s*\(([^)]*)\)([\s\S]*?)\n\$(?:fn)?\$;/g,
)].map(([, name, args, body]) => ({
  name,
  args,
  body,
  definer: /security definer/.test(body),
  writes: /\b(insert into|update\s+public\.|delete from)\b/.test(body),
  checksRole: /has_role/.test(body),
  checksOwner: /auth\.uid\(\)/.test(body),
}));

/* Revoked from both of the roles a browser can hold, so only the service
   role reaches it. The signature is matched loosely: argument lists are
   written out in full on the revoke line and spacing varies. */
const serverOnly = (name) => {
  const revokes = [...SQL.matchAll(
    new RegExp(`revoke all on function ${name.replace('.', '\\.')}\\s*\\([^)]*\\)\\s*\\n?\\s*from ([^;]+);`, 'g'),
  )];
  return revokes.some(([, from]) => /anon/.test(from) && /authenticated/.test(from));
};

test('the functions are findable', () => {
  assert.ok(functions.length >= 25, `expected the whole set, found ${functions.length}`);
  assert.ok(functions.some((f) => f.name === 'public.create_order'));
});

test('every privileged write answers who is allowed to do it', () => {
  const unguarded = functions
    .filter((f) => f.definer && f.writes)
    .filter((f) => !f.checksRole && !f.checksOwner && !serverOnly(f.name))
    .filter((f) => !f.name.startsWith('private.'))
    .map((f) => f.name);
  assert.deepEqual(unguarded, [],
    'a definer function that writes must check a role, check auth.uid(), or be revoked from anon and authenticated');
});

test('the payment functions cannot be called from a browser at all', () => {
  /* Marking an order paid is the one write where being wrong costs
     money, so it is not gated on a role, it is unreachable. */
  for (const name of ['public.mark_order_paid', 'public.release_order', 'public.refund_order']) {
    assert.ok(serverOnly(name), `${name} must be revoked from anon and authenticated`);
  }
});

test('the rate limiter cannot be driven by the caller it limits', () => {
  /* consume_rate_limit takes a bucket key. Reachable from a browser, a
     caller could spend someone else's allowance by guessing theirs. */
  assert.ok(serverOnly('public.consume_rate_limit'));
  assert.ok(serverOnly('public.prune_rate_limits'));
});

test('no private function that writes is callable by anyone signed in', () => {
  const writers = new Set(functions.filter((f) => f.writes).map((f) => f.name));
  const exposed = [...SQL.matchAll(/grant execute on function (private\.\w+)/g)]
    .map((m) => m[1])
    .filter((name) => writers.has(name));
  assert.deepEqual(exposed, []);
});

test('the private functions the policies call are read only', () => {
  /* Two are granted on purpose, because the policies call them as the
     caller rather than as the owner: has_role and is_workforce_member.
     A third grant into the private schema is a decision, not a detail,
     so it fails here until someone says why. */
  const granted = [...new Set(
    [...SQL.matchAll(/grant execute on function (private\.\w+)/g)].map((m) => m[1]),
  )].sort();
  assert.deepEqual(granted, ['private.has_role', 'private.is_workforce_member']);
  for (const name of granted) {
    const fn = functions.find((f) => f.name === name);
    assert.ok(fn, `${name} must be findable`);
    assert.equal(fn.writes, false,
      `${name} is reachable from a browser and must only read`);
  }
});

/* ---------------------------------------------------------------- *
 * Nothing can hand itself a role.
 *
 * This is the one that makes the browser-side gate survivable. The
 * dashboard reads user_roles to decide what to show. If that table could
 * be written by the person it describes, the gate would be decoration
 * and so would row level security.
 * ---------------------------------------------------------------- */

const policiesOn = (table) => [...SQL.matchAll(
  new RegExp(`create policy "([^"]+)" on public\\.${table} for (\\w+)([\\s\\S]*?);`, 'g'),
)].map(([, name, action, rest]) => ({ name, action, rest }));

test('only an admin can grant a role', () => {
  const writable = policiesOn('user_roles')
    .filter((p) => p.action !== 'select');
  assert.ok(writable.length, 'user_roles must have a write policy to check');
  for (const policy of writable) {
    assert.match(policy.rest, /has_role\('admin'\)/,
      `"${policy.name}" would let something other than an admin grant a role`);
    assert.match(policy.rest, /with check \(private\.has_role\('admin'\)\)/,
      `"${policy.name}" needs a with check, or an admin could write a row they then cannot see`);
  }
});

test('a signed-in customer reads only their own roles', () => {
  const select = policiesOn('user_roles').filter((p) => p.action === 'select');
  assert.ok(select.some((p) => /auth\.uid\(\)\) = user_id/.test(p.rest)),
    'the own-rows policy is what keeps the staff list from being public');
});

test('nothing anywhere is writable by anon', () => {
  const anonWrites = [...SQL.matchAll(
    /create policy "([^"]+)" on public\.(\w+) for (all|insert|update|delete) to ([^\n]+)/g,
  )].filter(([, , , , roles]) => /\banon\b/.test(roles));
  assert.deepEqual(anonWrites.map(([, name, table]) => `${name} on ${table}`), [],
    'a visitor with no account must not be able to write anything');
});

/* ---------------------------------------------------------------- *
 * What the browser is given.
 * ---------------------------------------------------------------- */

const browserFiles = (() => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'vendor' || entry.name === 'node_modules') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|html)$/.test(entry.name)) out.push(full);
    }
  };
  walk(join(ROOT, 'js'));
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) out.push(join(ROOT, entry.name));
  }
  return out;
})();

test('no service-role key reaches the browser', () => {
  assert.ok(browserFiles.length > 10, 'the sweep must actually be reading files');
  for (const file of browserFiles) {
    const src = readFileSync(file, 'utf8');
    assert.ok(!/service_role|SERVICE_ROLE/.test(src),
      `${file} mentions the service role, which belongs only in /api`);
    assert.ok(!/\bsb_secret_/.test(src), `${file} contains a secret key`);
    assert.ok(!/\bsk_(test|live)_/.test(src), `${file} contains a Stripe secret key`);
  }
});

test('the server boundary never trusts money from the browser', () => {
  const api = join(ROOT, 'api');
  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (entry.name.endsWith('.mjs')) out.push(full);
    }
    return out;
  };
  for (const file of walk(api)) {
    const src = readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /body\.(price|total|totalCents|amount|amountCents|subtotal)\b/,
      `${file} reads a price from the request. The database computes every total.`);
  }
});

/* ---------------------------------------------------------------- *
 * What is published.
 *
 * On 2026-10-09 the live host was serving the migrations, the tests and
 * the task list to anyone who asked, because the repository root was the
 * document root. The allow-list in build-site.mjs is the fix; this is the
 * net under it.
 * ---------------------------------------------------------------- */

test('the forbidden list still covers everything that leaked', () => {
  const build = readFileSync(join(ROOT, 'scripts', 'build-site.mjs'), 'utf8');
  const forbidden = build.slice(build.indexOf('const FORBIDDEN'), build.indexOf('const walk'));
  for (const pattern of ['supabase', 'tests?', 'scripts', 'api', 'functions', '\\.sql', 'wrangler']) {
    assert.ok(forbidden.includes(pattern), `the list must still exclude ${pattern}`);
  }
  assert.match(forbidden, /COORDINATION|CLAUDE/,
    'the coordination log and the project instructions are internal');
});
