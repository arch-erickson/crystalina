/* The Worker entry point.
 *
 * worker.js decides, for every single request to the site, whether it is a
 * server route or a static file. Getting that wrong means either the API
 * is unreachable or the whole site is, so the routing table is worth
 * pinning down.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const call = (path, init = {}) =>
  worker.fetch(new Request(`https://crystalina.org${path}`, init), {}, {});

/* Anything that is not an API route goes to the assets binding. */
const assetsEnv = () => {
  const seen = [];
  return {
    seen,
    env: {
      ASSETS: {
        fetch(request) {
          seen.push(new URL(request.url).pathname);
          return new Response('asset', { status: 200 });
        },
      },
    },
  };
};

test('a known API route reaches its handler', async () => {
  /* No environment, so the handler refuses the verb before it needs one. */
  const res = await call('/api/contact', { method: 'GET' });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('Allow'), 'POST');
});

test('all three API routes are wired', async () => {
  for (const path of ['/api/contact', '/api/newsletter', '/api/orders/create']) {
    const res = await call(path, { method: 'GET' });
    assert.equal(res.status, 405, `${path} should answer, not fall through`);
  }
});

test('an unknown API path is a 404, not a static file', async () => {
  const { env, seen } = assetsEnv();
  const res = await worker.fetch(
    new Request('https://crystalina.org/api/nope', { method: 'POST' }), env, {},
  );
  assert.equal(res.status, 404);
  assert.deepEqual(seen, [], 'must not reach the assets binding');
});

test('a prefix of a real route does not match it', async () => {
  /* /api/contact-us is not /api/contact. A startsWith check would route it
     to the contact handler and quietly accept the wrong thing. */
  const { env } = assetsEnv();
  const res = await worker.fetch(
    new Request('https://crystalina.org/api/contact-us', { method: 'POST' }), env, {},
  );
  assert.equal(res.status, 404);
});

test('a trailing slash still finds the route', async () => {
  const res = await call('/api/contact/', { method: 'GET' });
  assert.equal(res.status, 405);
});

test('everything else is handed to the assets binding unchanged', async () => {
  const { env, seen } = assetsEnv();
  for (const path of ['/', '/shop/', '/css/styles.css', '/images/hero-bg.webp']) {
    const res = await worker.fetch(new Request(`https://crystalina.org${path}`), env, {});
    assert.equal(res.status, 200);
  }
  assert.deepEqual(seen, ['/', '/shop/', '/css/styles.css', '/images/hero-bg.webp']);
});
