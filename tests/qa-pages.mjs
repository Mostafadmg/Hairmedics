/**
 * Browser QA for the built site — run with the dev server up:
 *   npm run build && npm run serve     (in one terminal)
 *   node tests/qa-pages.mjs [--shots dir]
 *
 * For every page in sitemap.xml, at desktop, tablet and mobile sizes, it
 * checks for: horizontal scrolling, console errors, failed requests, broken
 * images, missing <h1>, and tap targets smaller than 24px.
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright';

const ORIGIN = process.env.ORIGIN || 'http://localhost:4173';
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  tablet: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
let paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(m => m[1]);
paths.push('/basket/', '/checkout/', '/404.html');
if (only) paths = paths.filter(p => only.some(o => p.includes(o)));

const browser = await chromium.launch();
const problems = [];
let checked = 0;

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext(vp);
  for (const p of paths) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => errors.push(`request failed: ${r.url()}`));
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('404.html') && p !== '/404.html') errors.push(`${r.status()} ${r.url()}`); });

    await page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
    const result = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth > vw + 1;
      const offenders = overflow ? [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > vw + 1 && !el.closest('.chips, .gallery__thumbs, .table-wrap, .brand__nav, .prose table, dialog')).slice(0, 3).map(el => `${el.tagName}.${el.className}`) : [];
      const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
      const h1 = document.querySelectorAll('h1').length;
      const small = [...document.querySelectorAll('main a, main button, main input, main select, header a, header button')].filter(el => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden], .prose, .breadcrumbs, p, label, li.review-card')) return false;
        if (el.type === 'radio' || el.type === 'checkbox') return false;
        return r.height < 24 || r.width < 24;
      }).map(el => (el.textContent || el.getAttribute('aria-label') || el.name || el.tagName).trim().slice(0, 30));
      return { overflow, offenders, broken, h1, small };
    });

    if (result.overflow && result.offenders.length) problems.push(`${vpName} ${p}: horizontal overflow ${result.offenders.join(', ')}`);
    if (result.broken.length) problems.push(`${vpName} ${p}: broken images ${result.broken.join(', ')}`);
    if (result.h1 !== 1) problems.push(`${vpName} ${p}: ${result.h1} <h1> elements`);
    if (result.small.length) problems.push(`${vpName} ${p}: small tap targets ${result.small.slice(0, 5).join(' | ')}`);
    if (errors.length) problems.push(`${vpName} ${p}: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);

    if (shotsDir) {
      fs.mkdirSync(shotsDir, { recursive: true });
      // Scroll through the page so lazy-loaded images are fetched.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50)); }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForTimeout(300);
      const name = (p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home') + `__${vpName}.jpg`;
      await page.screenshot({ path: path.join(shotsDir, name), fullPage: true, type: 'jpeg', quality: 70 });
    }
    checked++;
    await page.close();
  }
  await context.close();
}
await browser.close();

console.log(`Checked ${checked} page views (${paths.length} pages × ${Object.keys(VIEWPORTS).length} viewports).`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach(p => console.log(' -', p));
  process.exitCode = 1;
} else {
  console.log('No problems found.');
}
