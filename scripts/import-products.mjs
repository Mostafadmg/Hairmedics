/**
 * Product importer: WooCommerce Store API  ->  src/data/products.json
 *
 * Why a script instead of typing products by hand?
 *  - The live shop is the source of truth for prices and stock. Re-running
 *    this script re-syncs everything in seconds, with no copy/paste mistakes.
 *  - All the "clean-up rules" (fixing names, choosing which products need a
 *    medical assessment) live in ONE place, so they are applied every time.
 *
 * Usage:
 *   node scripts/import-products.mjs                 # fetch from the live API
 *   node scripts/import-products.mjs --cache <dir>   # use a saved API dump
 *        (<dir>/products.json and <dir>/var/<variationId>.json)
 *
 * Manual tweaks that should survive a re-import go in
 * src/data/product-overrides.json  (keyed by product id).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import TurndownService from 'turndown';

const API = 'https://hairmedicsuk.shop/wp-json/wc/store/v1';
const OUT_JSON = path.resolve('src/data/products.json');
const OVERRIDES = path.resolve('src/data/product-overrides.json');
const IMG_DIR = path.resolve('src/assets/img/products');
const IMG_CACHE = path.resolve('.cache/images');
const IMAGE_WIDTHS = [480, 960];

const args = process.argv.slice(2);
const cacheDir = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : null;

// ---------------------------------------------------------------------------
// Fetching (with polite retries — the host rate-limits bursts of requests)
// ---------------------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'hairmedics-importer' } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error(`${res.status} for ${url}`);
  }
  throw new Error(`Gave up on ${url}`);
}

async function getBuffer(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'hairmedics-importer' } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error(`Gave up on ${url}`);
}

async function loadRaw() {
  if (cacheDir) {
    const products = JSON.parse(fs.readFileSync(path.join(cacheDir, 'products.json'), 'utf8'));
    const variation = id => JSON.parse(fs.readFileSync(path.join(cacheDir, 'var', `${id}.json`), 'utf8'));
    return { products, variation: async id => variation(id) };
  }
  const products = await getJson(`${API}/products?per_page=100`);
  return { products, variation: async id => { await sleep(400); return getJson(`${API}/products/${id}`); } };
}

// ---------------------------------------------------------------------------
// Clean-up rules
// ---------------------------------------------------------------------------
const decodeEntities = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/** Names on the old shop mix "minoxidil"/"Minoxidil", "Pg"/"PG", double spaces… */
function cleanName(raw) {
  return decodeEntities(raw)
    .replace(/\s+/g, ' ')
    .replace(/^(\d+(\.\d+)?%) minoxidil/i, '$1 Minoxidil')
    .replace(/\bminoxdil\b/gi, 'Minoxidil')
    .replace(/\bPg\b/g, 'PG')
    .replace(/\s+\|\s+/g, ' · ')
    .replace(/\s+([,)])/g, '$1')
    .trim();
}

/** Who makes it — shown above the product name, like a pharmacy shelf label. */
function brandFor(name, cats) {
  if (/^roseway/i.test(name) || cats.includes('roseway-labs')) return 'Roseway Labs';
  if (/nizoral/i.test(name)) return 'Nizoral';
  if (/loniten/i.test(name)) return 'Loniten';
  if (/minocream/i.test(name)) return 'Minocream';
  if (/tricho-gen/i.test(name)) return 'Tricho-Gen+';
  if (/hair-ceuticals/i.test(name)) return 'Hair-Ceuticals';
  if (/i-helmet/i.test(name)) return 'iHelmet';
  if (/trichosol/i.test(name)) return 'Trichosol';
  return 'Hair Medics UK';
}

/** Categories where the shop's own copy says a medical survey is required. */
const ASSESSMENT_CATEGORIES = ['minoxidil', 'finasteride', 'dutesteride', 'spironolactone', 'roseway-labs'];
const SERVICE_CATEGORIES = ['hair-transplant-deposit'];

const ATTRIBUTE_NAMES = {
  'pack size': 'Pack size', 'no. of bottles': 'Pack size', 'bottles': 'Pack size',
  'amount of bottles': 'Pack size', 'bottle amount': 'Pack size', 'quantity': 'Pack size',
};
const cleanAttrName = n => ATTRIBUTE_NAMES[n.trim().toLowerCase()] || n.trim().replace(/^\w/, c => c.toUpperCase());
const cleanAttrValue = v => decodeEntities(v).trim().replace(/\b(Bottles?|Rollers?|Pack)\b/g, m => m.toLowerCase()).replace(/^pack/, 'Pack');

const pounds = minor => Math.round(Number(minor)) / 100;

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
turndown.remove(['script', 'style', 'img', 'iframe', 'figure']);
// Old shop links -> new relative links, so they keep working on any domain.
turndown.addRule('internalLinks', {
  filter: node => node.nodeName === 'A' && /hairmedicsuk\.(shop|com)/.test(node.getAttribute('href') || ''),
  replacement: (content, node) => `[${content}](${new URL(node.getAttribute('href')).pathname})`,
});

function toMarkdown(html) {
  if (!html) return '';
  return turndown.turndown(decodeEntities(html))
    .replace(/ /g, ' ')
    .replace(/^#{1,2} /gm, '### ')       // product pages own the h1/h2 levels
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const plain = md => md.replace(/[#*_>`[\]]|\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// Images: download once, cache, and create responsive WebP versions
// ---------------------------------------------------------------------------
async function processImage(src, base) {
  fs.mkdirSync(IMG_CACHE, { recursive: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const cached = path.join(IMG_CACHE, path.basename(new URL(src).pathname));
  if (!fs.existsSync(cached)) { fs.writeFileSync(cached, await getBuffer(src)); await sleep(300); }
  for (const w of IMAGE_WIDTHS) {
    const out = path.join(IMG_DIR, `${base}-${w}.webp`);
    if (fs.existsSync(out)) continue;
    await sharp(cached).resize({ width: w, height: w, fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' }).webp({ quality: 80 }).toFile(out);
  }
  return base;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
  const { products: raw, variation } = await loadRaw();
  const result = [];

  for (const p of raw) {
    const o = overrides[p.id] || {};
    const categories = p.categories.map(c => c.slug);
    const name = o.name || cleanName(p.name);

    // Variants: price comes from each variation record.
    const variants = [];
    for (const v of p.variations) {
      const data = await variation(v.id);
      variants.push({
        id: v.id,
        options: Object.fromEntries(v.attributes.map(a => [cleanAttrName(a.name), cleanAttrValue(a.value)])),
        price: pounds(data.prices.price),
        regularPrice: pounds(data.prices.regular_price),
        inStock: data.is_in_stock,
      });
    }
    // Options are derived from variants that really exist (the old shop
    // advertised some options that could never be bought).
    const optionNames = [...new Set(variants.flatMap(v => Object.keys(v.options)))];
    const byLeadingNumber = (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0);
    const options = optionNames.map(n => ({ name: n, values: [...new Set(variants.map(v => v.options[n]))].sort(byLeadingNumber) }));

    const prices = variants.length ? variants.map(v => v.price) : [pounds(p.prices.price)];
    const regular = variants.length ? Math.max(...variants.map(v => v.regularPrice)) : pounds(p.prices.regular_price);

    const images = [];
    for (const [i, img] of p.images.entries()) {
      images.push({ base: await processImage(img.src, `${p.slug}-${i + 1}`), alt: i === 0 ? name : `${name} — image ${i + 1}` });
    }

    const description = toMarkdown(p.description);
    const summary = plain(toMarkdown(p.short_description)) || plain(description).split('. ').slice(0, 2).join('. ');

    const price = { from: Math.min(...prices), to: Math.max(...prices) };
    if (p.on_sale && regular > price.to) price.regular = regular;

    const purchasable = p.is_purchasable && price.from > 0;

    result.push({
      id: p.id,
      slug: p.slug,
      name,
      brand: o.brand || brandFor(name, categories),
      categories,
      type: categories.some(c => SERVICE_CATEGORIES.includes(c)) ? 'service' : 'product',
      summary: o.summary || summary,
      description,
      images,
      price,
      options,
      variants,
      inStock: p.is_in_stock,
      purchasable,
      bestseller: p.tags.some(t => /best ?seller/i.test(t.name)),
      assessment: o.assessment ?? categories.some(c => ASSESSMENT_CATEGORIES.includes(c)),
      ...(o.extra || {}),
    });
    process.stdout.write('.');
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2) + '\n');
  console.log(`\nWrote ${result.length} products to ${path.relative(process.cwd(), OUT_JSON)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
