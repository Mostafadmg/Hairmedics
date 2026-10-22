/**
 * Shop page: instant search, category chips and sorting.
 *
 * Progressive enhancement: every product card is already in the HTML, so
 * the page works without JavaScript. Here we only show/hide and reorder
 * cards — and keep the URL in sync (?q=…&category=…&sort=…) so a filtered
 * view can be bookmarked or shared.
 */
import { qs, qsa } from '../lib/dom.js';
import { plural } from '../lib/format.js';

export function initShopFilters() {
  const grid = qs('[data-shop-grid]');
  if (!grid) return;

  const search = qs('[data-shop-search]');
  const sort = qs('[data-shop-sort]');
  const chips = qsa('[data-shop-chips] [data-category]');
  const count = qs('[data-shop-count]');
  const empty = qs('[data-shop-empty]');
  const cards = qsa('[data-product-card]', grid);

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    category: params.get('category') || 'all',
    sort: params.get('sort') || 'featured',
  };

  const sorters = {
    featured: (a, b) => a.dataset.order - b.dataset.order,
    'price-asc': (a, b) => a.dataset.price - b.dataset.price,
    'price-desc': (a, b) => b.dataset.price - a.dataset.price,
    name: (a, b) => a.querySelector('.product-card__title').textContent.localeCompare(b.querySelector('.product-card__title').textContent),
  };

  function apply() {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;

    cards.forEach(card => {
      const matchesText = words.every(w => card.dataset.name.includes(w));
      const matchesCategory = state.category === 'all' || card.dataset.categories.split(' ').includes(state.category);
      const show = matchesText && matchesCategory;
      card.hidden = !show;
      if (show) visible += 1;
    });

    [...cards].sort(sorters[state.sort] || sorters.featured).forEach(card => grid.append(card));

    chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.category === state.category)));
    count.textContent = plural(visible, 'product');
    empty.hidden = visible > 0;

    const next = new URLSearchParams();
    if (state.q) next.set('q', state.q);
    if (state.category !== 'all') next.set('category', state.category);
    if (state.sort !== 'featured') next.set('sort', state.sort);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  }

  // Debounce typing so we don't re-filter on every single keystroke.
  let timer;
  search.value = state.q;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = search.value.trim(); apply(); }, 120);
  });

  sort.value = state.sort;
  sort.addEventListener('change', () => { state.sort = sort.value; apply(); });

  chips.forEach(chip => chip.addEventListener('click', () => { state.category = chip.dataset.category; apply(); }));

  if (location.hash === '#shop-search') search.focus();
  apply();
}
