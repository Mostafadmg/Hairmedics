/**
 * A tiny, safe HTML templating helper.
 *
 *   html`<h1>${title}</h1>`
 *
 * Every interpolated value is HTML-escaped by default, so a product called
 * `<script>` can never break the page. When we *want* to insert markup
 * (another component, or converted Markdown) we wrap it with raw() — or it is
 * already a SafeHtml because it came from html`` itself.
 */
export class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = value => String(value).replace(/[&<>"']/g, c => ESCAPES[c]);

export const raw = value => new SafeHtml(String(value ?? ''));

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof SafeHtml) return value.value;
  return escape(value);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((str, i) => { out += str + (i < values.length ? render(values[i]) : ''); });
  return new SafeHtml(out);
}

/** Build a class attribute from conditional parts: cx('btn', isActive && 'is-active') */
export const cx = (...parts) => parts.filter(Boolean).join(' ');
