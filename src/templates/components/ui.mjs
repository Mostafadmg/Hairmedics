/**
 * Small, reusable UI components.
 *
 * Each component is a pure function: data in -> HTML out. No component reads
 * global state, so any of them can be rendered anywhere (and tested alone).
 */
import { html, cx } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { priceLabel, money } from '../lib/format.mjs';

/** Responsive product image. Every product image exists at 480w and 960w. */
export function productImage(ctx, image, { sizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw', eager = false, className = '' } = {}) {
  if (!image) return html`<div class="${cx('product-image product-image--empty', className)}">${icon('package', { size: 40 })}</div>`;
  const src = w => ctx.asset(`img/products/${image.base}-${w}.webp`);
  return html`<img class="${className}" src="${src(480)}" srcset="${src(480)} 480w, ${src(960)} 960w" sizes="${sizes}"
    width="960" height="960" alt="${image.alt}" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">`;
}

export function lifestyleImage(ctx, name, { alt = '', sizes = '50vw', eager = false, className = '', width = 1200, height = 1324 } = {}) {
  const src = w => ctx.asset(`img/lifestyle/${name}-${w}.webp`);
  return html`<img class="${className}" src="${src(640)}" srcset="${src(640)} 640w, ${src(1200)} 1200w" sizes="${sizes}"
    width="${width}" height="${height}" alt="${alt}" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">`;
}

export function badge(text, tone = 'neutral', iconName) {
  return html`<span class="badge badge--${tone}">${iconName ? icon(iconName, { size: 14 }) : ''}${text}</span>`;
}

export function productBadges(product) {
  const out = [];
  if (product.price.regular) out.push(badge('Sale', 'copper'));
  if (product.bestseller) out.push(badge('Bestseller', 'ink'));
  if (!product.inStock || !product.purchasable) out.push(badge('Unavailable', 'neutral'));
  return out;
}

/** The card used in every product grid. The whole card is one link. */
export function productCard(ctx, product, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const category = ctx.categoryBySlug(product.primaryCategory);
  return html`
  <article class="product-card" data-product-card
    data-name="${product.name.toLowerCase()} ${product.brand.toLowerCase()}"
    data-categories="${product.categories.join(' ')}"
    data-price="${product.price.from}" data-order="${product.order}">
    <a class="product-card__link" href="${ctx.url(`/product/${product.slug}/`)}">
      <div class="product-card__media">
        ${productImage(ctx, product.images[0])}
        <div class="product-card__badges">${productBadges(product)}</div>
      </div>
      <div class="product-card__body">
        <p class="product-card__eyebrow">${product.brand}${category ? html` <span aria-hidden="true">·</span> ${category.name}` : ''}</p>
        ${html([`<${h} class="product-card__title">`, `</${h}>`], product.name)}
        <div class="product-card__footer">
          <p class="price">${product.purchasable ? priceLabel(product.price) : 'Price on request'}
            ${product.price.regular ? html`<s class="price__was">${money(product.price.regular)}</s>` : ''}</p>
          ${product.assessment ? html`<span class="product-card__rx" title="Medical assessment required">${icon('stethoscope', { size: 16 })}<span>Assessment</span></span>` : ''}
        </div>
      </div>
    </a>
  </article>`;
}

export function breadcrumbs(ctx, trail) {
  return html`
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      ${trail.map((item, i) => html`<li>${i === trail.length - 1
        ? html`<span aria-current="page">${item.label}</span>`
        : html`<a href="${ctx.url(item.href)}">${item.label}</a>${icon('chevron-right', { size: 14 })}`}</li>`)}
    </ol>
  </nav>`;
}

export function stars(value, size = 16) {
  const full = Math.round(value);
  return html`<span class="stars" role="img" aria-label="Rated ${value} out of 5">${
    Array.from({ length: 5 }, (_, i) => html`<svg class="${cx('star', i < full && 'star--on')}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z"/></svg>`)
  }</span>`;
}

export function ratingSummary(ctx, { compact = false } = {}) {
  const { rating } = ctx.site;
  return html`
  <a class="${cx('rating', compact && 'rating--compact')}" href="${ctx.url('/google-reviews/')}">
    <span class="rating__score">${rating.value.toFixed(1)}</span>
    ${stars(rating.value)}
    <span class="rating__count">${rating.count} ${rating.source} reviews</span>
  </a>`;
}

export function sectionHeader({ eyebrow, title, intro, align = 'left', id, action }) {
  return html`
  <header class="${cx('section-header', `section-header--${align}`)}">
    <div>
      ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
      <h2 class="section-header__title" ${id ? html`id="${id}"` : ''}>${title}</h2>
      ${intro ? html`<p class="section-header__intro">${intro}</p>` : ''}
    </div>
    ${action || ''}
  </header>`;
}

/** Shown on every product that needs a prescriber-reviewed questionnaire. */
export function assessmentNotice(ctx, { compact = false } = {}) {
  return html`
  <aside class="${cx('notice notice--info', compact && 'notice--compact')}">
    ${icon('stethoscope', { size: 22, className: 'notice__icon' })}
    <div>
      <p class="notice__title">Medical assessment required</p>
      <p>Before we can dispatch this treatment you’ll complete a short medical questionnaire (5–10 minutes), reviewed by our prescribing doctor. You won’t need to repeat it for repeat orders.</p>
      ${compact ? '' : html`<a class="link-arrow" href="${ctx.url('/medical-assessment/')}">Start your assessment ${icon('arrow-right', { size: 16 })}</a>`}
    </div>
  </aside>`;
}

export function promiseStrip(ctx, { variant = 'light' } = {}) {
  return html`
  <ul class="${cx('promises', `promises--${variant}`)}" role="list">
    ${ctx.site.promises.map(p => html`
      <li class="promise">
        <span class="promise__icon">${icon(p.icon, { size: 22 })}</span>
        <span><strong>${p.title}</strong><span>${p.text}</span></span>
      </li>`)}
  </ul>`;
}

export function categoryTile(ctx, category, count) {
  return html`
  <a class="category-tile" href="${ctx.url(`/product-category/${category.slug}/`)}">
    <span class="category-tile__icon">${icon(category.icon, { size: 24 })}</span>
    <span class="category-tile__text">
      <span class="category-tile__name">${category.name}</span>
      <span class="category-tile__strap">${category.strap}</span>
    </span>
    <span class="category-tile__count">${count}</span>
  </a>`;
}

export function contactBand(ctx) {
  const { site } = ctx;
  return html`
  <section class="contact-band" aria-labelledby="contact-band-title">
    <div class="container contact-band__inner">
      <div>
        <p class="eyebrow eyebrow--light">Talk to our team</p>
        <h2 id="contact-band-title" class="contact-band__title">Not sure which treatment is right for you?</h2>
        <p>Our medically qualified team can talk you through your options — from home-use treatments to hair transplant consultations.</p>
      </div>
      <div class="contact-band__actions">
        <a class="btn btn--light btn--lg" href="${site.phone.href}">${icon('phone', { size: 18 })} ${site.phone.display}</a>
        <a class="btn btn--outline-light btn--lg" href="${ctx.url('/contact/')}">${icon('mail', { size: 18 })} Send us a message</a>
      </div>
    </div>
  </section>`;
}

export function pageHero({ eyebrow, title, intro, crumbs, children, tone = 'sand' }) {
  return html`
  <section class="${cx('page-hero', `page-hero--${tone}`)}">
    <div class="container">
      ${crumbs || ''}
      ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1 class="page-hero__title">${title}</h1>
      ${intro ? html`<p class="page-hero__intro">${intro}</p>` : ''}
      ${children || ''}
    </div>
  </section>`;
}
