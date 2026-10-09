#!/usr/bin/env node
/* A static server for looking at the site and for the render harness.
 *
 *   npm run serve            serves the repository root on 4321
 *   npm run serve -- --dist  serves dist/, which is what actually ships
 *
 * Dependency free, and deliberately dumb. It exists because the pages use
 * root-absolute paths (/css/..., /js/...), so opening a file directly gives
 * you unstyled markup and a false impression of a broken page.
 *
 * Serving dist/ is the honest check: it is the only way to find out that a
 * file you forgot to add to the publish list is missing, before a deploy
 * finds out for you.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', process.argv.includes('--dist') ? 'dist' : '.');
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const exists = async (p) => {
  try { return (await stat(p)).isFile(); } catch { return false; }
};

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  /* normalize collapses any ../ before it can leave the root. */
  const rel = normalize(url).replace(/^(\.\.[\\/])+/, '').replace(/^[\\/]+/, '');
  const base = join(ROOT, rel);

  const candidates = url.endsWith('/') || !extname(url)
    ? [join(base, 'index.html'), base + '.html', base]
    : [base];

  for (const file of candidates) {
    if (!file.startsWith(join(ROOT))) continue;
    if (await exists(file)) {
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`404 ${url}\nServing ${ROOT}`);
}).listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}/`);
  console.log('Stop with ctrl-c.');
});
