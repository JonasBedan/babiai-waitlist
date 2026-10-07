# Zadání: waitlist stránka pro aplikaci "AI bez obav"

Pracovní název aplikace je "AI bez obav". Změň ho klidně všude najednou, je to jen text.

Tento soubor je zadání pro Claude Code. Čti ho celý, než začneš. Vedle něj leží `demo-logic.js` (hotová logika dema, čistý JavaScript, otestovaná). Nic z toho nevymýšlej znovu.

## 1. Co stavíme a proč

Jednostránkový web v češtině, který sbírá e-maily na čekací listinu aplikace. Aplikace učí seniory (a začátečníky s AI) poznat podvody s AI a používat AI ve všedním životě. Aplikace zatím neexistuje. Stránka obsahuje klikací ukázku, ze které je vidět, jak bude fungovat.

Hypotéza, kterou stránka ověřuje: lidé (senioři a jejich rodiny) mají o takovou aplikaci zájem natolik, že za ni dají e-mail. Stránka je pokus, ne produkt. Postav ji rychle a jednoduše.

Kritérium úspěchu: **[DOPLNIT: kolik e-mailů, do kdy, z jakého zdroje]**. Bez čísla se každý výsledek dá vyložit jako úspěch. Vyplní autor, ne Claude Code.

## 2. Pro koho (dva čtenáři na jedné stránce)

Stránku uvidí dvě skupiny a obě ji musí zvládnout:

1. **Senior samotný.** Čte velké písmo, bojí se klikat na cokoli neznámého, e-mail nemusí mít nebo ho nepoužívá.
2. **Dospělé dítě seniora**, které se bojí o rodiče a chce je chránit.

Řešení: jedna stránka, jeden příběh, ale pod nadpisem malý přepínač **"Čtu to jako senior" / "Hledám to pro rodiče"**. Přepínač mění jen dvě věci: podnadpis a popisek formuláře (texty v sekci 4). Hodnotu přepínače pošli s e-mailem jako skryté pole `audience` (`senior`, `family` nebo `unknown`, dokud nikdo nic nepřepne). Tak zjistíme, kdo se hlásí, a čtenáře to nestojí žádné políčko navíc.

Senior bez e-mailu: u formuláře i v zápatí je tlačítko **"Poslat dál"** (Web Share API, jinak zkopírování odkazu). Předvyplněný text pro seniora: "Prosím, podívej se na tuhle stránku a zapiš mě." Pro rodinu: "Tohle by se hodilo pro mámu nebo tátu."

Stránka sama dodržuje přístupnost, kterou aplikace slibuje (sekce 7). Kdyby stránka vypadala jako generický SaaS web, podkopává vlastní sdělení.

## 3. Struktura stránky (pořadí shora dolů)

Mobil první (390 px), desktop od 1100 px. Na mobilu je při posouvání dole přilepené tlačítko "Zapsat se", které odskočí k formuláři.

1. **Hlavička.** Logo (text) vlevo, vpravo odkaz "Zapsat se". Žádné další menu.
2. **Hero.** Nadpis, podnadpis, přepínač čtenáře, karta s příkladem podvodné SMS, formulář a klikací telefon s ukázkou. Na desktopu text a formulář vlevo, telefon vpravo. Na mobilu: nadpis, podnadpis, telefon, formulář.
3. **Jak to funguje** (3 kroky vedle sebe, na mobilu pod sebou).
4. **Pravidlo, které chrání už dnes.** Karta s pravidlem z lekce. Dá hodnotu i tomu, kdo se nezapíše, a je dobré ke sdílení.
5. **Pro koho** (dvě karty: senior, rodina) a řádek pro organizace.
6. **Poctivě o stavu projektu.** Krátký rámeček.
7. **Formulář podruhé** a **FAQ**.
8. **Zápatí.** Kdo to dělá, kontakt, zásady zpracování údajů, "Poslat dál".

## 4. Texty (česky, hotové k použití)

Žádné vykřičníky, žádná slova typu revoluční nebo chytrá AI. Kde je [HRANATÁ ZÁVORKA], dodá autor.

**Nadpis (hero):** Podvodník dnes umí napodobit hlas vašeho vnuka.

**Podnadpis, výchozí:** Krátké lekce v češtině, které naučí poznat falešný hovor, zprávu nebo video. Vyzkoušejte si ukázku přímo tady.

**Podnadpis, "Čtu to jako senior":** Krátké lekce, které vás naučí poznat falešný hovor, zprávu nebo video. Nic nemusíte umět předem.

**Podnadpis, "Hledám to pro rodiče":** Krátké lekce, které naučí vaše rodiče poznat falešný hovor, zprávu nebo video. Bez strašení a bez složitých slov.

**Karta s příkladem:** popisek "SMS z neznámého čísla", text zprávy: "Ahoj mami, rozbil se mi mobil, tohle je moje nové číslo. Pošleš mi dnes 18 500 Kč na fakturu? Zítra vrátím." Pod ním oranžový rámeček s ikonou varování: titulek "Pozor, past", text "Takhle může vypadat podvod. Lekce vás naučí poznat podle čeho."

**Formulář:**
- Popisek pole: "Váš e-mail" (rodina: "Váš e-mail, napíšeme vám, až bude hotovo")
- Tlačítko: "Dejte mi vědět, až to bude hotové"
- Zaškrtávátko: "Souhlasím se zpracováním e-mailu, abyste mi mohli oznámit spuštění aplikace. [odkaz: Zásady zpracování údajů]"
- Pod tlačítkem: "Odhlásit se můžete kdykoli. [POTVRDIT: kolik zpráv maximálně pošlete]"
- Po odeslání: "Hotovo. Zapsali jsme vás. [Pokud double opt-in: Na e-mail vám přijde potvrzení, klepněte na odkaz v něm.]"
- Chyby (česky, srozumitelně, vždy co udělat): "Zkontrolujte prosím e-mail, chybí v něm zavináč." a "Bez souhlasu vás nemůžeme zapsat."

**Jak to funguje:**
1. *Krátké lekce.* Tři až pět minut, jeden příběh, jedno pravidlo. Nic se nepamatuje nazpaměť.
2. *Odemykání po krocích.* Hry a cvičení s AI se otevírají postupně, aby toho nebylo moc najednou.
3. *Přeskočte, co už umíte.* Krátký test a jdete dál. Přeskočené lekce zůstanou na cestě.

**Pravidlo:** nadpis "Pravidlo, které chrání už dnes". Tři řádky ve velkém serifu s ikonou: "Zavěste." "Zavolejte zpátky." "Na číslo, které máte v telefonu uložené." Pod tím: "Platí i pro zprávy. Neodpovídejte na nové číslo, napište na to, které znáte."

**Pro koho:** karta "Pro seniory": "Velké písmo, jedna věc na obrazovce a žádné složité výrazy. Můžete se vrátit, kdykoli chcete." Karta "Pro rodinu": "Nemusíte rodiče nic učit sami. Ukažte jim aplikaci a zeptejte se, co si z lekce pamatují." Řádek: "Knihovna, klub seniorů nebo domov? Napište nám na [E-MAIL]."

**Poctivě o stavu projektu:** "Aplikace se teprve staví. To, co vidíte nahoře, je ukázka a umí jen pár lekcí. AI se může mýlit a žádná aplikace nenahradí zdravý rozum. Nejsme banka ani policie. [DOPLNIT: kdo za projektem stojí]"

**FAQ** (přesně tyto otázky, odpovědi doplní autor, nic nevymýšlej):
- Kolik to bude stát? [DOPLNIT]
- Musím mít chytrý telefon? [DOPLNIT]
- Co se děje s mým e-mailem? [DOPLNIT podle zásad]
- Kdy to bude hotové? [DOPLNIT, nebo "Nevíme přesně. Zapsaným napíšeme jako první."]

## 5. Klikací ukázka v telefonu

Je to nejdůležitější část stránky. Rámeček telefonu 390 × 844 px (na malých obrazovkách se zmenší, aby se vešel, vždy ale bez vodorovného posouvání stránky). Rámeček je jednoduchý obrys, bez výřezu, bez fiktivní stavové lišty a bez lesku. Pod ním popisek: "Vyzkoušejte si to. Klepněte na zamčenou lekci a zkuste skočit dopředu." a tlačítko "Začít ukázku znovu".

Co v ukázce funguje:

1. **Cesta.** Svislá cesta uzlů (lekce jsou kolečka, hry a cvičení zaoblené čtverce). Rozložení: uzly sloupcem v klikatce (x pozice se střídají 175, 95, 175, 255 z 350 px), mezi nimi křivky. Hotová část cesty je plná čára, zbytek tečkovaná. Dvě sekce s nadpisy ("Část 1", "Část 2").
2. **Stavy uzlů** (vždy barva i ikona i slovo): Hotovo (plné navy kolečko, fajfka), Teď na řadě (navy s prstencem, trojúhelník přehrát), Zamčeno (šedé, zámek), Přeskočeno (přerušovaný okraj, ikona přeskoku), Odemčeno (nepovinné, plný okraj, ikona dárku).
3. **Skok dopředu.** Klepnutí na zamčený povinný uzel otevře dolní lištu "Už to umíte?" s počtem přeskočených kroků a nabídkou testu o třech otázkách. Za každou odpověď okamžitá zpětná vazba (správně, past, dobrý nápad ale nestačí). Projde jen ten, kdo odpoví správně na všechny tři. Pak cesta skočí, přeskočené uzly zůstanou vidět. Neúspěch doporučí lekci a nabídne test znovu.
4. **Lekce "Falešný vnuk volá".** Klepnutí na uzel "Teď na řadě" otevře scénář, tři volby se zpětnou vazbou a pravidlo. Dokončení zobrazí obrazovku "Lekce hotová" s rámečkem "Odemklo se: Kopie vašeho hlasu" a v ní tlačítko "Pokračovat na cestu".
5. **Funkce, které v ukázce nejsou** (hra, chat s AI, kopie hlasu, ostatní lekce): klepnutí otevře dialog "Tohle už je v plné verzi. Zapište se a dáme vám vědět." s tlačítkem "Zapsat se" (posune na formulář). Nikdy se v ukázce nenahrává hlas ani nepouští mikrofon.

Logika (stavy, test, skok) je hotová v `demo-logic.js`. Použij ji beze změny významu, vzhled postav kolem. Funkce jsou čisté: berou stav, vrací nový stav. Výchozí stav je `initialState()`.

## 6. Vzhled

Teplé a klidné, jako dobře vyrobená tištěná brožura. Zvolený směr je přesně tento, ne jiný.

**Barvy:**
- Papír (pozadí): `#F6F0E4`
- Karty: `#FFFBF3`
- Text: `#1E2230`, druhotný text `#474C59`
- Navy (akce, tlačítka, odkazy): `#1D3557`, hover `#14263F`
- Světlé navy (pozadí infoboxů): `#E3E8EF`
- Linky: `#DDD1BC`
- Oranžová **jen pro varování**: text `#7A2F05`, pozadí `#FBE6D3`, okraj `#E3A36C`, ikona `#A8430A`
- Zelená jen pro "správně": text `#1F4D29`, pozadí `#E2EEDD`, okraj `#8DB894`, ikona `#2E6A3A`

**Písma (Google Fonts):** nadpisy Literata (500 až 600), tělo Atkinson Hyperlegible Next (400, 600, 700). Žádné Inter, Roboto ani Arial.

**Velikosti:** tělo 20 px, nikde pod 18 px. Hero nadpis 40 až 52 px na desktopu, 31 px na mobilu. Cílové plochy (tlačítka, přepínač, volby) minimálně 56 px vysoké. Tlačítko akce navy s krémovým textem, 64 px vysoké, zaoblení 16 px.

**Ikony:** jednoduché obrysové, tloušťka čáry 2, zaoblené konce. Použij Lucide (nebo ekvivalent), ať se nekreslí ručně.

**Nesmí se objevit:** fialová ani modrofialový přechod, glassmorphism, zářící koule, ikonky jiskřiček, emoji, generický hero blok s abstraktními tvary, stíny kolem všeho. Žádné přechody jako výplň. Hodně bílého místa. Varování a bezpečí se **vždy** odliší barvou, ikonou i slovem dohromady.

## 7. Přístupnost, výkon, technika

- Kontrast WCAG AA všude (text 4,5 : 1, větší 3 : 1). Zkontroluj.
- Každé tlačítko je skutečný `<button>` nebo `<a>` s viditelným popiskem. Ikonová tlačítka mají `aria-label`. Pole formuláře mají `<label>`. Viditelný focus (4 px obrys).
- Ovladatelné jen klávesnicí, včetně celé ukázky. Lišta s testem je dialog (`role="dialog"`, `aria-modal`, focus se do ní přesune a po zavření vrátí).
- Stránka funguje bez horizontálního posunu od 320 px. Respektuj `prefers-reduced-motion`.
- `lang="cs"`, smysluplné `<title>` a popis, náhledový obrázek pro sdílení (jednoduchá grafika s pravidlem "Zavěste. Zavolejte zpátky.").
- Rychlost: žádné těžké knihovny. Ukázka je vanilla JS a pár stovek řádků.
- Doporučení techniky, ber jako návrh: statická stránka (Astro nebo prostý Vite), hosting Cloudflare Pages nebo Vercel. Databáze je rozhodnutá: Supabase, podrobnosti v sekci 10b. Vyber, co je rychlejší, ne co je hezčí.

## 8. Formulář a data

Sbíráme **jen e-mail**, souhlas (ano, jen když zaškrtnuto), skryté `audience` a čas zápisu. Nic dalšího, žádné jméno, telefon ani město. Ukládej také znění souhlasu a verzi zásad, ke kterým se souhlas vztahoval.

K tomu patří stránka **Zásady zpracování údajů** (krátká, česky, srozumitelně): kdo je správce [DOPLNIT jméno a kontakt], k čemu se e-mail používá (jen informace o spuštění aplikace), jak dlouho se uchovává [DOPLNIT], komu se předává (poskytovatel formuláře a e-mailu, uveď konkrétně), jak se odhlásit a jak požádat o smazání. Autor si má obsah ověřit u někoho, kdo se v GDPR vyzná. Claude Code není právník.

## 9. Měření

Bez cookies a bez osobních údajů, nejlépe Plausible nebo ekvivalent. Události, které odpovídají na otázku "funguje to?":

- `demo_start` (první klepnutí v telefonu)
- `skip_open`, `skip_pass`, `skip_fail`
- `lesson_done`
- `demo_locked_tap` (klepnutí na funkci, která v ukázce není)
- `audience_toggle` (s hodnotou)
- `waitlist_submit`
- `share_click`

Dej do zadání i měření zdroje (UTM parametry v odkazu), ať se pozná, odkud e-maily přišly.

## 10. Co nikdy nedělat

- Žádné vymyšlené reference, jména, citace, počty uživatelů ani počty "už se zapsalo".
- Žádné statistiky o podvodech bez ověřeného zdroje a odkazu na něj. Místo čísla klidně vynech. **[Místo pro ověřenou statistiku: DOPLNIT včetně zdroje]**
- Žádný falešný odpočet, "poslední místa" ani nátlak. Cílová skupina je přesně ta, kterou podvodníci tlačí na spěch.
- Žádné předvybrané zaškrtnutí souhlasu.
- Neslibuj funkce, které v ukázce nejsou, jako hotové. Vždy "připravujeme".
- Nic nenapodobuj: ani banku, ani policii, ani známou osobnost.

## 10b. Databáze: Supabase

Rozhodnuto: **Supabase** (Postgres). Důvody: pravidlo "anonymní klíč smí jen vkládat" se píše jedním řádkem SQL, bez placeného serverového kódu, a zůstává to obyčejné SQL. Firebase by na ochranu proti spamu potřeboval Cloud Functions, které vyžadují placený plán s platební kartou.

**Region:** při zakládání projektu vyber konkrétní region v EU (například Frankfurt), **ne** obecnou skupinu "Europe", která zahrnuje i Londýn a Curych. U Supabase si vyžádej smlouvu o zpracování údajů (DPA) a ulož si ji. Region sám GDPR nevyřeší: zálohy, logy a další služby (například e-mailová služba) se hodnotí zvlášť a patří do Zásad zpracování údajů.

**Tabulka** (nic navíc, držíme se sekce 8):

```sql
create table public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  audience      text not null default 'unknown'
                check (audience in ('senior', 'family', 'unknown')),
  consent_text  text not null,       -- přesné znění souhlasu, které uživatel viděl
  policy_version text not null,      -- verze Zásad zpracování údajů
  source        text,                -- z UTM parametrů, volitelné
  created_at    timestamptz not null default now()
);

-- jeden e-mail jen jednou, bez ohledu na velká a malá písmena
create unique index waitlist_email_unique on public.waitlist (lower(email));

-- zákaz čtení a úprav pro veřejnost, povolit jen vložení
alter table public.waitlist enable row level security;

create policy "kdokoli smi vlozit"
  on public.waitlist for insert
  to anon
  with check (
    char_length(email) between 5 and 254
    and email like '%_@_%._%'
  );
-- Záměrně žádná policy pro select, update ani delete.
```

**Co z toho plyne:**

- Do prohlížeče patří **jen anonymní (publishable) klíč**. Service role klíč nesmí nikdy skončit v kódu stránky ani v repozitáři.
- Veřejnost nemůže seznam číst. Ověř to testem: dotaz na `waitlist` s anonymním klíčem musí vrátit prázdný výsledek nebo chybu.
- Duplicitní e-mail vrátí chybu unikátního indexu. Uživateli ukaž **stejnou** pozitivní hlášku jako při úspěchu ("Hotovo. Zapsali jsme vás."), ať stránka neprozradí, kdo už na seznamu je.
- Souhlas se ukládá s textem a verzí. Bez zaškrtnutého souhlasu se nic neodešle (kontrola v prohlížeči i tím, že pole `consent_text` je povinné).

**Ochrana proti spamu** (vyber jednu cestu, ne všechny):

1. Cloudflare Turnstile nebo skryté honeypot pole, a vkládání ne přímo z prohlížeče, ale přes malou serverovou funkci, která token ověří a teprve pak zapíše přes service role klíč. Pak může být vkládání pro `anon` úplně zakázané (smaž policy výše). Tohle je silnější varianta.
2. Pro první pokus stačí honeypot pole, limit na straně hostingu a výše uvedená policy. Slabší, ale bez serverového kódu.

Neděláš-li z toho nic víc než pokus, začni variantou 2 a přejdi na 1, jakmile uvidíš první spam.

**Pozastavení free projektu:** Supabase pozastaví free projekt po týdnu bez aktivity a formulář by pak tiše přestal fungovat. Řeš to hned, ne až se to stane:

- buď plán Pro (25 dolarů měsíčně, jen pokud to dává smysl),
- nebo plánovaná úloha (například GitHub Actions každý druhý den), která udělá jednoduchý dotaz do databáze (třeba `select 1` přes funkci s právem pro `anon`, nebo zápis do pomocné tabulky `heartbeat`).

K tomu přidej **hlídání**: jednou za den automatický test, že formulář přijímá zápis, a upozornění e-mailem, když ne. Nikdo jiný si toho nevšimne.

**Odesílání e-mailů a odhlášení:** databáze e-mail neodešle ani nikoho neodhlásí. Odhlášení musí fungovat (GDPR). Vyber jednu z cest a zapiš ji do Zásad:

- hotová služba na e-maily (Buttondown, Loops a podobné) s odhlášením a potvrzovacím e-mailem, a Supabase jen jako záloha, nebo
- Supabase jako jediný zdroj a vlastní odhlašovací odkaz (podepsaný token v odkazu, který smaže řádek), e-maily přes odesílací službu.

Aktuální ceny a limity těchto služeb si před výběrem ověř, nejsou ve tvém zadání zafixované.

**AI API na této stránce není.** Ukázka je skriptovaná (`demo-logic.js`). AI klíč do tohoto projektu nepatří, dokud nestavíš plnou aplikaci. Až tam bude: klíč jen na serveru, omezení počtu zpráv na uživatele a limit útraty u poskytovatele.

## 11. Otevřené věci (vyplní autor, ne Claude Code)

1. Kritérium úspěchu (kolik, do kdy, odkud).
2. Skutečný název a doména.
3. Správce údajů, kontakt, doba uchování, služba pro e-maily.
4. Odpovědi na FAQ a text "kdo za tím stojí".
5. Jedna ověřená statistika s odkazem na zdroj (volitelné, ale silné).
6. Kde se odkaz rozešle (například facebookové skupiny rodin seniorů, knihovny a kluby seniorů v okolí). Bez šíření stránka nic neprokáže.

## 12. Pořadí práce

1. Kostra stránky s texty a stylem, bez dema (mobil i desktop).
2. Demo: nejdřív cesta a skok dopředu s `demo-logic.js`, pak lekce a obrazovka odemčení, nakonec dialog "v plné verzi".
3. Formulář a ukládání (sekce 8 a 10b): projekt Supabase v EU regionu, tabulka a pravidla, test, že veřejnost nemůže číst, spam ochrana, hlídání a ochrana proti pozastavení, zásady.
4. Měření a sdílení.
5. Kontrola: kontrast, klávesnice, 320 px, čtečka obrazovky, skutečný telefon. Až pak ukaž lidem.
