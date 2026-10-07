# AI bez obav – waitlist stránka

Statická stránka (Vite, vanilla JS) podle `ZADANI.md`. Ukázka v telefonu používá `src/demo-logic.js` beze změny.

```bash
npm install
cp .env.example .env   # doplnit hodnoty
npm run dev            # http://localhost:5173
npm run build          # výstup v dist/, nasadit na Cloudflare Pages / Vercel
```

Bez `.env` se v `npm run dev` zápis jen nasimuluje (v konzoli je varování). V produkčním buildu bez klíčů formulář ukáže chybu.

## Soubory

- `index.html`, `zasady.html` – obě stránky, texty ze zadání
- `src/demo.js` – vzhled a ovládání ukázky, `src/demo-logic.js` – hotová logika
- `src/form.js` – formulář, zápis do Supabase přes REST (jen anonymní klíč)
- `src/track.js` – Plausible události + UTM zdroj, `src/share.js` – „Poslat dál“
- `src/config.js` – `POLICY_VERSION` a znění souhlasu, které se ukládá
- `supabase/migrations/…_waitlist.sql` – tabulka, RLS, práva
- `scripts/check-supabase.mjs` + `ops/waitlist-check.yml` – denní hlídání a ochrana proti pozastavení (zatím neaktivní, po zapojení Supabase přesunout do `.github/workflows/`)
- `public/og.png` – náhled pro sdílení

## Supabase (zbývá)

1. Projekt v konkrétním EU regionu (Frankfurt), vyžádat a uložit DPA.
2. Spustit `supabase/migrations/20261007000000_waitlist.sql` (SQL editor nebo přes MCP/CLI).
3. Do `.env` dát URL a **publishable/anon** klíč. Service role klíč nikdy.
4. `node --env-file=.env scripts/check-supabase.mjs` – musí vypsat dvakrát OK (zápis projde, čtení ne).
5. Na GitHubu přidat secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Workflow běží denně; při selhání přijde e-mail.
   Pozor: GitHub vypne plánované workflow po 60 dnech bez commitu v repozitáři – občas něco commitnout, nebo ho znovu zapnout.

Kontrola používá pevný e-mail `monitor@monitor.invalid` (zdroj `monitor`). Při exportu ho vyřaďte:
`select * from waitlist where source is distinct from 'monitor';`

Ochrana proti spamu: varianta 2 ze zadání (honeypot + RLS). Při prvním spamu přejít na Turnstile + serverovou funkci.

## Měření

Události: `demo_start`, `skip_open`, `skip_pass`, `skip_fail`, `lesson_done`, `demo_locked_tap`, `audience_toggle`,
`waitlist_submit`, `share_click`. V Plausible je založte jako Custom event goals.
Zdroj: rozesílejte odkazy s UTM, např. `https://domena.cz/?utm_source=facebook&utm_medium=skupina&utm_campaign=rijen`.
Hodnota se uloží i k e-mailu (`source`). „Poslat dál“ přidává `utm_source=sdileni`.
Ověřte, že snippet v `src/track.js` odpovídá tomu, co Plausible aktuálně ukazuje v nastavení webu.

## Co doplnit (hledejte `[DOPLNIT`, `[POTVRDIT`, `[E-MAIL]`, `[OVĚŘIT`)

- Kritérium úspěchu (kolik e-mailů, do kdy, odkud) – zatím nikde
- Název a doména (`AI bez obav` je v `index.html`, `zasady.html`, `public/og.png`), `VITE_SITE_URL`
- Kontaktní e-mail, kdo za projektem stojí
- Kolik zpráv maximálně pošlete
- Odpovědi na FAQ (kromě „Kdy to bude hotové?“, kde je text ze zadání)
- Zásady: správce, doba uchování, hosting, e-mailová služba a odhlášení, region a předání do USA. Nechat zkontrolovat někým, kdo rozumí GDPR.
- Double opt-in ano/ne – pak doplnit větu do `SUCCESS` v `src/form.js`
- Ověřená statistika se zdrojem (volitelné, místo je v HTML komentáři v sekci Pravidlo)

Obsah ukázky v `src/demo-logic.js` (testové otázky a lekce „Falešný vnuk volá“ jako hovor ve dvou krocích)
je přepsaný na žádost autora: realistické situace (podvržené číslo, AI video s investicí, „bezpečný účet“).
Logika (stavy, test, skok) se nezměnila. Před spuštěním nechte obsah zkontrolovat.
Průvodce ukázkou (3 kroky) měří událost `demo_tour` s krokem a způsobem ukončení (`done`, `skip`, `tap`).

Texty, které zadání nedalo a dopsal jsem je (zkontrolujte): chyba prázdného/neplatného e-mailu a chyba sítě
(`src/form.js`), texty v liště testu, výsledek testu, dialog „Zatím zamčeno“, obrazovka „Lekce hotová“
(`src/demo.js`), nadpis „Dáme vám vědět, až to bude hotové“ u druhého formuláře.
