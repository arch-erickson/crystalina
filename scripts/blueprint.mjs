#!/usr/bin/env node
/* Generate the blueprint, as a page and as markdown.
 *
 *   npm run blueprint
 *
 * Source: docs/blueprint-content.mjs for the prose, docs/diagrams/model.mjs
 * for everything the diagrams and the generated tables are drawn from.
 * Output: docs/blueprint.html and docs/blueprint.md, both generated, neither
 * ever edited by hand.
 *
 * The page carries the drawings inline, against one icon sprite at the top,
 * so it is a single file someone can open, print or send. The markdown
 * carries the same content with the drawings as links, so the blueprint is
 * still readable in a pull request.
 *
 * `npm run blueprint:check` fails when either output no longer matches the
 * source, which is what stops a published copy drifting from its own notes.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../docs/diagrams/model.mjs';
import { doc as meta, sections } from '../docs/blueprint-content.mjs';
import { buildAll } from './diagrams.mjs';
import { arrowDefs, esc } from './lib/svg.mjs';
import { TYPE } from './lib/tokens.mjs';
import { sprite } from './lib/icons.mjs';
import { buildGraph } from './lib/graph.mjs';
import { css as viewerCSS, js as viewerJS } from './lib/viewer.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', 'docs');
const CHECK = process.argv.includes('--check');

const { written } = buildAll({ write: false });
const byName = new Map(written.map((d) => [d.name, d]));
const allIcons = [...new Set(written.flatMap((d) => d.icons))].sort();

/* ------------------------------------------------------------------ *
 * The registry, and two checks that stop it drifting from the drawings.
 * ------------------------------------------------------------------ */

const G = buildGraph(M);

const unresolved = G.unresolved();
if (unresolved.length) {
  console.error('These cross-references name a node that does not exist:');
  unresolved.forEach((u) => console.error('  ' + u));
  process.exit(1);
}

/* Every key a drawing writes into data-node has to have a panel, or a
   reader clicks a card and nothing happens. */
const drawnKeys = new Set();
for (const d of written) {
  for (const m of d.body.matchAll(/data-node="([^"]+)"/g)) drawnKeys.add(m[1]);
}
const orphans = [...drawnKeys].filter((k) => !G.get(k));
if (orphans.length) {
  console.error('These cards are drawn with no panel behind them:');
  orphans.forEach((o) => console.error('  ' + o));
  process.exit(1);
}

/* And the other way: a drawing name in the registry that nothing emits
   would send a reader to a link that is not there. */
const badShown = [...G.nodes.values()]
  .flatMap((n) => n.shown)
  .filter((name, i, all) => all.indexOf(name) === i && !byName.has(name));
if (badShown.length) {
  console.error('The registry points at drawings that are not generated: ' + badShown.join(', '));
  process.exit(1);
}

const domId = (key) => 'n-' + String(key).replace(/[^a-z0-9]+/gi, '-');
const figId = (name) => 'fig-' + name.replace(/\.svg$/, '');

/* "Supabase Postgres" is a card in two drawings and "Stripe" is a card in
   two more. In a list of links that is two identical rows, so anything
   whose name is not unique carries where it is from. */
const labelCount = new Map();
for (const n of G.nodes.values()) {
  labelCount.set(n.label, (labelCount.get(n.label) || 0) + 1);
}
const nodeLabel = (n) => (labelCount.get(n.label) > 1
  ? `${esc(n.label)} <span class="np-via">${esc(n.kind)}</span>`
  : esc(n.label));

/* ------------------------------------------------------------------ *
 * Tables the model generates, so they cannot disagree with a diagram.
 * ------------------------------------------------------------------ */

const featureMatrix = () => ({
  head: ['Page', 'Route', 'Design', 'Server', 'What remains'],
  rows: M.pages.map((p) => [
    p.label, p.route, p.design, p.server, p.remaining.join(' '),
  ]),
});

const secretsTable = () => ({
  head: ['Name', 'Secret', 'Where it is allowed to exist'],
  rows: M.deployment.secrets.map((s) => [s.name, s.secret ? 'Yes' : 'No', s.where]),
});

const verifiedTable = () => ({
  head: ['What was checked', 'When', 'How'],
  rows: Object.entries(M.meta.verified).map(([k, v]) => [
    k.charAt(0).toUpperCase() + k.slice(1), v.date, v.how,
  ]),
});

const personalTable = () => ({
  head: ['What is held', 'Where', 'For how long'],
  rows: M.personalData.map((d) => [d.what, d.where, d.how]),
});

const generated = {
  matrix: featureMatrix,
  secrets: secretsTable,
  verified: verifiedTable,
  personal: personalTable,
};

/* ------------------------------------------------------------------ *
 * HTML
 * ------------------------------------------------------------------ */

const statusPill = (word) => {
  const key = String(word).toLowerCase().replace('-', '');
  return `<span class="st s-${key}">${esc(word)}</span>`;
};

/* Status words inside table cells are pilled, so the prose and the
   drawings read with the same vocabulary. */
const cell = (v) => {
  const w = String(v).trim();
  if (['Implemented', 'Partial', 'Missing', 'Refactor', 'Post-MVP', 'Yes', 'No'].includes(w)) {
    return statusPill(w);
  }
  if (['Critical', 'High', 'Medium', 'Low'].includes(w)) {
    return `<span class="sev v-${w.toLowerCase()}">${esc(w)}</span>`;
  }
  return esc(w);
};

const tableHTML = (t) => `<div class="tbl"><table>
<thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${t.rows.map((row) => `<tr>${row.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div>${t.caption ? `<p class="cap">${esc(t.caption)}</p>` : ''}`;


/* ------------------------------------------------------------------ *
 * Screens. docs/screens/index.json is written by scripts/screens.mjs and
 * lists every page and home section at three viewports. The images stay
 * as files beside the page; the Artifact publishes them as its files.
 * ------------------------------------------------------------------ */
const SCREENS_FILE = join(DOCS, 'screens', 'index.json');
const SCREENS = existsSync(SCREENS_FILE) ? JSON.parse(readFileSync(SCREENS_FILE, 'utf8')) : null;

/* Join the captures to the page nodes, so a page's own bubble shows what
   that page looks like. The site map says what a page is for and what is
   left to do on it; the capture says what it actually looks like today.
   Those were two sections saying the same thing in different ways.

   Joined on the route, falling back to the slug, and silent when there is
   no capture: a page added since the last `npm run screens` simply has no
   picture rather than a broken one. */
function attachShots() {
  if (!SCREENS) return 0;
  const byPath = new Map(SCREENS.pages.map((p) => [p.path, p]));
  const bySlug = new Map(SCREENS.pages.map((p) => [p.slug, p]));
  let joined = 0;
  for (const p of M.pages) {
    const node = G.get(`page:${p.id}`);
    if (!node) continue;
    const shot = byPath.get(p.route.split('?')[0]) || bySlug.get(p.id);
    if (!shot) continue;
    node.shot = shot;
    joined += 1;
  }
  return joined;
}
const SHOTS_JOINED = attachShots();

/* The capture inside a bubble: the desktop frame, cropped to something a
   panel can hold, with the other two widths a click away. */
function shotHTML(n) {
  if (!n.shot) return '';
  const vps = SCREENS.viewports;
  const desktop = n.shot.shots.desktop;
  if (!desktop) return '';
  const others = vps.filter((v) => v.name !== 'desktop' && n.shot.shots[v.name]);
  return `<figure class="np-shot">
<a href="screens/${desktop.file}" target="_blank" rel="noopener" title="Open the full capture">
  <img src="screens/${desktop.file}" alt="${esc(n.label)} as it looks today"
       loading="lazy" width="${desktop.width}" height="${desktop.height}">
</a>
<figcaption>Captured ${esc(SCREENS.captured)}${others.length
    ? ` · ${others.map((v) => `<a href="screens/${n.shot.shots[v.name].file}" target="_blank" rel="noopener">${esc(v.name)}</a>`).join(' · ')}`
    : ''}</figcaption>
</figure>`;
}

function screensHTML() {
  if (!SCREENS) return '<p class="cap">No captures yet. Serve the site and run <code>npm run screens</code>.</p>';
  const vps = SCREENS.viewports;
  const frame = (item, kind) => vps.map((vp) => {
    const shot = item.shots[vp.name];
    if (!shot) return '';
    const shown = kind === 'page' ? Math.min(shot.height, Math.round(vp.height * 1.6)) : shot.height;
    return `<a class="screen-frame" data-vp="${vp.name}" href="screens/${shot.file}" target="_blank" rel="noopener" style="aspect-ratio:${shot.width}/${shown}"><img src="screens/${shot.file}" alt="${esc(item.title || item.heading || item.slug)} at ${vp.name}, ${vp.width} pixels wide" loading="lazy" width="${shot.width}" height="${shot.height}"></a>`;
  }).join('');
  const pageCard = (p) => `<figure class="screen-card">
  <figcaption><span class="screen-name">${esc(p.title)}</span><code>${esc(p.path)}</code>${p.h1 ? `<span class="screen-h1">${esc(p.h1)}</span>` : ''}</figcaption>
  ${frame(p, 'page')}
</figure>`;
  const sectionCard = (sct) => `<figure class="screen-card">
  <figcaption><span class="screen-name">${esc(sct.heading || sct.slug)}</span><code>data-home-section="${esc(sct.slug)}"</code></figcaption>
  ${frame(sct, 'section')}
</figure>`;
  const group = (title, cards) => `<h3>${esc(title)}</h3><div class="screen-grid">${cards.join('')}</div>`;
  return `<div class="screens" data-vp="desktop" id="screens">
<div class="screens-toggle" role="tablist" aria-label="Viewport">
  ${vps.map((vp, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-set-vp="${vp.name}">${esc(vp.name[0].toUpperCase() + vp.name.slice(1))} <small>${vp.width}</small></button>`).join('')}
  <span class="screens-note">Captured ${esc(SCREENS.captured)}. Each frame scrolls; click one to open the full capture.</span>
</div>
${group('What a customer sees', SCREENS.pages.filter((p) => p.group === 'customer').map(pageCard))}
${group('What the staff see', SCREENS.pages.filter((p) => p.group === 'staff').map(pageCard))}
${group('The home page, section by section', SCREENS.sections.map(sectionCard))}
</div>
<script>
(function () {
  var root = document.getElementById('screens');
  if (!root) return;
  root.querySelectorAll('[data-set-vp]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.setAttribute('data-vp', b.getAttribute('data-set-vp'));
      root.querySelectorAll('[data-set-vp]').forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
    });
  });
})();
</script>`;
}

function screensMD() {
  if (!SCREENS) return 'No captures yet. Serve the site and run npm run screens.';
  const line = (item, label) => `- **${label}**: ${SCREENS.viewports.map((vp) => item.shots[vp.name] ? `[${vp.name}](screens/${item.shots[vp.name].file})` : '').filter(Boolean).join(', ')}`;
  return [
    `Captured ${SCREENS.captured} at ${SCREENS.viewports.map((v) => v.width).join(', ')} pixels wide.`,
    '', '### What a customer sees',
    ...SCREENS.pages.filter((p) => p.group === 'customer').map((p) => line(p, `${p.title} ${p.path}`)),
    '', '### What the staff see',
    ...SCREENS.pages.filter((p) => p.group === 'staff').map((p) => line(p, `${p.title} ${p.path}`)),
    '', '### The home page, section by section',
    ...SCREENS.sections.map((s) => line(s, s.heading || s.slug)),
  ].join('\n');
}

function diagramHTML(name) {
  const d = byName.get(name);
  if (!d) return `<p class="cap">Missing drawing: ${esc(name)}</p>`;
  const minW = Math.min(d.w, 960);
  return `<figure class="diagram" id="${figId(d.name)}">
<svg class="fx" viewBox="0 0 ${d.w} ${d.h}" style="min-width:${minW}px" role="img" aria-label="${esc(d.desc || d.title)}">${d.body}</svg>
</figure>
<p class="cap"><strong>${esc(d.title)}.</strong> ${esc(d.caption)} <a href="diagrams/${d.name}">Open on its own</a></p>`;
}

/* ------------------------------------------------------------------ *
 * The detail panels. One article per node, written into the page so
 * that a reader with scripting off gets an index rather than nothing,
 * and the viewer has something to lift into the drawer.
 *
 * Each one answers four questions and stops: what is this, how far
 * along is it, what is it waiting on, what is waiting on it.
 * ------------------------------------------------------------------ */

const depList = (edges, heading) => {
  /* Edges arrive carrying their own relationship word. Group by it, so a
     node that both feeds and is fed reads as two short lists rather than
     one long one. */
  const groups = new Map();
  for (const e of edges) {
    const [rel, detail] = e.rel.split(/:\s*/);
    if (!groups.has(rel)) groups.set(rel, []);
    groups.get(rel).push({ key: e.key, detail });
  }
  if (!groups.size) return '';
  return [...groups].map(([rel, items]) => `<h4>${esc(rel === 'Then' || rel === 'After' ? heading(rel) : rel)}</h4>
<ul class="np-dep">${items.map(({ key, detail }) => {
    const n = G.get(key);
    if (!n) return '';
    return `<li><a href="#${domId(key)}" data-go="${esc(key)}">${nodeLabel(n)}</a>`
      + `${detail ? ` <span class="np-via">${esc(detail)}</span>` : ''}`
      + `${n.status ? statusPill(n.status) : ''}</li>`;
  }).join('')}</ul>`).join('');
};

function panelHTML(n) {
  const where = n.shown
    .filter((name) => byName.get(name))
    .map((name) => `<a href="#${figId(name)}">${esc(byName.get(name).title)}</a>`);
  return `<article class="np" id="${domId(n.key)}" data-np="${esc(n.key)}">
<h3>${esc(n.label)}${n.status ? statusPill(n.status) : ''}</h3>
<p class="np-kind">${esc(n.kind)}${n.sub ? ` · ${esc(n.sub)}` : ''}</p>
${shotHTML(n)}
${n.what ? `<h4>What it is</h4><p>${esc(n.what)}</p>` : ''}
${n.why ? `<h4>Why it is where it is</h4><p>${esc(n.why)}</p>` : ''}
${depList(n.in, (r) => (r === 'After' ? 'Comes after' : 'Then'))}
${depList(n.out, (r) => (r === 'Then' ? 'Then' : 'Comes after'))}
${n.see.length ? `<h4>See also</h4><ul class="np-dep">${n.see.map((k) => {
    const o = G.get(k);
    return o ? `<li><a href="#${domId(k)}" data-go="${esc(k)}">${nodeLabel(o)}</a>${o.status ? statusPill(o.status) : ''}</li>` : '';
  }).join('')}</ul>` : ''}
${n.extra.filter(([, v]) => v && v.length).length ? `<dl>${n.extra.filter(([, v]) => v && v.length)
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${Array.isArray(v)
      ? `<ul>${v.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : cell(v)}</dd>`).join('')}</dl>` : ''}
${where.length ? `<p class="np-where">Drawn in ${where.join(', ')}</p>` : ''}
</article>`;
}

/* The index is grouped, because 120 panels in one list is a list nobody
   reads. The order is the order a reader meets them in the document. */
const INDEX_GROUPS = [
  ['Findings', 'finding'], ['Pages', 'page'], ['Architecture today', 'now'],
  ['Request path', 'rq'], ['After the cutover', 'target'], ['Channels', 'asset'],
  ['Tables', 'table'], ['Flows', 'flow'], ['Threats', 'threat'],
  ['Deploy stages', 'stage'], ['Owner tasks', 'own'], ['Phases', 'phase'],
  ['Risks', 'risk'], ['One definition', 'def'], ['Postponed', 'trigger'],
  ['Decisions', 'ad'], ['Unknowns', 'unknown'],
];

function indexHTML() {
  return INDEX_GROUPS.map(([label, ns]) => {
    const list = G.order.map((k) => G.get(k)).filter((n) => n.ns === ns);
    if (!list.length) return '';
    return `<h3>${esc(label)}</h3>
<div class="np-index">${list.map(panelHTML).join('\n')}</div>`;
  }).join('\n');
}

function blockHTML(b) {
  switch (b.t) {
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h3': return `<h3>${esc(b.text)}</h3>`;
    case 'h4': return `<h4>${esc(b.text)}</h4>`;
    case 'ul': return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
    case 'table': return tableHTML(b);
    case 'diagram': return diagramHTML(b.name);
    case 'screens': return screensHTML();
    case 'callout': return `<div class="callout ${b.kind || 'note'}">
<span class="k">${esc(b.title || '')}</span>
${b.text ? `<p>${esc(b.text)}</p>` : ''}
${b.items ? `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
</div>`;
    case 'index': return indexHTML();
    default:
      if (generated[b.t]) return tableHTML(generated[b.t]());
      return '';
  }
}

const tocHTML = sections.map((s) =>
  `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('\n        ');

const sectionsHTML = sections.map((s, i) => `<section class="s" id="${s.id}">
<h2><span class="n">${i + 1}</span>${esc(s.title)}</h2>
${s.blocks.map(blockHTML).join('\n')}
</section>`).join('\n\n');

const head = `<title>${esc(meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${esc(TYPE.googleHref)}" />
<style>
:root{
  color-scheme:light;
  /* Crystalina palette, from css/styles.css. The amber is diagram-only:
     it never appears on a page a customer sees. */
  --navy:#15375D; --navy-2:#1F4C80; --blue:#2A7BC4; --blue-light:#53A4DA;
  --cyan:#3DC7F4; --silver:#CFD2D3;
  --ground:#FFFFFF; --surface:#FFFFFF; --tile:#F2F5F8; --wash:#F5F8FB;
  --line:#D8DEE5; --line-soft:#E7EBEF;
  --ink:#15375D; --ink-2:#36485C; --ink-3:#5A646D;
  --amber:#B06E1A; --amber-wash:#FDF2E2; --amber-ink:#6B3F08;
  /* The two faces, from the one place that names them. These were written
     out as Inter and Poppins while the loader above asked for Montserrat
     and Playfair, so this page rendered in neither. See AD8 and AD12. */
  --sans:${TYPE.sans};
  --head:${TYPE.display};
  --mono:${TYPE.mono};
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:1.5rem}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.62;-webkit-font-smoothing:antialiased}
a{color:var(--blue);text-underline-offset:3px}
a:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:2px}
code{font-family:var(--mono);font-size:.84em;background:var(--tile);padding:.08em .35em;border-radius:3px}
.shell{display:grid;grid-template-columns:252px minmax(0,1fr);max-width:1720px;margin:0 auto}
nav.toc{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:2rem 1.2rem 2rem 1.6rem;border-right:1px solid var(--line-soft)}
nav.toc .brand{font-family:var(--head);font-weight:600;font-size:1.3rem;line-height:1.1;margin:0 0 .15rem}
nav.toc .sub{font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);margin:0 0 1.3rem}
nav.toc ol{list-style:none;margin:0;padding:0;counter-reset:t;display:grid;gap:.08rem}
nav.toc li{counter-increment:t}
nav.toc a{display:grid;grid-template-columns:1.7rem 1fr;text-decoration:none;color:var(--ink-2);font-size:.79rem;padding:.24rem .3rem;border-radius:3px}
nav.toc a::before{content:counter(t);font-family:var(--mono);font-size:.7rem;color:var(--ink-3);font-variant-numeric:tabular-nums}
nav.toc a:hover{background:var(--tile);color:var(--navy)}
main{padding:2.6rem clamp(1.2rem,3.4vw,3.2rem) 6rem;min-width:0}
header.doc{max-width:900px;margin-bottom:2rem}
.eyebrow{font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);font-weight:700}
h1{font-family:var(--head);font-weight:600;font-size:clamp(2rem,3.6vw,2.9rem);line-height:1.06;margin:.4rem 0 .7rem;text-wrap:balance}
.lede{font-size:1.02rem;color:var(--ink-2);max-width:70ch;margin:0}
.meta{display:flex;flex-wrap:wrap;gap:.4rem 1.4rem;margin-top:1.1rem;font-size:.78rem;color:var(--ink-3)}
.meta b{font-weight:600;color:var(--ink-2)}
section.s{border-top:1px solid var(--line);padding:2.3rem 0 .6rem}
section.s>h2{display:flex;gap:.9rem;align-items:baseline;font-family:var(--head);font-weight:600;font-size:clamp(1.45rem,2.3vw,1.95rem);line-height:1.1;margin:0 0 1rem;text-wrap:balance}
section.s>h2 .n{font-family:var(--mono);font-size:.78rem;color:var(--blue);font-weight:500;min-width:1.5rem}
h3{font-size:1rem;font-weight:600;margin:1.7rem 0 .5rem}
h4{font-size:.73rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin:1.3rem 0 .4rem}
p,li{max-width:76ch}
p{margin:.5rem 0 .8rem}
ul,ol{padding-left:1.2rem;margin:.4rem 0 .9rem}
li{margin:.2rem 0}
.st{display:inline-block;font-size:.63rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:.12rem .45rem;border-radius:2px;white-space:nowrap;border:1px solid transparent}
.s-implemented{background:#E6F2FB;color:var(--navy);border-color:var(--blue)}
.s-partial{background:var(--amber-wash);color:var(--amber-ink);border-color:var(--amber)}
.s-missing{background:#fff;color:#44505B;border:1px dashed #98A2AC}
.s-refactor{background:#EDF1F4;color:var(--navy);border-color:var(--blue-light)}
.s-postmvp{background:#F7F8F9;color:var(--ink-3);border:1px dashed var(--silver)}
.s-yes{background:var(--amber-wash);color:var(--amber-ink);border-color:var(--amber)}
.s-no{background:var(--tile);color:var(--ink-3);border-color:var(--line)}
.sev{display:inline-block;font-size:.63rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:.12rem .45rem;border-radius:2px;white-space:nowrap}
.v-critical{background:#15375D;color:#fff}
.v-high{background:var(--amber-wash);color:var(--amber-ink);border:1px solid var(--amber)}
.v-medium{background:#E6F2FB;color:var(--navy);border:1px solid var(--blue-light)}
.v-low{background:var(--tile);color:var(--ink-3);border:1px solid var(--line)}
.tbl{overflow-x:auto;margin:.8rem 0 1.2rem;border:1px solid var(--line-soft);border-radius:5px;background:var(--surface);max-width:1320px}
table{border-collapse:collapse;width:100%;font-size:.82rem;line-height:1.45}
th,td{text-align:left;vertical-align:top;padding:.55rem .75rem;border-bottom:1px solid var(--line-soft)}
th{font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);font-weight:700;background:var(--tile);white-space:nowrap}
tr:last-child td{border-bottom:0}
td:first-child{font-weight:500;color:var(--ink)}
td{color:var(--ink-2)}
.cap{font-size:.78rem;color:var(--ink-3);margin:.2rem 0 1.4rem;max-width:96ch}
.callout{border-left:3px solid var(--blue);background:var(--wash);padding:.8rem 1rem;margin:1rem 0;max-width:82ch;border-radius:0 5px 5px 0}
.callout.warn{border-left-color:var(--amber);background:var(--amber-wash)}
.callout.learn{border-left-color:var(--blue-light)}
.callout p,.callout li{margin:.25rem 0}
.callout .k{font-size:.63rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--ink-3);display:block;margin-bottom:.2rem}
.dec{background:var(--surface);border:1px solid var(--line-soft);border-radius:5px;padding:1rem 1.2rem;margin:1rem 0;max-width:1100px}
.dec h3{margin:0 0 .7rem;display:flex;gap:.7rem;align-items:baseline;flex-wrap:wrap;font-size:1.02rem}
.dec h3 .n{font-family:var(--mono);font-size:.78rem;color:var(--blue);font-weight:600}
.dec h3 .when{font-family:var(--mono);font-size:.7rem;color:var(--ink-3);font-weight:400;margin-left:auto}
.dec.unk{border-left:3px solid var(--blue-light)}
.dec dl{display:grid;grid-template-columns:minmax(130px,170px) minmax(0,1fr);gap:.34rem 1rem;margin:0;font-size:.86rem}
.dec dt{color:var(--ink-3);font-size:.73rem;font-weight:700;letter-spacing:.02em;padding-top:.12rem}
.dec dd{margin:0;color:var(--ink-2);max-width:82ch}
.diagram{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:8px;padding:10px;margin:1rem 0 .4rem}
.diagram svg{display:block;width:100%;height:auto}
footer.doc{border-top:1px solid var(--line);margin-top:2.6rem;padding-top:1.4rem;font-size:.8rem;color:var(--ink-3);max-width:80ch}
.screens-toggle{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin:.6rem 0 1.2rem}
.screens-toggle button{font:inherit;font-size:.78rem;font-weight:600;color:var(--ink-2);background:var(--tile);border:1px solid var(--line);border-radius:3px;padding:.38rem .8rem;cursor:pointer}
.screens-toggle button small{font-family:var(--mono);font-weight:400;color:var(--ink-3);margin-left:.25rem}
.screens-toggle button[aria-selected="true"]{background:var(--navy);color:#fff;border-color:var(--navy)}
.screens-toggle button[aria-selected="true"] small{color:#CFD2D3}
.screens-note{font-size:.76rem;color:var(--ink-3);margin-left:auto}
.screen-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.2rem 1rem;margin:0 0 1.6rem;max-width:1320px}
.screens[data-vp="mobile"] .screen-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.screen-card{margin:0;background:var(--surface);border:1px solid var(--line-soft);border-radius:5px;padding:.7rem .7rem .55rem}
.screen-card figcaption{display:flex;flex-wrap:wrap;align-items:baseline;gap:.2rem .6rem;margin-bottom:.55rem;font-size:.8rem}
.screen-name{font-weight:600;color:var(--ink)}
.screen-card figcaption code{font-size:.7rem}
.screen-h1{flex-basis:100%;color:var(--ink-3);font-size:.74rem;line-height:1.35}
.screen-frame{display:none;overflow-y:auto;overflow-x:hidden;background:var(--tile);border:1px solid var(--line);border-radius:3px;scrollbar-width:thin}
.screen-frame img{display:block;width:100%;height:auto}
.screens[data-vp="desktop"] .screen-frame[data-vp="desktop"],.screens[data-vp="tablet"] .screen-frame[data-vp="tablet"],.screens[data-vp="mobile"] .screen-frame[data-vp="mobile"]{display:block}
@media (max-width:1080px){
  .shell{grid-template-columns:minmax(0,1fr)}
  nav.toc{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line-soft);padding:1.2rem}
  nav.toc ol{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
}
@media (max-width:620px){.dec dl{grid-template-columns:minmax(0,1fr)}.dec dt{padding-top:.5rem}}
@media print{nav.toc{display:none}.shell{grid-template-columns:1fr}.diagram{break-inside:avoid}
  .np-drawer,.dg-full,.dg-bar{display:none!important}}
.np-via{font-size:.72rem;color:var(--ink-3)}
${viewerCSS}
</style>
`;

const bodyInner = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${sprite(allIcons)}</defs>${arrowDefs()}</svg>
<div class="shell">
  <nav class="toc" aria-label="Contents">
    <p class="brand">${esc(M.meta.project)}</p>
    <p class="sub">Blueprint</p>
    <ol>
        ${tocHTML}
    </ol>
  </nav>
  <main>
    <header class="doc">
      <p class="eyebrow">${esc(meta.shape)} · ${esc(meta.status)}</p>
      <h1>${esc(meta.title)}</h1>
      <p class="lede">${esc(meta.lede)}</p>
      <p class="meta">
        <span><b>Prepared</b> ${esc(meta.prepared)}</span>
        <span><b>State verified</b> ${esc(M.meta.verified.hosting.date)} (hosting), ${esc(M.meta.verified.database.date)} (database)</span>
        <span><b>Target</b> ${esc(M.meta.target)}</span>
      </p>
      <p class="meta"><span>${esc(meta.revised)}</span></p>
    </header>

${sectionsHTML}

    <footer class="doc">
      Generated ${esc(M.meta.asOf)} by <code>npm run blueprint</code> from
      <code>docs/blueprint-content.mjs</code> and <code>docs/diagrams/model.mjs</code>.
      Do not edit this file: the next regeneration overwrites it. Status words are the five used
      everywhere in this project, with no friendlier synonyms: Implemented, Partial, Missing,
      Refactor, Post-MVP.
    </footer>
  </main>
</div>
<script>${viewerJS}</script>
`;

/* Two surfaces, one markup. The Artifact is the primary one, so it gets the
   bare fragment the platform wraps in its own skeleton; the repository copy
   is a whole document that opens from the file system. Neither is written
   by hand, and both come from the same two strings above. */
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="robots" content="noindex" />
${head}
</head>
<body>
${bodyInner}
</body>
</html>
`;

const artifact = `${head}
${bodyInner}
`;

/* ------------------------------------------------------------------ *
 * Markdown, same content, drawings as links.
 * ------------------------------------------------------------------ */

const mdTable = (t) => {
  const row = (cells) => `| ${cells.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ')} |`;
  return [row(t.head), row(t.head.map(() => '---')), ...t.rows.map(row)].join('\n');
};

/* The same panels in markdown, so the document is whole in a pull request
   and not only in a browser. */
const depMD = (edges) => {
  const groups = new Map();
  for (const e of edges) {
    const [rel, detail] = e.rel.split(/:\s*/);
    if (!groups.has(rel)) groups.set(rel, []);
    groups.get(rel).push({ key: e.key, detail });
  }
  return [...groups].map(([rel, items]) => `- **${rel}.** ` + items.map(({ key, detail }) => {
    const n = G.get(key);
    return n ? `${n.label}${detail ? ` (${detail})` : ''}` : key;
  }).join('; '));
};

function indexMD() {
  return INDEX_GROUPS.map(([label, ns]) => {
    const list = G.order.map((k) => G.get(k)).filter((n) => n.ns === ns);
    if (!list.length) return '';
    return [`### ${label}`, '', ...list.flatMap((n) => [
      `#### ${n.label}${n.status ? ` · ${n.status}` : ''}`,
      '',
      `_${n.kind}${n.sub ? ` · ${n.sub}` : ''}._`,
      '',
      ...(n.what ? [n.what, ''] : []),
      ...(n.why ? [n.why, ''] : []),
      ...depMD(n.in), ...depMD(n.out),
      ...(n.see.length ? [`- **See also.** ${n.see.map((k) => (G.get(k) ? G.get(k).label : k)).join('; ')}`] : []),
      ...n.extra.filter(([, v]) => v && v.length)
        .map(([k, v]) => `- **${k}.** ${Array.isArray(v) ? v.join(' ') : v}`),
      '',
    ])].join('\n');
  }).filter(Boolean).join('\n');
}

function blockMD(b) {
  switch (b.t) {
    case 'p': return b.text;
    case 'h3': return `### ${b.text}`;
    case 'h4': return `#### ${b.text}`;
    case 'ul': return b.items.map((i) => `- ${i}`).join('\n');
    case 'ol': return b.items.map((i, n) => `${n + 1}. ${i}`).join('\n');
    case 'table': return mdTable(b);
    case 'diagram': {
      const d = byName.get(b.name);
      if (!d) return `_Missing drawing: ${b.name}_`;
      return `![${d.title}](diagrams/${d.name})\n\n_**${d.title}.** ${d.caption}_`;
    }
    case 'screens': return screensMD();
    case 'callout': return [
      `> **${b.title || 'Note'}**`, '>',
      ...(b.text ? [`> ${b.text}`] : []),
      ...(b.items ? b.items.map((i) => `> - ${i}`) : []),
    ].join('\n');
    case 'index': return indexMD();
    default:
      if (generated[b.t]) return mdTable(generated[b.t]());
      return '';
  }
}

const md = [
  `# ${meta.title}`,
  '',
  '<!-- Generated by `npm run blueprint`. Do not edit.',
  '     Source: docs/blueprint-content.mjs and docs/diagrams/model.mjs. -->',
  '',
  `| | |`,
  `| --- | --- |`,
  `| Shape | ${meta.shape} |`,
  `| Status | ${meta.status} |`,
  `| Prepared | ${meta.prepared} |`,
  `| State verified | ${M.meta.verified.hosting.date} (hosting), ${M.meta.verified.database.date} (database) |`,
  `| Target | ${M.meta.target} |`,
  `| Revised | ${meta.revised} |`,
  '',
  meta.lede,
  '',
  'A readable version of this document, with every drawing inline, is at',
  '[docs/blueprint.html](blueprint.html). The drawings on their own are in',
  '[docs/diagrams/](diagrams/index.html).',
  '',
  '## Contents',
  '',
  ...sections.map((s, i) => `${i + 1}. [${s.title}](#${i + 1}-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')})`),
  '',
  ...sections.flatMap((s, i) => [
    '---',
    '',
    `## ${i + 1}. ${s.title}`,
    '',
    ...s.blocks.map(blockMD).filter(Boolean).flatMap((x) => [x, '']),
  ]),
].join('\n');

/* ------------------------------------------------------------------ */

const outputs = [
  ['blueprint.html', html],
  ['blueprint.artifact.html', artifact],
  ['blueprint.md', md],
];
/* See the note in scripts/diagrams.mjs: the comparison is about content,
   and a checkout on Windows changes every line ending. */
const lf = (s) => String(s).split('\r\n').join('\n');
const stale = [];
for (const [name, body] of outputs) {
  const file = join(DOCS, name);
  if (CHECK) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (lf(old) !== lf(body)) stale.push(name);
  } else {
    writeFileSync(file, body);
    console.log(`wrote   docs/${name}`);
  }
}

if (CHECK) {
  if (stale.length) {
    console.error('The blueprint is out of date with its source: ' + stale.join(', '));
    console.error('Run `npm run blueprint` and commit the result.');
    process.exit(1);
  }
  console.log('The blueprint matches its source.');
} else {
  console.log(`\n${sections.length} sections, ${written.length} drawings inline, generated ${M.meta.asOf}.`);
}
