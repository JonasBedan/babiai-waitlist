// Ikony Lucide jako SVG řetězce (obrys, tloušťka 2, zaoblené konce).
import {
  ArrowRight, BookOpen, Building2, Check, CircleCheck, Gamepad2, Gift, Info, Lock, MessageCircle, Mic,
  Phone, PhoneOff, Play, RotateCcw, Share2, ShieldCheck, SkipForward, TriangleAlert, Users, X,
} from 'lucide';

const ICONS = {
  ArrowRight, BookOpen, Building2, Check, CircleCheck, Gamepad2, Gift, Info, Lock, MessageCircle, Mic,
  Phone, PhoneOff, Play, RotateCcw, Share2, ShieldCheck, SkipForward, TriangleAlert, Users, X,
};

export function icon(name, size = 24) {
  const node = ICONS[name];
  if (!node) return '';
  const inner = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  return `<svg class="icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// Doplní ikony do statického HTML: <span data-icon="Lock"></span>
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 24);
  });
}
