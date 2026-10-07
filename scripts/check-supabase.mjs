// Kontrola čekací listiny: (1) anonymní klíč smí vložit, (2) anonymní klíč NESMÍ číst.
// Spouští se denně z GitHub Actions. Zároveň tím drží free projekt Supabase aktivní (jinak se po týdnu pozastaví).
// Používá pevný testovací e-mail: první běh ho vloží (201), další dostanou 409 (už existuje),
// což taky dokazuje, že zápis prošel právy i RLS až k unikátnímu indexu. Seznam se tak nezanáší.
//
// Spuštění lokálně: node --env-file=.env scripts/check-supabase.mjs

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}
const headers = { apikey: key, 'Content-Type': 'application/json' };
let ok = true;

const ins = await fetch(`${url}/rest/v1/waitlist`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'return=minimal' },
  body: JSON.stringify({
    email: 'monitor@monitor.invalid',
    audience: 'unknown',
    consent_text: 'automaticka kontrola',
    policy_version: 'monitor',
    source: 'monitor',
  }),
});
if (ins.status === 201 || ins.status === 409) {
  console.log(`OK  zápis přijat (${ins.status})`);
} else {
  ok = false;
  console.error(`CHYBA  zápis selhal: ${ins.status} ${await ins.text()}`);
}

const sel = await fetch(`${url}/rest/v1/waitlist?select=email&limit=1`, { headers });
const body = await sel.text();
if (!sel.ok || body.trim() === '[]') {
  console.log(`OK  veřejnost seznam nepřečte (${sel.status} ${body.slice(0, 80)})`);
} else {
  ok = false;
  console.error(`CHYBA  anonymní klíč vidí data: ${body.slice(0, 200)}`);
}

process.exit(ok ? 0 : 1);
