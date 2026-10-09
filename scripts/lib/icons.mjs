/* The diagram icon library.
 *
 * Each icon is defined exactly once, as an SVG <symbol> on a 32 by 32 grid,
 * and every use of it is an <use href="#i-name"> instance. That is the same
 * relationship a Figma component has with its instances: change the symbol
 * and every drawing that references it changes with it. Nothing anywhere
 * copies an icon's path.
 *
 * House style, matching the storefront icons in js/main.js: stroke line
 * icons, 1.7 weight, round caps and joins, no emoji. The one filled shape in
 * an icon uses fill="currentColor" with a low opacity, so `color` on the
 * instance tints it. That is why instances are written
 *
 *     <use href="#i-database" x=".." y=".." width="20" height="20" color="#2A7BC4" />
 *
 * and never with a fill.
 *
 * Usage inside a document:
 *   beginDoc()                 forget what the last drawing used
 *   use('database', x, y, 20)  draw an instance, and record the name
 *   spriteUsed()               the <symbol> definitions for just those icons
 */

const S = (body) => body;

export const ICONS = {
  browser: S('<rect x="3" y="5" width="26" height="22" rx="3.5" fill="currentColor" fill-opacity=".16"/><rect x="3" y="5" width="26" height="22" rx="3.5"/><path d="M3 12h26"/><path d="M7 8.5h.01M11 8.5h.01M15 8.5h.01"/>'),
  person: S('<circle cx="16" cy="11" r="5" fill="currentColor" fill-opacity=".22"/><circle cx="16" cy="11" r="5"/><path d="M6.5 27.5c0-5.2 4.3-8.5 9.5-8.5s9.5 3.3 9.5 8.5"/>'),
  people: S('<circle cx="12" cy="11" r="4.6" fill="currentColor" fill-opacity=".22"/><circle cx="12" cy="11" r="4.6"/><path d="M3.5 27c0-4.8 3.8-7.8 8.5-7.8s8.5 3 8.5 7.8"/><path d="M21.5 7.2a4.6 4.6 0 0 1 0 8.6M23.5 19.8c3 1 5 3.7 5 7.2"/>'),
  cloud: S('<path d="M9.5 25h13a5 5 0 0 0 .6-10A8 8 0 0 0 7.8 17.4 4.4 4.4 0 0 0 9.5 25z" fill="currentColor" fill-opacity=".2"/><path d="M9.5 25h13a5 5 0 0 0 .6-10A8 8 0 0 0 7.8 17.4 4.4 4.4 0 0 0 9.5 25z"/>'),
  globe: S('<circle cx="16" cy="16" r="12.5" fill="currentColor" fill-opacity=".14"/><circle cx="16" cy="16" r="12.5"/><path d="M4 12.5h24M4 20h24"/><path d="M16 3.5c3.2 3.4 4.8 7.8 4.8 12.5S19.2 25.1 16 28.5c-3.2-3.4-4.8-7.8-4.8-12.5S12.8 6.9 16 3.5z"/>'),
  server: S('<rect x="4" y="5" width="24" height="9" rx="2.6" fill="currentColor" fill-opacity=".18"/><rect x="4" y="5" width="24" height="9" rx="2.6"/><rect x="4" y="18" width="24" height="9" rx="2.6"/><path d="M8.5 9.5h.01M8.5 22.5h.01M13 9.5h8M13 22.5h8"/>'),
  bolt: S('<path d="M18.5 3 7 17.5h7.5L13.5 29 25 14.5h-7.5z" fill="currentColor" fill-opacity=".2"/><path d="M18.5 3 7 17.5h7.5L13.5 29 25 14.5h-7.5z"/>'),
  database: S('<ellipse cx="16" cy="7.5" rx="10.5" ry="3.8" fill="currentColor" fill-opacity=".22"/><ellipse cx="16" cy="7.5" rx="10.5" ry="3.8"/><path d="M5.5 7.5v17c0 2.1 4.7 3.8 10.5 3.8s10.5-1.7 10.5-3.8v-17"/><path d="M5.5 16c0 2.1 4.7 3.8 10.5 3.8S26.5 18.1 26.5 16"/>'),
  key: S('<circle cx="11" cy="21" r="6.2" fill="currentColor" fill-opacity=".2"/><circle cx="11" cy="21" r="6.2"/><path d="M15.4 16.6 27.5 4.5"/><path d="M21.5 10.5l3.2 3.2M24.4 7.6l3.2 3.2"/>'),
  shield: S('<path d="M16 3.5 27 8v7.4c0 6.4-4.5 10.8-11 12.6-6.5-1.8-11-6.2-11-12.6V8z" fill="currentColor" fill-opacity=".18"/><path d="M16 3.5 27 8v7.4c0 6.4-4.5 10.8-11 12.6-6.5-1.8-11-6.2-11-12.6V8z"/><path d="M11.5 15.8 15 19.3l6-6.3"/>'),
  lock: S('<rect x="6.5" y="14" width="19" height="14" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="6.5" y="14" width="19" height="14" rx="3"/><path d="M10.5 14v-3.8a5.5 5.5 0 0 1 11 0V14"/><path d="M16 19.5v3.5"/>'),
  mail: S('<rect x="3.5" y="7" width="25" height="18" rx="3" fill="currentColor" fill-opacity=".16"/><rect x="3.5" y="7" width="25" height="18" rx="3"/><path d="M4 8.5 16 17.5 28 8.5"/>'),
  card: S('<rect x="3" y="7" width="26" height="18" rx="3" fill="currentColor" fill-opacity=".18"/><rect x="3" y="7" width="26" height="18" rx="3"/><path d="M3 13h26"/><path d="M7.5 19.5h5"/>'),
  image: S('<rect x="4" y="5.5" width="24" height="21" rx="3" fill="currentColor" fill-opacity=".14"/><rect x="4" y="5.5" width="24" height="21" rx="3"/><circle cx="11.5" cy="12.5" r="2.4"/><path d="M4.5 22 11.5 16l6 5 4-3.2 6 5"/>'),
  clock: S('<circle cx="16" cy="16" r="12.5" fill="currentColor" fill-opacity=".16"/><circle cx="16" cy="16" r="12.5"/><path d="M16 8v8.6l5 3"/>'),
  chart: S('<path d="M6 27V13M13 27V6M20 27v-9M27 27V10" stroke-width="2.4"/><path d="M4 28.5h25"/>'),
  box: S('<path d="M16 3.5 27.5 10v12L16 28.5 4.5 22V10z" fill="currentColor" fill-opacity=".16"/><path d="M16 3.5 27.5 10v12L16 28.5 4.5 22V10z"/><path d="M4.5 10 16 16.5 27.5 10M16 16.5v12"/>'),
  bell: S('<path d="M8 14a8 8 0 0 1 16 0c0 5.5 2 7.5 2 7.5H6s2-2 2-7.5z" fill="currentColor" fill-opacity=".18"/><path d="M8 14a8 8 0 0 1 16 0c0 5.5 2 7.5 2 7.5H6s2-2 2-7.5z"/><path d="M13 25a3.2 3.2 0 0 0 6 0"/>'),
  cart: S('<path d="M9.5 19.5h13.5L26 8.5H7" fill="currentColor" fill-opacity=".16"/><path d="M3 4.5h3.2L9.5 19.5h13.5L26 8.5H7"/><circle cx="12" cy="25.5" r="2"/><circle cx="22" cy="25.5" r="2"/>'),
  search: S('<circle cx="14" cy="14" r="9.5" fill="currentColor" fill-opacity=".16"/><circle cx="14" cy="14" r="9.5"/><path d="M20.8 20.8 28 28"/>'),
  page: S('<path d="M7 3.5h11L25.5 11v17.5H7z" fill="currentColor" fill-opacity=".14"/><path d="M7 3.5h11L25.5 11v17.5H7z"/><path d="M18 3.5V11h7.5"/><path d="M11 17h10M11 21.5h10"/>'),
  wrench: S('<path d="M21 3.5a7.5 7.5 0 0 0-6.9 10.4L3.5 24.5 7.5 28.5 18.1 17.9A7.5 7.5 0 0 0 28.5 11l-4.6 4.6-4-1-1-4z" fill="currentColor" fill-opacity=".18"/><path d="M21 3.5a7.5 7.5 0 0 0-6.9 10.4L3.5 24.5 7.5 28.5 18.1 17.9A7.5 7.5 0 0 0 28.5 11l-4.6 4.6-4-1-1-4z"/>'),
  calendar: S('<rect x="4" y="7" width="24" height="21" rx="3" fill="currentColor" fill-opacity=".14"/><rect x="4" y="7" width="24" height="21" rx="3"/><path d="M4 13.5h24"/><path d="M11 3.8v6M21 3.8v6"/>'),
  chat: S('<path d="M4.5 6h23v15.5H13L7 27v-5.5H4.5z" fill="currentColor" fill-opacity=".16"/><path d="M4.5 6h23v15.5H13L7 27v-5.5H4.5z"/><path d="M9.5 11.5h13M9.5 16h8"/>'),
  phone: S('<path d="M8.5 4h4.2l1.9 5.1-2.9 2a15.5 15.5 0 0 0 7.2 7.2l2-2.9 5.1 1.9v4.2a2.5 2.5 0 0 1-2.8 2.5C12.6 22.6 7.4 17.4 6 8.8A2.5 2.5 0 0 1 8.5 4z" fill="currentColor" fill-opacity=".18"/><path d="M8.5 4h4.2l1.9 5.1-2.9 2a15.5 15.5 0 0 0 7.2 7.2l2-2.9 5.1 1.9v4.2a2.5 2.5 0 0 1-2.8 2.5C12.6 22.6 7.4 17.4 6 8.8A2.5 2.5 0 0 1 8.5 4z"/>'),
  tag: S('<path d="M4 15.5V4.5h11l13 13-11 11z" fill="currentColor" fill-opacity=".16"/><path d="M4 15.5V4.5h11l13 13-11 11z"/><circle cx="9.8" cy="10.3" r="1.8"/>'),
  alert: S('<path d="M16 4 29.5 27.5h-27z" fill="currentColor" fill-opacity=".2"/><path d="M16 4 29.5 27.5h-27z"/><path d="M16 13v6M16 23.2h.01"/>'),
  check: S('<circle cx="16" cy="16" r="12.5" fill="currentColor" fill-opacity=".18"/><circle cx="16" cy="16" r="12.5"/><path d="M10 16.4 14.4 20.8 22.4 11.8"/>'),
  upload: S('<path d="M16 21.5V5M10 11 16 5l6 6"/><path d="M5 21.5V27h22v-5.5" fill="currentColor" fill-opacity=".16"/><path d="M5 21.5V27h22v-5.5"/>'),
  link: S('<path d="M13.5 18.5a5.5 5.5 0 0 0 7.8 0l4.6-4.6a5.5 5.5 0 0 0-7.8-7.8L15.6 8.6"/><path d="M18.5 13.5a5.5 5.5 0 0 0-7.8 0l-4.6 4.6a5.5 5.5 0 0 0 7.8 7.8l2.5-2.5"/>'),
  flag: S('<path d="M7 28V4"/><path d="M7 5.5h16l-3 4.8 3 4.8H7z" fill="currentColor" fill-opacity=".2"/><path d="M7 5.5h16l-3 4.8 3 4.8H7z"/>'),
  rocket: S('<path d="M16 3c4.6 3.4 7.3 8.4 7.3 14L16 23.5 8.7 17c0-5.6 2.7-10.6 7.3-14z" fill="currentColor" fill-opacity=".18"/><path d="M16 3c4.6 3.4 7.3 8.4 7.3 14L16 23.5 8.7 17c0-5.6 2.7-10.6 7.3-14z"/><circle cx="16" cy="13" r="2.6"/><path d="M11.5 22c-2.2 1.6-2.8 4-2.8 6 2.2 0 4.5-.6 6.1-2.6M20.5 22c2.2 1.6 2.8 4 2.8 6-2.2 0-4.5-.6-6.1-2.6"/>'),
  undo: S('<path d="M5 12.5h13a7.5 7.5 0 0 1 0 15H11"/><path d="M5 12.5 10.8 6.8M5 12.5 10.8 18.2"/>'),
  drop: S('<path d="M16 3.5c4.4 5 7.6 9.2 7.6 13.2a7.6 7.6 0 0 1-15.2 0c0-4 3.2-8.2 7.6-13.2z" fill="currentColor" fill-opacity=".2"/><path d="M16 3.5c4.4 5 7.6 9.2 7.6 13.2a7.6 7.6 0 0 1-15.2 0c0-4 3.2-8.2 7.6-13.2z"/>'),
  filter: S('<path d="M4 6h24l-9.5 11v10l-5-3v-7z" fill="currentColor" fill-opacity=".16"/><path d="M4 6h24l-9.5 11v10l-5-3v-7z"/>'),
  branch: S('<circle cx="9" cy="7" r="3.2" fill="currentColor" fill-opacity=".22"/><circle cx="9" cy="7" r="3.2"/><circle cx="9" cy="25" r="3.2"/><circle cx="23" cy="12" r="3.2"/><path d="M9 10.2v11.6"/><path d="M23 15.2c0 4.3-3.6 6.9-8 6.9"/>'),
  eye: S('<path d="M2.5 16S7 8 16 8s13.5 8 13.5 8-4.5 8-13.5 8S2.5 16 2.5 16z" fill="currentColor" fill-opacity=".14"/><path d="M2.5 16S7 8 16 8s13.5 8 13.5 8-4.5 8-13.5 8S2.5 16 2.5 16z"/><circle cx="16" cy="16" r="3.8"/>'),
  gear: S('<circle cx="16" cy="16" r="4.2" fill="currentColor" fill-opacity=".22"/><circle cx="16" cy="16" r="4.2"/><path d="M16 3.5v4M16 24.5v4M28.5 16h-4M7.5 16h-4M24.8 7.2 22 10M10 22l-2.8 2.8M24.8 24.8 22 22M10 10 7.2 7.2"/>'),
  layers: S('<path d="M16 4 29 11 16 18 3 11z" fill="currentColor" fill-opacity=".18"/><path d="M16 4 29 11 16 18 3 11z"/><path d="M3 17 16 24 29 17"/><path d="M3 23 16 30 29 23"/>'),
  truck: S('<path d="M3 7h15v14H3z" fill="currentColor" fill-opacity=".16"/><path d="M3 7h15v14H3z"/><path d="M18 12h6l5 5v4h-11z"/><circle cx="9" cy="24.5" r="2.4"/><circle cx="23" cy="24.5" r="2.4"/>'),
  pin: S('<path d="M16 3.5c5 0 9 4 9 9 0 6.5-9 16-9 16s-9-9.5-9-16c0-5 4-9 9-9z" fill="currentColor" fill-opacity=".18"/><path d="M16 3.5c5 0 9 4 9 9 0 6.5-9 16-9 16s-9-9.5-9-16c0-5 4-9 9-9z"/><circle cx="16" cy="12.5" r="3.4"/>'),
};

let used = new Set();

/* Call at the start of each drawing, so a document carries only the
   symbols it actually references. */
export function beginDoc() {
  used = new Set();
}

/* An instance of an icon. Position is the top-left of the square. */
export function use(name, x, y, size = 20, color = '#15375D', o = {}) {
  if (!ICONS[name]) return '';
  used.add(name);
  return `<use href="#i-${name}" x="${round(x)}" y="${round(y)}" width="${round(size)}"`
    + ` height="${round(size)}" color="${color}"`
    + (o.opacity ? ` opacity="${o.opacity}"` : '')
    + ' />';
}

/* The <symbol> definitions, for the icons recorded since beginDoc(). */
export function spriteUsed(stroke = '#15375D') {
  return sprite([...used].sort(), stroke);
}

/* The <symbol> definitions for a named set, or for everything. */
export function sprite(names = Object.keys(ICONS), stroke = '#15375D') {
  if (!names.length) return '';
  const symbols = names.filter((n) => ICONS[n]).map((n) =>
    `<symbol id="i-${n}" viewBox="0 0 32 32">`
    + `<g fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">`
    + ICONS[n]
    + '</g></symbol>').join('');
  return symbols;
}

/* A standalone sprite element, for a page that holds several drawings. */
export const spriteElement = (names, stroke) =>
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'
  + sprite(names, stroke) + '</svg>';

export const hasIcon = (name) => Boolean(ICONS[name]);
export const iconNames = () => Object.keys(ICONS);
export const usedNames = () => [...used].sort();

function round(n, p = 2) {
  const f = 10 ** p;
  return Math.round(Number(n) * f) / f;
}
