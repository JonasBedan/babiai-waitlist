// Formulář čekací listiny. Ukládá jen e-mail, souhlas (znění + verze zásad), audience, zdroj a čas.
// Zápis jde přímo do Supabase přes REST s anonymním klíčem; RLS povoluje jen vložení.
import { CONSENT_TEXT, POLICY_VERSION, PREVIEW, SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';
import { getAudience, onAudience } from './audience.js';
import { icon } from './icons.js';
import { track, trafficSource } from './track.js';

const LABEL = {
  unknown: 'Váš e-mail',
  senior: 'Váš e-mail',
  family: 'Váš e-mail, napíšeme vám, až bude hotovo',
};

const MSG = {
  empty: 'Napište prosím svůj e-mail.',
  noAt: 'Zkontrolujte prosím e-mail, chybí v něm zavináč.',
  invalid: 'Zkontrolujte prosím e-mail. Má vypadat třeba takto: jmeno@seznam.cz',
  consent: 'Bez souhlasu vás nemůžeme zapsat.',
  network: 'Zápis se teď nepovedl. Zkontrolujte připojení k internetu a zkuste to prosím znovu.',
};

const SUCCESS = 'Hotovo. Zapsali jsme vás.';
// Pokud bude double opt-in, doplňte: 'Na e-mail vám přijde potvrzení, klepněte na odkaz v něm.'

function template(id) {
  return `
  <form class="waitlist" novalidate data-form="${id}">
    <div class="field">
      <label for="${id}-email" class="field-label" data-email-label>${LABEL[getAudience()]}</label>
      <input id="${id}-email" name="email" type="email" inputmode="email" autocomplete="email"
             spellcheck="false" autocapitalize="off" maxlength="254" aria-describedby="${id}-email-err" />
      <p class="field-error" id="${id}-email-err" hidden></p>
    </div>

    <div class="field">
      <div class="check">
        <input id="${id}-consent" name="consent" type="checkbox" aria-describedby="${id}-consent-err" />
        <label for="${id}-consent">Souhlasím se zpracováním e-mailu, abyste mi mohli oznámit spuštění aplikace.
          <a href="zasady.html">Zásady zpracování údajů</a></label>
      </div>
      <p class="field-error" id="${id}-consent-err" hidden></p>
    </div>

    <div class="hp" aria-hidden="true">
      <label for="${id}-web">Nevyplňujte</label>
      <input id="${id}-web" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>
    <input type="hidden" name="audience" value="${getAudience()}" />

    <button type="submit" class="btn btn-primary btn-block">Dejte mi vědět, až to bude hotové</button>
    <p class="form-fine">Odhlásit se můžete kdykoli. [POTVRDIT: kolik zpráv maximálně pošlete]</p>
    <p class="form-error" role="alert" hidden></p>
  </form>
  <div class="form-done note note-ok" hidden tabindex="-1">
    <span class="note-icon">${icon('CircleCheck')}</span>
    <div><p class="note-title">${SUCCESS}</p>${PREVIEW ? '<p>V náhledu se e-mail neukládá.</p>' : ''}</div>
  </div>
  <div class="form-share">
    <p>Nemáte e-mail? Pošlete stránku někomu blízkému.</p>
    <button type="button" class="btn btn-secondary" data-share>${icon('Share2')}Poslat dál</button>
    <p class="share-status" role="status"></p>
  </div>`;
}

export function initForms() {
  document.querySelectorAll('[data-waitlist]').forEach((slot) => {
    slot.innerHTML = template(`f-${slot.dataset.waitlist}`);
    const form = slot.querySelector('form');
    form.addEventListener('submit', (e) => submit(e, form, slot));
  });
  onAudience((a) => {
    document.querySelectorAll('[data-email-label]').forEach((l) => (l.textContent = LABEL[a]));
    document.querySelectorAll('form.waitlist input[name="audience"]').forEach((i) => (i.value = a));
  });
}

function setError(input, errEl, msg) {
  errEl.hidden = !msg;
  errEl.innerHTML = msg ? `${icon('TriangleAlert', 22)}<span>${msg}</span>` : '';
  if (msg) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function validateEmail(v) {
  if (!v) return MSG.empty;
  if (!v.includes('@')) return MSG.noAt;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || v.length < 5 || v.length > 254) return MSG.invalid;
  return null;
}

let sending = false;

async function submit(e, form, slot) {
  e.preventDefault();
  if (sending) return;
  const email = form.email.value.trim();
  const emailErr = validateEmail(email);
  const consentErr = form.consent.checked ? null : MSG.consent;
  setError(form.email, form.querySelector(`#${form.email.id}-err`), emailErr);
  setError(form.consent, form.querySelector(`#${form.consent.id}-err`), consentErr);
  const formErr = form.querySelector('.form-error');
  formErr.hidden = true;
  if (emailErr) return form.email.focus();
  if (consentErr) return form.consent.focus();

  const btn = form.querySelector('button[type="submit"]');
  sending = true;
  btn.disabled = true;
  btn.textContent = 'Zapisuji…';
  try {
    // Honeypot: robot vyplní skryté pole. Neukládáme, ale ukážeme stejné potvrzení.
    if (!form.website.value) await save(email, form.audience.value);
    track('waitlist_submit', { audience: form.audience.value });
    form.hidden = true;
    const done = slot.querySelector('.form-done');
    done.hidden = false;
    done.focus();
  } catch (err) {
    console.error(err);
    formErr.innerHTML = `${icon('TriangleAlert', 22)}<span>${MSG.network}</span>`;
    formErr.hidden = false;
  } finally {
    sending = false;
    btn.disabled = false;
    btn.textContent = 'Dejte mi vědět, až to bude hotové';
  }
}

async function save(email, audience) {
  if (PREVIEW) return;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (import.meta.env.DEV) {
      console.warn('[waitlist] Chybí VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, zápis jen nasimulován.');
      return;
    }
    throw new Error('Supabase není nastavené');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      email,
      audience,
      consent_text: CONSENT_TEXT,
      policy_version: POLICY_VERSION,
      source: trafficSource(),
    }),
  });
  // 409 = e-mail už na seznamu je. Ukážeme stejné potvrzení, ať stránka neprozradí, kdo je zapsaný.
  if (res.ok || res.status === 409) return;
  throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}
