/* Design tokens for the blueprint drawings.
 *
 * Colour carries meaning here. Each family stands for a kind of thing, and a
 * reader learns the six families once rather than reading a legend on every
 * drawing:
 *
 *   blue    the visitor, and anything a customer touches
 *   amber   the edge: hosting, DNS, caching, the things in front
 *   violet  identity, secrets, anything that proves who someone is
 *   teal    data at rest
 *   green   money, and the things that must be exactly right
 *   rose    danger, failure paths, and anything untrusted
 *   slate   neutral, and anything deliberately postponed
 *
 * Each family gives a solid (tabs, icons, arrowheads), an ink (subtitles),
 * a wash and a line (zone panels), and a chip pair.
 *
 * Status is a family too, so a status word is always the same colour
 * wherever it appears: on a card, in a table in the blueprint, in a chip in
 * a progress report. The word is printed on every chip as well as the
 * colour, so a monochrome printout and a colour-blind reader lose nothing.
 */

export const FAMILY = {
  blue: {
    solid: '#1D6FE0', arrow: '#3B82F6', ink: '#2F6CAE', wash: '#EFF6FF', line: '#AFCDF6',
    chipWash: '#E0EDFD', chipInk: '#1B5FBF',
  },
  amber: {
    solid: '#C2680C', arrow: '#E29A12', ink: '#9A6214', wash: '#FFFBEB', line: '#F2D08C',
    chipWash: '#FDF0D5', chipInk: '#8A5207',
  },
  violet: {
    solid: '#7C3AED', arrow: '#8B5CF6', ink: '#6D4CB0', wash: '#FAF5FF', line: '#D2BAF7',
    chipWash: '#F1E7FE', chipInk: '#6025CC',
  },
  teal: {
    solid: '#0D9488', arrow: '#14B8A6', ink: '#157F76', wash: '#ECFDFA', line: '#99E0D8',
    chipWash: '#D8F5F0', chipInk: '#0B7A70',
  },
  green: {
    solid: '#0E9F6E', arrow: '#22C55E', ink: '#19795A', wash: '#F0FDF5', line: '#A2DEC1',
    chipWash: '#DCF5E8', chipInk: '#0A7A54',
  },
  rose: {
    solid: '#DC2F4B', arrow: '#E0455F', ink: '#B23347', wash: '#FEF2F3', line: '#F4B3BC',
    chipWash: '#FCE4E7', chipInk: '#B21E38',
  },
  slate: {
    solid: '#64748B', arrow: '#94A3B8', ink: '#5A6675', wash: '#F8FAFC', line: '#D5DCE4',
    chipWash: '#EEF1F5', chipInk: '#505C6B',
  },
  /* Crystalina's own navy, for the brand and for lifelines. Not a meaning,
     a voice. */
  navy: {
    solid: '#15375D', arrow: '#475569', ink: '#36485C', wash: '#F3F7FB', line: '#BFD2E4',
    chipWash: '#E4EDF6', chipInk: '#15375D',
  },
};

/* The five words, each permanently bound to one family. */
export const STATUS_FAMILY = {
  Implemented: 'green',
  Partial: 'amber',
  Missing: 'rose',
  Refactor: 'violet',
  'Post-MVP': 'slate',
};

/* Extra chip words that are not a build state. "By design" says a thing is
   the way it is on purpose, which is different from being finished. */
export const CHIP_FAMILY = {
  ...STATUS_FAMILY,
  'By design': 'teal',
  Secret: 'violet',
  Public: 'slate',
  Held: 'green',
  Critical: 'rose',
  High: 'amber',
  Medium: 'blue',
  Low: 'slate',
};

export const familyOf = (name) => FAMILY[name] || FAMILY.slate;
export const statusFamily = (status) => familyOf(CHIP_FAMILY[status] || 'slate');

/* Dashed outlines read as "not there yet" without relying on colour. */
export const STATUS_DASH = {
  Missing: '4 3',
  'Post-MVP': '2 3',
};

/* Type. Montserrat for everything that is read, and a Canela-like display
   serif for titles. Canela is licensed; Playfair Display is the closest
   freely available face with the weights this needs. Swap the one token
   below to move to the real thing. */
export const TYPE = {
  sans: "'Montserrat','Segoe UI',system-ui,sans-serif",
  display: "'Playfair Display','Canela',Georgia,serif",
  mono: "'JetBrains Mono',ui-monospace,Consolas,monospace",
  googleHref: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
};

/* Montserrat is a wide face. These factors are biased high on purpose: an
   overestimate wraps a line early, an underestimate overflows a card. */
export const WIDTH_FACTOR = {
  sans: { normal: 0.585, bold: 0.605 },
  display: { normal: 0.505, bold: 0.525 },
};

export const INK = {
  title: '#0F172A',
  body: '#334155',
  mute: '#64748B',
  faint: '#94A3B8',
  rule: '#E2E8F0',
  ruleStrong: '#CBD5E1',
  paper: '#FFFFFF',
  card: '#FFFFFF',
};
