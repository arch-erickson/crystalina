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
import { sprite } from './lib/icons.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', 'docs');
const CHECK = process.argv.includes('--check');

const { written } = buildAll({ write: false });
const byName = new Map(written.map((d) => [d.name, d]));
const allIcons = [...new Set(written.flatMap((d) => d.icons))].sort();

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

const phasesTable = () => ({
  head: ['Phase', 'What gets built', 'Needs first', 'Owner', 'State'],
  rows: M.phases.map((p) => [
    `${p.id} · ${p.label}`, p.detail, p.needs.length ? p.needs.join(', ') : 'Nothing',
    p.owner, p.status,
  ]),
});

const verifiedTable = () => ({
  head: ['What was checked', 'When', 'How'],
  rows: Object.entries(M.meta.verified).map(([k, v]) => [
    k.charAt(0).toUpperCase() + k.slice(1), v.date, v.how,
  ]),
});

const definitionsTable = () => ({
  head: ['Defined once', 'Lives in', 'Read by', 'State'],
  rows: M.definitions.map((d) => [
    d.thing, d.home, d.readers.join(', '), d.status + (d.note ? `. ${d.note}` : ''),
  ]),
});

const generated = {
  matrix: featureMatrix,
  secrets: secretsTable,
  phases: phasesTable,
  verified: verifiedTable,
  definitions: definitionsTable,
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

function diagramHTML(name) {
  const d = byName.get(name);
  if (!d) return `<p class="cap">Missing drawing: ${esc(name)}</p>`;
  const minW = Math.min(d.w, 960);
  return `<figure class="diagram">
<svg class="fx" viewBox="0 0 ${d.w} ${d.h}" style="min-width:${minW}px" role="img" aria-label="${esc(d.desc || d.title)}">${d.body}</svg>
</figure>
<p class="cap"><strong>${esc(d.title)}.</strong> ${esc(d.caption)} <a href="diagrams/${d.name}">Open on its own</a></p>`;
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
    case 'callout': return `<div class="callout ${b.kind || 'note'}">
<span class="k">${esc(b.title || '')}</span>
${b.text ? `<p>${esc(b.text)}</p>` : ''}
${b.items ? `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
</div>`;
    case 'decision': return `<div class="dec" id="${b.id}">
<h3><span class="n">${esc(b.id)}</span> ${esc(b.title)} <span class="when">${esc(b.date)}</span></h3>
<dl>${Object.entries(b.fields).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
</div>`;
    case 'unknown': return `<div class="dec unk" id="${b.id}">
<h3><span class="n">${esc(b.id)}</span> ${esc(b.question)}</h3>
<dl>
<dt>Why it matters</dt><dd>${esc(b.why)}</dd>
<dt>How to resolve</dt><dd>${esc(b.how)}</dd>
<dt>Owner</dt><dd>${esc(b.owner)}</dd>
<dt>Blocks</dt><dd>${esc(b.blocks)}</dd>
</dl>
</div>`;
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

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="robots" content="noindex" />
<title>${esc(meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
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
  --sans:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
  --head:"Poppins","Inter",system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,Consolas,monospace;
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
@media (max-width:1080px){
  .shell{grid-template-columns:minmax(0,1fr)}
  nav.toc{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line-soft);padding:1.2rem}
  nav.toc ol{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
}
@media (max-width:620px){.dec dl{grid-template-columns:minmax(0,1fr)}.dec dt{padding-top:.5rem}}
@media print{nav.toc{display:none}.shell{grid-template-columns:1fr}.diagram{break-inside:avoid}}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${sprite(allIcons)}</defs>${arrowDefs()}</svg>
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
</body>
</html>
`;

/* ------------------------------------------------------------------ *
 * Markdown, same content, drawings as links.
 * ------------------------------------------------------------------ */

const mdTable = (t) => {
  const row = (cells) => `| ${cells.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ')} |`;
  return [row(t.head), row(t.head.map(() => '---')), ...t.rows.map(row)].join('\n');
};

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
    case 'callout': return [
      `> **${b.title || 'Note'}**`, '>',
      ...(b.text ? [`> ${b.text}`] : []),
      ...(b.items ? b.items.map((i) => `> - ${i}`) : []),
    ].join('\n');
    case 'decision': return [
      `#### ${b.id} · ${b.title}`, '',
      `_Decided ${b.date}._`, '',
      ...Object.entries(b.fields).map(([k, v]) => `- **${k}.** ${v}`),
    ].join('\n');
    case 'unknown': return [
      `#### ${b.id} · ${b.question}`, '',
      `- **Why it matters.** ${b.why}`,
      `- **How to resolve.** ${b.how}`,
      `- **Owner.** ${b.owner}`,
      `- **Blocks.** ${b.blocks}`,
    ].join('\n');
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

const outputs = [['blueprint.html', html], ['blueprint.md', md]];
const stale = [];
for (const [name, body] of outputs) {
  const file = join(DOCS, name);
  if (CHECK) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (old !== body) stale.push(name);
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
