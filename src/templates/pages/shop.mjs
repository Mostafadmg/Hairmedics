import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { productCard, breadcrumbs, pageHero, assessmentNotice, contactBand } from '../components/ui.mjs';

/**
 * One template renders both /shop/ and every /product-category/<slug>/ page.
 *
 * All products are in the HTML (good for SEO and works without JavaScript).
 * shop-filters.js then adds instant search, category chips and sorting.
 */
export function shopPage(ctx, category = null) {
  const products = category ? ctx.products.filter(p => p.categories.includes(category.slug)) : ctx.products;
  const path = category ? `/product-category/${category.slug}/` : '/shop/';
  const needsAssessment = category && products.some(p => p.assessment);

  const trail = [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop/' }];
  if (category) trail.push({ label: category.name, href: path });

  const chips = [{ slug: 'all', name: 'All' }, ...ctx.categories.filter(c => ctx.products.some(p => p.categories.includes(c.slug)))];

  const body = html`
  ${pageHero({
    eyebrow: category ? category.strap : `${ctx.products.length} products · free UK delivery`,
    title: category ? category.name : 'Shop hair loss treatments',
    intro: category ? category.intro : 'Clinically-led treatments for men and women — from high-strength minoxidil to prescription tonics compounded by a UK registered pharmacy.',
    crumbs: breadcrumbs(ctx, trail),
  })}

  <section class="section section--flush-top">
    <div class="container">
      ${needsAssessment ? html`<div class="shop-notice">${assessmentNotice(ctx)}</div>` : ''}

      <div class="shop-toolbar" data-shop-toolbar>
        <div class="field field--search">
          <label class="visually-hidden" for="shop-search">Search products</label>
          ${icon('search', { size: 18, className: 'field__icon' })}
          <input class="input" type="search" id="shop-search" placeholder="Search ${category ? category.name.toLowerCase() : 'all products'}…" autocomplete="off" data-shop-search>
        </div>
        <div class="field field--inline">
          <label for="shop-sort">Sort by</label>
          <select class="select" id="shop-sort" data-shop-sort>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      ${category ? '' : html`
      <div class="chips" role="group" aria-label="Filter by category" data-shop-chips>
        ${chips.map(c => html`<button class="chip" type="button" data-category="${c.slug}" aria-pressed="${c.slug === 'all' ? 'true' : 'false'}">${c.name}</button>`)}
      </div>`}

      <p class="shop-count" aria-live="polite" data-shop-count>${products.length} products</p>

      <div class="product-grid" data-shop-grid>
        ${products.map(p => productCard(ctx, p, { headingLevel: 2 }))}
      </div>

      <div class="empty-state" data-shop-empty hidden>
        ${icon('search', { size: 32 })}
        <h2>No products match your search</h2>
        <p>Try a different word, or <a href="${ctx.url('/contact/')}">ask our team</a> — we’re happy to help.</p>
      </div>

      ${category ? html`
      <nav class="related-categories" aria-label="Other categories">
        <h2 class="related-categories__title">Browse other categories</h2>
        <ul class="chips" role="list">
          ${ctx.categories.filter(c => c.slug !== category.slug).map(c => html`<li><a class="chip" href="${ctx.url(`/product-category/${c.slug}/`)}">${c.name}</a></li>`)}
        </ul>
      </nav>` : ''}
    </div>
  </section>

  ${contactBand(ctx)}`;

  return {
    title: category ? `${category.name} — ${category.strap}` : 'Shop all hair loss treatments',
    description: category ? category.intro.slice(0, 155) : `Shop ${ctx.products.length} hair loss treatments with free UK delivery: minoxidil, finasteride, dutasteride, spironolactone, derma rollers, laser devices and more.`,
    path,
    body,
    bodyClass: 'page--shop',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ctx.site.url}/product/${p.slug}/`, name: p.name })),
    }],
  };
}
