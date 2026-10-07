// "Poslat dál": Web Share API, jinak zkopírování odkazu.
import { getAudience } from './audience.js';
import { track } from './track.js';

const TEXT = {
  senior: 'Prosím, podívej se na tuhle stránku a zapiš mě.',
  family: 'Tohle by se hodilo pro mámu nebo tátu.',
};

export function initShare() {
  document.querySelectorAll('[data-share]').forEach((btn) => btn.addEventListener('click', () => share(btn)));
}

async function share(btn) {
  const audience = getAudience();
  const text = TEXT[audience] || TEXT.senior;
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('utm_source', 'sdileni');
  url.searchParams.set('utm_medium', audience);
  track('share_click', { audience });

  const status = btn.parentElement.querySelector('.share-status');
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, text, url: url.href });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url.href}`);
    if (status) status.textContent = 'Odkaz je zkopírovaný. Vložte ho do zprávy nebo e-mailu.';
  } catch {
    if (status) status.textContent = `Pošlete tento odkaz: ${url.href}`;
  }
}
