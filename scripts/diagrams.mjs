#!/usr/bin/env node
/* Draw every diagram in the blueprint from docs/diagrams/model.mjs.
 *
 *   npm run diagrams
 *
 * Writes docs/diagrams/*.svg and the contact sheet docs/diagrams/index.html.
 * Nothing in those files is hand placed: edit the model, run this, commit
 * both. `npm run diagrams:check` fails if the committed drawings no longer
 * match the model, so a stale picture cannot survive a pull request.
 *
 * WebWork playbook 02 and 13: one source, a status word on every card, a date
 * on every drawing, white ground, real labels.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../docs/diagrams/model.mjs';
import {
  T, STATUS, INK, familyOf, doc, frame, box, text, line, path, elbow, vElbow,
  circle, chip, block, wrap, measure, bandLabel, statusLegend, esc, r,
} from './lib/svg.mjs';
import {
  Card, StatusCard, PageCard, TableCard, Lane, FailurePanel, NotePanel,
  ZonePanel, Connector, SectionRule, halo, toneOf, COMPONENTS,
} from './lib/components.mjs';
import { beginDoc, spriteUsed, usedNames, iconNames, use as useIcon } from './lib/icons.mjs';
import { Board, sequence, roundPath } from './lib/board.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'docs', 'diagrams');
const asOf = M.meta.asOf;
const CHECK = process.argv.includes('--check');
let WRITE = true;

const written = [];
const drift = [];

/* Each drawing is kept twice: as a standalone file, which carries the
   symbols it uses, and as a bare body, which docs/blueprint.html inlines
   against the one sprite at the top of that page. Same bytes either way,
   so the page and the files can never disagree. */
function emit(name, { w, h, title, desc, body, caption }) {
  const icons = usedNames();
  const svg = doc({ w, h, title, desc, body, sprite: spriteUsed() });
  const file = join(OUT, name);
  if (CHECK) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (old !== svg) drift.push(name);
  } else if (WRITE) {
    writeFileSync(file, svg);
  }
  written.push({ name, title, caption, desc, w, h, body, icons });
}

/* ================================================================ *
 * 1 and 2. Architecture, today and after the move.
 * ================================================================ */
function architecture(key, phase) {
  beginDoc();
  const CARD = 252;
  const PAD = 20;
  const COLW = CARD + PAD * 2;
  const GAPX = 104;
  const GAPY = 56;

  const cols = [...new Set(phase.zones.map((z) => z.col))].sort((a, b) => a - b);
  const colX = {};
  let x = 34;
  for (const c of cols) { colX[c] = x; x += COLW + GAPX; }
  const w = x - GAPX + 34;

  const fr = frame({ title: phase.title, note: phase.note, asOf, w });
  const board = new Board(w);
  const colY = {};
  for (const c of cols) colY[c] = fr.bottom + 58;

  const colOf = {};
  for (const zone of phase.zones) {
    const g = board.group({
      id: 'g-' + zone.id, x: colX[zone.col], y: colY[zone.col], w: COLW,
      family: zone.family, label: zone.label,
    });
    board.stack(g.id, zone.nodes.map((n) => ({
      id: n.id, label: n.label, detail: n.detail, note: n.note,
      status: n.status, family: n.family || zone.family, icon: n.icon,
    })), { top: 58, gap: 18, pad: PAD });
    for (const n of zone.nodes) colOf[n.id] = zone.col;
    colY[zone.col] = g.y + g.h + GAPY;
  }

  /* Two routing problems, both of which a straight midpoint gets wrong.

     Across a gap: several arrows would share one vertical leg, so each gets
     its own lane, in the order the edges are listed.

     Down a column: an arrow between two cards with a third card between
     them would run underneath it and look like two arrows. Those are sent
     out of the left face and down a lane beside the group instead. Cards
     that are next to each other in the stack still go straight down, into
     the gap between them, where there is nothing to hide behind. */
  const lanes = {};
  const sideLanes = {};
  for (const e of phase.edges) {
    const a = board.nodes[e.from];
    const b = board.nodes[e.to];
    if (!a || !b) continue;
    const edge = {
      from: e.from, to: e.to, label: e.label,
      family: e.family || b.family,
      dashed: Boolean(e.dash) || e.tone === 'mute',
    };
    const ca = colOf[e.from];
    const cb = colOf[e.to];

    if (cb > ca) {
      const k = lanes[ca] = (lanes[ca] || 0);
      lanes[ca] += 1;
      edge.midX = Math.round(colX[ca] + COLW + 26 + k * 20);
    } else if (ca === cb) {
      const between = board.cards.some((c) =>
        c !== a && c !== b && Math.abs(c.x - a.x) < 2
        && c.y > Math.min(a.y, b.y) && c.y < Math.max(a.y + a.h, b.y + b.h));
      if (between) {
        const k = sideLanes[ca] = (sideLanes[ca] || 0);
        sideLanes[ca] += 1;
        const lane = Math.round(colX[ca] - 16 - k * 18);
        edge.fs = 'left';
        edge.ts = 'left';
        edge.via = [[lane, a.y + a.h / 2], [lane, b.y + b.h / 2]];
        edge.anchor = 'end';
        edge.lx = lane - 8;
        edge.ly = Math.round((a.y + a.h / 2 + b.y + b.h / 2) / 2);
      }
    }
    board.edge(edge);
  }

  const { svg, maxY } = board.body();
  const h = maxY + 58;
  const body = fr.svg + svg + statusLegend(34, h - 22);

  emit(`architecture-${key}.svg`, {
    w, h, title: phase.title, desc: phase.note, body, caption: phase.note,
  });
}
function channels() {
  beginDoc();
  const CARD = 300;
  const GAP = 44;
  const groups = M.assets.groups;
  const w = 32 * 2 + groups.length * CARD + (groups.length - 1) * GAP;
  const note = M.assets.note;
  const fr = frame({ title: 'What Crystalina already holds, and whether it is wired to the site', note, asOf, w });
  const top = fr.bottom + 50;

  let bodyCards = '';
  let maxY = top;
  groups.forEach((g, gi) => {
    const x = 32 + gi * (CARD + GAP);
    bodyCards += bandLabel(x, top - 14, g.label, { size: 10.5, fill: T.navy });
    bodyCards += line(x, top - 6, x + CARD, top - 6, { stroke: T.blueLight });
    let yy = top + 12;
    for (const item of g.items) {
      const card = StatusCard(CARD, { ...item, status: item.wired }, { titleSize: 12.5 });
      bodyCards += card.draw(x, yy);
      yy += card.h + 10;
    }
    maxY = Math.max(maxY, yy);
  });

  const h = maxY + 56;
  const body = fr.svg
    + bodyCards
    + statusLegend(32, h - 24, ['Implemented', 'Partial', 'Missing']);

  emit('channels.svg', {
    w, h, desc: note, body,
    title: 'Channels and accounts already held',
    caption: 'The domain, Search Console, the Meta Business account and the WhatsApp number exist. The status on each card is whether the site actually uses it.',
    });
}

/* ================================================================ *
 * 4. Site map with a status on every page.
 * ================================================================ */
function sitemap() {
  beginDoc();
  const CARD = 300;
  const GAP = 44;
  const cols = 4;
  const w = 32 * 2 + cols * CARD + (cols - 1) * GAP;

  const note = 'Every page, the state of the server work behind it, and what a visitor or a staff member actually clicks. Menu, search and footer links are left out on purpose: drawn, they turn the arrows into a web. Dashed arrows are staff actions that reach a customer page.';
  const fr = frame({ title: 'Site map, with a status on every page', note, asOf, w });

  const made = M.pages.map((p) => ({ p, card: PageCard(CARD, p) }));
  const areas = [
    { id: 'client', label: 'What a customer sees', top: fr.bottom + 52 },
    { id: 'staff', label: 'What the staff see', top: 0 },
  ];

  const rects = {};
  let cardsSvg = '';
  let cursor = areas[0].top;
  let bandsSvg = '';

  for (const area of areas) {
    const list = made.filter((m) => m.p.area === area.id);
    const rows = [...new Set(list.map((m) => m.p.row))].sort((a, b) => a - b);
    const areaTop = cursor;
    bandsSvg += bandLabel(32, areaTop - 16, area.label, { size: 11, fill: T.navy });
    bandsSvg += line(32, areaTop - 8, w - 32, areaTop - 8, { stroke: T.blueLight });
    let yy = areaTop + 10;
    for (const row of rows) {
      const inRow = list.filter((m) => m.p.row === row);
      const rowH = Math.max(...inRow.map((m) => m.card.h));
      for (const m of inRow) {
        const x = 32 + m.p.col * (CARD + GAP);
        cardsSvg += m.card.draw(x, yy, rowH);
        rects[m.p.id] = { x, y: yy, w: CARD, h: rowH, cx: x + CARD / 2, cy: yy + rowH / 2 };
      }
      yy += rowH + 40;
    }
    cursor = yy + 46;
  }

  let edgesSvg = '';
  for (const e of M.pageEdges) {
    const a = rects[e.from];
    const b = rects[e.to];
    if (!a || !b) continue;
    const tone = e.status === 'Missing' ? 'mute' : (e.cross ? 'mute' : 'blue');
    const t = toneOf(tone);
    const opts = { stroke: t.stroke, sw: e.cross ? 1.2 : 1.5, marker: t.marker, dash: e.cross ? '5 4' : null };
    const sameRow = Math.abs(a.cy - b.cy) < 6;
    if (sameRow) {
      const left = a.x < b.x ? a : b;
      const right = a.x < b.x ? b : a;
      const y = a.cy;
      edgesSvg += (a.x < b.x
        ? line(a.x + a.w, y, b.x - 3, y, opts)
        : line(a.x, y, b.x + b.w + 3, y, opts));
      edgesSvg += halo((left.x + left.w + right.x) / 2, y - 7, e.label, { fill: t.ink });
    } else {
      const down = a.cy < b.cy;
      const x1 = a.cx;
      const y1 = down ? a.y + a.h : a.y;
      const x2 = b.cx;
      const y2 = down ? b.y - 3 : b.y + b.h + 3;
      edgesSvg += vElbow(x1, y1, x2, y2, opts);
      edgesSvg += halo((x1 + x2) / 2, (y1 + y2) / 2 + 3, e.label, { fill: t.ink });
    }
  }

  const h = cursor + 20;
  const body = fr.svg
    + bandsSvg + edgesSvg + cardsSvg
    + statusLegend(32, h - 22);

  emit('sitemap.svg', {
    w, h, desc: note, body,
    title: 'Site map, with a status on every page',
    caption: 'The one picture that answers "how far along are we". Plus signs are backend work that is built; minus signs are what remains.',
    });
}

/* ================================================================ *
 * 5. The content model.
 * ================================================================ */
function dataModel() {
  beginDoc();
  const CARD = 252;
  const GAP = 46;
  const groups = M.entities.groups;
  const w = 32 * 2 + groups.length * CARD + (groups.length - 1) * GAP;
  const note = 'Twenty three tables, grouped by what they are for. Fields shown are the ones another part of the system depends on, not every column. Relationship labels read from the left card to the right one.';
  const fr = frame({ title: 'The content model', note, asOf, w });
  const top = fr.bottom + 52;

  const rects = {};
  let cardsSvg = '';
  let maxY = top;
  groups.forEach((g) => {
    const x = 32 + g.col * (CARD + GAP);
    cardsSvg += bandLabel(x, top - 14, g.label, { size: 10.5, fill: T.navy });
    cardsSvg += line(x, top - 6, x + CARD, top - 6, { stroke: T.blueLight });
    let yy = top + 10;
    for (const t of g.tables) {
      const card = TableCard(CARD, t);
      cardsSvg += card.draw(x, yy);
      rects[t.name] = { x, y: yy, w: CARD, h: card.h, cx: x + CARD / 2, cy: yy + card.h / 2 };
      yy += card.h + 10;
    }
    maxY = Math.max(maxY, yy);
  });

  let edgesSvg = '';
  for (const rel of M.entities.relations) {
    const a = rects[rel.from];
    const b = rects[rel.to];
    if (!a || !b) continue;
    edgesSvg += Connector(a, b, { label: rel.card, tone: 'mute', sw: 1.1 });
  }

  /* The sentence the whole data design turns on. */
  const bx = 32;
  const bw = w - 64;
  let boundarySvg = '';
  let by = maxY + 24;
  const bLines = M.entities.boundary.map((b) => wrap(b, bw - 70, 11));
  const bh = 26 + bLines.reduce((n, l) => n + l.length, 0) * 15 + bLines.length * 6 + 14;
  boundarySvg += box(bx, by, bw, bh, { fill: '#F2F7FC', stroke: T.blue, rx: 10 });
  boundarySvg += bandLabel(bx + 16, by + 20, 'The privilege boundary', { size: 10, fill: T.blue });
  let byy = by + 40;
  for (const group of bLines) {
    for (const l of group) { boundarySvg += text(bx + 16, byy, l, { size: 11, fill: T.navy }); byy += 15; }
    byy += 6;
  }

  const h = by + bh + 60;
  const body = fr.svg
    + edgesSvg + cardsSvg + boundarySvg
    + statusLegend(32, h - 22);

  emit('data-model.svg', {
    w, h, desc: note, body,
    title: 'The content model',
    caption: 'What exists in Supabase, which tables are still empty, and where the privilege boundary sits.',
    });
}

/* ================================================================ *
 * 6. One sequence diagram per flow that carries money, identity or
 * anything irreversible, with the failure path beside the happy one.
 * ================================================================ */
function flow(f) {
  beginDoc();

  /* The sequence itself: lifelines, numbered steps, self-calls. */
  const seq = sequence({
    participants: f.lanes.map((l) => ({
      id: l.id, label: l.label, detail: l.detail, icon: l.icon, family: l.family,
    })),
    steps: f.steps.map((s) => ({
      from: s.from, to: s.to, text: s.label,
      family: s.tone === 'amber' ? 'rose' : undefined,
      dashed: Boolean(s.back),
    })),
    colW: 196,
    top: 0,
  });

  const w = Math.max(seq.w, 860);
  const fr = frame({ title: f.title, note: f.note, asOf, w });
  const seqTop = fr.bottom + 54;

  /* The failure path, as a panel rather than a footnote. */
  const board = new Board(w);
  const fx = 34;
  const fw = w - 68;
  const fy = seqTop + seq.h + 34;
  const lines2 = f.failures.map((t) => wrap(t, fw - 70, 11.5));
  const fh = 46 + lines2.reduce((n, l) => n + l.length, 0) * 15.5 + lines2.length * 6;
  const rose = familyOf('rose');
  let fail = box(fx, fy, fw, fh, { fill: rose.wash, stroke: rose.line, rx: 10 });
  fail += box(fx, fy, 4.5, fh, { fill: rose.solid, stroke: 'none', rx: 2 });
  fail += useIcon('alert', fx + 18, fy + 14, 17, rose.solid);
  fail += bandLabel(fx + 43, fy + 27, 'The failure path, and what is wrong with it today',
    { size: 10, fill: rose.chipInk });
  let fyy = fy + 50;
  for (const group of lines2) {
    for (const l of group) { fail += text(fx + 18, fyy, l, { size: 11.5, fill: rose.ink }); fyy += 15.5; }
    fyy += 6;
  }

  const h = fy + fh + 40;
  const statusChip = Board.chip(f.status, w - 34, fr.bottom + 16);
  const body = fr.svg + statusChip
    + `<g transform="translate(0 ${seqTop})">${seq.svg}</g>`
    + fail;

  emit(`flow-${f.id}.svg`, {
    w, h, title: f.title, desc: f.note, body, caption: f.note,
  });
}

/* ================================================================ *
 * 7. Deployment: the pipeline, the two environments, and where each
 * secret is allowed to exist.
 * ================================================================ */
function deployment() {
  beginDoc();
  const d = M.deployment;
  const w = 1380;
  const CARD = 202;
  const GAP = 24;
  const fr = frame({ title: 'Deployment, environments and secrets', note: d.note, asOf, w });
  const top = fr.bottom + 46;

  let svg = bandLabel(32, top - 14, 'One deploy path', { size: 10.5, fill: T.navy });
  svg += line(32, top - 6, w - 32, top - 6, { stroke: T.blueLight });

  const made = d.stages.map((s) => StatusCard(CARD, s, { titleSize: 12.5 }));
  const rowH = Math.max(...made.map((m) => m.h));
  const rects = [];
  made.forEach((m, i) => {
    const x = 32 + i * (CARD + GAP);
    svg += m.draw(x, top + 12, rowH);
    rects.push({ x, cy: top + 12 + rowH / 2, w: CARD });
  });
  for (let i = 0; i < rects.length - 1; i += 1) {
    const a = rects[i];
    const b = rects[i + 1];
    const mute = i >= rects.length - 2;
    svg += line(a.x + a.w, a.cy, b.x - 3, b.cy, {
      stroke: mute ? T.mute : T.blue, sw: 1.6, marker: mute ? 'arrow-mute' : 'arrow', dash: mute ? '5 4' : null,
    });
  }

  /* Environments. */
  let y = top + 12 + rowH + 46;
  svg += bandLabel(32, y, 'Two environments, from the first deploy', { size: 10.5, fill: T.navy });
  svg += line(32, y + 8, w - 32, y + 8, { stroke: T.blueLight });
  y += 22;
  const envW = (w - 64 - 24) / 2;
  d.environments.forEach((e, i) => {
    const x = 32 + i * (envW + 24);
    const h = 94;
    svg += box(x, y, envW, h, { fill: i ? '#E6F2FB' : T.wash, stroke: i ? T.blue : T.rule, rx: 10 });
    svg += text(x + 16, y + 24, e.name, { size: 13.5, weight: 600, family: T.head, fill: T.navy });
    svg += text(x + 16, y + 44, e.host, { size: 11, fill: T.navy2 });
    svg += text(x + 16, y + 62, 'Data: ' + e.data, { size: 10.5, fill: T.mute });
    svg += text(x + 16, y + 79, 'Gate: ' + e.gate, { size: 10.5, fill: T.mute });
  });
  y += 94 + 46;

  /* Where each value is allowed to exist. The point of the drawing is the
     left column: everything there is readable by anyone who views source. */
  svg += bandLabel(32, y, 'Where each value is allowed to exist', { size: 10.5, fill: T.navy });
  svg += line(32, y + 8, w - 32, y + 8, { stroke: T.blueLight });
  y += 22;
  const lanes = [
    { label: 'Browser', note: 'Anyone can read these. Safe only because row level security holds.', test: (s) => /Browser/.test(s.where) },
    { label: 'Function only', note: 'Never reaches browser JavaScript and never a public config endpoint.', test: (s) => /^Function only/.test(s.where) },
    { label: 'Function and build', note: 'Not secret, but set per environment so a preview cannot mail a customer.', test: (s) => /Function and build|^Function$/.test(s.where) },
  ];
  const laneW = (w - 64 - 48) / 3;
  let maxLaneH = 0;
  lanes.forEach((lane, i) => {
    const x = 32 + i * (laneW + 24);
    const items = d.secrets.filter(lane.test);
    const noteLines = wrap(lane.note, laneW - 32, 10);
    const h = 30 + noteLines.length * 13 + 12 + items.length * 22 + 16;
    maxLaneH = Math.max(maxLaneH, h);
    const secret = i === 1;
    svg += box(x, y, laneW, h, { fill: secret ? T.amberWash : T.paper, stroke: secret ? T.amber : T.rule, rx: 10 });
    svg += text(x + 16, y + 22, lane.label, { size: 12.5, weight: 600, family: T.head, fill: secret ? '#6B3F08' : T.navy });
    noteLines.forEach((l, k) => { svg += text(x + 16, y + 38 + k * 13, l, { size: 10, fill: T.mute }); });
    let yy = y + 38 + noteLines.length * 13 + 12;
    for (const s of items) {
      svg += text(x + 16, yy + 10, s.name, { size: 10.5, fill: T.navy2, weight: 500 });
      svg += text(x + laneW - 16, yy + 10, s.secret ? 'secret' : 'public', {
        size: 9.5, fill: s.secret ? T.amber : T.mute, anchor: 'end', weight: 600,
      });
      yy += 22;
    }
  });

  const h = y + maxLaneH + 48;
  const body = fr.svg + svg + statusLegend(32, h - 22);

  emit('deployment.svg', {
    w, h, title: 'Deployment, environments and secrets', desc: d.note, body,
      title: 'Deployment, environments and secrets',
    caption: 'One deploy path, two environments, and the three places a value is allowed to live. The middle column is the one that ends a project if it leaks.',
    });
}

/* ================================================================ *
 * 8. Performance budget.
 * ================================================================ */
function performance() {
  beginDoc();
  const b = M.budget;
  const w = 1120;
  const fr = frame({ title: 'Performance budget', note: b.note, asOf, w });
  const top = fr.bottom + 52;
  const rowH = 54;
  const labelW = 150;
  const barX = 32 + labelW;
  const barW = w - barX - 190;
  const scale = Math.max(...b.rows.map((r2) => r2.budget)) * 1.25;

  let svg = bandLabel(32, top - 16, b.unit, { size: 10.5, fill: T.navy });
  svg += line(32, top - 8, w - 32, top - 8, { stroke: T.blueLight });

  /* Gridlines every 100KB, so a bar can be read without a ruler. */
  for (let kb = 100; kb < scale; kb += 100) {
    const x = barX + (kb / scale) * barW;
    svg += line(x, top + 4, x, top + 8 + b.rows.length * rowH, { stroke: '#ECF0F4' });
    svg += text(x, top, String(kb), { size: 9, fill: T.mute, anchor: 'middle' });
  }

  b.rows.forEach((row, i) => {
    const y = top + 18 + i * rowH;
    svg += text(32, y + 20, row.page, { size: 12.5, weight: 600, family: T.head, fill: T.navy });
    const bw = (row.budget / scale) * barW;
    svg += box(barX, y + 6, bw, 24, { fill: T.paper, stroke: T.blue, rx: 5, dash: '4 3' });
    svg += text(barX + bw + 8, y + 23, `budget ${row.budget}KB`, { size: 10, fill: T.blue, weight: 600 });
    if (row.measured == null) {
      svg += text(barX + 10, y + 23, 'not measured yet', { size: 10.5, fill: T.mute, italic: true });
    } else {
      const mw = (row.measured / scale) * barW;
      const over = row.measured > row.budget;
      svg += box(barX, y + 6, mw, 24, { fill: over ? T.amberWash : '#E6F2FB', stroke: over ? T.amber : T.blue, rx: 5 });
      svg += text(barX + 10, y + 23, `${row.measured}KB`, { size: 10.5, fill: over ? '#6B3F08' : T.navy, weight: 600 });
    }
    svg += block(barX, y + 40, row.heavy, barW + 180, { size: 9.6, fill: T.mute, italic: true }).svg;
  });

  const h = top + 18 + b.rows.length * rowH + 60;
  const body = fr.svg + svg;
  emit('performance-budget.svg', {
    w, h, desc: b.note, body,
    title: 'Performance budget',
    caption: 'The targets are set. The bars stay empty until the harness has rendered a served copy, because a guessed number in a budget gets believed.',
    });
}

/* ================================================================ *
 * 9. Build plan: phases and what each one needs first.
 * ================================================================ */
function buildPlan() {
  beginDoc();
  const CARD = 212;
  const GAPX = 56;
  const GAPY = 34;
  const cols = Math.max(...M.phases.map((p) => p.col)) + 1;
  const w = 32 * 2 + cols * CARD + (cols - 1) * GAPX;
  const note = 'Phases, not dates. An arrow means the phase it points at cannot honestly start before the one behind it. P1, P2, P3 and P5 are the ones between here and taking a real order; P7 can be done at any time by whoever is free.';
  const fr = frame({ title: 'Build plan', note, asOf, w });
  const top = fr.bottom + 48;

  const made = M.phases.map((p) => ({
    p,
    card: StatusCard(CARD, { label: `${p.id} · ${p.label}`, detail: p.detail, note: 'Owner: ' + p.owner, status: p.status }, { titleSize: 12 }),
  }));
  const rowsIdx = [...new Set(M.phases.map((p) => p.row))].sort((a, b) => a - b);
  const rowY = {};
  let y = top;
  for (const row of rowsIdx) {
    rowY[row] = y;
    const inRow = made.filter((m) => m.p.row === row);
    y += Math.max(...inRow.map((m) => m.card.h)) + GAPY;
  }

  const rects = {};
  let cardsSvg = '';
  for (const row of rowsIdx) {
    const inRow = made.filter((m) => m.p.row === row);
    const rowH = Math.max(...inRow.map((m) => m.card.h));
    for (const m of inRow) {
      const x = 32 + m.p.col * (CARD + GAPX);
      cardsSvg += m.card.draw(x, rowY[row], rowH);
      rects[m.p.id] = { x, y: rowY[row], w: CARD, h: rowH, cx: x + CARD / 2, cy: rowY[row] + rowH / 2 };
    }
  }

  let edgesSvg = '';
  for (const p of M.phases) {
    for (const need of p.needs) {
      const a = rects[need];
      const b = rects[p.id];
      if (!a || !b) continue;
      edgesSvg += Connector(a, b, { label: '', tone: 'mute', sw: 1.3 });
    }
  }

  const h = y + 50;
  const body = fr.svg
    + edgesSvg + cardsSvg + statusLegend(32, h - 22);

  emit('build-plan.svg', {
    w, h, desc: note, body,
    title: 'Build plan',
    caption: 'What each phase needs before it can start, and who owns it. Arrows are dependencies, not a schedule.',
    });
}

/* ================================================================ *
 * 10. Risks, placed by likelihood and impact.
 * ================================================================ */
function riskMatrix() {
  beginDoc();
  const w = 1320;
  const note = 'Placed by how likely it is and what it costs if ignored. Top right is what to fix first. Position carries the severity as well as the colour does, so a monochrome printout loses nothing.';
  const fr = frame({ title: 'Risks', note, asOf, w });
  const top = fr.bottom + 50;
  const impacts = ['low', 'medium', 'high'];
  const likelihoods = ['high', 'medium', 'low'];
  const cellW = 236;
  const cellH = 148;
  const gridX = 32 + 86;

  let svg = bandLabel(gridX, top - 14, 'Impact if ignored', { size: 10, fill: T.mute });
  impacts.forEach((im, i) => {
    svg += text(gridX + i * cellW + cellW / 2, top + 4, im.toUpperCase(), { size: 10.5, weight: 700, fill: T.navy, anchor: 'middle', letter: 1 });
  });

  likelihoods.forEach((lk, rowI) => {
    const y = top + 14 + rowI * cellH;
    svg += text(gridX - 14, y + cellH / 2, lk.toUpperCase(), { size: 10.5, weight: 700, fill: T.navy, anchor: 'end', letter: 1 });
    impacts.forEach((im, colI) => {
      const x = gridX + colI * cellW;
      /* Severity by position and by family, and by lightness within the
         family, so the drawing still sorts itself on a monochrome print. */
      const weightIdx = (2 - rowI) + colI;
      const cellFam = ['slate', 'slate', 'amber', 'rose', 'rose'][weightIdx];
      const fam = familyOf(cellFam);
      const fills = ['#FFFFFF', fam.wash, fam.wash, fam.wash, fam.chipWash];
      svg += box(x, y, cellW - 8, cellH - 8, {
        fill: fills[weightIdx], stroke: weightIdx >= 3 ? fam.line : T.rule, rx: 9,
      });
      const here = M.risks.filter((rk) => rk.likelihood === lk && rk.impact === im);
      let yy = y + 24;
      for (const rk of here) {
        const lines = wrap(rk.label, cellW - 54, 10.2);
        svg += circle(x + 18, yy - 4, 9, { fill: fam.solid });
        svg += text(x + 18, yy - 0.5, rk.id, { size: 8.5, weight: 700, fill: T.paper, anchor: 'middle' });
        lines.forEach((l, i) => { svg += text(x + 34, yy + i * 12.4, l, { size: 10.2, fill: INK.title }); });
        yy += lines.length * 12.4 + 10;
      }
      if (!here.length) svg += text(x + 18, y + 26, 'none', { size: 10, fill: T.faint, italic: true });
    });
  });

  svg += text(32, top + 14 + 3 * cellH + 2, 'Likelihood', { size: 10, fill: T.mute, letter: 0.4 });

  /* The list under the matrix, because a dot in a cell is not a plan. */
  let y = top + 14 + 3 * cellH + 36;
  svg += bandLabel(32, y, 'What to do about each one', { size: 10.5, fill: T.navy });
  svg += line(32, y + 8, w - 32, y + 8, { stroke: T.blueLight });
  y += 26;
  for (const rk of M.risks) {
    const fixLines = wrap(rk.fix, w - 420, 10.8);
    svg += circle(42, y - 4, 9, { fill: T.navy });
    svg += text(42, y - 0.5, rk.id, { size: 8.5, weight: 700, fill: T.paper, anchor: 'middle' });
    svg += text(60, y, rk.label, { size: 11.2, weight: 600, fill: T.navy });
    fixLines.forEach((l, i) => { svg += text(380, y + i * 13, l, { size: 10.8, fill: T.mute }); });
    svg += text(w - 32, y, rk.effort, { size: 10.5, fill: T.blue, anchor: 'end', weight: 600 });
    y += Math.max(fixLines.length * 13, 15) + 11;
  }

  const h = y + 34;
  const body = fr.svg + svg;
  emit('risks.svg', {
    w, h, desc: note, body,
    title: 'Risks',
    caption: 'Top right is what to fix first. R1 and R3 are both one short task each and both are top row.',
    });
}

/* ================================================================ *
 * 11. One definition, two surfaces.
 * ================================================================ */
function oneDefinition() {
  beginDoc();
  const w = 1180;
  const note = 'Anything that appears twice is built once, and a variation is a parameter rather than a second copy. Three rows below have no single home yet; each one is a small, dull job that gets expensive the week a price changes in two of three places.';
  const fr = frame({ title: 'One definition, read everywhere', note, asOf, w });
  const top = fr.bottom + 50;
  let svg = '';
  let y = top;
  svg += bandLabel(32, y - 14, 'Defined once', { size: 10, fill: T.mute });
  svg += bandLabel(470, y - 14, 'Read by', { size: 10, fill: T.mute });
  svg += bandLabel(w - 32, y - 14, 'State', { size: 10, fill: T.mute, anchor: 'end' });
  svg += line(32, y - 6, w - 32, y - 6, { stroke: T.blueLight });
  y += 16;

  for (const d of M.definitions) {
    const st = STATUS[d.status] || STATUS.Missing;
    const homeLines = wrap(d.home, 400, 10.8);
    const readers = d.readers.join(', ');
    const readerLines = wrap(readers, 320, 10.8);
    const noteLines = d.note ? wrap(d.note, 560, 10) : [];
    const h = Math.max(homeLines.length, readerLines.length) * 14 + 24 + noteLines.length * 13;
    svg += box(32, y, w - 64, h, { fill: st.fill, stroke: st.stroke, rx: 9, dash: st.dash });
    svg += text(48, y + 20, d.thing, { size: 12.5, weight: 600, family: T.head, fill: st.ink });
    homeLines.forEach((l, i) => { svg += text(48, y + 38 + i * 14, l, { size: 10.8, fill: T.mute }); });
    readerLines.forEach((l, i) => { svg += text(486, y + 20 + i * 14, l, { size: 10.8, fill: T.navy2 }); });
    noteLines.forEach((l, i) => { svg += text(48, y + 38 + homeLines.length * 14 + i * 13, l, { size: 10, fill: st.stroke, italic: true }); });
    svg += chip(w - 48 - measure(d.status, 9.5, 600) - 14, y + 10, d.status, { status: d.status }).svg;
    y += h + 10;
  }

  const h = y + 50;
  const body = fr.svg + svg + statusLegend(32, h - 22);
  emit('one-definition.svg', {
    w, h, title: 'One definition, read everywhere', desc: note, body,
      title: 'One definition, read everywhere',
    caption: 'Where each shared fact lives, who reads it, and the three that still have no home.',
    });
}

/* ================================================================ *
 * The library sheet: every icon symbol and every component, in all
 * the states they are used in. This is the page you look at to see
 * whether the set hangs together, and the page you hand to anyone
 * rebuilding the set in a design tool.
 * ================================================================ */
function componentSheet() {
  beginDoc();
  const w = 1180;
  const note = 'Every icon is one symbol, instanced wherever it appears. Every repeated shape is one component, and a variation is a parameter rather than a second copy. Change one here and all fifteen drawings change with it.';
  const fr = frame({ title: 'Icon and component library', note, asOf, w });
  let y = fr.bottom + 46;
  let svg = SectionRule(32, y - 14, w - 64, `The icon set · ${iconNames().length} symbols on a 32 grid`);
  y += 18;

  /* Icons, in a grid, each with the name a diagram refers to it by. */
  const per = 10;
  const cell = (w - 64) / per;
  iconNames().forEach((name, i) => {
    const col = i % per;
    const row = Math.floor(i / per);
    const x = 32 + col * cell;
    const yy = y + row * 62;
    svg += box(x, yy, cell - 10, 54, { fill: T.wash, stroke: T.rule, rx: 8 });
    svg += useIcon(name, x + (cell - 10) / 2 - 11, yy + 8, 22, T.navy);
    svg += text(x + (cell - 10) / 2, yy + 46, name, { size: 8.6, fill: T.mute, anchor: 'middle' });
  });
  y += Math.ceil(iconNames().length / per) * 62 + 30;

  /* Components, each with its purpose and its variants side by side. */
  for (const c of COMPONENTS) {
    svg += SectionRule(32, y, w - 64, c.name);
    svg += block(32, y + 26, c.purpose, w - 64, { size: 11, fill: T.mute }).svg;
    let cy = y + 48;
    let cx = 32;
    let tallest = 0;
    for (const v of c.variants) {
      const made = c.name === 'FailurePanel' ? c.render(c.width, v) : c.render(c.width, v);
      if (cx + c.width > w - 32) { cx = 32; cy += tallest + 14; tallest = 0; }
      svg += made.draw(cx, cy);
      cx += c.width + 14;
      tallest = Math.max(tallest, made.h);
    }
    y = cy + tallest + 36;
  }

  const h = y + 20;
  const body = fr.svg + svg;
  emit('component-library.svg', {
    w, h, desc: note, body,
    title: 'Icon and component library',
    caption: 'The vocabulary the other fourteen drawings are assembled from: every symbol, and every component in each state it is used in.',
  });
}

/* ================================================================ *
 * The contact sheet. A long document is read more often when it is a
 * page, so every drawing gets one.
 * ================================================================ */
function contactSheet() {
  const items = written.map((d, i) => `    <figure id="d${i + 1}">
      <figcaption>
        <h2>${esc(d.title)}</h2>
        <p>${esc(d.caption)}</p>
        <a href="${d.name}">Open ${esc(d.name)}</a>
      </figcaption>
      <div class="plate"><img src="${d.name}" alt="${esc(d.title)}" loading="lazy" /></div>
    </figure>`).join('\n');

  const nav = written.map((d, i) => `<li><a href="#d${i + 1}">${esc(d.title)}</a></li>`).join('\n        ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Crystalina blueprint diagrams</title>
<style>
  :root {
    --navy: #15375D; --blue: #2A7BC4; --mute: #5A646D;
    --rule: #D8DEE5; --wash: #F5F8FB; --paper: #fff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--wash); color: var(--navy);
    font: 16px/1.55 Inter, "Segoe UI", system-ui, sans-serif;
  }
  header { background: var(--paper); border-bottom: 1px solid var(--rule); padding: 32px 24px; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  h1 { font-family: Poppins, Inter, sans-serif; font-size: 28px; margin: 0 0 6px; }
  .meta { color: var(--mute); font-size: 13.5px; margin: 0; }
  nav ol { columns: 2; gap: 32px; margin: 20px 0 0; padding-left: 20px; font-size: 14px; }
  nav a { color: var(--blue); text-decoration: none; }
  nav a:hover, figcaption a:hover { text-decoration: underline; }
  main { padding: 28px 24px 64px; }
  figure {
    background: var(--paper); border: 1px solid var(--rule); border-radius: 14px;
    margin: 0 0 26px; padding: 22px; max-width: 1180px; margin-inline: auto;
  }
  figcaption h2 { font-family: Poppins, Inter, sans-serif; font-size: 19px; margin: 0 0 6px; }
  figcaption p { color: var(--mute); font-size: 14px; margin: 0 0 8px; max-width: 76ch; }
  figcaption a { color: var(--blue); font-size: 13px; text-decoration: none; }
  .plate { margin-top: 16px; overflow-x: auto; border-top: 1px solid var(--rule); padding-top: 16px; }
  .plate img { display: block; min-width: 760px; width: 100%; height: auto; }
  footer { padding: 0 24px 56px; color: var(--mute); font-size: 13px; }
  @media (max-width: 700px) { nav ol { columns: 1; } }
</style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>Crystalina blueprint diagrams</h1>
      <p class="meta">
        Generated ${asOf} from <code>docs/diagrams/model.mjs</code> by <code>npm run diagrams</code>.
        State last verified against the live project ${M.meta.stateVerified}.
        Do not edit these files by hand: edit the model and regenerate.
      </p>
      <nav aria-label="Diagrams"><ol>
        ${nav}
      </ol></nav>
    </div>
  </header>
  <main class="wrap">
${items}
  </main>
  <footer class="wrap">
    Status words are the five in WebWork playbook 13, used here and in any progress report with no friendlier synonyms:
    Implemented, Partial, Missing, Refactor, Post-MVP.
  </footer>
</body>
</html>
`;
  const file = join(OUT, 'index.html');
  if (CHECK) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (old !== html) drift.push('index.html');
  } else if (WRITE) {
    writeFileSync(file, html);
  }
}

/* ---------------------------------------------------------------- *
 * Draw everything. scripts/blueprint.mjs calls this with write false
 * to inline the same bodies into the published page, so the page and
 * the files are the same bytes and cannot disagree.
 * ---------------------------------------------------------------- */
export function buildAll({ write = true } = {}) {
  WRITE = write;
  written.length = 0;
  drift.length = 0;

  architecture('now', M.architecture.now);
  architecture('target', M.architecture.target);
  channels();
  sitemap();
  dataModel();
  for (const f of M.flows) flow(f);
  deployment();
  performance();
  buildPlan();
  riskMatrix();
  oneDefinition();
  componentSheet();
  contactSheet();

  WRITE = true;
  return { written: [...written], drift: [...drift] };
}

const invokedDirectly = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  mkdirSync(OUT, { recursive: true });
  buildAll({ write: !CHECK });
  report();
}

function report() {
if (CHECK) {
  if (drift.length) {
    console.error('Diagrams are out of date with the model:');
    drift.forEach((d) => console.error('  ' + d));
    console.error('\nRun `npm run diagrams` and commit the result.');
    process.exit(1);
  }
  console.log(`Diagrams match the model (${written.length} drawings).`);
} else {
  written.forEach((d) => console.log('wrote   docs/diagrams/' + d.name));
  console.log('wrote   docs/diagrams/index.html');
  console.log(`\n${written.length} diagrams, generated ${asOf}.`);
}
}
