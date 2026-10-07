// Nastavení z prostředí (.env). Do prohlížeče patří jen anonymní (publishable) klíč.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN || '';

// Verze Zásad zpracování údajů. Při každé změně zasady.html ji zvyšte (stejná hodnota je uvedená na stránce zásad).
export const POLICY_VERSION = '2026-10-07';

// Přesné znění souhlasu, jak ho uživatel vidí u zaškrtávátka. Ukládá se s každým zápisem.
export const CONSENT_TEXT =
  'Souhlasím se zpracováním e-mailu, abyste mi mohli oznámit spuštění aplikace. Zásady zpracování údajů';

// Náhled pro připomínky (VITE_PREVIEW=1): formulář nic neodesílá a stránka to říká nahoře.
export const PREVIEW = import.meta.env.VITE_PREVIEW === '1';
