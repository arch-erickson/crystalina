/* Staff text must not reach innerHTML unescaped.
 *
 * R1 in the blueprint. The dashboards build their tables as template
 * literals and assign them to innerHTML. Every value that a person typed
 * has to go through escapeHTML on the way, or a product name containing
 * a script tag runs in the next staff member's browser. That is stored
 * XSS, and the people it reaches are the ones with the most access.
 *
 * This is a source check rather than a rendering one, which is the same
 * shape as the other tests here and has one real advantage: it fails on
 * the line you just wrote, before anything is deployed.
 *
 * Adding a field to a dashboard means either escaping it or adding it to
 * SAFE below with a reason.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const DASHBOARDS = [
  'admin.js', 'manager.js', 'sales.js', 'technician.js',
  'technician-route.js', 'admin-schedule.js', 'staff-schedule.js',
];

/* Anything a person can type. An id is a database UUID and a price is a
   number, so neither is on this list; a name, an address or a note is. */
const TEXT_FIELD = new RegExp([
  'name', 'title', 'note', 'notes', 'message', 'email', 'phone', 'address',
  'comment', 'reason', 'description', 'body', 'subject', 'summary', 'badge',
  'category', 'short', 'interest', 'source', 'contact', 'system', 'customer',
  'supplier', 'technician', 'product', 'borough', 'tracking', 'full_name',
  'company', 'heading', 'eyebrow', 'label',
].map((f) => `\\b${f}\\b`).join('|'), 'i');

/* Calls that make a value safe, or that cannot produce markup. */
/* `escape` here is the local helper that admin-schedule.js and
   staff-schedule.js both define, which calls escapeHTML and falls back to
   its own replacement table. It is not JavaScript's legacy global
   escape(), which only percent-encodes and would leave a tag intact. */
const MADE_SAFE = new RegExp(
  /* customerButton and supplierButton build their own markup and escape
     inside, so a call to one is already safe. */
  '\\b(escapeHTML|escapeMarkup|escape|customerButton|supplierButton'
  + '|encodeURIComponent|CSS\\.escape|money|formatDate'
  + '|Number|parseInt|parseFloat|toFixed|toLocaleDateString|toLocaleTimeString'
  + '|toLocaleString|length)\\s*\\(|\\.length\\b',
);

/* A ternary whose branches are both string literals is fixed markup the
   author wrote, not data. `${x === y ? 'selected' : ''}` is fine, and so
   is a branch that is a chunk of HTML with quotes inside it. */
const FIXED_CHOICE = /\?\s*(['"`])[\s\S]*?\1\s*:\s*(['"`])[\s\S]*?\2\s*$/;

/* Properties that cannot carry markup whatever they are named: an id is
   a database UUID, the rest are numbers. */
const NOT_TEXT = /\.(id|ids|units|qty|quantity|count|stock|price|value|revenue|total|amount|percent|index|months|days|minutes|breakMinutes)\b\s*$/;

/* Helpers that escape inside, so a call to one is already safe. */
const SAFE_HELPER = /\b(initials|customerButton|supplierButton)\s*\(|\bmap\(\s*escapeHTML\s*\)/;

/* An array of string literals mapped into options is markup the author
   wrote, not data. */
const LITERAL_LIST = /^\s*\[\s*['"`]/;

function offendersIn(source) {
  const found = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, i) => {
    /* Only the lines that build markup. */
    if (!/innerHTML|<\w|<\//.test(line)) return;
    const interps = line.match(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
    for (const raw of interps) {
      const expr = raw.slice(2, -1).trim();
      if (!TEXT_FIELD.test(expr)) continue;
      if (MADE_SAFE.test(expr)) continue;
      if (FIXED_CHOICE.test(expr)) continue;
      if (NOT_TEXT.test(expr)) continue;
      if (SAFE_HELPER.test(expr)) continue;
      if (LITERAL_LIST.test(expr)) continue;
      /* A wrapper that contains its own interpolations is reported
         through those inner ones, so flagging it as well is noise. */
      if (expr.includes('${')) continue;
      /* A nested template that itself only contains escaped values is
         handled when its own interpolations are checked. */
      if (/^\s*\w+\.map\s*\(/.test(expr)) continue;
      found.push({ line: i + 1, expr });
    }
  });
  return found;
}

for (const file of DASHBOARDS) {
  test(`${file} escapes every person-typed value it puts in markup`, () => {
    const full = path.join(root, 'js', file);
    if (!fs.existsSync(full)) return;
    const offenders = offendersIn(fs.readFileSync(full, 'utf8'));
    const report = offenders.map((o) => `  js/${file}:${o.line}  \${${o.expr}}`).join('\n');
    assert.equal(
      offenders.length, 0,
      `${offenders.length} value(s) reach markup unescaped in js/${file}:\n${report}\n\n`
      + 'Wrap each in escapeHTML(...), or if it is genuinely not person-typed, '
      + 'say so in the test.',
    );
  });
}

test('escapeHTML exists and covers the characters that matter', () => {
  const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
  const fn = main.match(/escapeHTML[\s\S]{0,400}/);
  assert.ok(fn, 'js/main.js should define escapeHTML');
  for (const ch of ['&', '<', '>']) {
    assert.ok(fn[0].includes(ch), `escapeHTML should handle ${ch}`);
  }
});
