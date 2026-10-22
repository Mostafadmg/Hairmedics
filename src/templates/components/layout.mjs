/**
 * The page shell shared by every page: <head>, header, footer, cart drawer.
 *
 * Pages only provide their unique <main> content plus some metadata —
 * which is what keeps 80+ pages consistent and easy to change.
 */
import fs from 'node:fs';
import path from 'node:path';
import { html, raw, cx } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';

const logoCache = {};
/** Inline the outlined SVG logo (crisp at any size, no extra request). */
function logo(variant = 'logo') {
  if (!logoCache[variant]) {
    const svg = fs.readFileSync(path.resolve(`src/assets/brand/${variant}.svg`), 'utf8')
      .replace(/<title[^>]*>.*?<\/title>/, '')
      .replace(/ role="img" aria-labelledby="t"/, ' aria-hidden="true" focusable="false"')
      .replace(/ width="\d+" height="\d+"/, '');
    logoCache[variant] = raw(svg);
  }
  return logoCache[variant];
}

function head(ctx, page) {
  const { site } = ctx;
  const fullTitle = page.title === site.name ? `${site.name} — ${site.tagline}` : `${page.title} | ${site.name}`;
  const canonical = site.url + page.path;
  const ogImage = site.url + '/assets/brand/og-image.png';
  return html`
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${fullTitle}</title>
  <meta name="description" content="${page.description || site.description}">
  <link rel="canonical" href="${canonical}">
  ${page.noindex || ctx.preview ? html`<meta name="robots" content="noindex">` : ''}
  <meta name="theme-color" content="#14605B">
  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description || site.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${page.ogImage || ogImage}">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${ctx.asset('brand/favicon.svg')}" type="image/svg+xml">
  <link rel="icon" href="${ctx.asset('brand/favicon-32.png')}" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="${ctx.asset('brand/apple-touch-icon.png')}">
  <link rel="preload" href="${ctx.asset('fonts/fraunces-latin-opsz-normal.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${ctx.asset('fonts/manrope-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${ctx.asset(`css/main.css?v=${ctx.version}`)}">
  <script type="module" src="${ctx.asset(`js/main.js?v=${ctx.version}`)}"></script>
  ${[ctx.organizationJsonLd, ...(page.jsonLd || [])].map(data => raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`))}`;
}

function announcement(ctx) {
  return html`
  <div class="announcement">
    <div class="container announcement__inner">
      <p>${icon('truck', { size: 16 })} Free tracked UK delivery on every order</p>
      <p class="announcement__extra">${icon('stethoscope', { size: 16 })} Prescriptions reviewed by a GMC-registered doctor</p>
      <a class="announcement__phone" href="${ctx.site.phone.href}">${icon('phone', { size: 16 })} ${ctx.site.phone.display}</a>
    </div>
  </div>`;
}

const NAV = [
  { label: 'Shop all', href: '/shop/' },
  { label: 'Medical assessment', href: '/medical-assessment/' },
  { label: 'About', href: '/about-hair-medics-uk/' },
  { label: 'Reviews', href: '/google-reviews/' },
  { label: 'Contact', href: '/contact/' },
];

function treatmentLinks(ctx, group) {
  return ctx.categories.filter(c => c.group === group).map(c => html`
    <li><a href="${ctx.url(`/product-category/${c.slug}/`)}">
      <span class="nav-link-icon">${icon(c.icon, { size: 18 })}</span>
      <span><strong>${c.name}</strong><small>${c.strap}</small></span>
    </a></li>`);
}

function header(ctx, page) {
  const isCurrent = href => page.path === href || (href !== '/' && page.path.startsWith(href));
  return html`
  <header class="site-header" data-site-header>
    <div class="container site-header__inner">
      <button class="icon-btn site-header__menu" type="button" data-dialog-open="mobile-nav" aria-haspopup="dialog">
        ${icon('menu', { size: 24 })}<span class="visually-hidden">Open menu</span>
      </button>
      <a class="site-header__logo" href="${ctx.url('/')}" aria-label="${ctx.site.name} — home">${logo('logo')}</a>
      <nav class="primary-nav" aria-label="Main">
        <ul class="primary-nav__list">
          <li class="primary-nav__item primary-nav__item--dropdown" data-dropdown>
            <button class="primary-nav__link" type="button" aria-expanded="false" aria-controls="menu-treatments" data-dropdown-toggle>
              Treatments ${icon('chevron-down', { size: 16 })}
            </button>
            <div class="mega" id="menu-treatments" data-dropdown-panel hidden>
              <div class="mega__col">
                <p class="mega__heading">Treatments</p>
                <ul class="mega__list">${treatmentLinks(ctx, 'treatments')}</ul>
              </div>
              <div class="mega__col">
                <p class="mega__heading">Tools & scalp care</p>
                <ul class="mega__list">${treatmentLinks(ctx, 'tools')}${treatmentLinks(ctx, 'clinic')}</ul>
              </div>
              <a class="mega__feature" href="${ctx.url('/medical-assessment/')}">
                ${icon('clipboard', { size: 28 })}
                <strong>Not sure where to start?</strong>
                <span>Complete a 5–10 minute medical assessment, reviewed by our prescribing doctor.</span>
                <span class="link-arrow">Start assessment ${icon('arrow-right', { size: 16 })}</span>
              </a>
            </div>
          </li>
          ${NAV.map(item => html`<li class="primary-nav__item"><a class="primary-nav__link" href="${ctx.url(item.href)}" ${isCurrent(item.href) ? html`aria-current="page"` : ''}>${item.label}</a></li>`)}
        </ul>
      </nav>
      <div class="site-header__actions">
        <a class="icon-btn" href="${ctx.url('/shop/')}#shop-search">${icon('search', { size: 22 })}<span class="visually-hidden">Search products</span></a>
        <button class="icon-btn basket-btn" type="button" data-dialog-open="cart-drawer" aria-haspopup="dialog">
          ${icon('basket', { size: 22 })}
          <span class="basket-btn__count" data-cart-count hidden>0</span>
          <span class="visually-hidden" data-cart-label>Basket, 0 items</span>
        </button>
      </div>
    </div>
  </header>`;
}

function mobileNav(ctx) {
  return html`
  <dialog class="sheet sheet--left" id="mobile-nav" aria-label="Menu">
    <div class="sheet__header">
      <a class="sheet__logo" href="${ctx.url('/')}" aria-label="${ctx.site.name} — home">${logo('logo')}</a>
      <button class="icon-btn" type="button" data-dialog-close>${icon('close', { size: 24 })}<span class="visually-hidden">Close menu</span></button>
    </div>
    <nav class="sheet__body mobile-nav" aria-label="Mobile">
      <p class="mobile-nav__heading">Treatments</p>
      <ul class="mobile-nav__list">${ctx.categories.filter(c => c.group === 'treatments').map(c => html`<li><a href="${ctx.url(`/product-category/${c.slug}/`)}">${icon(c.icon, { size: 18 })} ${c.name}</a></li>`)}</ul>
      <p class="mobile-nav__heading">Tools & scalp care</p>
      <ul class="mobile-nav__list">${ctx.categories.filter(c => c.group !== 'treatments').map(c => html`<li><a href="${ctx.url(`/product-category/${c.slug}/`)}">${icon(c.icon, { size: 18 })} ${c.name}</a></li>`)}</ul>
      <ul class="mobile-nav__list mobile-nav__list--main">
        ${NAV.map(item => html`<li><a href="${ctx.url(item.href)}">${item.label}</a></li>`)}
      </ul>
    </nav>
    <div class="sheet__footer">
      <a class="btn btn--primary btn--block" href="${ctx.url('/medical-assessment/')}">Start medical assessment</a>
      <a class="btn btn--ghost btn--block" href="${ctx.site.phone.href}">${icon('phone', { size: 18 })} ${ctx.site.phone.display}</a>
    </div>
  </dialog>`;
}

function cartDrawer(ctx) {
  return html`
  <dialog class="sheet sheet--right cart-drawer" id="cart-drawer" aria-labelledby="cart-drawer-title" data-cart-drawer>
    <div class="sheet__header">
      <h2 class="sheet__title" id="cart-drawer-title">Your basket</h2>
      <button class="icon-btn" type="button" data-dialog-close>${icon('close', { size: 24 })}<span class="visually-hidden">Close basket</span></button>
    </div>
    <div class="sheet__body" data-cart-items>
      <p class="cart-empty">Your basket is empty.</p>
    </div>
    <div class="sheet__footer cart-drawer__footer" data-cart-footer hidden>
      <dl class="totals">
        <div><dt>Subtotal</dt><dd data-cart-subtotal>£0.00</dd></div>
        <div><dt>UK delivery</dt><dd>Free</dd></div>
      </dl>
      <a class="btn btn--primary btn--block btn--lg" href="${ctx.url('/basket/')}">View basket & checkout</a>
      <p class="cart-drawer__note">${icon('lock', { size: 14 })} Prescription items are only dispatched after prescriber approval.</p>
    </div>
  </dialog>`;
}

function footer(ctx) {
  const { site } = ctx;
  const r = site.regulatory;
  const link = (href, label) => html`<li><a href="${ctx.url(href)}">${label}</a></li>`;
  return html`
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <a class="site-footer__logo" href="${ctx.url('/')}" aria-label="${site.name} — home">${logo('logo-reversed')}</a>
          <p>Clinically-led, home-use hair loss treatments for men and women — with free tracked UK delivery on every order.</p>
          <ul class="social" role="list">
            ${site.social.map(s => html`<li><a href="${s.url}" rel="noopener" target="_blank">${icon(s.icon, { size: 20 })}<span class="visually-hidden">${s.name} (opens in a new tab)</span></a></li>`)}
          </ul>
        </div>
        <nav class="site-footer__col" aria-labelledby="footer-shop">
          <h2 class="site-footer__heading" id="footer-shop">Shop</h2>
          <ul role="list">
            ${link('/shop/', 'All products')}
            ${ctx.categories.slice(0, 8).map(c => link(`/product-category/${c.slug}/`, c.name))}
          </ul>
        </nav>
        <nav class="site-footer__col" aria-labelledby="footer-help">
          <h2 class="site-footer__heading" id="footer-help">Help</h2>
          <ul role="list">
            ${link('/medical-assessment/', 'Medical assessment')}
            ${link('/contact/', 'Contact us')}
            ${link('/return-policy/', 'Returns & refunds')}
            ${link('/google-reviews/', 'Customer reviews')}
            ${link('/about-hair-medics-uk/', 'About Hair Medics UK')}
            ${link('/brand/', 'Brand guidelines')}
          </ul>
        </nav>
        <nav class="site-footer__col" aria-labelledby="footer-legal">
          <h2 class="site-footer__heading" id="footer-legal">Legal</h2>
          <ul role="list">
            ${link('/terms-and-conditions-of-business/', 'Terms & conditions')}
            ${link('/privacy-policy/', 'Privacy policy')}
            ${link('/cookie-policy-uk/', 'Cookie policy')}
            ${link('/unlicensed-medicines-prescribing-policy/', 'Unlicensed medicines & prescribing')}
            ${link('/legal-compliance/', 'Legal compliance')}
            ${link('/cqc-policy/', 'CQC policy')}
            ${link('/home-use-products-disclaimer/', 'Home-use products disclaimer')}
          </ul>
        </nav>
      </div>

      <div class="site-footer__regulatory">
        <div><span>Prescribing doctor</span><strong>${r.prescriber.name}</strong><small>GMC No. ${r.prescriber.gmc}</small></div>
        <div><span>Registered pharmacy</span><strong>${r.pharmacy.name}</strong><small>Pharmacy No. ${r.pharmacy.number}</small></div>
        <div><span>Specialist manufacturer</span><strong>${r.manufacturer.name}</strong><small>${r.manufacturer.address}</small></div>
        <div><span>UK office</span><strong>${site.address.lines.slice(0, 2).join(', ')}</strong><small>${site.address.lines.slice(2).join(', ')}, ${site.address.postcode}</small></div>
      </div>

      <div class="site-footer__bottom">
        <p>© ${new Date().getFullYear()} ${site.name}. All rights reserved.</p>
        <p>Prescription products are only sold and shipped within the UK.</p>
        <p><a href="${site.phone.href}">${site.phone.display}</a> · <a href="mailto:${site.email}">${site.email}</a></p>
      </div>
    </div>
  </footer>`;
}

/**
 * page = { title, description, path, body, bodyClass?, jsonLd?, noindex? }
 */
export function layout(ctx, page) {
  return `<!doctype html>
<html lang="en-GB" data-base="${ctx.url('/')}">
<head>${head(ctx, page)}
</head>
<body class="${cx('page', page.bodyClass)}">
  <a class="skip-link" href="#main">Skip to main content</a>
  ${announcement(ctx)}
  ${header(ctx, page)}
  <main id="main" tabindex="-1">
    ${page.body}
  </main>
  ${footer(ctx)}
  ${mobileNav(ctx)}
  ${cartDrawer(ctx)}
  <div class="toast-region" aria-live="polite" aria-atomic="true" data-toast-region></div>
</body>
</html>
`;
}
