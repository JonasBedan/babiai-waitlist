// Ukázka na mobilu: místo telefonu v telefonu náhled, který se otevře přes celou obrazovku.
// Na širších obrazovkách je ukázka rovnou klikací vedle formuláře.
import { track } from './track.js';

const mobile = matchMedia('(max-width: 699px)');
let stage;
let demo;
let openBtn;
let closeBtn;

export const isStageOpen = () => stage?.classList.contains('is-open');

export function initStage() {
  stage = document.querySelector('.hero-stage');
  demo = document.getElementById('demo');
  openBtn = stage.querySelector('.stage-open');
  closeBtn = stage.querySelector('.stage-close');

  history.scrollRestoration = 'manual';
  openBtn.addEventListener('click', open);
  // Klepnutí kamkoli do náhledu (ukázka je v něm inert, klik dopadne na obal).
  stage.querySelector('.phone-wrap').addEventListener('click', (e) => {
    if (demo.inert && e.target !== openBtn && !openBtn.contains(e.target)) open();
  });
  closeBtn.addEventListener('click', () => close());
  // Escape nejdřív zavře lištu nebo dialog uvnitř ukázky, až pak celou ukázku.
  // Capture: stav se čte dřív, než ukázka lištu sama zavře.
  stage.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isStageOpen() && !demo.querySelector('.sheet, .dialog')) close();
    },
    { capture: true },
  );
  // Tlačítko Zpět v telefonu zavře ukázku, ne celou stránku.
  addEventListener('popstate', () => isStageOpen() && close({ fromHistory: true }));
  mobile.addEventListener('change', sync);
  sync();
}

function sync() {
  if (!mobile.matches && isStageOpen()) close({ restoreFocus: false });
  demo.inert = mobile.matches && !isStageOpen();
  if (demo.inert) peekCurrent();
}

// V náhledu ukázat lekci, která je na řadě, ne jen nadpis části.
function peekCurrent() {
  const scroller = demo.querySelector('.screen-scroll');
  const cur = demo.querySelector('.node--current');
  if (!scroller || !cur) return;
  // v náhledu je telefon zmenšený (zoom), posun ve stránce je potřeba přepočítat
  const z = scroller.currentCSSZoom || 1;
  scroller.scrollTop += (cur.getBoundingClientRect().top - scroller.getBoundingClientRect().top) / z - 24;
}

function open() {
  stage.classList.add('is-open');
  document.documentElement.classList.add('stage-locked');
  demo.inert = false;
  history.pushState({ stage: true }, '');
  track('demo_open');
  (demo.querySelector('#tour-card button, .node--current button') || closeBtn).focus();
}

export function close({ fromHistory = false, restoreFocus = true } = {}) {
  if (!isStageOpen()) return;
  stage.classList.remove('is-open');
  document.documentElement.classList.remove('stage-locked');
  demo.inert = mobile.matches;
  if (demo.inert) peekCurrent();
  if (!fromHistory && history.state?.stage) history.back();
  if (restoreFocus) openBtn.focus({ preventScroll: true });
}
