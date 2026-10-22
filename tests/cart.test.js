import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartReducer, selectCount, selectSubtotal, selectNeedsAssessment, sanitize, MAX_QTY } from '../src/js/cart/cart.js';

const empty = { items: [] };
const minoxidil = { productId: 9118, variantId: 9119, slug: '10-minoxdil-no-pg', name: '10% Minoxidil', variantLabel: '1 bottle', price: 34.99, image: '', assessment: true };
const shampoo = { productId: 2576, variantId: null, slug: 'hair-medics-uk-shampoo', name: 'Shampoo', variantLabel: '', price: 27.99, image: '', assessment: false };

test('adding a new item creates a line with a stable key', () => {
  const state = cartReducer(empty, { type: 'add', item: minoxidil, quantity: 2 });
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].key, '9118:9119');
  assert.equal(state.items[0].quantity, 2);
});

test('adding the same variant again increases quantity instead of duplicating', () => {
  let state = cartReducer(empty, { type: 'add', item: minoxidil, quantity: 1 });
  state = cartReducer(state, { type: 'add', item: minoxidil, quantity: 2 });
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].quantity, 3);
});

test('quantity is clamped between 1 and MAX_QTY', () => {
  let state = cartReducer(empty, { type: 'add', item: shampoo, quantity: 50 });
  assert.equal(state.items[0].quantity, MAX_QTY);
  state = cartReducer(state, { type: 'setQuantity', key: '2576', quantity: 0 });
  assert.equal(state.items[0].quantity, 1);
  state = cartReducer(state, { type: 'setQuantity', key: '2576', quantity: 'abc' });
  assert.equal(state.items[0].quantity, 1);
});

test('the reducer never mutates the previous state', () => {
  const before = Object.freeze({ items: Object.freeze([]) });
  assert.doesNotThrow(() => cartReducer(before, { type: 'add', item: shampoo, quantity: 1 }));
  assert.equal(before.items.length, 0);
});

test('unknown actions return the same state object', () => {
  assert.equal(cartReducer(empty, { type: 'nope' }), empty);
});

test('remove deletes only the matching line', () => {
  let state = cartReducer(empty, { type: 'add', item: shampoo, quantity: 1 });
  state = cartReducer(state, { type: 'add', item: minoxidil, quantity: 1 });
  state = cartReducer(state, { type: 'remove', key: '2576' });
  assert.deepEqual(state.items.map(i => i.key), ['9118:9119']);
});

test('selectors derive count, subtotal and assessment status', () => {
  let state = cartReducer(empty, { type: 'add', item: shampoo, quantity: 2 });
  assert.equal(selectNeedsAssessment(state), false);
  state = cartReducer(state, { type: 'add', item: minoxidil, quantity: 1 });
  assert.equal(selectCount(state), 3);
  assert.equal(selectSubtotal(state), 90.97); // 2 × 27.99 + 34.99, no floating-point noise
  assert.equal(selectNeedsAssessment(state), true);
});

test('sanitize drops malformed saved data', () => {
  assert.deepEqual(sanitize(null), { items: [] });
  assert.deepEqual(sanitize({ items: 'oops' }), { items: [] });
  const cleaned = sanitize({ items: [{ key: 'a', name: 'x', price: -5 }, { key: 'b', name: 'y', price: 5, quantity: 99 }] });
  assert.equal(cleaned.items.length, 1);
  assert.equal(cleaned.items[0].quantity, MAX_QTY);
});
