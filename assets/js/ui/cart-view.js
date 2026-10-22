/**
 * Everything that DISPLAYS the basket. Each view subscribes to the store and
 * re-renders from state — they never update each other directly.
 * Data flows one way:  user action -> dispatch -> new state -> render.
 */
import { qs, qsa, on, escapeHtml, icons } from '../lib/dom.js';
import { money, plural } from '../lib/format.js';
import { selectCount, selectSubtotal, selectNeedsAssessment, MAX_QTY } from '../cart/cart.js';

const BASE = document.documentElement.dataset.base || '/';

function lineHtml(item) {
  const href = `${BASE}product/${encodeURIComponent(item.slug)}/`;
  return `
  <div class="cart-line" data-key="${escapeHtml(item.key)}">
    <img class="cart-line__img" src="${escapeHtml(item.image || '')}" alt="" width="96" height="96" loading="lazy">
    <div>
      <a class="cart-line__name" href="${href}">${escapeHtml(item.name)}</a>
      ${item.variantLabel ? `<p class="cart-line__variant">${escapeHtml(item.variantLabel)}</p>` : ''}
      ${item.assessment ? `<p class="cart-line__rx">${icons.stethoscope} Assessment required</p>` : ''}
    </div>
    <p class="cart-line__price">${money(item.price * item.quantity)}</p>
    <div class="cart-line__controls">
      <div class="qty qty--sm">
        <button class="qty__btn" type="button" data-cart-step="-1" ${item.quantity <= 1 ? 'disabled' : ''}>${icons.minus}<span class="visually-hidden">Decrease quantity of ${escapeHtml(item.name)}</span></button>
        <input class="qty__input" type="number" min="1" max="${MAX_QTY}" value="${item.quantity}" inputmode="numeric" aria-label="Quantity of ${escapeHtml(item.name)}" data-cart-qty>
        <button class="qty__btn" type="button" data-cart-step="1" ${item.quantity >= MAX_QTY ? 'disabled' : ''}>${icons.plus}<span class="visually-hidden">Increase quantity of ${escapeHtml(item.name)}</span></button>
      </div>
      <button class="cart-line__remove" type="button" data-cart-remove>${icons.trash} Remove<span class="visually-hidden"> ${escapeHtml(item.name)}</span></button>
    </div>
  </div>`;
}

const emptyHtml = `
  <div class="cart-empty">
    ${icons.bag}
    <p>Your basket is empty.</p>
    <a class="btn btn--primary" href="${BASE}shop/">Browse treatments</a>
  </div>`;

/** Quantity buttons, typed quantities and remove — wired once via delegation. */
function bindLineControls(container, store) {
  on(container, 'click', '[data-cart-step]', (e, button) => {
    const key = button.closest('[data-key]').dataset.key;
    const item = store.getState().items.find(i => i.key === key);
    if (item) store.dispatch({ type: 'setQuantity', key, quantity: item.quantity + Number(button.dataset.cartStep) });
  });
  on(container, 'change', '[data-cart-qty]', (e, input) => {
    store.dispatch({ type: 'setQuantity', key: input.closest('[data-key]').dataset.key, quantity: input.value });
  });
  on(container, 'click', '[data-cart-remove]', (e, button) => {
    const line = button.closest('[data-key]');
    store.dispatch({ type: 'remove', key: line.dataset.key });
    container.closest('dialog')?.querySelector('[data-dialog-close]')?.focus();
  });
}

export function initCartViews(store) {
  const countEls = qsa('[data-cart-count]');
  const labelEls = qsa('[data-cart-label]');
  const drawerItems = qs('[data-cart-items]');
  const drawerFooter = qs('[data-cart-footer]');
  const basketItems = qs('[data-basket-items]');
  const basketSummary = qs('[data-basket-summary]');
  const checkoutLines = qs('[data-checkout-lines]');

  if (drawerItems) bindLineControls(drawerItems, store);
  if (basketItems) bindLineControls(basketItems, store);

  let previousCount = selectCount(store.getState());

  function render(state) {
    const count = selectCount(state);
    const subtotal = money(selectSubtotal(state));
    const lines = state.items.map(lineHtml).join('');

    countEls.forEach(el => {
      el.textContent = count;
      el.hidden = count === 0;
      if (count > previousCount) { el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped'); }
    });
    labelEls.forEach(el => { el.textContent = `Basket, ${plural(count, 'item')}`; });
    previousCount = count;

    if (drawerItems) {
      drawerItems.innerHTML = count ? lines : emptyHtml;
      drawerFooter.hidden = count === 0;
    }
    qsa('[data-cart-subtotal], [data-basket-subtotal]').forEach(el => { el.textContent = subtotal; });
    qsa('[data-basket-total]').forEach(el => { el.textContent = subtotal; });

    if (basketItems) {
      basketItems.innerHTML = count ? lines : emptyHtml;
      basketSummary.hidden = count === 0;
      qs('[data-basket-assessment]').hidden = !selectNeedsAssessment(state);
    }

    if (checkoutLines) {
      checkoutLines.innerHTML = count
        ? state.items.map(i => `<p class="checkout-line"><span>${i.quantity} × ${escapeHtml(i.name)}${i.variantLabel ? ` (${escapeHtml(i.variantLabel)})` : ''}</span><span>${money(i.price * i.quantity)}</span></p>`).join('')
        : '<p class="muted">Your basket is empty.</p>';
    }
  }

  store.subscribe(render);
  render(store.getState());
}
