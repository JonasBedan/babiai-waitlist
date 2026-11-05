// Přepínač čtenáře: mění podnadpis a popisek formuláře. Hodnota se posílá s e-mailem.
import { track } from './track.js';

export const LEAD = {
  unknown:
    'Krátké lekce v češtině, které naučí poznat falešný hovor, zprávu nebo video. Až bude aplikace hotová, napíšeme vám jako prvním.',
  senior:
    'Krátké lekce, které vás naučí poznat falešný hovor, zprávu nebo video. Nic nemusíte umět předem. Až bude hotovo, napíšeme vám.',
  family:
    'Krátké lekce, které naučí vaše rodiče poznat falešný hovor, zprávu nebo video. Bez strašení a bez složitých slov. Až bude hotovo, napíšeme vám.',
};

let current = 'unknown';
const listeners = [];

export const getAudience = () => current;
export const onAudience = (fn) => listeners.push(fn);

export function initAudience() {
  const buttons = document.querySelectorAll('[data-audience]');
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      current = btn.dataset.audience;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      document.getElementById('lead').textContent = LEAD[current];
      track('audience_toggle', { audience: current });
      listeners.forEach((fn) => fn(current));
    }),
  );
}
