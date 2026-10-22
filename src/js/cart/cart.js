/**
 * Basket state.
 *
 * Shape (keep it small and serialisable — it lives in localStorage):
 *   { items: [{ key, productId, variantId, slug, name, variantLabel,
 *               price, image, assessment, quantity }] }
 *
 * We store a snapshot of name/price/image when an item is added, so the
 * basket can render instantly on any page without loading the catalogue.
 * (A real checkout must always re-check prices on the server.)
 */
import { createStore } from '../lib/store.js';
import { roundMoney } from '../lib/format.js';

export const STORAGE_KEY = 'hm-basket-v1';
export const MAX_QTY = 10;

export const lineKey = (productId, variantId) => (variantId ? `${productId}:${variantId}` : String(productId));

const clampQty = n => Math.max(1, Math.min(MAX_QTY, Math.floor(Number(n)) || 1));

/** Pure function: same input -> same output, and it never mutates `state`. */
export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const key = lineKey(action.item.productId, action.item.variantId);
      const existing = state.items.find(i => i.key === key);
      const items = existing
        ? state.items.map(i => (i.key === key ? { ...i, quantity: clampQty(i.quantity + action.quantity) } : i))
        : [...state.items, { ...action.item, key, quantity: clampQty(action.quantity) }];
      return { ...state, items };
    }
    case 'setQuantity':
      return { ...state, items: state.items.map(i => (i.key === action.key ? { ...i, quantity: clampQty(action.quantity) } : i)) };
    case 'remove':
      return { ...state, items: state.items.filter(i => i.key !== action.key) };
    case 'replace':
      return sanitize(action.state);
    case 'clear':
      return { ...state, items: [] };
    default:
      return state;
  }
}

// Selectors: derive values from state instead of storing duplicates.
export const selectCount = state => state.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = state => roundMoney(state.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
export const selectNeedsAssessment = state => state.items.some(i => i.assessment);

/** Defend against old or tampered localStorage data. */
export function sanitize(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items
      .filter(i => i && i.key && i.name && Number.isFinite(i.price) && i.price >= 0)
      .map(i => ({ ...i, quantity: clampQty(i.quantity) })),
  };
}

export function createCart(storage) {
  const store = createStore(sanitize(storage.get(STORAGE_KEY, { items: [] })), cartReducer);
  store.subscribe(state => storage.set(STORAGE_KEY, state));
  return store;
}
