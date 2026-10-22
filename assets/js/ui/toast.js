import { escapeHtml, icons } from '../lib/dom.js';

/** Brief, polite confirmation messages (announced by screen readers). */
export function toast(message, { duration = 3500 } = {}) {
  const region = document.querySelector('[data-toast-region]');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icons.check}<span>${escapeHtml(message)}</span>`;
  region.append(el);
  setTimeout(() => el.remove(), duration);
}
