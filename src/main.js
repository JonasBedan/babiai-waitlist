import { initAudience } from './audience.js';
import { PREVIEW } from './config.js';
import { initDemo, reset } from './demo.js';
import { initForms } from './form.js';
import { hydrateIcons } from './icons.js';
import { hydratePatterns } from './patterns.js';
import { initScene } from './scene.js';
import { initShare } from './share.js';
import { close as closeStage, initStage } from './stage.js';
import { initTracking, trafficSource } from './track.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function jumpToForm() {
  closeStage({ restoreFocus: false });
  const target = document.getElementById('zapis');
  target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
}

document.getElementById('preview-banner').hidden = !PREVIEW;
initTracking();
trafficSource();
hydratePatterns();
hydrateIcons();
initAudience();
initForms();
initShare();
initDemo(document.getElementById('demo'), { onJoinClick: jumpToForm });
initStage();
initScene();
document.getElementById('demo-reset').addEventListener('click', () => reset());
document.querySelectorAll('[data-jump-form]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    jumpToForm();
  }),
);
