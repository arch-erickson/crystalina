/* Counting visitors, and the two promises that go with it.
 *
 * Cloudflare Web Analytics is one script tag. The temptation is to paste it
 * into twenty-five page heads, which is twenty-five copies of a token and
 * four staff dashboards counted as customers. It is injected once from
 * js/main.js instead, so this file holds that arrangement in place.
 *
 * The second promise is on the privacy page. It tells the visitor the
 * counting happens and that it sets no cookie, which is only true while the
 * code stays as it is. If someone swaps in a product that does set one, this
 * test is where the page and the code are checked against each other.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const MAIN = read('js/main.js');
const BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';

/* The analytics block, lifted out of main.js and run against a pretend
   document, so what is tested is the real code rather than a copy of it. */
function runAnalytics({ token = '', pathname = '/shop/', beaconAlready = false } = {}) {
  const start = MAIN.indexOf('const ANALYTICS_TOKEN');
  const end = MAIN.indexOf('/* ---------- page boot ---------- */');
  assert.ok(start > 0 && end > start, 'the analytics block is still in main.js');
  /* Whatever the real token is, including the day the owner fills it in, the
     block is run here with the token this case is about. */
  const code = MAIN.slice(start, end)
    .replace(/const ANALYTICS_TOKEN = '[^']*';/, `const ANALYTICS_TOKEN = ${JSON.stringify(token)};`);
  assert.ok(code.includes('const ANALYTICS_TOKEN = ' + JSON.stringify(token)),
    'the token line is still shaped the way this test substitutes into');

  const appended = [];
  const document = {
    createElement: () => ({ attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } }),
    querySelector: () => (beaconAlready ? { attrs: {} } : null),
    head: { appendChild: (el) => appended.push(el) },
  };
  const api = new Function('document', 'location',
    `${code}\nreturn { analyticsCounts, loadAnalytics };`)(document, { pathname });
  api.loadAnalytics();
  return { appended, counts: api.analyticsCounts(pathname) };
}

test('no token means no beacon, which is the state until the owner makes one', () => {
  const { appended, counts } = runAnalytics({ token: '' });
  assert.equal(counts, false);
  assert.deepEqual(appended, [], 'an empty token must not load a script that reports to nobody');
});

test('a token counts a customer page, deferred and with the token attached', () => {
  const { appended } = runAnalytics({ token: 'test-token', pathname: '/shop/' });
  assert.equal(appended.length, 1);
  assert.equal(appended[0].src, BEACON);
  assert.equal(appended[0].defer, true, 'the beacon must never block the page');
  assert.deepEqual(JSON.parse(appended[0].attrs['data-cf-beacon']), { token: 'test-token' });
});

test('the four staff dashboards and the docs are not counted', () => {
  for (const p of ['/admin/', '/manager/', '/sales/', '/technician/', '/docs/components.html']) {
    const { appended, counts } = runAnalytics({ token: 'test-token', pathname: p });
    assert.equal(counts, false, `${p} is staff traffic, not a customer`);
    assert.deepEqual(appended, [], `${p} must load no beacon`);
  }
});

test('a page that already has a beacon does not get a second one', () => {
  const { appended } = runAnalytics({ token: 'test-token', beaconAlready: true });
  assert.deepEqual(appended, [], 'two beacons count every visit twice');
});

test('the snippet has one home: no page carries its own copy', () => {
  const pages = fs.readdirSync(root, { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.html'))
    .filter((f) => !f.startsWith('dist') && !f.startsWith('node_modules') && !f.includes('.claude'));
  assert.ok(pages.length > 10, 'the page list is still being found');
  for (const page of pages) {
    assert.doesNotMatch(read(page), /cloudflareinsights|data-cf-beacon/,
      `${page} pastes the snippet instead of letting main.js inject it`);
  }
});

test('the token is named in one file only', () => {
  const sources = ['js/main.js', 'js/store.js', 'js/data-remote.js', 'js/auth.js', 'worker.js']
    .filter((f) => fs.existsSync(path.join(root, f)));
  const holders = sources.filter((f) => read(f).includes('ANALYTICS_TOKEN'));
  assert.deepEqual(holders, ['js/main.js'], 'one home, read everywhere');
});

test('the privacy page says what is counted, and that it sets no cookie', () => {
  const privacy = read('privacy/index.html');
  assert.match(privacy, /Cloudflare Web Analytics/,
    'counting visitors without saying so on the privacy page is not an option');
  assert.match(privacy, /sets no cookie/);
  assert.doesNotMatch(MAIN, /document\.cookie/,
    'the privacy page promises no cookie; main.js must not set one');
});

/* The two are one step. The privacy policy is deliberately unpublished until
 * the owner has approved the wording: it is off the Worker by the allow-list
 * and off crystalina.org by the _config.yml exclude. Counting visitors while
 * the page that tells them so answers 404 on both hosts is not a state this
 * repository should be able to reach by accident, so the token cannot be
 * filled in without publishing the policy in the same commit. */
test('the counting cannot be switched on while the privacy policy is unpublished', () => {
  const tokenIsSet = /const ANALYTICS_TOKEN = '[^']/.test(MAIN);
  if (!tokenIsSet) return;
  assert.match(read('scripts/build-site.mjs'), /'privacy'/,
    'name privacy in the publish allow-list before counting anyone');
  assert.doesNotMatch(read('_config.yml'), /^\s*-\s*privacy\/\s*$/m,
    'take privacy out of the _config.yml exclude before counting anyone');
});
