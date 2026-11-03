#!/usr/bin/env node
/* Capture every page and every home section as the record of what the site
 * looks like today. The blueprint reads docs/screens/index.json to build its
 * screens section, so this is the one place that decides what is captured.
 *
 *   npm run screens                        against http://localhost:4321
 *   node scripts/screens.mjs --base http://localhost:4322
 *   node scripts/screens.mjs --out some/folder      elsewhere, for a comparison
 *
 * Needs puppeteer, like verify.mjs:  npm i -D puppeteer
 * The site has to be served first:   npm run serve
 *
 * Every page and every home section is captured three times, at the three
 * viewports below, as webp. Pages are full height, sections are the element
 * alone. Scroll reveals are forced visible and transitions are switched off,
 * so the capture is the settled page and not a frame of it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { puppeteer = (await import('puppeteer-core')).default; }

const HERE = dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : join(HERE, '..', 'docs', 'screens');
const baseArg = process.argv.indexOf('--base');
const BASE = baseArg > -1 ? process.argv[baseArg + 1] : 'http://localhost:4321';
/* The three sizes the blueprint toggles between. Tablet is an iPad portrait,
   mobile is a current large phone; both are the sizes verify.mjs uses too. */
const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'tablet',  width: 834,  height: 1112 },
  { name: 'mobile',  width: 390,  height: 844 },
];

/* Every page, in the two groups the site map in section 10 uses. The three
   legal pages are drafts outside the publish allow-list, captured so the
   record is complete. */
const PAGES = [
  { slug: 'home',       path: '/',            title: 'Home',             group: 'customer' },
  { slug: 'shop',       path: '/shop/',       title: 'Shop',             group: 'customer' },
  { slug: 'product',    path: '/product/',    title: 'Product',          group: 'customer' },
  { slug: 'checkout',   path: '/checkout/',   title: 'Checkout',         group: 'customer' },
  { slug: 'nyc-water',  path: '/nyc-water/',  title: 'NYC water',        group: 'customer' },
  { slug: 'quiz',       path: '/quiz/',       title: 'Find your filter', group: 'customer' },
  { slug: 'signin',     path: '/signin/',     title: 'Sign in',          group: 'customer' },
  { slug: 'account',    path: '/account/',    title: 'Account',          group: 'customer' },
  { slug: 'about',      path: '/about/',      title: 'About',            group: 'customer' },
  { slug: 'contact',    path: '/contact/',    title: 'Contact',          group: 'customer' },
  { slug: 'privacy',    path: '/privacy/',    title: 'Privacy policy',   group: 'customer' },
  { slug: 'terms',      path: '/terms/',      title: 'Terms of service', group: 'customer' },
  { slug: 'shipping',   path: '/shipping-returns/', title: 'Shipping and returns', group: 'customer' },
  { slug: 'admin',      path: '/admin/',      title: 'Admin console',    group: 'staff' },
  { slug: 'manager',    path: '/manager/',    title: 'Manager',          group: 'staff' },
  { slug: 'sales',      path: '/sales/',      title: 'Sales',            group: 'staff' },
  { slug: 'technician', path: '/technician/', title: 'Technician',       group: 'staff' },
];

const SETTLE_CSS = `
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
`;

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

async function settle(url) {
  try { await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }); }
  catch { /* a hanging remote call is not a reason to skip the capture */ }
  await page.addStyleTag({ content: SETTLE_CSS });
  await page.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    // Walk the page so lazy images and observers fire, then come back.
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 300));
  });
}

const manifest = {
  captured: new Date().toISOString().slice(0, 10),
  base: BASE,
  viewports: VIEWPORTS,
  pages: PAGES.map(p => ({ ...p, shots: {} })),
  sections: [],
};
const sectionIndex = new Map();

for (const vp of VIEWPORTS) {
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

  for (const p of manifest.pages) {
    await settle(BASE + p.path);
    const file = `page-${p.slug}-${vp.name}.webp`;
    await page.screenshot({ path: join(OUT, file), type: 'webp', quality: 82, fullPage: true });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (vp.name === 'desktop') p.h1 = await page.evaluate(() => document.querySelector('h1')?.textContent.trim() || '');
    p.shots[vp.name] = { file, width: vp.width, height };
    console.log(`${vp.name.padEnd(8)} page     ${p.path.padEnd(14)} ${String(height).padStart(5)}px  ${file}`);
  }

  /* Home sections, in page order, by the data-home-section attribute the
     content editor already uses. */
  await settle(BASE + '/');
  const els = await page.$$('[data-home-section]');
  const seen = new Set();
  for (const el of els) {
    const name = await el.evaluate(e => e.getAttribute('data-home-section'));
    if (seen.has(name)) continue;
    seen.add(name);
    const box = await el.boundingBox();
    if (!box || box.height < 8) { console.log(`${vp.name.padEnd(8)} section  ${name.padEnd(14)} skipped, no box`); continue; }
    await el.evaluate(e => e.scrollIntoView({ block: 'start' }));
    await new Promise(r => setTimeout(r, 200));
    const file = `section-${name}-${vp.name}.webp`;
    await el.screenshot({ path: join(OUT, file), type: 'webp', quality: 82 });
    if (!sectionIndex.has(name)) {
      const heading = await el.evaluate(e => e.querySelector('h1, h2')?.textContent.trim() || '');
      const entry = { slug: name, heading, shots: {} };
      sectionIndex.set(name, entry);
      manifest.sections.push(entry);
    }
    sectionIndex.get(name).shots[vp.name] = { file, width: Math.round(box.width), height: Math.round(box.height) };
    console.log(`${vp.name.padEnd(8)} section  ${name.padEnd(14)} ${String(Math.round(box.height)).padStart(5)}px  ${file}`);
  }
}

await browser.close();
writeFileSync(join(OUT, 'index.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${manifest.pages.length} pages, ${manifest.sections.length} home sections, captured ${manifest.captured} from ${BASE}.`);
