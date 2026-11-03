/* The health endpoint.
 *
 * It exists because on 2026-11-02 the contact form had been answering
 * 500 since August, purely because environment variables were never
 * set, and nothing anywhere said so. The only way to find out was to
 * submit the form and read an apology.
 *
 * What is tested here is mostly what it must never do: leak a value.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const call = (path) => worker.fetch(new Request(`https://crystalina.org${path}`), {}, {});

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

test('liveness is public and says nothing else', () => withEnv(
  { HEALTH_KEY: undefined },
  async () => {
    const res = await call('/api/health');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.configuration, undefined, 'no configuration without a key');
    assert.equal(body.database, undefined);
  },
));

test('the detailed view does not exist unless HEALTH_KEY is set', () => withEnv(
  { HEALTH_KEY: undefined },
  async () => {
    const body = await (await call('/api/health?key=anything')).json();
    assert.equal(body.configuration, undefined,
      'an unset HEALTH_KEY must not be matchable');
  },
));

test('a wrong key gets liveness, not detail', () => withEnv(
  { HEALTH_KEY: 'the-real-key' },
  async () => {
    const body = await (await call('/api/health?key=wrong')).json();
    assert.equal(body.configuration, undefined);
  },
));

test('the right key reports presence, and never a value', () => withEnv(
  {
    HEALTH_KEY: 'the-real-key',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_THIS_MUST_NEVER_APPEAR',
    STRIPE_SECRET_KEY: 'sk_test_ALSO_MUST_NEVER_APPEAR',
    SUPABASE_URL: undefined,
  },
  async () => {
    const res = await call('/api/health?key=the-real-key');
    const text = await res.text();
    assert.ok(!text.includes('THIS_MUST_NEVER_APPEAR'), 'a secret value must never be echoed');
    assert.ok(!text.includes('ALSO_MUST_NEVER_APPEAR'));
    assert.ok(!text.includes('sb_secret_'), 'not even a prefix');
    assert.ok(!text.includes('sk_test_'));

    const body = JSON.parse(text);
    const byName = Object.fromEntries(body.configuration.map((c) => [c.name, c.present]));
    assert.equal(byName.SUPABASE_SERVICE_ROLE_KEY, true, 'presence is reported');
    assert.equal(byName.SUPABASE_URL, false);
  },
));

test('it names the combinations that are individually fine and together broken', () => withEnv(
  {
    HEALTH_KEY: 'k',
    TURNSTILE_SECRET_KEY: 'secret',
    TURNSTILE_SITE_KEY: undefined,
    STRIPE_SECRET_KEY: 'sk',
    STRIPE_WEBHOOK_SECRET: undefined,
  },
  async () => {
    const body = await (await call('/api/health?key=k')).json();
    const all = body.warnings.join(' ');
    assert.match(all, /Turnstile secret is set without a site key/,
      'the trap that would refuse every submission must be reported');
    assert.match(all, /webhook cannot be trusted/,
      'payment that can charge but never mark paid must be reported');
    assert.equal(body.ok, false, 'a warning means not ok');
  },
));

test('only GET', async () => {
  const res = await worker.fetch(
    new Request('https://crystalina.org/api/health', { method: 'POST' }), {}, {},
  );
  assert.equal(res.status, 405);
});
