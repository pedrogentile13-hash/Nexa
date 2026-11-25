-- ============================================================================
-- Nexa — Corretor de redação (modelo ENEM): histórico por aluno
--
-- Guarda cada correção para o aluno ver a EVOLUÇÃO e a competência que mais
-- puxa a nota para baixo. As cinco notas seguem a régua do ENEM (0 a 200, em
-- degraus de 40), e o banco recusa qualquer outro valor — mesmo que o app
-- errasse, uma nota fora da régua não entra.
--
-- Privado do aluno. O texto da redação é dado pessoal: sai junto com a conta
-- (on delete cascade) e o aluno pode apagar uma correção quando quiser.
-- ============================================================================

create table if not exists public.essay_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme text not null check (length(btrim(theme)) between 3 and 300),
  essay text not null check (length(btrim(essay)) between 100 and 8000),
  c1 smallint not null check (c1 between 0 and 200 and c1 % 40 = 0),
  c2 smallint not null check (c2 between 0 and 200 and c2 % 40 = 0),
  c3 smallint not null check (c3 between 0 and 200 and c3 % 40 = 0),
  c4 smallint not null check (c4 between 0 and 200 and c4 % 40 = 0),
  c5 smallint not null check (c5 between 0 and 200 and c5 % 40 = 0),
  total smallint generated always as (c1 + c2 + c3 + c4 + c5) stored,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists essay_corrections_user_idx on public.essay_corrections (user_id, created_at desc);

alter table public.essay_corrections enable row level security;

drop policy if exists essay_corrections_select_own on public.essay_corrections;
create policy essay_corrections_select_own on public.essay_corrections
  for select to authenticated using (user_id = auth.uid());

drop policy if exists essay_corrections_insert_own on public.essay_corrections;
create policy essay_corrections_insert_own on public.essay_corrections
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists essay_corrections_delete_own on public.essay_corrections;
create policy essay_corrections_delete_own on public.essay_corrections
  for delete to authenticated using (user_id = auth.uid());
