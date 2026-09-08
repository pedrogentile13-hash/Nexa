-- ============================================================================
-- Nexa Study — 0908 (4) · Metas
--
-- Os quatro indicadores do topo (horas/matérias/atividades/sequência) são
-- todos calculados a partir de dado real (study_sessions/subjects/
-- quiz_attempts/resource_progress/user_stats) — só a META de cada um é
-- escolha do aluno, guardada em profiles.
--
-- `long_term_goals` é a ÚNICA parte do produto onde o aluno digita um número
-- manualmente, e é aceitável: é uma meta de vida ("passar no ENEM"), não uma
-- nota — o aluno mesmo ajusta o quanto acha que avançou, sem fingir que o
-- sistema mede isso automaticamente.
-- ============================================================================

alter table public.profiles
  add column if not exists monthly_activities_goal integer not null default 20
    check (monthly_activities_goal >= 0),
  add column if not exists monthly_subjects_goal integer not null default 4
    check (monthly_subjects_goal >= 0);

create table if not exists public.long_term_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 120),
  icon text not null default 'target',
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists long_term_goals_user_idx on public.long_term_goals (user_id, created_at desc);

alter table public.long_term_goals enable row level security;

drop policy if exists long_term_goals_all_own on public.long_term_goals;
create policy long_term_goals_all_own on public.long_term_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists long_term_goals_set_updated_at on public.long_term_goals;
create trigger long_term_goals_set_updated_at before update on public.long_term_goals
  for each row execute function public.set_updated_at();
