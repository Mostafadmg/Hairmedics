/**
 * Generates the Hair Medics UK logo files as outlined SVG paths.
 *
 * Why outline the text? A logo must look identical everywhere — in an email,
 * on a printer, in a browser without our web fonts. Converting the letters
 * to vector paths removes the dependency on the font being installed.
 *
 * Run: npm run logo   (writes to src/assets/brand/)
 */
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const OUT = path.resolve('src/assets/brand');
const FONT_DIR = path.resolve('node_modules/@fontsource');

const loadFont = file => {
  const buf = fs.readFileSync(path.join(FONT_DIR, file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

const serif = loadFont('fraunces/files/fraunces-latin-600-normal.woff');
const sans = loadFont('manrope/files/manrope-latin-700-normal.woff');

const COLORS = {
  ink: '#0B2230',
  teal: '#14605B',
  copper: '#B4643C',
  sand: '#FBF8F3',
  white: '#FFFFFF',
};

/**
 * The mark: three hair strands rising from a scalp line, each taller than
 * the last. It reads as "hair" and as "growth over time" — the promise of
 * the brand — and still works at 16px as a favicon.
 */
function markShapes({ bg = COLORS.teal, fg = COLORS.sand } = {}) {
  return `
    <rect width="48" height="48" rx="13" fill="${bg}"/>
    <g fill="none" stroke="${fg}" stroke-linecap="round" stroke-width="3.4">
      <path d="M14.6 35.5c0-4.6 1.9-7.6 1.1-12.4"/>
      <path d="M23.1 35.5c0-6.9 2.6-11 1.2-18.6"/>
      <path d="M31.6 35.5c0-9.2 3.4-14.6 1.3-24.4"/>
    </g>
    <path d="M11 37.5h26" stroke="${fg}" stroke-linecap="round" stroke-width="2.6" opacity=".55"/>`;
}

function textPath(font, text, x, y, size, letterSpacing = 0) {
  // opentype has no letter-spacing option, so place glyphs one by one.
  let cursor = x;
  const parts = [];
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(cursor, y, size).toPathData(2));
    let adv = g.advanceWidth * scale;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale;
    cursor += adv + letterSpacing;
  });
  return { d: parts.join(''), width: cursor - x - letterSpacing };
}

function svg(width, height, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${height}" width="${Math.round(width)}" height="${height}" role="img" aria-labelledby="t">
  <title id="t">${title}</title>${body}
</svg>
`;
}

function horizontal({ text = COLORS.ink, accent = COLORS.copper, markBg = COLORS.teal, markFg = COLORS.sand } = {}) {
  const word = textPath(serif, 'Hair Medics', 60, 33, 30, -0.3);
  const uk = textPath(sans, 'UK', 60 + word.width + 8, 33, 13, 1.6);
  const width = 60 + word.width + 8 + uk.width + 2;
  return svg(width, 48, `
  <g>${markShapes({ bg: markBg, fg: markFg })}</g>
  <path fill="${text}" d="${word.d}"/>
  <path fill="${accent}" d="${uk.d}"/>`, 'Hair Medics UK');
}

function stacked({ text = COLORS.ink, accent = COLORS.copper } = {}) {
  const word = textPath(serif, 'Hair Medics', 0, 0, 34, -0.3);
  const uk = textPath(sans, 'UNITED KINGDOM', 0, 0, 10, 3.2);
  const W = Math.max(word.width, uk.width) + 8;
  const w = textPath(serif, 'Hair Medics', (W - word.width) / 2, 108, 34, -0.3);
  const u = textPath(sans, 'UNITED KINGDOM', (W - uk.width) / 2, 130, 10, 3.2);
  return svg(W, 136, `
  <g transform="translate(${(W - 64) / 2} 0) scale(1.3333)">${markShapes()}</g>
  <path fill="${text}" d="${w.d}"/>
  <path fill="${accent}" d="${u.d}"/>`, 'Hair Medics UK');
}

const files = {
  'logo-mark.svg': svg(48, 48, markShapes(), 'Hair Medics UK'),
  'logo-mark-reversed.svg': svg(48, 48, markShapes({ bg: COLORS.sand, fg: COLORS.teal }), 'Hair Medics UK'),
  'logo.svg': horizontal(),
  'logo-reversed.svg': horizontal({ text: COLORS.white, accent: '#E3A47F', markBg: COLORS.sand, markFg: COLORS.teal }),
  'logo-stacked.svg': stacked(),
  'favicon.svg': svg(48, 48, markShapes(), 'Hair Medics UK'),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log('wrote', path.join('src/assets/brand', name));
}
