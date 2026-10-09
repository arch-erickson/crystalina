#!/usr/bin/env node
/* Assemble the publishable site into dist/.
 *
 *   npm run build:site        about a second
 *
 * This is not a bundler and it compiles nothing. It copies an explicit list
 * of things into dist/, and that list is the whole point: what is published
 * is decided here, by name, rather than by whatever happens to be sitting in
 * the repository on the day of a deploy.
 *
 * Why it exists (AD7). Serving the repository root publishes the repository.
 * Verified on 2026-10-09 against the live Vercel host: the SQL migrations,
 * the test files and the internal task list were all downloadable. Cloudflare
 * Pages would be worse, because it has no special case for /api and would
 * publish the function source as well.
 *
 * Adding a file to the site means adding it here. That is deliberate
 * friction, and it is cheaper than the alternative.
 */
import {
  cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, writeFileSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(ROOT, 'dist');

/* Directories that go across whole. */
const DIRS = [
  'css', 'js', 'images',
  'about', 'account', 'admin', 'checkout', 'contact', 'manager', 'nyc-water',
  'product', 'quiz', 'sales', 'shop', 'signin', 'technician',
];

/* Single files at the root. Each one is here because something depends on it
   being at exactly this URL. */
const FILES = [
  ['index.html', 'The home page'],
  ['robots.txt', 'Points crawlers at the sitemap'],
  ['sitemap.xml', 'Listed in robots.txt'],
  ['site.webmanifest', 'Referenced by the page head'],
  ['favicon.ico', 'Requested by browsers at the root by convention'],
  ['favicon-16.png', 'Page head'],
  ['favicon-32.png', 'Page head'],
  ['favicon-48.png', 'Page head'],
  ['favicon-96.png', 'Page head'],
  ['apple-touch-icon.png', 'iOS home screen'],
  ['icon-192.png', 'Web manifest'],
  ['icon-512.png', 'Web manifest'],
  ['logo-mark.png', 'Brand mark'],
  ['logo-text.png', 'Brand mark'],
  ['logo-text-mark.png', 'Brand mark'],
  ['extended-logo-mark.png', 'Brand mark'],
  ['googlea4ca9585bd44aaf9.html', 'Google Search Console verification. Removing it un-verifies the property'],
  ['_headers', 'Cloudflare Pages response headers'],
  ['_routes.json', 'Tells Pages which paths run a function and which are static'],
];

/* Never publishable, whatever else changes. Checked after the copy, so a
   mistake in the lists above is caught rather than shipped. */
const FORBIDDEN = [
  /(^|[\\/])\.env/i,
  /(^|[\\/])supabase[\\/]/i,
  /(^|[\\/])tests?[\\/]/i,
  /(^|[\\/])scripts[\\/]/i,
  /(^|[\\/])docs[\\/]/i,
  /(^|[\\/])api[\\/]/i,
  /(^|[\\/])functions[\\/]/i,
  /(^|[\\/])node_modules[\\/]/i,
  /(^|[\\/])\.git[\\/]/i,
  /\.sql$/i,
  /\.test\.c?[jm]?js$/i,
  /(^|[\\/])(CODEX_\w+|LAUNCH_CHECKLIST|DEPLOY_STEPS|IMAGE_PROMPTS|design-qa)\.md$/i,
  /(^|[\\/])package(-lock)?\.json$/i,
  /(^|[\\/])wrangler\.toml$/i,
];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

let copied = 0;
const skipped = [];

for (const dir of DIRS) {
  const from = join(ROOT, dir);
  if (!existsSync(from)) { skipped.push(dir + '/'); continue; }
  cpSync(from, join(DIST, dir), { recursive: true });
}
for (const [file] of FILES) {
  const from = join(ROOT, file);
  if (!existsSync(from)) { skipped.push(file); continue; }
  cpSync(from, join(DIST, file));
}

const published = walk(DIST);
copied = published.length;

/* The check that makes the list trustworthy. */
const leaked = published
  .map((f) => relative(DIST, f))
  .filter((rel) => FORBIDDEN.some((re) => re.test(rel)));

if (leaked.length) {
  console.error('These would have been published and must not be:');
  leaked.forEach((f) => console.error('  ' + f));
  console.error('\nFix the lists at the top of scripts/build-site.mjs.');
  process.exit(1);
}

/* A manifest, so a deploy can be diffed against the last one. */
writeFileSync(join(DIST, '_manifest.txt'),
  published.map((f) => relative(DIST, f).replace(/\\/g, '/')).sort().join('\n') + '\n');

console.log(`dist/  ${copied} files, nothing on the forbidden list`);
if (skipped.length) {
  console.log('not found, so not published: ' + skipped.join(', '));
}
console.log('\nPages: build command `npm run build:site`, output directory `dist`.');
