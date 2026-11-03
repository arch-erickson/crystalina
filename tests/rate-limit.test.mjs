/* The rate limit that has to survive the isolate.
 *
 * R3. Counting in process memory means counting per Worker isolate, and
 * there are many of those, each starting from zero. The durable version
 * counts in Postgres. What matters here is that it uses the database
 * when it can, falls back rather than refusing customers when it cannot,
 * and that every public route actually calls it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit, durableRateLimit } from '../api/_lib/http.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const QUIET = () => {
  const error = console.error;
  console.error = () => {};
  return () => { console.error = error; };
};

const withEnv = async (vars, fn) => {
  const before = { ...process.env };
  Object.assign(process.env, vars);
  try { return await fn(); } finally {
    for (const k of Object.keys(vars)) {
      if (k in before) process.env[k] = before[k]; else delete process.env[k];
    }
  }
};

test('the in-process limiter still counts, as the fallback', () => {
  const key = `test:${Math.random()}`;
  for (let i = 0; i < 3; i += 1) {
    assert.equal(rateLimit(key, { limit: 3, windowMs: 1000 }).allowed, true);
  }
  assert.equal(rateLimit(key, { limit: 3, windowMs: 1000 }).allowed, false);
});

test('a window that has passed starts the count again', () => {
  const key = `test:${Math.random()}`;
  assert.equal(rateLimit(key, { limit: 1, windowMs: -1 }).allowed, true);
  assert.equal(rateLimit(key, { limit: 1, windowMs: -1 }).allowed, true);
});

test('the durable limiter asks the database and believes it', () => withEnv(
  { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'k' },
  async () => {
    const realFetch = globalThis.fetch;
    let calledPath = null;
    let sentBody = null;
    globalThis.fetch = async (url, init) => {
      calledPath = String(url);
      sentBody = JSON.parse(init.body);
      return new Response(JSON.stringify([{ allowed: false, remaining: 0 }]));
    };
    try {
      const r = await durableRateLimit('contact:203.0.113.1', { limit: 5, windowMs: 600000 });
      assert.equal(r.allowed, false, 'a refusal from the database is a refusal');
      assert.equal(r.durable, true);
      assert.match(calledPath, /rpc\/consume_rate_limit/);
      assert.equal(sentBody.p_bucket, 'contact:203.0.113.1');
      assert.equal(sentBody.p_window_seconds, 600, 'milliseconds become seconds');
    } finally { globalThis.fetch = realFetch; }
  },
));

test('the database being unreachable does not refuse the customer', () => withEnv(
  { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'k' },
  async () => {
    const realFetch = globalThis.fetch;
    const restore = QUIET();
    globalThis.fetch = async () => { throw new Error('network down'); };
    try {
      const r = await durableRateLimit(`fallback:${Math.random()}`, { limit: 5, windowMs: 60000 });
      assert.equal(r.allowed, true, 'fails open, and says it fell back');
      assert.equal(r.durable, false);
    } finally { globalThis.fetch = realFetch; restore(); }
  },
));

test('every public route uses the durable limiter, not the in-process one', () => {
  for (const file of ['contact.mjs', 'newsletter.mjs', 'orders/create.mjs', 'checkout/session.mjs']) {
    const src = readFileSync(join(ROOT, 'api', file), 'utf8');
    assert.ok(src.includes('await durableRateLimit('), `api/${file} should await the durable limiter`);
    assert.doesNotMatch(src, /if \(!rateLimit\(/, `api/${file} should not call the in-process limiter directly`);
  }
});

test('the function decides and increments in one statement', () => {
  const sql = readFileSync(
    join(ROOT, 'supabase', 'migrations', '20261103030000_durable_rate_limits.sql'), 'utf8',
  );
  assert.match(sql, /on conflict \(bucket\) do update/,
    'the upsert is what makes two simultaneous callers safe');
  assert.match(sql, /returning[\s\S]{0,120}into v_count/,
    'the decision must use the count the upsert returned, not a second read');
  assert.ok(sql.includes('prune_rate_limits'),
    'rows must be prunable, or the table grows forever');
});
