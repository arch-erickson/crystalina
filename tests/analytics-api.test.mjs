/* GET /api/analytics, the traffic figures behind the Finance and Analytics
 * view.
 *
 * The route reaches two services and a role table, so most of it cannot be
 * exercised without credentials. What is tested here is everything that can
 * be wrong without them: the verb, the shape Cloudflare's answer is turned
 * into, the window asked for, and the refusal to pretend it is configured
 * when it is not.
 *
 * The one that matters most is summarise(). A field renamed in Cloudflare's
 * schema does not throw; it quietly reports zero, and a dashboard that says
 * zero visits is worse than one that says it cannot read them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler, { daysFrom, rangeFor, summarise, missingSettings, SETTINGS, QUERY } from '../api/analytics.mjs';

const fakeRes = () => {
  const res = { headers: {}, code: 0, body: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.code = code; return res; };
  res.send = (text) => { res.body = JSON.parse(text); return res; };
  return res;
};

test('only GET is answered', async () => {
  const res = fakeRes();
  await handler({ method: 'POST', headers: {} }, res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'GET');
});

test('a request with no token is refused before anything is read', async () => {
  const res = fakeRes();
  await handler({ method: 'GET', headers: {}, url: '/api/analytics' }, res);
  assert.equal(res.code, 401, 'no Authorization header means no caller');
});

test('the window is a whole number of days, clamped', () => {
  assert.equal(daysFrom(undefined), 30, 'the default is a month');
  assert.equal(daysFrom('7'), 7);
  assert.equal(daysFrom('0'), 1, 'zero days of traffic is not a question anyone asks');
  assert.equal(daysFrom('9999'), 90);
  assert.equal(daysFrom('; drop table'), 30, 'anything unparseable falls back');
});

test('the range ends now and starts the asked-for number of days before', () => {
  const now = new Date('2026-11-26T12:00:00.000Z');
  const { start, end } = rangeFor(7, now);
  assert.equal(end, '2026-11-26T12:00:00.000Z');
  assert.equal(start, '2026-11-19T12:00:00.000Z');
});

test('the three settings are named, so a failure says which one is missing', () => {
  assert.deepEqual(SETTINGS, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_RUM_SITE_TAG']);
  assert.deepEqual(missingSettings({}), SETTINGS, 'an empty environment is missing all three');
  assert.deepEqual(missingSettings({
    CLOUDFLARE_API_TOKEN: 'x', CLOUDFLARE_ACCOUNT_ID: 'y', CLOUDFLARE_RUM_SITE_TAG: 'z',
  }), []);
  assert.deepEqual(missingSettings({ CLOUDFLARE_API_TOKEN: 'x' }),
    ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_RUM_SITE_TAG']);
});

test('the query asks for both groupings against one site', () => {
  assert.match(QUERY, /days: rumPageloadEventsAdaptiveGroups/);
  assert.match(QUERY, /pages: rumPageloadEventsAdaptiveGroups/);
  assert.match(QUERY, /siteTag: \$siteTag/, 'the site tag is a variable, never interpolated');
  assert.doesNotMatch(QUERY, /\$\{/, 'a template hole in a GraphQL query is an injection');
});

test('Cloudflare answer to panel shape', () => {
  const summary = summarise({
    data: { viewer: { accounts: [{
      days: [
        { count: 120, sum: { visits: 44 }, dimensions: { date: '2026-11-24' } },
        { count: 80, sum: { visits: 31 }, dimensions: { date: '2026-11-25' } },
      ],
      pages: [
        { count: 90, sum: { visits: 40 }, dimensions: { requestPath: '/' } },
        { count: 60, sum: { visits: 25 }, dimensions: { requestPath: '/shop/' } },
      ],
    }] } },
  });
  assert.deepEqual(summary.totals, { views: 200, visits: 75 });
  assert.equal(summary.series.length, 2);
  assert.deepEqual(summary.series[0], { date: '2026-11-24', views: 120, visits: 44 });
  assert.deepEqual(summary.pages[0], { path: '/', views: 90, visits: 40 });
});

test('an empty or unfamiliar answer reads as zero rather than throwing', () => {
  for (const payload of [{}, { data: {} }, { data: { viewer: { accounts: [] } } }, null]) {
    const summary = summarise(payload);
    assert.deepEqual(summary.totals, { views: 0, visits: 0 });
    assert.deepEqual(summary.series, []);
    assert.deepEqual(summary.pages, []);
  }
});

test('series and period are different names, because they were the same one once', () => {
  const src = fsRead('api/analytics.mjs');
  assert.match(src, /period: days/, 'the number of days asked for');
  assert.match(src, /series,/, 'one row per day');
  assert.doesNotMatch(src, /days,\s*\n\s*pages,/, 'days as both a count and an array lost one of them');
});

function fsRead(rel) {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}
