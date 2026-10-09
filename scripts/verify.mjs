#!/usr/bin/env node
/* The verification harness.
 *
 *   node scripts/verify.mjs / [--base http://localhost:4321] [--out .verify]
 *
 * Renders the page in a real browser and reports what is measurable rather
 * than what was intended: console errors, horizontal overflow, text contrast,
 * line length, image dimensions, transferred weight, and a screenshot at three
 * sizes.
 *
 * An agent that cannot see the page it built will describe something that is
 * not there. This is how it sees.
 *
 * Needs puppeteer, or puppeteer-core with a local Chrome:
 *   npm i -D puppeteer
 *   CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/verify.mjs page.html
 */
import { mkdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (flag, fallback = '') => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/verify.mjs <page> [--base http://host] [--out .verify]');
  process.exit(1);
}

const out = resolve(arg('--out', '.verify'));
const base = arg('--base', 'http://localhost:4321');
const url = base ? new URL(target, base).href : pathToFileURL(resolve(target)).href;
const SIZES = [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'phone']];

let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  puppeteer = (await import('puppeteer-core')).default;
}

const launch = { headless: 'new' };
if (process.env.CHROME) launch.executablePath = process.env.CHROME;

mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch(launch);
const problems = [];
const note = (level, msg) => problems.push({ level, msg });

for (const [w, h, label] of SIZES) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });

  const errors = [];
  const failed = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => failed.push(r.url()));

  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));

  const report = await page.evaluate((viewportH) => {
    const luminance = (colour) => {
      const parts = (colour.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(Number);
      const [r, g, b] = parts.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const behind = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        node = node.parentElement;
      }
      return 'rgb(255, 255, 255)';
    };
    const ratio = (a, b) => {
      const values = [luminance(a), luminance(b)].sort((m, n) => n - m);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };

    const lowContrast = [];
    const longLines = [];
    const selector = 'p, li, h1, h2, h3, h4, a, button, span, td, label';
    const texts = Array.from(document.querySelectorAll(selector))
      .filter((el) => el.offsetParent !== null && el.textContent.trim().length > 12)
      .slice(0, 400);

    for (const el of texts) {
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const contrast = ratio(style.color, behind(el));
      const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
      const need = large ? 3 : 4.5;
      if (contrast < need) {
        lowContrast.push({ text: el.textContent.trim().slice(0, 40), ratio: Number(contrast.toFixed(2)), need });
      }
      if (el.matches('p, li')) {
        const chars = el.getBoundingClientRect().width / (size * 0.5);
        if (chars > 85) longLines.push({ chars: Math.round(chars) });
      }
    }

    const limit = document.documentElement.clientWidth + 1;
    const wide = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.getBoundingClientRect().right > limit)
      .slice(0, 5)
      .map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));

    const images = Array.from(document.images).map((img) => {
      const box = img.getBoundingClientRect();
      return {
        src: (img.currentSrc || img.src).split('/').pop(),
        sized: Boolean(img.getAttribute('width') || img.style.aspectRatio || getComputedStyle(img).aspectRatio !== 'auto'),
        alt: img.getAttribute('alt') === null ? 'missing' : (img.alt === '' ? 'decorative' : 'yes'),
        natural: img.naturalWidth + 'x' + img.naturalHeight,
        shown: Math.round(box.width) + 'x' + Math.round(box.height),
        oversized: box.width > 0 && img.naturalWidth > box.width * 2.2,
        aboveFold: box.top < viewportH,
      };
    });

    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      wide,
      lowContrast,
      longLines,
      images,
      h1s: document.querySelectorAll('h1').length,
      height: Math.round(document.documentElement.scrollHeight),
    };
  }, h);

  const weight = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    const total = entries.reduce((sum, e) => sum + (e.transferSize || e.encodedBodySize || 0), 0);
    return Math.round(total / 1024);
  });

  await page.screenshot({ path: join(out, basename(target, '.html') + '-' + label + '.png') });

  const unsized = report.images.filter((i) => !i.sized).length;
  const noAlt = report.images.filter((i) => i.alt === 'missing').length;
  const heavy = report.images.filter((i) => i.oversized);

  console.log('\n' + label + '  ' + w + 'x' + h);
  console.log('  page height         ' + report.height + 'px (' + (report.height / h).toFixed(1) + ' screens)');
  console.log('  transferred         ' + weight + 'KB');
  console.log('  horizontal overflow ' + (report.overflow ? 'YES: ' + report.wide.join(', ') : 'no'));
  console.log('  console errors      ' + (errors.length ? errors.length + ': ' + errors[0].slice(0, 80) : 'none'));
  console.log('  failed requests     ' + (failed.length || 'none'));
  console.log('  low contrast        ' + report.lowContrast.length);
  report.lowContrast.slice(0, 3).forEach((c) => console.log('      ' + c.ratio + ':1 needs ' + c.need + '  "' + c.text + '"'));
  console.log('  long lines          ' + report.longLines.length + (report.longLines[0] ? ' (' + report.longLines[0].chars + ' characters)' : ''));
  console.log('  images              ' + report.images.length + ', ' + unsized + ' unsized, ' + noAlt + ' without alt, ' + heavy.length + ' oversized');
  heavy.slice(0, 3).forEach((i) => console.log('      ' + i.src + ': ' + i.natural + ' shown at ' + i.shown));
  if (label === 'desktop' && report.h1s !== 1) console.log('  headings            ' + report.h1s + ' h1 elements, expected 1');

  if (report.overflow) note('fail', label + ': horizontal overflow (' + report.wide.join(', ') + ')');
  if (errors.length) note('fail', label + ': ' + errors.length + ' console error(s)');
  if (failed.length) note('fail', label + ': ' + failed.length + ' failed request(s)');
  if (report.lowContrast.length) note('warn', label + ': ' + report.lowContrast.length + ' low-contrast text node(s)');
  if (unsized) note('warn', label + ': ' + unsized + ' image(s) without dimensions');
  if (noAlt) note('warn', label + ': ' + noAlt + ' image(s) without alt text');
  if (heavy.length) note('warn', label + ': ' + heavy.length + ' oversized image(s)');

  await page.close();
}

await browser.close();

console.log('\n---');
const fails = problems.filter((p) => p.level === 'fail');
const warns = problems.filter((p) => p.level === 'warn');

if (!problems.length) {
  console.log('Clean. Screenshots in ' + out);
} else {
  fails.forEach((p) => console.log('FAIL  ' + p.msg));
  warns.forEach((p) => console.log('warn  ' + p.msg));
  console.log('\nScreenshots in ' + out + '. Look at them: none of these checks can see taste.');
}

process.exit(fails.length ? 1 : 0);
