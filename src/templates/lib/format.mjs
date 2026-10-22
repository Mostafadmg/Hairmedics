/** Formatting helpers shared by every template. */
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const money = n => gbp.format(n);

/** "From £29.99" when a product has several prices, otherwise "£29.99". */
export function priceLabel(price) {
  if (price.to > price.from) return `From ${money(price.from)}`;
  return money(price.from);
}

export const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

export const formatDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
