/* The Cloudflare Pages shim.
 *
 * The three /api handlers are written in the Node request and response style
 * and are being run on a runtime that speaks fetch. This is the adapter
 * between them, so it is the piece most likely to be quietly wrong: a
 * mistake here does not throw, it just answers the wrong thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { toPagesFunction } from '../functions/_shim.js';
import contact from '../api/contact.mjs';

const call = (handler, request, env = {}) =>
  toPagesFunction(handler)({ request, env });

const post = (body, headers = {}) => new Request('https://crystalina.org/api/contact', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('the wrong verb is refused before anything is read', async () => {
  const res = await call(contact, new Request('https://crystalina.org/api/contact'));
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('Allow'), 'POST');
});

test('a response carries the status, headers and body the handler set', async () => {
  const handler = async (req, res) => {
    res.setHeader('X-Test', 'yes');
    res.status(201).send(JSON.stringify({ ok: true }));
  };
  const res = await call(handler, post({}));
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('X-Test'), 'yes');
  assert.deepEqual(await res.json(), { ok: true });
});

test('the request body reaches the handler intact', async () => {
  let seen = null;
  const handler = async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    seen = Buffer.concat(chunks).toString('utf8');
    res.status(200).send('read');
  };
  await call(handler, post({ email: 'someone@example.com', message: 'hello' }));
  assert.deepEqual(JSON.parse(seen), { email: 'someone@example.com', message: 'hello' });
});

test('headers arrive lower-cased, the way the handlers index them', async () => {
  let seen = null;
  const handler = async (req, res) => { seen = req.headers; res.status(200).send(''); };
  await call(handler, post({}, { 'X-Forwarded-For': '198.51.100.4, 10.0.0.1' }));
  assert.equal(seen['x-forwarded-for'], '198.51.100.4, 10.0.0.1');
  assert.equal(seen['content-type'], 'application/json');
});

test('the client IP falls back to the Cloudflare header', async () => {
  let seen = null;
  const handler = async (req, res) => { seen = req.socket.remoteAddress; res.status(200).send(''); };
  await call(handler, post({}));
  assert.equal(seen, '203.0.113.9');
});

test('bindings reach the handlers as process.env', async () => {
  let seen = null;
  const handler = async (req, res) => { seen = process.env.SUPABASE_URL; res.status(200).send(''); };
  await call(handler, post({}), { SUPABASE_URL: 'https://example.supabase.co' });
  assert.equal(seen, 'https://example.supabase.co');
});

test('a handler that throws answers 500 and leaks nothing', async () => {
  const handler = async () => { throw new Error('the service role key is sk_live_secret'); };
  const res = await call(handler, post({}));
  assert.equal(res.status, 500);
  const body = await res.text();
  assert.ok(!body.includes('sk_live_secret'), 'the internal message must not reach the caller');
});

test('a handler that answers nothing is a 500, not a silent 200', async () => {
  const handler = async () => {};
  const res = await call(handler, post({}));
  assert.equal(res.status, 500);
});

test('invalid JSON is rejected by the handler, not by the shim', async () => {
  /* readJson() throws on bad JSON and contact.mjs turns that into a 400.
     The shim has to let the raw bytes through for that to happen. */
  const res = await call(contact, post('{not json'));
  assert.equal(res.status, 400);
});
