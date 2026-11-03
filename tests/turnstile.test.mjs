/* Turnstile, and the configuration that would have taken the forms down.
 *
 * The dangerous state is a secret with no site key: no page can render a
 * widget, so no token exists, so every real submission is refused. That
 * is one environment variable away at all times, and it looks like the
 * safe thing to do.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile } from '../api/_lib/turnstile.mjs';

function withEnv(vars, fn) {
  const before = { ...process.env };
  Object.assign(process.env, vars);
  for (const [k, v] of Object.entries(vars)) if (v === undefined) delete process.env[k];
  return Promise.resolve(fn()).finally(() => {
    for (const k of Object.keys(vars)) {
      if (k in before) process.env[k] = before[k]; else delete process.env[k];
    }
  });
}

const QUIET = () => {
  const warn = console.warn; const error = console.error;
  console.warn = () => {}; console.error = () => {};
  return () => { console.warn = warn; console.error = error; };
};

test('neither key set: nothing to check, let it through', () => withEnv(
  { TURNSTILE_SECRET_KEY: undefined, TURNSTILE_SITE_KEY: undefined },
  async () => {
    const r = await verifyTurnstile(undefined, '203.0.113.1');
    assert.equal(r.ok, true);
  },
));

test('secret without a site key does not refuse a real customer', () => withEnv(
  { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_SITE_KEY: undefined },
  async () => {
    const restore = QUIET();
    try {
      const r = await verifyTurnstile(undefined, '203.0.113.1');
      assert.equal(r.ok, true, 'this is the state that would have broken every form');
      assert.equal(r.skipped, 'site key missing');
    } finally { restore(); }
  },
));

test('site key without a secret is allowed, and says so', () => withEnv(
  { TURNSTILE_SECRET_KEY: undefined, TURNSTILE_SITE_KEY: 'site' },
  async () => {
    const restore = QUIET();
    try {
      const r = await verifyTurnstile('a-token', '203.0.113.1');
      assert.equal(r.ok, true);
      assert.equal(r.skipped, 'secret missing');
    } finally { restore(); }
  },
));

test('both keys set and no token is refused, because by then there is a widget', () => withEnv(
  { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_SITE_KEY: 'site' },
  async () => {
    const r = await verifyTurnstile(undefined, '203.0.113.1');
    assert.equal(r.ok, false);
    /* The behaviour is the contract. The wording belongs to
       docs/voice-guide.md and the design session, so this asserts that
       the customer is told something and not what it says. */
    assert.ok(r.error && r.error.length > 10, 'a refusal must carry a message');
  },
));

test('both keys set and a good token passes', () => withEnv(
  { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_SITE_KEY: 'site' },
  async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true }));
    try {
      const r = await verifyTurnstile('a-token', '203.0.113.1');
      assert.equal(r.ok, true);
    } finally { globalThis.fetch = realFetch; }
  },
));

test('a token Cloudflare rejects is refused', () => withEnv(
  { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_SITE_KEY: 'site' },
  async () => {
    const realFetch = globalThis.fetch;
    const restore = QUIET();
    globalThis.fetch = async () => new Response(JSON.stringify({
      success: false, 'error-codes': ['invalid-input-response'],
    }));
    try {
      const r = await verifyTurnstile('a-forged-token', '203.0.113.1');
      assert.equal(r.ok, false);
    } finally { globalThis.fetch = realFetch; restore(); }
  },
));

test('Cloudflare being unreachable does not punish the customer', () => withEnv(
  { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_SITE_KEY: 'site' },
  async () => {
    const realFetch = globalThis.fetch;
    const restore = QUIET();
    globalThis.fetch = async () => { throw new Error('network down'); };
    try {
      const r = await verifyTurnstile('a-token', '203.0.113.1');
      assert.equal(r.ok, true, 'our captcha provider being down is not the visitor\'s fault');
    } finally { globalThis.fetch = realFetch; restore(); }
  },
));
