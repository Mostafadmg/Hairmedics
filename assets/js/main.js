/**
 * Entry point. Each feature initialises only if its markup is on the page,
 * so one small script serves every page.
 */
import { local } from './lib/storage.js';
import { createCart, STORAGE_KEY } from './cart/cart.js';
import { initDialogs } from './ui/dialogs.js';
import { initDropdowns } from './ui/dropdown.js';
import { initCartViews } from './ui/cart-view.js';
import { initProductForm } from './ui/product-form.js';
import { initShopFilters } from './ui/shop-filters.js';
import { initContactForm } from './ui/forms.js';
import { initAssessment } from './ui/assessment.js';

const cart = createCart(local);

// Keep several open tabs in sync: another tab changed the basket.
window.addEventListener('storage', e => {
  if (e.key === STORAGE_KEY) cart.dispatch({ type: 'replace', state: local.get(STORAGE_KEY, { items: [] }) });
});

initDialogs();
initDropdowns();
initCartViews(cart);
initProductForm(cart);
initShopFilters();
initContactForm();
initAssessment();
