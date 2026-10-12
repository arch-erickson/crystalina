/* The board: cards, groups and arrows, laid out and routed.
 *
 * A port of the diagram engine used on the Nick Sosa blueprint, adapted to
 * Crystalina's palette and icon set. The things that make it read, and that
 * a bezier router gets wrong:
 *
 * - **Arrows are orthogonal.** Every leg is horizontal or vertical, corners
 *   are filleted to a 10px radius. A curve that cuts diagonally across the
 *   drawing reads as decoration; a right angle reads as a connection.
 * - **Arrows leave a named side.** Top, bottom, left or right, chosen from
 *   the relative position of the two cards unless the caller says otherwise.
 *   Where the two cards share a span, the leg is centred on the overlap, so
 *   stacked columns line up instead of fanning.
 * - **Cards are painted over the paths, and labels over the cards.** That is
 *   the whole reason the reference never shows a line crossing a card: the
 *   card covers it. Paint order is groups, paths, cards, labels.
 * - **The arrowhead is an open chevron**, not a filled triangle, drawn in
 *   user space so it stays the same weight whatever the line does.
 *
 * Coordinates are absolute. Nothing here reflows: a diagram says where its
 * cards go, and the router works it out from there.
 */
import { FAMILY, INK, TYPE, familyOf, STATUS_DASH, CHIP_FAMILY, statusFamily } from './tokens.mjs';
import { esc, measure, wrap, text, r } from './svg.mjs';
import { use as useIcon, hasIcon } from './icons.mjs';

/* ---------------------------------------------------------------- *
 * Geometry
 * ---------------------------------------------------------------- */

/* A polyline with filleted corners. Duplicate points are dropped first: a
   corner between two identical points has no direction, and the fillet
   divides by zero. */
export function roundPath(points, radius = 10) {
  let pts = points.filter((p, i) =>
    i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.01);
  if (pts.length < 2) pts = [pts[0] || [0, 0], pts[0] || [0, 0]];

  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(cx - px, cy - py);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(radius, l1 / 2, l2 / 2);
    const ax = cx - ((cx - px) / l1) * rr;
    const ay = cy - ((cy - py) / l1) * rr;
    const bx = cx + ((nx - cx) / l2) * rr;
    const by = cy + ((ny - cy) / l2) * rr;
    d += ` L${r(ax)} ${r(ay)} Q${r(cx)} ${r(cy)} ${r(bx)} ${r(by)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${r(last[0])} ${r(last[1])}`;
}

const isVertical = (side) => side === 'top' || side === 'bottom';

/* ---------------------------------------------------------------- *
 * Board
 * ---------------------------------------------------------------- */

export class Board {
  constructor(w, { label, asOf } = {}) {
    this.w = w;
    this.label = label;
    this.asOf = asOf;
    this.groups = [];
    this.cards = [];
    this.edges = [];
    this.under = [];
    this.over = [];
    this.nodes = {};
  }

  /* A tinted area with a solid tab on its edge. */
  group(g) {
    g.family = g.family || 'slate';
    this.groups.push(g);
    this.nodes[g.id] = g;
    return g;
  }

  card(c) {
    c.w = c.w || 260;
    const tx = c.icon ? 52 : 16;
    const avail = c.w - tx - 14;
    c._title = wrap(c.label, avail, 13, 600);
    c._sub = c.detail ? wrap(c.detail, avail, 10.8) : [];
    if (c._sub.length > 3) c._sub = c._sub.slice(0, 3);
    c._note = c.note ? wrap(c.note, c.w - 30, 9.8).slice(0, 2) : [];
    c.h = c.h || Math.max(54,
      20 + c._title.length * 16 + c._sub.length * 14 + (c._note.length ? c._note.length * 13 + 4 : 0) + 6);
    this.cards.push(c);
    this.nodes[c.id] = c;
    return c;
  }

  /* Cards in a column inside a group, sizing the group to fit. */
  stack(groupId, list, { top = 58, gap = 16, pad = 20, x, y, w } = {}) {
    const g = groupId ? this.nodes[groupId] : null;
    let cy = g ? g.y + top : y;
    const cx = g ? g.x + pad : x;
    const cw = g ? g.w - pad * 2 : w;
    for (const c of list) {
      c.x = cx;
      c.y = cy;
      c.w = c.w || cw;
      this.card(c);
      cy += c.h + gap;
    }
    if (g && !g.fixedH) g.h = Math.max(g.h || 0, cy - gap - g.y + pad);
    return list;
  }

  /* Cards in a row inside a group. */
  row(groupId, list, { top = 58, gap = 16, pad = 20 } = {}) {
    const g = this.nodes[groupId];
    const cw = (g.w - pad * 2 - gap * (list.length - 1)) / list.length;
    let cx = g.x + pad;
    let maxH = 0;
    for (const c of list) {
      c.x = cx;
      c.y = g.y + top;
      c.w = c.w || cw;
      this.card(c);
      cx += c.w + gap;
      maxH = Math.max(maxH, c.h);
    }
    if (!g.fixedH) g.h = Math.max(g.h || 0, top + maxH + pad);
    return list;
  }

  edge(e) { this.edges.push(e); return this; }

  raw(svg, onTop) { (onTop ? this.over : this.under).push(svg); return this; }

  /* A soft aside: how to read the drawing, or what it cannot say. */
  note(x, y, w, body, family = 'amber') {
    const fam = familyOf(family);
    const items = Array.isArray(body) ? body : [body];
    const groups = items.map((t) => wrap(t, w - 28, 12));
    const h = groups.reduce((n, l) => n + l.length, 0) * 16 + groups.length * 5 + 22;
    let s = `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="8"`
      + ` fill="${fam.wash}" stroke="${fam.line}"/>`;
    let yy = y + 24;
    for (const lines of groups) {
      for (const l of lines) { s += text(x + 14, yy, l, { size: 12, fill: fam.ink }); yy += 16; }
      yy += 5;
    }
    this.over.push(s);
    return h;
  }

  /* ------------------------------------------------------------ *
   * Routing
   * ------------------------------------------------------------ */

  anchor(n, side, at, abs) {
    if (side === 'top') return [abs != null ? abs : n.x + n.w * at, n.y];
    if (side === 'bottom') return [abs != null ? abs : n.x + n.w * at, n.y + n.h];
    if (side === 'left') return [n.x, abs != null ? abs : n.y + n.h * at];
    return [n.x + n.w, abs != null ? abs : n.y + n.h * at];
  }

  route(e) {
    const a = this.nodes[e.from];
    const b = this.nodes[e.to];
    if (!a || !b) throw new Error(`edge node missing: ${e.from} -> ${e.to}`);

    /* Pick the sides from the relative position unless the caller said. */
    let from = e.fs;
    let to = e.ts;
    if (!from || !to) {
      if (b.y >= a.y + a.h - 2) { from = from || 'bottom'; to = to || 'top'; }
      else if (a.y >= b.y + b.h - 2) { from = from || 'top'; to = to || 'bottom'; }
      else if (b.x >= a.x + a.w) { from = from || 'right'; to = to || 'left'; }
      else { from = from || 'left'; to = to || 'right'; }
    }

    let { fx, tx, fy, ty } = e;

    /* Where the two cards overlap, centre the leg on the overlap. This is
       what keeps a column of arrows straight instead of splayed. */
    if (isVertical(from) && isVertical(to) && fx == null && tx == null) {
      const lo = Math.max(a.x, b.x);
      const hi = Math.min(a.x + a.w, b.x + b.w);
      if (hi - lo > 24) { fx = Math.round((lo + hi) / 2); tx = fx; }
    }
    if (!isVertical(from) && !isVertical(to) && fy == null && ty == null) {
      const lo = Math.max(a.y, b.y);
      const hi = Math.min(a.y + a.h, b.y + b.h);
      if (hi - lo > 16) { fy = Math.round((lo + hi) / 2); ty = fy; }
    }

    const p0 = this.anchor(a, from, e.fat ?? 0.5, isVertical(from) ? fx : fy);
    const p1 = this.anchor(b, to, e.tat ?? 0.5, isVertical(to) ? tx : ty);

    const pts = [p0];
    if (e.via) pts.push(...e.via);
    else if (isVertical(from) && isVertical(to) && p0[0] !== p1[0]) {
      const my = e.midY ?? Math.round((p0[1] + p1[1]) / 2);
      pts.push([p0[0], my], [p1[0], my]);
    } else if (!isVertical(from) && !isVertical(to) && p0[1] !== p1[1]) {
      const mx = e.midX ?? Math.round((p0[0] + p1[0]) / 2);
      pts.push([mx, p0[1]], [mx, p1[1]]);
    } else if (isVertical(from) && !isVertical(to)) pts.push([p0[0], p1[1]]);
    else if (!isVertical(from) && isVertical(to)) pts.push([p1[0], p0[1]]);
    pts.push(p1);
    return pts;
  }

  renderEdge(e) {
    const fam = familyOf(e.family);
    const pts = this.route(e);
    const dash = e.dashed ? ' stroke-dasharray="6 5"' : '';
    const end = e.noArrow ? '' : ` marker-end="url(#m-${e.family || 'slate'})"`;
    const start = e.both ? ` marker-start="url(#m-${e.family || 'slate'})"` : '';
    const link = e.from ? ` data-from="${esc(e.from)}" data-to="${esc(e.to)}"` : '';
    const path = `<path${link} d="${roundPath(pts)}" fill="none" stroke="${fam.arrow}"`
      + ` stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${dash}${end}${start}/>`;

    let label = '';
    if (e.label) {
      /* On the longest leg, so a label never sits in a corner. */
      let best = 0;
      let bi = 1;
      for (let i = 1; i < pts.length; i += 1) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (l > best) { best = l; bi = i; }
      }
      const [ax, ay] = pts[bi - 1];
      const [bx, by] = pts[bi];
      let lx = (ax + bx) / 2;
      let ly = (ay + by) / 2;
      let anchor = 'middle';
      if (Math.abs(ax - bx) < 1) { lx += 10; ly += 4; anchor = 'start'; } else { ly -= 9; }
      if (e.lx != null) lx = e.lx;
      if (e.ly != null) ly = e.ly;
      if (e.anchor) anchor = e.anchor;
      label = String(e.label).split('\n').map((l, i) =>
        `<text${link} x="${r(lx)}" y="${r(ly + i * 14)}" text-anchor="${anchor}"`
        + ` font-family="${TYPE.sans}" font-size="11" font-weight="500" fill="${INK.body}"`
        + ` stroke="${INK.paper}" stroke-width="4" paint-order="stroke">${esc(l)}</text>`).join('');
    }
    return { path, label };
  }

  /* A chip carrying one word, hung on the top-right corner of a card. */
  static chip(word, rightX, y) {
    const fam = statusFamily(word);
    const w = Math.round(measure(word, 10, 600) + 20);
    const x = rightX - w;
    return `<rect x="${r(x)}" y="${r(y)}" width="${w}" height="18" rx="9"`
      + ` fill="${fam.chipWash}" stroke="${fam.solid}" stroke-opacity=".45"`
      + (STATUS_DASH[word] ? ` stroke-dasharray="${STATUS_DASH[word]}"` : '') + '/>'
      + `<text x="${r(x + w / 2)}" y="${r(y + 13)}" text-anchor="middle"`
      + ` font-family="${TYPE.sans}" font-size="10" font-weight="600"`
      + ` fill="${fam.chipInk}">${esc(word)}</text>`;
  }

  renderCard(c) {
    const fam = familyOf(c.family);
    const dash = c.status === 'Missing' || c.status === 'Post-MVP';
    let s = c.id ? `<g class="node" data-node="${esc(c.id)}">` : '<g>';
    /* The offset twin is what gives the card its weight. A dashed card does
       not get one: it is not there yet, so it should not cast a shadow. */
    if (!dash) {
      s += `<rect x="${r(c.x + 5)}" y="${r(c.y + 5)}" width="${r(c.w)}" height="${r(c.h)}"`
        + ` rx="8" fill="${INK.paper}" stroke="${INK.title}" stroke-width="1.2"/>`;
    }
    s += `<rect x="${r(c.x)}" y="${r(c.y)}" width="${r(c.w)}" height="${r(c.h)}" rx="8"`
      + ` fill="${c.fill || INK.paper}" stroke="${dash ? INK.mute : INK.title}"`
      + ` stroke-width="1.5"${dash ? ' stroke-dasharray="6 4"' : ''}/>`;

    const tx = c.icon ? 52 : 16;
    const block = c._title.length * 16 + c._sub.length * 14 + (c._note.length ? c._note.length * 13 + 4 : 0);
    if (c.icon && hasIcon(c.icon)) {
      s += useIcon(c.icon, c.x + 12, c.y + (c.h - 30) / 2, 30, fam.arrow);
    }
    let y = c.y + (c.h - block) / 2 + 12;
    for (const l of c._title) {
      s += text(c.x + tx, y, l, { size: 13, weight: 600, fill: INK.title });
      y += 16;
    }
    y += 1;
    for (const l of c._sub) {
      s += text(c.x + tx, y, l, { size: 10.8, fill: fam.ink });
      y += 14;
    }
    if (c._note.length) {
      y += 3;
      for (const l of c._note) {
        s += text(c.x + 16, y, l, { size: 9.8, fill: INK.mute, italic: true });
        y += 13;
      }
    }
    if (c.status) s += Board.chip(c.status, c.x + c.w - 12, c.y - 9);
    return s + '</g>';
  }

  renderGroup(g) {
    const fam = familyOf(g.family);
    const lw = Math.round(measure(g.label, 15, 600) + 30);
    let s = `<rect x="${r(g.x)}" y="${r(g.y)}" width="${r(g.w)}" height="${r(g.h)}" rx="14"`
      + ` fill="${fam.wash}" stroke="${fam.line}" stroke-width="1.4"`
      + (g.dashed ? ' stroke-dasharray="7 5"' : '') + '/>';
    s += `<rect x="${r(g.x + 16)}" y="${r(g.y - 15)}" width="${lw}" height="30" rx="8" fill="${fam.solid}"/>`;
    s += text(g.x + 31, g.y + 5.5, g.label, { size: 15, weight: 600, fill: INK.paper });
    if (g.status) s += Board.chip(g.status, g.x + g.w - 14, g.y - 9);
    if (g.note) {
      wrap(g.note, g.w - 40, 12).slice(0, 2).forEach((l, i) => {
        s += text(g.x + 18, g.y + 36 + i * 15, l, { size: 12, fill: fam.ink });
      });
    }
    return s;
  }

  /* Paint order is the whole trick: groups, then paths, then cards over the
     paths, then labels over everything. */
  body() {
    const maxY = Math.max(
      ...this.groups.map((g) => g.y + g.h),
      ...this.cards.map((c) => c.y + c.h + 5),
      0,
    );
    const rendered = this.edges.map((e) => this.renderEdge(e));
    const svg = this.under.join('')
      + this.groups.map((g) => this.renderGroup(g)).join('')
      + rendered.map((x) => x.path).join('')
      + this.cards.map((c) => this.renderCard(c)).join('')
      + rendered.map((x) => x.label).join('')
      + this.over.join('');
    return { svg, maxY };
  }
}

/* ---------------------------------------------------------------- *
 * Sequence: lifelines, numbered steps, self-calls and notes.
 * ---------------------------------------------------------------- */

export function sequence({ participants, steps, colW = 190, top = 20 }) {
  const n = participants.length;
  const left = 24;
  const W = left * 2 + n * colW;
  const cx = (i) => left + i * colW + colW / 2;
  const idx = {};
  participants.forEach((p, i) => { idx[p.id] = i; });

  let body = '';
  let labels = '';
  let num = 0;
  let y = top + 108;

  const message = (st) => {
    const a = idx[st.from];
    const b = idx[st.to];
    if (a == null || b == null) throw new Error(`sequence participant missing: ${st.from} ${st.to}`);
    const fam = familyOf(st.family || participants[a].family);
    num += 1;

    if (a === b) {
      const lines = wrap(st.text, colW * 1.7, 11.5);
      const x = cx(a);
      const h = 26;
      body += `<path d="M${r(x + 4)} ${r(y)} H${r(x + 34)} Q${r(x + 42)} ${r(y)} ${r(x + 42)} ${r(y + 8)}`
        + ` V${r(y + h - 8)} Q${r(x + 42)} ${r(y + h)} ${r(x + 34)} ${r(y + h)} H${r(x + 8)}"`
        + ` fill="none" stroke="${fam.arrow}" stroke-width="2" stroke-linecap="round"`
        + ` marker-end="url(#m-${st.family || participants[a].family})"`
        + (st.dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
      body += `<circle cx="${r(x - 14)}" cy="${r(y)}" r="9" fill="${fam.arrow}"/>`
        + text(x - 14, y + 3.6, String(num), { size: 10, weight: 700, fill: INK.paper, anchor: 'middle' });
      lines.forEach((l, i) => {
        labels += text(x + 52, y + 9 + i * 14, l, { size: 11.5, weight: 500, fill: INK.body });
      });
      y += Math.max(h, lines.length * 14) + 22;
      return;
    }

    const x1 = cx(a);
    const x2 = cx(b);
    const dir = x2 > x1 ? 1 : -1;
    const span = Math.abs(x2 - x1) - 30;
    const lines = wrap(st.text, Math.max(span, 150), 11.5);
    lines.forEach((l, i) => {
      labels += text((x1 + x2) / 2, y + 10 + i * 14, l,
        { size: 11.5, weight: 500, fill: INK.body, anchor: 'middle' });
    });
    const ay = y + lines.length * 14 + 8;
    body += `<path d="M${r(x1 + dir * 14)} ${r(ay)} H${r(x2 - dir * 4)}" fill="none"`
      + ` stroke="${fam.arrow}" stroke-width="2" stroke-linecap="round"`
      + ` marker-end="url(#m-${st.family || participants[a].family})"`
      + (st.dashed ? ' stroke-dasharray="6 5"' : '') + '/>';
    body += `<circle cx="${r(x1)}" cy="${r(ay)}" r="9" fill="${fam.arrow}"/>`
      + text(x1, ay + 3.6, String(num), { size: 10, weight: 700, fill: INK.paper, anchor: 'middle' });
    y = ay + 26;
  };

  for (const st of steps) {
    if (st.note) {
      const a = idx[st.over[0]];
      const b = idx[st.over[1] || st.over[0]];
      const fam = familyOf(st.family || 'amber');
      const x = left + Math.min(a, b) * colW + 12;
      const w = (Math.abs(b - a) + 1) * colW - 24;
      const lines = wrap(st.note, w - 28, 12);
      const h = lines.length * 16 + 18;
      labels += `<rect x="${r(x)}" y="${r(y - 6)}" width="${r(w)}" height="${r(h)}" rx="8"`
        + ` fill="${fam.wash}" stroke="${fam.line}"/>`
        + lines.map((l, i) => text(x + w / 2, y + 13 + i * 16, l,
          { size: 12, fill: fam.ink, anchor: 'middle' })).join('');
      y += h + 18;
    } else message(st);
  }

  const H = y + 16;
  let head = '';
  participants.forEach((p, i) => {
    const w = colW - 18;
    const x = cx(i) - w / 2;
    const fam = familyOf(p.family);
    const title = wrap(p.label, w - 56, 12.5, 600).slice(0, 2);
    const sub = wrap(p.detail || '', w - 56, 10.3).slice(0, 2);
    const h = 62;
    head += `<path d="M${r(cx(i))} ${r(top + h)} V${r(H - 12)}" stroke="${INK.ruleStrong}"`
      + ' stroke-width="1.5" stroke-dasharray="4 5"/>';
    head += `<rect x="${r(x + 4)}" y="${r(top + 4)}" width="${r(w)}" height="${h}" rx="8"`
      + ` fill="${INK.paper}" stroke="${INK.title}" stroke-width="1.1"/>`;
    head += `<rect x="${r(x)}" y="${r(top)}" width="${r(w)}" height="${h}" rx="8"`
      + ` fill="${INK.paper}" stroke="${INK.title}" stroke-width="1.5"/>`;
    head += `<rect x="${r(x)}" y="${r(top)}" width="5" height="${h}" rx="2" fill="${fam.arrow}"/>`;
    if (p.icon && hasIcon(p.icon)) head += useIcon(p.icon, x + 12, top + (h - 28) / 2, 28, fam.arrow);
    const tx = x + (p.icon ? 46 : 16);
    const block = title.length * 15 + sub.length * 13;
    let ty = top + (h - block) / 2 + 11;
    title.forEach((l) => { head += text(tx, ty, l, { size: 12.5, weight: 600, fill: INK.title }); ty += 15; });
    sub.forEach((l) => { head += text(tx, ty, l, { size: 10.3, fill: fam.ink }); ty += 13; });
  });

  return { svg: head + body + labels, w: W, h: H };
}
