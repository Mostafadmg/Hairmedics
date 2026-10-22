/**
 * Static site build: data + templates  ->  dist/
 *
 *   npm run build            one-off production build
 *   npm run dev              build, watch src/ for changes, serve on :4173
 *   BASE=/Hairmedics/ npm run build   build for a sub-folder (GitHub Pages)
 *
 * The flow (read it top to bottom — it's the whole "framework"):
 *   1. load data (JSON + Markdown)      — the single source of truth
 *   2. derive helpers (ctx)             — url(), asset(), lookups
 *   3. compile styles, copy assets      — SCSS -> CSS, fonts, images, JS
 *   4. render every page to HTML        — pure functions in src/templates
 *   5. write sitemap, robots, redirects — SEO housekeeping
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import * as sass from 'sass';
import sharp from 'sharp';
import { Marked } from 'marked';

import { layout } from '../src/templates/components/layout.mjs';
import { homePage } from '../src/templates/pages/home.mjs';
import { shopPage } from '../src/templates/pages/shop.mjs';
import { productPage } from '../src/templates/pages/product.mjs';
import { aboutPage, contactPage, reviewsPage, legalPage, notFoundPage, redirectPage } from '../src/templates/pages/content.mjs';
import { assessmentPage, basketPage, checkoutPage } from '../src/templates/pages/commerce.mjs';
import { brandPage } from '../src/templates/pages/brand.mjs';
import { slugify } from '../src/templates/lib/format.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
const WATCH = process.argv.includes('--watch');
// PREVIEW=1 marks every page noindex — for staging copies (e.g. GitHub Pages)
// so search engines never index them alongside the real shop.
const PREVIEW = process.env.PREVIEW === '1';
const PORT = Number(process.env.PORT || 4173);

const readJson = file => JSON.parse(fs.readFileSync(path.join(SRC, 'data', file), 'utf8'));

// ---------------------------------------------------------------------------
// 1. Data
// ---------------------------------------------------------------------------
function parseFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { attrs: {}, body: text };
  const attrs = Object.fromEntries(match[1].split('\n').map(line => {
    const i = line.indexOf(':');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }));
  return { attrs, body: text.slice(match[0].length) };
}

function loadData() {
  const site = readJson('site.json');
  const categories = readJson('categories.json');
  const reviews = readJson('reviews.json');
  const assessment = readJson('assessment.json');
  const tokens = readJson('tokens.json');

  // Map the old misspelt category slug to the corrected one.
  const legacy = Object.fromEntries(categories.filter(c => c.legacySlug).map(c => [c.legacySlug, c.slug]));
  const categoryOrder = categories.map(c => c.slug);

  const products = readJson('products.json').map((p, index) => {
    const cats = [...new Set(p.categories.map(c => legacy[c] || c))];
    // Primary category drives breadcrumbs: compounded tonics live under
    // "Prescription hair tonics", everything else under its first category.
    const primary = cats.includes('roseway-labs')
      ? 'roseway-labs'
      : [...cats].sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))[0];
    return { ...p, categories: cats, primaryCategory: primary, order: index };
  });

  // Merchandising order for "Featured": bestsellers, then purchasable, then the rest.
  const rank = p => (p.bestseller ? 0 : 1) + (p.purchasable ? 0 : 2) + (p.type === 'service' ? 1 : 0);
  products.sort((a, b) => rank(a) - rank(b) || a.order - b.order).forEach((p, i) => { p.order = i; });

  const legal = fs.readdirSync(path.join(SRC, 'content/legal')).filter(f => f.endsWith('.md')).map(file => {
    const { attrs, body } = parseFrontMatter(fs.readFileSync(path.join(SRC, 'content/legal', file), 'utf8'));
    return { slug: file.replace(/\.md$/, ''), title: attrs.title, updated: attrs.updated, body };
  });

  return { site, categories, reviews, assessment, tokens, products, legal, legacy };
}

// ---------------------------------------------------------------------------
// 2. Context — everything a template may need, passed explicitly
// ---------------------------------------------------------------------------
function rewriteRootLinks(htmlString) {
  // Markdown links like (/privacy-policy/) must respect BASE on GitHub Pages.
  return BASE === '/' ? htmlString : htmlString.replace(/href="\/(?!\/)/g, `href="${BASE}`);
}

function createContext(data, version) {
  const url = p => BASE + p.replace(/^\//, '');
  const categoryMap = new Map(data.categories.map(c => [c.slug, c]));

  const markdownWithToc = md => {
    const toc = [];
    const used = new Set();
    const marked = new Marked({
      gfm: true,
      renderer: {
        heading({ tokens, depth }) {
          const inner = this.parser.parseInline(tokens);
          const text = inner.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
          let id = slugify(text) || 'section';
          while (used.has(id)) id += '-x';
          used.add(id);
          if (depth === 2) toc.push({ id, text });
          return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
        },
      },
    });
    return { html: rewriteRootLinks(marked.parse(md)), toc };
  };

  return {
    ...data,
    version,
    preview: PREVIEW,
    url,
    asset: p => url(`/assets/${p}`),
    readAsset: p => fs.readFileSync(path.join(SRC, 'assets', p), 'utf8'),
    categoryBySlug: slug => categoryMap.get(slug),
    markdown: md => markdownWithToc(md).html,
    markdownWithToc,
    organizationJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: data.site.name,
      url: data.site.url,
      logo: `${data.site.url}/assets/brand/logo-stacked.svg`,
      telephone: '+44 20 3441 3026',
      email: data.site.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.site.address.lines.slice(0, 2).join(', '),
        addressLocality: data.site.address.lines[2],
        addressRegion: data.site.address.lines[3],
        postalCode: data.site.address.postcode,
        addressCountry: 'GB',
      },
      sameAs: data.site.social.filter(s => s.icon !== 'pin').map(s => s.url),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: data.site.rating.value, reviewCount: data.site.rating.count },
    },
  };
}

// ---------------------------------------------------------------------------
// 3. Styles & assets
// ---------------------------------------------------------------------------
function writeTokensScss(tokens) {
  const lines = tokens.colors.map(c => `  --color-${c.token}: ${c.value}; // ${c.name}`);
  const out = `// GENERATED by scripts/build.mjs from src/data/tokens.json — do not edit by hand.\n:root {\n${lines.join('\n')}\n}\n`;
  const file = path.join(SRC, 'scss/abstracts/_tokens.scss');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
}

function compileStyles() {
  const result = sass.compile(path.join(SRC, 'scss/main.scss'), { style: 'compressed', sourceMap: false });
  // url() paths in SCSS are written relative to /assets/css/
  fs.mkdirSync(path.join(DIST, 'assets/css'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'assets/css/main.css'), result.css);
  return result.css;
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const FONTS = [
  '@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2',
  '@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2',
  '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
];

async function copyAssets() {
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  copyDir(path.join(SRC, 'js'), path.join(DIST, 'assets/js'));
  fs.mkdirSync(path.join(DIST, 'assets/fonts'), { recursive: true });
  for (const f of FONTS) fs.copyFileSync(path.join(ROOT, 'node_modules', f), path.join(DIST, 'assets/fonts', path.basename(f)));

  // Raster icons + social share image, generated from the vector logo.
  const brand = path.join(DIST, 'assets/brand');
  const mark = fs.readFileSync(path.join(SRC, 'assets/brand/logo-mark.svg'));
  await sharp(mark, { density: 600 }).resize(32, 32).png().toFile(path.join(brand, 'favicon-32.png'));
  await sharp(mark, { density: 600 }).resize(180, 180).png().toFile(path.join(brand, 'apple-touch-icon.png'));
  const stacked = await sharp(fs.readFileSync(path.join(SRC, 'assets/brand/logo-stacked.svg')), { density: 400 }).resize({ height: 300 }).png().toBuffer();
  const meta = await sharp(stacked).metadata();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#FBF8F3' } })
    .composite([
      { input: Buffer.from('<svg width="1200" height="630"><circle cx="1080" cy="640" r="300" fill="#DCEEEA"/><circle cx="110" cy="-40" r="190" fill="#F7E7DD"/></svg>'), top: 0, left: 0 },
      { input: stacked, top: Math.round((630 - meta.height) / 2), left: Math.round((1200 - meta.width) / 2) },
    ])
    .png().toFile(path.join(brand, 'og-image.png'));
}

// ---------------------------------------------------------------------------
// 4. Pages
// ---------------------------------------------------------------------------
function writePage(urlPath, html) {
  const file = urlPath.endsWith('.html') ? path.join(DIST, urlPath) : path.join(DIST, urlPath, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function renderAll(ctx) {
  const pages = [
    homePage(ctx),
    shopPage(ctx),
    ...ctx.categories.filter(c => ctx.products.some(p => p.categories.includes(c.slug))).map(c => shopPage(ctx, c)),
    ...ctx.products.map(p => productPage(ctx, p)),
    aboutPage(ctx),
    contactPage(ctx),
    reviewsPage(ctx),
    assessmentPage(ctx),
    basketPage(ctx),
    checkoutPage(ctx),
    brandPage(ctx),
    ...ctx.legal.map(doc => legalPage(ctx, doc)),
    notFoundPage(ctx),
  ];
  for (const page of pages) writePage(page.path, layout(ctx, page));

  // Old WordPress URLs that changed — keep them working.
  const redirects = {
    '/cookie-policy/': '/cookie-policy-uk/',
    '/search/': '/shop/',
    '/search-2/': '/shop/',
    '/my-account/': '/contact/',
    '/product-tag/best-seller/': '/shop/',
    ...Object.fromEntries(Object.entries(ctx.legacy).map(([from, to]) => [`/product-category/${from}/`, `/product-category/${to}/`])),
  };
  for (const [from, to] of Object.entries(redirects)) writePage(from, redirectPage(ctx, to));

  return pages;
}

// ---------------------------------------------------------------------------
// 5. SEO housekeeping
// ---------------------------------------------------------------------------
function writeSeoFiles(ctx, pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter(p => !p.noindex).map(p => `  <url><loc>${ctx.site.url}${p.path}</loc><lastmod>${today}</lastmod></url>`);
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  const rules = PREVIEW ? 'Disallow: /' : 'Disallow: /basket/\nDisallow: /checkout/';
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\n${rules}\n\nSitemap: ${ctx.site.url}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), ''); // let GitHub Pages serve folders as-is
}

// ---------------------------------------------------------------------------
async function build() {
  const started = Date.now();
  const data = loadData();
  writeTokensScss(data.tokens);
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const css = compileStyles();
  const version = crypto.createHash('md5').update(css + fs.readdirSync(path.join(SRC, 'js'), { recursive: true }).join()).digest('hex').slice(0, 8);
  await copyAssets();
  const ctx = createContext(data, version);
  const pages = renderAll(ctx);
  writeSeoFiles(ctx, pages);
  console.log(`Built ${pages.length} pages (+ redirects) into dist/ in ${Date.now() - started}ms  [base ${BASE}${PREVIEW ? ', preview/noindex' : ''}]`);
}

// ---------------------------------------------------------------------------
// Dev mode: rebuild in a fresh process on change (so template edits are
// always picked up), and serve dist/ with a tiny static server.
// ---------------------------------------------------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

function serve() {
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (BASE !== '/' && p.startsWith(BASE)) p = '/' + p.slice(BASE.length);
    let file = path.join(DIST, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404, { 'content-type': MIME['.html'] }); return res.end(fs.readFileSync(path.join(DIST, '404.html'))); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}`));
}

if (WATCH) {
  let timer;
  let running = false;
  const rebuild = () => {
    if (running) return;
    running = true;
    spawn(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit', env: process.env })
      .on('exit', () => { running = false; });
  };
  rebuild();
  fs.watch(SRC, { recursive: true }, (_, file) => {
    if (file && file.endsWith('_tokens.scss')) return; // written by the build itself
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
  serve();
} else {
  build().catch(err => { console.error(err); process.exit(1); });
}
