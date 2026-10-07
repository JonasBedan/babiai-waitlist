// Měření přes Plausible: bez cookies, bez osobních údajů. Bez nastavené domény se nic neposílá.
import { PLAUSIBLE_DOMAIN } from './config.js';

export function initTracking() {
  if (!PLAUSIBLE_DOMAIN) return;
  window.plausible =
    window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  const s = document.createElement('script');
  s.defer = true;
  s.dataset.domain = PLAUSIBLE_DOMAIN;
  s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
}

export function track(name, props) {
  if (import.meta.env.DEV) console.info('[track]', name, props || '');
  if (typeof window.plausible === 'function') window.plausible(name, props ? { props } : undefined);
}

const once = new Set();
export function trackOnce(name, props) {
  if (once.has(name)) return;
  once.add(name);
  track(name, props);
}

// Zdroj návštěvy z UTM parametrů, např. ?utm_source=facebook&utm_medium=skupina&utm_campaign=rijen.
// Uloží se pro celou návštěvu, ať zůstane i po proklikání stránky.
export function trafficSource() {
  const p = new URLSearchParams(location.search);
  const parts = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => p.get(k)).filter(Boolean);
  let source = parts.length ? parts.join('/').slice(0, 200) : null;
  try {
    if (source) sessionStorage.setItem('source', source);
    else source = sessionStorage.getItem('source');
  } catch {}
  return source;
}
