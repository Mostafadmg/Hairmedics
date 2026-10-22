/**
 * Product page: variant choice -> live price, quantity stepper, gallery,
 * add to basket, and a sticky "Add to basket" bar on small screens.
 */
import { qs, qsa } from '../lib/dom.js';
import { money } from '../lib/format.js';
import { openDialog } from './dialogs.js';
import { toast } from './toast.js';

function initGallery() {
  const gallery = qs('[data-gallery]');
  if (!gallery) return;
  const main = qs('.gallery__image', gallery);
  qsa('[data-gallery-thumb]', gallery).forEach(thumb => {
    thumb.addEventListener('click', () => {
      main.removeAttribute('srcset');
      main.src = thumb.dataset.src;
      main.alt = thumb.dataset.alt;
      qsa('[data-gallery-thumb]', gallery).forEach(t => t.setAttribute('aria-pressed', String(t === thumb)));
    });
  });
}

export function initProductForm(store) {
  initGallery();
  const form = qs('[data-product-form]');
  if (!form) return;

  const product = JSON.parse(qs('[data-product-json]', form).textContent);
  const priceEl = qs('[data-product-price]');
  const stickyPrice = qs('[data-sticky-price]');
  const submit = qs('[data-add-to-cart]', form);
  const errorEl = qs('[data-product-error]', form);
  const qtyInput = qs('[data-qty-input]', form);

  /** Read the chosen options from the radio buttons: { 'Pack size': '3 bottles' } */
  const selectedOptions = () => Object.fromEntries(qsa('[data-option]:checked', form).map(i => [i.dataset.option, i.value]));

  /** The variant whose options ALL match the current selection. */
  const currentVariant = () => {
    if (!product.variants.length) return null;
    const chosen = selectedOptions();
    return product.variants.find(v => Object.entries(v.options).every(([k, val]) => chosen[k] === val)) || null;
  };

  function update() {
    const variant = currentVariant();
    const price = variant ? variant.price : product.price;
    priceEl.textContent = money(price);
    if (stickyPrice) stickyPrice.textContent = money(price);
    Object.entries(selectedOptions()).forEach(([name, value]) => {
      const label = form.querySelector(`[data-option-selected="${CSS.escape(name)}"]`);
      if (label) label.textContent = value;
    });
    const unavailable = product.variants.length && (!variant || !variant.inStock);
    submit.disabled = Boolean(unavailable);
    errorEl.hidden = !unavailable;
    errorEl.textContent = unavailable ? (variant ? 'This option is out of stock.' : 'This combination isn’t available.') : '';
  }

  // Quantity stepper
  qsa('[data-qty-step]', form).forEach(btn => btn.addEventListener('click', () => {
    const next = Math.min(10, Math.max(1, (Number(qtyInput.value) || 1) + Number(btn.dataset.qtyStep)));
    qtyInput.value = next;
  }));

  form.addEventListener('change', update);

  form.addEventListener('submit', e => {
    e.preventDefault(); // without JS the form still works as a normal GET
    const variant = currentVariant();
    if (product.variants.length && !variant) return;
    store.dispatch({
      type: 'add',
      quantity: Number(qtyInput.value) || 1,
      item: {
        productId: product.id,
        variantId: variant?.id || null,
        slug: product.slug,
        name: product.name,
        variantLabel: variant ? Object.values(variant.options).join(' · ') : '',
        price: variant ? variant.price : product.price,
        image: product.image,
        assessment: product.assessment,
      },
    });
    toast(`Added to your basket`);
    openDialog('cart-drawer');
  });

  // Sticky buy bar: appears once the real button has scrolled ABOVE the
  // screen. (A scroll check, not IntersectionObserver: an observer only fires
  // when visibility changes, so a fast jump past the button would be missed.)
  const sticky = qs('[data-sticky-buy]');
  if (sticky) {
    let ticking = false;
    const check = () => {
      sticky.hidden = submit.getBoundingClientRect().bottom > 0;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(check); } // at most once per frame
    }, { passive: true });
    qs('[data-sticky-add]', sticky).addEventListener('click', () => form.requestSubmit());
    check();
  }

  update();
}
