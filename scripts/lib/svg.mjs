/* SVG primitives for the blueprint drawings.
 *
 * Dependency free, so it runs with plain `node` and no install step, like
 * the rest of the project. Colour, type and meaning live in tokens.mjs;
 * this file only knows how to draw.
 *
 * Two rules it enforces, and they are the reason the drawings read:
 * - the status word is always printed on the chip, so colour is a second
 *   channel rather than the only one
 * - text is measured before it is placed, so nothing overflows a card
 */
import { FAMILY, TYPE, WIDTH_FACTOR, INK, familyOf, statusFamily, STATUS_DASH, CHIP_FAMILY } from './tokens.mjs';

export { FAMILY, TYPE, INK, familyOf, statusFamily, CHIP_FAMILY };

/* Named colours for the parts of a drawing that are not a component: axes,
   gridlines, matrix cells. Everything with a meaning comes from a family;
   these are the neutrals and the brand voice. */
export const T = {
  title: INK.title,
  navy: INK.title,
  navy2: INK.body,
  brand: '#15375D',
  blue: FAMILY.blue.solid,
  blueLight: FAMILY.blue.line,
  teal: FAMILY.teal.solid,
  green: FAMILY.green.solid,
  violet: FAMILY.violet.solid,
  rose: FAMILY.rose.solid,
  amber: FAMILY.amber.solid,
  amberWash: FAMILY.amber.wash,
  silver: INK.ruleStrong,
  paper: INK.paper,
  wash: FAMILY.slate.wash,
  rule: INK.rule,
  mute: INK.mute,
  faint: INK.faint,
  sans: TYPE.sans,
  head: TYPE.display,
};

/* The chip palette, keyed by word, for anything that needs the colours
   without drawing a chip. */
export const STATUS = Object.fromEntries(Object.keys(CHIP_FAMILY).map((word) => {
  const f = statusFamily(word);
  return [word, {
    fill: f.chipWash, stroke: f.line, ink: f.chipInk, solid: f.solid,
    wash: f.wash, dash: STATUS_DASH[word] || null,
  }];
}));

export function r(n) {
  return Math.round(Number(n) * 100) / 100;
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Advance width, close enough for layout at these sizes. */
export function measure(str, size, weight = 400, family = 'sans') {
  const f = WIDTH_FACTOR[family] || WIDTH_FACTOR.sans;
  return String(str).length * size * (weight >= 600 ? f.bold : f.normal);
}

/* Greedy wrap to a pixel width. Returns an array of lines. */
export function wrap(str, width, size, weight = 400, family = 'sans') {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (measure(next, size, weight, family) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const text = (x, y, str, o = {}) => {
  const {
    size = 12, weight = 400, fill = INK.body, anchor = 'start',
    display = false, opacity = 1, letter = 0, italic = false,
  } = o;
  const family = o.family || (display ? TYPE.display : TYPE.sans);
  return `<text x="${r(x)}" y="${r(y)}" font-family="${family}" font-size="${size}"`
    + ` font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"`
    + (opacity !== 1 ? ` opacity="${opacity}"` : '')
    + (letter ? ` letter-spacing="${letter}"` : '')
    + (italic ? ' font-style="italic"' : '')
    + `>${esc(str)}</text>`;
};

/* A wrapped block of text. Returns { svg, height, lines }. */
export function block(x, y, str, width, o = {}) {
  const { size = 11, lh = 1.45, weight = 400 } = o;
  const lines = wrap(str, width, size, weight, o.display ? 'display' : 'sans');
  const svg = lines.map((l, i) => text(x, y + i * size * lh, l, o)).join('');
  return { svg, height: lines.length * size * lh, lines };
}

export const box = (x, y, w, h, o = {}) => {
  const {
    fill = INK.paper, stroke = INK.rule, sw = 1, rx = 8, dash = null, opacity = 1,
  } = o;
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}"`
    + ` fill="${fill}" stroke="${stroke}" stroke-width="${sw}"`
    + (dash ? ` stroke-dasharray="${dash}"` : '')
    + (opacity !== 1 ? ` opacity="${opacity}"` : '')
    + ' />';
};

export const line = (x1, y1, x2, y2, o = {}) => {
  const { stroke = INK.rule, sw = 1, dash = null, cap = 'butt', marker = null } = o;
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}"`
    + ` stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"`
    + (dash ? ` stroke-dasharray="${dash}"` : '')
    + (marker ? ` marker-end="url(#${marker})"` : '')
    + ' />';
};

export const path = (d, o = {}) => {
  const { stroke = INK.rule, sw = 1, fill = 'none', dash = null, marker = null, cap = 'round' } = o;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"`
    + ` stroke-linecap="${cap}" stroke-linejoin="round"`
    + (dash ? ` stroke-dasharray="${dash}"` : '')
    + (marker ? ` marker-end="url(#${marker})"` : '')
    + ' />';
};

export const circle = (cx, cy, rad, o = {}) => {
  const { fill = FAMILY.blue.solid, stroke = 'none', sw = 1, opacity = 1 } = o;
  return `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(rad)}" fill="${fill}"`
    + ` stroke="${stroke}" stroke-width="${sw}"`
    + (opacity !== 1 ? ` opacity="${opacity}"` : '') + ' />';
};

/* Horizontal S-bend: leaves one point, arrives at another, never cutting
   diagonally across a card. */
export const elbow = (x1, y1, x2, y2, o = {}) => {
  const mid = x1 + (x2 - x1) / 2;
  return path(`M ${r(x1)} ${r(y1)} C ${r(mid)} ${r(y1)}, ${r(mid)} ${r(y2)}, ${r(x2)} ${r(y2)}`, o);
};

export const vElbow = (x1, y1, x2, y2, o = {}) => {
  const mid = y1 + (y2 - y1) / 2;
  return path(`M ${r(x1)} ${r(y1)} C ${r(x1)} ${r(mid)}, ${r(x2)} ${r(mid)}, ${r(x2)} ${r(y2)}`, o);
};

/* ---------------------------------------------------------------- *
 * Chip: a small pill carrying one word. The word is always written.
 * ---------------------------------------------------------------- */
export function chip(x, y, label, o = {}) {
  const { size = 9.5, padX = 8, h = 18 } = o;
  const fam = o.family ? familyOf(o.family) : statusFamily(label);
  const fill = o.fill || fam.chipWash;
  const stroke = o.stroke || fam.line;
  const ink = o.ink || fam.chipInk;
  const w = measure(label, size, 600) + padX * 2;
  const svg = box(x, y, w, h, { fill, stroke, rx: h / 2, dash: o.dash || STATUS_DASH[label] || null })
    + text(x + w / 2, y + h / 2 + size * 0.355, label, {
      size, weight: 600, fill: ink, anchor: 'middle', letter: 0.1,
    });
  return { svg, width: w };
}

/* A small label over a hairline, used to head a column. */
export const bandLabel = (x, y, label, o = {}) =>
  text(x, y, String(label).toUpperCase(), {
    size: o.size || 9.5, weight: 700, fill: o.fill || INK.mute,
    letter: 1.1, anchor: o.anchor || 'start',
  });

/* One arrow marker per family, so an arrowhead is the colour of the thing
   it is pointing at. */
export const arrowDefs = () => {
  const markers = Object.entries(FAMILY).map(([name, f]) =>
    `<marker id="m-${name}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">`
    + `<path d="M 0 0.6 L 9.4 5 L 0 9.4 z" fill="${f.solid}" /></marker>`).join('');
  return `  <defs>${markers}</defs>`;
};

/* The legend. Printed on every drawing that uses status, so a drawing sent
   on its own still explains itself. */
export function statusLegend(x, y, keys = Object.keys(CHIP_FAMILY).slice(0, 5)) {
  let out = bandLabel(x, y, 'Status', { size: 9 });
  let cx = x + measure('STATUS', 9, 700) + 12;
  for (const k of keys) {
    const made = chip(cx, y - 13, k);
    out += made.svg;
    cx += made.width + 6;
  }
  return out;
}

/* The heading of a drawing: what it is, when it was made, and where its
   source is. A drawing with no date on it gets believed.
   Returns { svg, bottom }, so a long note pushes the drawing down. */
export function frame({ title, note, asOf, w }) {
  let out = text(32, 46, title, { size: 22, weight: 600, display: true, fill: INK.title });
  let ruleY = 80;
  if (note) {
    const b = block(32, 70, note, w - 320, { size: 11.5, fill: INK.mute, lh: 1.45 });
    out += b.svg;
    ruleY = 70 + b.height + 8;
  }
  out += text(w - 32, 40, `Generated ${asOf}`, { size: 10, fill: INK.faint, anchor: 'end' });
  out += text(w - 32, 56, 'Source: docs/diagrams/model.mjs', { size: 10, fill: INK.faint, anchor: 'end' });
  out += line(32, ruleY, w - 32, ruleY, { stroke: INK.rule });
  return { svg: out, bottom: ruleY };
}

/* Web fonts, so a drawing opened on its own looks like the page it came
   from rather than falling back to a system serif. */
/* CDATA, because the font URL carries ampersands and a bare & is not
   well-formed XML. A standalone .svg is parsed strictly; one unescaped
   ampersand and the whole drawing fails to render. */
const fontStyle = () =>
  `  <style><![CDATA[@import url('${TYPE.googleHref}');]]></style>`;

export function doc({ w, h, title, desc, body, sprite = '', bg = INK.paper }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}"`
    + ` width="${r(w)}" height="${r(h)}" role="img" aria-labelledby="diagram-title diagram-desc">\n`
    + `  <title id="diagram-title">${esc(title)}</title>\n`
    + `  <desc id="diagram-desc">${esc(desc)}</desc>\n`
    + fontStyle() + '\n'
    + arrowDefs() + '\n'
    + (sprite ? `  <defs>${sprite}</defs>\n` : '')
    + `  <rect width="${r(w)}" height="${r(h)}" fill="${bg}" />\n`
    + body + '\n</svg>\n';
}
