// Vzory modrotisku: bílý tisk na indigu. Kreslené v SVG, ať jsou ostré v každé velikosti.
// Každý vzor je dlaždice, která se opakuje přes <pattern>. Barvy se dají přepnout (inverzní a červený tisk).

const petals = (cx, cy, r, n = 5, pr = r * 0.42) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${(cx + Math.cos(a) * r).toFixed(2)}" cy="${(cy + Math.sin(a) * r).toFixed(2)}" r="${pr.toFixed(2)}"/>`;
  }).join('');

const ring = (cx, cy, r, n, dr) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle cx="${(cx + Math.cos(a) * r).toFixed(2)}" cy="${(cy + Math.sin(a) * r).toFixed(2)}" r="${dr}"/>`;
  }).join('');

const leaf = (x, y, rot, s = 1) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0C4-7 13-9 20-6C15 1 7 4 0 0Z"/>`;

// tile: [šířka, výška, obsah]
export const MOTIFS = {
  // drobné kvítky v mřížce, mezi nimi tečky
  kvitek: [
    40,
    40,
    `${petals(10, 10, 4.2)}<circle cx="10" cy="10" r="2" class="bg"/>${petals(30, 30, 4.2)}<circle cx="30" cy="30" r="2" class="bg"/><circle cx="30" cy="10" r="1.6"/><circle cx="10" cy="30" r="1.6"/>`,
  ],
  // hrášek: dvě velikosti teček posunuté o půl
  hrasek: [32, 32, `<circle cx="8" cy="8" r="4.4"/><circle cx="24" cy="24" r="4.4"/><circle cx="24" cy="8" r="1.4"/><circle cx="8" cy="24" r="1.4"/>`],
  // rozeta: věnec teček kolem květu
  rozeta: [
    80,
    80,
    `${ring(40, 40, 26, 18, 2.2)}${petals(40, 40, 11, 8, 5)}<circle cx="40" cy="40" r="4.5" class="bg"/><circle cx="40" cy="40" r="2"/>${ring(0, 0, 10, 8, 1.6)}${ring(80, 0, 10, 8, 1.6)}${ring(0, 80, 10, 8, 1.6)}${ring(80, 80, 10, 8, 1.6)}`,
  ],
  // úponek s lístky po diagonále
  usponek: [
    60,
    60,
    `<path d="M-5 65C15 45 25 35 65 -5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>${leaf(14, 46, -80)}${leaf(22, 38, 10)}${leaf(34, 26, -80)}${leaf(42, 18, 10)}<circle cx="52" cy="52" r="3"/><circle cx="8" cy="8" r="3"/>`,
  ],
  // kostka: šachovnice s tečkou ve světlém poli
  kostka: [
    40,
    40,
    `<rect width="20" height="20"/><rect x="20" y="20" width="20" height="20"/><circle cx="30" cy="10" r="3.5"/><circle cx="10" cy="30" r="3.5"/><circle cx="10" cy="10" r="2.5" class="bg"/><circle cx="30" cy="30" r="2.5" class="bg"/>`,
  ],
  // pruhy s perličkami
  perlicky: [
    36,
    24,
    `<rect y="0" width="36" height="3"/><circle cx="9" cy="12" r="3"/><circle cx="27" cy="12" r="3"/><circle cx="0" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/><circle cx="36" cy="12" r="1.3"/>`,
  ],
  // srdíčka v řadách
  srdce: [
    44,
    44,
    `<path d="M11 18C11 12 2 10 2 17C2 22 11 27 11 27C11 27 20 22 20 17C20 10 11 12 11 18Z"/><path d="M33 40C33 34 24 32 24 39C24 44 33 49 33 49C33 49 42 44 42 39C42 32 33 34 33 40Z" transform="translate(0 -22)"/><circle cx="33" cy="33" r="2"/><circle cx="11" cy="37" r="1.6"/>`,
  ],
};

const SCHEMES = {
  indigo: ['#22388f', '#f4f0e6'],
  hluboka: ['#15235f', '#e9e3d6'],
  krem: ['#f4f0e6', '#22388f'],
  cervena: ['#c8322a', '#f4f0e6'],
  nebe: ['#c9d5f1', '#22388f'],
};

let uid = 0;

// Vrátí SVG řetězec s vyplněnou plochou daného vzoru.
export function pattern(name, scheme = 'indigo', { scale = 1, rotate = 0 } = {}) {
  const [w, h, body] = MOTIFS[name];
  const [bg, fg] = SCHEMES[scheme];
  const id = `mt-${name}-${uid++}`;
  return `<svg class="mt" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 200 200" style="color:${fg}">
    <defs><pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="scale(${scale}) rotate(${rotate})">
      <g fill="currentColor" style="--bg:${bg}">${body.replaceAll('class="bg"', `fill="${bg}"`)}</g>
    </pattern></defs>
    <rect width="200" height="200" fill="${bg}"/><rect width="200" height="200" fill="url(#${id})"/>
  </svg>`;
}

// Vyplní všechny prvky s data-mt="vzor schéma měřítko" opakovanou dlaždicí v pevné velikosti,
// ať je vzor stejně jemný na malé kartě i na pruhu přes celou šířku.
export function hydratePatterns(root = document) {
  root.querySelectorAll('[data-mt]').forEach((el) => {
    const [name, scheme = 'indigo', scale = '1.3'] = el.dataset.mt.split(' ');
    el.style.backgroundImage = tileUrl(name, scheme, Number(scale));
    el.style.backgroundColor = SCHEMES[scheme][0];
  });
}

// Dlaždice vzoru jako obrázek pro CSS (pozadí, výplň písma).
export function tileUrl(name, scheme = 'indigo', scale = 1) {
  const [w, h, body] = MOTIFS[name];
  const [bg, fg] = SCHEMES[scheme];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/><g fill="${fg}" color="${fg}">${body.replaceAll('class="bg"', `fill="${bg}"`).replaceAll('currentColor', fg)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
