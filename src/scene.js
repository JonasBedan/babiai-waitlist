// Pohyb stránky: úvodní scéna (z noci vyjede telefon s ukázkou), odhalování kapitol,
// plovoucí tlačítko k zápisu, tisk kartičky. Jen transform, opacity a barva pozadí.
// Na malých a nízkých obrazovkách a při prefers-reduced-motion je úvod obyčejně pod sebou.
import { tileUrl } from './patterns.js';
import { track } from './track.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
// stejná podmínka jako v CSS (.intro jako scéna)
const sceneMQ = matchMedia('(min-width: 1100px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)');
const clamp = (v) => Math.min(1, Math.max(0, v));

// ---------- úvod: posouvání přehraje přechod z úvodu do ukázky ----------
function initIntro() {
  const intro = document.querySelector('.intro');
  const stage = intro?.querySelector('.intro-stage');
  const deck = intro?.querySelector('.deck-inner');
  const title = intro?.querySelector('.hero-title');
  const phone = intro?.querySelector('.phone');
  if (!intro || !stage) return;
  let raf = 0;
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;

  const frame = () => {
    raf = 0;
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    deck?.style.setProperty('--mx', mx.toFixed(4));
    deck?.style.setProperty('--my', my.toFixed(4));
    if (sceneMQ.matches) {
      const r = intro.getBoundingClientRect();
      const span = r.height - innerHeight;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      // a: úvod se rozjede a telefon vyjede doprostřed, b: telefon uhne doprava a vedle něj se objeví lekce
      const a = clamp(p / 0.5);
      const b = clamp((p - 0.45) / 0.4);
      // telefon roste s výškou obrazovky (návrh pro 800 px), menší než 1 nikdy: text zůstane aspoň 18 px
      const ps = Math.min(1.22, Math.max(1, ((innerHeight - 72) * 0.88) / 800));
      stage.style.setProperty('--ps', ps.toFixed(4));
      // na první obrazovce začíná telefon kousek pod nadpisem (offset* ignorují transformace)
      if (title && phone) {
        const h = phone.offsetHeight * ps * 0.94;
        let top = 0;
        for (let el = title; el && el !== stage; el = el.offsetParent) top += el.offsetTop;
        // + kus na dotažnice (J, čárka) pod řádkem
        const want = top + title.offsetHeight * 1.09 + 40 + innerHeight * 0.09;
        stage.style.setProperty('--drop', `${Math.round(want - (innerHeight - h) / 2)}px`);
      }
      stage.style.setProperty('--a', a.toFixed(4));
      stage.style.setProperty('--b', b.toFixed(4));
      // barva pozadí se přelije rychle, text lekcí naskočí až na hotové nebe
      stage.style.setProperty('--c', clamp(b / 0.35).toFixed(4));
      stage.style.setProperty('--d', clamp((b - 0.35) / 0.55).toFixed(4));
      stage.classList.toggle('is-past', a > 0.5);
      stage.classList.toggle('is-lessons', b > 0.5);
    } else {
      stage.style.removeProperty('--ps');
      stage.style.removeProperty('--drop');
      stage.style.removeProperty('--a');
      stage.style.removeProperty('--b');
      stage.style.removeProperty('--c');
      stage.style.removeProperty('--d');
      stage.classList.remove('is-past', 'is-lessons');
    }
    if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) request();
  };
  const request = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  if (!reduce.matches) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX / innerWidth - 0.5;
        ty = e.clientY / innerHeight - 0.5;
        request();
      },
      { passive: true },
    );
  }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  sceneMQ.addEventListener('change', request);
  request();

  // „Vyzkoušet ukázku“: ve scéně na její konec, jinak k telefonu
  const jumpToDemo = () => {
    const behavior = reduce.matches ? 'auto' : 'smooth';
    if (sceneMQ.matches) {
      scrollTo({ top: intro.offsetTop + intro.offsetHeight - innerHeight * 1.05, behavior });
    } else {
      intro.querySelector('.hero-stage').scrollIntoView({ behavior, block: 'start' });
    }
  };
  document.querySelectorAll('[data-jump-demo]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      jumpToDemo();
    }),
  );
  // ve scéně je telefon do dojetí jen náhled (pointer-events v CSS), klik na něj dopadne na obal
  intro.querySelector('.phone-wrap')?.addEventListener('click', (e) => {
    if (sceneMQ.matches && !stage.classList.contains('is-lessons') && !e.target.closest('.phone .screen *')) {
      track('demo_preview_click');
      jumpToDemo();
    }
  });
}

// ---------- odhalování: nadpisy po řádcích, ostatní jemně zespodu ----------
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  items.forEach((el) => {
    if (el.dataset.reveal === 'lines') el.querySelectorAll('.ml').forEach((l, i) => l.style.setProperty('--i', i));
  });
  if (reduce.matches || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -12% 0px' },
  );
  items.forEach((el) => io.observe(el));
}

// ---------- plovoucí tlačítko: jen mimo úvod a zápis, barvou se přizpůsobí kapitole pod sebou ----------
function initFloat() {
  const cta = document.querySelector('.float-cta');
  if (!cta) return;
  const hide = new Set();
  const sync = () => {
    cta.hidden = hide.size > 0 || document.documentElement.classList.contains('stage-locked');
  };
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)));
    sync();
  });
  document.querySelectorAll('.intro, .join, .site-footer').forEach((el) => io.observe(el));

  const under = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) cta.dataset.on = e.target.dataset.tone;
      }),
    { rootMargin: '-92% 0px 0px 0px' },
  );
  document.querySelectorAll('[data-chapter]').forEach((ch) => {
    ch.dataset.tone = ch.classList.contains('ch--night') || ch.classList.contains('ch--indigo') ? 'dark' : 'light';
    under.observe(ch);
  });
}

function initWordmark() {
  const w = document.querySelector('.wordmark span');
  if (w) w.style.backgroundImage = tileUrl('rozeta', 'indigo', 1.4);
}

function initPrint() {
  document.querySelectorAll('[data-print]').forEach((b) =>
    b.addEventListener('click', () => {
      track('rule_print');
      print();
    }),
  );
}

export function initScene() {
  initIntro();
  initReveal();
  initFloat();
  initWordmark();
  initPrint();
}
