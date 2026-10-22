/**
 * Inline SVG icons.
 *
 * Icons are read from npm packages at build time and inlined, so there is no
 * icon font and no extra request. Inline SVG also inherits `currentColor`,
 * which means an icon automatically matches the text colour around it.
 *  - Lucide (ISC licence) for interface icons
 *  - Simple Icons (CC0) for social brand logos
 */
import fs from 'node:fs';
import path from 'node:path';
import { raw } from './html.mjs';

const LUCIDE = path.resolve('node_modules/lucide-static/icons');
const SIMPLE = path.resolve('node_modules/simple-icons/icons');

// Our names -> Lucide names. Keeping our own names means we can swap the
// underlying icon set later without touching every template.
const ALIASES = {
  basket: 'shopping-bag', close: 'x', trash: 'trash-2', pin: 'map-pin', people: 'users',
  shield: 'shield-check', drop: 'droplet', capsule: 'pill', flask: 'flask-conical', female: 'venus',
  laser: 'zap', bottle: 'spray-can', sparkle: 'sparkles', roller: 'scan-line', help: 'circle-help',
  alert: 'circle-alert', success: 'circle-check-big', verified: 'badge-check', clipboard: 'clipboard-list',
};
const BRANDS = { facebook: 'facebook', instagram: 'instagram', tiktok: 'tiktok' };

const cache = new Map();

function inner(file) {
  return fs.readFileSync(file, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/<title>.*?<\/title>/, '');
}

/**
 * icon('truck')                      decorative (hidden from screen readers)
 * icon('basket', { label: 'Basket' }) meaningful on its own
 */
export function icon(name, { size = 20, label = '', className = '' } = {}) {
  const key = name;
  if (!cache.has(key)) {
    if (BRANDS[name]) {
      cache.set(key, { body: inner(path.join(SIMPLE, `${BRANDS[name]}.svg`)), brand: true });
    } else {
      cache.set(key, { body: inner(path.join(LUCIDE, `${ALIASES[name] || name}.svg`)), brand: false });
    }
  }
  const { body, brand } = cache.get(key);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  const paint = brand
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
  return raw(`<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" ${paint} ${a11y}>${body}</svg>`);
}
