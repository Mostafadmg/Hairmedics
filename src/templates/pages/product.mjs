import { html, raw } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { money, priceLabel } from '../lib/format.mjs';
import { breadcrumbs, productImage, productCard, assessmentNotice, badge, contactBand } from '../components/ui.mjs';

/**
 * Product detail page.
 *
 * The add-to-basket form works like a normal HTML form; product-form.js
 * enhances it (live price, variant matching, basket drawer). The variant
 * list is embedded as JSON so the browser never has to fetch anything.
 */
export function productPage(ctx, product) {
  const category = ctx.categoryBySlug(product.primaryCategory);
  const trail = [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop/' }];
  if (category) trail.push({ label: category.name, href: `/product-category/${category.slug}/` });
  trail.push({ label: product.name, href: `/product/${product.slug}/` });

  const related = ctx.products
    .filter(p => p.id !== product.id && p.purchasable && p.categories.includes(product.primaryCategory))
    .slice(0, 4);

  const canBuy = product.purchasable && product.inStock;
  const hasVariants = product.variants.length > 0;
  // Pre-select the cheapest in-stock option, so the page matches "From £x".
  const byPrice = [...product.variants].sort((a, b) => a.price - b.price);
  const firstVariant = byPrice.find(v => v.inStock) || byPrice[0];

  // Everything product-form.js needs, embedded in the page.
  const clientData = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0] ? ctx.asset(`img/products/${product.images[0].base}-480.webp`) : null,
    assessment: product.assessment,
    price: product.price.from,
    variants: product.variants,
  };

  const descriptionHtml = product.description ? ctx.markdown(product.description) : '';

  const body = html`
  <div class="container">${breadcrumbs(ctx, trail)}</div>

  <section class="product" data-product>
    <div class="container product__inner">
      <div class="product__gallery gallery" data-gallery>
        <div class="gallery__main">
          ${productImage(ctx, product.images[0], { sizes: '(min-width: 1024px) 45vw, 100vw', eager: true, className: 'gallery__image' })}
          ${product.price.regular ? html`<span class="gallery__flag">${badge('Sale', 'copper')}</span>` : ''}
        </div>
        ${product.images.length > 1 ? html`
        <ul class="gallery__thumbs" role="list">
          ${product.images.map((img, i) => html`
            <li><button class="gallery__thumb" type="button" aria-pressed="${i === 0 ? 'true' : 'false'}"
              data-gallery-thumb data-src="${ctx.asset(`img/products/${img.base}-960.webp`)}" data-alt="${img.alt}">
              ${productImage(ctx, img, { sizes: '80px' })}<span class="visually-hidden">Show image ${i + 1}</span>
            </button></li>`)}
        </ul>` : ''}
      </div>

      <div class="product__summary">
        <p class="product__brand">${product.brand}</p>
        <h1 class="product__title">${product.name}</h1>

        <div class="product__price-row">
          <p class="price price--lg" data-product-price aria-live="polite">
            ${canBuy ? (hasVariants ? money(firstVariant.price) : money(product.price.from)) : 'Currently unavailable'}
          </p>
          ${product.price.regular ? html`<s class="price__was">${money(product.price.regular)}</s>` : ''}
          ${hasVariants && product.price.to > product.price.from ? html`<span class="muted small">${priceLabel(product.price)} – ${money(product.price.to)}</span>` : ''}
        </div>

        <ul class="product__meta" role="list">
          <li>${icon('truck', { size: 18 })} Free tracked UK delivery</li>
          ${product.inStock ? html`<li class="text-success">${icon('check', { size: 18 })} In stock</li>` : html`<li class="text-error">${icon('alert', { size: 18 })} Out of stock</li>`}
          ${product.assessment ? html`<li>${icon('stethoscope', { size: 18 })} Prescriber-reviewed</li>` : ''}
        </ul>

        ${product.summary ? html`<p class="product__lead">${product.summary}</p>` : ''}

        ${canBuy ? html`
        <form class="product-form" data-product-form action="${ctx.url('/basket/')}" method="get" novalidate>
          ${product.options.map(opt => html`
            <fieldset class="option-group">
              <legend class="option-group__legend">${opt.name}: <span data-option-selected="${opt.name}">${firstVariant.options[opt.name]}</span></legend>
              <div class="option-group__choices">
                ${opt.values.map(value => html`
                  <label class="option-pill">
                    <input type="radio" name="${opt.name}" value="${value}" ${firstVariant.options[opt.name] === value ? 'checked' : ''} data-option="${opt.name}">
                    <span>${value}</span>
                  </label>`)}
              </div>
            </fieldset>`)}

          <div class="product-form__buy">
            <div class="qty" data-qty>
              <button class="qty__btn" type="button" data-qty-step="-1">${icon('minus', { size: 16 })}<span class="visually-hidden">Decrease quantity</span></button>
              <label class="visually-hidden" for="qty-${product.id}">Quantity</label>
              <input class="qty__input" id="qty-${product.id}" type="number" name="quantity" value="1" min="1" max="10" inputmode="numeric" data-qty-input>
              <button class="qty__btn" type="button" data-qty-step="1">${icon('plus', { size: 16 })}<span class="visually-hidden">Increase quantity</span></button>
            </div>
            <button class="btn btn--primary btn--lg product-form__submit" type="submit" data-add-to-cart>
              ${icon('basket', { size: 20 })} Add to basket
            </button>
          </div>
          <p class="form-error" data-product-error hidden></p>
          <script type="application/json" data-product-json>${raw(JSON.stringify(clientData).replace(/</g, '\\u003c'))}</script>
        </form>` : html`
        <div class="notice notice--warning">
          ${icon('info', { size: 22, className: 'notice__icon' })}
          <div>
            <p class="notice__title">This treatment isn’t available to order online right now</p>
            <p>Our team can advise on availability or a suitable alternative.</p>
            <a class="link-arrow" href="${ctx.url('/contact/')}">Contact us ${icon('arrow-right', { size: 16 })}</a>
          </div>
        </div>`}

        ${product.assessment ? assessmentNotice(ctx) : ''}

        <ul class="product__assurances" role="list">
          <li>${icon('lock', { size: 18 })} Secure checkout</li>
          <li>${icon('package', { size: 18 })} Discreet, tracked packaging</li>
          <li>${icon('phone', { size: 18 })} Questions? <a href="${ctx.site.phone.href}">${ctx.site.phone.display}</a></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--sand product-details">
    <div class="container product-details__inner">
      <div class="product-details__main">
        <h2 class="product-details__title">About this product</h2>
        <div class="prose">${descriptionHtml ? raw(descriptionHtml) : html`<p>${product.summary}</p>`}</div>
      </div>
      <aside class="product-details__aside">
        <details class="accordion" open>
          <summary>${icon('truck', { size: 18 })} Delivery</summary>
          <div class="accordion__body">
            <p>Free tracked delivery to anywhere in the UK on every order. ${product.assessment ? 'Prescription treatments are dispatched once our prescriber has approved your assessment.' : ''}</p>
            <p>Prescription products are only sold and shipped within the UK.</p>
          </div>
        </details>
        <details class="accordion">
          <summary>${icon('package', { size: 18 })} Returns</summary>
          <div class="accordion__body">
            <p>Unopened, unused items in their original packaging can be returned — see our <a href="${ctx.url('/return-policy/')}">returns policy</a> for details. For hygiene and safety reasons we can’t accept opened items.</p>
          </div>
        </details>
        ${product.assessment ? html`
        <details class="accordion">
          <summary>${icon('shield', { size: 18 })} Prescribing & safety</summary>
          <div class="accordion__body">
            <dl class="facts">
              <div><dt>Prescribing doctor</dt><dd>${ctx.site.regulatory.prescriber.name} (GMC ${ctx.site.regulatory.prescriber.gmc})</dd></div>
              <div><dt>Registered pharmacy</dt><dd>${ctx.site.regulatory.pharmacy.name} (No. ${ctx.site.regulatory.pharmacy.number})</dd></div>
              <div><dt>Manufacturer</dt><dd>${ctx.site.regulatory.manufacturer.name}</dd></div>
            </dl>
            <p class="small">Results vary between individuals. Treatment usually needs 3–6 months of consistent use, and stopping will reverse any regrowth. Read our <a href="${ctx.url('/unlicensed-medicines-prescribing-policy/')}">unlicensed medicines & prescribing policy</a>.</p>
          </div>
        </details>` : ''}
      </aside>
    </div>
  </section>

  ${related.length ? html`
  <section class="section" aria-labelledby="related-title">
    <div class="container">
      <h2 class="section-header__title" id="related-title">You might also consider</h2>
      <div class="product-grid">${related.map(p => productCard(ctx, p))}</div>
    </div>
  </section>` : ''}

  ${canBuy ? html`
  <div class="sticky-buy" data-sticky-buy hidden>
    <div class="container sticky-buy__inner">
      <div class="sticky-buy__text"><strong>${product.name}</strong><span data-sticky-price>${hasVariants ? money(firstVariant.price) : money(product.price.from)}</span></div>
      <button class="btn btn--primary" type="button" data-sticky-add>Add to basket</button>
    </div>
  </div>` : ''}

  ${contactBand(ctx)}`;

  const offers = hasVariants
    ? { '@type': 'AggregateOffer', priceCurrency: 'GBP', lowPrice: product.price.from, highPrice: product.price.to, offerCount: product.variants.length }
    : { '@type': 'Offer', priceCurrency: 'GBP', price: product.price.from };
  offers.availability = product.inStock && product.purchasable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  offers.url = `${ctx.site.url}/product/${product.slug}/`;

  return {
    title: product.name,
    description: (product.summary || product.name).slice(0, 155),
    path: `/product/${product.slug}/`,
    body,
    bodyClass: 'page--product',
    ogType: 'product',
    ogImage: product.images[0] ? `${ctx.site.url}/assets/img/products/${product.images[0].base}-960.webp` : undefined,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      brand: { '@type': 'Brand', name: product.brand },
      description: product.summary,
      image: product.images.map(i => `${ctx.site.url}/assets/img/products/${i.base}-960.webp`),
      sku: String(product.id),
      offers: product.purchasable ? offers : undefined,
    }, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.label, item: ctx.site.url + t.href })),
    }],
  };
}
