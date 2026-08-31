const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const adminScript = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
const adminMarkup = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');

test('the product editor cannot be dismissed by clicking or dragging on its backdrop', () => {
  assert.doesNotMatch(adminScript, /event\.target\s*===\s*modal[^\n]*closeModal/);
  assert.match(adminScript, /modalCancel'\)\.addEventListener\('click', closeModal\)/);
  assert.match(adminScript, /modalClose'\)\.addEventListener\('click', closeModal\)/);
  assert.match(adminScript, /event\.key === 'Escape'[^\n]*closeModal\(\)/);
});

test('the product editor exposes standard reusable catalog controls', () => {
  assert.match(adminMarkup, /id="imgInput"[^>]*multiple/);
  assert.match(adminMarkup, /id="addFeatureBtn"/);
  assert.match(adminMarkup, /id="systemProductFields"/);
  assert.match(adminMarkup, /id="filterProductFields"/);
  assert.match(adminMarkup, /id="pWarrantyMonths"/);
  assert.match(adminMarkup, /id="pManualUrl"/);
  assert.match(adminScript, /requiredFilterTypes:/);
  assert.match(adminScript, /filterTypeTags:/);
});

test('storefront product media uses an inset contain frame', () => {
  assert.match(styles, /\.pc-img img\s*\{[^}]*position:\s*absolute[^}]*object-fit:\s*contain[^}]*\}/s);
  assert.match(styles, /inset:\s*var\(--pc-image-pad\)/);
});
