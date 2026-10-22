const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const siteURL = process.env.SITE_URL || 'https://mostafadmg.github.io/Hairmedics/';
const siteBase = new URL(siteURL).pathname;
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routes = new Map([['', ['Specialist hair care, a personal approach', 'Explore Hair Medics UK hair care, at-home products and specialist treatment options.']], ['shop', ['Shop treatments', 'Explore the complete Hair Medics UK range.']], ['how-it-works', ['Find your starting point', 'A clear, considered approach to your hair care.']], ['brand', ['The Hair Medics UK brand', 'Brand foundations and product photography.']]]);
for (const p of data.products) routes.set('product/' + p.slug, [p.shortName || p.name, p.summary]);
for (const c of data.categories) routes.set('product-category/' + c.slug, [c.name || c.label, 'Explore ' + (c.name || c.label) + ' at Hair Medics UK.']);
for (const p of data.pages) if (p.slug !== 'hair-medics-uk-cosmetics') routes.set(p.slug, [p.title, p.summary]);
routes.set('product-tag/best-seller', ['Customer favourites', 'Explore popular Hair Medics UK products.']);
for (const route of ['search','search-2','shop/page/2','product-category/minoxidil/page/2']) routes.set(route, ['Explore treatments', 'Find your next step in hair care.']);
routes.set('my-account/lost-password', ['Account support', 'Manage your Hair Medics UK account securely.']);
for (const [route, [title, description]] of routes) {
  const dir = route ? route + '/' : '';
  const base = route ? '../'.repeat(route.split('/').length) : './';
  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${base}"><title>${esc(title)} | Hair Medics UK</title><meta name="description" content="${esc((description || '').slice(0, 160))}"><meta name="theme-color" content="#243e35"><meta property="og:title" content="${esc(title)} | Hair Medics UK"><meta property="og:description" content="${esc((description || '').slice(0, 160))}"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head>
<body data-route="${esc(route)}"><a class="skip-link" href="#main">Skip to content</a><div id="site-header"></div><main id="main" tabindex="-1"><div class="loading"><span class="brand">hairmedics<span>UK</span></span><p>Specialist hair care. A personal approach.</p></div></main><div id="site-footer"></div><noscript><div class="noscript">Please enable JavaScript to explore the catalogue, or visit <a href="https://hairmedicsuk.shop/shop/">our secure shop</a>.</div></noscript></body></html>`;
  fs.mkdirSync(dir || '.', {recursive:true}); fs.writeFileSync(path.join(dir, 'index.html'), html);
}
const missingPage=fs.readFileSync('index.html','utf8').replace('<base href="./">','<base href="'+siteBase+'">').replace('data-route=""','data-route="page-not-found"').replace('<title>Specialist hair care, a personal approach | Hair Medics UK</title>','<title>Page not found | Hair Medics UK</title>');
fs.writeFileSync('404.html',missingPage);
fs.writeFileSync('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + [...routes.keys()].map(r => '<url><loc>' + siteURL + r + (r ? '/' : '') + '</loc></url>').join('') + '</urlset>');
console.log(`Built ${routes.size} responsive pages.`);
