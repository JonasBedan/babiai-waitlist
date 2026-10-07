import { initAudience } from './audience.js';
import { PREVIEW } from './config.js';
import { initDemo, reset } from './demo.js';
import { initForms } from './form.js';
import { hydrateIcons } from './icons.js';
import { initShare } from './share.js';
import { initTracking, trafficSource } from './track.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function jumpToForm() {
  const target = document.getElementById('zapis');
  target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

function initStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  const watched = document.querySelectorAll('.hero-form, .form-again, .hero-phone');
  const visible = new Set();
  const update = () => {
    cta.hidden = !(window.scrollY > 300 && visible.size === 0);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    update();
  });
  watched.forEach((f) => io.observe(f));
  addEventListener('scroll', update, { passive: true });
}

document.getElementById('preview-banner').hidden = !PREVIEW;
initTracking();
trafficSource();
hydrateIcons();
initAudience();
initForms();
initShare();
initDemo(document.getElementById('demo'), { onJoinClick: jumpToForm });
document.getElementById('demo-reset').addEventListener('click', () => reset());
document.querySelectorAll('[data-jump-form]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    jumpToForm();
  }),
);
initStickyCta();
