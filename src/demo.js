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

const STATE_ICON = { done: 'Check', current: 'Play', locked: 'Lock', skipped: 'SkipForward', bonus: 'Gift' };
const FEEDBACK = {
  safe: { cls: 'note-ok', icon: 'CircleCheck' },
  danger: { cls: 'note-warn', icon: 'TriangleAlert' },
  partial: { cls: 'note-info', icon: 'Info' },
};

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let root;
let s; // stav z demo-logic.js
let ui; // stav vzhledu: { view, lessonStep, lessonPick, dialog, unlocked }
let returnTo = null; // kam vrátit focus po zavření dialogu
let reported = null; // aby se skip_pass / skip_fail poslal jen jednou za test
let onJoin = () => {};

export function initDemo(el, { onJoinClick }) {
  root = el;
  onJoin = onJoinClick;
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  root.addEventListener('pointerdown', () => trackOnce('demo_start'), { once: true });
  root.addEventListener('keydown', () => trackOnce('demo_start'), { once: true });
  reset(false);
}

export function reset(focus = true) {
  s = initialState();
  ui = { view: 'path', lessonStep: 'question', lessonPick: null, dialog: null, unlocked: [] };
  returnTo = null;
  render({ scroll: 0 });
  if (focus) root.querySelector(`[data-i="${s.cur}"]`)?.focus({ preventScroll: true });
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
    return `<path d="M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}" class="${solid ? 'line-done' : 'line-todo'}"/>`;
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
        <span class="node-shape node-shape--${shape}">${icon(STATE_ICON[st], 30)}</span>
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

function feedbackBox(opt, id) {
  const f = FEEDBACK[opt.k];
  return `<div class="note ${f.cls}" id="${id}" tabindex="-1">
      <span class="note-icon">${icon(f.icon)}</span>
      <div><p class="note-title">${esc(opt.title)}</p><p>${esc(opt.fb)}</p></div>
    </div>`;
}

function optionList(options, picked, action) {
  return `<div class="choices">${options
    .map((o, k) => {
      const chosen = picked === k;
      const mark = chosen ? `<span class="choice-mark">${icon(FEEDBACK[o.k].icon, 22)}<span class="sr-only">Vaše volba: </span></span>` : '';
      return `<button type="button" class="choice${chosen ? ` choice--${o.k}` : ''}" data-action="${action}" data-k="${k}"
        ${picked !== null ? 'disabled' : ''}>${mark}<span>${esc(o.t)}</span></button>`;
    })
    .join('')}</div>`;
}

function lessonView() {
  const back = `<button type="button" class="link-btn" data-action="lesson-close">Zpět na cestu</button>`;
  if (ui.lessonStep === 'question') {
    const pick = ui.lessonPick;
    const opt = pick !== null ? LESSON.options[pick] : null;
    return `<div class="lesson">${back}
      <p class="eyebrow" id="lesson-start" tabindex="-1">Lekce · ${esc(NODES[LESSON_NODE].t)}</p>
      <div class="call-card">
        <p class="call-label">${icon('Phone', 22)}Volá neznámé číslo</p>
        <p class="call-quote">${esc(LESSON.scenario)}</p>
      </div>
      <h3 class="lesson-q" id="lesson-q">${esc(LESSON.question)}</h3>
      ${optionList(LESSON.options, pick, 'lesson-answer')}
      ${opt ? feedbackBox(opt, 'lesson-fb') : ''}
      ${opt ? (opt.k === 'safe'
        ? `<button type="button" class="btn btn-primary btn-block" data-action="lesson-rule">Dál</button>`
        : `<button type="button" class="btn btn-secondary btn-block" data-action="lesson-again">Zkusit jinou odpověď</button>`) : ''}
    </div>`;
  }
  if (ui.lessonStep === 'rule') {
    return `<div class="lesson">${back}
      <p class="eyebrow">Pravidlo z lekce</p>
      <div class="rule-card rule-card--small" tabindex="-1" id="lesson-rule">
        <span class="rule-icon">${icon('PhoneOff', 32)}</span>
        <p class="rule-lines">${LESSON.rule.map((r) => `<span>${esc(r)}</span>`).join('')}</p>
      </div>
      <button type="button" class="btn btn-primary btn-block" data-action="lesson-finish">Dokončit lekci</button>
    </div>`;
  }
  // Lekce hotová
  const unlocked = ui.unlocked.map((i) => NODES[i].t);
  return `<div class="lesson lesson-done">
    <span class="done-icon">${icon('CircleCheck', 56)}</span>
    <h3 id="lesson-done" tabindex="-1">Lekce hotová</h3>
    <p>Pamatujte si: zavěste a zavolejte zpátky na číslo, které znáte.</p>
    ${unlocked.length ? `<div class="unlock-box">
        <p class="unlock-title">${icon('Gift', 26)}Odemklo se: ${esc(unlocked.join(', '))}</p>
        <button type="button" class="btn btn-primary btn-block" data-action="lesson-close">Pokračovat na cestu</button>
      </div>` : `<button type="button" class="btn btn-primary btn-block" data-action="lesson-close">Pokračovat na cestu</button>`}
  </div>`;
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
    body = `<div class="note note-ok"><span class="note-icon">${icon('CircleCheck')}</span>
        <div><h3 id="dlg-title" class="note-title">Správně všechny tři.</h3><p>Tohle už umíte. Můžete skočit dopředu.</p></div></div>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="skip-confirm">Skočit na „${esc(target.t)}“</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="sheet-close">Zůstat, kde jsem</button>
      </div>`;
  } else {
    const plan = skipPlan(s, sh.target);
    const rec = NODES[plan.find((k) => NODES[k].k === 'lesson') ?? s.cur];
    body = `<div class="note note-warn"><span class="note-icon">${icon('TriangleAlert')}</span>
        <div><h3 id="dlg-title" class="note-title">Tentokrát to nevyšlo.</h3>
        <p>Správně ${sh.score} ze ${QUESTIONS.length}. Doporučujeme nejdřív projít lekci „${esc(rec.t)}“. Test můžete zkusit znovu, kdykoli chcete.</p></div></div>
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
    body = `<span class="dialog-icon">${icon('Lock', 32)}</span>
      <h3 id="dlg-title">Tohle už je v plné verzi.</h3>
      <p>„${esc(n.t)}“ připravujeme. Zapište se a dáme vám vědět.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="join">Zapsat se</button>
        <button type="button" class="btn btn-secondary btn-block" data-action="dialog-close">Zavřít</button>
      </div>`;
  } else {
    let prev = d.i - 1;
    while (prev > 0 && NODES[prev].opt) prev--;
    body = `<span class="dialog-icon">${icon('Lock', 32)}</span>
      <h3 id="dlg-title">Zatím zamčeno</h3>
      <p>„${esc(n.t)}“ je nepovinné cvičení. Odemkne se, až dokončíte lekci „${esc(NODES[prev].t)}“.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="dialog-close">Rozumím</button>
      </div>`;
  }
  return `<div class="backdrop" data-action="dialog-close"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">${body}</div>`;
}

function render({ focus, scroll } = {}) {
  const prevScroll = root.querySelector('.screen-scroll')?.scrollTop ?? 0;
  const p = progress(s);
  const modal = s.sheet ? sheetView() : ui.dialog ? dialogView() : '';
  root.innerHTML = `<div class="screen">
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
  scroller.scrollTop = scroll ?? prevScroll;
  setPageInert(!!modal);

  const el = focus ? root.querySelector(focus) : modal ? root.querySelector('.sheet .btn, .dialog .btn, [role="dialog"] .choice') : null;
  if (el) {
    el.focus({ preventScroll: true });
    if (scroller.contains(el)) keepVisible(scroller, el);
  }
}

function keepVisible(scroller, el) {
  const r = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  if (r.top < sr.top || r.bottom > sr.bottom) scroller.scrollTop += r.top - sr.top - sr.height / 3;
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

function tapNode(i) {
  const st = nodeState(s, i);
  returnTo = `[data-i="${i}"]`;
  if (canSkipTo(s, i)) {
    s = openSheet(s, i);
    reported = null;
    track('skip_open', { target: NODES[i].t });
    return render();
  }
  if (st === 'locked') {
    ui.dialog = { type: 'opt-locked', i };
    return render();
  }
  if (i === LESSON_NODE && st === 'current') return openLesson();
  ui.dialog = { type: 'full', i };
  track('demo_locked_tap', { node: NODES[i].t });
  render();
}

function openLesson() {
  s = closeSheet(s);
  ui = { ...ui, view: 'lesson', lessonStep: 'question', lessonPick: null, dialog: null };
  render({ scroll: 0, focus: '#lesson-start' });
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
      render({ focus: `[data-i="${s.cur}"]` });
      announce(`Skočili jste na „${t}“. Přeskočené kroky zůstávají na cestě.`);
      break;
    }
    case 'lesson-open':
      openLesson();
      break;
    case 'lesson-answer':
      ui.lessonPick = k;
      render({ focus: '#lesson-fb' });
      break;
    case 'lesson-again':
      ui.lessonPick = null;
      render({ focus: '.lesson .choice' });
      break;
    case 'lesson-rule':
      ui.lessonStep = 'rule';
      render({ scroll: 0, focus: '#lesson-rule' });
      break;
    case 'lesson-finish': {
      const before = s.cur;
      s = completeCurrent(s);
      ui.unlocked = NODES.map((_, i) => i).filter((i) => NODES[i].opt && i > before && i < s.cur);
      ui.lessonStep = 'done';
      track('lesson_done', { lesson: NODES[before].t });
      render({ scroll: 0, focus: '#lesson-done' });
      break;
    }
    case 'lesson-close':
      ui = { ...ui, view: 'path', lessonStep: 'question', lessonPick: null };
      render({ scroll: 0, focus: `[data-i="${s.cur}"]` });
      break;
  }
}
