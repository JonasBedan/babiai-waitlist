-- Čekací listina (zadání, sekce 8 a 10b). Ukládá jen e-mail, souhlas, audience, zdroj a čas.

create table public.waitlist (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  audience       text not null default 'unknown'
                 check (audience in ('senior', 'family', 'unknown')),
  consent_text   text not null,       -- přesné znění souhlasu, které uživatel viděl
  policy_version text not null,       -- verze Zásad zpracování údajů
  source         text,                -- z UTM parametrů, volitelné
  created_at     timestamptz not null default now()
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

-- Práva na úrovni tabulky: nové projekty Supabase nemusí tabulky v public automaticky vystavit do Data API.
-- anon smí jen INSERT; čtení, úpravy a mazání mu výslovně bereme (obrana do hloubky vedle RLS).
revoke all on public.waitlist from anon, authenticated;
grant insert (email, audience, consent_text, policy_version, source) on public.waitlist to anon;
