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

// Test pro skok dopředu. Otázky odpovídají lekcím, které se přeskakují (hlas, video, banka).
// Správná odpověď má k === 'safe'. Projde jen ten, kdo odpoví správně na všechny.
export const QUESTIONS = [
  {
    q: 'Na displeji svítí „Petra“, číslo vaší dcery. V telefonu je slyšet její pláč: měla nehodu a zadržela ji policie. Pak hovor převezme „advokát“ a chce dnes 120 000 Kč na kauci. Co uděláte?',
    o: [
      { t: 'Zeptám se advokáta na jméno a číslo kanceláře a zavolám mu tam zpátky.', k: 'partial', title: 'Dobrý nápad, ale nestačí.', fb: 'Číslo vám nadiktuje sám volající a zvedne ho jeho komplic. Ověřujte jen přes čísla, která jste si uložili sami.' },
      { t: 'Zavěsím a zavolám Petře sama, na číslo z kontaktů.', k: 'safe', title: 'Správně.', fb: 'Číslo na displeji se dá podvrhnout a telefon pak ukáže jméno, které máte uložené. Když zavoláte vy, dovoláte se opravdu Petře.' },
      { t: 'Volá z Petřina čísla a je to její hlas. Peníze připravím.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Podvodníci umí podvrhnout číslo na displeji a AI napodobí hlas z pár vteřin videa. Ani jedno samo nic nedokazuje.' },
    ],
  },
  {
    q: 'Na Facebooku vidíte video: známý moderátor zpráv doporučuje investiční platformu, která „garantuje“ 8 % měsíčně. Hlas i pohyb úst sedí. Pod videem jsou stovky nadšených komentářů. Co z toho plyne?',
    o: [
      { t: 'Takhle dobře se video zfalšovat nedá. Za zkoušku malou částkou nic nedám.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'AI dnes vyrobí přesvědčivé video s hlasem i mimikou kohokoli známého. A malá vložená částka je u investičních podvodů jen první krok.' },
      { t: 'Zkontroluju komentáře a recenze, jestli to lidem opravdu funguje.', k: 'partial', title: 'Rozumná myšlenka, ale tady nepomůže.', fb: 'Komentáře i recenze často píšou falešné účty stejných podvodníků. Spolehlivější je zeptat se, kdo nabídku skutečně dělá.' },
      { t: 'Nic. Video může být vyrobené AI a garantovaný vysoký výnos je sám o sobě varování.', k: 'safe', title: 'Správně.', fb: 'Žádná poctivá investice neslibuje jistý vysoký výnos. Známá tvář ve videu nic nedokazuje, AI ji umí napodobit.' },
    ],
  },
  {
    q: 'Volá „bezpečnostní oddělení“ vaší banky. Zná vaše jméno i poslední čtyři čísla karty. Někdo prý právě zkouší vybrat vaše peníze a abyste o ně nepřišli, máte je hned převést na „bezpečný účet“. Co uděláte?',
    o: [
      { t: 'Zavěsím a zavolám do banky sama, na číslo z karty nebo z bankovní aplikace.', k: 'safe', title: 'Správně.', fb: 'Banka po vás nikdy nebude chtít převádět peníze na jiný účet. Když zavoláte vy na oficiální číslo, víte, s kým mluvíte.' },
      { t: 'Peníze převádět nebudu, ale kód z SMS, který mi právě přišel, mu potvrdím.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Kód z SMS je klíč k vašemu účtu. Kdo ho zná, může poslat platbu za vás. Neříkejte ho nikomu, ani „bance“.' },
      { t: 'Zná moje údaje, takže je z banky. Udělám, co říká.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Osobní údaje unikají a dají se koupit. Že je volající zná, nedokazuje, že volá banka. „Bezpečný účet“ neexistuje.' },
    ],
  },
];

// Lekce "Falešný vnuk volá": hovor se odvíjí po větách, dvě rozhodnutí, pravidlo a shrnutí.
// Každý krok: popis situace (note, nepovinné), věty volajícího (lines), otázka (q) a volby. Na další krok se jde jen po bezpečné volbě.
export const LESSON = {
  caller: 'Neznámé číslo',
  steps: [
    {
      lines: [
        'Babi? Ahoj, to jsem já, Tomáš.',
        'Volám z cizího telefonu, ten můj se rozbil. Měl jsem nehodu, nic mi není, ale naboural jsem auto.',
        'Ten pán chce hned 40 000 na opravu, jinak volá policii a přijdu o řidičák. Prosím, neříkej to mámě.',
      ],
      q: 'Hlas zní jako Tomáš, jen trochu přidušeně. Co uděláte?',
      o: [
        { t: 'Zeptám se ho, jak se jmenoval náš první pes. To ví jen on.', k: 'partial', title: 'Dobrý instinkt, ale nestačí.', fb: 'Jméno psa se dá najít na sociálních sítích. A když odpověď nezná, vymluví se: „Babi, teď ne, prosím.“ Kontrolní otázka podvodníka nezastaví.' },
        { t: 'Řeknu, že mu hned zavolám zpátky, zavěsím a vytočím Tomáše z kontaktů.', k: 'safe', title: 'Správně.', fb: 'Zpětný hovor na uložené číslo je jediné spolehlivé ověření. Skutečný vnuk to pochopí.' },
        { t: 'Domluvím se, že peníze předám jeho kamarádovi, který se pro ně staví.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Přesně tak to podvodníci dělají. „Kamarád“ nebo „kurýr“ je jejich komplic a peníze už neuvidíte.' },
      ],
    },
    {
      note: 'Zavěsili jste a Tomáš to nebere. Telefon za chvíli zazvoní znovu, zase z toho neznámého čísla.',
      lines: [
        'Babi, proč jsi to položila?! Říkám ti, že ten mobil je rozbitej, tam se mi nedovoláš!',
        'Nemám čas, ten pán už vytáčí policii. Tak pošli aspoň dvacet, prosím tě.',
      ],
      q: 'Tlačí na vás a Tomášovi se nedovoláte. Co teď?',
      o: [
        { t: 'Pošlu aspoň polovinu, ať nemá problém s policií.', k: 'danger', title: 'Pozor, tohle je past.', fb: 'Kdo pošle polovinu, přijde o polovinu. A podvodník se ozve znovu s dalším důvodem.' },
        { t: 'Zase zavěsím a zavolám jeho mámě nebo někomu z rodiny na uložené číslo.', k: 'safe', title: 'Správně.', fb: 'Když se nedovoláte jemu, ověřte to přes někoho, kdo ho zná. Spěch a „neříkej to mámě“ jsou typické znaky podvodu.' },
        { t: 'Řeknu mu, ať mi pošle fotku nabouraného auta, pak uvěřím.', k: 'partial', title: 'Lepší než platit, ale nestačí.', fb: 'Fotku najde na internetu nebo ji vyrobí AI za pár vteřin. Ověřujte lidi, ne důkazy, které vám pošle volající.' },
      ],
    },
  ],
  rule: ['Zavěste.', 'Zavolejte zpátky.', 'Na číslo, které máte v telefonu uložené.'],
  takeaways: [
    'Hlas lze napodobit z pár vteřin videa na sociálních sítích.',
    'Spěch a „nikomu to neříkej“ jsou znaky podvodu.',
    'Když se nedovoláte, ověřte to přes někoho z rodiny.',
  ],
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