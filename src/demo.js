// Klikací ukázka v telefonu. Logika (stavy, test, skok) je v demo-logic.js, tady je jen vzhled a ovládání.
import {
  KIND_LABEL, LESSON, NODES, QUESTIONS, SECTIONS, STATE_LABEL,
  answer, canSkipTo, closeSheet, completeCurrent, confirmSkip, initialState, next, nodeState, openSheet,
  progress, retry, skipPlan, skipSummary, startTest, testFailed, testPassed,
} from './demo-logic.js';
import { icon } from './icons.js';
import { track, trackOnce } from './track.js';

const XS = [175, 95, 175, 255]; // x pozice uzlů z 350 px, klikatka
const W = 350;
const TOP = 16;
const HEADER = 104;
const GAP = 184;
const LESSON_NODE = NODES.findIndex((n) => n.t === 'Falešný vnuk volá');
const LESSON_STEPS = LESSON.steps.length + 2; // hovory + pravidlo + shrnutí
const newLesson = () => ({ step: 0, shown: 1, pick: null });
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Průvodce ukázkou: na co ukazuje (selektor) a co říká.
const TOUR = [
  { target: () => '.app-bar', text: 'Tady vidíte, jak daleko jste. Počítají se hotové i přeskočené kroky.' },
  { target: (st) => `[data-i="${st.cur}"]`, text: 'Tahle lekce je teď na řadě. Klepnutím ji otevřete, zabere asi tři minuty.' },
  {
    target: (st) => `[data-i="${NODES.findIndex((n, i) => canSkipTo(st, i))}"]`,
    text: 'Zamčené lekce můžete přeskočit. Krátký test ověří, že to už umíte.',
  },
];


// Escapování + česká typografie: nerozdělovat čísla („40 000 Kč“) a nenechávat jednopísmenné předložky na konci řádku.
const esc = (t) =>
  String(t)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    .replace(/(?<=\d) (?=\d{3}\b|Kč)/g, '\u00a0')
    .replace(/(?<=(?:^|[\s\u00a0„(])[aikosuvzAIKOSUVZ]) /g, '\u00a0');

let root;
let s; // stav z demo-logic.js
let ui; // stav vzhledu: { view, lesson: { step, shown, pick }, dialog, unlocked, tour }
let returnTo = null; // kam vrátit focus po zavření dialogu
let reported = null; // aby se skip_pass / skip_fail poslal jen jednou za test
let onJoin = () => {};

export function initDemo(el, { onJoinClick }) {
  root = el;
  onJoin = onJoinClick;
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  new ResizeObserver(fitLines).observe(root);
  root.addEventListener('pointerdown', () => trackOnce('demo_start'), { once: true });
  root.addEventListener('keydown', () => trackOnce('demo_start'), { once: true });
  reset(false);
}

export function reset(focus = true) {
  s = initialState();
  ui = { view: 'path', lesson: newLesson(), dialog: null, unlocked: [], tour: 0 };
  returnTo = null;
  render({ scroll: 0, focus: focus ? '#tour-card' : null });
}

// ---------- vykreslení ----------

function layout() {
  const items = [];
  let y = TOP;
  let sec = null;
  NODES.forEach((n, i) => {
    if (n.s !== sec) {
      sec = n.s;
      items.push({ type: 'section', s: sec, y });
      y += HEADER;
    }
    items.push({ type: 'node', i, x: XS[i % XS.length], y: y + 36 });
    y += GAP;
  });
  return { items, height: y - GAP + 150 };
}

function pathView() {
  const { items, height } = layout();
  const nodes = items.filter((it) => it.type === 'node');
  const curves = nodes.slice(1).map((b, k) => {
    const a = nodes[k];
    const my = (a.y + b.y) / 2;
    const solid = b.i <= s.cur;
    return `<path d="M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}" data-from="${a.i}" data-to="${b.i}" class="${solid ? 'line-done' : 'line-todo'}"/>`;
  });

  const parts = items.map((it) => {
    if (it.type === 'section') {
      return `<li class="path-section" style="top:${it.y}px"><span class="path-section-num">Část ${it.s}</span>
        <span class="path-section-title">${esc(SECTIONS[it.s])}</span></li>`;
    }
    const n = NODES[it.i];
    const st = nodeState(s, it.i);
    const shape = n.k === 'lesson' ? 'round' : 'square';
    return `<li class="node node--${st}" style="top:${it.y}px;left:${(it.x / W) * 100}%;--w:${(Math.min(it.x, W - it.x) / W) * 200}%">
      <button type="button" class="node-btn" data-i="${it.i}">
        <span class="node-shape node-shape--${shape}" aria-hidden="true">${it.i + 1}</span>
        <span class="node-label">
          <span class="node-title">${esc(n.t)}</span><span class="sr-only">. </span>
          <span class="node-meta">${KIND_LABEL[n.k]} · <strong>${STATE_LABEL[st]}</strong></span>
        </span>
      </button></li>`;
  });

  return `<div class="path" style="height:${height}px">
      <svg class="path-lines" viewBox="0 0 ${W} ${height}" preserveAspectRatio="none" aria-hidden="true">${curves.join('')}</svg>
      <ol class="path-list" aria-label="Cesta lekcí">${parts.join('')}</ol>
    </div>`;
}

// Čáry vedou od spodku popisku k hornímu okraji dalšího uzlu, aby nikdy nešly přes text.
// Výška popisku závisí na šířce (zalamování), proto se měří až po vykreslení a při změně velikosti.
function fitLines() {
  const path = root.querySelector('.path');
  if (!path) return;
  // offsety místo getBoundingClientRect, aby výpočet nerozhodily animace (scale) uzlů
  const nodes = Object.fromEntries(layout().items.filter((it) => it.type === 'node').map((it) => [it.i, it]));
  const edges = (i) => {
    const label = path.querySelector(`[data-i="${i}"] .node-label`);
    const top = nodes[i].y - 36; // .node je posunutý o -36 px (polovina tvaru)
    return { top: top - 4, bottom: top + label.offsetTop + label.offsetHeight + 4 };
  };
  for (const p of path.querySelectorAll('.path-lines path')) {
    const a = nodes[p.dataset.from];
    const b = nodes[p.dataset.to];
    const y1 = edges(a.i).bottom;
    const y2 = edges(b.i).top;
    const my = (y1 + y2) / 2;
    p.setAttribute('d', `M${a.x} ${y1} C${a.x} ${my} ${b.x} ${my} ${b.x} ${y2}`);
    p.style.display = y2 - y1 < 8 ? 'none' : '';
  }
}

// Zpětná vazba bez ikon a barevných boxů: nadpis a text pod linkou, barvu nese jen linka a nadpis.
function feedbackBox(opt, id) {
  return `<div class="feedback feedback--${opt.k}" id="${id}" tabindex="-1">
      <p class="feedback-title">${esc(opt.title)}</p>
      <p>${esc(opt.fb)}</p>
    </div>`;
}

function optionList(options, picked, action) {
  return `<div class="choices">${options
    .map((o, k) => {
      const chosen = picked === k;
      return `<button type="button" class="choice${chosen ? ` choice--${o.k}` : ''}" data-action="${action}" data-k="${k}"
        ${picked !== null ? 'disabled' : ''}><span class="choice-letter" aria-hidden="true">${'ABCD'[k]}</span>${chosen ? '<span class="sr-only">Vaše volba: </span>' : ''}<span>${esc(o.t)}</span></button>`;
    })
    .join('')}</div>`;
}

function lessonHeader(stepNo) {
  const dots = Array.from({ length: LESSON_STEPS }, (_, k) =>
    `<span class="${k < stepNo ? 'seg seg--done' : k === stepNo ? 'seg seg--now' : 'seg'}"></span>`).join('');
  return `<div class="lesson-top">
      <button type="button" class="link-btn" data-action="lesson-close">Zpět na cestu</button>
      <p class="lesson-count">Krok ${stepNo + 1} z ${LESSON_STEPS}</p>
    </div>
    <div class="segs" aria-hidden="true">${dots}</div>`;
}

function lessonView() {
  const L = ui.lesson;
  if (typeof L.step === 'number') {
    const step = LESSON.steps[L.step];
    const lines = step.lines.slice(0, L.shown);
    const allShown = L.shown >= step.lines.length;
    const opt = L.pick !== null ? step.o[L.pick] : null;
    const last = L.step === LESSON.steps.length - 1;
    return `<div class="lesson">${lessonHeader(L.step)}
      <p class="eyebrow" id="lesson-start" tabindex="-1">Lekce · ${esc(NODES[LESSON_NODE].t)}</p>
      ${step.note ? `<p class="call-note">${esc(step.note)}</p>` : ''}
      <div class="call">
        <p class="call-head"><span class="call-sub">${L.step === 0 ? 'Příchozí hovor' : 'Volá znovu'}</span>
          <span class="call-name">${esc(LESSON.caller)}</span></p>
        <ol class="bubbles" aria-label="Co říká volající">
          ${lines.map((l, k) => `<li class="bubble${k === L.shown - 1 && L.shown > 1 ? ' bubble--new' : ''}" ${k === L.shown - 1 ? 'id="bubble-last" tabindex="-1"' : ''}>„${esc(l)}“</li>`).join('')}
        </ol>
      </div>
      ${!allShown ? `<button type="button" class="btn btn-secondary btn-block" data-action="lesson-more">Poslouchat dál</button>` : `
        <h3 class="lesson-q" id="lesson-q" tabindex="-1">${esc(step.q)}</h3>
        ${optionList(step.o, L.pick, 'lesson-answer')}
        ${opt ? feedbackBox(opt, 'lesson-fb') : ''}
        ${opt ? (opt.k === 'safe'
          ? `<button type="button" class="btn btn-primary btn-block" data-action="lesson-next">${last ? 'Na pravidlo' : 'Co se stane dál'}</button>`
          : `<button type="button" class="btn btn-secondary btn-block" data-action="lesson-again">Zkusit jinou odpověď</button>`) : ''}`}
    </div>`;
  }
  if (L.step === 'rule') {
    return `<div class="lesson">${lessonHeader(LESSON.steps.length)}
      <p class="eyebrow">Pravidlo z lekce</p>
      <div class="rule-card" tabindex="-1" id="lesson-rule">
        <p class="rule-lines">${LESSON.rule.map((r) => `<span>${esc(r)}</span>`).join('')}</p>
      </div>
      <p>Funguje to vždycky: když volá opravdu on, telefon zvedne. Když ne, právě jste zastavili podvod.</p>
      <button type="button" class="btn btn-primary btn-block" data-action="lesson-finish">Dokončit lekci</button>
    </div>`;
  }
  // Lekce hotová
  const unlocked = ui.unlocked.map((i) => NODES[i].t);
  const cont = `<button type="button" class="btn btn-primary btn-block" data-action="lesson-close">Pokračovat na cestu</button>`;
  return `<div class="lesson lesson-done">
    <p class="eyebrow">Lekce · ${esc(NODES[LESSON_NODE].t)}</p>
    <h3 id="lesson-done" tabindex="-1">Hotovo.</h3>
    <p class="takeaways-label">Co si z ní zapamatovat</p>
    <ul class="takeaways">${LESSON.takeaways.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${unlocked.length ? `<div class="unlock">
        <p class="unlock-label">Nově odemčeno</p>
        <p class="unlock-name">${esc(unlocked.join(', '))}</p>
        ${cont}
      </div>` : cont}
  </div>`;
}

function tourView() {
  const k = ui.tour;
  const last = k === TOUR.length - 1;
  return `<section class="tour" id="tour-card" tabindex="-1" aria-labelledby="tour-title">
      <p class="tour-count" id="tour-title">Průvodce · ${k + 1} ze ${TOUR.length}</p>
      <p class="tour-text" aria-live="polite">${esc(TOUR[k].text)}</p>
      <div class="tour-actions">
        <button type="button" class="btn btn-primary" data-action="tour-next">${last ? 'Vyzkoušet' : 'Další'}</button>
        ${last ? '' : '<button type="button" class="link-btn" data-action="tour-end">Přeskočit průvodce</button>'}
      </div>
    </section>`;
}

function sheetView() {
  const sh = s.sheet;
  const target = NODES[sh.target];
  let body;
  if (sh.step === 0) {
    body = `<h3 id="dlg-title" class="sheet-title">Už to umíte?</h3>
      <p>${esc(skipSummary(s, sh.target))}</p>
      <p>Krátký test má tři otázky. Když odpovíte správně na všechny, skočíte dopředu. Přeskočené kroky zůstanou na cestě.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="test-start">Udělat test</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="sheet-close">Zpět na cestu</button>
      </div>`;
  } else if (sh.step <= QUESTIONS.length) {
    const q = QUESTIONS[sh.step - 1];
    const opt = sh.picked !== null ? q.o[sh.picked] : null;
    const last = sh.step === QUESTIONS.length;
    body = `<p class="eyebrow">Otázka ${sh.step} ze ${QUESTIONS.length}</p>
      <h3 id="dlg-title" class="sheet-title">${esc(q.q)}</h3>
      ${optionList(q.o, sh.picked, 'test-answer')}
      ${opt ? feedbackBox(opt, 'test-fb') : ''}
      ${opt ? `<button type="button" class="btn btn-primary btn-block" data-action="test-next">${last ? 'Zobrazit výsledek' : 'Další otázka'}</button>` : ''}`;
  } else if (testPassed(s)) {
    body = `<div class="result result--ok">
        <p class="eyebrow">Výsledek testu</p>
        <h3 id="dlg-title" class="result-title">Správně všechny tři.</h3>
        <p>Tohle už umíte. Můžete skočit dopředu.</p>
      </div>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="skip-confirm">Skočit na „${esc(target.t)}“</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="sheet-close">Zůstat, kde jsem</button>
      </div>`;
  } else {
    const plan = skipPlan(s, sh.target);
    const rec = NODES[plan.find((k) => NODES[k].k === 'lesson') ?? s.cur];
    body = `<div class="result result--warn">
        <p class="eyebrow">Výsledek testu · správně ${sh.score} ze ${QUESTIONS.length}</p>
        <h3 id="dlg-title" class="result-title">Tentokrát to nevyšlo.</h3>
        <p>Doporučujeme nejdřív projít lekci „${esc(rec.t)}“. Test můžete zkusit znovu, kdykoli chcete.</p>
      </div>
      <div class="sheet-actions">
        ${s.cur === LESSON_NODE ? `<button type="button" class="btn btn-primary btn-block" data-action="lesson-open">Projít lekci</button>` : ''}
        <button type="button" class="btn btn-secondary btn-block" data-action="test-retry">Zkusit test znovu</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="sheet-close">Zpět na cestu</button>
      </div>`;
  }
  return `<div class="backdrop" data-action="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <button type="button" class="icon-btn sheet-x" data-action="sheet-close" aria-label="Zavřít">${icon('X')}</button>
      ${body}
    </div>`;
}

function dialogView() {
  const d = ui.dialog;
  const n = NODES[d.i];
  let body;
  if (d.type === 'full') {
    body = `<p class="eyebrow">Připravujeme</p>
      <h3 id="dlg-title">Tohle už je v plné verzi.</h3>
      <p>„${esc(n.t)}“ připravujeme. Zapište se a dáme vám vědět.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="join">Zapsat se</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="dialog-close">Zavřít</button>
      </div>`;
  } else {
    let prev = d.i - 1;
    while (prev > 0 && NODES[prev].opt) prev--;
    body = `<p class="eyebrow">Nepovinné cvičení</p>
      <h3 id="dlg-title">Zatím zamčeno</h3>
      <p>„${esc(n.t)}“ je nepovinné cvičení. Odemkne se, až dokončíte lekci „${esc(NODES[prev].t)}“.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="dialog-close">Rozumím</button>
      </div>`;
  }
  return `<div class="backdrop" data-action="dialog-close"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">${body}</div>`;
}

function render({ focus, scroll, anim } = {}) {
  const prevScroll = root.querySelector('.screen-scroll')?.scrollTop ?? 0;
  const p = progress(s);
  const modal = s.sheet ? sheetView() : ui.dialog ? dialogView() : '';
  const tour = ui.tour !== null && ui.view === 'path' && !modal;
  root.innerHTML = `<div class="screen"${anim ? ` data-anim="${anim}"` : ''}>
      ${tour ? tourView() : ''}
      <div class="app-bar" ${modal ? 'inert' : ''}>
        <p class="app-title">${ui.view === 'path' ? 'Vaše cesta' : 'Lekce'}</p>
        <p class="app-progress">Hotovo ${p.done} z ${p.total}${p.skipped ? `, přeskočeno ${p.skipped}` : ''}</p>
        <div class="bar" aria-hidden="true"><span style="width:${((p.done + p.skipped) / p.total) * 100}%"></span></div>
      </div>
      <div class="screen-scroll" ${modal ? 'inert' : ''}>${ui.view === 'path' ? pathView() : lessonView()}</div>
      ${modal}
      <p class="sr-only" aria-live="polite" id="demo-live"></p>
    </div>`;

  const scroller = root.querySelector('.screen-scroll');
  fitLines();
  scroller.scrollTop = scroll ?? prevScroll;
  setPageInert(!!modal);

  if (tour) {
    const target = root.querySelector(TOUR[ui.tour].target(s));
    if (target) {
      target.classList.add('tour-target');
      if (scroller.contains(target)) scrollAboveTour(scroller, target, root.querySelector('.tour'));
    }
  }

  const el = focus ? root.querySelector(focus) : modal ? root.querySelector('.sheet .btn, .dialog .btn, [role="dialog"] .choice') : null;
  if (el) {
    el.focus({ preventScroll: true });
    if (scroller.contains(el)) keepVisible(scroller, el, anim === 'skip');
  }
}

function keepVisible(scroller, el, smooth) {
  const r = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  if (r.top < sr.top || r.bottom > sr.bottom) {
    if (smooth && !reduceMotion()) {
      // Krátce ukázat starou pozici a pak plynule sjet na nový cíl, ať je skok vidět.
      requestAnimationFrame(() => scroller.scrollBy({ top: r.top - sr.top - sr.height / 3, behavior: 'smooth' }));
    } else scroller.scrollTop += r.top - sr.top - sr.height / 3;
  }
}

// Cíl průvodce vystředit do volného místa nad kartou průvodce, ať ho karta nezakryje i s popiskem.
function scrollAboveTour(scroller, el, tour) {
  const r = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  const ring = 14; // obrys .tour-target (outline + offset) a kousek vzduchu
  const free = (tour ? tour.getBoundingClientRect().top : sr.bottom) - sr.top;
  const slack = Math.max(ring, (free - r.height) / 2);
  scroller.scrollTop += r.top - sr.top - slack;
}

// Modální dialog: zbytek stránky je po dobu dialogu neaktivní (inert), focus se vrátí na původní prvek.
function setPageInert(on) {
  let el = root;
  while (el && el !== document.body) {
    for (const sib of el.parentElement.children) {
      if (sib !== el && sib.tagName !== 'SCRIPT') sib.inert = on;
    }
    el = el.parentElement;
  }
}

function announce(text) {
  const live = root.querySelector('#demo-live');
  setTimeout(() => (live.textContent = text), 50);
}

// ---------- ovládání ----------

function onClick(e) {
  const nodeBtn = e.target.closest('[data-i]');
  if (nodeBtn) return tapNode(Number(nodeBtn.dataset.i));
  const a = e.target.closest('[data-action]');
  if (a) act(a.dataset.action, a.dataset.k !== undefined ? Number(a.dataset.k) : null);
}

function onKey(e) {
  if (e.key !== 'Escape') return;
  if (s.sheet) act('sheet-close');
  else if (ui.dialog) act('dialog-close');
}

function endTour(reason) {
  if (ui.tour === null) return;
  track('demo_tour', { step: ui.tour + 1, end: reason });
  ui.tour = null;
}

function tapNode(i) {
  const st = nodeState(s, i);
  endTour('tap');
  returnTo = `[data-i="${i}"]`;
  if (canSkipTo(s, i)) {
    s = openSheet(s, i);
    reported = null;
    track('skip_open', { target: NODES[i].t });
    return render({ anim: 'sheet' });
  }
  if (st === 'locked') {
    ui.dialog = { type: 'opt-locked', i };
    return render({ anim: 'dialog' });
  }
  if (i === LESSON_NODE && st === 'current') return openLesson();
  ui.dialog = { type: 'full', i };
  track('demo_locked_tap', { node: NODES[i].t });
  render({ anim: 'dialog' });
}

function openLesson() {
  s = closeSheet(s);
  ui = { ...ui, view: 'lesson', lesson: newLesson(), dialog: null, tour: null };
  render({ scroll: 0, focus: '#lesson-start', anim: 'screen' });
}

function act(action, k) {
  switch (action) {
    case 'sheet-close':
      s = closeSheet(s);
      render({ focus: returnTo });
      break;
    case 'dialog-close':
      ui.dialog = null;
      render({ focus: returnTo });
      break;
    case 'join':
      ui.dialog = null;
      render();
      onJoin();
      break;
    case 'test-start':
      s = startTest(s);
      render();
      break;
    case 'test-answer':
      s = answer(s, k);
      render({ focus: '#test-fb' });
      break;
    case 'test-next':
      s = next(s);
      if (s.sheet.step > QUESTIONS.length && reported !== s.sheet) {
        reported = s.sheet;
        track(testPassed(s) ? 'skip_pass' : 'skip_fail', { target: NODES[s.sheet.target].t });
      }
      render();
      break;
    case 'test-retry':
      s = retry(s);
      reported = null;
      render();
      break;
    case 'skip-confirm': {
      const t = NODES[s.sheet.target].t;
      s = confirmSkip(s);
      render({ focus: `[data-i="${s.cur}"]`, anim: 'skip' });
      announce(`Skočili jste na „${t}“. Přeskočené kroky zůstávají na cestě.`);
      break;
    }
    case 'lesson-open':
      openLesson();
      break;
    case 'tour-next':
      if (ui.tour === TOUR.length - 1) {
        endTour('done');
        render({ focus: `[data-i="${s.cur}"]` });
      } else {
        ui.tour++;
        render({ focus: '#tour-card' });
      }
      break;
    case 'tour-end':
      endTour('skip');
      render({ focus: `[data-i="${s.cur}"]` });
      break;
    case 'lesson-more':
      ui.lesson.shown++;
      render({ focus: '#bubble-last' });
      break;
    case 'lesson-answer':
      ui.lesson.pick = k;
      render({ focus: '#lesson-fb' });
      break;
    case 'lesson-again':
      ui.lesson.pick = null;
      render({ focus: '#lesson-q' });
      break;
    case 'lesson-next': {
      const n = ui.lesson.step + 1;
      ui.lesson = n < LESSON.steps.length ? newLesson() : { step: 'rule' };
      if (n < LESSON.steps.length) ui.lesson.step = n;
      render({ scroll: 0, focus: n < LESSON.steps.length ? '#lesson-start' : '#lesson-rule', anim: 'screen' });
      break;
    }
    case 'lesson-finish': {
      const before = s.cur;
      s = completeCurrent(s);
      ui.unlocked = NODES.map((_, i) => i).filter((i) => NODES[i].opt && i > before && i < s.cur);
      ui.lesson = { step: 'done' };
      track('lesson_done', { lesson: NODES[before].t });
      render({ scroll: 0, focus: '#lesson-done', anim: 'done' });
      break;
    }
    case 'lesson-close':
      ui = { ...ui, view: 'path', lesson: newLesson() };
      render({ scroll: 0, focus: `[data-i="${s.cur}"]`, anim: 'skip' });
      break;
  }
}
