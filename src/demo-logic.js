// Logika dema "cesta s přeskakováním". Čistý JavaScript bez závislostí, žádný framework.
// Všechny funkce jsou čisté: berou stav a vrací nový stav. Vzhled si řeší stránka.
// Přenos z návrhu: stavy uzlů, test pro skok dopředu, pravidla odemykání.

export const NODES = [
  { s: 1, t: 'Co AI dnes umí', k: 'lesson' },
  { s: 1, t: 'Podezřelá zpráva', k: 'lesson' },
  { s: 1, t: 'Falešný vnuk volá', k: 'lesson' },
  { s: 1, t: 'Kopie vašeho hlasu', k: 'voice', opt: true }, // nepovinné cvičení
  { s: 1, t: 'Falešné fotky a videa', k: 'lesson' },
  { s: 1, t: 'AI, nebo člověk?', k: 'game' },
  { s: 1, t: 'Falešný bankéř', k: 'lesson' },
  { s: 2, t: 'Jak se AI zeptat', k: 'lesson' },
  { s: 2, t: 'Chat s AI', k: 'chat' },
  { s: 2, t: 'AI pro koníčky', k: 'lesson' },
  { s: 2, t: 'Kdy se AI mýlí', k: 'lesson' },
];

export const SECTIONS = { 1: 'Chraňte se před podvody', 2: 'AI jako pomocník' };
export const KIND_LABEL = { lesson: 'Lekce', game: 'Hra', chat: 'Cvičení', voice: 'Nepovinné' };
export const STATE_LABEL = {
  done: 'Hotovo',
  current: 'Teď na řadě',
  locked: 'Zamčeno',
  skipped: 'Přeskočeno',
  bonus: 'Odemčeno',
};
export const REQUIRED = NODES.filter((n) => !n.opt).length;

// Test pro skok dopředu. Pro skutečný produkt mají otázky odpovídat přeskočeným lekcím.
// Správná odpověď má k === 'safe'. Projde jen ten, kdo odpoví správně na všechny.
export const QUESTIONS = [
  {
    q: 'Volá vám „vnuk“ z neznámého čísla a chce hned peníze. Co uděláte?',
    o: [
      { t: 'Pošlu je. Zní přesně jako on.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Hlas se dá napodobit z krátké nahrávky, třeba z videa na Facebooku. Že zní povědomě, nic nedokazuje.' },
      { t: 'Zavěsím a zavolám mu na číslo, které mám uložené.', k: 'safe', title: 'Správně.', fb: 'Když to byl opravdu vnuk, telefon zvedne. Když ne, právě jste zastavili podvod.' },
      { t: 'Zeptám se ho na něco, co ví jen on.', k: 'partial', title: 'Dobrý nápad, ale nestačí.', fb: 'Podvodník toho o rodině vyčte z internetu. Jistější je zavěsit a zavolat zpátky.' },
    ],
  },
  {
    q: 'Hlas zní přesně jako váš vnuk. Co z toho plyne?',
    o: [
      { t: 'Že volá opravdu on.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Hlas umí počítač napodobit. Povědomý hlas nic neprokazuje.' },
      { t: 'Nic. Na hlas se spolehnout nemůžu.', k: 'safe', title: 'Správně.', fb: 'Dobrá kopie hlasu se často nedá od pravého poznat. Rozhoduje ověření zpětným hovorem.' },
      { t: 'Že má jen nachlazení.', k: 'danger', title: 'Pozor, to je výmluva.', fb: 'Právě takovou výmluvou podvodník vysvětlí, proč hlas zní trochu jinak.' },
    ],
  },
  {
    q: 'Volající říká: „Hned to udělej a nikomu to neříkej.“ Co to znamená?',
    o: [
      { t: 'Podvodník tlačí na spěch a tajnost.', k: 'safe', title: 'Správně.', fb: 'Spěch a tajemství jsou typické znaky podvodu. Skutečný vnuk by vám dal čas.' },
      { t: 'Opravdu to spěchá, musím poslechnout.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Právě spěch má zabránit tomu, abyste si to ověřili.' },
      { t: 'Pošlu aspoň polovinu.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Kdo platí část, přijde o část. Zavěste a zavolejte zpátky.' },
    ],
  },
];

// Lekce "Falešný vnuk volá": scénář, volby se zpětnou vazbou, pravidlo.
export const LESSON = {
  scenario: '„Babi, to jsem já, Tomáš. Měl jsem nehodu a potřebuju hned 40 000 Kč. Prosím, neříkej to mámě.“',
  question: 'Co uděláte?',
  options: QUESTIONS[0].o,
  rule: ['Zavěste.', 'Zavolejte zpátky.', 'Na číslo, které máte v telefonu uložené.'],
};

// ---------- stav ----------
export function initialState() {
  // Výchozí stav ukázky: 1 přeskočeno kvízem, 1 hotovo, 3. lekce je na řadě.
  return { cur: 2, done: [1], skipped: [0], sheet: null };
}

export function nodeState(s, i) {
  if (s.done.includes(i)) return 'done';
  if (s.skipped.includes(i)) return 'skipped';
  if (i === s.cur) return 'current';
  if (NODES[i].opt && i < s.cur) return 'bonus';
  return 'locked';
}

export function progress(s) {
  const req = NODES.map((n, i) => i).filter((i) => !NODES[i].opt);
  return {
    total: REQUIRED,
    done: req.filter((i) => s.done.includes(i)).length,
    skipped: req.filter((i) => s.skipped.includes(i)).length,
  };
}

// Co se přeskočí, když uživatel skočí na uzel i (povinné kroky mezi aktuálním a cílem).
export function skipPlan(s, i) {
  const out = [];
  for (let k = s.cur; k < i; k++) {
    if (!NODES[k].opt && !s.done.includes(k) && !s.skipped.includes(k)) out.push(k);
  }
  return out;
}

const plural = (n, f) => (n === 1 ? f[0] : n < 5 ? f[1] : f[2]);

export function skipSummary(s, i) {
  const plan = skipPlan(s, i);
  const lessons = plan.filter((k) => NODES[k].k === 'lesson').length;
  const exercises = plan.length - lessons;
  const parts = [];
  if (lessons) parts.push(`${lessons} ${plural(lessons, ['lekci', 'lekce', 'lekcí'])}`);
  if (exercises) parts.push(`${exercises} cvičení`);
  return `Chcete skočit rovnou na „${NODES[i].t}“? Přeskočíte ${parts.join(' a ')}.`;
}

// Zamčený povinný uzel jde přeskočit testem. Zamčený nepovinný ne (odemkne ho lekce před ním).
export const canSkipTo = (s, i) => nodeState(s, i) === 'locked' && !NODES[i].opt;

export function openSheet(s, i) {
  if (!canSkipTo(s, i)) return s;
  return { ...s, sheet: { target: i, step: 0, picked: null, score: 0 } };
}
export const startTest = (s) => (s.sheet ? { ...s, sheet: { ...s.sheet, step: 1, picked: null, score: 0 } } : s);
export function answer(s, k) {
  const sh = s.sheet;
  if (!sh || sh.step < 1 || sh.step > 3 || sh.picked !== null) return s;
  const opt = QUESTIONS[sh.step - 1].o[k];
  return { ...s, sheet: { ...sh, picked: k, score: sh.score + (opt.k === 'safe' ? 1 : 0) } };
}
export function next(s) {
  const sh = s.sheet;
  if (!sh || sh.picked === null) return s;
  return { ...s, sheet: { ...sh, step: sh.step + 1, picked: null } };
}
export const testPassed = (s) => !!s.sheet && s.sheet.step === 4 && s.sheet.score === QUESTIONS.length;
export const testFailed = (s) => !!s.sheet && s.sheet.step === 4 && s.sheet.score !== QUESTIONS.length;
export const retry = (s) => startTest(s);
export const closeSheet = (s) => ({ ...s, sheet: null });

export function confirmSkip(s) {
  if (!testPassed(s)) return s;
  const t = s.sheet.target;
  return { ...s, skipped: s.skipped.concat(skipPlan(s, t)), cur: t, sheet: null };
}

// Dokončení aktuální lekce nebo cvičení: posun na další povinný krok. Nepovinné uzly se odemknou samy.
export function completeCurrent(s) {
  let n = s.cur + 1;
  while (n < NODES.length && NODES[n].opt) n++;
  return { ...s, done: s.done.concat(s.cur), cur: Math.min(n, NODES.length - 1) };
}