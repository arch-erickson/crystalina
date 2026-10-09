/* The diagram component library.
 *
 * Every drawing is assembled from these and from the symbols in icons.mjs.
 * Nothing draws a rectangle of its own: if a shape appears in two drawings
 * it is a component here, and a variation is a parameter rather than a
 * second copy. That is the rule the whole project runs on, applied to the
 * drawings as well as to the site.
 *
 * Each component is two phase. Calling it measures and returns
 * { h, draw(x, y, height) }, so a grid can take the tallest card in a row
 * and give every card in that row the same height.
 *
 * `COMPONENTS` at the foot is the manifest the library sheet is drawn from,
 * so the sheet cannot drift from the code.
 */
import {
  FAMILY, INK, TYPE, familyOf, statusFamily, CHIP_FAMILY,
  box, text, line, path, elbow, vElbow, chip, wrap, measure, block,
  bandLabel, esc, r,
} from './svg.mjs';
import { STATUS_DASH } from './tokens.mjs';
import { use as useIcon, hasIcon } from './icons.mjs';

/* Text with a paper halo, so a label stays readable where it crosses a line. */
export const halo = (x, y, str, o = {}) => {
  const { size = 10, fill = INK.mute, anchor = 'middle', weight = 500 } = o;
  return `<text x="${r(x)}" y="${r(y)}" font-family="${TYPE.sans}" font-size="${size}"`
    + ` font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"`
    + ` stroke="${INK.paper}" stroke-width="4" paint-order="stroke"`
    + `>${esc(str)}</text>`;
};

export const toneOf = (family) => {
  const f = familyOf(family || 'blue');
  return { stroke: f.solid, marker: `m-${family || 'blue'}`, ink: f.ink, fam: f };
};

/* A label over a hairline, to head a column or a band. */
export const SectionRule = (x, y, w, label, o = {}) =>
  bandLabel(x, y, label, { size: o.size || 10, fill: o.fill || INK.mute })
  + line(x, y + 8, x + w, y + 8, { stroke: o.stroke || INK.rule });

/* ---------------------------------------------------------------- *
 * ZonePanel: a tinted area with a solid pill tab sitting on its top
 * edge. The tab names the zone; the tint says what kind of zone it
 * is; everything inside belongs to it.
 * ---------------------------------------------------------------- */
export function ZonePanel(w, z) {
  const fam = familyOf(z.family);
  const tabH = 28;
  const tabPadX = 14;
  const tabW = measure(z.label, 13, 600) + tabPadX * 2;
  const sub = z.note ? wrap(z.note, w - 32, 10.5) : [];
  const headroom = tabH / 2 + 12 + sub.length * 14;

  return {
    headroom,
    tabH,
    draw(x, y, h) {
      let s = box(x, y, w, h, { fill: fam.wash, stroke: fam.line, sw: 1.4, rx: 14 });
      s += box(x + 16, y - tabH / 2, tabW, tabH, { fill: fam.solid, stroke: fam.solid, rx: 8 });
      s += text(x + 16 + tabPadX, y - tabH / 2 + 18.5, z.label, {
        size: 13, weight: 600, fill: INK.paper,
      });
      sub.forEach((l, i) => {
        s += text(x + 18, y + tabH / 2 + 10 + i * 14, l, { size: 10.5, fill: fam.ink });
      });
      return s;
    },
  };
}

/* ---------------------------------------------------------------- *
 * Card: the workhorse. White, hairline border, an icon on the left
 * in the colour of what it is, a dark title, a coloured subtitle,
 * and a status chip sitting on the top-right corner.
 * ---------------------------------------------------------------- */
export function Card(w, d, o = {}) {
  const pad = 13;
  const ts = o.titleSize || 12.8;
  const fam = familyOf(d.family || o.family || 'slate');
  const ico = d.icon && hasIcon(d.icon) ? d.icon : null;
  const indent = ico ? 34 : 0;
  const inner = w - pad * 2 - indent;

  const titleLines = wrap(d.label, inner, ts, 600);
  const detail = d.detail ? wrap(d.detail, inner, 10.4) : [];
  const note = d.note ? wrap(d.note, w - pad * 2, 9.8) : [];

  const tB = pad + ts + 1;
  const dB = tB + 14;
  const dEnd = detail.length ? dB + (detail.length - 1) * 13.2 : tB;
  const titleEnd = tB + (titleLines.length - 1) * (ts + 2.5);
  const bodyEnd = Math.max(titleEnd, dEnd);
  const nB = bodyEnd + 15;
  const nEnd = note.length ? nB + (note.length - 1) * 12.4 : bodyEnd;
  const h = Math.max(nEnd + pad + 2, 54);

  return {
    h,
    draw(x, y, height = h) {
      const dash = STATUS_DASH[d.status] || null;
      let s = box(x, y, w, height, {
        fill: INK.card, stroke: d.status === 'Missing' ? fam.line : INK.ruleStrong,
        sw: 1.1, rx: 9, dash,
      });
      if (ico) s += useIcon(ico, x + pad, y + pad - 1, 21, fam.solid);
      titleLines.forEach((l, i) => {
        s += text(x + pad + indent, y + tB + i * (ts + 2.5), l,
          { size: ts, weight: 600, fill: INK.title });
      });
      detail.forEach((l, i) => {
        s += text(x + pad + indent, y + dB + (titleLines.length - 1) * (ts + 2.5) + i * 13.2, l,
          { size: 10.4, fill: fam.ink });
      });
      note.forEach((l, i) => {
        s += text(x + pad, y + nB + (titleLines.length - 1) * (ts + 2.5) + i * 12.4, l,
          { size: 9.8, fill: INK.mute, italic: true });
      });
      if (d.status) {
        const made = chip(0, 0, d.status);
        s += chip(x + w - made.width - 10, y - 9, d.status).svg;
      }
      return s;
    },
  };
}

/* Kept as the old name so existing drawings read the same. */
export const StatusCard = Card;

/* ---------------------------------------------------------------- *
 * PageCard: one page of the site. Two labelled chips, what the
 * backend does, and what remains.
 * ---------------------------------------------------------------- */
export function PageCard(w, p) {
  const pad = 13;
  const inner = w - pad * 2;
  const fam = familyOf(p.area === 'staff' ? 'violet' : 'blue');
  const built = p.built.map((b) => wrap(b, inner - 16, 9.8));
  const rest = p.remaining.map((b) => wrap(b, inner - 16, 9.8));
  const count = (arr) => arr.reduce((n, l) => n + l.length, 0);
  const h = pad + 16 + 22 + 18 + 16
    + 12 + count(built) * 12.2 + built.length * 3 + 10
    + 12 + count(rest) * 12.2 + rest.length * 3 + pad;

  return {
    h,
    draw(x, y, height = h) {
      const serverFam = statusFamily(p.server);
      let s = box(x, y, w, height, {
        fill: INK.card, stroke: INK.ruleStrong, sw: 1.1, rx: 10,
      });
      s += box(x, y, 5, height, { fill: fam.solid, stroke: 'none', rx: 2.5 });
      let yy = y + pad + 14;
      if (p.icon && hasIcon(p.icon)) s += useIcon(p.icon, x + pad + 4, y + pad - 2, 20, fam.solid);
      s += text(x + pad + (p.icon ? 30 : 4), yy, p.label,
        { size: 14, weight: 600, display: true, fill: INK.title });
      s += text(x + w - pad, yy, p.route, { size: 9.8, fill: INK.faint, anchor: 'end' });
      yy += 22;
      const c1 = chip(x + pad + 4, yy, `Design · ${p.design}`);
      s += c1.svg;
      s += chip(x + pad + 4 + c1.width + 6, yy, `Server · ${p.server}`).svg;
      yy += 18 + 16;
      s += bandLabel(x + pad + 4, yy, 'Backend built', { size: 8.4, fill: FAMILY.green.solid });
      yy += 12;
      for (const group of built) {
        group.forEach((l, i) => {
          if (i === 0) s += line(x + pad + 4, yy - 3.2, x + pad + 9, yy - 3.2, { stroke: FAMILY.green.solid, sw: 1.7, cap: 'round' });
          s += text(x + pad + 15, yy, l, { size: 9.8, fill: INK.body });
          yy += 12.2;
        });
        yy += 3;
      }
      yy += 7;
      s += bandLabel(x + pad + 4, yy, 'Remaining', { size: 8.4, fill: serverFam.solid });
      yy += 12;
      for (const group of rest) {
        group.forEach((l, i) => {
          if (i === 0) s += line(x + pad + 4, yy - 3.2, x + pad + 9, yy - 3.2, { stroke: serverFam.solid, sw: 1.7, cap: 'round' });
          s += text(x + pad + 15, yy, l, { size: 9.8, fill: INK.body });
          yy += 12.2;
        });
        yy += 3;
      }
      return s;
    },
  };
}

/* ---------------------------------------------------------------- *
 * TableCard: one database table and its key fields.
 * ---------------------------------------------------------------- */
export function TableCard(w, t, o = {}) {
  const pad = 12;
  const fam = familyOf(o.family || 'teal');
  const statusFam = statusFamily(t.status);
  const note = t.note ? wrap(t.note, w - pad * 2, 9.4) : [];
  const h = 30 + 12 + t.fields.length * 12.6 + (note.length ? 5 + note.length * 11.6 : 0) + pad;
  return {
    h,
    draw(x, y) {
      let s = box(x, y, w, h, {
        fill: INK.card, stroke: INK.ruleStrong, sw: 1.1, rx: 9,
        dash: STATUS_DASH[t.status] || null,
      });
      s += box(x + 1, y + 1, w - 2, 29, { fill: fam.wash, stroke: 'none', rx: 8 });
      s += box(x + 1, y + 20, w - 2, 10, { fill: fam.wash, stroke: 'none', rx: 0 });
      s += line(x + 1, y + 30, x + w - 1, y + 30, { stroke: fam.line });
      s += useIcon('database', x + pad, y + 6.5, 17, fam.solid);
      s += text(x + pad + 24, y + 20, t.name, { size: 11.4, weight: 600, fill: INK.title });
      const made = chip(0, 0, t.status, { size: 8.8, h: 16 });
      s += chip(x + w - made.width - 9, y - 8, t.status, { size: 8.8, h: 16 }).svg;
      let yy = y + 30 + 15;
      for (const f of t.fields) { s += text(x + pad, yy, f, { size: 9.6, fill: INK.body }); yy += 12.6; }
      if (note.length) {
        yy += 3;
        for (const l of note) { s += text(x + pad, yy, l, { size: 9.4, fill: statusFam.ink, italic: true }); yy += 11.6; }
      }
      return s;
    },
  };
}

/* ---------------------------------------------------------------- *
 * Lane: the head of one lifeline in a sequence diagram.
 * ---------------------------------------------------------------- */
export function Lane(w, l, o = {}) {
  const h = o.h || 58;
  const fam = familyOf(l.family || 'navy');
  return {
    h,
    draw(x, y) {
      let s = box(x, y, w, h, { fill: fam.solid, stroke: fam.solid, rx: 10 });
      const ico = l.icon && hasIcon(l.icon);
      const labelW = measure(l.label, 12.5, 600);
      if (ico) s += useIcon(l.icon, x + w / 2 - labelW / 2 - 25, y + 9, 18, '#FFFFFF', { opacity: 0.92 });
      s += text(x + w / 2 + (ico ? 10 : 0), y + 23, l.label,
        { size: 12.5, weight: 600, fill: INK.paper, anchor: 'middle' });
      s += text(x + w / 2, y + 42, l.detail,
        { size: 9.8, fill: '#FFFFFF', anchor: 'middle', opacity: 0.74 });
      return s;
    },
  };
}

/* ---------------------------------------------------------------- *
 * NotePanel: a soft aside. The reading instructions for a drawing,
 * or anything the picture itself cannot say.
 * ---------------------------------------------------------------- */
export function NotePanel(w, body, o = {}) {
  const fam = familyOf(o.family || 'amber');
  const items = Array.isArray(body) ? body : [body];
  const lines = items.map((t) => wrap(t, w - 44, 10.8));
  const titleH = o.title ? 22 : 0;
  const h = 18 + titleH + lines.reduce((n, l) => n + l.length, 0) * 14.6 + lines.length * 6 + 6;
  return {
    h,
    draw(x, y) {
      let s = box(x, y, w, h, { fill: fam.wash, stroke: fam.line, rx: 9 });
      let yy = y + 20;
      if (o.title) {
        if (o.icon) s += useIcon(o.icon, x + 16, y + 10, 16, fam.solid);
        s += bandLabel(x + 16 + (o.icon ? 22 : 0), yy, o.title, { size: 9.5, fill: fam.chipInk });
        yy += 22;
      }
      for (const group of lines) {
        for (const l of group) { s += text(x + 16, yy, l, { size: 10.8, fill: fam.ink }); yy += 14.6; }
        yy += 6;
      }
      return s;
    },
  };
}

/* The failure path, drawn beside the happy path rather than left in a
   footnote. A NotePanel in the danger family, with a title that says so. */
export const FailurePanel = (w, items, o = {}) => NotePanel(w, items, {
  family: 'rose',
  icon: 'alert',
  title: o.title || 'The failure path, and what is wrong with it today',
});

/* ---------------------------------------------------------------- *
 * Connector: between two measured rectangles, in the colour of
 * whatever it is pointing at.
 * ---------------------------------------------------------------- */
export function Connector(src, dst, o = {}) {
  const tone = toneOf(o.family);
  const opts = { stroke: tone.stroke, sw: o.sw || 1.7, marker: tone.marker, dash: o.dash || null };
  if (Math.abs(src.cx - dst.cx) < 4) {
    const edge = Math.max(src.x + src.w, dst.x + dst.w);
    const bow = edge + 22;
    const d = path(`M ${r(src.x + src.w)} ${r(src.cy)} C ${r(bow)} ${r(src.cy)}, ${r(bow)} ${r(dst.cy)}, ${r(dst.x + dst.w)} ${r(dst.cy)}`, opts);
    return d + (o.label
      ? halo(bow + 6, (src.cy + dst.cy) / 2, o.label, { fill: INK.mute, anchor: 'start' })
      : '');
  }
  const forward = dst.x > src.x;
  const x1 = forward ? src.x + src.w : src.x;
  const x2 = forward ? dst.x - 3 : dst.x + dst.w + 3;
  const d = elbow(x1, src.cy, x2, dst.cy, opts);
  if (!o.label) return d;

  /* Where several arrows cross the same gap, their labels would land on
     top of one another. `at` slides a label along its own curve, so the
     caller can fan them out. */
  const at = typeof o.at === 'number' ? Math.min(0.85, Math.max(0.15, o.at)) : 0.5;
  const mid = x1 + (x2 - x1) / 2;
  const u = 1 - at;
  const lx = u * u * u * x1 + 3 * u * u * at * mid + 3 * u * at * at * mid + at * at * at * x2;
  const ly = u * u * u * src.cy + 3 * u * u * at * src.cy + 3 * u * at * at * dst.cy + at * at * at * dst.cy;
  return d + halo(lx, ly - 7, o.label, { fill: INK.mute });
}

/* ---------------------------------------------------------------- *
 * The manifest the library sheet is drawn from.
 * ---------------------------------------------------------------- */
export const COMPONENTS = [
  {
    name: 'Card',
    purpose: 'A thing in the system: what it is, what it is for, and how far along it is. The icon is the colour of the kind of thing it is, so a column of cards can be read without reading the words.',
    render: Card,
    width: 252,
    variants: [
      { label: 'Supabase Postgres', detail: 'RLS, create_order, catalog RPCs', status: 'Implemented', icon: 'database', family: 'teal' },
      { label: 'Supabase Auth', detail: 'Email sign-in, JWT', note: 'Reset and verification to add', status: 'Partial', icon: 'key', family: 'violet' },
      { label: 'Stripe', detail: 'Checkout Session plus webhook', note: 'Blocks launch', status: 'Missing', icon: 'card', family: 'green' },
      { label: 'Staff browser', detail: 'Admin, manager, sales', note: 'Gate moves to a policy', status: 'Refactor', icon: 'people', family: 'blue' },
      { label: 'Cron Triggers', detail: 'Abandoned cart, expiry', status: 'Post-MVP', icon: 'clock', family: 'slate' },
    ],
  },
  {
    name: 'ZonePanel',
    purpose: 'A tinted area with a solid tab on its edge. The tab names the zone, the tint says what kind of zone it is, and everything inside belongs to it.',
    render: (w, v) => {
      const panel = ZonePanel(w, v);
      return { h: 96, draw: (x, y) => panel.draw(x, y + 16, 80) };
    },
    width: 272,
    variants: [
      { label: 'Cloudflare edge', family: 'amber', note: 'What sits in front' },
      { label: 'Data at rest', family: 'teal', note: 'Kept, not moved' },
      { label: 'Untrusted', family: 'rose', note: 'Anything a stranger sends' },
    ],
  },
  {
    name: 'PageCard',
    purpose: 'One page of the site in the site map: two labelled chips, what the backend does, and what remains. Blue for a customer page, violet for a staff one.',
    render: PageCard,
    width: 310,
    variants: [
      {
        label: 'Checkout', route: '/checkout/', design: 'Implemented', server: 'Partial', icon: 'cart', area: 'client',
        built: ['Server-authoritative pricing through create_order'],
        remaining: ['No payment: the submit button is disabled on purpose'],
      },
      {
        label: 'Admin console', route: '/admin/', design: 'Implemented', server: 'Partial', icon: 'gear', area: 'staff',
        built: ['Catalog writes gated on has_role'],
        remaining: ['Record fields reach innerHTML unescaped'],
      },
    ],
  },
  {
    name: 'TableCard',
    purpose: 'One database table in the content model, with the fields another part of the system depends on.',
    render: TableCard,
    width: 262,
    variants: [
      { name: 'orders', fields: ['id', 'user_id', 'status', 'total_cents'], status: 'Partial', note: 'No paid state yet' },
      { name: 'product_stage_options', fields: ['product_id', 'stages', 'price_cents'], status: 'Missing', note: 'Table exists, no rows' },
    ],
  },
  {
    name: 'Lane',
    purpose: 'The head of one lifeline in a sequence diagram, coloured by what kind of thing it is.',
    render: Lane,
    width: 222,
    variants: [
      { label: 'Pages Function', detail: '/api/orders/create', icon: 'bolt', family: 'amber' },
      { label: 'Postgres', detail: 'create_order()', icon: 'database', family: 'teal' },
      { label: 'Stripe', detail: 'Checkout', icon: 'card', family: 'green' },
    ],
  },
  {
    name: 'NotePanel',
    purpose: 'A soft aside: how to read a drawing, or the failure path beside the happy one.',
    render: (w, v) => NotePanel(w, v.items, v),
    width: 560,
    variants: [
      {
        family: 'rose', icon: 'alert', title: 'The failure path',
        items: ['Bad or missing captcha token: 400, nothing written.', 'Out of stock: the transaction rolls back, so no partial order.'],
      },
      {
        family: 'amber', icon: 'eye', title: 'How to read this',
        items: ['Left to right. A dashed border means the thing does not exist yet.'],
      },
    ],
  },
];
