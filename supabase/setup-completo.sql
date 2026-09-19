-- ============================================================================
-- Nexa — setup completo do banco, em um arquivo só
--
-- COMO USAR
--   1. Abra seu projeto no Supabase
--   2. Menu lateral → SQL Editor → New query
--   3. Cole TUDO isto e clique em Run
--
-- SEGURO RODAR QUANTAS VEZES QUISER. Em projeto novo, cria tudo; em projeto que
-- já rodou uma versão anterior, adiciona só o que falta e deixa o resto como
-- está. Nenhum dado seu é apagado — nem notas, nem rotina, nem conteúdo.
--
-- Cria as 65 tabelas, as políticas de RLS, as 1 views, as funções e o
-- conteúdo inicial (matérias, conquistas e a biblioteca de estudo).
--
-- DEPOIS DE RODAR, para virar administrador do painel /admin, rode também:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI');
--
-- Gerado por scripts/build-setup-sql.sh a partir de supabase/migrations/ +
-- supabase/seed.sql — não edite aqui, edite os originais e gere de novo.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 20260730000100_extensions_helpers.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0100 · Extensions and shared helpers
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()
create extension if not exists pg_trgm; -- fuzzy school autocomplete

-- Keeps updated_at honest without relying on the application to remember.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'BEFORE UPDATE trigger: stamps updated_at = now().';

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000200_identity.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0200 · Identity, schools and the academic calendar
--
-- Design notes
--  * `terms` is the piece the original spec was missing. Without a period,
--    "média do bimestre", "meta do bimestre" and every evolution chart are
--    impossible to express, and retrofitting it later means rewriting the
--    whole grade layer.
--  * Calendars are per-user (`academic_years.user_id`), which already
--    satisfies "múltiplos calendários". When school-level calendars arrive
--    (v3, turmas), `user_id` becomes nullable and `school_id` takes over —
--    no change to anything that reads `terms`.
--  * `profiles.timezone` is not cosmetic: streaks and "hoje" are computed on
--    local day boundaries. In UTC the student's day would roll over at 21:00
--    BRT and break the streak on its own.
-- ============================================================================

-- ---------------------------------------------------------------- schools --
-- Shared catalog: any authenticated user may read it (autocomplete) and
-- contribute a missing school. Verified rows are curated and locked.
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 160),
  city text,
  state char(2),
  country char(2) not null default 'BR',
  is_verified boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schools_name_trgm_idx on public.schools using gin (name gin_trgm_ops);
create index if not exists schools_state_idx on public.schools (state) where state is not null;

drop trigger if exists schools_set_updated_at on public.schools;
create trigger schools_set_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

alter table public.schools enable row level security;

drop policy if exists schools_select_authenticated on public.schools;
create policy schools_select_authenticated on public.schools
  for select to authenticated using (true);

drop policy if exists schools_insert_own on public.schools;
create policy schools_insert_own on public.schools
  for insert to authenticated with check (created_by = auth.uid() and is_verified = false);

drop policy if exists schools_update_own_unverified on public.schools;
create policy schools_update_own_unverified on public.schools
  for update to authenticated
  using (created_by = auth.uid() and is_verified = false)
  with check (created_by = auth.uid() and is_verified = false);

-- --------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  school_id uuid references public.schools (id) on delete set null,
  grade_level text, -- "9º ano" — free text: every country labels these differently
  class_name text, -- "9A"
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  theme_preference text not null default 'system'
    check (theme_preference in ('light', 'dark', 'system')),
  weekly_study_goal_minutes integer not null default 300
    check (weekly_study_goal_minutes between 0 and 10080),
  daily_study_goal_minutes integer not null default 45
    check (daily_study_goal_minutes between 0 and 1440),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_school_id_idx on public.profiles (school_id) where school_id is not null;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------- user_local_date() ---
-- Single source of truth for "what day is it for this student".
-- SECURITY DEFINER so it can read the timezone off profiles regardless of the
-- caller's RLS context; it only ever exposes a date.
create or replace function public.user_local_date(p_user_id uuid default auth.uid())
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (
    now() at time zone coalesce(
      (select p.timezone from public.profiles p where p.id = p_user_id),
      'America/Sao_Paulo'
    )
  )::date;
$$;

comment on function public.user_local_date is
  'Current date in the user''s configured timezone. Use for streaks, "hoje" and daily progress.';

-- -------------------------------------------------------- academic_years --
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 40), -- "2026"
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_range_ck check (ends_on > starts_on),
  constraint academic_years_user_label_uq unique (user_id, label)
);

create index if not exists academic_years_user_idx on public.academic_years (user_id);
-- At most one active year per user.
create unique index if not exists academic_years_one_active_uq
  on public.academic_years (user_id) where is_active;

drop trigger if exists academic_years_set_updated_at on public.academic_years;
create trigger academic_years_set_updated_at before update on public.academic_years
  for each row execute function public.set_updated_at();

alter table public.academic_years enable row level security;

drop policy if exists academic_years_all_own on public.academic_years;
create policy academic_years_all_own on public.academic_years
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ terms --
-- Bimestre / trimestre / semestre — the shape is data, not code.
create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60), -- "1º Bimestre"
  sequence smallint not null check (sequence between 1 and 12),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint terms_range_ck check (ends_on >= starts_on),
  constraint terms_year_sequence_uq unique (academic_year_id, sequence)
);

create index if not exists terms_user_idx on public.terms (user_id);
create index if not exists terms_year_idx on public.terms (academic_year_id);
-- "Which term is today in?" — the single hottest calendar lookup.
create index if not exists terms_user_range_idx on public.terms (user_id, starts_on, ends_on);

drop trigger if exists terms_set_updated_at on public.terms;
create trigger terms_set_updated_at before update on public.terms
  for each row execute function public.set_updated_at();

alter table public.terms enable row level security;

drop policy if exists terms_all_own on public.terms;
create policy terms_all_own on public.terms
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000300_subjects.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0300 · Subjects: shared catalog vs. the student's own instance
--
-- The spec says "as disciplinas nunca serão fixas no código". Two tables get
-- us there without making every student retype the same 15 names:
--   * subject_catalog — seeded, shared, read-only reference data.
--   * subjects        — the student's subject: their color, goal, teacher.
-- Onboarding turns catalog picks into `subjects` rows in one tap each.
-- A subject with catalog_id = null is a fully custom one; nothing breaks.
-- ============================================================================

-- --------------------------------------------------------- subject_catalog --
create table if not exists public.subject_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null default 'outros'
    check (area in ('linguagens', 'matematica', 'ciencias', 'humanas', 'tecnologia', 'outros')),
  default_color text not null default 'blue',
  default_icon text not null default 'book-open',
  -- Grade levels this subject typically appears in; empty = all.
  suggested_grade_levels text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists subject_catalog_active_idx on public.subject_catalog (sort_order) where is_active;
create index if not exists subject_catalog_name_trgm_idx on public.subject_catalog using gin (name gin_trgm_ops);

alter table public.subject_catalog enable row level security;

-- Read-only reference data. Writes happen through migrations/seed only.
drop policy if exists subject_catalog_select_authenticated on public.subject_catalog;
create policy subject_catalog_select_authenticated on public.subject_catalog
  for select to authenticated using (is_active);

-- --------------------------------------------------------------- subjects --
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id uuid references public.subject_catalog (id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 80),
  -- Palette token, not a free hex value: charts and badges stay legible and
  -- accessible in both themes. Resolved by src/lib/design/subject-colors.ts.
  color text not null default 'blue',
  icon text not null default 'book-open',
  teacher_name text,
  -- Per-subject goal; falls back to the term goal, then the profile goal.
  target_grade numeric(5, 2) check (target_grade >= 0),
  sort_order integer not null default 100,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_idx on public.subjects (user_id) where archived_at is null;
create index if not exists subjects_user_sort_idx on public.subjects (user_id, sort_order);
-- No two active subjects with the same name for the same student.
create unique index if not exists subjects_user_name_active_uq
  on public.subjects (user_id, lower(btrim(name))) where archived_at is null;

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;

drop policy if exists subjects_all_own on public.subjects;
create policy subjects_all_own on public.subjects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000400_grading.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0400 · Grading: reusable schemes, subject×term, activities
--
-- Why schemes instead of categories-per-subject (as originally specified):
--   15 subjects × 3 categories × 4 terms = 180 rows the student would have to
--   create and maintain, and changing "PB 35% → 40%" would be 15 separate
--   edits. That breaks the "máximo 3 cliques" rule outright.
--   A scheme is authored once and applied everywhere; a subject that grades
--   differently just points at its own scheme.
--
-- Why category percentages are NOT constrained to sum to 100:
--   Supabase REST issues one transaction per request, so a deferred "must
--   total 100" constraint would reject any two-step edit (lower PB, raise VA)
--   and make the editor hostile. Instead the calculation always normalizes by
--   the actual sum, so the final average is correct for any total, and the UI
--   surfaces a hint when it isn't 100. Forgiving, and never silently wrong.
--
-- Scale handling: `activities.score` is raw and `max_score` is the scale it was
-- given on, so a test out of 20 and one out of 10 coexist. Everything is
-- normalized to the scheme's grade_max before averaging.
-- ============================================================================

-- -------------------------------------------------------- grading_schemes --
create table if not exists public.grading_schemes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  grade_min numeric(6, 2) not null default 0,
  grade_max numeric(6, 2) not null default 10,
  passing_grade numeric(6, 2) not null default 6,
  -- How a displayed average is rounded. Calculation stays full-precision.
  decimals smallint not null default 1 check (decimals between 0 and 4),
  rounding_mode text not null default 'half_up'
    check (rounding_mode in ('half_up', 'half_even', 'floor', 'ceil')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grading_schemes_scale_ck check (grade_max > grade_min),
  constraint grading_schemes_passing_ck
    check (passing_grade >= grade_min and passing_grade <= grade_max),
  constraint grading_schemes_user_name_uq unique (user_id, name)
);

create index if not exists grading_schemes_user_idx on public.grading_schemes (user_id);
create unique index if not exists grading_schemes_one_default_uq
  on public.grading_schemes (user_id) where is_default;

drop trigger if exists grading_schemes_set_updated_at on public.grading_schemes;
create trigger grading_schemes_set_updated_at before update on public.grading_schemes
  for each row execute function public.set_updated_at();

alter table public.grading_schemes enable row level security;

drop policy if exists grading_schemes_all_own on public.grading_schemes;
create policy grading_schemes_all_own on public.grading_schemes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------- grading_scheme_categories --
-- PB 35% · VA 35% · Qualitativa 30% — as data, per the spec.
create table if not exists public.grading_scheme_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scheme_id uuid not null references public.grading_schemes (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  short_code text check (length(btrim(short_code)) between 1 and 12), -- "PB"
  weight_percent numeric(6, 3) not null default 0
    check (weight_percent >= 0 and weight_percent <= 100),
  sequence smallint not null default 1 check (sequence between 1 and 30),
  -- Brazilian-school realities the original model had no room for:
  drop_lowest smallint not null default 0 check (drop_lowest between 0 and 5),
  allows_replacement boolean not null default true, -- substitutiva
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gsc_scheme_sequence_uq unique (scheme_id, sequence)
);

create index if not exists gsc_scheme_idx on public.grading_scheme_categories (scheme_id, sequence);
create index if not exists gsc_user_idx on public.grading_scheme_categories (user_id);

drop trigger if exists gsc_set_updated_at on public.grading_scheme_categories;
create trigger gsc_set_updated_at before update on public.grading_scheme_categories
  for each row execute function public.set_updated_at();

alter table public.grading_scheme_categories enable row level security;

drop policy if exists gsc_all_own on public.grading_scheme_categories;
create policy gsc_all_own on public.grading_scheme_categories
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------- subject_terms --
-- One row per subject per term: the unit every average is computed over.
create table if not exists public.subject_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  scheme_id uuid references public.grading_schemes (id) on delete set null,
  target_grade numeric(5, 2) check (target_grade >= 0),
  -- Escape hatch for a grade the school published that our math can't derive
  -- (recuperação, conselho de classe). Wins over the computed value.
  final_grade_override numeric(6, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subject_terms_subject_term_uq unique (subject_id, term_id)
);

create index if not exists subject_terms_user_idx on public.subject_terms (user_id);
create index if not exists subject_terms_term_idx on public.subject_terms (term_id);
create index if not exists subject_terms_subject_idx on public.subject_terms (subject_id);

drop trigger if exists subject_terms_set_updated_at on public.subject_terms;
create trigger subject_terms_set_updated_at before update on public.subject_terms
  for each row execute function public.set_updated_at();

alter table public.subject_terms enable row level security;

drop policy if exists subject_terms_all_own on public.subject_terms;
create policy subject_terms_all_own on public.subject_terms
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------- activities --
-- The spec called this `assessments`; "activity" is what it actually holds —
-- one graded item (lista, trabalho, prova) inside a category.
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_term_id uuid not null references public.subject_terms (id) on delete cascade,
  category_id uuid not null references public.grading_scheme_categories (id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  -- null score = not graded yet. This is what makes "próximas provas" and
  -- "quanto preciso tirar" possible from the same row.
  score numeric(7, 3) check (score >= 0),
  max_score numeric(7, 3) check (max_score > 0),
  weight numeric(6, 3) not null default 1 check (weight > 0),
  due_date date,
  graded_at date,
  teacher_name text,
  notes text,
  -- Excluded from the average: manual exclusion or "drop the lowest".
  is_dropped boolean not null default false,
  -- Substitutiva/recovery: this activity supersedes another one.
  replaces_activity_id uuid references public.activities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_no_self_replace check (replaces_activity_id is null or replaces_activity_id <> id)
);

create index if not exists activities_user_idx on public.activities (user_id);
create index if not exists activities_subject_term_idx on public.activities (subject_term_id);
create index if not exists activities_category_idx on public.activities (category_id);
-- Drives "próximas provas / próximas entregas" on the Hoje screen.
create index if not exists activities_user_due_pending_idx
  on public.activities (user_id, due_date)
  where score is null and due_date is not null;
create index if not exists activities_replaces_idx
  on public.activities (replaces_activity_id) where replaces_activity_id is not null;

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

drop policy if exists activities_all_own on public.activities;
create policy activities_all_own on public.activities
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------- integrity: category ↔ scheme --
-- An activity's category must belong to the scheme its subject_term uses.
-- Without this, a mis-wired write produces a silently wrong final average —
-- the one class of bug that would destroy trust in the product.
create or replace function public.assert_activity_category_matches_scheme()
returns trigger
language plpgsql
as $$
declare
  v_expected_scheme uuid;
  v_category_scheme uuid;
begin
  select coalesce(st.scheme_id, (
           select gs.id from public.grading_schemes gs
           where gs.user_id = st.user_id and gs.is_default
           limit 1
         ))
    into v_expected_scheme
  from public.subject_terms st
  where st.id = new.subject_term_id;

  select gsc.scheme_id into v_category_scheme
  from public.grading_scheme_categories gsc
  where gsc.id = new.category_id;

  if v_expected_scheme is null then
    raise exception 'subject_term % has no grading scheme and the user has no default scheme',
      new.subject_term_id using errcode = '23514';
  end if;

  if v_category_scheme is distinct from v_expected_scheme then
    raise exception 'category % belongs to scheme %, but subject_term % uses scheme %',
      new.category_id, v_category_scheme, new.subject_term_id, v_expected_scheme
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists activities_category_scheme_ck on public.activities;
create trigger activities_category_scheme_ck
  before insert or update of category_id, subject_term_id on public.activities
  for each row execute function public.assert_activity_category_matches_scheme();

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000500_routine.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0500 · Routine: checklist, tasks, study sessions, timetable, files
--
-- The "checklist diário" is a headline component of the Hoje screen and the
-- original model had no table for it at all. It is modelled as routines +
-- completions rather than as recurring tasks: a habit's history is a set of
-- (routine, local_date) facts, which is exactly what the streak needs and what
-- generating phantom task rows every day would make expensive.
--
-- `local_date` everywhere is the date in the user's timezone
-- (public.user_local_date). Never derive it from a UTC timestamp.
-- ============================================================================

-- --------------------------------------------------------------- routines --
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 120),
  icon text not null default 'check',
  -- ISO-ish day numbers, 0 = Sunday. Empty array is rejected by the check.
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}'
    check (days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[] and array_length(days_of_week, 1) >= 1),
  target_count smallint not null default 1 check (target_count between 1 and 50),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routines_user_active_idx on public.routines (user_id, sort_order) where is_active;

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at before update on public.routines
  for each row execute function public.set_updated_at();

alter table public.routines enable row level security;

drop policy if exists routines_all_own on public.routines;
create policy routines_all_own on public.routines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------- routine_completions --
create table if not exists public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  local_date date not null,
  count smallint not null default 1 check (count >= 1),
  completed_at timestamptz not null default now(),
  constraint routine_completions_once_per_day_uq unique (routine_id, local_date)
);

create index if not exists routine_completions_user_date_idx
  on public.routine_completions (user_id, local_date desc);

alter table public.routine_completions enable row level security;

drop policy if exists routine_completions_all_own on public.routine_completions;
create policy routine_completions_all_own on public.routine_completions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ tasks --
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Nullable: "levar atestado" is a real task with no subject.
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text,
  kind text not null default 'task'
    check (kind in ('task', 'homework', 'reading', 'review', 'exercise', 'project', 'custom')),
  due_date date,
  due_time time,
  priority smallint not null default 2 check (priority between 1 and 3), -- 1 alta
  estimated_minutes integer check (estimated_minutes between 0 and 1440),
  completed_at timestamptz,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_open_due_idx
  on public.tasks (user_id, due_date) where completed_at is null;
create index if not exists tasks_user_subject_idx on public.tasks (user_id, subject_id);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists tasks_all_own on public.tasks;
create policy tasks_all_own on public.tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------- study_sessions --
-- started_at/ended_at (not just `duration`) so the timer can be paused,
-- resumed and recovered after the app is killed — an iPhone will do that.
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  local_date date not null,
  source text not null default 'timer' check (source in ('timer', 'manual')),
  focus_rating smallint check (focus_rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_range_ck check (ended_at is null or ended_at >= started_at)
);

create index if not exists study_sessions_user_date_idx on public.study_sessions (user_id, local_date desc);
create index if not exists study_sessions_user_subject_idx on public.study_sessions (user_id, subject_id);
-- At most one running timer per user.
create unique index if not exists study_sessions_one_running_uq
  on public.study_sessions (user_id) where ended_at is null;

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at before update on public.study_sessions
  for each row execute function public.set_updated_at();

alter table public.study_sessions enable row level security;

drop policy if exists study_sessions_all_own on public.study_sessions;
create policy study_sessions_all_own on public.study_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------------------- timetable_slots --
-- The weekly class schedule. This is what upgrades "Hoje" from a due-date list
-- to something that knows you have Matemática today.
create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  -- Schedules change between terms; null = valid for the whole year.
  term_id uuid references public.terms (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_slots_range_ck check (ends_at > starts_at)
);

create index if not exists timetable_slots_user_day_idx
  on public.timetable_slots (user_id, day_of_week, starts_at);

drop trigger if exists timetable_slots_set_updated_at on public.timetable_slots;
create trigger timetable_slots_set_updated_at before update on public.timetable_slots
  for each row execute function public.set_updated_at();

alter table public.timetable_slots enable row level security;

drop policy if exists timetable_slots_all_own on public.timetable_slots;
create policy timetable_slots_all_own on public.timetable_slots
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ attachments --
-- Backs "Resumos / Exercícios / Arquivos" per subject. `content` exists because
-- most resumos are typed in the app, not uploaded as a file.
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete cascade,
  kind text not null check (kind in ('summary', 'exercise', 'file', 'link')),
  title text not null check (length(btrim(title)) between 1 and 200),
  content text, -- markdown, for kind = 'summary'
  storage_path text, -- Supabase Storage object path, for kind = 'file'
  external_url text, -- for kind = 'link'
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attachments_payload_ck check (
    (kind = 'summary' and content is not null)
    or (kind = 'file' and storage_path is not null)
    or (kind = 'link' and external_url is not null)
    or (kind = 'exercise' and (content is not null or storage_path is not null))
  )
);

create index if not exists attachments_user_subject_idx on public.attachments (user_id, subject_id, kind);

drop trigger if exists attachments_set_updated_at on public.attachments;
create trigger attachments_set_updated_at before update on public.attachments
  for each row execute function public.set_updated_at();

alter table public.attachments enable row level security;

drop policy if exists attachments_all_own on public.attachments;
create policy attachments_all_own on public.attachments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000600_gamification.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0600 · Gamification: XP ledger, stats, achievements, streaks
--
-- Two-layer design on purpose:
--   * xp_events   — append-only ledger, the source of truth. Auditable, and it
--                   makes "+20 XP por concluir 3 tarefas" explainable instead of
--                   a number that mysteriously moved.
--   * user_stats  — denormalized totals. The Hoje screen reads streak/XP on
--                   every load; that must be one indexed row, not an aggregate.
--
-- The client gets SELECT and nothing else on both tables. Every mutation goes
-- through the SECURITY DEFINER functions at the bottom of this file — a client
-- that could UPDATE user_stats could set its own XP to a million, and a
-- leaderboard (v3) would be meaningless.
--
-- Achievements are rows, not code, so a new one ships without a deploy.
--
-- Streak freezes exist because README Parte 3 says the student must never feel
-- pressured. A streak that punishes a single missed day is the most common
-- reason people abandon this class of app.
-- ============================================================================

-- ------------------------------------------------------------- user_stats --
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level smallint not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_local_date date,
  -- One forgiven day per ISO week, granted lazily on first activity.
  streak_freezes_available smallint not null default 1
    check (streak_freezes_available between 0 and 5),
  streak_freezes_granted_week date,
  total_study_seconds bigint not null default 0 check (total_study_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_stats_set_updated_at on public.user_stats;
create trigger user_stats_set_updated_at before update on public.user_stats
  for each row execute function public.set_updated_at();

alter table public.user_stats enable row level security;

-- Read-only for the client. No INSERT/UPDATE/DELETE policy on purpose.
drop policy if exists user_stats_select_own on public.user_stats;
create policy user_stats_select_own on public.user_stats
  for select to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------------- xp_events --
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null,
  source_type text check (
    source_type in ('task', 'routine', 'study_session', 'activity', 'achievement', 'system')
  ),
  source_id uuid,
  local_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists xp_events_user_date_idx on public.xp_events (user_id, local_date desc);
-- Idempotency: awarding the same source twice is a no-op, so a double-tapped
-- checkbox or a retried Server Action cannot inflate XP.
create unique index if not exists xp_events_source_uq
  on public.xp_events (user_id, source_type, source_id, reason)
  where source_id is not null;

alter table public.xp_events enable row level security;

drop policy if exists xp_events_select_own on public.xp_events;
create policy xp_events_select_own on public.xp_events
  for select to authenticated using (user_id = auth.uid());

-- ----------------------------------------------------------- achievements --
create table if not exists public.achievements (
  id text primary key, -- slug: 'streak_7', 'first_grade'
  name text not null,
  description text not null,
  icon text not null default 'award',
  category text not null default 'geral'
    check (category in ('geral', 'estudo', 'notas', 'organizacao', 'constancia')),
  -- Interpreted against `metric`; e.g. metric = 'streak_days', threshold = 7.
  metric text not null,
  threshold integer not null check (threshold > 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

drop policy if exists achievements_select_authenticated on public.achievements;
create policy achievements_select_authenticated on public.achievements
  for select to authenticated using (is_active);

-- ------------------------------------------------------ user_achievements --
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index if not exists user_achievements_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc) where unlocked_at is not null;

drop trigger if exists user_achievements_set_updated_at on public.user_achievements;
create trigger user_achievements_set_updated_at before update on public.user_achievements
  for each row execute function public.set_updated_at();

alter table public.user_achievements enable row level security;

drop policy if exists user_achievements_select_own on public.user_achievements;
create policy user_achievements_select_own on public.user_achievements
  for select to authenticated using (user_id = auth.uid());

-- ============================================================================
-- Write path — SECURITY DEFINER, the only way stats and XP ever change.
-- ============================================================================

-- Level curve: level = 1 + floor(sqrt(xp / 100)).
-- 0 → 1 · 100 → 2 · 400 → 3 · 900 → 4 · 1600 → 5.
-- Deliberately decelerating: early levels arrive fast enough to feel like
-- progress, later ones never become the point of the product.
create or replace function public.xp_to_level(p_xp integer)
returns smallint
language sql
immutable
as $$
  select greatest(1, 1 + floor(sqrt(greatest(p_xp, 0) / 100.0))::int)::smallint;
$$;

create or replace function public.ensure_user_stats(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'ensure_user_stats requires a user' using errcode = '28000';
  end if;
  insert into public.user_stats (user_id) values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Records an XP award in the ledger and rolls the denormalized totals forward.
-- Returns the amount actually granted: 0 when the source was already awarded.
create or replace function public.award_xp(
  p_amount integer,
  p_reason text,
  p_source_type text default 'system',
  p_source_id uuid default null,
  p_user_id uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_today date;
begin
  if p_user_id is null then
    raise exception 'award_xp requires a user' using errcode = '28000';
  end if;
  if p_amount = 0 then
    return 0;
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);

  insert into public.xp_events (user_id, amount, reason, source_type, source_id, local_date)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id, v_today)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 0; -- already awarded for this source
  end if;

  update public.user_stats s
  set xp = greatest(0, s.xp + p_amount),
      level = public.xp_to_level(greatest(0, s.xp + p_amount))
  where s.user_id = p_user_id;

  return p_amount;
end;
$$;

-- Call whenever the student does something that counts as showing up.
-- Idempotent per local day. Returns the resulting streak.
create or replace function public.touch_streak(p_user_id uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_week date;
  v_stats public.user_stats;
  v_gap integer;
  v_new_streak integer;
  v_freezes smallint;
begin
  if p_user_id is null then
    raise exception 'touch_streak requires a user' using errcode = '28000';
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);
  v_week := date_trunc('week', v_today)::date;

  select * into v_stats from public.user_stats where user_id = p_user_id for update;

  -- Grant this week's forgiveness, if it hasn't been granted yet.
  v_freezes := v_stats.streak_freezes_available;
  if v_stats.streak_freezes_granted_week is null or v_stats.streak_freezes_granted_week < v_week then
    v_freezes := 1;
  end if;

  if v_stats.last_active_local_date = v_today then
    return v_stats.current_streak; -- already counted today
  end if;

  if v_stats.last_active_local_date is null then
    v_new_streak := 1;
  else
    v_gap := v_today - v_stats.last_active_local_date;
    if v_gap = 1 then
      v_new_streak := v_stats.current_streak + 1;
    elsif v_gap = 2 and v_freezes > 0 then
      -- Exactly one day missed and a freeze available: the streak survives.
      v_new_streak := v_stats.current_streak + 1;
      v_freezes := v_freezes - 1;
    else
      v_new_streak := 1;
    end if;
  end if;

  update public.user_stats
  set current_streak = v_new_streak,
      longest_streak = greatest(longest_streak, v_new_streak),
      last_active_local_date = v_today,
      streak_freezes_available = v_freezes,
      streak_freezes_granted_week = v_week
  where user_id = p_user_id;

  return v_new_streak;
end;
$$;

-- Keeps total_study_seconds in sync from the sessions table itself, so the
-- denormalized total can never drift from the rows it summarizes.
create or replace function public.sync_study_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
begin
  perform public.ensure_user_stats(v_user);
  update public.user_stats s
  set total_study_seconds = coalesce((
    select sum(ss.duration_seconds) from public.study_sessions ss where ss.user_id = v_user
  ), 0)
  where s.user_id = v_user;
  return null;
end;
$$;

drop trigger if exists study_sessions_sync_total on public.study_sessions;
create trigger study_sessions_sync_total
  after insert or update of duration_seconds or delete on public.study_sessions
  for each row execute function public.sync_study_total();

grant execute on function public.xp_to_level(integer) to authenticated;
grant execute on function public.ensure_user_stats(uuid) to authenticated;
grant execute on function public.award_xp(integer, text, text, uuid, uuid) to authenticated;
grant execute on function public.touch_streak(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000700_grade_views.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0700 · Grade calculation views
--
-- These views are the AUTHORITY on every average in the product. The TypeScript
-- engine in src/features/grades/lib/ mirrors them for optimistic UI only, and a
-- parity test keeps the two honest. One formula, one answer, everywhere.
--
-- `security_invoker = true` is mandatory, not stylistic: a plain Postgres view
-- runs with its owner's privileges and would bypass RLS on the tables beneath,
-- exposing every student's grades to every other student.
--
-- Averaging rules
--  1. Raw scores are normalized to the scheme scale: score/max_score × grade_max,
--     so a test out of 20 and one out of 10 can sit in the same category.
--  2. Category average = weighted mean of counted activities (peso = weight).
--  3. An activity is counted unless: ungraded, manually dropped, superseded by a
--     substitutiva, or removed by the category's drop_lowest rule.
--  4. Final average = weighted mean of category averages, normalized over the
--     categories that ACTUALLY have grades. A term with only PB posted shows the
--     PB average, not a pessimistic third of it. `coverage_percent` reports how
--     much of the term that answer is based on.
-- ============================================================================

-- ------------------------------------------------- v_subject_terms_resolved --
-- Resolves each subject×term to its effective grading scheme (own, else the
-- user's default) and denormalizes the labels every screen needs.
create or replace view public.v_subject_terms_resolved
with (security_invoker = true) as
select
  st.id as subject_term_id,
  st.user_id,
  st.subject_id,
  st.term_id,
  st.target_grade as subject_term_target,
  st.final_grade_override,
  st.notes,
  s.name as subject_name,
  s.color as subject_color,
  s.icon as subject_icon,
  s.target_grade as subject_target,
  s.archived_at as subject_archived_at,
  t.name as term_name,
  t.sequence as term_sequence,
  t.starts_on as term_starts_on,
  t.ends_on as term_ends_on,
  t.academic_year_id,
  gs.id as scheme_id,
  gs.name as scheme_name,
  gs.grade_min,
  gs.grade_max,
  gs.passing_grade,
  gs.decimals,
  gs.rounding_mode
from public.subject_terms st
join public.subjects s on s.id = st.subject_id
join public.terms t on t.id = st.term_id
left join lateral (
  select d.id from public.grading_schemes d
  where d.user_id = st.user_id and d.is_default
  limit 1
) def on true
join public.grading_schemes gs on gs.id = coalesce(st.scheme_id, def.id);

-- ---------------------------------------------------- v_activities_effective --
-- Every activity plus the derived facts the average depends on.
create or replace view public.v_activities_effective
with (security_invoker = true) as
with scaled as (
  select
    a.id,
    a.user_id,
    a.subject_term_id,
    a.category_id,
    a.title,
    a.score,
    a.max_score,
    a.weight,
    a.due_date,
    a.graded_at,
    a.teacher_name,
    a.notes,
    a.is_dropped,
    a.replaces_activity_id,
    a.created_at,
    a.updated_at,
    r.subject_id,
    r.term_id,
    r.subject_name,
    r.subject_color,
    r.grade_max,
    r.passing_grade,
    gsc.scheme_id,
    gsc.name as category_name,
    gsc.short_code as category_code,
    gsc.sequence as category_sequence,
    gsc.weight_percent,
    gsc.drop_lowest,
    -- A substitutiva with a grade retires the activity it replaces.
    exists (
      select 1
      from public.activities sup
      where sup.replaces_activity_id = a.id and sup.score is not null
    ) as is_superseded,
    case
      when a.score is null then null
      else a.score / nullif(coalesce(a.max_score, r.grade_max), 0) * r.grade_max
    end as normalized_score
  from public.activities a
  join public.v_subject_terms_resolved r on r.subject_term_id = a.subject_term_id
  join public.grading_scheme_categories gsc on gsc.id = a.category_id
),
-- Rank only the rows that are actually eligible, so drop_lowest counts the
-- lowest *counted* grades rather than being thrown off by ungraded rows.
eligible_rank as (
  select
    s.id,
    row_number() over (
      partition by s.subject_term_id, s.category_id
      order by s.normalized_score asc, s.id asc
    ) as lowest_rank
  from scaled s
  where s.score is not null and not s.is_dropped and not s.is_superseded
)
select
  s.*,
  er.lowest_rank,
  (
    s.score is not null
    and not s.is_dropped
    and not s.is_superseded
    and (s.drop_lowest = 0 or er.lowest_rank is null or er.lowest_rank > s.drop_lowest)
  ) as is_counted
from scaled s
left join eligible_rank er on er.id = s.id;

-- ------------------------------------------------------ v_category_averages --
-- Every category of the scheme appears, even with zero activities, so the UI
-- can render "Qualitativa — nada lançado" instead of hiding it.
create or replace view public.v_category_averages
with (security_invoker = true) as
select
  r.user_id,
  r.subject_term_id,
  r.subject_id,
  r.term_id,
  r.scheme_id,
  r.grade_max,
  r.passing_grade,
  gsc.id as category_id,
  gsc.name as category_name,
  gsc.short_code as category_code,
  gsc.sequence as category_sequence,
  gsc.weight_percent,
  gsc.drop_lowest,
  count(ae.id) as activity_count,
  count(ae.id) filter (where ae.is_counted) as counted_count,
  count(ae.id) filter (where ae.score is null) as pending_count,
  coalesce(sum(ae.weight) filter (where ae.is_counted), 0) as counted_weight,
  case
    when coalesce(sum(ae.weight) filter (where ae.is_counted), 0) > 0
      then sum(ae.normalized_score * ae.weight) filter (where ae.is_counted)
           / sum(ae.weight) filter (where ae.is_counted)
  end as average
from public.v_subject_terms_resolved r
join public.grading_scheme_categories gsc on gsc.scheme_id = r.scheme_id
left join public.v_activities_effective ae
  on ae.subject_term_id = r.subject_term_id and ae.category_id = gsc.id
group by
  r.user_id, r.subject_term_id, r.subject_id, r.term_id, r.scheme_id,
  r.grade_max, r.passing_grade, gsc.id, gsc.name, gsc.short_code,
  gsc.sequence, gsc.weight_percent, gsc.drop_lowest;

-- ------------------------------------------------- v_subject_term_averages --
create or replace view public.v_subject_term_averages
with (security_invoker = true) as
with agg as (
  select
    ca.user_id,
    ca.subject_term_id,
    ca.subject_id,
    ca.term_id,
    ca.scheme_id,
    ca.grade_max,
    ca.passing_grade,
    count(*) as category_count,
    count(*) filter (where ca.average is not null) as graded_category_count,
    sum(ca.weight_percent) as weight_total,
    coalesce(sum(ca.weight_percent) filter (where ca.average is not null), 0) as graded_weight,
    sum(ca.activity_count) as activity_count,
    sum(ca.pending_count) as pending_count,
    case
      when coalesce(sum(ca.weight_percent) filter (where ca.average is not null), 0) > 0
        then sum(ca.average * ca.weight_percent) filter (where ca.average is not null)
             / sum(ca.weight_percent) filter (where ca.average is not null)
    end as average_current
  from public.v_category_averages ca
  group by
    ca.user_id, ca.subject_term_id, ca.subject_id, ca.term_id,
    ca.scheme_id, ca.grade_max, ca.passing_grade
)
select
  agg.*,
  r.subject_name,
  r.subject_color,
  r.subject_icon,
  r.term_name,
  r.term_sequence,
  r.term_starts_on,
  r.term_ends_on,
  r.academic_year_id,
  r.decimals,
  r.rounding_mode,
  -- Goal precedence: subject×term > subject > none.
  coalesce(r.subject_term_target, r.subject_target) as target_grade,
  coalesce(r.final_grade_override, agg.average_current) as final_grade,
  (r.final_grade_override is not null) as is_overridden,
  case
    when agg.weight_total > 0 then agg.graded_weight / agg.weight_total * 100
    else 0
  end as coverage_percent,
  coalesce(r.final_grade_override, agg.average_current) < agg.passing_grade
    as is_below_passing,
  (
    coalesce(r.subject_term_target, r.subject_target) is not null
    and coalesce(r.final_grade_override, agg.average_current)
        < coalesce(r.subject_term_target, r.subject_target)
  ) as is_below_target
from agg
join public.v_subject_terms_resolved r on r.subject_term_id = agg.subject_term_id;

-- -------------------------------------------------------------- v_term_summary --
-- Feeds the "Como estou?" header: one row per term.
-- Subjects weigh equally in the overall average — no school weighs Matemática
-- above Artes for the bulletin mean, and pretending otherwise would surprise.
create or replace view public.v_term_summary
with (security_invoker = true) as
select
  sta.user_id,
  sta.term_id,
  sta.term_name,
  sta.term_sequence,
  sta.term_starts_on,
  sta.term_ends_on,
  sta.academic_year_id,
  count(*) as subjects_total,
  count(*) filter (where sta.final_grade is not null) as subjects_graded,
  avg(sta.final_grade) as average_overall,
  min(sta.final_grade) as lowest_grade,
  max(sta.final_grade) as highest_grade,
  count(*) filter (where sta.is_below_passing) as subjects_below_passing,
  count(*) filter (where sta.is_below_target) as subjects_below_target,
  sum(sta.pending_count) as pending_activities,
  avg(sta.coverage_percent) as avg_coverage_percent
from public.v_subject_term_averages sta
group by
  sta.user_id, sta.term_id, sta.term_name, sta.term_sequence,
  sta.term_starts_on, sta.term_ends_on, sta.academic_year_id;

-- ---------------------------------------------------------------- grants --
grant select on public.v_subject_terms_resolved to authenticated;
grant select on public.v_activities_effective to authenticated;
grant select on public.v_category_averages to authenticated;
grant select on public.v_subject_term_averages to authenticated;
grant select on public.v_term_summary to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000800_functions.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0800 · Business functions
--
-- `bootstrap_student` exists so the 60-second onboarding is ONE round trip and
-- ONE transaction. Doing it client-side would mean ~25 sequential REST calls
-- that can half-fail and leave a student with subjects but no terms — an
-- account in a state no screen can render.
-- ============================================================================

-- --------------------------------------------------------- current_term() --
-- The term today falls into; falls back to the nearest upcoming one, then the
-- most recent past one, so the app always has a term to render.
create or replace function public.current_term_id(p_user_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with today as (select public.user_local_date(p_user_id) as d)
  select t.id
  from public.terms t, today
  where t.user_id = p_user_id
  order by
    (today.d between t.starts_on and t.ends_on) desc,
    case when t.starts_on > today.d then t.starts_on - today.d else 100000 end asc,
    t.ends_on desc
  limit 1;
$$;

comment on function public.current_term_id is
  'Term containing today in the user timezone, else nearest upcoming, else latest past.';

-- ---------------------------------------------------- bootstrap_student() --
create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_class_name text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_categories jsonb default '[
    {"name": "Prova Bimestral", "short_code": "PB", "weight_percent": 35},
    {"name": "Verificação de Aprendizagem", "short_code": "VA", "weight_percent": 35},
    {"name": "Qualitativa", "short_code": "QL", "weight_percent": 30}
  ]'::jsonb
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_scheme_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_cat jsonb;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_user_id and p.onboarded_at is not null) then
    raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  -- Sensible calendar defaults so onboarding can ask nothing about dates.
  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (id, full_name, grade_level, class_name, school_id, timezone, onboarded_at)
  values (v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_class_name, p_school_id,
          coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'), now())
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        class_name = coalesce(excluded.class_name, p.class_name),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        onboarded_at = now();

  -- 2. Academic year ------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms, split evenly across the year -------------------------------
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Default grading scheme + categories -------------------------------
  insert into public.grading_schemes (user_id, name, is_default)
  values (v_user_id, 'Padrão da escola', true)
  returning id into v_scheme_id;

  v_idx := 0;
  for v_cat in select * from jsonb_array_elements(p_categories) loop
    v_idx := v_idx + 1;
    insert into public.grading_scheme_categories
      (user_id, scheme_id, name, short_code, weight_percent, sequence)
    values (
      v_user_id,
      v_scheme_id,
      coalesce(v_cat->>'name', 'Categoria ' || v_idx),
      nullif(v_cat->>'short_code', ''),
      coalesce((v_cat->>'weight_percent')::numeric, 0),
      v_idx::smallint
    );
  end loop;

  -- 5. Subjects, from catalog picks and free-typed names ------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 6. subject × term matrix ---------------------------------------------
  insert into public.subject_terms (user_id, subject_id, term_id, scheme_id)
  select v_user_id, s.id, t.id, v_scheme_id
  from unnest(v_subject_ids) as s (id)
  cross join unnest(v_term_ids) as t (id)
  on conflict (subject_id, term_id) do nothing;

  -- 7. A starter daily checklist, so "Hoje" is never empty on day one ----
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 8. Stats row (via definer helper — user_stats is client-read-only) ----
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'scheme_id', v_scheme_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids),
    'current_term_id', public.current_term_id(v_user_id)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], jsonb
) to authenticated;
grant execute on function public.current_term_id(uuid) to authenticated;
grant execute on function public.user_local_date(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260730000900_auth_bootstrap.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0900 · Auth hooks
--
-- A signed-up user must have a profile row before any screen renders, otherwise
-- the app has to special-case "authenticated but unknown" everywhere. The
-- trigger creates the minimum (profile + stats); everything else is created by
-- bootstrap_student during onboarding, where the student makes real choices.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- 20260730001000_storage.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 1000 · Storage
--
-- One private bucket. Every object lives under `<user_id>/...`, and the
-- policies check that the first path segment equals auth.uid(): a student can
-- never read or write another student's files, and no application bug can make
-- that happen either.
--
-- Guarded with a to_regclass check so the migration is a no-op on a bare
-- Postgres (CI, unit tests) where the storage extension is not installed.
-- ============================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'subject-files',
    'subject-files',
    false,
    26214400, -- 25 MB
    array[
      'image/png', 'image/jpeg', 'image/webp', 'image/heic',
      'application/pdf',
      'text/plain', 'text/markdown', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
  on conflict (id) do nothing;

  execute $ddl$
    drop policy if exists subject_files_select_own on storage.objects;
    create policy subject_files_select_own on storage.objects
      for select to authenticated
      using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists subject_files_insert_own on storage.objects;
    create policy subject_files_insert_own on storage.objects
      for insert to authenticated
      with check (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists subject_files_update_own on storage.objects;
    create policy subject_files_update_own on storage.objects
      for update to authenticated
      using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists subject_files_delete_own on storage.objects;
    create policy subject_files_delete_own on storage.objects
      for delete to authenticated
      using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);
  $ddl$;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 20260904000100_content.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0100 (v2) · Conteúdo de estudo, escolas e papéis administrativos
--
-- O que muda de conceito aqui
--
--  * Até agora todo dado do Nexa era do ALUNO: as notas dele, a rotina dele.
--    Conteúdo de estudo é o oposto — é escrito uma vez pela administração e
--    lido por milhares. Isso inverte a RLS: em vez de `user_id = auth.uid()`,
--    a regra passa a ser "publicado E (global OU da minha escola)".
--
--  * O conteúdo se prende ao `subject_catalog`, NUNCA à tabela `subjects`.
--    `subjects` é a instância do aluno; um resumo preso a ela serviria a um
--    aluno só. Preso ao catálogo, o mesmo resumo de Física alcança todo mundo
--    que tem Física — que é a razão de o catálogo existir.
--
--  * `school_id NULL` significa GLOBAL. Uma escola pode ter a própria
--    biblioteca sem perder a biblioteca compartilhada: o aluno enxerga a união
--    das duas. É o requisito de "cada escola pode ter o próprio sistema de
--    resumo" sem duplicar o acervo comum para cada escola nova.
--
--  * Um tipo só de recurso (`resources`) com `kind`, em vez de seis tabelas.
--    Resumo, podcast, vídeo, imagem, música, quiz e simulado compartilham
--    título, matéria, assunto, escola, publicação e ordenação; o que muda é a
--    carga útil. Seis tabelas significariam seis telas de admin, seis
--    consultas de biblioteca e seis lugares para esquecer a mesma regra de RLS.
-- ============================================================================

-- ------------------------------------------------------------------ papéis --
alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'school_admin', 'admin'));

comment on column public.profiles.role is
  'student = aluno; school_admin = gerencia o conteúdo da própria escola; admin = gerencia tudo.';

-- SECURITY DEFINER de propósito: chamada de dentro das policies de `profiles`,
-- uma função normal reentraria na própria policy e recursionaria para sempre.
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = p_user_id), false);
$$;

create or replace function public.current_school_id(p_user_id uuid default auth.uid())
returns uuid language sql stable security definer set search_path = public as $$
  select p.school_id from public.profiles p where p.id = p_user_id;
$$;

-- Admin global gerencia qualquer escola; school_admin só a sua.
create or replace function public.can_manage_school(p_school_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (p.role = 'admin' or (p.role = 'school_admin' and p_school_id is not null and p.school_id = p_school_id))
  );
$$;

/**
 * Ninguém promove a si mesmo.
 *
 * A policy `profiles_update_own` libera a linha inteira, e escrever uma policy
 * por coluna não é possível no Postgres. Sem esta trava, qualquer aluno faria
 * `update profiles set role = 'admin'` com a chave anon e ganharia o painel.
 *
 * A exceção é `auth.uid() is null`: ninguém autenticado, ou seja, SQL Editor e
 * `service_role`. É por ali que o PRIMEIRO admin é nomeado — não haveria como,
 * de outro modo, existir um admin para nomear o primeiro. E quem tem essas
 * duas portas já tem o banco inteiro; a trava não perde nada por abri-las.
 */
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Escolas passam a ser gerenciáveis pelo painel.
drop policy if exists schools_manage_admin on public.schools;
drop policy if exists schools_manage_admin on public.schools;
create policy schools_manage_admin on public.schools
  for all to authenticated
  using (public.can_manage_school(id)) with check (public.can_manage_school(id));

-- Catálogo de matérias também: o admin cria matérias novas pelo painel.
drop policy if exists subject_catalog_manage_admin on public.subject_catalog;
drop policy if exists subject_catalog_manage_admin on public.subject_catalog;
create policy subject_catalog_manage_admin on public.subject_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin precisa enxergar as linhas despublicadas/inativas que ele mesmo edita.
drop policy if exists subject_catalog_select_admin on public.subject_catalog;
drop policy if exists subject_catalog_select_admin on public.subject_catalog;
create policy subject_catalog_select_admin on public.subject_catalog
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------- assuntos ----
-- "Cinemática" dentro de Física. É o que liga o erro do simulado ao resumo
-- certo na tela de resultado — sem assunto, "o que revisar" não existe.
create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  description text,
  grade_levels text[] not null default '{}',
  sort_order integer not null default 100,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_topics_scope_slug_uq
  on public.content_topics (subject_catalog_id, coalesce(school_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);
create index if not exists content_topics_subject_idx on public.content_topics (subject_catalog_id, sort_order);

drop trigger if exists content_topics_set_updated_at on public.content_topics;
create trigger content_topics_set_updated_at before update on public.content_topics
  for each row execute function public.set_updated_at();

alter table public.content_topics enable row level security;

drop policy if exists content_topics_select_visible on public.content_topics;
create policy content_topics_select_visible on public.content_topics
  for select to authenticated
  using (school_id is null or school_id = public.current_school_id() or public.can_manage_school(school_id));

drop policy if exists content_topics_manage on public.content_topics;
create policy content_topics_manage on public.content_topics
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- ------------------------------------------------------------- recursos ----
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  topic_id uuid references public.content_topics (id) on delete set null,

  kind text not null check (kind in ('resumo', 'podcast', 'video', 'imagem', 'musica', 'quiz', 'simulado')),

  title text not null check (length(btrim(title)) between 2 and 200),
  subtitle text,
  description text,

  -- Resumo: markdown. Nos demais é opcional (transcrição, legenda, enunciado).
  body text,

  -- Mídia: caminho no bucket `nexa-content` OU URL externa (YouTube, RSS).
  storage_path text,
  external_url text,
  thumbnail_url text,

  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  difficulty text not null default 'medio' check (difficulty in ('facil', 'medio', 'dificil')),
  grade_levels text[] not null default '{}',
  tags text[] not null default '{}',

  -- Quiz e simulado: limite de tempo e nota de corte.
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  xp_reward integer not null default 0 check (xp_reward between 0 and 1000),

  is_published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 100,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Um recurso precisa ter de onde tirar o conteúdo. Quiz e simulado carregam
  -- as questões em outra tabela, então são a exceção legítima.
  constraint resources_has_payload check (
    kind in ('quiz', 'simulado')
    or body is not null
    or storage_path is not null
    or external_url is not null
  )
);

create index if not exists resources_library_idx
  on public.resources (subject_catalog_id, kind, sort_order) where is_published;
create index if not exists resources_school_idx on public.resources (school_id) where school_id is not null;
create index if not exists resources_topic_idx on public.resources (topic_id) where topic_id is not null;
create index if not exists resources_title_trgm_idx on public.resources using gin (title gin_trgm_ops);

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

-- `published_at` acompanha o botão de publicar sozinho: uma data preenchida à
-- mão no painel é uma data que vai divergir do estado real.
create or replace function public.stamp_published_at()
returns trigger language plpgsql as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at := coalesce(new.published_at, now());
  elsif not new.is_published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists resources_stamp_published on public.resources;
create trigger resources_stamp_published before insert or update on public.resources
  for each row execute function public.stamp_published_at();

alter table public.resources enable row level security;

drop policy if exists resources_select_visible on public.resources;
create policy resources_select_visible on public.resources
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id)
    or public.is_admin()
  );

drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- --------------------------------------------------------- capítulos -------
-- Marcadores de tempo do podcast e do vídeo ("Estado Novo · 7:40").
create table if not exists public.resource_chapters (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position >= 0),
  label text not null check (length(btrim(label)) between 1 and 160),
  starts_at_seconds integer not null check (starts_at_seconds >= 0),
  created_at timestamptz not null default now()
);

create unique index if not exists resource_chapters_pos_uq on public.resource_chapters (resource_id, position);

alter table public.resource_chapters enable row level security;

drop policy if exists resource_chapters_select_visible on public.resource_chapters;
create policy resource_chapters_select_visible on public.resource_chapters
  for select to authenticated
  using (exists (select 1 from public.resources r where r.id = resource_id));

drop policy if exists resource_chapters_manage on public.resource_chapters;
create policy resource_chapters_manage on public.resource_chapters
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- --------------------------------------------------------- questões --------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  topic_id uuid references public.content_topics (id) on delete set null,
  position integer not null check (position > 0),
  statement text not null check (length(btrim(statement)) >= 3),
  -- Aparece DEPOIS de responder. É o que transforma erro em aprendizado.
  explanation text,
  difficulty text not null default 'medio' check (difficulty in ('facil', 'medio', 'dificil')),
  points numeric(5, 2) not null default 1 check (points > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists questions_position_uq on public.questions (resource_id, position);
create index if not exists questions_topic_idx on public.questions (topic_id) where topic_id is not null;

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

-- Sem policy de SELECT para aluno, de propósito. `explanation` entrega a
-- resposta, e RLS é por linha, não por coluna: qualquer leitura direta da
-- tabela seria o gabarito disponível antes de responder. O aluno recebe as
-- questões pela função `quiz_questions()`, que devolve enunciado e
-- alternativas sem o gabarito. A policy abaixo (FOR ALL) cobre o admin.
drop policy if exists questions_manage on public.questions;
create policy questions_manage on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- ------------------------------------------------------- alternativas ------
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position integer not null check (position > 0),
  body text not null check (length(btrim(body)) >= 1),
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists question_options_position_uq on public.question_options (question_id, position);
-- Uma questão de múltipla escolha tem exatamente uma resposta certa. Índice
-- parcial único: o banco recusa a segunda antes que ela vire um bug de correção.
create unique index if not exists question_options_single_correct_uq
  on public.question_options (question_id) where is_correct;

alter table public.question_options enable row level security;

-- Mesma razão: `is_correct` nesta tabela É o gabarito.
drop policy if exists question_options_manage on public.question_options;
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- --------------------------------------------------------- trilhas ---------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  description text,
  grade_levels text[] not null default '{}',
  is_published boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_subject_idx on public.tracks (subject_catalog_id) where is_published;

drop trigger if exists tracks_set_updated_at on public.tracks;
create trigger tracks_set_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

alter table public.tracks enable row level security;

drop policy if exists tracks_select_visible on public.tracks;
create policy tracks_select_visible on public.tracks
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id) or public.is_admin()
  );

drop policy if exists tracks_manage on public.tracks;
create policy tracks_manage on public.tracks
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

create table if not exists public.track_sections (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  created_at timestamptz not null default now()
);

create unique index if not exists track_sections_position_uq on public.track_sections (track_id, position);

alter table public.track_sections enable row level security;

drop policy if exists track_sections_select_visible on public.track_sections;
create policy track_sections_select_visible on public.track_sections
  for select to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id));

drop policy if exists track_sections_manage on public.track_sections;
create policy track_sections_manage on public.track_sections
  for all to authenticated
  using (exists (
    select 1 from public.tracks t
    where t.id = track_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.tracks t
    where t.id = track_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));

-- O nó da trilha. `unlock_after_lesson_id` é o que desenha o caminho: sem ele
-- a trilha vira uma lista, e "bloqueado · conclua MUV antes" não tem como ser
-- calculado.
create table if not exists public.track_lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.track_sections (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 600),
  xp_reward integer not null default 20 check (xp_reward between 0 and 1000),
  unlock_after_lesson_id uuid references public.track_lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists track_lessons_position_uq on public.track_lessons (section_id, position);

drop trigger if exists track_lessons_set_updated_at on public.track_lessons;
create trigger track_lessons_set_updated_at before update on public.track_lessons
  for each row execute function public.set_updated_at();

alter table public.track_lessons enable row level security;

drop policy if exists track_lessons_select_visible on public.track_lessons;
create policy track_lessons_select_visible on public.track_lessons
  for select to authenticated
  using (exists (select 1 from public.track_sections s where s.id = section_id));

drop policy if exists track_lessons_manage on public.track_lessons;
create policy track_lessons_manage on public.track_lessons
  for all to authenticated
  using (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));

-- A lição é uma sequência de recursos: resumo → vídeo → quiz.
create table if not exists public.track_lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.track_lessons (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position > 0),
  is_required boolean not null default true
);

create unique index if not exists track_lesson_resources_position_uq on public.track_lesson_resources (lesson_id, position);
create unique index if not exists track_lesson_resources_pair_uq on public.track_lesson_resources (lesson_id, resource_id);

alter table public.track_lesson_resources enable row level security;

drop policy if exists track_lesson_resources_select_visible on public.track_lesson_resources;
create policy track_lesson_resources_select_visible on public.track_lesson_resources
  for select to authenticated
  using (exists (select 1 from public.track_lessons l where l.id = lesson_id));

drop policy if exists track_lesson_resources_manage on public.track_lesson_resources;
create policy track_lesson_resources_manage on public.track_lesson_resources
  for all to authenticated
  using (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));

-- ─────────────────────────────────────────────────────────────────────
-- 20260904000200_content_progress.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0200 (v2) · Progresso do aluno sobre o conteúdo
--
-- Separado da migration de conteúdo por uma razão de segurança, não de
-- organização: aqui a RLS volta a ser `user_id = auth.uid()`. Misturar as duas
-- lógicas no mesmo arquivo é como se perde de vista qual regra vale para qual
-- tabela — e uma tabela de progresso com a policy de conteúdo vazaria o
-- desempenho de um aluno para a escola inteira.
-- ============================================================================

-- --------------------------------------------------- progresso genérico ----
-- Serve resumo (percentual lido), podcast/vídeo (segundo em que parou) e
-- imagem (visto). Uma linha por aluno × recurso.
create table if not exists public.resource_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  progress_percent numeric(5, 2) not null default 0 check (progress_percent between 0 and 100),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resource_progress_pair_uq on public.resource_progress (user_id, resource_id);
-- "Continuar de onde parou" é uma consulta por aluno ordenada por recência.
create index if not exists resource_progress_recent_idx on public.resource_progress (user_id, last_seen_at desc);

drop trigger if exists resource_progress_set_updated_at on public.resource_progress;
create trigger resource_progress_set_updated_at before update on public.resource_progress
  for each row execute function public.set_updated_at();

alter table public.resource_progress enable row level security;

drop policy if exists resource_progress_all_own on public.resource_progress;
create policy resource_progress_all_own on public.resource_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- tentativas --------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_count_sane check (correct_count <= total_count)
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, resource_id, started_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists quiz_attempts_all_own on public.quiz_attempts;
create policy quiz_attempts_all_own on public.quiz_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  option_id uuid references public.question_options (id) on delete set null,
  is_correct boolean not null default false,
  answered_at timestamptz not null default now()
);

create unique index if not exists quiz_answers_pair_uq on public.quiz_answers (attempt_id, question_id);

alter table public.quiz_answers enable row level security;

-- A tentativa é do aluno, logo a resposta também é. A checagem sobe pelo
-- attempt para não repetir `user_id` numa segunda coluna que pode divergir.
drop policy if exists quiz_answers_all_own on public.quiz_answers;
create policy quiz_answers_all_own on public.quiz_answers
  for all to authenticated
  using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ------------------------------------------------ progresso na trilha ------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.track_lessons (id) on delete cascade,
  -- Os cinco estados do nó no design. `locked` não é armazenado: é derivado da
  -- ausência de progresso na lição anterior, senão desbloquear uma lição
  -- exigiria reescrever a linha de todos os alunos.
  state text not null default 'available' check (state in ('available', 'in_progress', 'done', 'mastered')),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists lesson_progress_pair_uq on public.lesson_progress (user_id, lesson_id);

drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

drop policy if exists lesson_progress_all_own on public.lesson_progress;
create policy lesson_progress_all_own on public.lesson_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- marcações ---------
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  quote text not null check (length(btrim(quote)) between 1 and 2000),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists highlights_user_resource_idx on public.highlights (user_id, resource_id);

alter table public.highlights enable row level security;

drop policy if exists highlights_all_own on public.highlights;
create policy highlights_all_own on public.highlights
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------- flashcards ------------
create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  knows boolean not null,
  reviewed_at timestamptz not null default now()
);

create index if not exists flashcard_reviews_user_idx on public.flashcard_reviews (user_id, resource_id, reviewed_at desc);

alter table public.flashcard_reviews enable row level security;

drop policy if exists flashcard_reviews_all_own on public.flashcard_reviews;
create policy flashcard_reviews_all_own on public.flashcard_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Views · a biblioteca como o aluno a enxerga
--
-- `security_invoker` em todas: a view roda com a RLS de quem consulta, não com
-- a de quem a criou. Sem isso uma view seria um buraco por onde o acervo de
-- outra escola sairia inteiro.
-- ============================================================================

-- `drop` + `create` em vez de `create or replace`: uma migration posterior
-- (20260908000900) acrescenta a coluna `bimestre` a esta view, e
-- `create or replace view` recusa mudar o conjunto de colunas de uma view
-- existente. Sem o `drop` aqui, reaplicar todo o histórico de migrations do
-- zero sobre um banco que já passou por 20260908000900 quebra neste
-- statement, bem antes de chegar lá. Nada mais depende desta view (é folha),
-- então o drop é seguro.
drop view if exists public.v_resource_library;

create view public.v_resource_library
with (security_invoker = true) as
select
  r.id,
  r.kind,
  r.title,
  r.subtitle,
  r.description,
  r.thumbnail_url,
  r.duration_seconds,
  r.difficulty,
  r.xp_reward,
  r.school_id,
  r.subject_catalog_id,
  sc.name  as subject_name,
  sc.slug  as subject_slug,
  sc.default_color as subject_color,
  r.topic_id,
  t.name   as topic_name,
  r.sort_order,
  r.published_at,
  -- Contagem de questões: o card do simulado promete "20 questões" e essa
  -- promessa não pode vir de um campo digitado à mão que envelhece.
  (select count(*) from public.questions q where q.resource_id = r.id) as question_count
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published;

comment on view public.v_resource_library is
  'Biblioteca publicada e visível para quem consulta, já com matéria e assunto resolvidos.';

-- Progresso do aluno na trilha, com o estado derivado de cada lição.
create or replace view public.v_track_lessons_resolved
with (security_invoker = true) as
select
  l.id            as lesson_id,
  l.section_id,
  s.track_id,
  t.subject_catalog_id,
  t.school_id,
  s.title         as section_title,
  s.position      as section_position,
  l.position      as lesson_position,
  l.title,
  l.description,
  l.estimated_minutes,
  l.xp_reward,
  l.unlock_after_lesson_id,
  coalesce(p.state, 'available') as raw_state,
  p.correct_streak,
  p.completed_at,
  -- Uma lição está bloqueada quando a anterior exigida não foi concluída.
  case
    when l.unlock_after_lesson_id is null then false
    else not exists (
      select 1 from public.lesson_progress pp
      where pp.lesson_id = l.unlock_after_lesson_id
        and pp.user_id = auth.uid()
        and pp.state in ('done', 'mastered')
    )
  end as is_locked,
  (select count(*) from public.track_lesson_resources lr where lr.lesson_id = l.id) as resource_count
from public.track_lessons l
join public.track_sections s on s.id = l.section_id
join public.tracks t on t.id = s.track_id
left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = auth.uid();

comment on view public.v_track_lessons_resolved is
  'Lições da trilha com o estado do aluno e o bloqueio já calculado.';

-- ─────────────────────────────────────────────────────────────────────
-- 20260904000300_content_functions.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0300 (v2) · Funções de conteúdo, gabarito e progresso
--
-- Por que quiz e simulado passam por função em vez de tabela
--
-- `questions.explanation` e `question_options.is_correct` SÃO o gabarito. RLS
-- no Postgres é por linha, não por coluna: não existe policy que libere o
-- enunciado e esconda a resposta na mesma tabela. Se o aluno pudesse
-- selecionar as alternativas direto, bastaria abrir o DevTools para gabaritar
-- qualquer simulado — e um simulado gabaritável não mede nada.
--
-- Então: as tabelas ficam fechadas para o aluno, e ele chega ao conteúdo por
-- funções SECURITY DEFINER que devolvem só o que se pode ver naquele momento.
-- A correção acontece no banco, com o gabarito nunca saindo dele.
-- ============================================================================

-- XP agora também vem de conteúdo.
alter table public.xp_events drop constraint if exists xp_events_source_type_check;
alter table public.xp_events add constraint xp_events_source_type_check check (
  source_type in ('task', 'routine', 'study_session', 'activity', 'achievement',
                  'system', 'quiz', 'lesson', 'resource')
);

-- --------------------------------------------------- visibilidade ----------
-- Um recurso é visível se está publicado e é global ou da escola do aluno.
-- Centralizado aqui porque três funções diferentes precisam da mesma resposta.
create or replace function public.can_view_resource(p_resource_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (
        (r.is_published and (r.school_id is null or r.school_id = public.current_school_id(p_user_id)))
        or public.can_manage_school(r.school_id, p_user_id)
      )
  );
$$;

-- ------------------------------------------------------ quiz: leitura ------
-- `drop` antes do `create or replace`: a migration 20260912000200 muda o
-- tipo de retorno desta função (mais colunas). Numa reaplicação do
-- histórico inteiro sobre um banco que já rodou 20260912000200, ESTA linha
-- reexecutaria com o retorno ANTIGO contra uma função que já tem o retorno
-- NOVO — Postgres recusa mudar tipo de retorno num `create or replace`. O
-- `drop` faz esta recriar do zero (fica temporariamente com o retorno
-- antigo, até 20260912000200 rodar de novo mais adiante e corrigir).
drop function if exists public.quiz_questions(uuid);

create or replace function public.quiz_questions(p_resource_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  difficulty text,
  points numeric,
  topic_name text,
  options jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.position,
    q.statement,
    q.difficulty,
    q.points,
    t.name,
    -- Sem `is_correct`. A ordem é a de cadastro: embaralhar aqui faria a
    -- posição divergir entre a tela e a correção.
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'body', o.body)
              order by o.position)
       from public.question_options o where o.question_id = q.id),
      '[]'::jsonb
    )
  from public.questions q
  left join public.content_topics t on t.id = q.topic_id
  where q.resource_id = p_resource_id
    and public.can_view_resource(p_resource_id)
  order by q.position;
$$;

comment on function public.quiz_questions is
  'Questões de um quiz/simulado SEM o gabarito. Única porta de leitura para o aluno.';

-- ------------------------------------------------------ quiz: execução -----
create or replace function public.start_quiz_attempt(p_resource_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt uuid;
  v_total integer;
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'recurso indisponível' using errcode = '42501';
  end if;

  select count(*) into v_total from public.questions where resource_id = p_resource_id;
  if v_total = 0 then
    raise exception 'este simulado ainda não tem questões' using errcode = '23514';
  end if;

  insert into public.quiz_attempts (user_id, resource_id, total_count)
  values (auth.uid(), p_resource_id, v_total)
  returning id into v_attempt;

  return v_attempt;
end;
$$;

/**
 * Responde uma questão e devolve o veredito.
 *
 * A correção é aqui, não no cliente: o cliente nunca recebeu o gabarito e não
 * teria como corrigir nada. Devolve a alternativa certa e a explicação DEPOIS
 * de registrar a resposta — que é o momento em que revelar vira aprendizado em
 * vez de cola.
 */
create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_option_id uuid
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_option uuid;
  v_is_correct boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  select o.id into v_correct_option
  from public.question_options o where o.question_id = p_question_id and o.is_correct;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  -- Trocar de alternativa antes de encerrar é permitido; a última vale.
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct)
  values (p_attempt_id, p_question_id, p_option_id, v_is_correct)
  on conflict (attempt_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        answered_at = now();

  return query
    select v_is_correct, v_correct_option, q.explanation
    from public.questions q where q.id = p_question_id;
end;
$$;

create or replace function public.finish_quiz_attempt(p_attempt_id uuid)
returns table (correct_count integer, total_count integer, duration_seconds integer, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.quiz_attempts;
  v_correct integer;
  v_duration integer;
  v_xp integer := 0;
  v_reward integer;
begin
  select * into v_attempt from public.quiz_attempts a
  where a.id = p_attempt_id and a.user_id = auth.uid();

  if v_attempt.id is null then
    raise exception 'tentativa não encontrada' using errcode = '42501';
  end if;

  -- Encerrar duas vezes não pode pagar XP duas vezes nem reescrever o tempo.
  if v_attempt.finished_at is not null then
    return query select v_attempt.correct_count, v_attempt.total_count, v_attempt.duration_seconds, 0;
    return;
  end if;

  select count(*) into v_correct from public.quiz_answers where attempt_id = p_attempt_id and is_correct;
  v_duration := greatest(0, extract(epoch from (now() - v_attempt.started_at))::integer);

  update public.quiz_attempts
  set finished_at = now(), correct_count = v_correct, duration_seconds = v_duration
  where id = p_attempt_id;

  -- XP proporcional ao acerto, e uma vez só por tentativa — a chave de
  -- idempotência de `award_xp` é (source_type, source_id, reason).
  select r.xp_reward into v_reward from public.resources r where r.id = v_attempt.resource_id;
  if coalesce(v_reward, 0) > 0 and v_attempt.total_count > 0 then
    v_xp := public.award_xp(
      round(v_reward * v_correct::numeric / v_attempt.total_count)::integer,
      'Quiz concluído', 'quiz', p_attempt_id
    );
  end if;

  perform public.touch_streak();

  return query select v_correct, v_attempt.total_count, v_duration, v_xp;
end;
$$;

-- Gabarito completo, liberado só depois de encerrar. Antes disso não existe.
-- Mesmo motivo do `drop` acima em `quiz_questions`: 20260912000200 muda o
-- tipo de retorno desta função também.
drop function if exists public.quiz_attempt_review(uuid);

create or replace function public.quiz_attempt_review(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  explanation text,
  topic_name text,
  chosen_option_id uuid,
  correct_option_id uuid,
  is_correct boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id, q.position, q.statement, q.explanation, t.name,
    ans.option_id,
    (select o.id from public.question_options o where o.question_id = q.id and o.is_correct),
    coalesce(ans.is_correct, false)
  from public.quiz_attempts a
  join public.questions q on q.resource_id = a.resource_id
  left join public.quiz_answers ans on ans.attempt_id = a.id and ans.question_id = q.id
  left join public.content_topics t on t.id = q.topic_id
  where a.id = p_attempt_id
    and a.user_id = auth.uid()
    and a.finished_at is not null
  order by q.position;
$$;

-- Desempenho por assunto: é o que a tela de resultado usa para dizer
-- "queda livre 2/6" e ligar o erro ao material certo.
create or replace function public.quiz_attempt_topics(p_attempt_id uuid)
returns table (topic_id uuid, topic_name text, correct_count bigint, total_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.topic_id,
    coalesce(t.name, 'Geral'),
    count(*) filter (where ans.is_correct),
    count(*)
  from public.quiz_attempts a
  join public.questions q on q.resource_id = a.resource_id
  left join public.quiz_answers ans on ans.attempt_id = a.id and ans.question_id = q.id
  left join public.content_topics t on t.id = q.topic_id
  where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is not null
  group by q.topic_id, t.name
  order by count(*) filter (where ans.is_correct)::numeric / greatest(count(*), 1);
$$;

-- ------------------------------------------------------- progresso ---------
create or replace function public.mark_resource_progress(
  p_resource_id uuid,
  p_percent numeric default null,
  p_position_seconds integer default null,
  p_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'recurso indisponível' using errcode = '42501';
  end if;

  insert into public.resource_progress as rp
    (user_id, resource_id, progress_percent, position_seconds, completed_at, last_seen_at)
  values (
    auth.uid(), p_resource_id,
    least(100, greatest(0, coalesce(p_percent, 0))),
    greatest(0, coalesce(p_position_seconds, 0)),
    case when p_completed then now() end,
    now()
  )
  on conflict (user_id, resource_id) do update set
    -- O progresso não anda para trás: reabrir um resumo no começo não apaga
    -- que ele já foi lido até o fim.
    progress_percent = greatest(rp.progress_percent, coalesce(p_percent, rp.progress_percent)),
    position_seconds = coalesce(p_position_seconds, rp.position_seconds),
    completed_at = case when p_completed then coalesce(rp.completed_at, now()) else rp.completed_at end,
    last_seen_at = now();
end;
$$;

/**
 * Conclui uma lição da trilha.
 *
 * `mastered` exige três conclusões seguidas sem erro — é o quinto estado do nó
 * no design, e o único que o aluno não alcança só por passar uma vez.
 */
create or replace function public.complete_lesson(p_lesson_id uuid, p_flawless boolean default false)
returns table (state text, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak integer;
  v_state text;
  v_xp integer := 0;
  v_reward integer;
begin
  if not exists (
    select 1 from public.v_track_lessons_resolved v where v.lesson_id = p_lesson_id and not v.is_locked
  ) then
    raise exception 'lição bloqueada ou inexistente' using errcode = '42501';
  end if;

  select coalesce(lp.correct_streak, 0) into v_streak
  from public.lesson_progress lp where lp.lesson_id = p_lesson_id and lp.user_id = auth.uid();

  v_streak := case when p_flawless then coalesce(v_streak, 0) + 1 else 0 end;
  v_state := case when v_streak >= 3 then 'mastered' else 'done' end;

  insert into public.lesson_progress (user_id, lesson_id, state, correct_streak, started_at, completed_at)
  values (auth.uid(), p_lesson_id, v_state, v_streak, now(), now())
  on conflict (user_id, lesson_id) do update set
    state = v_state,
    correct_streak = v_streak,
    started_at = coalesce(public.lesson_progress.started_at, now()),
    completed_at = coalesce(public.lesson_progress.completed_at, now());

  select l.xp_reward into v_reward from public.track_lessons l where l.id = p_lesson_id;
  v_xp := public.award_xp(coalesce(v_reward, 0), 'Lição concluída', 'lesson', p_lesson_id);
  perform public.touch_streak();

  return query select v_state, v_xp;
end;
$$;

create or replace function public.start_lesson(p_lesson_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.lesson_progress (user_id, lesson_id, state, started_at)
  values (auth.uid(), p_lesson_id, 'in_progress', now())
  on conflict (user_id, lesson_id) do update set
    state = case when public.lesson_progress.state in ('done', 'mastered')
                 then public.lesson_progress.state else 'in_progress' end,
    started_at = coalesce(public.lesson_progress.started_at, now());
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 20260904000400_content_storage.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0400 (v2) · Bucket do conteúdo
--
-- `nexa-content` é PÚBLICO para leitura, e essa é uma decisão deliberada, não
-- um descuido:
--
--  * Áudio e vídeo com URL assinada expiram no meio da reprodução. Um podcast
--    de 20 minutos com URL de 60 minutos parece resolver — até o aluno pausar,
--    sair do app e voltar depois do almoço, quando a URL morreu e o player
--    quebra sem explicação.
--  * O conteúdo não é secreto. É material de estudo publicado, o mesmo que
--    estaria num site da escola. O que precisa de sigilo é a NOTA do aluno, e
--    essa não passa por aqui.
--  * O que fica protegido é a ESCRITA: só admin e school_admin sobem arquivo.
--
-- O que NÃO deve entrar neste bucket: prova antes da aplicação, gabarito em
-- PDF, qualquer coisa cujo vazamento importe. Gabarito vive nas tabelas
-- `questions`/`question_options`, fechadas até para o aluno.
-- ============================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'nexa-content',
    'nexa-content',
    true,
    524288000, -- 500 MB: um vídeo de aula de 20 min em 720p cabe
    array[
      'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml',
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'text/plain', 'text/markdown'
    ]
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  execute $ddl$
    drop policy if exists nexa_content_read_all on storage.objects;
    create policy nexa_content_read_all on storage.objects
      for select using (bucket_id = 'nexa-content');

    drop policy if exists nexa_content_write_admin on storage.objects;
    create policy nexa_content_write_admin on storage.objects
      for insert to authenticated
      with check (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));

    drop policy if exists nexa_content_update_admin on storage.objects;
    create policy nexa_content_update_admin on storage.objects
      for update to authenticated
      using (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));

    drop policy if exists nexa_content_delete_admin on storage.objects;
    create policy nexa_content_delete_admin on storage.objects
      for delete to authenticated
      using (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));
  $ddl$;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 20260906000100_onboarding_daily_goal.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0906 · Meta diária no onboarding
--
-- `daily_study_goal_minutes` já existe em `profiles` (padrão 45, editável no
-- Perfil), mas o onboarding nunca perguntava — o valor só nascia com o
-- default. A nova etapa "Qual sua meta diária?" precisa de um jeito de
-- gravar a escolha no mesmo round trip do `bootstrap_student`, então o
-- parâmetro entra no fim da lista (com default null) para não quebrar
-- nenhuma chamada existente.
-- ============================================================================

-- `create or replace` only replaces a function with the SAME argument list —
-- adding a parameter makes a new overload instead of replacing the old one,
-- and Postgres would then see two `bootstrap_student` candidates for a
-- 12-argument call and refuse to pick one. Drop the old signature first.
drop function if exists public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], jsonb
);

create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_class_name text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_categories jsonb default '[
    {"name": "Prova Bimestral", "short_code": "PB", "weight_percent": 35},
    {"name": "Verificação de Aprendizagem", "short_code": "VA", "weight_percent": 35},
    {"name": "Qualitativa", "short_code": "QL", "weight_percent": 30}
  ]'::jsonb,
  p_daily_goal_minutes integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_scheme_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_cat jsonb;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_user_id and p.onboarded_at is not null) then
    raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  -- Sensible calendar defaults so onboarding can ask nothing about dates.
  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, class_name, school_id, timezone, daily_study_goal_minutes, onboarded_at
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_class_name, p_school_id,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 45), now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        class_name = coalesce(excluded.class_name, p.class_name),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = now();

  -- 2. Academic year ------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms, split evenly across the year -------------------------------
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Default grading scheme + categories -------------------------------
  insert into public.grading_schemes (user_id, name, is_default)
  values (v_user_id, 'Padrão da escola', true)
  returning id into v_scheme_id;

  v_idx := 0;
  for v_cat in select * from jsonb_array_elements(p_categories) loop
    v_idx := v_idx + 1;
    insert into public.grading_scheme_categories
      (user_id, scheme_id, name, short_code, weight_percent, sequence)
    values (
      v_user_id,
      v_scheme_id,
      coalesce(v_cat->>'name', 'Categoria ' || v_idx),
      nullif(v_cat->>'short_code', ''),
      coalesce((v_cat->>'weight_percent')::numeric, 0),
      v_idx::smallint
    );
  end loop;

  -- 5. Subjects, from catalog picks and free-typed names -------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 6. subject × term matrix -----------------------------------------------
  insert into public.subject_terms (user_id, subject_id, term_id, scheme_id)
  select v_user_id, s.id, t.id, v_scheme_id
  from unnest(v_subject_ids) as s (id)
  cross join unnest(v_term_ids) as t (id)
  on conflict (subject_id, term_id) do nothing;

  -- 7. A starter daily checklist, so "Hoje" is never empty on day one ------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 8. Stats row (via definer helper — user_stats is client-read-only) -----
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'scheme_id', v_scheme_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids),
    'current_term_id', public.current_term_id(v_user_id)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], jsonb, integer
) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260907000100_pdf_resources.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0907 · Conteúdo por PDF
--
-- Um resumo em PDF não é um `kind` novo — é o `kind` 'resumo' de sempre com o
-- conteúdo vindo de um arquivo em vez de markdown. `resources_has_payload`
-- (0100_content.sql) já aceita `storage_path` como conteúdo válido para
-- qualquer kind; o que faltava era um jeito de o leitor saber QUAL dos dois
-- formatos está ali, e onde guardar o que a extração descobre (páginas,
-- texto, status).
-- ============================================================================

alter table public.resources
  add column if not exists content_format text not null default 'markdown'
    check (content_format in ('markdown', 'pdf')),
  add column if not exists pdf_page_count integer
    check (pdf_page_count is null or pdf_page_count > 0),
  -- Texto puro extraído do PDF — não é para exibir (o leitor mostra o PDF de
  -- verdade), é a matéria-prima para "transformar em estudo" mais adiante,
  -- quando houver provedor de IA configurado. Guardar agora evita rebaixar o
  -- arquivo do Storage outra vez só para reler o texto no futuro.
  add column if not exists pdf_extracted_text text,
  -- Processamento é síncrono no upload (decisão registrada na ADR-039): só
  -- existem dois estados terminais. "Enviando"/"processando" são estado de
  -- tela, não de banco — não há nada para uma segunda requisição encontrar.
  add column if not exists pdf_status text
    check (pdf_status is null or pdf_status in ('processado', 'erro'));

comment on column public.resources.content_format is
  'Para kind=resumo: markdown (texto digitado) ou pdf (arquivo enviado).';
comment on column public.resources.pdf_status is
  'Resultado da extração no upload — processado ou erro. Null para conteúdo que não é PDF.';

-- Favoritar generaliza para qualquer kind porque resource_progress já é
-- por (usuário, recurso) independente de formato — não é a tela dedicada de
-- "Meus favoritos" (essa continua em aberto, ver ADR-037), só o sinalizador
-- que uma tela futura vai listar.
alter table public.resource_progress
  add column if not exists is_favorited boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────
-- 20260907000200_loop_nexa.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0907 (2) · Loop Nexa
--
-- Conteúdo → estudo → simulado → desempenho → identificação de dificuldade →
-- recomendação → revisão → novo estudo. As peças de conteúdo e simulado já
-- existiam; o que faltava era o elo entre "resultado do simulado" e
-- "o que fazer a seguir" — e é isso que as duas funções e a tabela abaixo
-- resolvem, sem duplicar nada que `quiz_attempt_review`/`quiz_attempt_topics`
-- já fazem POR TENTATIVA (0300_content_functions.sql). A diferença aqui é o
-- agregado: não "como fui NESTA prova", e sim "como estou HOJE neste assunto",
-- através de todas as tentativas.
--
-- São FUNÇÕES, não views comuns: `questions`/`question_options` não têm
-- policy de SELECT para o aluno — é onde mora o gabarito — então uma view
-- `security_invoker` simplesmente devolveria zero linhas para quem não é
-- admin. `security definer` é o mesmo mecanismo que já autoriza
-- `quiz_attempt_review`, com o mesmo cuidado: filtro explícito por
-- `auth.uid()` no corpo, para a elevação de privilégio nunca vazar dado de
-- outro aluno.
-- ============================================================================

-- ------------------------------------------------------- domínio por assunto
-- "Dominar" é sobre a resposta MAIS RECENTE de cada questão, não a média
-- histórica: um aluno que errou uma questão em março e acertou a mesma em
-- setembro está bem HOJE, e uma média arrastaria o erro de março pra sempre.
create or replace function public.topic_mastery(p_user_id uuid default auth.uid())
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  )
  select
    r.subject_catalog_id,
    sc.name,
    sc.default_color,
    q.topic_id,
    coalesce(t.name, 'Geral'),
    count(*) filter (where la.is_correct),
    count(*),
    round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from latest_answer la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.content_topics t on t.id = q.topic_id
  group by r.subject_catalog_id, sc.name, sc.default_color, q.topic_id, t.name;
$$;

comment on function public.topic_mastery is
  'Domínio por assunto a partir da resposta mais recente de cada questão — alimenta o mapa de domínio e a recomendação de revisão.';

grant execute on function public.topic_mastery(uuid) to authenticated;

-- ---------------------------------------------------- "marcar como dominado"
-- Refazer a questão e acertar já resolve o erro sozinho (a próxima consulta a
-- `recent_errors()` nem mostra mais essa questão, porque usa a resposta mais
-- recente). Esta tabela existe para o outro caminho: o aluno olha o erro,
-- decide "já sei isso, só errei por distração", e dispensa sem refazer nada.
create table if not exists public.dismissed_question_errors (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.dismissed_question_errors enable row level security;

drop policy if exists dismissed_question_errors_all_own on public.dismissed_question_errors;
create policy dismissed_question_errors_all_own on public.dismissed_question_errors
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ central de erros
create or replace function public.recent_errors(p_user_id uuid default auth.uid())
returns table (
  question_id uuid,
  statement text,
  explanation text,
  difficulty text,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.option_id,
      ans.is_correct,
      ans.answered_at,
      a.resource_id as attempt_resource_id
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  )
  select
    q.id,
    q.statement,
    q.explanation,
    q.difficulty,
    r.id,
    r.title,
    r.subject_catalog_id,
    sc.name,
    sc.default_color,
    q.topic_id,
    t.name,
    (select o.body from public.question_options o where o.id = la.option_id),
    (select o.body from public.question_options o where o.question_id = q.id and o.is_correct),
    la.answered_at
  from latest_answer la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = la.attempt_resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.content_topics t on t.id = q.topic_id
  where la.is_correct = false
    and not exists (
      select 1 from public.dismissed_question_errors d
      where d.user_id = p_user_id and d.question_id = q.id
    )
  order by la.answered_at desc;
$$;

comment on function public.recent_errors is
  'Última resposta errada de cada questão, sem as dispensadas — a Central de Erros lê daqui.';

grant execute on function public.recent_errors(uuid) to authenticated;

-- ------------------------------------------------------- marcar como dominado
create or replace function public.dismiss_question_error(p_question_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.dismissed_question_errors (user_id, question_id)
  values (auth.uid(), p_question_id)
  on conflict (user_id, question_id) do nothing;
$$;

grant execute on function public.dismiss_question_error(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260907000300_remove_manual_grading.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0907 (3) · Remove o sistema de notas manuais
--
-- O aluno não digita mais nota de prova, nem configura peso de categoria
-- ("PB 35%, VA 35%..."). A avaliação passa a ser inteiramente automática, a
-- partir do que o aluno faz DENTRO do Nexa (migration seguinte,
-- automatic_scoring.sql). Esta migration só derruba a estrutura antiga:
-- `grading_schemes`, `grading_scheme_categories`, `subject_terms`,
-- `activities` e as 5 views/função que dependiam delas.
--
-- `terms`/`academic_years` FICAM — ainda são a base de calendário usada por
-- `timetable_slots.term_id` (grade de aulas), que não tem nada a ver com
-- nota. `current_term_id()` sai porque, depois desta limpeza, nada mais no
-- código a chama.
-- ============================================================================

-- --------------------------------------------------- tasks/sessions/anexos --
-- `activities` vai ser derrubada; toda coluna que aponta pra ela precisa sair
-- primeiro, ou o DROP TABLE trava na FK.
alter table public.tasks drop column if exists activity_id;
alter table public.study_sessions drop column if exists activity_id;
alter table public.attachments drop column if exists activity_id;

-- Aproveita a mesma migration pra abrir espaço pra "prova agendada" como
-- task comum (sem nota) — o pedido de marcar "Prova de Matemática dia 15" no
-- calendário continua possível, só não carrega mais peso/categoria.
alter table public.tasks drop constraint if exists tasks_kind_check;
alter table public.tasks add constraint tasks_kind_check
  check (kind in ('task', 'homework', 'reading', 'review', 'exercise', 'project', 'custom', 'prova'));

-- ------------------------------------------------------------------ views --
drop view if exists public.v_term_summary;
drop view if exists public.v_subject_term_averages;
drop view if exists public.v_category_averages;
drop view if exists public.v_activities_effective;
drop view if exists public.v_subject_terms_resolved;

-- --------------------------------------------------------------- tabelas --
-- Ordem: quem tem FK primeiro.
drop table if exists public.activities;
drop table if exists public.grading_scheme_categories;
drop table if exists public.subject_terms;
drop table if exists public.grading_schemes;

drop function if exists public.assert_activity_category_matches_scheme();
drop function if exists public.current_term_id(uuid);

-- --------------------------------------------------------- bootstrap_student --
-- Sem categorias de nota, sem subject_terms — só perfil, ano letivo, termos
-- (ainda usados pela grade de aulas), matérias e o checklist inicial.
drop function if exists public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], jsonb, integer
);

create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_class_name text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_daily_goal_minutes integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_user_id and p.onboarded_at is not null) then
    raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  -- Sensible calendar defaults so onboarding can ask nothing about dates.
  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, class_name, school_id, timezone, daily_study_goal_minutes, onboarded_at
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_class_name, p_school_id,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 45), now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        class_name = coalesce(excluded.class_name, p.class_name),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = now();

  -- 2. Academic year --------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms, split evenly across the year — ainda usados pela grade de
  -- aulas (timetable_slots.term_id), não mais por nota. Fixo, sem perguntar.
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Subjects, from catalog picks and free-typed names ---------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 5. Checklist inicial, pra "Hoje" nunca começar vazio ---------------------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 6. Stats row (via definer helper — user_stats is client-read-only) ------
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260907000400_automatic_scoring.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0907 (4) · Motor de avaliação automática
--
-- Substitui a nota digitada por uma nota calculada, matéria por matéria, a
-- partir do que o aluno já faz dentro do Nexa. Nenhuma tabela de snapshot,
-- nenhum cron: tudo em tempo de consulta, mesmo padrão de `topic_mastery()`
-- (migration 0907 (2)). Nenhuma das três funções abaixo precisa de
-- `security definer` — todas leem só tabelas que o próprio dono já enxerga
-- via RLS (`quiz_attempts`, `resource_progress`, `study_sessions`,
-- `subjects`, `resources` publicados) — diferente de `topic_mastery`, que
-- precisa ler o gabarito em `question_options`.
--
-- Fórmula (documentada com números redondos de propósito, pra dar pra
-- explicar ao aluno "por que essa nota"):
--
--   nota da matéria = 70% avaliativo + 30% empenho
--
--   avaliativo = média ponderada da TENTATIVA MAIS RECENTE de cada
--     quiz/simulado da matéria (simulado pesa 2, quiz pesa 1). Nula se o
--     aluno nunca fez nenhum — nunca vira nota zero por ausência de dado.
--
--   empenho (0–100) = 40% conteúdo concluído (teto em 8 itens — depois disso
--     assistir mais não aumenta o índice, é a defesa contra "maratonar vídeo
--     pra subir nota") + 30% regularidade (dias com estudo nos últimos 14) +
--     30% sequência atual (`user_stats.current_streak`, teto em 14 dias).
-- ============================================================================

-- --------------------------------------------------------------- subject_scores --
create or replace function public.subject_scores(p_user_id uuid default auth.uid())
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  has_content boolean,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric,
  quizzes_done integer,
  simulados_done integer,
  content_completed integer,
  target_grade numeric,
  passing_grade numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_attempt as (
    select distinct on (qa.resource_id)
      qa.resource_id, qa.correct_count, qa.total_count
    from public.quiz_attempts qa
    where qa.user_id = p_user_id and qa.finished_at is not null
    order by qa.resource_id, qa.finished_at desc
  ),
  attempt_scored as (
    select
      r.subject_catalog_id,
      r.kind,
      la.correct_count::numeric / greatest(la.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight
    from latest_attempt la
    join public.resources r on r.id = la.resource_id
    where r.kind in ('quiz', 'simulado')
  ),
  assessment as (
    select
      subject_catalog_id,
      sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score,
      count(*) filter (where kind = 'quiz') as quizzes_done,
      count(*) filter (where kind = 'simulado') as simulados_done
    from attempt_scored
    group by subject_catalog_id
  ),
  content_done as (
    select r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem')
    group by r.subject_catalog_id
  ),
  regularity as (
    select ss.subject_id, count(distinct ss.local_date) as active_days
    from public.study_sessions ss
    where ss.user_id = p_user_id
      and ss.local_date >= public.user_local_date(p_user_id) - 13
    group by ss.subject_id
  ),
  streak as (
    select coalesce(
      (select us.current_streak from public.user_stats us where us.user_id = p_user_id), 0
    ) as current_streak
  ),
  empenho as (
    select
      s.id as subject_id,
      least(1, coalesce(cd.content_completed, 0) / 8.0) * 40
      + least(1, coalesce(reg.active_days, 0) / 14.0) * 30
      + least(1, coalesce(st.current_streak, 0) / 14.0) * 30
      as empenho_index
    from public.subjects s
    left join content_done cd on cd.subject_catalog_id = s.catalog_id
    left join regularity reg on reg.subject_id = s.id
    cross join streak st
    where s.user_id = p_user_id and s.archived_at is null
  )
  select
    s.id,
    s.name,
    s.color,
    s.catalog_id is not null,
    round(a.assessment_score, 2),
    round(e.empenho_index, 1),
    case when a.assessment_score is not null
      then round(a.assessment_score * 0.7 + e.empenho_index / 10 * 0.3, 2)
    end,
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(cd.content_completed, 0)::integer,
    s.target_grade,
    6.0
  from public.subjects s
  left join assessment a on a.subject_catalog_id = s.catalog_id
  left join content_done cd on cd.subject_catalog_id = s.catalog_id
  left join empenho e on e.subject_id = s.id
  where s.user_id = p_user_id and s.archived_at is null
  order by s.sort_order, s.name;
$$;

comment on function public.subject_scores(uuid) is
  'Nota automática por matéria (70% avaliativo + 30% empenho) — substitui o boletim manual.';

grant execute on function public.subject_scores(uuid) to authenticated;

-- --------------------------------------------------------- performance_evolution --
-- Série semanal CUMULATIVA (cada ponto usa todo o histórico até o fim daquela
-- semana, não só o que aconteceu nela) — uma semana ruim isolada não vira um
-- dente falso no gráfico. A sequência de streak não entra aqui: só o valor
-- ATUAL é armazenado, não um histórico dia a dia, então reconstituir "qual
-- era o streak há 6 semanas" não é possível sem inventar dado. O empenho da
-- evolução usa só os dois sinais reconstituíveis (conteúdo concluído,
-- regularidade), com o peso redistribuído (60/40 em vez de 40/30/30) — por
-- isso o número aqui pode divergir um pouco do `subject_scores` ao vivo, e
-- está documentado assim de propósito, não por descuido.
create or replace function public.performance_evolution(
  p_user_id uuid default auth.uid(),
  p_weeks integer default 12
)
returns table (
  week_start date,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with weeks as (
    select date_trunc('week', public.user_local_date(p_user_id))::date - (7 * gs) as week_start
    from generate_series(0, greatest(p_weeks, 1) - 1) as gs
  ),
  bucket as (
    select w.week_start, (w.week_start + 6) as week_end from weeks w
  ),
  attempts as (
    select
      b.week_start,
      qa.correct_count::numeric / greatest(qa.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight,
      row_number() over (
        partition by b.week_start, qa.resource_id
        order by qa.finished_at desc
      ) as rn
    from bucket b
    join public.quiz_attempts qa
      on qa.user_id = p_user_id and qa.finished_at is not null
      and qa.finished_at::date <= b.week_end
    join public.resources r on r.id = qa.resource_id and r.kind in ('quiz', 'simulado')
  ),
  assessment as (
    select week_start, sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score
    from attempts
    where rn = 1
    group by week_start
  ),
  content as (
    select b.week_start, count(distinct rp.resource_id) as content_completed
    from bucket b
    join public.resource_progress rp
      on rp.user_id = p_user_id and rp.completed_at is not null
      and rp.completed_at::date <= b.week_end
    group by b.week_start
  ),
  regularity as (
    select b.week_start, count(distinct ss.local_date) as active_days
    from bucket b
    join public.study_sessions ss
      on ss.user_id = p_user_id
      and ss.local_date between (b.week_end - 13) and b.week_end
    group by b.week_start
  )
  select
    b.week_start,
    round(a.assessment_score, 2),
    round(
      least(1, coalesce(c.content_completed, 0) / 8.0) * 60
      + least(1, coalesce(r.active_days, 0) / 14.0) * 40
    , 1),
    case when a.assessment_score is not null then
      round(
        a.assessment_score * 0.7
        + (
            least(1, coalesce(c.content_completed, 0) / 8.0) * 60
            + least(1, coalesce(r.active_days, 0) / 14.0) * 40
          ) / 10 * 0.3
      , 2)
    end
  from bucket b
  left join assessment a on a.week_start = b.week_start
  left join content c on c.week_start = b.week_start
  left join regularity r on r.week_start = b.week_start
  order by b.week_start;
$$;

comment on function public.performance_evolution(uuid, integer) is
  'Nota geral acumulada, semana a semana — alimenta o gráfico de evolução em Desempenho.';

grant execute on function public.performance_evolution(uuid, integer) to authenticated;

-- ------------------------------------------------------------- simulado_history --
-- Uma linha por TENTATIVA (não a mais recente só) — o histórico mostra a
-- evolução entre tentativas do mesmo simulado, não só o resultado atual.
create or replace function public.simulado_history(p_user_id uuid default auth.uid())
returns table (
  attempt_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  correct_count integer,
  total_count integer,
  percent numeric,
  duration_seconds integer,
  finished_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    qa.id,
    r.id,
    r.title,
    s.id,
    s.name,
    s.color,
    qa.correct_count,
    qa.total_count,
    round(qa.correct_count::numeric / greatest(qa.total_count, 1) * 100, 1),
    qa.duration_seconds,
    qa.finished_at
  from public.quiz_attempts qa
  join public.resources r on r.id = qa.resource_id and r.kind = 'simulado'
  left join public.subjects s on s.user_id = p_user_id and s.catalog_id = r.subject_catalog_id
  where qa.user_id = p_user_id and qa.finished_at is not null
  order by qa.finished_at desc;
$$;

comment on function public.simulado_history(uuid) is
  'Uma linha por tentativa de simulado finalizada — alimenta o Histórico de Simulados em Desempenho.';

grant execute on function public.simulado_history(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260907000500_notification_settings.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0907 (5) · Preferências de notificação
--
-- Only a preference the student saves — não existe envio real (push/e-mail)
-- ainda, então isto só guarda a intenção pra quando essa infraestrutura
-- existir. Um jsonb em vez de 4 colunas booleanas porque a lista tende a
-- crescer (a Fase 6, Nexa IA, e futuras notificações de Revisões vão
-- adicionar chaves), e todo campo aqui já nasce com default — nenhum
-- usuário existente fica com preferência indefinida.
-- ============================================================================

alter table public.profiles
  add column if not exists notification_settings jsonb not null default jsonb_build_object(
    'dailyReminder', true,
    'revisionReminder', true,
    'achievementsAndGoals', true,
    'newsUpdates', false
  );

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000100_track_category.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (1) · Categoria de trilha
--
-- Trilhas ganham seção própria na navegação (antes viviam só dentro da
-- matéria) e a listagem nova organiza por categoria, como no mockup. Default
-- 'reforco' porque a única trilha semeada hoje (Física) é exatamente isso —
-- reforço de conteúdo de uma matéria — e nenhuma trilha existente fica sem
-- categoria depois da migração.
-- ============================================================================

alter table public.tracks
  add column if not exists category text not null default 'reforco'
    check (category in ('enem', 'fundamental', 'reforco', 'carreiras', 'habilidades'));

create index if not exists tracks_category_idx on public.tracks (category);

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000300_content_reviews.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (3) · Revisões (substitui a Central de Erros)
--
-- O ADR-037 tinha juntado "Meus erros" e "Revisões de hoje" numa tela só,
-- porque na época as duas eram a mesma coisa (questão errada pra revisar).
-- Agora Revisões é mais ampla — fila de hoje/próximas/atrasadas/concluídas,
-- com repetição espaçada de verdade pra conteúdo concluído — e o usuário
-- confirmou que a tela nova SUBSTITUI /erros em vez de coexistir com ela.
--
-- `content_reviews` é um log de eventos (uma linha por confirmação), não uma
-- linha só por recurso — é o mesmo padrão de `quiz_attempts`/`study_sessions`
-- neste projeto, e é o que permite contar "quantas revisões você confirmou
-- hoje" sem perder o histórico de confirmações passadas.
-- ============================================================================

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  -- 0→3 dias, 1→7, 2→14, 3+→30. Sobe uma "confirmação de revisão" por vez;
  -- fica parado em 3 depois disso (repetição espaçada sem fim, não é uma
  -- barra que enche e acaba).
  interval_step integer not null default 0 check (interval_step >= 0),
  reviewed_at timestamptz not null default now()
);

create index if not exists content_reviews_user_resource_idx
  on public.content_reviews (user_id, resource_id, reviewed_at desc);
create index if not exists content_reviews_user_date_idx
  on public.content_reviews (user_id, reviewed_at desc);

alter table public.content_reviews enable row level security;

drop policy if exists content_reviews_all_own on public.content_reviews;
create policy content_reviews_all_own on public.content_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------- fila de revisão
-- Junta dois tipos de item na mesma fila: questões erradas (sempre "hoje",
-- igual à Central de Erros de antes) e conteúdo concluído cujo próximo
-- vencimento já chegou ou está próximo. `security definer` pelo mesmo motivo
-- de `recent_errors`/`topic_mastery`: perguntar "qual é o gabarito" e "o que
-- já foi concluído" exige ler tabelas sem policy de leitura direta pro aluno.
create or replace function public.review_queue(p_user_id uuid default auth.uid())
returns table (
  kind text,
  bucket text,
  question_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  statement text,
  explanation text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz,
  due_date date,
  next_interval_step integer,
  resource_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  with last_review as (
    select distinct on (cr.resource_id)
      cr.resource_id,
      cr.reviewed_at,
      cr.interval_step
    from public.content_reviews cr
    where cr.user_id = p_user_id
    order by cr.resource_id, cr.reviewed_at desc
  ),
  candidates as (
    select
      rp.resource_id,
      coalesce(lr.reviewed_at, rp.completed_at) as anchor_at,
      coalesce(lr.interval_step, -1) as last_step
    from public.resource_progress rp
    left join last_review lr on lr.resource_id = rp.resource_id
    where rp.user_id = p_user_id
      and rp.completed_at is not null
  ),
  scheduled as (
    select
      c.resource_id,
      (c.anchor_at + (case
        when c.last_step <= 0 then 3
        when c.last_step = 1 then 7
        when c.last_step = 2 then 14
        else 30
      end) * interval '1 day')::date as due_date,
      least(c.last_step + 1, 3) as next_interval_step
    from candidates c
  ),
  content_items as (
    select
      'conteudo'::text as kind,
      case
        when exists (
          select 1 from public.content_reviews cr2
          where cr2.user_id = p_user_id and cr2.resource_id = s.resource_id
            and cr2.reviewed_at::date = current_date
        ) then 'concluida'
        when s.due_date < current_date then 'atrasada'
        when s.due_date = current_date then 'hoje'
        else 'proxima'
      end as bucket,
      null::uuid as question_id,
      r.id as resource_id,
      r.title as resource_title,
      r.subject_catalog_id as subject_id,
      sc.name as subject_name,
      sc.default_color as subject_color,
      t.name as topic_name,
      null::text as statement,
      null::text as explanation,
      null::text as chosen_body,
      null::text as correct_body,
      null::timestamptz as answered_at,
      s.due_date,
      s.next_interval_step,
      r.kind::text as resource_kind
    from scheduled s
    join public.resources r on r.id = s.resource_id
    join public.subject_catalog sc on sc.id = r.subject_catalog_id
    left join public.content_topics t on t.id = r.topic_id
    where r.kind not in ('quiz', 'simulado')
  ),
  error_items as (
    select
      'erro'::text as kind,
      'hoje'::text as bucket,
      e.question_id,
      e.resource_id,
      e.resource_title,
      e.subject_id,
      e.subject_name,
      e.subject_color,
      e.topic_name,
      e.statement,
      e.explanation,
      e.chosen_body,
      e.correct_body,
      e.answered_at,
      current_date as due_date,
      0 as next_interval_step,
      null::text as resource_kind
    from public.recent_errors(p_user_id) e
  ),
  combined as (
    select * from error_items
    union all
    select * from content_items
  )
  -- Uma fila de "próximas" sem fim não cabe numa tela diária — atrasadas e
  -- hoje sempre entram, próximas só até duas semanas à frente.
  select * from combined
  where bucket <> 'proxima' or due_date <= current_date + 14
  order by
    case bucket when 'atrasada' then 0 when 'hoje' then 1 when 'proxima' then 2 else 3 end,
    due_date;
$$;

comment on function public.review_queue is
  'Fila de revisão: questões erradas (hoje) + conteúdo concluído vencido, hoje, próximo ou já revisado hoje.';

grant execute on function public.review_queue(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000400_metas.sql
-- ─────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000500_nexa_ia.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (5) · Nexa IA (estrutura, sem provedor de IA ainda)
--
-- Esta rodada entrega só a estrutura: sessões e mensagens de chat, com uma
-- resposta fixa em vez de uma chamada de LLM de verdade — falta a chave de
-- API, e decidir isso é do usuário, não do código. Quando a chave existir,
-- troca-se só a função que gera a resposta (ver `src/features/nexa-ia/
-- server/actions.ts`); o schema já fica pronto pra guardar a conversa real.
-- ============================================================================

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa' check (length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_idx on public.ai_chat_sessions (user_id, updated_at desc);

alter table public.ai_chat_sessions enable row level security;

drop policy if exists ai_chat_sessions_all_own on public.ai_chat_sessions;
create policy ai_chat_sessions_all_own on public.ai_chat_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists ai_chat_sessions_set_updated_at on public.ai_chat_sessions;
create trigger ai_chat_sessions_set_updated_at before update on public.ai_chat_sessions
  for each row execute function public.set_updated_at();

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(btrim(content)) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_session_idx on public.ai_chat_messages (session_id, created_at);

alter table public.ai_chat_messages enable row level security;

drop policy if exists ai_chat_messages_all_own on public.ai_chat_messages;
create policy ai_chat_messages_all_own on public.ai_chat_messages
  for all to authenticated
  using (exists (
    select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000600_atividades_score.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (6) · Nota de atividades substitui o empenho composto
--
-- Pedido do usuário: os 30% da nota que não são prova devem refletir
-- ATIVIDADES — conteúdo publicado na matéria que o aluno concluiu ou não —
-- e nada mais. Regularidade (dias ativos) e sequência (streak) saem da conta:
-- eram um proxy de esforço, mas não são "atividade" no sentido de tarefa que
-- existe pra ser feita.
--
-- Fórmula nova dos 30%:
--
--   atividades = (conteúdo concluído / conteúdo publicado na matéria) × 10
--
-- Com 1 atividade publicada, só existem dois resultados possíveis (0 ou 10);
-- com 2, três (0, 5, 10); e assim por diante — é a tabela que o usuário
-- descreveu, sem arredondamento escondido.
--
-- Sem conteúdo publicado na matéria ainda: fica nulo (não é 0 nem 10 — não há
-- o que medir), mesma regra de "nunca fabricar nota" que já vale para
-- `assessment_score`. Nesse caso a nota da matéria usa só o avaliativo, sem
-- forçar a divisão por 30%/70% sobre um lado vazio.
--
-- `empenho_index` continua sendo o nome da coluna (0–100) — é só o cálculo
-- que muda; o rótulo "Empenho (30%)" na tela de Matérias segue correto porque
-- 30% da nota é exatamente o que essa coluna representa.
--
-- `performance_evolution()` (o gráfico de evolução semanal) mantém a fórmula
-- simplificada e independente que já tinha antes (60% conteúdo + 40%
-- regularidade, documentada de propósito como diferente) — o usuário pediu a
-- NOTA da matéria, não o gráfico histórico, e reconstituir "quantas
-- atividades existiam há 8 semanas" para cada matéria não é possível sem
-- inventar dado.
-- ============================================================================

create or replace function public.subject_scores(p_user_id uuid default auth.uid())
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  has_content boolean,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric,
  quizzes_done integer,
  simulados_done integer,
  content_completed integer,
  target_grade numeric,
  passing_grade numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_attempt as (
    select distinct on (qa.resource_id)
      qa.resource_id, qa.correct_count, qa.total_count
    from public.quiz_attempts qa
    where qa.user_id = p_user_id and qa.finished_at is not null
    order by qa.resource_id, qa.finished_at desc
  ),
  attempt_scored as (
    select
      r.subject_catalog_id,
      r.kind,
      la.correct_count::numeric / greatest(la.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight
    from latest_attempt la
    join public.resources r on r.id = la.resource_id
    where r.kind in ('quiz', 'simulado')
  ),
  assessment as (
    select
      subject_catalog_id,
      sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score,
      count(*) filter (where kind = 'quiz') as quizzes_done,
      count(*) filter (where kind = 'simulado') as simulados_done
    from attempt_scored
    group by subject_catalog_id
  ),
  -- Atividade = conteúdo (resumo/podcast/vídeo/imagem) PUBLICADO e visível
  -- para este aluno — mesma regra de visibilidade de `resource_library()`:
  -- global (sem escola) ou da escola dele.
  content_available as (
    select r.subject_catalog_id, count(*) as content_total
    from public.resources r
    where r.kind in ('resumo', 'podcast', 'video', 'imagem')
      and r.is_published
      and (r.school_id is null or r.school_id = public.current_school_id(p_user_id))
    group by r.subject_catalog_id
  ),
  content_done as (
    select r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem')
    group by r.subject_catalog_id
  ),
  atividades as (
    select
      ca.subject_catalog_id,
      case
        when ca.content_total = 0 then null
        else round(coalesce(cd.content_completed, 0)::numeric / ca.content_total * 10, 2)
      end as atividades_score
    from content_available ca
    left join content_done cd on cd.subject_catalog_id = ca.subject_catalog_id
  )
  select
    s.id,
    s.name,
    s.color,
    s.catalog_id is not null,
    round(a.assessment_score, 2),
    coalesce(act.atividades_score, 0) * 10,
    case
      when a.assessment_score is not null and act.atividades_score is not null
        then round(a.assessment_score * 0.7 + act.atividades_score * 0.3, 2)
      when a.assessment_score is not null
        then round(a.assessment_score, 2)
    end,
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(cd.content_completed, 0)::integer,
    s.target_grade,
    6.0
  from public.subjects s
  left join assessment a on a.subject_catalog_id = s.catalog_id
  left join content_done cd on cd.subject_catalog_id = s.catalog_id
  left join atividades act on act.subject_catalog_id = s.catalog_id
  where s.user_id = p_user_id and s.archived_at is null
  order by s.sort_order, s.name;
$$;

comment on function public.subject_scores(uuid) is
  'Nota automática por matéria (70% avaliativo + 30% atividades concluídas) — substitui o boletim manual.';

grant execute on function public.subject_scores(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000700_avatars.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (7) · Bucket de foto de perfil
--
-- Diferente de `nexa-content` (só admin escreve), aqui é o próprio aluno que
-- sobe o arquivo, e só o SEU arquivo — por isso a policy de escrita não olha
-- o cargo, olha o CAMINHO: o objeto tem que morar numa pasta com o próprio
-- `auth.uid()` (`avatars/<user_id>/arquivo.jpg`), garantido no cliente pelo
-- código que monta o path, e garantido de novo aqui pela RLS, que é a que
-- realmente impede um aluno de sobrescrever a foto de outro.
--
-- Leitura pública pelo mesmo motivo do bucket de conteúdo: URL assinada
-- expira, e uma foto de perfil que some depois de uma hora é pior do que
-- nunca ter tido foto.
-- ============================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping avatars bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB: sobra para uma foto de perfil, e barra vídeo/PDF disfarçado
    array['image/png', 'image/jpeg', 'image/webp']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  execute $ddl$
    drop policy if exists avatars_read_all on storage.objects;
    create policy avatars_read_all on storage.objects
      for select using (bucket_id = 'avatars');

    drop policy if exists avatars_write_own on storage.objects;
    create policy avatars_write_own on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists avatars_update_own on storage.objects;
    create policy avatars_update_own on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists avatars_delete_own on storage.objects;
    create policy avatars_delete_own on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  $ddl$;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000800_notifications.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (8) · Notificações (central no app + push no aparelho)
--
-- Duas tabelas, dois propósitos diferentes:
--
--   • `notifications`      — o que aparece no sininho dentro do app. Sempre
--     existe, independente do aluno ter aceitado push ou não.
--   • `push_subscriptions` — o "endereço" do navegador/aparelho pra onde o
--     servidor pode empurrar um aviso mesmo com o app fechado. Um usuário
--     pode ter mais de uma (celular + computador), por isso é tabela própria
--     em vez de uma coluna em `profiles`.
--
-- Gatilho real, não fabricado: por enquanto só um evento cria notificação —
-- um admin publica conteúdo novo numa matéria que o aluno cursa
-- (`notify_subject_students`, chamada por `saveResource`/
-- `toggleResourcePublished`). Mais gatilhos entram conforme o produto pedir;
-- não inventamos uma central cheia de avisos que nada dispara de verdade.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  body text check (body is null or length(btrim(body)) <= 500),
  -- Caminho relativo do app pra onde o toque leva (ex.: '/estudar/<id>').
  -- Nulo quando o aviso não tem destino próprio.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

-- Só marcar como lida — o conteúdo do aviso não é do aluno editar.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------- push_subscriptions --
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_all_own on public.push_subscriptions;
create policy push_subscriptions_all_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --------------------------------------------------- notify_subject_students --
-- `security definer` porque isto grava notificação PARA OUTRO usuário — RLS
-- de `notifications` só deixa cada um escrever a própria. Só admin/
-- school_admin pode chamar, checado aqui dentro, não só pela grant.
create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'school_admin')
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null;
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260908000900_resource_bimestre.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0908 (9) · Bimestre no acervo
--
-- Biblioteca ganha um filtro por bimestre — enum fixo 1–4, não pasta livre —
-- mesmo padrão de `tracks.category`. `null` significa "vale o ano todo / não
-- amarrado a um bimestre específico" e é o default: nenhum recurso existente
-- fica classificado errado por causa desta migração.
--
-- Não é o mesmo `terms`/`academic_years` do calendário pessoal do aluno
-- (onboarding, `timetable_slots.term_id`) — aquilo é uma linha por aluno por
-- período; isto é uma classificação do conteúdo em si, escrita pelo admin uma
-- vez, valendo para todo mundo que enxerga o recurso.
-- ============================================================================

alter table public.resources
  add column if not exists bimestre smallint
    check (bimestre is null or bimestre between 1 and 4);

create index if not exists resources_bimestre_idx
  on public.resources (bimestre) where bimestre is not null;

-- `create or replace view` recusa mudar o conjunto de colunas de uma view
-- existente — e como esta migration é reaplicada (via setup-completo.sql)
-- por cima de um banco onde a definição ORIGINAL de `v_resource_library`
-- (sem `bimestre`, de 20260904000200) acabou de rodar de novo, `replace`
-- quebraria com "cannot drop columns from view". `drop` + `create` resolve:
-- nada mais depende desta view (é folha), então o drop é seguro.
drop view if exists public.v_resource_library;

create view public.v_resource_library
with (security_invoker = true) as
select
  r.id,
  r.kind,
  r.title,
  r.subtitle,
  r.description,
  r.thumbnail_url,
  r.duration_seconds,
  r.difficulty,
  r.xp_reward,
  r.school_id,
  r.subject_catalog_id,
  sc.name  as subject_name,
  sc.slug  as subject_slug,
  sc.default_color as subject_color,
  r.topic_id,
  t.name   as topic_name,
  r.sort_order,
  r.published_at,
  (select count(*) from public.questions q where q.resource_id = r.id) as question_count,
  r.bimestre
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published;

comment on view public.v_resource_library is
  'Biblioteca publicada e visível para quem consulta, já com matéria e assunto resolvidos.';

-- ─────────────────────────────────────────────────────────────────────
-- 20260909000000_content_time_source.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Study — 0909 (1) · Tempo de estudo passa a contar consumo de conteúdo
--
-- `study_sessions.source` só aceitava 'timer' (o cronômetro manual "Estudar
-- agora" da tela Hoje) e 'manual' (nunca usado de fato hoje). Ler um resumo,
-- ouvir um podcast ou assistir um vídeo em /estudar/[id] nunca gravava nada
-- aqui — só `resource_progress` (posição de rolagem/mídia), que mede ONDE o
-- aluno está, não QUANTO TEMPO ele passou. Resultado: quem estuda sem apertar
-- o cronômetro manual tinha zero minuto contado em "tempo de estudo" em
-- qualquer lugar do app.
--
-- `source = 'content'` fecha essa lacuna. Cada flush do hook de
-- rastreamento (`use-content-time-tracking.ts`) grava uma linha JÁ FECHADA
-- (`ended_at` preenchido no mesmo insert, nunca `null`) — por isso nunca
-- disputa `study_sessions_one_running_uq` (único por `ended_at is null`),
-- mesmo que o cronômetro manual esteja rodando na mesma conta ao mesmo
-- tempo. Sem mudança de RLS: `study_sessions_all_own` já cobre qualquer
-- `source`, e o trigger `sync_study_total()` já soma `duration_seconds`
-- independente do valor de `source`.
-- ============================================================================

alter table public.study_sessions drop constraint if exists study_sessions_source_check;
alter table public.study_sessions add constraint study_sessions_source_check
  check (source in ('timer', 'manual', 'content'));

-- ─────────────────────────────────────────────────────────────────────
-- 20260909000100_admin_reports.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0909 (2) · Leituras administrativas de desempenho/estudo por aluno
--
-- `subject_scores`/`performance_evolution`/`simulado_history` são `security
-- invoker` de propósito (migration 0907 (4)): a RLS de `quiz_attempts`/
-- `resource_progress`/`study_sessions`/`subjects`/`user_stats` restringe cada
-- aluno à própria linha, e isso é o que impede a nota de um aluno vazar para
-- outro. Essas seis funções são a ÚNICA porta pela qual um admin lê o
-- desempenho de OUTRO usuário — cada uma autoriza primeiro (`is_admin()` ou
-- `can_manage_school()` da escola do ALVO, nunca de quem chama) e só então
-- lê o dado. `security definer` aqui não é um jeito de "furar" a RLS por
-- engano: é o mesmo mecanismo que já faz `is_admin()` funcionar dentro de
-- políticas de `profiles` sem recursão, e que `notify_subject_students` já
-- usa para gravar notificação para outro usuário — aplicado a leitura em vez
-- de escrita, com a MESMA disciplina de checar autorização por dentro antes
-- de tocar em qualquer linha.
-- ============================================================================

create or replace function public.admin_subject_scores(p_target_user_id uuid)
returns table (
  subject_id uuid, subject_name text, subject_color text, has_content boolean,
  assessment_score numeric, empenho_index numeric, blended_score numeric,
  quizzes_done integer, simulados_done integer, content_completed integer,
  target_grade numeric, passing_grade numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.subject_scores(p_target_user_id);
end;
$$;

create or replace function public.admin_performance_evolution(
  p_target_user_id uuid,
  p_weeks integer default 12
)
returns table (
  week_start date, assessment_score numeric, empenho_index numeric, blended_score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.performance_evolution(p_target_user_id, p_weeks);
end;
$$;

create or replace function public.admin_simulado_history(p_target_user_id uuid)
returns table (
  attempt_id uuid, resource_id uuid, resource_title text, subject_id uuid,
  subject_name text, subject_color text, correct_count integer, total_count integer,
  percent numeric, duration_seconds integer, finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.simulado_history(p_target_user_id);
end;
$$;

-- Linhas cruas, não já agrupadas por semana: o agrupamento por semana ISO já
-- existe em TypeScript (`groupByWeek`, performance/server/queries.ts) — não
-- faz sentido reescrever a mesma conta em SQL só porque quem lê mudou.
create or replace function public.admin_study_sessions(p_target_user_id uuid)
returns table (local_date date, duration_seconds integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select ss.local_date, ss.duration_seconds
    from public.study_sessions ss
    where ss.user_id = p_target_user_id and ss.ended_at is not null
    order by ss.local_date;
end;
$$;

create or replace function public.admin_user_stats(p_target_user_id uuid)
returns table (
  xp integer, level smallint, current_streak integer, longest_streak integer,
  total_study_seconds bigint, last_active_local_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select us.xp, us.level, us.current_streak, us.longest_streak,
           us.total_study_seconds, us.last_active_local_date
    from public.user_stats us
    where us.user_id = p_target_user_id;
end;
$$;

-- Agregado por escola (ou toda a base, só pra admin geral) — uma função só,
-- pra /admin/relatorios não precisar somar aluno por aluno no TypeScript.
-- `p_school_id is null` = "todas as escolas", liberado só quando
-- `is_admin()` (can_manage_school(null) é sempre falso por definição).
create or replace function public.admin_school_summary(p_school_id uuid default null)
returns table (
  student_count integer,
  active_last_7d_count integer,
  total_study_seconds bigint,
  avg_current_streak numeric,
  quizzes_done_30d integer,
  simulados_done_30d integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or (p_school_id is not null and public.can_manage_school(p_school_id))) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  with scope as (
    select p.id from public.profiles p
    where p.role = 'student' and (p_school_id is null or p.school_id = p_school_id)
  )
  select
    (select count(*) from scope)::integer,
    (select count(*) from public.user_stats us join scope s on s.id = us.user_id
       where us.last_active_local_date >= (current_date - interval '7 days')::date)::integer,
    coalesce((select sum(us.total_study_seconds) from public.user_stats us join scope s on s.id = us.user_id), 0)::bigint,
    coalesce((select avg(us.current_streak) from public.user_stats us join scope s on s.id = us.user_id), 0),
    (select count(*) from public.quiz_attempts qa join public.resources r on r.id = qa.resource_id
       join scope s on s.id = qa.user_id
       where r.kind = 'quiz' and qa.finished_at >= now() - interval '30 days')::integer,
    (select count(*) from public.quiz_attempts qa join public.resources r on r.id = qa.resource_id
       join scope s on s.id = qa.user_id
       where r.kind = 'simulado' and qa.finished_at >= now() - interval '30 days')::integer;
end;
$$;

grant execute on function public.admin_subject_scores(uuid) to authenticated;
grant execute on function public.admin_performance_evolution(uuid, integer) to authenticated;
grant execute on function public.admin_simulado_history(uuid) to authenticated;
grant execute on function public.admin_study_sessions(uuid) to authenticated;
grant execute on function public.admin_user_stats(uuid) to authenticated;
grant execute on function public.admin_school_summary(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260909000200_profiles_admin_select.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0909 (3) · Admin enxerga outros perfis (bug de longa data)
--
-- `profiles` só tinha `profiles_select_own` (`id = auth.uid()`) — nenhuma
-- policy jamais liberou um admin a ler o perfil de outra pessoa. Isso
-- significa que `/admin/usuarios` (já em produção) nunca conseguiu de fato
-- listar ninguém além do próprio admin logado: a RLS silenciosamente
-- devolvia zero linhas pra qualquer `select` que não fosse a própria,
-- mesmo vindo de quem tinha `role = 'admin'`. `getPersonById`/
-- `getAdminStudentReport` (0909) dependem de ler o PERFIL do aluno-alvo
-- antes mesmo de chegar nas funções admin_* — sem esta policy, todo o
-- relatório individual quebraria do mesmo jeito.
--
-- `is_admin()`/`can_manage_school()` já são `security definer`, então usá-
-- las AQUI DENTRO de uma policy de `profiles` não recursiona: elas leem
-- `profiles` com o privilégio de quem as definiu, não com a RLS do chamador.
-- ============================================================================

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin() or public.can_manage_school(school_id));

-- ─────────────────────────────────────────────────────────────────────
-- 20260909000300_profiles_admin_update.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0909 (4) · Admin consegue ATUALIZAR outros perfis (papel/escola)
--
-- A migration anterior (0909 (3)) resolveu a LEITURA (`profiles_select_admin`)
-- — sem ela, um admin nem via outros alunos na lista. Mas `setPersonRole`
-- (a ação que salva papel/escola de outra pessoa) faz um `update` comum, e
-- `profiles` só tinha `profiles_update_own` (`id = auth.uid()`): mesmo
-- depois do código corrigido pra sempre gravar `school_id`, a RLS
-- silenciosamente recusava a escrita em QUALQUER linha que não fosse a do
-- próprio admin — Supabase não lança erro nesse caso, só devolve zero
-- linhas afetadas, e a tela parecia "não salvar nada" sem explicação.
--
-- `guard_profile_role` (trigger já existente) continua sendo quem decide
-- especificamente SE o papel pode mudar — esta policy só abre a porta da
-- linha em si, não desliga aquela trava.
-- ============================================================================

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin() or public.can_manage_school(school_id))
  with check (public.is_admin() or public.can_manage_school(school_id));

-- ─────────────────────────────────────────────────────────────────────
-- 20260910000100_resource_html_format.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0910 · Resumo interativo (HTML incorporado)
--
-- Terceiro valor de `content_format` (0907_pdf_resources.sql já criou a
-- coluna para markdown/pdf) — sem tabela nova, sem `kind` novo. O HTML fica
-- no mesmo `body` que já guarda o markdown; o leitor decide como renderizar
-- pelo `content_format`, isolando o HTML num `<iframe sandbox>` (nunca
-- `dangerouslySetInnerHTML` no documento principal).
-- ============================================================================

alter table public.resources
  drop constraint if exists resources_content_format_check;

alter table public.resources
  add constraint resources_content_format_check
    check (content_format in ('markdown', 'pdf', 'html'));

comment on column public.resources.content_format is
  'Para kind=resumo: markdown (texto digitado), pdf (arquivo enviado) ou html (embed sandboxed).';

-- ─────────────────────────────────────────────────────────────────────
-- 20260910000200_ranking_e_conquistas.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0910 (2) · Ranking de XP + motor de conquistas
--
-- Duas peças que só fazem sentido juntas:
--
--  1. `achievements`/`user_achievements` já existiam (14 linhas reais em
--     seed.sql) mas NADA nunca escrevia `unlocked_at` — nenhum trigger, cron
--     ou RPC avaliava `metric`/`threshold` contra atividade real. Todo aluno
--     via 14 conquistas permanentemente bloqueadas. `check_achievements()`
--     fecha essa lacuna, chamada ao final de `award_xp`/`touch_streak` — as
--     duas funções que TODA ação que "conta" já invoca hoje, então nenhum
--     call site em TypeScript precisa mudar.
--
--  2. Ranking de XP por escola/turma, computado ao vivo — sem tabela espelho
--     nova. `user_stats` já tem xp/level/streak; `xp_events` (ledger
--     completo) dá o XP por período; `quiz_answers`/`quiz_attempts`/
--     `resource_progress` dão as contagens. Duplicar isso numa tabela
--     `ranking` própria criaria um segundo lugar pra dessincronizar.
--
-- `first_grade`/`ten_grades` (métrica `grades_logged`) ficam inativas: nota
-- manual não existe mais desde a automatização do boletim (migração
-- 20260907000300) — não há mais o que "logar".
-- ============================================================================

-- ------------------------------------------------------------- rarity ------
alter table public.achievements
  add column if not exists rarity text not null default 'comum'
    check (rarity in ('comum', 'rara', 'epica', 'lendaria'));

update public.achievements set rarity = 'comum'
  where id in ('first_steps', 'first_session', 'checklist_day', 'first_grade');
update public.achievements set rarity = 'rara'
  where id in ('streak_7', 'study_10h', 'checklist_week', 'tasks_25', 'goal_reached', 'ten_grades');
update public.achievements set rarity = 'epica'
  where id in ('streak_30', 'study_50h', 'all_passing');

comment on column public.achievements.rarity is
  'Selo visual da conquista — não afeta a lógica de desbloqueio, só a apresentação.';

-- `first_steps` já é pago via `award_xp(50, 'Configurou o Nexa', 'system', ...)`
-- direto na função de conclusão do onboarding (20260907000300, linha ~207) —
-- o motor de conquistas agora desbloqueia o SELO no mesmo instante (mesmo
-- sinal: onboarded_at preenchido), mas sem pagar os 50 XP de novo por cima.
update public.achievements set xp_reward = 0 where id = 'first_steps';

-- Nota manual não existe mais (boletim é 100% automático) — não há como
-- "logar uma nota" hoje, então essas duas param de valer para novos alunos.
-- Quem já as tinha desbloqueado mantém (histórico não se apaga).
update public.achievements set is_active = false
  where id in ('first_grade', 'ten_grades');

-- Conquistas novas do pedido do usuário, com dado real disponível hoje.
insert into public.achievements (id, name, description, icon, category, metric, threshold, xp_reward, rarity, sort_order)
values
  ('first_simulado',       'Primeiro simulado',   'Você terminou seu primeiro simulado.',              'clipboard-check', 'estudo', 'simulados_done',     1,  100, 'comum',    150),
  ('questions_100',        '100 questões',        'Cem questões respondidas em quizzes e simulados.',  'help-circle',     'estudo', 'questions_answered', 100, 150, 'comum',    160),
  ('questions_500',        '500 questões',        'Quinhentas questões — o hábito pegou.',             'help-circle',     'estudo', 'questions_answered', 500, 400, 'rara',     170),
  ('questions_1000',       '1000 questões',       'Mil questões respondidas. Sério.',                  'help-circle',     'estudo', 'questions_answered', 1000, 800, 'epica',   180),
  ('first_subject_graded', 'Primeira matéria',    'Uma matéria já tem nota automática calculada.',     'graduation-cap',  'notas',  'subjects_graded',    1,  80,  'comum',    190),
  ('study_100h',           '100 horas de foco',   'Cem horas estudadas no Nexa.',                      'hourglass',       'estudo', 'study_minutes',      6000, 700, 'rara',    200),
  ('study_500h',           '500 horas de foco',   'Quinhentas horas. Isso é outro nível.',              'flame',           'estudo', 'study_minutes',      30000, 1500, 'lendaria', 210)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      metric = excluded.metric,
      threshold = excluded.threshold,
      xp_reward = excluded.xp_reward,
      rarity = excluded.rarity,
      sort_order = excluded.sort_order,
      is_active = true;

-- ============================================================================
-- Motor de desbloqueio
-- ============================================================================

-- Avalia toda conquista ativa contra dado real e desbloqueia as que baterem o
-- threshold. Rodar de novo para uma conquista já desbloqueada não paga XP em
-- dobro nem sobrescreve `unlocked_at` — a garantia é a transição
-- bloqueada→desbloqueada lida abaixo, não a deduplicação de `award_xp` (essa
-- não enxerga estas linhas, ver comentário mais abaixo).
create or replace function public.check_achievements(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats public.user_stats;
  v_achievement record;
  v_progress integer;
  v_questions_answered integer;
  v_simulados_done integer;
  v_subjects_graded integer;
  v_tasks_done integer;
  v_perfect_days integer;
  v_goals_reached boolean;
  v_all_passing boolean;
  v_ja_desbloqueada timestamptz;
begin
  if p_user_id is null then
    return;
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;
  if not found then
    return; -- nada pra avaliar ainda
  end if;

  select count(*) into v_questions_answered
  from public.quiz_answers qa
  join public.quiz_attempts a on a.id = qa.attempt_id
  where a.user_id = p_user_id;

  select count(*) into v_simulados_done
  from public.quiz_attempts a
  join public.resources r on r.id = a.resource_id
  where a.user_id = p_user_id and a.finished_at is not null and r.kind = 'simulado';

  select count(*) into v_tasks_done
  from public.tasks t where t.user_id = p_user_id and t.completed_at is not null;

  -- "Dia perfeito": todo hábito ativo agendado para aquele dia da semana foi
  -- concluído nele. Comparado por (dia, quantidade de rotinas daquele dia da
  -- semana) contra (dia, quantidade de rotinas concluídas naquele dia).
  select count(*) into v_perfect_days
  from (
    select rc.local_date
    from public.routine_completions rc
    join public.routines r on r.id = rc.routine_id and r.user_id = p_user_id
    group by rc.local_date
    having count(*) >= (
      select count(*) from public.routines r2
      where r2.user_id = p_user_id and r2.is_active
        and extract(dow from rc.local_date)::smallint = any (r2.days_of_week)
    )
  ) perfect;

  select
    coalesce(bool_or(s.blended_score is not null and s.target_grade is not null
      and s.blended_score >= s.target_grade), false),
    coalesce(bool_and(s.blended_score is not null and s.blended_score >= s.passing_grade)
      filter (where s.has_content), false) and count(*) filter (where s.has_content) > 0,
    count(*) filter (where s.blended_score is not null)
  into v_goals_reached, v_all_passing, v_subjects_graded
  from public.subject_scores(p_user_id) s;

  for v_achievement in
    select * from public.achievements where is_active order by sort_order
  loop
    v_progress := case v_achievement.metric
      when 'onboarded' then
        case when exists (
          select 1 from public.profiles p where p.id = p_user_id and p.onboarded_at is not null
        ) then 1 else 0 end
      when 'sessions' then (select count(*) from public.study_sessions ss where ss.user_id = p_user_id)
      when 'study_minutes' then (v_stats.total_study_seconds / 60)::integer
      when 'streak_days' then v_stats.longest_streak
      when 'perfect_days' then v_perfect_days
      when 'tasks_done' then v_tasks_done
      when 'goals_reached' then case when v_goals_reached then 1 else 0 end
      when 'all_passing' then case when v_all_passing then 1 else 0 end
      when 'simulados_done' then v_simulados_done
      when 'questions_answered' then v_questions_answered
      when 'subjects_graded' then v_subjects_graded
      else 0
    end;

    -- `achievement_id` é slug (text), não cabe em `xp_events.source_id`
    -- (uuid) — sem source_id, o índice de deduplicação de `award_xp` não
    -- enxerga esta linha, então NÃO dá pra confiar nele pra evitar pagar o
    -- xp_reward duas vezes. A garantia vem daqui: só chama `award_xp`
    -- quando a conquista está transicionando de bloqueada pra desbloqueada
    -- (ou seja, `unlocked_at` era nulo até agora) — nunca por "progresso já
    -- passou do threshold", que continuaria verdadeiro pra sempre depois.
    select ua.unlocked_at into v_ja_desbloqueada
    from public.user_achievements ua
    where ua.user_id = p_user_id and ua.achievement_id = v_achievement.id;

    insert into public.user_achievements (user_id, achievement_id, progress, unlocked_at)
    values (
      p_user_id, v_achievement.id, least(v_progress, v_achievement.threshold),
      case when v_progress >= v_achievement.threshold then now() else null end
    )
    on conflict (user_id, achievement_id) do update
    set progress = least(excluded.progress, v_achievement.threshold),
        unlocked_at = coalesce(user_achievements.unlocked_at,
          case when excluded.progress >= v_achievement.threshold then now() else null end);

    if v_ja_desbloqueada is null and v_progress >= v_achievement.threshold
       and v_achievement.xp_reward > 0 then
      perform public.award_xp(
        v_achievement.xp_reward, v_achievement.name, 'achievement', null, p_user_id
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.check_achievements(uuid) to authenticated;

-- `award_xp`/`touch_streak` redefinidas com a mesma assinatura e corpo de
-- 20260730000600_gamification.sql, só acrescentando a chamada ao motor no
-- fim. As duas chamam — não só uma — porque os pontos de chamada em
-- TypeScript disparam as duas em paralelo (`Promise.all`) e as funções SQL
-- de quiz/lição chamam `award_xp` ANTES de `touch_streak`: uma conquista de
-- sequência avaliada só dentro de `award_xp` veria o streak desatualizado
-- nesses casos. Rodar nas duas é barato (leitura, sem efeito colateral) e
-- garante que, não importa a ordem, a última a terminar sempre reavalia com
-- o dado fresco.
create or replace function public.award_xp(
  p_amount integer,
  p_reason text,
  p_source_type text default 'system',
  p_source_id uuid default null,
  p_user_id uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_today date;
begin
  if p_user_id is null then
    raise exception 'award_xp requires a user' using errcode = '28000';
  end if;
  if p_amount = 0 then
    return 0;
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);

  insert into public.xp_events (user_id, amount, reason, source_type, source_id, local_date)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id, v_today)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 0; -- already awarded for this source
  end if;

  update public.user_stats s
  set xp = greatest(0, s.xp + p_amount),
      level = public.xp_to_level(greatest(0, s.xp + p_amount))
  where s.user_id = p_user_id;

  perform public.check_achievements(p_user_id);

  return p_amount;
end;
$$;

create or replace function public.touch_streak(p_user_id uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_week date;
  v_stats public.user_stats;
  v_gap integer;
  v_new_streak integer;
  v_freezes smallint;
begin
  if p_user_id is null then
    raise exception 'touch_streak requires a user' using errcode = '28000';
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);
  v_week := date_trunc('week', v_today)::date;

  select * into v_stats from public.user_stats where user_id = p_user_id for update;

  v_freezes := v_stats.streak_freezes_available;
  if v_stats.streak_freezes_granted_week is null or v_stats.streak_freezes_granted_week < v_week then
    v_freezes := 1;
  end if;

  if v_stats.last_active_local_date = v_today then
    perform public.check_achievements(p_user_id);
    return v_stats.current_streak; -- already counted today
  end if;

  if v_stats.last_active_local_date is null then
    v_new_streak := 1;
  else
    v_gap := v_today - v_stats.last_active_local_date;
    if v_gap = 1 then
      v_new_streak := v_stats.current_streak + 1;
    elsif v_gap = 2 and v_freezes > 0 then
      v_new_streak := v_stats.current_streak + 1;
      v_freezes := v_freezes - 1;
    else
      v_new_streak := 1;
    end if;
  end if;

  update public.user_stats
  set current_streak = v_new_streak,
      longest_streak = greatest(longest_streak, v_new_streak),
      last_active_local_date = v_today,
      streak_freezes_available = v_freezes,
      streak_freezes_granted_week = v_week
  where user_id = p_user_id;

  perform public.check_achievements(p_user_id);

  return v_new_streak;
end;
$$;

-- ============================================================================
-- Ranking
-- ============================================================================

-- Quem chama sem ser admin geral nunca escolhe a escola: sempre a própria.
-- Mesmo cuidado de `resolveSchoolId` (TypeScript) espelhado em SQL.
create or replace function public.school_ranking(
  p_scope text default 'escola',       -- 'escola' | 'turma'
  p_class_name text default null,
  p_period text default 'geral',       -- 'hoje' | 'semana' | 'mes' | 'geral'
  p_school_id uuid default null
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  xp bigint,
  level smallint,
  current_streak integer,
  questions_answered integer,
  study_hours numeric,
  rank bigint,
  previous_rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_school_id uuid;
  v_period_start date;
  v_today date := public.user_local_date(auth.uid());
begin
  select p.role into v_caller_role from public.profiles p where p.id = auth.uid();

  if v_caller_role = 'admin' and p_school_id is not null then
    v_school_id := p_school_id;
  else
    v_school_id := public.current_school_id(auth.uid());
  end if;

  if v_school_id is null then
    return; -- sem escola vinculada, sem ranking pra mostrar
  end if;

  v_period_start := case p_period
    when 'hoje' then v_today
    when 'semana' then date_trunc('week', v_today)::date
    when 'mes' then date_trunc('month', v_today)::date
    else null -- 'geral': sem corte, usa o total acumulado
  end;

  return query
  with escopo as (
    select pr.id as user_id, pr.full_name, pr.avatar_url, pr.class_name
    from public.profiles pr
    where pr.school_id = v_school_id
      and pr.role = 'student'
      and (p_scope <> 'turma' or pr.class_name = p_class_name)
  ),
  xp_no_periodo as (
    select e.user_id, sum(e.amount) as ganho
    from public.xp_events e
    where v_period_start is not null and e.local_date >= v_period_start
    group by e.user_id
  ),
  xp_total as (
    select us.user_id, us.xp, us.level, us.current_streak, us.total_study_seconds
    from public.user_stats us
    where us.user_id in (select escopo.user_id from escopo)
  ),
  atual as (
    select
      esc.user_id, esc.full_name, esc.avatar_url, esc.class_name,
      coalesce(case when v_period_start is null then xt.xp else xnp.ganho end, 0)::bigint as xp,
      coalesce(xt.level, 1) as level,
      coalesce(xt.current_streak, 0) as current_streak,
      coalesce(xt.total_study_seconds, 0) as total_study_seconds
    from escopo esc
    left join xp_total xt on xt.user_id = esc.user_id
    left join xp_no_periodo xnp on xnp.user_id = esc.user_id
  ),
  -- XP no início do período: total de hoje menos o que foi ganho DENTRO do
  -- período — dá pra reconstruir o ranking "de antes" sem guardar snapshot.
  antes as (
    select a.user_id, greatest(0, coalesce(xt.xp, 0) - coalesce(xnp.ganho, 0)) as xp_antes
    from atual a
    left join xp_total xt on xt.user_id = a.user_id
    left join xp_no_periodo xnp on xnp.user_id = a.user_id
    where v_period_start is not null
  ),
  ranked_atual as (
    select a.*, rank() over (order by a.xp desc) as rk
    from atual a
  ),
  ranked_antes as (
    select an.user_id, rank() over (order by an.xp_antes desc) as rk
    from antes an
  ),
  contagens as (
    select
      qat.user_id,
      count(*) as questions_answered
    from public.quiz_answers qa
    join public.quiz_attempts qat on qat.id = qa.attempt_id
    where qat.user_id in (select escopo.user_id from escopo)
    group by qat.user_id
  )
  select
    r.user_id, r.full_name, r.avatar_url, r.class_name, r.xp, r.level::smallint,
    r.current_streak, coalesce(c.questions_answered, 0)::integer,
    round(r.total_study_seconds / 3600.0, 1),
    r.rk, ra.rk
  from ranked_atual r
  left join contagens c on c.user_id = r.user_id
  left join ranked_antes ra on ra.user_id = r.user_id
  order by r.rk;
end;
$$;

grant execute on function public.school_ranking(text, text, text, uuid) to authenticated;

-- Série diária de XP acumulado (últimos p_days), pra comparar "eu" × "média
-- da escola" × "1º colocado" no gráfico de evolução.
create or replace function public.ranking_evolution(p_user_id uuid default auth.uid(), p_days integer default 30)
returns table (
  day date,
  me_xp bigint,
  school_avg_xp numeric,
  top1_xp bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school_id uuid := public.current_school_id(p_user_id);
  v_start date := public.user_local_date(p_user_id) - (greatest(p_days, 1) - 1);
begin
  if v_school_id is null then
    return;
  end if;

  return query
  with dias as (
    select generate_series(v_start, public.user_local_date(p_user_id), interval '1 day')::date as day
  ),
  alunos as (
    select id as user_id from public.profiles where school_id = v_school_id and role = 'student'
  ),
  eventos as (
    select e.user_id, e.local_date, e.amount
    from public.xp_events e
    where e.user_id in (select alunos.user_id from alunos)
  ),
  acumulado as (
    select
      a.user_id, d.day,
      coalesce(sum(e.amount) filter (where e.local_date <= d.day), 0) as xp_ate_o_dia
    from alunos a
    cross join dias d
    left join eventos e on e.user_id = a.user_id
    group by a.user_id, d.day
  )
  select
    d.day,
    coalesce(max(acumulado.xp_ate_o_dia) filter (where acumulado.user_id = p_user_id), 0)::bigint,
    round(avg(acumulado.xp_ate_o_dia), 1),
    max(acumulado.xp_ate_o_dia)::bigint
  from dias d
  join acumulado on acumulado.day = d.day
  group by d.day
  order by d.day;
end;
$$;

grant execute on function public.ranking_evolution(uuid, integer) to authenticated;

-- ============================================================================
-- Cartão de perfil do aluno (modal do ranking)
-- ============================================================================

-- `profiles` só tem policy de leitura da PRÓPRIA linha (+ admin) — nenhuma
-- policy de "colega da mesma escola pode ler". Em vez de abrir essa policy
-- (vazaria e-mail/telefone se algum dia entrarem na tabela), esta função
-- `security definer` expõe só o que o cartão precisa, e só pra quem já
-- compartilha escola (ou é admin) — mesma barreira que `school_ranking` já
-- aplica. Devolve jsonb (não uma tabela) porque o cartão tem duas listas
-- aninhadas (matérias favoritas, conquistas) — o mesmo formato que
-- `bootstrap_student` já usa para o mesmo tipo de retorno composto.
create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, p.class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts a
        join public.resources r on r.id = a.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where a.user_id = p_user_id and a.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ach.id, 'name', ach.name, 'icon', ach.icon, 'rarity', ach.rarity, 'unlockedAt', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements ach on ach.id = ua.achievement_id
      where ua.user_id = p_user_id and ua.unlocked_at is not null
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.student_profile_card(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000100_friendships.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (1) · Sistema de amizade (Fase 2 do Ranking de XP)
--
-- Fase 1 (20260910000200) deixou de fora, de propósito, "amigos" e
-- "atualização em tempo real" — não existia tabela de relação entre dois
-- usuários em lugar nenhum do schema, e o pedido original já tinha sido
-- reduzido pra "atualiza sozinho ao voltar pra tela" (sem Supabase Realtime,
-- que este projeto não usa em nenhum outro lugar). Esta migração fecha a
-- primeira parte; a segunda continua resolvida do mesmo jeito de sempre — o
-- sino de notificações já existente (20260908000800) já recarrega a cada
-- navegação, então um pedido de amizade vira notificação normal ali, sem
-- inventar um canal novo.
--
-- Nenhuma policy de RLS pra leitura/escrita direta de `friendships`: não dá
-- pra expressar "a OUTRA pessoa da amizade" numa policy sem uma função
-- auxiliar de qualquer jeito — e as RPCs abaixo já precisam enriquecer com
-- nome/avatar de `profiles` (que também não tem policy de leitura entre
-- colegas, mesma razão de `student_profile_card`). Mesmo padrão de
-- `notifications`: toda escrita passa por função `security definer`.
-- ============================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- Uma linha só por par de pessoas, não importa quem pediu — pedido A→B e B→A
-- são a mesma relação. `least`/`greatest` de uuid é imutável, então dá pra
-- indexar a expressão direto.
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_addressee_pending_idx
  on public.friendships (addressee_id) where status = 'pending';

alter table public.friendships enable row level security;
-- (Sem policies — acesso só pelas funções abaixo. Ver comentário no topo.)

-- ----------------------------------------------------------------------------
-- notify_user: única função nesta migração sem `grant execute to authenticated`
-- de propósito — é usada só internamente por `send_friend_request`/
-- `respond_friend_request` (chamada direta de função pra função não passa
-- pelo PostgREST, não precisa de grant). Expor isso pra qualquer usuário
-- autenticado viraria uma forma de mandar notificação com título/corpo livre
-- pra qualquer outro id de usuário — igual ao motivo de `notify_subject_students`
-- checar o papel de quem chama, só que aqui nem exponho a chamada direta.
-- ----------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, link)
  values (p_user_id, p_title, p_body, p_link);
end;
$$;

-- ----------------------------------------------------------------------------
-- send_friend_request: pedir amizade a um colega da mesma escola.
--
--   • Já existe pedido seu pendente pro mesmo colega → não faz nada de novo
--     ('already_pending').
--   • Já são amigos → não faz nada ('already_friends').
--   • O colega já tinha te chamado (pedido pendente na direção contrária) →
--     vira amizade na hora, sem precisar de um "aceitar" redundante pros dois
--     lados ('accepted').
--   • Pedido anterior tinha sido recusado → deixa pedir de novo, reabrindo a
--     mesma linha como pendente (não acumula lixo de linhas recusadas).
-- ----------------------------------------------------------------------------
create or replace function public.send_friend_request(p_addressee_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.friendships;
  v_name text;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_addressee_id = v_me then
    raise exception 'não dá pra se adicionar como amigo' using errcode = '22023';
  end if;
  if public.current_school_id(v_me) is null
     or public.current_school_id(v_me) <> public.current_school_id(p_addressee_id) then
    raise exception 'só dá pra adicionar colegas da mesma escola' using errcode = '42501';
  end if;

  -- `FOUND` reflete o resultado do último comando executado — precisa ser
  -- checado ANTES de qualquer outro select (inclusive o do nome, abaixo),
  -- senão ele reflete a busca errada.
  select * into v_row from public.friendships
  where least(requester_id, addressee_id) = least(v_me, p_addressee_id)
    and greatest(requester_id, addressee_id) = greatest(v_me, p_addressee_id);

  if not found then
    select full_name into v_name from public.profiles where id = v_me;
    insert into public.friendships (requester_id, addressee_id, status)
    values (v_me, p_addressee_id, 'pending');
    perform public.notify_user(
      p_addressee_id, 'Novo pedido de amizade',
      coalesce(v_name, 'Um colega') || ' quer ser seu amigo no ranking.', '/ranking'
    );
    return 'pending';
  end if;

  select full_name into v_name from public.profiles where id = v_me;

  if v_row.status = 'accepted' then
    return 'already_friends';
  end if;

  if v_row.status = 'pending' then
    if v_row.requester_id = v_me then
      return 'already_pending';
    end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
    perform public.notify_user(
      v_row.requester_id, 'Pedido de amizade aceito',
      coalesce(v_name, 'Um colega') || ' aceitou seu pedido de amizade.', '/ranking'
    );
    return 'accepted';
  end if;

  -- status = 'declined': reabre como pendente, com você como remetente atual.
  update public.friendships
  set requester_id = v_me, addressee_id = p_addressee_id, status = 'pending',
      created_at = now(), responded_at = null
  where id = v_row.id;
  perform public.notify_user(
    p_addressee_id, 'Novo pedido de amizade',
    coalesce(v_name, 'Um colega') || ' quer ser seu amigo no ranking.', '/ranking'
  );
  return 'pending';
end;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- respond_friend_request: só quem recebeu o pedido responde.
-- ----------------------------------------------------------------------------
create or replace function public.respond_friend_request(p_requester_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.friendships;
  v_name text;
begin
  select * into v_row from public.friendships
  where requester_id = p_requester_id and addressee_id = v_me and status = 'pending';

  if not found then
    raise exception 'pedido não encontrado' using errcode = 'P0002';
  end if;

  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = v_row.id;

  if p_accept then
    select full_name into v_name from public.profiles where id = v_me;
    perform public.notify_user(
      p_requester_id, 'Pedido de amizade aceito',
      coalesce(v_name, 'Um colega') || ' aceitou seu pedido de amizade.', '/ranking'
    );
  end if;
end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- remove_friend: desfaz a amizade OU cancela um pedido pendente (seu ou do
-- outro lado) — mesma ação de "some com essa linha", já que os dois casos
-- (desfazer amizade, cancelar pedido enviado, cancelar pedido recebido sem
-- responder) têm o mesmo efeito esperado do lado de quem chama.
-- ----------------------------------------------------------------------------
create or replace function public.remove_friend(p_other_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  delete from public.friendships
  where least(requester_id, addressee_id) = least(v_me, p_other_id)
    and greatest(requester_id, addressee_id) = greatest(v_me, p_other_id);
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- search_schoolmates: busca pra adicionar amigo — só colegas da MESMA escola,
-- nunca a própria pessoa. `security definer` pela mesma razão de
-- `student_profile_card`: `profiles` não tem policy de leitura entre colegas.
-- ----------------------------------------------------------------------------
create or replace function public.search_schoolmates(p_query text)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  friendship_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
begin
  if v_school is null or btrim(coalesce(p_query, '')) = '' then
    return;
  end if;

  return query
  select
    p.id, p.full_name, p.avatar_url, p.class_name,
    coalesce(
      case
        when f.status = 'accepted' then 'accepted'
        when f.status = 'pending' and f.requester_id = v_me then 'pending_sent'
        when f.status = 'pending' and f.addressee_id = v_me then 'pending_received'
      end,
      'none'
    )
  from public.profiles p
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(v_me, p.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
   and f.status <> 'declined'
  where p.school_id = v_school
    and p.id <> v_me
    and p.full_name ilike '%' || btrim(p_query) || '%'
  order by p.full_name
  limit 8;
end;
$$;

grant execute on function public.search_schoolmates(text) to authenticated;

-- ----------------------------------------------------------------------------
-- list_friends / list_friend_requests: pra sidebar de Amigos do /ranking.
-- ----------------------------------------------------------------------------
create or replace function public.list_friends()
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  level smallint,
  xp bigint,
  current_streak integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    p.id, p.full_name, p.avatar_url, p.class_name,
    coalesce(us.level, 1)::smallint, coalesce(us.xp, 0)::bigint, coalesce(us.current_streak, 0)
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = v_me then f.addressee_id else f.requester_id end
  left join public.user_stats us on us.user_id = p.id
  where f.status = 'accepted' and (f.requester_id = v_me or f.addressee_id = v_me)
  order by coalesce(us.xp, 0) desc;
end;
$$;

grant execute on function public.list_friends() to authenticated;

create or replace function public.list_friend_requests()
returns table (
  requester_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.requester_id, p.full_name, p.avatar_url, p.class_name, f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

grant execute on function public.list_friend_requests() to authenticated;

-- ----------------------------------------------------------------------------
-- student_profile_card ganha `friendshipStatus` — o modal de perfil do
-- ranking usa isso pra decidir entre "Adicionar amigo" / "Pedido enviado" /
-- "Aceitar e recusar" / "Amigos" / nada (perfil próprio). Redefinida por
-- inteiro (mesmo corpo de 20260910000200), só acrescentando o campo novo.
-- ----------------------------------------------------------------------------
create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
  v_friendship_status text;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, p.class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  if p_user_id = auth.uid() then
    v_friendship_status := 'self';
  else
    select
      coalesce(
        case
          when f.status = 'accepted' then 'accepted'
          when f.status = 'pending' and f.requester_id = auth.uid() then 'pending_sent'
          when f.status = 'pending' and f.addressee_id = auth.uid() then 'pending_received'
        end,
        'none'
      )
    into v_friendship_status
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id)
      and f.status <> 'declined';
    v_friendship_status := coalesce(v_friendship_status, 'none');
  end if;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'friendshipStatus', v_friendship_status,
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts a
        join public.resources r on r.id = a.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where a.user_id = p_user_id and a.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ach.id, 'name', ach.name, 'icon', ach.icon, 'rarity', ach.rarity, 'unlockedAt', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements ach on ach.id = ua.achievement_id
      where ua.user_id = p_user_id and ua.unlocked_at is not null
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.student_profile_card(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000200_bug_sweep.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (2) · Varredura de bugs — correções graves/médias
--
-- Três problemas achados numa varredura pedida pelo usuário, cada um raiz em
-- código já existente:
--
--  1. `complete_lesson` recebia `p_flawless` do CLIENTE, e o único lugar que
--     chamava a função sempre mandava `false` — o estado 'mastered' nunca
--     era alcançável por ninguém, pra sempre. Passa a calcular "sem erro" a
--     partir da última tentativa real de quiz/simulado da lição.
--
--  2. As policies de escrita do bucket `nexa-content` (`storage.objects`)
--     autorizavam qualquer `school_admin` a sobrescrever ou apagar o arquivo
--     de QUALQUER escola — só checavam o papel, nunca a escola, diferente de
--     toda outra policy de "gerenciar conteúdo" deste schema (que sempre usa
--     `can_manage_school`). A leitura pública do bucket continua como está —
--     essa é uma decisão deliberada e documentada em
--     20260904000400_content_storage.sql (URL assinada expira no meio da
--     reprodução), não um bug.
--
--  3. `notify_subject_students` avisava TODO aluno com aquela matéria, em
--     QUALQUER escola — quando um school_admin publica conteúdo restrito à
--     própria escola, alunos de outras escolas recebiam a notificação e
--     caíam num link morto (RLS de `resources` corretamente barra a leitura,
--     mas a notificação já foi mandada).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1 · complete_lesson: "sem erro" calculado no servidor, não recebido do cliente
-- ----------------------------------------------------------------------------
create or replace function public.complete_lesson(p_lesson_id uuid, p_flawless boolean default false)
returns table (state text, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak integer;
  v_state text;
  v_xp integer := 0;
  v_reward integer;
  v_quiz_resource_id uuid;
  v_flawless boolean;
begin
  if not exists (
    select 1 from public.v_track_lessons_resolved v where v.lesson_id = p_lesson_id and not v.is_locked
  ) then
    raise exception 'lição bloqueada ou inexistente' using errcode = '42501';
  end if;

  select coalesce(lp.correct_streak, 0) into v_streak
  from public.lesson_progress lp where lp.lesson_id = p_lesson_id and lp.user_id = auth.uid();

  -- `p_flawless` fica na assinatura só por compatibilidade — é ignorado de
  -- propósito. "Sem erro" vem da ÚLTIMA tentativa terminada do quiz/simulado
  -- da lição (se ela tiver um). Sem isso: 1) o único call site em TypeScript
  -- sempre mandava `false`, e 'mastered' nunca era alcançável; 2) qualquer
  -- chamada futura podia mandar `true` sem o aluno nunca ter acertado nada.
  select r.id into v_quiz_resource_id
  from public.track_lesson_resources tlr
  join public.resources r on r.id = tlr.resource_id
  where tlr.lesson_id = p_lesson_id and r.kind in ('quiz', 'simulado')
  order by tlr.position
  limit 1;

  if v_quiz_resource_id is not null then
    select (qa.total_count > 0 and qa.correct_count = qa.total_count)
    into v_flawless
    from public.quiz_attempts qa
    where qa.user_id = auth.uid()
      and qa.resource_id = v_quiz_resource_id
      and qa.finished_at is not null
    order by qa.finished_at desc
    limit 1;
  end if;
  v_flawless := coalesce(v_flawless, false);

  v_streak := case when v_flawless then coalesce(v_streak, 0) + 1 else 0 end;
  v_state := case when v_streak >= 3 then 'mastered' else 'done' end;

  insert into public.lesson_progress as lp (user_id, lesson_id, state, correct_streak, started_at, completed_at)
  values (auth.uid(), p_lesson_id, v_state, v_streak, now(), now())
  on conflict (user_id, lesson_id) do update set
    -- Uma lição já 'mastered' não regride pra 'done' só por ter sido marcada
    -- de novo com um resultado pior depois — o selo, uma vez conquistado,
    -- fica. O streak (`correct_streak`) continua reagindo normalmente. (A
    -- referência precisa ser pelo ALIAS — `public.lesson_progress.state`
    -- qualificado pelo schema não conta como "a linha antes do update" pro
    -- Postgres dentro de um ON CONFLICT DO UPDATE, só o nome/alias puro.)
    state = case
      when lp.state = 'mastered' and v_state <> 'mastered' then lp.state
      else v_state
    end,
    correct_streak = v_streak,
    started_at = coalesce(lp.started_at, now()),
    completed_at = coalesce(lp.completed_at, now())
  -- `v_state` sozinho é só o que ESTA chamada calculou antes da trava de
  -- não-regressão — sem reler o que realmente foi gravado, a função podia
  -- devolver 'done' pro chamador (e a tela mostrar isso) enquanto a linha no
  -- banco continuava 'mastered'.
  returning lp.state into v_state;

  select l.xp_reward into v_reward from public.track_lessons l where l.id = p_lesson_id;
  v_xp := public.award_xp(coalesce(v_reward, 0), 'Lição concluída', 'lesson', p_lesson_id);
  perform public.touch_streak();

  return query select v_state, v_xp;
end;
$$;

grant execute on function public.complete_lesson(uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- 2 · storage.objects (nexa-content): escrita só na própria escola
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket policy fix';
    return;
  end if;

  execute $ddl$
    -- `resources.storage_path` é o único elo entre um objeto do bucket e a
    -- escola dona do conteúdo — o caminho em si (`<ano>/<uuid>.<ext>`) não
    -- carrega escola nenhuma. Path que ainda não pertence a nenhum recurso
    -- (upload novo, formulário ainda não salvo) é liberado pra qualquer
    -- admin/school_admin — não tem como pertencer a uma escola que ainda
    -- não existe pra ele, e é o próprio fluxo de "enviar antes de salvar" do
    -- MediaUpload.
    create or replace function public.can_write_content_object(p_object_name text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $inner$
      select
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin', 'school_admin')
        )
        and (
          not exists (select 1 from public.resources r where r.storage_path = p_object_name)
          or exists (
            select 1 from public.resources r
            where r.storage_path = p_object_name and public.can_manage_school(r.school_id)
          )
        );
    $inner$;

    drop policy if exists nexa_content_write_admin on storage.objects;
    create policy nexa_content_write_admin on storage.objects
      for insert to authenticated
      with check (bucket_id = 'nexa-content' and public.can_write_content_object(name));

    drop policy if exists nexa_content_update_admin on storage.objects;
    create policy nexa_content_update_admin on storage.objects
      for update to authenticated
      using (bucket_id = 'nexa-content' and public.can_write_content_object(name));

    drop policy if exists nexa_content_delete_admin on storage.objects;
    create policy nexa_content_delete_admin on storage.objects
      for delete to authenticated
      using (bucket_id = 'nexa-content' and public.can_write_content_object(name));
  $ddl$;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3 · notify_subject_students: escopado pela escola do conteúdo publicado
-- ----------------------------------------------------------------------------
drop function if exists public.notify_subject_students(uuid, text, text, text);
-- Reaplicação por cima de um banco que já rodou 0912 (4) (a versão que devolve
-- `setof uuid` para o envio de push) — sem este guard, o `create or replace`
-- abaixo falha com "cannot change return type of existing function". Só
-- importa para o replay local de idempotência: numa migração de verdade, esta
-- versão roda ANTES da de 0912 (4), então o dropfunction nunca encontra nada.
drop function if exists public.notify_subject_students(uuid, text, text, text, uuid);

create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null,
  p_school_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'school_admin')
  ) then
    raise exception 'not authorized';
  end if;

  -- `p_school_id null` é conteúdo GLOBAL (mesma convenção de `resources`) —
  -- continua avisando todo mundo com a matéria. Conteúdo de uma escola
  -- específica só avisa quem É daquela escola; antes disso, publicar
  -- conteúdo restrito a UMA escola avisava a matéria inteira em TODAS,
  -- levando aluno de fora pra um link que a RLS de `resources` barra.
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and (p_school_id is null or p.school_id = p_school_id);
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000300_metas_local_month.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (3) · Metas: início do mês pelo fuso do aluno, não do servidor
--
-- `getMetasOverview` calculava o início do mês com `Date.UTC(...)` sobre o
-- relógio do SERVIDOR — todo outro corte de data do app (Hoje, Agenda,
-- sequência) usa `user_local_date()`, que resolve pelo fuso salvo em
-- `profiles.timezone`. Num fuso UTC-3, das 21h às 23h59 locais já é o dia
-- seguinte em UTC — perto da virada do mês, isso classifica errado (às vezes
-- o mês inteiro errado) as horas/atividades/matérias do card de Metas.
--
-- `user_month_start()` é o mesmo princípio de `user_local_date()`: primeiro
-- dia do MÊS local do aluno, convertido pra timestamptz correto em UTC —
-- pra comparar contra colunas timestamptz (`finished_at`, `completed_at`)
-- sem o desvio de fuso. Pra `study_sessions.local_date` (já é `date`, sem
-- fuso embutido), o próprio `user_local_date()` trunca pro mês sem precisar
-- desta função.
-- ============================================================================

create or replace function public.user_month_start(p_user_id uuid default auth.uid())
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select date_trunc('month', public.user_local_date(p_user_id)::timestamp) at time zone coalesce(
    (select p.timezone from public.profiles p where p.id = p_user_id),
    'America/Sao_Paulo'
  );
$$;

grant execute on function public.user_month_start(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000400_simulado_time_limit.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (4) · Tempo limite do simulado, hoje só decorativo
--
-- `quiz-runner.tsx` mostra o cronômetro regressivo (fica vermelho abaixo de
-- 60s) mas nada — nem cliente, nem servidor — parava de aceitar resposta
-- depois de zerar. Um simulado com limite de 20 minutos podia ser respondido
-- por tempo indeterminado sem nenhuma consequência.
--
-- A resposta não é travar a NAVEGAÇÃO do aluno (o componente já tem uma regra
-- deliberada de nunca bloquear o avanço numa falha de rede — ver comentário
-- em `submitAnswer`, `quiz-runner.tsx`) — é fazer a resposta enviada depois
-- do prazo simplesmente não contar pra nota, do mesmo jeito que já acontece
-- hoje quando a chamada falha por qualquer outro motivo (rede, RLS...): o
-- aluno consegue clicar, mas a resposta não é gravada. Uma folga de 15s
-- absorve latência de rede normal sem abrir brecha de verdade.
-- ============================================================================

create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_option_id uuid
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_option uuid;
  v_is_correct boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.quiz_attempts a
    join public.resources r on r.id = a.resource_id
    where a.id = p_attempt_id
      and coalesce(r.time_limit_seconds, 0) > 0
      and now() > a.started_at + make_interval(secs => r.time_limit_seconds) + interval '15 seconds'
  ) then
    raise exception 'tempo esgotado' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  select o.id into v_correct_option
  from public.question_options o where o.question_id = p_question_id and o.is_correct;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  -- Trocar de alternativa antes de encerrar é permitido; a última vale.
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct)
  values (p_attempt_id, p_question_id, p_option_id, v_is_correct)
  on conflict (attempt_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        answered_at = now();

  return query
    select v_is_correct, v_correct_option, q.explanation
    from public.questions q where q.id = p_question_id;
end;
$$;

grant execute on function public.answer_quiz_question(uuid, uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000500_onboarding_atomic_claim.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (5) · bootstrap_student: reivindicar o onboarding atomicamente
--
-- A trava de "já foi" era um SELECT separado do INSERT que vem depois —
-- clássica corrida de leitura-antes-de-escrever. Duas chamadas simultâneas
-- de `completeOnboarding` (duas abas, um retry de rede antes do botão
-- desabilitar) passavam as duas pelo SELECT antes de qualquer uma comitar, e
-- cada uma criava seu próprio ano letivo/matérias/rotinas e pagava 50 XP —
-- o aluno ficava com tudo em dobro. O cliente já trata `23505` como sucesso
-- (idempotência aparente), o que escondia o problema por completo.
--
-- A troca é um UPDATE com `where onboarded_at is null` ANTES de criar
-- qualquer coisa: só uma chamada concorrente pode "ganhar" a corrida — a
-- outra, ao tentar depois que a primeira comitou, encontra `onboarded_at`
-- já preenchido e 0 linhas afetadas.
--
-- Corpo baseado na versão ATUAL de `bootstrap_student` (12 argumentos, sem
-- categorias de nota — `20260907000300_remove_manual_grading.sql`), não na
-- versão anterior de 13 argumentos: `create or replace` só substitui uma
-- função com a MESMA assinatura, e recriar a assinatura errada deixaria as
-- duas coexistindo (foi exatamente o que aconteceu num rascunho anterior
-- desta migração, pego pelo teste `10_scoring.test.sql` — "function ... is
-- not unique").
-- ============================================================================

create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_class_name text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_daily_goal_minutes integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  -- Reivindica o onboarding de forma atômica, antes de criar qualquer coisa.
  update public.profiles set onboarded_at = now()
  where id = v_user_id and onboarded_at is null;

  if not found then
    if exists (select 1 from public.profiles where id = v_user_id) then
      raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
    end if;
    -- Perfil ainda não existe (não deveria — o trigger de signup já cria a
    -- linha — mas cobre o caso): o insert abaixo cria a linha já onboarded.
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  -- Sensible calendar defaults so onboarding can ask nothing about dates.
  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, class_name, school_id, timezone, daily_study_goal_minutes, onboarded_at
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_class_name, p_school_id,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 45), now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        class_name = coalesce(excluded.class_name, p.class_name),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = coalesce(p.onboarded_at, now());

  -- 2. Academic year --------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms, split evenly across the year — ainda usados pela grade de
  -- aulas (timetable_slots.term_id), não mais por nota. Fixo, sem perguntar.
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Subjects, from catalog picks and free-typed names ---------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 5. Checklist inicial, pra "Hoje" nunca começar vazio ---------------------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 6. Stats row (via definer helper — user_stats is client-read-only) ------
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260911000600_professor.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0911 (6) · Papel de professor (teacher_admin)
--
-- Pedido do usuário: um professor vinculado a matéria+turma que vê
-- desempenho/notas dos próprios alunos, manda avisos e cria/edita conteúdo
-- da própria matéria — com área própria no app, não o painel admin.
--
-- Não existe entidade "turma" no schema (profiles.class_name é texto livre,
-- sem FK) — o vínculo professor→matéria+turma precisa de uma tabela nova,
-- já que nada hoje liga um professor a um recorte de alunos. `teacher_
-- assignments` é esse vínculo: um professor pode ter várias linhas (uma por
-- matéria+turma que leciona).
--
-- Autorização segue o MESMO padrão já usado em todo o schema — nunca
-- reescrevo `can_manage_school` (usada por gestão de escola, matérias,
-- contextos sem noção de matéria); em vez disso, cada policy/RPC que hoje
-- só aceita admin/school_admin ganha um branch adicional `or is_teacher_of*`.
-- ============================================================================

-- ------------------------------------------------------------------ papel --
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'school_admin', 'admin', 'teacher_admin'));

comment on column public.profiles.role is
  'student = aluno; school_admin = gerencia o conteúdo da própria escola; '
  'admin = gerencia tudo; teacher_admin = professor, vinculado a matéria+turma via teacher_assignments.';

-- ------------------------------------------------------- vínculo professor --
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  class_name text not null check (length(btrim(class_name)) between 1 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (teacher_id, school_id, subject_catalog_id, class_name)
);

create index if not exists teacher_assignments_teacher_idx on public.teacher_assignments (teacher_id);

-- `class_name` foi substituída por `class_id` (FK) em 20260912000100 — num
-- reaplicar do zero, esta linha roda ANTES daquela migração, mas já sobre
-- um banco onde a coluna já não existe mais (idempotência do
-- setup-completo.sql). O índice em si é recriado lá, sobre `class_id`.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_assignments' and column_name = 'class_name'
  ) then
    execute 'create index if not exists teacher_assignments_scope_idx
      on public.teacher_assignments (school_id, subject_catalog_id, class_name)';
  end if;
end;
$$;

alter table public.teacher_assignments enable row level security;

-- O próprio professor precisa ler as próprias atribuições (pra montar a
-- navegação e escopar as próprias consultas); admin/school_admin da escola
-- gerenciam quem leciona o quê.
drop policy if exists teacher_assignments_select on public.teacher_assignments;
create policy teacher_assignments_select on public.teacher_assignments
  for select to authenticated
  using (teacher_id = auth.uid() or public.can_manage_school(school_id) or public.is_admin());

drop policy if exists teacher_assignments_manage on public.teacher_assignments;
create policy teacher_assignments_manage on public.teacher_assignments
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- --------------------------------------------------------- autorização -----
-- Professor pode gerenciar CONTEÚDO desta escola+matéria (turma não importa
-- aqui — conteúdo de uma matéria vale pra qualquer turma que a tenha).
create or replace function public.is_teacher_of(
  p_school_id uuid,
  p_subject_catalog_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments ta
    join public.profiles p on p.id = ta.teacher_id
    where ta.teacher_id = p_user_id
      and p.role = 'teacher_admin'
      and ta.school_id = p_school_id
      and ta.subject_catalog_id = p_subject_catalog_id
  );
$$;

-- Professor pode ver o DESEMPENHO de um aluno específico: existe uma
-- atribuição do professor cuja escola+turma batem com a escola+turma atuais
-- do aluno alvo. (A matéria não restringe aqui, de propósito — ver Fase D
-- do plano: relatório do aluno mostrado por inteiro, não filtrado por
-- matéria, pra reaproveitar o mesmo relatório do admin sem lógica nova.)
-- `class_name` foi substituída por `class_id` (FK) em 20260912000100 — a
-- versão de baixo (comparando por nome de turma) só existe pra funcionar
-- entre esta migração e aquela, numa instalação do zero. Numa reaplicação
-- (`class_name` já não existe mais), a linguagem `sql` desta função
-- validaria as colunas NA HORA de criar — por isso o guarda: sem ele, a
-- própria reaplicação do setup quebraria antes de chegar na versão nova.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_assignments' and column_name = 'class_name'
  ) then
    execute $ddl$
      create or replace function public.is_teacher_of_student(
        p_target_user_id uuid,
        p_user_id uuid default auth.uid()
      )
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $inner$
        select exists (
          select 1 from public.teacher_assignments ta
          join public.profiles p on p.id = ta.teacher_id
          join public.profiles target on target.id = p_target_user_id
          where ta.teacher_id = p_user_id
            and p.role = 'teacher_admin'
            and ta.school_id = target.school_id
            and ta.class_name = target.class_name
        );
      $inner$;
    $ddl$;
  end if;
end;
$$;

-- ---------------------------------------------- leitura: RPCs admin_* ------
-- As seis únicas portas de leitura de desempenho de outro usuário ganham o
-- branch de professor, sem duplicar RPC nem mudar o shape de retorno.
create or replace function public.admin_subject_scores(p_target_user_id uuid)
returns table (
  subject_id uuid, subject_name text, subject_color text, has_content boolean,
  assessment_score numeric, empenho_index numeric, blended_score numeric,
  quizzes_done integer, simulados_done integer, content_completed integer,
  target_grade numeric, passing_grade numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.subject_scores(p_target_user_id);
end;
$$;

create or replace function public.admin_performance_evolution(
  p_target_user_id uuid,
  p_weeks integer default 12
)
returns table (
  week_start date, assessment_score numeric, empenho_index numeric, blended_score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.performance_evolution(p_target_user_id, p_weeks);
end;
$$;

create or replace function public.admin_simulado_history(p_target_user_id uuid)
returns table (
  attempt_id uuid, resource_id uuid, resource_title text, subject_id uuid,
  subject_name text, subject_color text, correct_count integer, total_count integer,
  percent numeric, duration_seconds integer, finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.simulado_history(p_target_user_id);
end;
$$;

create or replace function public.admin_study_sessions(p_target_user_id uuid)
returns table (local_date date, duration_seconds integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select ss.local_date, ss.duration_seconds
    from public.study_sessions ss
    where ss.user_id = p_target_user_id and ss.ended_at is not null
    order by ss.local_date;
end;
$$;

create or replace function public.admin_user_stats(p_target_user_id uuid)
returns table (
  xp integer, level smallint, current_streak integer, longest_streak integer,
  total_study_seconds bigint, last_active_local_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select us.xp, us.level, us.current_streak, us.longest_streak,
           us.total_study_seconds, us.last_active_local_date
    from public.user_stats us
    where us.user_id = p_target_user_id;
end;
$$;

-- `admin_school_summary` fica de fora: é um agregado da ESCOLA inteira
-- (p_school_id, sem p_target_user_id), usado só em /admin/relatorios — não
-- se encaixa no recorte matéria+turma do professor, que enxerga só o
-- próprio roster (Fase B, `getTeacherRoster`), não a escola toda.

-- --------------------------------------------- escrita: conteúdo de matéria --
-- Cada policy de gerenciamento de conteúdo ganha `or is_teacher_of(...)`,
-- resolvendo escola+matéria da própria linha (ou via join até `resources`/
-- `tracks`, seguindo exatamente o padrão que essas policies já usam para
-- `can_manage_school`).
drop policy if exists content_topics_manage on public.content_topics;
create policy content_topics_manage on public.content_topics
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists resource_chapters_manage on public.resource_chapters;
create policy resource_chapters_manage on public.resource_chapters
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

drop policy if exists questions_manage on public.questions;
create policy questions_manage on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

drop policy if exists question_options_manage on public.question_options;
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

drop policy if exists tracks_manage on public.tracks;
create policy tracks_manage on public.tracks
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists track_sections_manage on public.track_sections;
create policy track_sections_manage on public.track_sections
  for all to authenticated
  using (exists (
    select 1 from public.tracks t
    where t.id = track_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.tracks t
    where t.id = track_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

drop policy if exists track_lessons_manage on public.track_lessons;
create policy track_lessons_manage on public.track_lessons
  for all to authenticated
  using (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

drop policy if exists track_lesson_resources_manage on public.track_lesson_resources;
create policy track_lesson_resources_manage on public.track_lesson_resources
  for all to authenticated
  using (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

-- ------------------------------------------------- leitura de perfis ------
-- `getPersonById`/`getAdminStudentReport` (reaproveitados pelo professor,
-- Fase B/D do plano) leem `profiles` diretamente ANTES de chegar nas RPCs
-- `admin_*` — sem este branch aqui, a policy `profiles_select_admin`
-- (0909 (3)) devolveria zero linhas pra um professor mesmo autorizado, e o
-- relatório quebraria antes mesmo de rodar a checagem de dentro da RPC.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (
    public.is_admin()
    or public.can_manage_school(school_id)
    or public.is_teacher_of_student(id)
  );

-- --------------------------------------------------- storage: nexa-content --
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket policy fix';
    return;
  end if;

  execute $ddl$
    create or replace function public.can_write_content_object(p_object_name text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $inner$
      select
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin', 'school_admin', 'teacher_admin')
        )
        and (
          not exists (select 1 from public.resources r where r.storage_path = p_object_name)
          or exists (
            select 1 from public.resources r
            where r.storage_path = p_object_name
              and (
                public.can_manage_school(r.school_id)
                or public.is_teacher_of(r.school_id, r.subject_catalog_id)
              )
          )
        );
    $inner$;
  $ddl$;
end;
$$;

-- ------------------------------------------------------- avisos de turma ---
-- `notify_subject_students` (escola+matéria, sem turma) já existe; a
-- capacidade "avisar minha turma" do professor precisa de recorte por turma,
-- que aquela função nunca teve.
create or replace function public.notify_class(
  p_class_name text,
  p_subject_catalog_id uuid,
  p_school_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and p.school_id = p_school_id
    and p.class_name = p_class_name;
end;
$$;

grant execute on function public.is_teacher_of(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_teacher_of_student(uuid, uuid) to authenticated;
grant execute on function public.notify_class(text, uuid, uuid, text, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260912000100_turmas.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0912 (1) · Turma vira entidade de verdade (tabela `classes`)
--
-- Até aqui `class_name` era texto livre digitado pelo próprio aluno no
-- onboarding — e três peças construídas nesta mesma sessão (`school_ranking`
-- turma, `is_teacher_of_student`, `notify_class`) dependem de IGUALDADE
-- EXATA de string pra funcionar. "9A" e "9°A" são turmas diferentes pro
-- sistema hoje, silenciosamente: o aluno some do ranking da própria turma,
-- ou nunca aparece pro professor que deveria enxergá-lo.
--
-- A partir de agora `classes` é cadastrada por admin geral/da escola —
-- mesmo padrão de `schools`/`subject_catalog` — e tanto `profiles` quanto
-- `teacher_assignments` passam a guardar `class_id` (FK), não mais texto.
-- Turma sai do onboarding (que também nunca perguntou escola — só liga
-- `school_id` quem cadastra pelo Perfil, depois) e vira uma escolha no
-- Perfil, logo após vincular a escola.
--
-- O backfill funde variações de maiúsculo/espaço da MESMA turma na MESMA
-- linha nova (compara por `lower(btrim(...))`) — sem isso, o próprio
-- backfill recriaria o problema que está sendo corrigido.
-- ============================================================================

-- ------------------------------------------------------------------ tabela --
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 40),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists classes_school_name_uq
  on public.classes (school_id, lower(btrim(name)));

alter table public.classes enable row level security;

-- Aluno/professor da escola leem (pra popular seletor no Perfil e no
-- roster do professor); admin geral e admin da escola gerenciam.
drop policy if exists classes_select_visible on public.classes;
create policy classes_select_visible on public.classes
  for select to authenticated
  using (school_id = public.current_school_id() or public.can_manage_school(school_id));

drop policy if exists classes_manage on public.classes;
create policy classes_manage on public.classes
  for all to authenticated
  using (public.can_manage_school(school_id))
  with check (public.can_manage_school(school_id));

-- --------------------------------------------------------------- backfill --
-- Backfill + troca de coluna são, por natureza, uma operação de uma vez só
-- (leem `class_name` e depois APAGAM essa mesma coluna) — o guarda abaixo é
-- o que torna isso seguro reaplicar: numa reaplicação do setup inteiro
-- sobre um banco já migrado (`scripts/test-db.sh` faz isso de propósito,
-- pra provar que instalar por cima de uma versão antiga não quebra nada),
-- `profiles.class_name` já não existe mais na segunda passada, e o bloco
-- inteiro é pulado.
do $$
declare
  v_uq_name text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'class_name'
  ) then
    -- Uma turma nova por combinação distinta (escola, nome-normalizado) já
    -- existente em profiles OU em teacher_assignments — cobre também a
    -- turma que já tem professor atribuído mas zero aluno ainda.
    insert into public.classes (school_id, name)
    select distinct p.school_id, btrim(p.class_name)
    from public.profiles p
    where p.school_id is not null and btrim(coalesce(p.class_name, '')) <> ''
    on conflict (school_id, lower(btrim(name))) do nothing;

    insert into public.classes (school_id, name)
    select distinct ta.school_id, btrim(ta.class_name)
    from public.teacher_assignments ta
    where btrim(coalesce(ta.class_name, '')) <> ''
    on conflict (school_id, lower(btrim(name))) do nothing;

    alter table public.profiles add column class_id uuid references public.classes (id) on delete set null;

    update public.profiles p
    set class_id = c.id
    from public.classes c
    where p.school_id = c.school_id
      and p.class_name is not null
      and lower(btrim(p.class_name)) = lower(btrim(c.name));

    alter table public.profiles drop column class_name;

    alter table public.teacher_assignments add column class_id uuid references public.classes (id) on delete cascade;

    update public.teacher_assignments ta
    set class_id = c.id
    from public.classes c
    where ta.school_id = c.school_id
      and lower(btrim(ta.class_name)) = lower(btrim(c.name));

    -- Toda linha de teacher_assignments tinha class_name not null (check
    -- constraint da migração anterior), então o backfill acima cobre
    -- 100% — seguro travar not null agora.
    alter table public.teacher_assignments alter column class_id set not null;

    -- A unique constraint original (teacher_id, school_id,
    -- subject_catalog_id, class_name) foi criada sem nome explícito — o
    -- Postgres escolheu o nome sozinho (e pode ter truncado, o nome
    -- ficaria longo demais pro limite de 63 bytes). Acha e derruba pelo
    -- nome REAL em vez de adivinhar.
    select conname into v_uq_name
    from pg_constraint
    where conrelid = 'public.teacher_assignments'::regclass and contype = 'u';
    if v_uq_name is not null then
      execute format('alter table public.teacher_assignments drop constraint %I', v_uq_name);
    end if;

    alter table public.teacher_assignments drop column class_name;
    alter table public.teacher_assignments
      add constraint teacher_assignments_scope_uq
      unique (teacher_id, school_id, subject_catalog_id, class_id);
  end if;
end;
$$;

create index if not exists profiles_class_idx on public.profiles (class_id) where class_id is not null;
create index if not exists teacher_assignments_scope_idx
  on public.teacher_assignments (school_id, subject_catalog_id, class_id);

-- ------------------------------------------------------ funções que filtram --
-- `school_ranking`: turma agora é `p_class_id` (posição diferente do
-- `p_class_name` antigo — `create or replace` não bastaria mesmo se a
-- posição fosse igual, já que o TIPO do 2º argumento muda de text pra uuid;
-- derruba a assinatura antiga primeiro pra não coexistirem duas versões).
drop function if exists public.school_ranking(text, text, text, uuid);

create or replace function public.school_ranking(
  p_scope text default 'escola',
  p_class_id uuid default null,
  p_period text default 'geral',
  p_school_id uuid default null
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  xp bigint,
  level smallint,
  current_streak integer,
  questions_answered integer,
  study_hours numeric,
  rank bigint,
  previous_rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_school_id uuid;
  v_period_start date;
  v_today date := public.user_local_date(auth.uid());
begin
  select p.role into v_caller_role from public.profiles p where p.id = auth.uid();

  if v_caller_role = 'admin' and p_school_id is not null then
    v_school_id := p_school_id;
  else
    v_school_id := public.current_school_id(auth.uid());
  end if;

  if v_school_id is null then
    return;
  end if;

  v_period_start := case p_period
    when 'hoje' then v_today
    when 'semana' then date_trunc('week', v_today)::date
    when 'mes' then date_trunc('month', v_today)::date
    else null
  end;

  return query
  with escopo as (
    select pr.id as user_id, pr.full_name, pr.avatar_url, c.name as class_name
    from public.profiles pr
    left join public.classes c on c.id = pr.class_id
    where pr.school_id = v_school_id
      and pr.role = 'student'
      and (p_scope <> 'turma' or pr.class_id = p_class_id)
  ),
  xp_no_periodo as (
    select e.user_id, sum(e.amount) as ganho
    from public.xp_events e
    where v_period_start is not null and e.local_date >= v_period_start
    group by e.user_id
  ),
  xp_total as (
    select us.user_id, us.xp, us.level, us.current_streak, us.total_study_seconds
    from public.user_stats us
    where us.user_id in (select escopo.user_id from escopo)
  ),
  atual as (
    select
      esc.user_id, esc.full_name, esc.avatar_url, esc.class_name,
      coalesce(case when v_period_start is null then xt.xp else xnp.ganho end, 0)::bigint as xp,
      coalesce(xt.level, 1) as level,
      coalesce(xt.current_streak, 0) as current_streak,
      coalesce(xt.total_study_seconds, 0) as total_study_seconds
    from escopo esc
    left join xp_total xt on xt.user_id = esc.user_id
    left join xp_no_periodo xnp on xnp.user_id = esc.user_id
  ),
  antes as (
    select a.user_id, greatest(0, coalesce(xt.xp, 0) - coalesce(xnp.ganho, 0)) as xp_antes
    from atual a
    left join xp_total xt on xt.user_id = a.user_id
    left join xp_no_periodo xnp on xnp.user_id = a.user_id
    where v_period_start is not null
  ),
  ranked_atual as (
    select a.*, rank() over (order by a.xp desc) as rk
    from atual a
  ),
  ranked_antes as (
    select an.user_id, rank() over (order by an.xp_antes desc) as rk
    from antes an
  ),
  contagens as (
    select
      qat.user_id,
      count(*) as questions_answered
    from public.quiz_answers qa
    join public.quiz_attempts qat on qat.id = qa.attempt_id
    where qat.user_id in (select escopo.user_id from escopo)
    group by qat.user_id
  )
  select
    r.user_id, r.full_name, r.avatar_url, r.class_name, r.xp, r.level::smallint,
    r.current_streak, coalesce(c.questions_answered, 0)::integer,
    round(r.total_study_seconds / 3600.0, 1),
    r.rk, ra.rk
  from ranked_atual r
  left join contagens c on c.user_id = r.user_id
  left join ranked_antes ra on ra.user_id = r.user_id
  order by r.rk;
end;
$$;

grant execute on function public.school_ranking(text, uuid, text, uuid) to authenticated;

-- `is_teacher_of_student`: compara class_id direto (FK contra FK).
create or replace function public.is_teacher_of_student(
  p_target_user_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments ta
    join public.profiles p on p.id = ta.teacher_id
    join public.profiles target on target.id = p_target_user_id
    where ta.teacher_id = p_user_id
      and p.role = 'teacher_admin'
      and ta.school_id = target.school_id
      and ta.class_id = target.class_id
  );
$$;

-- `notify_class`: turma agora é `p_class_id` (mesmo motivo acima — tipo do
-- 1º argumento muda de text pra uuid, derruba a assinatura antiga primeiro).
drop function if exists public.notify_class(text, uuid, uuid, text, text, text);
-- Idem ao guard equivalente em notify_subject_students (0911 (2)): sem isto,
-- reaplicar por cima de um banco já em 0912 (4) (retorno `setof uuid`) falha
-- com "cannot change return type of existing function". Só importa pro
-- replay local — na ordem real das migrações, 0912 (4) roda depois desta.
drop function if exists public.notify_class(uuid, uuid, uuid, text, text, text);

create or replace function public.notify_class(
  p_class_id uuid,
  p_subject_catalog_id uuid,
  p_school_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and p.school_id = p_school_id
    and p.class_id = p_class_id;
end;
$$;

grant execute on function public.notify_class(uuid, uuid, uuid, text, text, text) to authenticated;

-- `search_schoolmates`/`list_friends`/`list_friend_requests`/
-- `student_profile_card`: só EXIBEM a turma (nunca filtram por ela) — troca
-- de `p.class_name` pra `c.name` via join, sem mudar formato de retorno.
create or replace function public.search_schoolmates(p_query text)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  friendship_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
begin
  if v_school is null or btrim(coalesce(p_query, '')) = '' then
    return;
  end if;

  return query
  select
    p.id, p.full_name, p.avatar_url, c.name,
    coalesce(
      case
        when f.status = 'accepted' then 'accepted'
        when f.status = 'pending' and f.requester_id = v_me then 'pending_sent'
        when f.status = 'pending' and f.addressee_id = v_me then 'pending_received'
      end,
      'none'
    )
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(v_me, p.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
   and f.status <> 'declined'
  where p.school_id = v_school
    and p.id <> v_me
    and p.full_name ilike '%' || btrim(p_query) || '%'
  order by p.full_name
  limit 8;
end;
$$;

create or replace function public.list_friends()
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  level smallint,
  xp bigint,
  current_streak integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    p.id, p.full_name, p.avatar_url, c.name,
    coalesce(us.level, 1)::smallint, coalesce(us.xp, 0)::bigint, coalesce(us.current_streak, 0)
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = v_me then f.addressee_id else f.requester_id end
  left join public.classes c on c.id = p.class_id
  left join public.user_stats us on us.user_id = p.id
  where f.status = 'accepted' and (f.requester_id = v_me or f.addressee_id = v_me)
  order by coalesce(us.xp, 0) desc;
end;
$$;

create or replace function public.list_friend_requests()
returns table (
  requester_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.requester_id, p.full_name, p.avatar_url, c.name, f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  left join public.classes c on c.id = p.class_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
  v_friendship_status text;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, c.name as class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  if p_user_id = auth.uid() then
    v_friendship_status := 'self';
  else
    select
      coalesce(
        case
          when f.status = 'accepted' then 'accepted'
          when f.status = 'pending' and f.requester_id = auth.uid() then 'pending_sent'
          when f.status = 'pending' and f.addressee_id = auth.uid() then 'pending_received'
        end,
        'none'
      )
    into v_friendship_status
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id)
      and f.status <> 'declined';
    v_friendship_status := coalesce(v_friendship_status, 'none');
  end if;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'friendshipStatus', v_friendship_status,
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts qa
        join public.resources r on r.id = qa.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where qa.user_id = p_user_id and qa.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------- bootstrap_student --
-- Turma sai do onboarding — não é mais perguntada ali (a escola também não
-- era). `create or replace` só substitui uma função de MESMA assinatura:
-- como a contagem de parâmetros muda (perde `p_class_name`), a versão
-- antiga de 12 argumentos precisa ser derrubada primeiro, senão as duas
-- coexistem (o mesmo bug "function ... is not unique" já visto nesta sessão).
drop function if exists public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
);

create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_daily_goal_minutes integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  update public.profiles set onboarded_at = now()
  where id = v_user_id and onboarded_at is null;

  if not found then
    if exists (select 1 from public.profiles where id = v_user_id) then
      raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
    end if;
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, school_id, timezone, daily_study_goal_minutes, onboarded_at
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_school_id,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 45), now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = coalesce(p.onboarded_at, now());

  -- 2. Academic year --------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms ------------------------------------------------------------
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Subjects -----------------------------------------------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 5. Checklist inicial ---------------------------------------------------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 6. Stats row ------------------------------------------------------------
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260912000200_simulados_v2.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0912 (2) · Simulados v2 (provas estilo Anglo/ENEM)
--
-- O formato antigo de simulado é uma lista linear de questões de múltipla
-- escolha. Isso não representa uma prova real: falta texto-base
-- compartilhado entre questões, imagem/gráfico/tabela como dado
-- estruturado, seção por matéria dentro da mesma prova, e redação.
--
-- Onde cada coisa nova mora, e por quê:
--
--   * `resources.assets`/`sections`/`settings` (JSONB): conteúdo de
--     EXIBIÇÃO, polimórfico (texto/imagem/gráfico/tabela/infográfico/
--     diagrama são 6 formatos de payload diferentes) e nunca consultado
--     linha a linha — só lido inteiro e renderizado. Seis tabelas novas pra
--     isso seria estrutura sem propósito; JSONB mantém o JSON de
--     importação quase 1:1 com o que fica salvo.
--
--   * `questions.resource_refs`/`group_id`/`subject_catalog_id` (colunas
--     novas, sem tabela nova): a questão continua sendo uma linha só —
--     ganha só os campos que uma prova real precisa (a que recurso ela se
--     refere, a que grupo pertence, se é de outra matéria dentro da mesma
--     prova mista).
--
--   * `writing_tasks`/`essay_submissions` (tabelas novas de verdade):
--     redação tem dono, nota, correção — precisa de RLS por linha como
--     qualquer outro dado sensível do aluno.
--
-- Tudo aqui é aditivo: coluna nova com default inofensivo, tabela nova, ou
-- função estendida — nenhum simulado/quiz já publicado muda de
-- comportamento. O JSON legado `{"simulation": {"questions": [...]}}`
-- continua sendo aceito e importado exatamente como hoje (ver
-- `parseSimuladoCode`, que só troca de caminho quando `schemaVersion ===
-- "2.0"` explicitamente).
-- ============================================================================

-- --------------------------------------------------------------- resources --
alter table public.resources
  add column if not exists schema_version text not null default '1.0',
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists assets jsonb not null default '[]'::jsonb,
  add column if not exists sections jsonb not null default '[]'::jsonb,
  add column if not exists exam_mode text,
  add column if not exists exam_style text;

-- Postgres não tem `add constraint if not exists` — a checagem por nome via
-- `pg_constraint` é o jeito idempotente de fazer a mesma coisa.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_exam_mode_check') then
    alter table public.resources add constraint resources_exam_mode_check
      check (exam_mode is null or exam_mode in ('exam', 'practice'));
  end if;
end;
$$;

comment on column public.resources.exam_mode is
  'null = deriva de kind (quiz->practice, simulado->exam), exatamente o comportamento de hoje. Só um JSON v2 explícito sobrescreve.';
comment on column public.resources.assets is
  'Array de recursos reutilizáveis da prova (texto-base, imagem, gráfico, tabela, infográfico, diagrama), cada um com "id" único referenciado por questions.resource_refs e writing_tasks.resource_refs.';
comment on column public.resources.sections is
  'Array de {id, title, subject, type, questionIds, writingTaskIds} — reproduz a ordem/agrupamento por matéria de uma prova real. Vazio = lista única, como hoje.';

-- --------------------------------------------------------------- questions --
alter table public.questions
  add column if not exists group_id text,
  add column if not exists resource_refs text[] not null default '{}',
  add column if not exists subject_catalog_id uuid references public.subject_catalog (id) on delete set null,
  add column if not exists subtopic text,
  add column if not exists book smallint,
  add column if not exists module smallint,
  add column if not exists skills text[] not null default '{}',
  add column if not exists error_types text[] not null default '{}',
  add column if not exists estimated_time_seconds integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_estimated_time_check') then
    alter table public.questions add constraint questions_estimated_time_check
      check (estimated_time_seconds is null or estimated_time_seconds > 0);
  end if;
end;
$$;

comment on column public.questions.subject_catalog_id is
  'null = usa a matéria do resources pai. Só preenchida quando a questão pertence a outra matéria dentro da mesma prova mista (seções por matéria).';
comment on column public.questions.resource_refs is
  'IDs de resources.assets usados por esta questão (texto-base, imagem, gráfico...). String livre, sem FK — resolvido em memória contra o array de assets do recurso pai.';

create index if not exists questions_group_idx on public.questions (resource_id, group_id) where group_id is not null;
create index if not exists questions_subject_override_idx on public.questions (subject_catalog_id) where subject_catalog_id is not null;

-- ------------------------------------------------------------ quiz_answers --
alter table public.quiz_answers
  add column if not exists flagged boolean not null default false,
  add column if not exists time_spent_seconds integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quiz_answers_time_spent_check') then
    alter table public.quiz_answers add constraint quiz_answers_time_spent_check check (time_spent_seconds >= 0);
  end if;
end;
$$;

comment on column public.quiz_answers.flagged is
  '"Marcar para revisar" — independente de ter resposta escolhida ou não.';

-- ---------------------------------------------------- dificuldade "anglo" --
-- "anglo" é um NÍVEL de complexidade de raciocínio, não sinônimo de
-- "difícil" — pedido explícito do usuário. O nome da constraint original é
-- anônimo (gerado pelo Postgres na criação da tabela): achamos e derrubamos
-- pelo nome REAL em vez de adivinhar, mesma disciplina já usada nesta sessão
-- para não quebrar numa reaplicação.
do $$
declare
  v_name text;
begin
  select conname into v_name from pg_constraint
  where conrelid = 'public.resources'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%difficulty%';
  if v_name is not null then
    execute format('alter table public.resources drop constraint %I', v_name);
  end if;
end;
$$;

alter table public.resources
  add constraint resources_difficulty_check check (difficulty in ('facil', 'medio', 'anglo', 'dificil'));

do $$
declare
  v_name text;
begin
  select conname into v_name from pg_constraint
  where conrelid = 'public.questions'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%difficulty%';
  if v_name is not null then
    execute format('alter table public.questions drop constraint %I', v_name);
  end if;
end;
$$;

alter table public.questions
  add constraint questions_difficulty_check check (difficulty in ('facil', 'medio', 'anglo', 'dificil'));

-- ------------------------------------------------------------ writing_tasks --
create table if not exists public.writing_tasks (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 200),
  genre text,
  theme text,
  prompt text not null check (length(btrim(prompt)) >= 3),
  instructions text[] not null default '{}',
  resource_refs text[] not null default '{}',
  min_words integer check (min_words is null or min_words >= 0),
  max_words integer check (max_words is null or max_words >= 0),
  evaluation_criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writing_tasks_word_range check (min_words is null or max_words is null or max_words >= min_words)
);

create unique index if not exists writing_tasks_position_uq on public.writing_tasks (resource_id, position);

drop trigger if exists writing_tasks_set_updated_at on public.writing_tasks;
create trigger writing_tasks_set_updated_at before update on public.writing_tasks
  for each row execute function public.set_updated_at();

alter table public.writing_tasks enable row level security;

-- Sem "gabarito" a esconder (redação não tem resposta certa) — diferente de
-- `questions`, pode ter policy de SELECT normal em vez de função dedicada.
drop policy if exists writing_tasks_select_visible on public.writing_tasks;
create policy writing_tasks_select_visible on public.writing_tasks
  for select to authenticated
  using (public.can_view_resource(resource_id));

drop policy if exists writing_tasks_manage on public.writing_tasks;
create policy writing_tasks_manage on public.writing_tasks
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

-- --------------------------------------------------------- essay_submissions --
create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  writing_task_id uuid not null references public.writing_tasks (id) on delete cascade,
  content text not null default '',
  word_count integer not null default 0 check (word_count >= 0),
  is_submitted boolean not null default false,
  submitted_at timestamptz,
  scores jsonb,
  total_score numeric,
  corrected_by uuid references auth.users (id) on delete set null,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists essay_submissions_pair_uq on public.essay_submissions (attempt_id, writing_task_id);
create index if not exists essay_submissions_writing_task_idx on public.essay_submissions (writing_task_id);

drop trigger if exists essay_submissions_set_updated_at on public.essay_submissions;
create trigger essay_submissions_set_updated_at before update on public.essay_submissions
  for each row execute function public.set_updated_at();

alter table public.essay_submissions enable row level security;

-- Só SELECT tem policy, de propósito: nota de redação não pode depender de
-- RLS coluna-a-coluna (o Postgres não tem). Toda escrita passa pelas
-- funções SECURITY DEFINER abaixo (`save_essay_draft`, `submit_essay`,
-- `grade_essay`), rodando como dono da tabela — mesmo padrão de defesa já
-- usado em `answer_quiz_question` para o gabarito objetivo.
drop policy if exists essay_submissions_select on public.essay_submissions;
create policy essay_submissions_select on public.essay_submissions
  for select to authenticated
  using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
    or exists (
      select 1 from public.writing_tasks wt join public.resources r on r.id = wt.resource_id
      where wt.id = writing_task_id
        and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
    )
  );

-- ================================================================= RPCs ===

-- `start_quiz_attempt`: reaproveita uma tentativa aberta em vez de sempre
-- criar outra — corrige a tentativa órfã que nascia toda vez que a página
-- recarregava no meio de uma prova. Mesma assinatura/retorno de antes, não
-- precisa de drop.
create or replace function public.start_quiz_attempt(p_resource_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt uuid;
  v_total integer;
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'recurso indisponível' using errcode = '42501';
  end if;

  select id into v_attempt from public.quiz_attempts
  where user_id = auth.uid() and resource_id = p_resource_id and finished_at is null
  order by started_at desc
  limit 1;

  if v_attempt is not null then
    return v_attempt;
  end if;

  select count(*) into v_total from public.questions where resource_id = p_resource_id;

  -- Uma prova só de redação (sem questão objetiva nenhuma) é válida — só
  -- bloqueia quando não existe absolutamente nada para responder.
  if v_total = 0 and not exists (
    select 1 from public.writing_tasks where resource_id = p_resource_id
  ) then
    raise exception 'este simulado ainda não tem questões' using errcode = '23514';
  end if;

  insert into public.quiz_attempts (user_id, resource_id, total_count)
  values (auth.uid(), p_resource_id, v_total)
  returning id into v_attempt;

  return v_attempt;
end;
$$;

-- Restaura respostas e marcações já salvas — chamada uma vez ao entrar na
-- prova, é o que permite recarregar a página ou voltar sem perder nada.
create or replace function public.quiz_attempt_state(p_attempt_id uuid)
returns table (question_id uuid, option_id uuid, flagged boolean)
language sql
stable
security definer
set search_path = public
as $$
  select qa.question_id, qa.option_id, qa.flagged
  from public.quiz_answers qa
  join public.quiz_attempts a on a.id = qa.attempt_id
  where qa.attempt_id = p_attempt_id and a.user_id = auth.uid();
$$;

grant execute on function public.quiz_attempt_state(uuid) to authenticated;

-- `answer_quiz_question` ganha `p_time_spent_seconds` — muda a lista de
-- argumentos, então precisa de `drop` explícito antes: `create or replace`
-- não troca a versão de 3 argumentos, cria uma segunda função ambígua ao
-- lado dela (mesmo bug de overload já visto nesta sessão).
drop function if exists public.answer_quiz_question(uuid, uuid, uuid);

create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_time_spent_seconds integer default 0
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_option uuid;
  v_is_correct boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.quiz_attempts a
    join public.resources r on r.id = a.resource_id
    where a.id = p_attempt_id
      and coalesce(r.time_limit_seconds, 0) > 0
      and now() > a.started_at + make_interval(secs => r.time_limit_seconds) + interval '15 seconds'
  ) then
    raise exception 'tempo esgotado' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  select o.id into v_correct_option
  from public.question_options o where o.question_id = p_question_id and o.is_correct;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  -- `flagged` de propósito fora do `set`: responder nunca desmarca uma
  -- questão que o aluno já tinha sinalizado para revisar. O tempo se
  -- ACUMULA — o aluno pode voltar à questão mais de uma vez.
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct, time_spent_seconds)
  values (p_attempt_id, p_question_id, p_option_id, v_is_correct, greatest(0, coalesce(p_time_spent_seconds, 0)))
  on conflict (attempt_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        answered_at = now(),
        time_spent_seconds = public.quiz_answers.time_spent_seconds + greatest(0, coalesce(p_time_spent_seconds, 0));

  return query
    select v_is_correct, v_correct_option, q.explanation
    from public.questions q where q.id = p_question_id;
end;
$$;

grant execute on function public.answer_quiz_question(uuid, uuid, uuid, integer) to authenticated;

-- "Marcar para revisar" — upsert que alterna só `flagged`, sem tocar em
-- resposta nenhuma (a questão pode estar sem resposta e marcada).
create or replace function public.toggle_question_flag(p_attempt_id uuid, p_question_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flagged boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  insert into public.quiz_answers (attempt_id, question_id, flagged)
  values (p_attempt_id, p_question_id, true)
  on conflict (attempt_id, question_id) do update
    set flagged = not public.quiz_answers.flagged
  returning flagged into v_flagged;

  return v_flagged;
end;
$$;

grant execute on function public.toggle_question_flag(uuid, uuid) to authenticated;

-- `quiz_questions` ganha colunas de retorno novas (matéria efetiva, grupo,
-- recursos, subtema, habilidades) — muda a lista de colunas de
-- `returns table`, então também precisa de `drop` explícito primeiro
-- (Postgres não deixa `create or replace` mudar o tipo de retorno).
drop function if exists public.quiz_questions(uuid);

create or replace function public.quiz_questions(p_resource_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  difficulty text,
  points numeric,
  topic_name text,
  subject_name text,
  group_id text,
  resource_refs text[],
  subtopic text,
  skills text[],
  options jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.position,
    q.statement,
    q.difficulty,
    q.points,
    t.name,
    coalesce(qsc.name, rsc.name),
    q.group_id,
    q.resource_refs,
    q.subtopic,
    q.skills,
    -- Sem `is_correct`. A ordem é a de cadastro: embaralhar aqui faria a
    -- posição divergir entre a tela e a correção.
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'body', o.body)
              order by o.position)
       from public.question_options o where o.question_id = q.id),
      '[]'::jsonb
    )
  from public.questions q
  join public.resources r on r.id = q.resource_id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  where q.resource_id = p_resource_id
    and public.can_view_resource(p_resource_id)
  order by q.position;
$$;

comment on function public.quiz_questions is
  'Questões de um quiz/simulado SEM o gabarito. Única porta de leitura para o aluno.';

grant execute on function public.quiz_questions(uuid) to authenticated;

-- `quiz_attempt_review` ganha os metadados pedidos para análise posterior
-- (matéria, módulo, habilidades, tempo gasto, recursos usados) — mesmo
-- motivo do drop acima.
drop function if exists public.quiz_attempt_review(uuid);

create or replace function public.quiz_attempt_review(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  explanation text,
  topic_name text,
  subject_name text,
  subtopic text,
  book smallint,
  module smallint,
  skills text[],
  error_types text[],
  difficulty text,
  resource_refs text[],
  time_spent_seconds integer,
  chosen_option_id uuid,
  correct_option_id uuid,
  is_correct boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id, q.position, q.statement, q.explanation, t.name,
    coalesce(qsc.name, rsc.name),
    q.subtopic, q.book, q.module, q.skills, q.error_types, q.difficulty, q.resource_refs,
    coalesce(ans.time_spent_seconds, 0),
    ans.option_id,
    (select o.id from public.question_options o where o.question_id = q.id and o.is_correct),
    coalesce(ans.is_correct, false)
  from public.quiz_attempts a
  join public.questions q on q.resource_id = a.resource_id
  join public.resources r on r.id = a.resource_id
  left join public.quiz_answers ans on ans.attempt_id = a.id and ans.question_id = q.id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  where a.id = p_attempt_id
    and a.user_id = auth.uid()
    and a.finished_at is not null
  order by q.position;
$$;

grant execute on function public.quiz_attempt_review(uuid) to authenticated;

-- ------------------------------------------------------------ redação ------
-- Autosave: aceita reescrever o rascunho quantas vezes o aluno digitar; fica
-- mudo (não lança erro) se a redação já foi entregue — uma chamada de
-- autosave atrasada chegando depois do "Entregar" não pode reabrir o texto.
create or replace function public.save_essay_draft(
  p_attempt_id uuid,
  p_writing_task_id uuid,
  p_content text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_words integer;
  v_clean text := btrim(coalesce(p_content, ''));
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.writing_tasks wt join public.quiz_attempts a on a.resource_id = wt.resource_id
    where wt.id = p_writing_task_id and a.id = p_attempt_id
  ) then
    raise exception 'esta redação não pertence a esta tentativa' using errcode = '23514';
  end if;

  v_words := case when v_clean = '' then 0
    else coalesce(array_length(regexp_split_to_array(v_clean, '\s+'), 1), 0)
  end;

  insert into public.essay_submissions (attempt_id, writing_task_id, content, word_count)
  values (p_attempt_id, p_writing_task_id, coalesce(p_content, ''), v_words)
  on conflict (attempt_id, writing_task_id) do update
    set content = excluded.content, word_count = excluded.word_count, updated_at = now()
    where not public.essay_submissions.is_submitted;

  return v_words;
end;
$$;

grant execute on function public.save_essay_draft(uuid, uuid, text) to authenticated;

create or replace function public.submit_essay(p_attempt_id uuid, p_writing_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.quiz_attempts a where a.id = p_attempt_id and a.user_id = auth.uid()
  ) then
    raise exception 'tentativa inválida' using errcode = '42501';
  end if;

  update public.essay_submissions
  set is_submitted = true, submitted_at = coalesce(submitted_at, now())
  where attempt_id = p_attempt_id and writing_task_id = p_writing_task_id;

  if not found then
    insert into public.essay_submissions (attempt_id, writing_task_id, is_submitted, submitted_at)
    values (p_attempt_id, p_writing_task_id, true, now());
  end if;
end;
$$;

grant execute on function public.submit_essay(uuid, uuid) to authenticated;

-- Correção: só quem gerencia o conteúdo daquela matéria/escola (admin,
-- school_admin, ou o professor da matéria via `is_teacher_of`) pode gravar
-- nota — nunca o próprio aluno, que só tem SELECT na linha.
create or replace function public.grade_essay(
  p_essay_id uuid,
  p_scores jsonb,
  p_total_score numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.essay_submissions es
    join public.writing_tasks wt on wt.id = es.writing_task_id
    join public.resources r on r.id = wt.resource_id
    where es.id = p_essay_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  update public.essay_submissions
  set scores = p_scores, total_score = p_total_score, corrected_by = auth.uid(), corrected_at = now()
  where id = p_essay_id;
end;
$$;

grant execute on function public.grade_essay(uuid, jsonb, numeric) to authenticated;

-- Lista de redações entregues de um recurso, para a tela de correção.
-- SECURITY DEFINER pelo mesmo motivo dos `admin_*` já existentes: o
-- corretor não é dono da tentativa (`quiz_attempts`/`profiles` do aluno),
-- então um select comum com RLS não devolveria o nome de quem escreveu.
create or replace function public.list_essays_for_grading(p_resource_id uuid)
returns table (
  essay_id uuid,
  attempt_id uuid,
  writing_task_id uuid,
  writing_task_title text,
  student_name text,
  content text,
  word_count integer,
  submitted_at timestamptz,
  total_score numeric,
  scores jsonb,
  evaluation_criteria jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
    select
      es.id, es.attempt_id, wt.id, wt.title,
      p.full_name,
      es.content, es.word_count, es.submitted_at, es.total_score, es.scores,
      wt.evaluation_criteria
    from public.essay_submissions es
    join public.writing_tasks wt on wt.id = es.writing_task_id
    join public.quiz_attempts a on a.id = es.attempt_id
    join public.profiles p on p.id = a.user_id
    where wt.resource_id = p_resource_id and es.is_submitted
    order by es.submitted_at;
end;
$$;

grant execute on function public.list_essays_for_grading(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260912000300_skill_mastery.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0912 (3) · Domínio por habilidade e tipo de erro
--
-- `questions.skills`/`error_types` são gravados desde a v2 (0912 (2)) mas
-- nenhuma tela lia esses dados ainda. Mesmo critério de `topic_mastery()`
-- (0907 (2)): resposta MAIS RECENTE de cada questão, `security definer`
-- porque `questions`/`quiz_answers` não têm policy de SELECT direta para o
-- aluno (é onde mora o gabarito), com o mesmo cuidado de filtrar por
-- `auth.uid()` no corpo — a elevação de privilégio nunca vaza dado de outro
-- aluno.
-- ============================================================================

create or replace function public.skill_mastery(p_user_id uuid default auth.uid())
returns table (
  skill text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  ),
  per_skill as (
    select unnest(q.skills) as skill, la.is_correct
    from latest_answer la
    join public.questions q on q.id = la.question_id
    where array_length(q.skills, 1) > 0
  )
  select
    skill,
    count(*) filter (where is_correct),
    count(*),
    round(count(*) filter (where is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from per_skill
  group by skill;
$$;

comment on function public.skill_mastery is
  'Domínio por habilidade (questions.skills) a partir da resposta mais recente de cada questão — mesmo critério de topic_mastery(), só que agrupado por habilidade em vez de assunto.';

grant execute on function public.skill_mastery(uuid) to authenticated;

-- --------------------------------------------------------- tipos de erro
-- Só das respostas ERRADAS mais recentes — "seu erro mais comum é X" não
-- faz sentido contando questões que o aluno já acertou depois.
create or replace function public.common_error_types(p_user_id uuid default auth.uid())
returns table (
  error_type text,
  occurrences bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  ),
  wrong_error_types as (
    select unnest(q.error_types) as error_type
    from latest_answer la
    join public.questions q on q.id = la.question_id
    where la.is_correct = false and array_length(q.error_types, 1) > 0
  )
  select error_type, count(*)
  from wrong_error_types
  group by error_type
  order by count(*) desc;
$$;

comment on function public.common_error_types is
  'Tipos de erro (questions.error_types) mais frequentes entre as respostas erradas mais recentes do aluno.';

grant execute on function public.common_error_types(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260912000400_push_notifications.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0912 (4) · Push notifications reais
--
-- `push_subscriptions` existe desde 0908 (8) mas nada nunca leu essa tabela —
-- o sino in-app sempre funcionou, o "aviso mesmo com o app fechado" nunca foi
-- ligado. O envio de verdade mora no lado TypeScript (`src/lib/push/send.ts`,
-- via `web-push` + a service role key, que ignora RLS de propósito pra poder
-- ler a assinatura de QUALQUER destinatário — nunca do cliente, só de uma
-- Server Action que já decidiu quem avisar).
--
-- O que falta aqui: `notify_subject_students`/`notify_class` só INSERIAM em
-- `notifications` e devolviam `void` — quem chamou não ficava sabendo QUEM
-- foi notificado, e sem isso não dá pra mandar push pra ninguém (a lista de
-- destinatários morre dentro da função). As duas passam a devolver
-- `setof uuid` com os `user_id` efetivamente notificados — mesmo INSERT de
-- sempre, só que com `returning`, sem mudar quem recebe notificação nem a
-- regra de autorização de nenhuma das duas.
--
-- `notify_user` (amizade) não precisa mudar: quem chama já sabe o
-- destinatário de antemão (é um parâmetro), então o TS de
-- `respondFriendRequest` já tem o id pra mandar push sem precisar que o
-- banco devolva nada a mais.
-- ============================================================================

drop function if exists public.notify_subject_students(uuid, text, text, text, uuid);

create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null,
  p_school_id uuid default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'school_admin')
  ) then
    raise exception 'not authorized';
  end if;

  return query
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and (p_school_id is null or p.school_id = p_school_id)
  returning user_id;
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text, uuid) to authenticated;

drop function if exists public.notify_class(uuid, uuid, uuid, text, text, text);

create or replace function public.notify_class(
  p_class_id uuid,
  p_subject_catalog_id uuid,
  p_school_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and p.school_id = p_school_id
    and p.class_id = p_class_id
  returning user_id;
end;
$$;

grant execute on function public.notify_class(uuid, uuid, uuid, text, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260912000500_admin_nexaai.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0912 (5) · NexaAI exclusiva para admin/professor
--
-- Duas funções de leitura novas pra alimentar as "funções rápidas" da nova
-- tela `/admin/nexaai` · `/professor/nexaai` — nenhuma escreve nada, os
-- textos que a IA gera a partir delas nunca voltam sozinhos pro banco.
--
--   * `admin_topic_mastery`: mesmo padrão de `admin_subject_scores`/
--     `admin_user_stats` (0911 (6)) — devolve `topic_mastery()` de UM aluno
--     específico, autorizado pra admin, admin da escola dele, ou professor
--     que dá aula pra ele (`is_teacher_of_student`). Faltava esta — as
--     outras duas já existiam, esta nunca tinha sido pedida antes.
--
--   * `class_subject_mastery`: agregado que não existia — hoje só há
--     domínio por ALUNO (`topic_mastery`) ou por ESCOLA INTEIRA
--     (`admin_school_summary`, que o comentário da migração do professor já
--     deixa de fora do escopo dele de propósito). Aqui o corte é
--     escola+matéria(+turma opcional): pega a resposta mais recente de
--     cada PAR (questão, aluno) dentro do recorte, agrupa por assunto.
--     Autorização no mesmo nível de `notify_class` (escola+matéria, não
--     desce a turma específica) — consistente com o que já existe, não um
--     relaxamento novo.
-- ============================================================================

create or replace function public.admin_topic_mastery(p_target_user_id uuid)
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.topic_mastery(p_target_user_id);
end;
$$;

comment on function public.admin_topic_mastery is
  'topic_mastery() de UM aluno específico, para admin/professor — mesma autorização de admin_subject_scores/admin_user_stats.';

grant execute on function public.admin_topic_mastery(uuid) to authenticated;

create or replace function public.class_subject_mastery(
  p_school_id uuid,
  p_subject_catalog_id uuid,
  p_class_id uuid default null
)
returns table (
  topic_name text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  student_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  with roster as (
    select p.id as user_id
    from public.profiles p
    where p.school_id = p_school_id
      and p.role = 'student'
      and (p_class_id is null or p.class_id = p_class_id)
  ),
  latest_answer as (
    select distinct on (ans.question_id, a.user_id)
      ans.question_id,
      a.user_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    join roster r2 on r2.user_id = a.user_id
    where a.finished_at is not null
    order by ans.question_id, a.user_id, ans.answered_at desc
  ),
  scoped as (
    select la.user_id, la.is_correct, q.topic_id
    from latest_answer la
    join public.questions q on q.id = la.question_id
    join public.resources res on res.id = q.resource_id
    where coalesce(q.subject_catalog_id, res.subject_catalog_id) = p_subject_catalog_id
  )
  select
    coalesce(t.name, 'Geral'),
    count(*) filter (where scoped.is_correct),
    count(*),
    round(count(*) filter (where scoped.is_correct)::numeric / greatest(count(*), 1) * 100),
    count(distinct scoped.user_id)
  from scoped
  left join public.content_topics t on t.id = scoped.topic_id
  group by t.name
  order by round(count(*) filter (where scoped.is_correct)::numeric / greatest(count(*), 1) * 100) asc;
end;
$$;

comment on function public.class_subject_mastery is
  'Domínio por assunto agregado entre os alunos de uma escola+matéria(+turma opcional) — alimenta o "resumo de turma" da NexaAI de admin/professor.';

grant execute on function public.class_subject_mastery(uuid, uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000100_community_feature_flags.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 0 (1) · Feature flags
--
-- Primeira peça de infraestrutura do "Nexa Community" (feed social,
-- amizades/seguir, comunidades, grupos, chat, IA Creator, eventos —
-- especificação completa em NEXA_COMMUNITY_MASTER_IMPLEMENTATION_PLAN.md).
--
-- Cada fase da Community nasce DESLIGADA (`enabled = false`) e é ligada só
-- depois de implementada e verificada — não depende de deploy pra
-- desativar algo que deu problema em produção, só de um `update`. As 8
-- chaves são exatamente as que o plano pede (seção 23/56).
--
-- Leitura liberada a qualquer autenticado (o app precisa checar o flag no
-- client pra esconder nav/rota antes mesmo de bater no servidor); escrita
-- só `is_admin()` — mesmo corte de `is_admin()` já usado em toda a base
-- pra decisão global (nunca `school_admin`, que gerencia só a própria
-- escola, não o rollout do produto inteiro).
-- ============================================================================

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.feature_flags is
  'Chaves de rollout do Nexa Community — lidas pelo app pra esconder rota/nav/ação enquanto uma fase não está pronta.';

alter table public.feature_flags enable row level security;

drop policy if exists feature_flags_select_authenticated on public.feature_flags;
create policy feature_flags_select_authenticated
  on public.feature_flags for select
  to authenticated
  using (true);

drop policy if exists feature_flags_write_admin on public.feature_flags;
create policy feature_flags_write_admin
  on public.feature_flags for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.feature_flags (key, enabled, description) values
  ('community_enabled', false, 'Chave-mestra: liga a seção "Comunidade" na navegação.'),
  ('posts_enabled', false, 'Feed social — criar/ver post, curtir, comentar, salvar.'),
  ('groups_enabled', false, 'Grupos (dentro de comunidades ou avulsos).'),
  ('chat_enabled', false, 'Chat em grupos/comunidades.'),
  ('creator_enabled', false, 'IA Creator — aluno gera quiz/simulado/resumo com IA.'),
  ('events_enabled', false, 'Eventos escolares — criação, inscrição, agenda.'),
  ('certificates_enabled', false, 'Check-in por QR + certificados de evento.'),
  ('social_xp_enabled', false, 'XP/conquistas ganhos por atividade social.')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000200_social_profiles.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 0 (2) · Perfil social + seguir
--
-- `social_profiles` é uma EXTENSÃO 1:1 de `profiles` (mesmo `id`), não uma
-- segunda identidade de usuário — `profiles` continua sendo a fonte de
-- verdade de nome/avatar/escola/turma; aqui mora só o que é genuinamente
-- social e opcional (usuário público, bio, banner, visibilidade do
-- perfil). Ninguém tem uma linha aqui até salvar o perfil social pela
-- primeira vez — leitura sem linha equivale a "perfil social não
-- configurado ainda", tratado como default na camada de aplicação.
--
-- `follows` é o caso ASSIMÉTRICO que `friendships` (20260911000100) não
-- cobre — amizade precisa dos dois lados aceitarem, seguir não. As duas
-- tabelas coexistem de propósito: seguir alguém não implica amizade, e
-- aceitar amizade não implica seguir.
-- ============================================================================

create table if not exists public.social_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  username text,
  bio text check (bio is null or length(bio) <= 280),
  banner_url text,
  visibility text not null default 'school'
    check (visibility in ('private', 'friends', 'school', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.social_profiles is
  'Extensão social opcional de profiles (mesmo id) — username/bio/banner/visibilidade do Nexa Community.';
comment on column public.social_profiles.visibility is
  'Quem enxerga este perfil social: private (só o dono), friends, school (mesma escola) ou public.';

create unique index if not exists social_profiles_username_uq
  on public.social_profiles (lower(username)) where username is not null;

drop trigger if exists social_profiles_set_updated_at on public.social_profiles;
create trigger social_profiles_set_updated_at before update on public.social_profiles
  for each row execute function public.set_updated_at();

alter table public.social_profiles enable row level security;

-- `are_friends`: extraída aqui porque `social_profiles` (visibility =
-- 'friends') é o primeiro lugar que precisa checar amizade dentro de uma
-- policy de RLS — até agora só RPCs (`student_profile_card`) faziam essa
-- checagem, cada uma com a própria query inline. Fases futuras (feed,
-- comentário) vão reaproveitar esta função em vez de repetir a consulta.
create or replace function public.are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(p_a, p_b)
      and greatest(f.requester_id, f.addressee_id) = greatest(p_a, p_b)
  );
$$;

drop policy if exists social_profiles_select on public.social_profiles;
create policy social_profiles_select on public.social_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (visibility = 'public')
    or (visibility = 'school' and public.current_school_id(id) is not null
        and public.current_school_id(id) = public.current_school_id(auth.uid()))
    or (visibility = 'friends' and public.are_friends(auth.uid(), id))
  );

drop policy if exists social_profiles_insert_own on public.social_profiles;
create policy social_profiles_insert_own on public.social_profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists social_profiles_update_own on public.social_profiles;
create policy social_profiles_update_own on public.social_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------------ follows --
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

-- Sem policy de escrita direta (mesma decisão de `friendships`): as duas
-- pontas do relacionamento (contagem de seguidores no perfil de outra
-- pessoa) exigiriam ler uma linha que não é sua, então toda escrita passa
-- pelas RPCs abaixo. Leitura liberada pra qualquer autenticado — ao
-- contrário de amizade, "quem segue quem" não é um dado sensível (é
-- exibido publicamente em qualquer rede social), então não precisa da
-- mesma cautela de `friendships`.
drop policy if exists follows_select_authenticated on public.follows;
create policy follows_select_authenticated on public.follows
  for select to authenticated using (true);

create or replace function public.follow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'não dá pra seguir a si mesmo' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_target_id) then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;

  insert into public.follows (follower_id, following_id)
  values (auth.uid(), p_target_id)
  on conflict (follower_id, following_id) do nothing;
end;
$$;

grant execute on function public.follow_user(uuid) to authenticated;

create or replace function public.unfollow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where follower_id = auth.uid() and following_id = p_target_id;
end;
$$;

grant execute on function public.unfollow_user(uuid) to authenticated;

grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000300_feed.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 2 · Feed (posts, comentários, curtidas, salvos)
--
-- Mesmo padrão de `friendships`/`admin_subject_scores`/`student_profile_card`:
-- as tabelas ficam com RLS ativa e SEM policy nenhuma — todo acesso passa por
-- função `security definer`, que decide visibilidade (private/friends/school/
-- public) uma vez só, no SQL, em vez de duplicar a mesma regra numa policy de
-- RLS por tabela E de novo em cada RPC que precisa enriquecer com
-- nome/avatar de `profiles` (que também não tem policy pra "outra pessoa").
--
-- Escopo desta fase (deliberadamente enxuto — ver comentário no fim):
--   * posts: texto (1-2000 chars) + `media` (jsonb, reservado pra Fase
--     seguinte de upload de imagem — vazio por enquanto).
--   * comments: só um nível (sem resposta a comentário ainda).
--   * post_likes / post_saves: curtir e salvar.
--   * Compartilhar/repostar fica pra depois — não tem tabela nem RPC aqui.
-- ============================================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  content text not null check (length(btrim(content)) between 1 and 2000),
  media jsonb not null default '[]'::jsonb,
  visibility text not null default 'school'
    check (visibility in ('private', 'friends', 'school', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_created_idx on public.posts (created_at desc);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;
-- (Sem policies — acesso só pelas funções abaixo, mesmo padrão de `friendships`.)

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create table if not exists public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_saves enable row level security;

-- ----------------------------------------------------------------------------
-- can_view_post: única fonte da regra de visibilidade — usada por toda RPC
-- abaixo que precisa checar "esta pessoa pode ver este post".
-- ----------------------------------------------------------------------------
create or replace function public.can_view_post(p_post_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = p_user_id
        or public.is_admin(p_user_id)
        or p.visibility = 'public'
        or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
            and public.current_school_id(p.author_id) = public.current_school_id(p_user_id))
        or (p.visibility = 'friends' and public.are_friends(p_user_id, p.author_id))
      )
  );
$$;

grant execute on function public.can_view_post(uuid, uuid) to authenticated;

create or replace function public.create_post(p_content text, p_visibility text default 'school')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  insert into public.posts (author_id, school_id, content, visibility)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text) to authenticated;

create or replace function public.update_post(p_post_id uuid, p_content text, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  update public.posts
  set content = btrim(p_content), visibility = p_visibility
  where id = p_post_id and author_id = auth.uid();

  if not found then
    raise exception 'post não encontrado ou sem permissão' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.update_post(uuid, text, text) to authenticated;

-- Autor apaga o próprio post; school_admin/admin também podem (moderação
-- básica de escola — mesmo corte de `can_manage_school`, sem sistema de
-- denúncia ainda, que fica pra uma fase própria de moderação).
create or replace function public.delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts;
begin
  select * into v_post from public.posts where id = p_post_id;
  if not found then
    return;
  end if;

  if not (
    v_post.author_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_post.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.posts where id = p_post_id;
end;
$$;

grant execute on function public.delete_post(uuid) to authenticated;

create or replace function public.like_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;
  insert into public.post_likes (post_id, user_id) values (p_post_id, auth.uid())
  on conflict (post_id, user_id) do nothing;
end;
$$;

grant execute on function public.like_post(uuid) to authenticated;

create or replace function public.unlike_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_likes where post_id = p_post_id and user_id = auth.uid();
end;
$$;

grant execute on function public.unlike_post(uuid) to authenticated;

create or replace function public.save_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;
  insert into public.post_saves (post_id, user_id) values (p_post_id, auth.uid())
  on conflict (post_id, user_id) do nothing;
end;
$$;

grant execute on function public.save_post(uuid) to authenticated;

create or replace function public.unsave_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_saves where post_id = p_post_id and user_id = auth.uid();
end;
$$;

grant execute on function public.unsave_post(uuid) to authenticated;

create or replace function public.create_comment(p_post_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  insert into public.comments (post_id, author_id, content)
  values (p_post_id, auth.uid(), btrim(p_content))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_comment(uuid, text) to authenticated;

-- Autor do comentário, autor do post (modera o próprio post), school_admin/admin.
create or replace function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment public.comments;
  v_post public.posts;
begin
  select * into v_comment from public.comments where id = p_comment_id;
  if not found then
    return;
  end if;
  select * into v_post from public.posts where id = v_comment.post_id;

  if not (
    v_comment.author_id = auth.uid()
    or v_post.author_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_post.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.comments where id = p_comment_id;
end;
$$;

grant execute on function public.delete_comment(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- list_feed: página do feed, já com nome/avatar do autor, contagens e o que o
-- próprio usuário curtiu/salvou — nenhuma outra query precisa tocar em
-- `posts`/`profiles` diretamente (não teria como: nenhuma das duas libera
-- select direto pra "outra pessoa").
-- ----------------------------------------------------------------------------
-- `drop` antes do `create or replace`: fases futuras (Fase 6, biblioteca
-- comunitária) mudam as colunas de retorno desta função — sem o drop aqui,
-- reaplicar esta migração do zero sobre um banco que já passou pela versão
-- nova quebraria com "cannot change return type of existing function".
drop function if exists public.list_feed(integer, timestamptz);
drop function if exists public.list_saved_posts(integer, timestamptz);

create or replace function public.list_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where (p_before is null or p.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

grant execute on function public.list_feed(integer, timestamptz) to authenticated;

-- Mesmo formato de `list_feed`, filtrado aos posts que o próprio usuário salvou.
create or replace function public.list_saved_posts(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    true,
    p.author_id = v_me
  from public.post_saves ps
  join public.posts p on p.id = ps.post_id
  join public.profiles pr on pr.id = p.author_id
  where ps.user_id = v_me
    and (p_before is null or ps.created_at < p_before)
    -- Um save antigo de um post que mudou pra 'private'/'friends' depois não
    -- deve vazar — reaplica a mesma checagem de visibilidade de `list_feed`.
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by ps.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

grant execute on function public.list_saved_posts(integer, timestamptz) to authenticated;

create or replace function public.list_post_comments(p_post_id uuid)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  created_at timestamptz,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  return query
  select c.id, c.author_id, pr.full_name, pr.avatar_url, c.content, c.created_at, c.author_id = auth.uid()
  from public.comments c
  join public.profiles pr on pr.id = c.author_id
  where c.post_id = p_post_id
  order by c.created_at asc;
end;
$$;

grant execute on function public.list_post_comments(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Liga o feed depois de implementado e verificado (tsc/eslint/vitest/build +
-- suíte SQL local) — mesmo princípio da Fase 0: nada fica visível até a
-- fase estar pronta de verdade.
-- ----------------------------------------------------------------------------
update public.feature_flags set enabled = true where key in ('community_enabled', 'posts_enabled');

-- ============================================================================
-- Cortes deliberados desta fase (documentados aqui, não escondidos):
--   * Sem upload de imagem em post — `media` fica reservado, vazio, até a
--     estratégia de bucket de mídia da Community ser decidida na prática.
--   * Sem resposta a comentário (thread de 1 nível só).
--   * Sem "compartilhar"/repost.
--   * Sem denúncia — moderação de posts hoje é só apagar (autor/school_admin/
--     admin); um sistema de denúncia de verdade é uma fase própria.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000400_communities.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 3 · Comunidades
--
-- Mesmo padrão security-definer das fases anteriores: `communities`/
-- `community_members` com RLS ativa e sem policy — toda leitura/escrita
-- passa por RPC.
--
-- `posts.community_id` (nova coluna, nullable): um post de comunidade
-- continua sendo um `post` normal, só que associado a uma comunidade — não
-- duplica a tabela. Quando presente, a visibilidade do post deixa de olhar
-- `posts.visibility` (private/friends/school/public) e passa a ser "quem
-- pode ver a comunidade" — os dois conceitos não se somam, pra não criar
-- uma combinação confusa tipo "post friends dentro de comunidade pública".
--
-- `list_feed`/`list_saved_posts` (Fase 2) passam a filtrar
-- `community_id is null` — o feed pessoal continua sendo só posts
-- pessoais; o feed de uma comunidade é `list_community_feed`, à parte.
-- Isso não muda o comportamento de nenhum post já existente (todos têm
-- `community_id null` hoje).
-- ============================================================================

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  name text not null check (length(btrim(name)) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  description text check (description is null or length(description) <= 500),
  rules text check (rules is null or length(rules) <= 2000),
  visibility text not null default 'school'
    check (visibility in ('public', 'school', 'private')),
  created_at timestamptz not null default now()
);

create index if not exists communities_school_idx on public.communities (school_id);

alter table public.communities enable row level security;

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_user_idx on public.community_members (user_id);

alter table public.community_members enable row level security;

alter table public.posts add column if not exists community_id uuid references public.communities (id) on delete cascade;
create index if not exists posts_community_idx on public.posts (community_id) where community_id is not null;

-- ----------------------------------------------------------------------------
-- can_view_community / is_community_member: fonte única das duas checagens
-- que toda RPC de comunidade (e o post dentro dela) precisa.
-- ----------------------------------------------------------------------------
create or replace function public.is_community_member(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = p_user_id
  );
$$;

grant execute on function public.is_community_member(uuid, uuid) to authenticated;

create or replace function public.can_view_community(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id
      and (
        public.is_admin(p_user_id)
        or public.is_community_member(p_community_id, p_user_id)
        or c.visibility = 'public'
        or (c.visibility = 'school' and c.school_id is not null
            and c.school_id = public.current_school_id(p_user_id))
      )
  );
$$;

grant execute on function public.can_view_community(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- can_view_post (Fase 2) estendida: post com `community_id` é regido pela
-- comunidade, não mais por `posts.visibility`.
-- ----------------------------------------------------------------------------
create or replace function public.can_view_post(p_post_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = p_user_id
        or public.is_admin(p_user_id)
        or (p.community_id is not null and public.can_view_community(p.community_id, p_user_id))
        or (p.community_id is null and (
          p.visibility = 'public'
          or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
              and public.current_school_id(p.author_id) = public.current_school_id(p_user_id))
          or (p.visibility = 'friends' and public.are_friends(p_user_id, p.author_id))
        ))
      )
  );
$$;

create or replace function public.create_community(
  p_name text,
  p_description text default null,
  p_visibility text default 'school'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_slug text;
  v_suffix int := 0;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('public', 'school', 'private') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  -- Slug a partir do nome (minúsculo, hífen no lugar de espaço/acentuação
  -- simples) — com sufixo numérico se já existir, pra `create_community`
  -- nunca estourar erro de unicidade por coincidência de nome.
  v_slug := lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if length(v_slug) < 3 then
    v_slug := v_slug || '-comunidade';
  end if;
  while exists (select 1 from public.communities where slug = v_slug || case when v_suffix = 0 then '' else '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 0 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into public.communities (owner_id, school_id, name, slug, description, visibility)
  values (v_me, public.current_school_id(v_me), btrim(p_name), v_slug, nullif(btrim(coalesce(p_description, '')), ''), p_visibility)
  returning id into v_id;

  insert into public.community_members (community_id, user_id, role) values (v_id, v_me, 'owner');

  return v_id;
end;
$$;

grant execute on function public.create_community(text, text, text) to authenticated;

create or replace function public.join_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_community public.communities;
begin
  select * into v_community from public.communities where id = p_community_id;
  if not found then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  if v_community.visibility = 'private' then
    raise exception 'esta comunidade é só por convite — peça pra um moderador te adicionar' using errcode = '42501';
  end if;
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, v_me, 'member')
  on conflict (community_id, user_id) do nothing;
end;
$$;

grant execute on function public.join_community(uuid) to authenticated;

-- Dono não sai — ou apaga a comunidade, ou (fase futura) transfere a
-- titularidade. Sem isso, uma comunidade ficaria sem ninguém em 'owner'.
create or replace function public.leave_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'o dono não pode sair — apague a comunidade se quiser encerrá-la' using errcode = '42501';
  end if;

  delete from public.community_members where community_id = p_community_id and user_id = auth.uid();
end;
$$;

grant execute on function public.leave_community(uuid) to authenticated;

create or replace function public.delete_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community public.communities;
begin
  select * into v_community from public.communities where id = p_community_id;
  if not found then
    return;
  end if;

  if not (
    v_community.owner_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_community.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.communities where id = p_community_id;
end;
$$;

grant execute on function public.delete_community(uuid) to authenticated;

-- Só o dono promove/rebaixa moderador — evita moderador promovendo aliados
-- pra escapar de ser removido por quem criou a comunidade.
create or replace function public.set_member_role(p_community_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('member', 'moderator') then
    raise exception 'papel inválido' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.communities where id = p_community_id and owner_id = auth.uid()
  ) then
    raise exception 'só o dono da comunidade muda papéis' using errcode = '42501';
  end if;

  update public.community_members
  set role = p_role
  where community_id = p_community_id and user_id = p_user_id and role <> 'owner';
end;
$$;

grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- Dono ou moderador removem um membro comum (nunca o dono, nunca outro moderador).
create or replace function public.remove_member(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role in ('owner', 'moderator')
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.community_members
  where community_id = p_community_id and user_id = p_user_id and role = 'member';
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- Único jeito de entrar numa comunidade 'private' (sem convite por link
-- ainda) — dono ou moderador adiciona diretamente.
create or replace function public.add_member(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role in ('owner', 'moderator')
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, p_user_id, 'member')
  on conflict (community_id, user_id) do nothing;
end;
$$;

grant execute on function public.add_member(uuid, uuid) to authenticated;

-- `create or replace` NÃO troca a assinatura de 2 argumentos da Fase 2 por
-- esta de 3 — Postgres trata parâmetros a mais como uma função SEPARADA
-- (mesmo bug já visto em `bootstrap_student` nesta sessão), e as duas
-- coexistindo tornam toda chamada com 2 argumentos ambígua. Precisa
-- apagar a versão antiga antes de criar a nova.
drop function if exists public.create_post(text, text);

create or replace function public.create_post(
  p_content text,
  p_visibility text default 'school',
  p_community_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_community_id is not null and not public.is_community_member(p_community_id, v_me) then
    raise exception 'só membros publicam na comunidade' using errcode = '42501';
  end if;

  insert into public.posts (author_id, school_id, content, visibility, community_id)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility, p_community_id)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text, uuid) to authenticated;

create or replace function public.list_communities(p_query text default null)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  visibility text,
  member_count bigint,
  is_member boolean,
  my_role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.name, c.slug, c.description, c.visibility,
    (select count(*) from public.community_members m where m.community_id = c.id),
    public.is_community_member(c.id, auth.uid()),
    (select m2.role from public.community_members m2 where m2.community_id = c.id and m2.user_id = auth.uid())
  from public.communities c
  where (
    c.visibility = 'public'
    or public.is_admin()
    or public.is_community_member(c.id, auth.uid())
    or (c.visibility = 'school' and c.school_id is not null and c.school_id = public.current_school_id(auth.uid()))
  )
  and (p_query is null or c.name ilike '%' || p_query || '%')
  order by c.created_at desc;
$$;

grant execute on function public.list_communities(text) to authenticated;

create or replace function public.get_community(p_community_id uuid)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  rules text,
  visibility text,
  member_count bigint,
  is_member boolean,
  my_role text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_community(p_community_id) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select
    c.id, c.name, c.slug, c.description, c.rules, c.visibility,
    (select count(*) from public.community_members m where m.community_id = c.id),
    public.is_community_member(c.id, auth.uid()),
    (select m2.role from public.community_members m2 where m2.community_id = c.id and m2.user_id = auth.uid())
  from public.communities c
  where c.id = p_community_id;
end;
$$;

grant execute on function public.get_community(uuid) to authenticated;

create or replace function public.list_community_members(p_community_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_community(p_community_id) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select m.user_id, pr.full_name, pr.avatar_url, m.role, m.joined_at
  from public.community_members m
  join public.profiles pr on pr.id = m.user_id
  where m.community_id = p_community_id
  order by (m.role = 'owner') desc, (m.role = 'moderator') desc, m.joined_at asc;
end;
$$;

grant execute on function public.list_community_members(uuid) to authenticated;

-- Mesmo motivo do drop em `list_feed`/`list_saved_posts` (Fase 2): a Fase 6
-- muda as colunas de retorno desta função.
drop function if exists public.list_community_feed(uuid, integer, timestamptz);

create or replace function public.list_community_feed(
  p_community_id uuid,
  p_limit integer default 20,
  p_before timestamptz default null
)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where p.community_id = p_community_id
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

grant execute on function public.list_community_feed(uuid, integer, timestamptz) to authenticated;

-- `list_feed`/`list_saved_posts` (Fase 2) passam a ignorar posts de
-- comunidade — o feed pessoal continua sendo só posts pessoais.
create or replace function public.list_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where p.community_id is null
    and (p_before is null or p.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

create or replace function public.list_saved_posts(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    true,
    p.author_id = v_me
  from public.post_saves ps
  join public.posts p on p.id = ps.post_id
  join public.profiles pr on pr.id = p.author_id
  where ps.user_id = v_me
    and p.community_id is null
    and (p_before is null or ps.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by ps.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

update public.feature_flags set enabled = true where key = 'community_enabled';

-- ============================================================================
-- Cortes deliberados desta fase:
--   * Sem convite por link/token pra comunidade 'private' — hoje só dono/
--     moderador adiciona diretamente (`add_member`), sem um link/código
--     pra compartilhar; fica pra quando o convite de verdade for pedido.
--   * Sem transferência de titularidade — dono só sai apagando a comunidade.
--   * Sem avatar/banner de comunidade (mesma decisão de posts: mídia fica
--     pra quando o bucket for definido).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000500_group_chat.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 4 · Chat em grupo
--
-- Decisão de escopo: o plano original separa "Grupos" (Fase 4 — criar,
-- membros, convites, permissões) de "Chat" (Fase 5 — mensagens, reações,
-- presença). Na prática, o que diferencia um "grupo" de uma "comunidade"
-- (Fase 3) é só o chat — as duas já compartilham a MESMA mecânica de
-- membro/moderador/dono. Criar `groups`/`group_members` do zero duplicaria
-- `communities`/`community_members` linha por linha. Em vez disso: chat
-- mora dentro de uma comunidade já existente — uma comunidade "vira" um
-- grupo de estudo simplesmente por ter conversa ativa, sem precisar de uma
-- segunda hierarquia de tabelas pra chegar no mesmo lugar.
--
-- Tecnologia: polling curto no cliente (decisão já tomada na Fase 0 — o
-- projeto nunca usou Supabase Realtime, e não é este chat que introduz a
-- exceção). `messages` é só a tabela; quem periodicamente busca mensagem
-- nova é o componente React, chamando `list_messages` a cada poucos
-- segundos enquanto a tela de chat está aberta.
--
-- Diferente do feed da comunidade (que pode ser visível a quem só pode VER
-- a comunidade, mesmo sem ser membro, dependendo da visibilidade): mandar e
-- ler mensagem exige ser MEMBRO sempre, em qualquer visibilidade — chat é
-- espaço de quem já entrou, não de quem só está espiando de fora.
-- ============================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists messages_community_idx on public.messages (community_id, created_at);

alter table public.messages enable row level security;
-- (Sem policies — acesso só pelas funções abaixo, mesmo padrão de `posts`/`communities`.)

create or replace function public.send_message(p_community_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_community_member(p_community_id) then
    raise exception 'só membros conversam no grupo' using errcode = '42501';
  end if;

  insert into public.messages (community_id, author_id, content)
  values (p_community_id, auth.uid(), btrim(p_content))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.send_message(uuid, text) to authenticated;

create or replace function public.edit_message(p_message_id uuid, p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set content = btrim(p_content), edited_at = now()
  where id = p_message_id and author_id = auth.uid();

  if not found then
    raise exception 'mensagem não encontrada ou sem permissão' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.edit_message(uuid, text) to authenticated;

-- Autor da mensagem, ou quem modera o grupo (dono/moderador), ou admin/school_admin.
create or replace function public.delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.messages;
  v_community public.communities;
begin
  select * into v_message from public.messages where id = p_message_id;
  if not found then
    return;
  end if;
  select * into v_community from public.communities where id = v_message.community_id;

  if not (
    v_message.author_id = auth.uid()
    or exists (
      select 1 from public.community_members
      where community_id = v_message.community_id and user_id = auth.uid() and role in ('owner', 'moderator')
    )
    or public.is_admin()
    or public.can_manage_school(v_community.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.messages where id = p_message_id;
end;
$$;

grant execute on function public.delete_message(uuid) to authenticated;

create or replace function public.list_messages(
  p_community_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  id uuid,
  community_id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  created_at timestamptz,
  edited_at timestamptz,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_community_member(p_community_id) then
    raise exception 'só membros veem a conversa do grupo' using errcode = '42501';
  end if;

  return query
  select
    m.id, m.community_id, m.author_id, pr.full_name, pr.avatar_url, m.content, m.created_at, m.edited_at,
    m.author_id = auth.uid()
  from public.messages m
  join public.profiles pr on pr.id = m.author_id
  where m.community_id = p_community_id
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit greatest(1, least(p_limit, 100));
end;
$$;

grant execute on function public.list_messages(uuid, integer, timestamptz) to authenticated;

update public.feature_flags set enabled = true where key = 'chat_enabled';

-- ============================================================================
-- Cortes deliberados desta fase:
--   * Sem reações, anexo, indicador de "digitando" ou presença online —
--     texto simples só, igual ao chat da NexaAI já existente.
--   * Sem resposta citando outra mensagem (thread) — lista linear, como
--     qualquer chat de grupo simples.
--   * Polling, não Supabase Realtime — decisão da Fase 0 mantida.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000600_quiz_answer_lock.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — 0913 (6) · Fecha brecha de manipulação de nota em modo quiz
--
-- `answer_quiz_question` sempre permitiu reenviar resposta da mesma questão
-- enquanto a tentativa não é finalizada — legítimo em modo EXAME/simulado,
-- onde nada é revelado durante a prova, então voltar e mudar de ideia é
-- exatamente o esperado.
--
-- Em modo QUIZ/practice, porém, a própria função já devolve
-- `is_correct`/`correct_option_id`/`explanation` na hora, pro aluno ver se
-- acertou assim que responde (é o que faz um "quiz" ser um quiz, e não um
-- simulado). Sem trava nenhuma no banco, isso vira uma forma de manipular a
-- nota: responder qualquer coisa, ver a alternativa certa na resposta da
-- própria função, e responder de novo com ela antes de finalizar — nunca
-- errando de verdade. O client já desabilita o botão depois de escolher em
-- modo quiz (`quiz-runner.tsx`, `disabled={isQuiz && Boolean(chosen)}`), mas
-- isso é só UI: quem chama a função direto (ou reabilita o botão via
-- devtools) escrevia por cima da resposta sem barreira nenhuma no servidor,
-- que é a única fronteira que realmente conta.
--
-- A trava olha se já existe uma resposta (com `option_id` de verdade, não só
-- a linha fantasma que `toggle_question_flag` cria ao marcar uma questão
-- ainda não respondida) para aquela questão+tentativa, e só bloqueia quando
-- o modo é 'practice'. Simulado/exam continua podendo reescrever a resposta
-- livremente até finalizar, como sempre.
-- ============================================================================

create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_time_spent_seconds integer default 0
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_option uuid;
  v_is_correct boolean;
  v_exam_mode text;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.quiz_attempts a
    join public.resources r on r.id = a.resource_id
    where a.id = p_attempt_id
      and coalesce(r.time_limit_seconds, 0) > 0
      and now() > a.started_at + make_interval(secs => r.time_limit_seconds) + interval '15 seconds'
  ) then
    raise exception 'tempo esgotado' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  select coalesce(r.exam_mode, case when r.kind = 'quiz' then 'practice' else 'exam' end)
    into v_exam_mode
  from public.quiz_attempts a
  join public.resources r on r.id = a.resource_id
  where a.id = p_attempt_id;

  if v_exam_mode = 'practice' and exists (
    select 1 from public.quiz_answers
    where attempt_id = p_attempt_id and question_id = p_question_id and option_id is not null
  ) then
    raise exception 'esta questão já foi respondida' using errcode = '42501';
  end if;

  select o.id into v_correct_option
  from public.question_options o where o.question_id = p_question_id and o.is_correct;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  -- `flagged` de propósito fora do `set`: responder nunca desmarca uma
  -- questão que o aluno já tinha sinalizado para revisar. O tempo se
  -- ACUMULA — o aluno pode voltar à questão mais de uma vez (em modo exame).
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct, time_spent_seconds)
  values (p_attempt_id, p_question_id, p_option_id, v_is_correct, greatest(0, coalesce(p_time_spent_seconds, 0)))
  on conflict (attempt_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        answered_at = now(),
        time_spent_seconds = public.quiz_answers.time_spent_seconds + greatest(0, coalesce(p_time_spent_seconds, 0));

  return query
    select v_is_correct, v_correct_option, q.explanation
    from public.questions q where q.id = p_question_id;
end;
$$;

grant execute on function public.answer_quiz_question(uuid, uuid, uuid, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260913000700_suggested_people.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Redesign da página /comunidade · Pessoas sugeridas
--
-- Widget novo da sidebar ("Pessoas que você pode conhecer"). `search_schoolmates`
-- (20260911000100/20260912000100) não serve pra isto de propósito — ela só
-- devolve linha com uma busca de verdade (`p_query` vazio retorna nada), e
-- misturar os dois usos deixaria a função fazendo duas coisas. Esta é uma
-- segunda função, MESMO padrão de autorização (security definer, mesma
-- escola, nunca a própria pessoa) — só troca o filtro de nome por "ainda não
-- sigo e não sou amigo", que é o que faz sentido sugerir.
-- ============================================================================

create or replace function public.suggested_people(p_limit integer default 5)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
begin
  if v_me is null or v_school is null then
    return;
  end if;

  return query
  select p.id, p.full_name, p.avatar_url, c.name
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  where p.school_id = v_school
    and p.id <> v_me
    and not exists (
      select 1 from public.follows f where f.follower_id = v_me and f.following_id = p.id
    )
    and not exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and least(f.requester_id, f.addressee_id) = least(v_me, p.id)
        and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
    )
  order by random()
  limit greatest(1, least(p_limit, 20));
end;
$$;

grant execute on function public.suggested_people(integer) to authenticated;

-- ============================================================================
-- Correções de transcrição — duas migrations desta sessão (0913 (1) e (2))
-- foram coladas no chat de memória em vez de copiadas do arquivo real, e
-- saíram com uma diferença funcional em cada uma. Como o usuário já rodou a
-- versão colada, este arquivo também aplica a correção sobre o que já está
-- no banco dele (idempotente, seguro rodar de novo em qualquer ambiente):
--
-- 1. `follow_user`/`unfollow_user`: a versão colada usava o parâmetro
--    `p_user_id`; o app (`src/features/community/server/actions.ts`) chama
--    por nome com `p_target_id` (o nome real da migração no repositório).
--    PostgREST casa parâmetro por NOME, não só por tipo — com o nome
--    errado, todo clique em "Seguir"/"Deixar de seguir" falhava calado.
--    `create or replace` já resolve: mesmo tipo (uuid), troca só o nome.
create or replace function public.follow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'não dá pra seguir a si mesmo' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_target_id) then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;

  insert into public.follows (follower_id, following_id)
  values (auth.uid(), p_target_id)
  on conflict (follower_id, following_id) do nothing;
end;
$$;

grant execute on function public.follow_user(uuid) to authenticated;

create or replace function public.unfollow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where follower_id = auth.uid() and following_id = p_target_id;
end;
$$;

grant execute on function public.unfollow_user(uuid) to authenticated;

-- 2. `social_profiles.username`: a versão colada tinha `unique check
--    (username ~ '^[a-z0-9_]{3,20}$')` direto na coluna — mais restritivo
--    (máx. 20) que a validação real do app (zod, até 24 caracteres em
--    `src/features/community/server/actions.ts`). Um username de 21-24
--    caracteres passava no app e quebrava no banco. A migração real não
--    tem esse CHECK (o formato é responsabilidade só do app) — nem um
--    índice único comum, e sim um parcial case-insensitive.
alter table public.social_profiles drop constraint if exists social_profiles_username_check;
alter table public.social_profiles drop constraint if exists social_profiles_username_key;
create unique index if not exists social_profiles_username_uq
  on public.social_profiles (lower(username)) where username is not null;

-- ─────────────────────────────────────────────────────────────────────
-- 20260914000100_biblioteca_comunitaria.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 6 · Biblioteca comunitária
--
-- Escopo real (adaptado do plano): a Fase 5 (IA Creator — aluno virando dono
-- de `resources`) foi propositalmente adiada por ser a de maior risco de
-- regressão (RLS de gabarito). Sem ela, ainda não existe "conteúdo gerado
-- por aluno" pra compartilhar — então "biblioteca comunitária" aqui vira:
--   1. Avaliar (nota de 1 a 5) qualquer conteúdo já publicado na Biblioteca
--      oficial (`content_ratings`, tabela nova).
--   2. Compartilhar um item da Biblioteca oficial dentro de um post do feed
--      (`posts.shared_resource_id`, nullable) — é exatamente o que o mockup
--      mostrava ("Resumo — Funções (Módulo 4)... Visualizar").
--
-- Quando a Fase 5 for feita, `content_ratings`/`shared_resource_id` continuam
-- funcionando sem alteração — passam a valer também pra conteúdo de aluno,
-- não só de admin/professor.
-- ============================================================================

create table if not exists public.content_ratings (
  resource_id uuid not null references public.resources (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

drop trigger if exists content_ratings_set_updated_at on public.content_ratings;
create trigger content_ratings_set_updated_at before update on public.content_ratings
  for each row execute function public.set_updated_at();

alter table public.content_ratings enable row level security;
-- Mesmo padrão de RLS-sem-policy do resto da Community: `resources` não
-- libera SELECT pra quem só está de passagem (RLS depende de `is_published`
-- E escola), então uma policy direta em `content_ratings` duplicaria essa
-- regra. Toda leitura/escrita passa pelas RPCs abaixo.

-- `can_view_resource` já existe (20260904000300, usada por quiz/leitura) —
-- esta reaproveita o MESMO nome/assinatura em vez de criar uma segunda
-- função de visibilidade de recurso; só soma `is_admin()` (que faltava ali)
-- pra ficar consistente com todo `can_view_*` novo da Community.
create or replace function public.can_view_resource(p_resource_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (
        (r.is_published and (r.school_id is null or r.school_id = public.current_school_id(p_user_id)))
        or public.can_manage_school(r.school_id, p_user_id)
        or public.is_admin(p_user_id)
      )
  );
$$;

grant execute on function public.can_view_resource(uuid, uuid) to authenticated;

create or replace function public.rate_resource(p_resource_id uuid, p_rating integer, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if p_rating not between 1 and 5 then
    raise exception 'nota precisa ser de 1 a 5' using errcode = '22023';
  end if;

  insert into public.content_ratings (resource_id, user_id, rating, comment)
  values (p_resource_id, auth.uid(), p_rating, nullif(btrim(coalesce(p_comment, '')), ''))
  on conflict (resource_id, user_id) do update
    set rating = excluded.rating, comment = excluded.comment, updated_at = now();
end;
$$;

grant execute on function public.rate_resource(uuid, integer, text) to authenticated;

create or replace function public.remove_resource_rating(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.content_ratings where resource_id = p_resource_id and user_id = auth.uid();
end;
$$;

grant execute on function public.remove_resource_rating(uuid) to authenticated;

-- Resumo agregado + a nota do próprio chamador — um SELECT só cobre o card
-- inteiro (média, contagem, "eu dei tal nota"), sem o cliente juntar duas
-- respostas.
create or replace function public.get_resource_rating(p_resource_id uuid)
returns table (average numeric, rating_count bigint, my_rating smallint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;

  return query
  select
    round(avg(cr.rating), 1),
    count(*),
    (select cr2.rating from public.content_ratings cr2
      where cr2.resource_id = p_resource_id and cr2.user_id = auth.uid())
  from public.content_ratings cr
  where cr.resource_id = p_resource_id;
end;
$$;

grant execute on function public.get_resource_rating(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Compartilhar um item da Biblioteca num post.
-- ----------------------------------------------------------------------------
alter table public.posts add column if not exists shared_resource_id uuid references public.resources (id) on delete set null;

drop function if exists public.create_post(text, text, uuid);

create or replace function public.create_post(
  p_content text,
  p_visibility text default 'school',
  p_community_id uuid default null,
  p_shared_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_community_id is not null and not public.is_community_member(p_community_id, v_me) then
    raise exception 'só membros publicam na comunidade' using errcode = '42501';
  end if;
  if p_shared_resource_id is not null and not public.can_view_resource(p_shared_resource_id, v_me) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;

  insert into public.posts (author_id, school_id, content, visibility, community_id, shared_resource_id)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility, p_community_id, p_shared_resource_id)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text, uuid, uuid) to authenticated;

-- `list_feed`/`list_saved_posts`/`list_community_feed` (Fases 2-3) passam a
-- devolver o recurso compartilhado (quando houver) já resolvido — mesmo
-- princípio de `list_feed` já resolver autor via join, pra ninguém no
-- cliente precisar de uma segunda chamada só pra saber o título/tipo do
-- recurso citado no post.
-- `create or replace` não troca o tipo de retorno de uma função existente
-- (as 3 colunas novas do recurso compartilhado mudam a assinatura de saída)
-- — precisa apagar as 3 versões antigas antes de recriar.
drop function if exists public.list_feed(integer, timestamptz);
drop function if exists public.list_saved_posts(integer, timestamptz);
drop function if exists public.list_community_feed(uuid, integer, timestamptz);

create or replace function public.list_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
  where p.community_id is null
    and (p_before is null or p.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

create or replace function public.list_saved_posts(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    true,
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.post_saves ps
  join public.posts p on p.id = ps.post_id
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
  where ps.user_id = v_me
    and p.community_id is null
    and (p_before is null or ps.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by ps.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

create or replace function public.list_community_feed(
  p_community_id uuid, p_limit integer default 20, p_before timestamptz default null
)
returns table (
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
  where p.community_id = p_community_id
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 20260914000200_social_xp.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 13 · XP social
--
-- `social_xp_enabled` (Fase 0) nasceu desligado — esta migração liga a
-- primeira leva de eventos que pagam XP, todos por AÇÃO PRÓPRIA de quem
-- ganha (publicar, comentar, entrar numa comunidade), nunca por reação de
-- terceiro (curtida recebida) — reduz de propósito o risco de dois amigos
-- combinarem de ficar curtindo um ao outro pra farmar XP. Sem tabela nova:
-- reaproveita 100% o motor já existente (`award_xp`/`xp_events`), que já
-- alimenta ranking e conquistas — uma ação social vira XP no MESMO lugar que
-- terminar um simulado, sem um "ranking social" separado pra manter em
-- sincronia.
--
-- Dedup: `xp_events_source_uq (user_id, source_type, source_id, reason)` já
-- existe (migração 20260730000600) — usar o id do post/comentário/comunidade
-- como `source_id` garante que RE-ENTRAR na mesma comunidade ou o cliente
-- reenviar a mesma ação nunca paga duas vezes.
-- ============================================================================

alter table public.xp_events drop constraint if exists xp_events_source_type_check;
alter table public.xp_events add constraint xp_events_source_type_check
  check (source_type in (
    'task', 'routine', 'study_session', 'activity', 'achievement', 'system', 'quiz', 'lesson', 'resource', 'social'
  ));

-- Espelha `src/lib/feature-flags.ts` em SQL — evita cada função nova repetir
-- o mesmo `exists (select ... from feature_flags ...)`.
create or replace function public.is_feature_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select enabled from public.feature_flags where key = p_key), false);
$$;

grant execute on function public.is_feature_enabled(text) to authenticated;

create or replace function public.create_post(
  p_content text,
  p_visibility text default 'school',
  p_community_id uuid default null,
  p_shared_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_community_id is not null and not public.is_community_member(p_community_id, v_me) then
    raise exception 'só membros publicam na comunidade' using errcode = '42501';
  end if;
  if p_shared_resource_id is not null and not public.can_view_resource(p_shared_resource_id, v_me) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;

  insert into public.posts (author_id, school_id, content, visibility, community_id, shared_resource_id)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility, p_community_id, p_shared_resource_id)
  returning id into v_id;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(10, 'Publicou na Comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.create_comment(p_post_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if not public.can_view_post(p_post_id, v_me) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  insert into public.comments (post_id, author_id, content)
  values (p_post_id, v_me, btrim(p_content))
  returning id into v_id;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(5, 'Comentou na Comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.create_community(
  p_name text,
  p_description text default null,
  p_visibility text default 'school'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_slug text;
  v_suffix int := 0;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('public', 'school', 'private') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  v_slug := lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if length(v_slug) < 3 then
    v_slug := v_slug || '-comunidade';
  end if;
  while exists (select 1 from public.communities where slug = v_slug || case when v_suffix = 0 then '' else '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 0 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into public.communities (owner_id, school_id, name, slug, description, visibility)
  values (v_me, public.current_school_id(v_me), btrim(p_name), v_slug, nullif(btrim(coalesce(p_description, '')), ''), p_visibility)
  returning id into v_id;

  insert into public.community_members (community_id, user_id, role) values (v_id, v_me, 'owner');

  -- Mesmo prêmio de `join_community` — criar já inclui "entrar" (o dono
  -- não passa por `join_community` separadamente), e o dedup por
  -- `source_id` = id da comunidade impede pagar de novo se algum dia a
  -- pessoa também chamar `join_community` pra ela mesma (o `on conflict do
  -- nothing` do insert de membro já tornaria isso um no-op de qualquer forma).
  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(15, 'Entrou numa comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.join_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_community public.communities;
begin
  select * into v_community from public.communities where id = p_community_id;
  if not found then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  if v_community.visibility = 'private' then
    raise exception 'esta comunidade é só por convite — peça pra um moderador te adicionar' using errcode = '42501';
  end if;
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, v_me, 'member')
  on conflict (community_id, user_id) do nothing;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(15, 'Entrou numa comunidade', 'social', p_community_id, v_me);
  end if;
end;
$$;

update public.feature_flags set enabled = true where key = 'social_xp_enabled';

-- ─────────────────────────────────────────────────────────────────────
-- 20260914000300_moderacao.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 11 · Admin da comunidade (denúncias/moderação)
--
-- `reports` é polimórfica de propósito (`target_type` + `target_id`, sem FK)
-- — um post, comentário, mensagem, comunidade ou usuário são tabelas
-- diferentes, e uma FK por tipo (5 colunas nullable) seria pior de manter
-- que resolver o tipo em SQL na hora de exibir. Mesmo padrão RLS-sem-policy
-- do resto da Community.
--
-- `report_target_school`: quem pode RESOLVER uma denúncia é quem já
-- modera aquele conteúdo hoje (`can_manage_school`, o mesmo helper usado em
-- `delete_post`/`delete_comment`/`delete_message`/`delete_community`) — não
-- um papel novo de "moderador global". Resolve a escola do alvo polimórfico
-- uma vez só, reaproveitado tanto na listagem quanto na resolução.
-- ============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message', 'community', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'assedio', 'conteudo_impropio', 'informacao_falsa', 'outro')),
  details text check (details is null or length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
-- (Sem policies — leitura/escrita só pelas RPCs abaixo, mesmo padrão de `posts`/`communities`.)

create or replace function public.report_target_school(p_target_type text, p_target_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case p_target_type
    when 'post' then (select p.school_id from public.posts p where p.id = p_target_id)
    when 'comment' then (
      select p.school_id from public.comments c join public.posts p on p.id = c.post_id where c.id = p_target_id
    )
    when 'message' then (
      select cm.school_id from public.messages m join public.communities cm on cm.id = m.community_id where m.id = p_target_id
    )
    when 'community' then (select cm.school_id from public.communities cm where cm.id = p_target_id)
    when 'user' then (select pr.school_id from public.profiles pr where pr.id = p_target_id)
    else null
  end;
$$;

grant execute on function public.report_target_school(text, uuid) to authenticated;

create or replace function public.create_report(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_target_type not in ('post', 'comment', 'message', 'community', 'user') then
    raise exception 'tipo de denúncia inválido' using errcode = '22023';
  end if;
  if p_reason not in ('spam', 'assedio', 'conteudo_impropio', 'informacao_falsa', 'outro') then
    raise exception 'motivo inválido' using errcode = '22023';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, details)
  values (v_me, p_target_type, p_target_id, p_reason, nullif(btrim(coalesce(p_details, '')), ''))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_report(text, uuid, text, text) to authenticated;

-- `p_status` nulo lista todas; quem chama sem `can_manage_school`/`is_admin`
-- pra NENHUM alvo simplesmente recebe 0 linhas (o filtro é por linha, dentro
-- do próprio WHERE — não existe um "é moderador de algo" genérico pra
-- checar antes).
create or replace function public.list_reports(p_status text default 'pending')
returns table (
  id uuid,
  target_type text,
  target_id uuid,
  reason text,
  details text,
  status text,
  reporter_name text,
  target_preview text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    r.id, r.target_type, r.target_id, r.reason, r.details, r.status,
    coalesce(pr.full_name, 'Sem nome'),
    case r.target_type
      when 'post' then (select left(p.content, 140) from public.posts p where p.id = r.target_id)
      when 'comment' then (select left(c.content, 140) from public.comments c where c.id = r.target_id)
      when 'message' then (select left(m.content, 140) from public.messages m where m.id = r.target_id)
      when 'community' then (select cm.name from public.communities cm where cm.id = r.target_id)
      when 'user' then (select pr2.full_name from public.profiles pr2 where pr2.id = r.target_id)
    end,
    r.created_at,
    r.reviewed_at
  from public.reports r
  join public.profiles pr on pr.id = r.reporter_id
  where (p_status is null or r.status = p_status)
    and (public.is_admin() or public.can_manage_school(public.report_target_school(r.target_type, r.target_id)))
  order by r.created_at desc;
end;
$$;

grant execute on function public.list_reports(text) to authenticated;

create or replace function public.resolve_report(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if p_status not in ('reviewed', 'dismissed') then
    raise exception 'status inválido' using errcode = '22023';
  end if;

  select * into v_report from public.reports where id = p_report_id;
  if not found then
    return;
  end if;

  if not (
    public.is_admin()
    or public.can_manage_school(public.report_target_school(v_report.target_type, v_report.target_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  update public.reports
  set status = p_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;
end;
$$;

grant execute on function public.resolve_report(uuid, text) to authenticated;

-- Contagem pendente, pra um badge no nav do admin sem carregar a lista inteira.
create or replace function public.count_pending_reports()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.reports r
  where r.status = 'pending'
    and (public.is_admin() or public.can_manage_school(public.report_target_school(r.target_type, r.target_id)));
$$;

grant execute on function public.count_pending_reports() to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 20260914000400_eventos.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fases 7-10 · Eventos escolares
--
-- As quatro fases do plano original (criar evento, inscrição/lista de
-- espera, check-in por QR, certificado) viram uma migração só — são a
-- mesma tabela de ponta a ponta (`events` → `event_registrations` →
-- `attendance` → `certificates`), sem peça independente o bastante pra
-- valer a pena separar em 4 migrações e 4 fases de feature flag.
--
-- Quem CRIA evento: dono/moderador da comunidade (quando o evento nasce
-- dentro de uma) ou quem já gerencia a escola/admin (fora de uma comunidade)
-- — igual à criação de comunidade, evento não é aberto a qualquer aluno.
-- Depois de criado, inscrição é livre pra quem enxerga o evento.
--
-- Check-in por QR "assinado no servidor": o código (`check_in_code`) nunca é
-- validado no cliente — o QR só carrega o código, um organizador com o
-- celular (câmera nativa, sem scanner dentro do app) abre o link, e
-- `check_in_by_code` confere no banco se quem está logado pode gerenciar
-- AQUELE evento antes de gravar presença. Sem lib de QR-scan nova; só
-- geração (`qrcode`, adicionada ao projeto).
--
-- Certificado não é um arquivo gerado e guardado — é uma PÁGINA que só abre
-- pra quem tem presença confirmada, impressa/exportada como PDF pelo
-- diálogo nativo do navegador (mesmo padrão já usado pros relatórios do
-- admin, ADR-044). `certificates` só registra QUE foi emitido, não o
-- conteúdo.
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 120),
  description text check (description is null or length(description) <= 2000),
  location text check (location is null or length(location) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  capacity integer check (capacity is null or capacity > 0),
  -- Só vale quando `community_id` é nulo — evento de comunidade herda a
  -- visibilidade da própria comunidade, mesmo desenho de `posts.community_id`.
  visibility text not null default 'school' check (visibility in ('school', 'public')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_school_starts_idx on public.events (school_id, starts_at);
create index if not exists events_community_idx on public.events (community_id) where community_id is not null;

alter table public.events enable row level security;

create table if not exists public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  check_in_code text not null,
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  primary key (event_id, user_id)
);

create unique index if not exists event_registrations_code_uq on public.event_registrations (check_in_code);
create index if not exists event_registrations_status_idx on public.event_registrations (event_id, status, registered_at);

alter table public.event_registrations enable row level security;

create table if not exists public.attendance (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users (id) on delete set null,
  primary key (event_id, user_id)
);

alter table public.attendance enable row level security;

create table if not exists public.certificates (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  issued_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.certificates enable row level security;
-- (As 4 tabelas acima: RLS ativa, sem policy — mesmo padrão RPC-only do resto da Community.)

-- `tasks` ganha o valor 'evento' (só pra Agenda já existente reconhecer a
-- linha) e uma referência de volta pro evento, pra `cancel_registration`/
-- `cancel_event` saberem qual task apagar sem adivinhar por título.
alter table public.tasks drop constraint if exists tasks_kind_check;
alter table public.tasks add constraint tasks_kind_check
  check (kind in ('task', 'homework', 'reading', 'review', 'exercise', 'project', 'custom', 'prova', 'evento'));
alter table public.tasks add column if not exists related_event_id uuid references public.events (id) on delete cascade;
create unique index if not exists tasks_related_event_uq
  on public.tasks (user_id, related_event_id) where related_event_id is not null;

-- ----------------------------------------------------------------------------
-- Visibilidade e gerência
-- ----------------------------------------------------------------------------
create or replace function public.can_view_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        public.is_admin(p_user_id)
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and public.can_view_community(e.community_id, p_user_id))
        or (e.community_id is null and (
          e.visibility = 'public'
          or (e.visibility = 'school' and e.school_id = public.current_school_id(p_user_id))
        ))
      )
  );
$$;

grant execute on function public.can_view_event(uuid, uuid) to authenticated;

create or replace function public.can_manage_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        e.created_by = p_user_id
        or public.is_admin(p_user_id)
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and exists (
          select 1 from public.community_members m
          where m.community_id = e.community_id and m.user_id = p_user_id and m.role in ('owner', 'moderator')
        ))
      )
  );
$$;

grant execute on function public.can_manage_event(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Criar / editar / cancelar
-- ----------------------------------------------------------------------------
create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null,
  p_visibility text default 'school',
  p_community_id uuid default null,
  -- Só usado quando quem cria é admin GERAL fora de uma comunidade — admin
  -- geral não tem `current_school_id()` (não é aluno de escola nenhuma),
  -- então precisa escolher explicitamente, mesmo padrão de `resolveSchoolId`
  -- já usado no resto do admin (`admin/server/queries.ts`). school_admin e
  -- aluno-dono-de-comunidade continuam presos à própria escola, ignoram este
  -- argumento.
  p_school_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'o fim precisa ser depois do início' using errcode = '22023';
  end if;
  if p_capacity is not null and p_capacity <= 0 then
    raise exception 'capacidade precisa ser maior que zero' using errcode = '22023';
  end if;

  if p_community_id is not null then
    if not (
      public.is_admin(v_me)
      or exists (
        select 1 from public.community_members
        where community_id = p_community_id and user_id = v_me and role in ('owner', 'moderator')
      )
    ) then
      raise exception 'só dono/moderador da comunidade cria evento nela' using errcode = '42501';
    end if;
    select school_id into v_school from public.communities where id = p_community_id;
  elsif public.is_admin(v_me) then
    v_school := coalesce(p_school_id, public.current_school_id(v_me));
  else
    v_school := public.current_school_id(v_me);
    if not public.can_manage_school(v_school, v_me) then
      raise exception 'só quem gerencia a escola cria evento fora de uma comunidade' using errcode = '42501';
    end if;
  end if;

  if v_school is null then
    raise exception 'informe a escola do evento' using errcode = '22023';
  end if;

  insert into public.events (school_id, community_id, created_by, title, description, location, starts_at, ends_at, capacity, visibility)
  values (
    v_school, p_community_id, v_me, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), nullif(btrim(coalesce(p_location, '')), ''),
    p_starts_at, p_ends_at, p_capacity, p_visibility
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid) to authenticated;

create or replace function public.update_event(
  p_event_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'o fim precisa ser depois do início' using errcode = '22023';
  end if;

  update public.events
  set title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      location = nullif(btrim(coalesce(p_location, '')), ''),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      capacity = p_capacity
  where id = p_event_id;
end;
$$;

grant execute on function public.update_event(uuid, text, timestamptz, text, text, timestamptz, integer) to authenticated;

-- Cancelar avisa todo mundo que estava de dentro (registrado ou na fila) e
-- limpa a tarefa correspondente da Agenda de cada um.
create or replace function public.cancel_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_reg record;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  select title into v_title from public.events where id = p_event_id;

  update public.events set cancelled_at = now() where id = p_event_id and cancelled_at is null;

  for v_reg in
    select user_id from public.event_registrations where event_id = p_event_id and status in ('registered', 'waitlisted')
  loop
    delete from public.tasks where user_id = v_reg.user_id and related_event_id = p_event_id;
    perform public.notify_user(v_reg.user_id, 'Evento cancelado', v_title || ' foi cancelado.', null);
  end loop;
end;
$$;

grant execute on function public.cancel_event(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Inscrição / lista de espera
-- ----------------------------------------------------------------------------
create or replace function public.register_for_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_event public.events;
  v_existing public.event_registrations;
  v_registered_count integer;
  v_status text;
  v_code text;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.cancelled_at is not null then
    raise exception 'evento não encontrado ou cancelado' using errcode = 'P0002';
  end if;
  if not public.can_view_event(p_event_id, v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if v_event.starts_at < now() then
    raise exception 'este evento já aconteceu' using errcode = '22023';
  end if;

  select * into v_existing from public.event_registrations where event_id = p_event_id and user_id = v_me;
  if found and v_existing.status in ('registered', 'waitlisted') then
    return v_existing.status; -- já inscrito, idempotente
  end if;

  select count(*) into v_registered_count
  from public.event_registrations where event_id = p_event_id and status = 'registered';

  v_status := case when v_event.capacity is null or v_registered_count < v_event.capacity
    then 'registered' else 'waitlisted' end;
  v_code := encode(gen_random_bytes(6), 'hex');

  insert into public.event_registrations (event_id, user_id, status, check_in_code, registered_at, cancelled_at)
  values (p_event_id, v_me, v_status, v_code, now(), null)
  on conflict (event_id, user_id) do update
    set status = excluded.status, check_in_code = excluded.check_in_code,
        registered_at = now(), cancelled_at = null;

  if v_status = 'registered' then
    insert into public.tasks (user_id, title, kind, due_date, related_event_id)
    values (v_me, v_event.title, 'evento', v_event.starts_at::date, p_event_id)
    on conflict (user_id, related_event_id) where related_event_id is not null do nothing;
  end if;

  return v_status;
end;
$$;

grant execute on function public.register_for_event(uuid) to authenticated;

-- Cancelar a própria inscrição libera vaga pra quem está na frente da fila
-- de espera — promovido ganha a task na Agenda e uma notificação.
create or replace function public.cancel_registration(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_existing public.event_registrations;
  v_promoted_user uuid;
  v_title text;
begin
  select * into v_existing from public.event_registrations where event_id = p_event_id and user_id = v_me;
  if not found or v_existing.status = 'cancelled' then
    return;
  end if;

  update public.event_registrations
  set status = 'cancelled', cancelled_at = now()
  where event_id = p_event_id and user_id = v_me;

  delete from public.tasks where user_id = v_me and related_event_id = p_event_id;

  if v_existing.status = 'registered' then
    select user_id into v_promoted_user
    from public.event_registrations
    where event_id = p_event_id and status = 'waitlisted'
    order by registered_at asc
    limit 1;

    if v_promoted_user is not null then
      update public.event_registrations set status = 'registered'
      where event_id = p_event_id and user_id = v_promoted_user;

      select title into v_title from public.events where id = p_event_id;

      insert into public.tasks (user_id, title, kind, due_date, related_event_id)
      select v_promoted_user, e.title, 'evento', e.starts_at::date, p_event_id
      from public.events e where e.id = p_event_id
      on conflict (user_id, related_event_id) where related_event_id is not null do nothing;

      perform public.notify_user(
        v_promoted_user, 'Vaga liberada!',
        'Abriu uma vaga em "' || v_title || '" e você saiu da lista de espera.',
        '/comunidade/eventos/' || p_event_id::text
      );
    end if;
  end if;
end;
$$;

grant execute on function public.cancel_registration(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Listagem
-- ----------------------------------------------------------------------------
create or replace function public.list_events(p_upcoming_only boolean default true)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  community_id uuid,
  community_name text,
  cancelled_at timestamptz,
  registered_count bigint,
  my_status text,
  can_manage boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    e.id, e.title, e.description, e.location, e.starts_at, e.ends_at, e.capacity,
    e.community_id, cm.name, e.cancelled_at,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    (select r2.status from public.event_registrations r2 where r2.event_id = e.id and r2.user_id = v_me),
    public.can_manage_event(e.id, v_me)
  from public.events e
  left join public.communities cm on cm.id = e.community_id
  where (
      public.is_admin(v_me)
      or public.can_manage_school(e.school_id, v_me)
      or (e.community_id is not null and public.can_view_community(e.community_id, v_me))
      or (e.community_id is null and (
        e.visibility = 'public'
        or (e.visibility = 'school' and e.school_id = public.current_school_id(v_me))
      ))
    )
    and (not p_upcoming_only or e.starts_at >= now() - interval '1 day')
  order by e.starts_at asc;
end;
$$;

grant execute on function public.list_events(boolean) to authenticated;

create or replace function public.get_event(p_event_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  community_id uuid,
  community_name text,
  cancelled_at timestamptz,
  registered_count bigint,
  waitlisted_count bigint,
  my_status text,
  can_manage boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if not public.can_view_event(p_event_id, v_me) then
    raise exception 'evento não encontrado' using errcode = 'P0002';
  end if;

  return query
  select
    e.id, e.title, e.description, e.location, e.starts_at, e.ends_at, e.capacity,
    e.community_id, cm.name, e.cancelled_at,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'waitlisted'),
    (select r2.status from public.event_registrations r2 where r2.event_id = e.id and r2.user_id = v_me),
    public.can_manage_event(e.id, v_me)
  from public.events e
  left join public.communities cm on cm.id = e.community_id
  where e.id = p_event_id;
end;
$$;

grant execute on function public.get_event(uuid) to authenticated;

create or replace function public.list_event_registrants(p_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  status text,
  registered_at timestamptz,
  checked_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  select r.user_id, pr.full_name, pr.avatar_url, r.status, r.registered_at, a.checked_in_at
  from public.event_registrations r
  join public.profiles pr on pr.id = r.user_id
  left join public.attendance a on a.event_id = r.event_id and a.user_id = r.user_id
  where r.event_id = p_event_id and r.status in ('registered', 'waitlisted')
  order by (r.status = 'waitlisted'), r.registered_at asc;
end;
$$;

grant execute on function public.list_event_registrants(uuid) to authenticated;

-- O próprio ingresso (pra desenhar o QR) — só o código de quem chama, nunca
-- de outra pessoa, e só quando confirmado (nunca revela código de quem está
-- só na lista de espera, que ainda nem tem vaga garantida).
create or replace function public.get_my_event_ticket(p_event_id uuid)
returns table (status text, check_in_code text, checked_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select r.status, case when r.status = 'registered' then r.check_in_code else null end, a.checked_in_at
  from public.event_registrations r
  left join public.attendance a on a.event_id = r.event_id and a.user_id = r.user_id
  where r.event_id = p_event_id and r.user_id = auth.uid();
end;
$$;

grant execute on function public.get_my_event_ticket(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Check-in
-- ----------------------------------------------------------------------------
-- `check_in_code` é único em toda a tabela (não só por evento) — o QR só
-- precisa carregar o código, sem precisar saber de quem é nem de qual
-- evento antes de escanear.
create or replace function public.check_in_by_code(p_code text)
returns table (user_id uuid, full_name text, event_id uuid, event_title text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_reg public.event_registrations;
begin
  select * into v_reg from public.event_registrations where check_in_code = p_code and status = 'registered';
  if not found then
    raise exception 'código inválido ou inscrição não confirmada' using errcode = 'P0002';
  end if;
  if not public.can_manage_event(v_reg.event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.attendance (event_id, user_id, checked_in_at, checked_in_by)
  values (v_reg.event_id, v_reg.user_id, now(), auth.uid())
  on conflict (event_id, user_id) do nothing;

  return query
  select pr.id, pr.full_name, e.id, e.title
  from public.profiles pr, public.events e
  where pr.id = v_reg.user_id and e.id = v_reg.event_id;
end;
$$;

grant execute on function public.check_in_by_code(text) to authenticated;

-- Fallback sem QR (celular sem câmera à mão, ou o organizador prefere
-- marcar direto na lista de presença).
create or replace function public.check_in_manually(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and user_id = p_user_id and status = 'registered'
  ) then
    raise exception 'esta pessoa não está inscrita' using errcode = '22023';
  end if;

  insert into public.attendance (event_id, user_id, checked_in_at, checked_in_by)
  values (p_event_id, p_user_id, now(), auth.uid())
  on conflict (event_id, user_id) do nothing;
end;
$$;

grant execute on function public.check_in_manually(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Certificado — emitido (uma vez) na primeira vez que quem fez check-in
-- abre a própria página de certificado, depois do evento ter terminado.
-- ----------------------------------------------------------------------------
create or replace function public.get_my_certificate(p_event_id uuid)
returns table (issued_at timestamptz, event_title text, full_name text, event_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'evento não encontrado' using errcode = 'P0002';
  end if;
  if coalesce(v_event.ends_at, v_event.starts_at) > now() then
    raise exception 'o evento ainda não terminou' using errcode = '22023';
  end if;
  if not exists (select 1 from public.attendance a where a.event_id = p_event_id and a.user_id = v_me) then
    raise exception 'certificado só pra quem fez check-in no evento' using errcode = '42501';
  end if;

  insert into public.certificates (event_id, user_id) values (p_event_id, v_me)
  on conflict (event_id, user_id) do nothing;

  return query
  select c.issued_at, v_event.title, pr.full_name, v_event.starts_at::date
  from public.certificates c
  join public.profiles pr on pr.id = c.user_id
  where c.event_id = p_event_id and c.user_id = v_me;
end;
$$;

grant execute on function public.get_my_certificate(uuid) to authenticated;

update public.feature_flags set enabled = true where key in ('events_enabled', 'certificates_enabled');

-- ─────────────────────────────────────────────────────────────────────
-- 20260917000100_ia_creator.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Community — Fase 5 · IA Creator (aluno gera quiz/resumo com IA)
--
-- Decisão central, pelo motivo já documentado em `20260914000100_biblioteca_
-- comunitaria.sql` ("a Fase 5 foi propositalmente adiada por ser a de maior
-- risco de regressão — RLS de gabarito"): NUNCA tocar em `resources_manage`
-- (a policy que hoje protege escrita de admin/professor) nem em
-- `questions_manage`/`question_options_manage`. Aluno nunca ganha INSERT/
-- UPDATE direto nessas 3 tabelas — toda escrita de conteúdo de aluno passa
-- pelas RPCs `security definer` abaixo, que fazem exatamente as mesmas
-- inserções que `importSimulado` já faz hoje (mesma forma de linha), só que
-- de dentro de uma função em vez de várias chamadas do client.
--
-- Leitura é onde a mudança de verdade acontece: `can_view_resource()` ganha
-- os únicos dois ramos novos (dono sempre vê o próprio; e visibilidade nova
-- pra conteúdo de aluno), e a policy `resources_select_visible` passa a
-- CHAMAR essa mesma função em vez de duplicar a lógica — as duas nunca podem
-- divergir porque são literalmente o mesmo código. `questions`/
-- `question_options` continuam SEM policy de select nenhuma (só managers) —
-- todo mundo, inclusive quem criou o próprio quiz por IA, só vê as questões
-- (sem gabarito) através de `quiz_questions()`, que já filtra `is_correct` e
-- já é gated por `can_view_resource()`. Resultado: zero mudança de
-- comportamento pra conteúdo de admin/professor (o ramo antigo da função e
-- da policy fica byte-a-byte igual), e o mesmo runner/scoring/XP que já
-- existe passa a funcionar pra conteúdo de aluno sem precisar duplicar nada.
--
-- `visibility`/`community_id`/`ai_generated` só existem em linhas geradas
-- pela IA — conteúdo de admin/professor nunca grava essas colunas (ficam
-- `null`/`false`), que é o que faz o ramo `not ai_generated` do
-- `can_view_resource` ser, de propósito, IDÊNTICO ao de antes.
-- ============================================================================

alter table public.resources
  add column if not exists visibility text
    check (visibility is null or visibility in ('private', 'friends', 'school', 'community', 'public')),
  add column if not exists community_id uuid references public.communities (id) on delete set null,
  add column if not exists ai_generated boolean not null default false;

comment on column public.resources.visibility is
  'Só usado por conteúdo gerado pelo IA Creator (ai_generated = true). Null = conteúdo de admin/professor, rege-se pelas regras antigas (is_published + escola).';

-- ----------------------------------------------------------------------------
-- can_view_resource — estendida. O ramo `not r.ai_generated` é EXATAMENTE a
-- condição original (is_published + escola, ou can_manage_school, ou admin);
-- só foi reescrita como sub-bloco pra caber ao lado do ramo novo.
-- ----------------------------------------------------------------------------
create or replace function public.can_view_resource(p_resource_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (
        r.created_by = p_user_id
        or public.is_admin(p_user_id)
        or (
          not r.ai_generated
          and (
            (r.is_published and (r.school_id is null or r.school_id = public.current_school_id(p_user_id)))
            or public.can_manage_school(r.school_id, p_user_id)
          )
        )
        or (
          r.ai_generated and r.visibility is not null and (
            r.visibility = 'public'
            or (r.visibility = 'school' and r.school_id is not null and r.school_id = public.current_school_id(p_user_id))
            or (r.visibility = 'friends' and r.created_by is not null and public.are_friends(p_user_id, r.created_by))
            or (r.visibility = 'community' and r.community_id is not null and public.can_view_community(r.community_id, p_user_id))
          )
        )
      )
  );
$$;

grant execute on function public.can_view_resource(uuid, uuid) to authenticated;

-- Policy passa a delegar pra `can_view_resource` — mesma regra, um lugar só.
drop policy if exists resources_select_visible on public.resources;
create policy resources_select_visible on public.resources
  for select to authenticated
  using (public.can_view_resource(id, auth.uid()));

-- `resources_manage`, `questions_manage`, `question_options_manage`: intocadas.

-- ----------------------------------------------------------------------------
-- create_ai_resource — única forma de um aluno inserir em resources/questions/
-- question_options. `p_questions` já vem VALIDADO pelo mesmo parser v2
-- (`parseSimuladoCode`) que o importador do admin usa — esta função só grava,
-- não valida formato de simulado (isso já rodou em TypeScript antes de
-- chegar aqui, puro, sem banco, testável isoladamente).
-- ----------------------------------------------------------------------------
create or replace function public.create_ai_resource(
  p_kind text,
  p_subject_catalog_id uuid,
  p_title text,
  p_description text default null,
  p_body text default null,
  p_questions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_question_id uuid;
  v_school uuid;
  v_qpos integer := 0;
  v_opos integer;
  q jsonb;
  o jsonb;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('creator_enabled') then
    raise exception 'o IA Creator está desativado' using errcode = '42501';
  end if;
  if p_kind not in ('quiz', 'resumo') then
    raise exception 'tipo de conteúdo inválido' using errcode = '22023';
  end if;
  if not exists (select 1 from public.subject_catalog where id = p_subject_catalog_id and is_active) then
    raise exception 'matéria inválida' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_title, ''))) < 2 then
    raise exception 'título muito curto' using errcode = '22023';
  end if;
  if p_kind = 'resumo' and length(btrim(coalesce(p_body, ''))) < 1 then
    raise exception 'conteúdo do resumo vazio' using errcode = '22023';
  end if;
  if p_kind = 'quiz' then
    if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) = 0 then
      raise exception 'sem questões' using errcode = '22023';
    end if;
    if jsonb_array_length(p_questions) > 20 then
      raise exception 'no máximo 20 questões por vez' using errcode = '22023';
    end if;
  end if;

  v_school := public.current_school_id(v_me);

  insert into public.resources (
    school_id, subject_catalog_id, kind, title, description, body,
    difficulty, is_published, created_by, visibility, ai_generated, schema_version
  ) values (
    v_school, p_subject_catalog_id, p_kind, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), p_body,
    'medio', true, v_me, 'private', true,
    case when p_kind = 'quiz' then '2.0' else '1.0' end
  )
  returning id into v_id;

  if p_kind = 'quiz' then
    for q in select * from jsonb_array_elements(p_questions) loop
      v_qpos := v_qpos + 1;

      if not exists (
        select 1 from jsonb_array_elements(coalesce(q -> 'options', '[]'::jsonb)) opt
        where (opt ->> 'is_correct')::boolean
      ) then
        raise exception 'questão % sem resposta correta marcada', v_qpos using errcode = '22023';
      end if;

      insert into public.questions (resource_id, position, statement, explanation, difficulty)
      values (
        v_id, v_qpos,
        btrim(q ->> 'statement'),
        nullif(btrim(coalesce(q ->> 'explanation', '')), ''),
        coalesce(nullif(q ->> 'difficulty', ''), 'medio')
      )
      returning id into v_question_id;

      v_opos := 0;
      for o in select * from jsonb_array_elements(q -> 'options') loop
        v_opos := v_opos + 1;
        insert into public.question_options (question_id, position, body, is_correct)
        values (v_question_id, v_opos, btrim(o ->> 'body'), coalesce((o ->> 'is_correct')::boolean, false));
      end loop;
    end loop;
  end if;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(10, 'Criou conteúdo com a IA', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_ai_resource(text, uuid, text, text, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- Listagem/gerência do próprio conteúdo gerado.
-- ----------------------------------------------------------------------------
create or replace function public.list_my_ai_resources()
returns table (
  id uuid,
  kind text,
  title text,
  description text,
  subject_name text,
  visibility text,
  community_id uuid,
  community_name text,
  question_count bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id, r.kind, r.title, r.description,
    sc.name,
    r.visibility, r.community_id, cm.name,
    (select count(*) from public.questions q where q.resource_id = r.id),
    r.created_at
  from public.resources r
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.communities cm on cm.id = r.community_id
  where r.ai_generated and r.created_by = auth.uid()
  order by r.created_at desc;
$$;

grant execute on function public.list_my_ai_resources() to authenticated;

create or replace function public.update_ai_resource_visibility(
  p_resource_id uuid,
  p_visibility text,
  p_community_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
begin
  if p_visibility not in ('private', 'friends', 'school', 'community', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  select created_by into v_owner from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  if p_visibility = 'community' then
    if p_community_id is null or not public.is_community_member(p_community_id, v_me) then
      raise exception 'escolha uma comunidade da qual você é membro' using errcode = '22023';
    end if;
  end if;

  update public.resources
  set visibility = p_visibility,
      community_id = case when p_visibility = 'community' then p_community_id else null end
  where id = p_resource_id;
end;
$$;

grant execute on function public.update_ai_resource_visibility(uuid, text, uuid) to authenticated;

create or replace function public.delete_ai_resource(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
begin
  select created_by into v_owner from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    return;
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.resources where id = p_resource_id;
end;
$$;

grant execute on function public.delete_ai_resource(uuid) to authenticated;

update public.feature_flags set enabled = true where key = 'creator_enabled';

-- ─────────────────────────────────────────────────────────────────────
-- 20260919000100_vestibular_fundacao.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Vestibular — Fase 0 · Fundação (contexto, provas, perfil vestibular)
--
-- Duas decisões de arquitetura, confirmadas antes de escrever esta migração:
--
-- 1. NÃO existe um banco de questões paralelo. Questão de vestibular é uma
--    linha de `questions` dentro de um `resources`, igual a qualquer outro
--    conteúdo — o que já dá de graça o player com cronômetro/navegador/trava
--    anti-cola, a correção, a redação (`writing_tasks`), a fila de revisão e
--    toda a RLS de gabarito JÁ testada. O que faltava era só a IDENTIDADE da
--    prova, e é isso que `exams`/`exam_editions` + as colunas novas em
--    `resources` acrescentam. Metadado por questão (número na prova, gabarito
--    oficial, competência) entra junto com o banco de questões avulsas, numa
--    fase seguinte — aqui a prova é o recurso inteiro ("ENEM 2024 — Dia 1").
--
-- 2. `resources.context` ('school' | 'vestibular') existe por um motivo bem
--    concreto: `subject_scores()` — a NOTA automática do aluno na escola —
--    agrega TODA tentativa de quiz/simulado terminada. Sem esta coluna, uma
--    questão de ENEM entraria direto no boletim escolar, que é exatamente o
--    que o plano proíbe. As três funções que produzem nota escolar
--    (`subject_scores`, `performance_evolution`, `simulado_history`) passam a
--    filtrar `context = 'school'` — e o teste desta fase trava isso contra
--    regressão.
--
--    Corte deliberado e documentado: as funções de DIAGNÓSTICO
--    (`topic_mastery`, `skill_mastery`, `common_error_types`, `recent_errors`,
--    `review_queue`) continuam enxergando os dois contextos nesta fase. Elas
--    não viram nota — mostram "seus pontos fracos" e "o que revisar", onde
--    misturar erro de ENEM com erro de escola é, no mínimo, defensável. Elas
--    ganham um parâmetro de contexto de verdade quando o Desempenho
--    Vestibular for construído, e não antes: mexer nas 5 agora seria copiar
--    ~600 linhas de SQL sem nenhuma tela ainda lendo o resultado.
-- ============================================================================

insert into public.feature_flags (key, enabled, description) values
  ('vestibular_enabled', false, 'Chave-mestra: liga a área "Vestibular" (contexto, rotas, navegação).'),
  ('enem_enabled', false, 'Conteúdo e contagem regressiva do ENEM dentro do Vestibular.')
on conflict (key) do nothing;

-- ------------------------------------------------------------------ provas --
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(btrim(name)) between 2 and 80),
  organization text,
  -- 'nacional' = ENEM; 'estadual'/'federal'/'militar' = os demais. Só rótulo.
  kind text not null default 'vestibular' check (kind in ('nacional', 'vestibular', 'militar')),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;

drop policy if exists exams_select_all on public.exams;
create policy exams_select_all on public.exams
  for select to authenticated using (true);

drop policy if exists exams_manage_admin on public.exams;
create policy exams_manage_admin on public.exams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- edições ---
-- Datas nascem NULAS de propósito: data de prova/inscrição é dado do mundo
-- real, e inventar uma data errada num contador regressivo é pior do que não
-- ter contador. O admin preenche quando o edital sai.
create table if not exists public.exam_editions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  label text,
  application_date date,
  application_date_2 date,
  registration_start date,
  registration_end date,
  results_date date,
  created_at timestamptz not null default now()
);

create unique index if not exists exam_editions_exam_year_uq on public.exam_editions (exam_id, year);
create index if not exists exam_editions_date_idx on public.exam_editions (application_date);

alter table public.exam_editions enable row level security;

drop policy if exists exam_editions_select_all on public.exam_editions;
create policy exam_editions_select_all on public.exam_editions
  for select to authenticated using (true);

drop policy if exists exam_editions_manage_admin on public.exam_editions;
create policy exam_editions_manage_admin on public.exam_editions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------- contexto e vínculo de prova ---
alter table public.resources
  add column if not exists context text not null default 'school'
    check (context in ('school', 'vestibular')),
  add column if not exists exam_id uuid references public.exams (id) on delete set null,
  add column if not exists exam_edition_id uuid references public.exam_editions (id) on delete set null;

create index if not exists resources_context_idx on public.resources (context, kind) where context = 'vestibular';

comment on column public.resources.context is
  'school = conteúdo da escola (conta na nota automática); vestibular = preparação para vestibular (NUNCA entra na nota escolar).';

-- ------------------------------------------------------- perfil vestibular --
create table if not exists public.vestibular_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  main_exam_id uuid references public.exams (id) on delete set null,
  target_year smallint check (target_year is null or target_year between 2000 and 2100),
  graduation_year smallint check (graduation_year is null or graduation_year between 2000 and 2100),
  daily_study_minutes integer check (daily_study_minutes is null or daily_study_minutes between 10 and 900),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vestibular_profiles enable row level security;

drop policy if exists vestibular_profiles_all_own on public.vestibular_profiles;
create policy vestibular_profiles_all_own on public.vestibular_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists vestibular_profiles_set_updated_at on public.vestibular_profiles;
create trigger vestibular_profiles_set_updated_at before update on public.vestibular_profiles
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------- objetivos ---
-- Um aluno pode mirar ENEM 2026 E FUVEST 2027 ao mesmo tempo; `priority`
-- ordena, e o `main_exam_id` do perfil é só quem manda no contador da home.
create table if not exists public.user_exam_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  target_year smallint check (target_year is null or target_year between 2000 and 2100),
  priority smallint not null default 1 check (priority between 1 and 5),
  target_course text check (target_course is null or length(btrim(target_course)) <= 120),
  target_score numeric(6, 2) check (target_score is null or target_score >= 0),
  created_at timestamptz not null default now()
);

create unique index if not exists user_exam_targets_uq on public.user_exam_targets (user_id, exam_id);

alter table public.user_exam_targets enable row level security;

drop policy if exists user_exam_targets_all_own on public.user_exam_targets;
create policy user_exam_targets_all_own on public.user_exam_targets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Nota escolar deixa de enxergar conteúdo de vestibular.
--
-- As três funções abaixo são as MESMAS de hoje, com um único acréscimo por
-- junção com `resources`: `and r.context = 'school'`. Nada mais mudou.
-- ============================================================================
create or replace function public.subject_scores(p_user_id uuid default auth.uid())
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  has_content boolean,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric,
  quizzes_done integer,
  simulados_done integer,
  content_completed integer,
  target_grade numeric,
  passing_grade numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_attempt as (
    select distinct on (qa.resource_id)
      qa.resource_id, qa.correct_count, qa.total_count
    from public.quiz_attempts qa
    where qa.user_id = p_user_id and qa.finished_at is not null
    order by qa.resource_id, qa.finished_at desc
  ),
  attempt_scored as (
    select
      r.subject_catalog_id,
      r.kind,
      la.correct_count::numeric / greatest(la.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight
    from latest_attempt la
    join public.resources r on r.id = la.resource_id
    where r.kind in ('quiz', 'simulado') and r.context = 'school'
  ),
  assessment as (
    select
      subject_catalog_id,
      sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score,
      count(*) filter (where kind = 'quiz') as quizzes_done,
      count(*) filter (where kind = 'simulado') as simulados_done
    from attempt_scored
    group by subject_catalog_id
  ),
  -- Atividade = conteúdo (resumo/podcast/vídeo/imagem) PUBLICADO e visível
  -- para este aluno — mesma regra de visibilidade de `resource_library()`:
  -- global (sem escola) ou da escola dele.
  content_available as (
    select r.subject_catalog_id, count(*) as content_total
    from public.resources r
    where r.kind in ('resumo', 'podcast', 'video', 'imagem') and r.context = 'school'
      and r.is_published
      and (r.school_id is null or r.school_id = public.current_school_id(p_user_id))
    group by r.subject_catalog_id
  ),
  content_done as (
    select r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem') and r.context = 'school'
    group by r.subject_catalog_id
  ),
  atividades as (
    select
      ca.subject_catalog_id,
      case
        when ca.content_total = 0 then null
        else round(coalesce(cd.content_completed, 0)::numeric / ca.content_total * 10, 2)
      end as atividades_score
    from content_available ca
    left join content_done cd on cd.subject_catalog_id = ca.subject_catalog_id
  )
  select
    s.id,
    s.name,
    s.color,
    s.catalog_id is not null,
    round(a.assessment_score, 2),
    coalesce(act.atividades_score, 0) * 10,
    case
      when a.assessment_score is not null and act.atividades_score is not null
        then round(a.assessment_score * 0.7 + act.atividades_score * 0.3, 2)
      when a.assessment_score is not null
        then round(a.assessment_score, 2)
    end,
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(cd.content_completed, 0)::integer,
    s.target_grade,
    6.0
  from public.subjects s
  left join assessment a on a.subject_catalog_id = s.catalog_id
  left join content_done cd on cd.subject_catalog_id = s.catalog_id
  left join atividades act on act.subject_catalog_id = s.catalog_id
  where s.user_id = p_user_id and s.archived_at is null
  order by s.sort_order, s.name;
$$;
comment on function public.subject_scores(uuid) is
  'Nota automática por matéria (70% avaliativo + 30% atividades concluídas) — substitui o boletim manual.';

grant execute on function public.subject_scores(uuid) to authenticated;
create or replace function public.performance_evolution(
  p_user_id uuid default auth.uid(),
  p_weeks integer default 12
)
returns table (
  week_start date,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with weeks as (
    select date_trunc('week', public.user_local_date(p_user_id))::date - (7 * gs) as week_start
    from generate_series(0, greatest(p_weeks, 1) - 1) as gs
  ),
  bucket as (
    select w.week_start, (w.week_start + 6) as week_end from weeks w
  ),
  attempts as (
    select
      b.week_start,
      qa.correct_count::numeric / greatest(qa.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight,
      row_number() over (
        partition by b.week_start, qa.resource_id
        order by qa.finished_at desc
      ) as rn
    from bucket b
    join public.quiz_attempts qa
      on qa.user_id = p_user_id and qa.finished_at is not null
      and qa.finished_at::date <= b.week_end
    join public.resources r on r.id = qa.resource_id and r.kind in ('quiz', 'simulado') and r.context = 'school'
  ),
  assessment as (
    select week_start, sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score
    from attempts
    where rn = 1
    group by week_start
  ),
  content as (
    select b.week_start, count(distinct rp.resource_id) as content_completed
    from bucket b
    join public.resource_progress rp
      on rp.user_id = p_user_id and rp.completed_at is not null
      and rp.completed_at::date <= b.week_end
    group by b.week_start
  ),
  regularity as (
    select b.week_start, count(distinct ss.local_date) as active_days
    from bucket b
    join public.study_sessions ss
      on ss.user_id = p_user_id
      and ss.local_date between (b.week_end - 13) and b.week_end
    group by b.week_start
  )
  select
    b.week_start,
    round(a.assessment_score, 2),
    round(
      least(1, coalesce(c.content_completed, 0) / 8.0) * 60
      + least(1, coalesce(r.active_days, 0) / 14.0) * 40
    , 1),
    case when a.assessment_score is not null then
      round(
        a.assessment_score * 0.7
        + (
            least(1, coalesce(c.content_completed, 0) / 8.0) * 60
            + least(1, coalesce(r.active_days, 0) / 14.0) * 40
          ) / 10 * 0.3
      , 2)
    end
  from bucket b
  left join assessment a on a.week_start = b.week_start
  left join content c on c.week_start = b.week_start
  left join regularity r on r.week_start = b.week_start
  order by b.week_start;
$$;
comment on function public.performance_evolution(uuid, integer) is
  'Nota geral acumulada, semana a semana — alimenta o gráfico de evolução em Desempenho.';

grant execute on function public.performance_evolution(uuid, integer) to authenticated;

-- ------------------------------------------------------------- simulado_history --
-- Uma linha por TENTATIVA (não a mais recente só) — o histórico mostra a
-- evolução entre tentativas do mesmo simulado, não só o resultado atual.
create or replace function public.simulado_history(p_user_id uuid default auth.uid())
returns table (
  attempt_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  correct_count integer,
  total_count integer,
  percent numeric,
  duration_seconds integer,
  finished_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    qa.id,
    r.id,
    r.title,
    s.id,
    s.name,
    s.color,
    qa.correct_count,
    qa.total_count,
    round(qa.correct_count::numeric / greatest(qa.total_count, 1) * 100, 1),
    qa.duration_seconds,
    qa.finished_at
  from public.quiz_attempts qa
  join public.resources r on r.id = qa.resource_id and r.kind = 'simulado' and r.context = 'school'
  left join public.subjects s on s.user_id = p_user_id and s.catalog_id = r.subject_catalog_id
  where qa.user_id = p_user_id and qa.finished_at is not null
  order by qa.finished_at desc;
$$;

-- ============================================================================
-- RPCs do Vestibular.
--
-- Todos os parâmetros numéricos são `integer`, nunca `smallint`: um literal
-- inteiro vindo do PostgREST não resolve contra parâmetro `smallint` e a
-- chamada falha com "function does not exist" (pegadinha já paga nesta base
-- em `rate_resource`). O cast pra coluna acontece aqui dentro.
-- ============================================================================

create or replace function public.save_vestibular_profile(
  p_main_exam_id uuid default null,
  p_target_year integer default null,
  p_graduation_year integer default null,
  p_daily_study_minutes integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('vestibular_enabled') then
    raise exception 'a área de vestibular está desativada' using errcode = '42501';
  end if;
  if p_main_exam_id is not null
     and not exists (select 1 from public.exams where id = p_main_exam_id and is_active) then
    raise exception 'vestibular inválido' using errcode = '22023';
  end if;

  insert into public.vestibular_profiles (
    user_id, main_exam_id, target_year, graduation_year, daily_study_minutes
  ) values (
    v_me, p_main_exam_id, p_target_year::smallint, p_graduation_year::smallint, p_daily_study_minutes
  )
  on conflict (user_id) do update set
    main_exam_id = excluded.main_exam_id,
    target_year = excluded.target_year,
    graduation_year = excluded.graduation_year,
    daily_study_minutes = excluded.daily_study_minutes;
end;
$$;

grant execute on function public.save_vestibular_profile(uuid, integer, integer, integer) to authenticated;

create or replace function public.get_vestibular_profile()
returns table (
  user_id uuid,
  main_exam_id uuid,
  main_exam_name text,
  main_exam_slug text,
  target_year smallint,
  graduation_year smallint,
  daily_study_minutes integer
)
language sql
stable
security definer
set search_path = public
as $$
  select vp.user_id, vp.main_exam_id, e.name, e.slug,
         vp.target_year, vp.graduation_year, vp.daily_study_minutes
  from public.vestibular_profiles vp
  left join public.exams e on e.id = vp.main_exam_id
  where vp.user_id = auth.uid();
$$;

grant execute on function public.get_vestibular_profile() to authenticated;

create or replace function public.set_exam_target(
  p_exam_id uuid,
  p_target_year integer default null,
  p_priority integer default 1,
  p_target_course text default null,
  p_target_score numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not exists (select 1 from public.exams where id = p_exam_id and is_active) then
    raise exception 'vestibular inválido' using errcode = '22023';
  end if;

  insert into public.user_exam_targets (user_id, exam_id, target_year, priority, target_course, target_score)
  values (
    v_me, p_exam_id, p_target_year::smallint,
    greatest(1, least(5, coalesce(p_priority, 1)))::smallint,
    nullif(btrim(coalesce(p_target_course, '')), ''), p_target_score
  )
  on conflict (user_id, exam_id) do update set
    target_year = excluded.target_year,
    priority = excluded.priority,
    target_course = excluded.target_course,
    target_score = excluded.target_score;
end;
$$;

grant execute on function public.set_exam_target(uuid, integer, integer, text, numeric) to authenticated;

create or replace function public.remove_exam_target(p_exam_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_exam_targets where user_id = auth.uid() and exam_id = p_exam_id;
$$;

grant execute on function public.remove_exam_target(uuid) to authenticated;

create or replace function public.list_exam_targets()
returns table (
  exam_id uuid,
  exam_name text,
  exam_slug text,
  target_year smallint,
  priority smallint,
  target_course text,
  target_score numeric,
  next_application_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.exam_id, e.name, e.slug, t.target_year, t.priority, t.target_course, t.target_score,
    (
      select min(ed.application_date) from public.exam_editions ed
      where ed.exam_id = t.exam_id and ed.application_date >= current_date
    )
  from public.user_exam_targets t
  join public.exams e on e.id = t.exam_id
  where t.user_id = auth.uid()
  order by t.priority, e.sort_order, e.name;
$$;

grant execute on function public.list_exam_targets() to authenticated;

-- Catálogo de provas + a próxima data conhecida de cada uma (null enquanto o
-- admin não cadastrar a edição — ver comentário de `exam_editions`).
create or replace function public.list_exams()
returns table (
  id uuid,
  slug text,
  name text,
  organization text,
  kind text,
  next_edition_year smallint,
  next_application_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.slug, e.name, e.organization, e.kind,
    nx.year, nx.application_date
  from public.exams e
  left join lateral (
    select ed.year, ed.application_date
    from public.exam_editions ed
    where ed.exam_id = e.id and ed.application_date >= current_date
    order by ed.application_date
    limit 1
  ) nx on true
  where e.is_active
  order by e.sort_order, e.name;
$$;

grant execute on function public.list_exams() to authenticated;

-- Conteúdo de vestibular visível pra este aluno. `can_view_resource` é a
-- MESMA função que já decide visibilidade de tudo (publicado + escola/global,
-- dono, visibilidade do IA Creator) — nenhuma regra nova de acesso nasce aqui.
create or replace function public.list_vestibular_resources(
  p_exam_id uuid default null,
  p_year integer default null,
  p_subject_catalog_id uuid default null,
  p_kind text default null,
  p_limit integer default 60
)
returns table (
  id uuid,
  kind text,
  title text,
  description text,
  subject_name text,
  subject_color text,
  exam_name text,
  edition_year smallint,
  difficulty text,
  question_count bigint,
  time_limit_seconds integer,
  my_best_percent numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id, r.kind, r.title, r.description,
    sc.name, sc.default_color,
    e.name, ed.year,
    r.difficulty,
    (select count(*) from public.questions q where q.resource_id = r.id),
    r.time_limit_seconds,
    (
      select max(round(qa.correct_count::numeric / greatest(qa.total_count, 1) * 100, 1))
      from public.quiz_attempts qa
      where qa.resource_id = r.id and qa.user_id = auth.uid() and qa.finished_at is not null
    )
  from public.resources r
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.exams e on e.id = r.exam_id
  left join public.exam_editions ed on ed.id = r.exam_edition_id
  where r.context = 'vestibular'
    and public.can_view_resource(r.id)
    and (p_exam_id is null or r.exam_id = p_exam_id)
    and (p_year is null or ed.year = p_year::smallint)
    and (p_subject_catalog_id is null or r.subject_catalog_id = p_subject_catalog_id)
    and (p_kind is null or r.kind = p_kind)
  order by ed.year desc nulls last, r.sort_order, r.title
  limit greatest(1, least(200, coalesce(p_limit, 60)));
$$;

grant execute on function public.list_vestibular_resources(uuid, integer, uuid, text, integer) to authenticated;

-- Painel do /vestibular: contagem regressiva do alvo + números que contam
-- SÓ conteúdo de vestibular (o espelho exato do que foi tirado da nota
-- escolar logo acima).
create or replace function public.vestibular_overview()
returns table (
  exam_name text,
  edition_year smallint,
  application_date date,
  days_until integer,
  questions_answered bigint,
  correct_answers bigint,
  accuracy_percent numeric,
  quizzes_done bigint,
  simulados_done bigint,
  essays_submitted bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  target as (
    select e.name, ed.year, ed.application_date
    from me
    join public.vestibular_profiles vp on vp.user_id = me.uid
    join public.exams e on e.id = vp.main_exam_id
    left join lateral (
      select ed2.year, ed2.application_date
      from public.exam_editions ed2
      where ed2.exam_id = e.id
        and (vp.target_year is null or ed2.year = vp.target_year)
        and ed2.application_date >= current_date
      order by ed2.application_date
      limit 1
    ) ed on true
  ),
  answers as (
    select ans.is_correct
    from me
    join public.quiz_attempts a on a.user_id = me.uid
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
    join public.quiz_answers ans on ans.attempt_id = a.id and ans.option_id is not null
  ),
  attempts as (
    select r.kind
    from me
    join public.quiz_attempts a on a.user_id = me.uid and a.finished_at is not null
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
  ),
  essays as (
    select count(*) as total
    from me
    join public.quiz_attempts a on a.user_id = me.uid
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
    join public.essay_submissions es on es.attempt_id = a.id and es.is_submitted
  )
  select
    (select name from target),
    (select year from target),
    (select application_date from target),
    (select (application_date - current_date)::integer from target),
    (select count(*) from answers),
    (select count(*) filter (where is_correct) from answers),
    (select case when count(*) = 0 then null
            else round(count(*) filter (where is_correct)::numeric / count(*) * 100, 1) end
     from answers),
    (select count(*) filter (where kind = 'quiz') from attempts),
    (select count(*) filter (where kind = 'simulado') from attempts),
    (select total from essays);
$$;

grant execute on function public.vestibular_overview() to authenticated;

-- ---------------------------------------------------------------- catálogo --
-- Só os NOMES, que são fato público. Nenhuma data é semeada aqui de
-- propósito: edição com data errada num contador regressivo é pior que
-- contador ausente (ver comentário de `exam_editions`).
insert into public.exams (slug, name, organization, kind, sort_order) values
  ('enem', 'ENEM', 'INEP', 'nacional', 10),
  ('fuvest', 'FUVEST', 'USP', 'vestibular', 20),
  ('unicamp', 'UNICAMP', 'Comvest', 'vestibular', 30),
  ('unesp', 'UNESP', 'VUNESP', 'vestibular', 40),
  ('ita', 'ITA', 'ITA', 'militar', 50),
  ('ime', 'IME', 'IME', 'militar', 60)
on conflict (slug) do nothing;

update public.feature_flags set enabled = true where key in ('vestibular_enabled', 'enem_enabled');

-- ─────────────────────────────────────────────────────────────────────
-- 20260919000200_vestibular_banco_questoes.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa Vestibular — Fase 1 · Banco de questões avulsas + player de prática
--
-- O problema que esta fase resolve: até aqui, responder questão de vestibular
-- exigia abrir uma PROVA inteira (`resources` → `quiz_attempts`). Mas o uso
-- real de quem estuda pra vestibular é "me dá 10 questões de Matemática
-- média que eu ainda não fiz" — um recorte que atravessa várias provas.
--
-- Por que uma sessão de prática NÃO é uma `quiz_attempts`: `quiz_attempts`
-- aponta pra UM `resources`, e uma questão pertence a um `resources` só
-- (FK). Montar um recorte de 10 questões de 4 provas diferentes dentro da
-- estrutura atual exigiria DUPLICAR linhas de `questions` — o que duplicaria
-- gabarito e quebraria a análise por questão (a mesma questão viraria dois
-- ids diferentes no histórico do aluno). Então a sessão de prática é uma
-- tabela própria, com o conjunto de questões congelado em `question_ids`.
--
-- O que NÃO foi duplicado: o gabarito continua saindo pelo mesmo caminho de
-- sempre. `practice_questions` devolve alternativa SEM `is_correct`, igual
-- `quiz_questions`; quem revela a resposta é `answer_practice_question`,
-- depois de gravar a escolha — e ela recusa reescrever uma resposta já dada,
-- a mesma trava anti-cola de `answer_quiz_question` em modo prática.
--
-- `question_ids` congelado na sessão (em vez de refiltrar a cada chamada)
-- também é o que faz "voltar pra questão 3" devolver a MESMA questão 3.
-- ============================================================================

alter table public.xp_events drop constraint if exists xp_events_source_type_check;
alter table public.xp_events add constraint xp_events_source_type_check
  check (source_type in (
    'task', 'routine', 'study_session', 'activity', 'achievement', 'system',
    'quiz', 'lesson', 'resource', 'social', 'practice'
  ));

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_ids uuid[] not null check (cardinality(question_ids) between 1 and 50),
  exam_id uuid references public.exams (id) on delete set null,
  subject_catalog_id uuid references public.subject_catalog (id) on delete set null,
  difficulty text check (difficulty is null or difficulty in ('facil', 'medio', 'anglo', 'dificil')),
  correct_count integer not null default 0,
  total_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists practice_sessions_user_idx
  on public.practice_sessions (user_id, started_at desc);

alter table public.practice_sessions enable row level security;

drop policy if exists practice_sessions_all_own on public.practice_sessions;
create policy practice_sessions_all_own on public.practice_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.practice_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  option_id uuid references public.question_options (id) on delete set null,
  is_correct boolean not null default false,
  time_spent_seconds integer not null default 0,
  answered_at timestamptz not null default now()
);

create unique index if not exists practice_answers_uq on public.practice_answers (session_id, question_id);
create index if not exists practice_answers_question_idx on public.practice_answers (question_id);

alter table public.practice_answers enable row level security;

-- Sem policy: leitura/escrita só pelas RPCs abaixo (é onde mora o gabarito).
-- Mesmo padrão de `quiz_answers`.

-- ----------------------------------------------------------------------------
-- Filtros disponíveis — só o que REALMENTE tem questão, pra nenhuma opção do
-- seletor devolver lista vazia.
-- ----------------------------------------------------------------------------
create or replace function public.practice_filters()
returns table (
  kind text,
  id uuid,
  name text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with visible as (
    select q.id as question_id, r.exam_id, coalesce(q.subject_catalog_id, r.subject_catalog_id) as subject_id
    from public.questions q
    join public.resources r on r.id = q.resource_id
    where r.context = 'vestibular' and public.can_view_resource(r.id)
  )
  select 'exam', e.id, e.name, count(*)
  from visible v join public.exams e on e.id = v.exam_id
  group by e.id, e.name
  union all
  select 'subject', sc.id, sc.name, count(*)
  from visible v join public.subject_catalog sc on sc.id = v.subject_id
  group by sc.id, sc.name
  order by 1, 3;
$$;

grant execute on function public.practice_filters() to authenticated;

-- ----------------------------------------------------------------------------
-- Início da sessão.
--
-- A seleção prioriza, nesta ordem: questão nunca respondida > questão que o
-- aluno ERROU > o resto. É o item #31 do plano ("não repetir sempre a mesma
-- questão") resolvido no lugar certo — na hora de escolher, não depois.
-- ----------------------------------------------------------------------------
create or replace function public.start_practice_session(
  p_exam_id uuid default null,
  p_subject_catalog_id uuid default null,
  p_difficulty text default null,
  p_question_count integer default 10
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_ids uuid[];
  v_id uuid;
  v_limit integer := greatest(1, least(50, coalesce(p_question_count, 10)));
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('vestibular_enabled') then
    raise exception 'a área de vestibular está desativada' using errcode = '42501';
  end if;

  select array_agg(x.question_id order by x.rank_bucket, random())
    into v_ids
  from (
    select
      q.id as question_id,
      case
        when hist.last_answer is null then 0          -- nunca respondida
        when hist.last_answer is false then 1         -- errou
        else 2                                        -- já acertou
      end as rank_bucket
    from public.questions q
    join public.resources r on r.id = q.resource_id
    left join lateral (
      select a.is_correct as last_answer
      from public.practice_answers a
      join public.practice_sessions s on s.id = a.session_id
      where a.question_id = q.id and s.user_id = v_me and a.option_id is not null
      order by a.answered_at desc
      limit 1
    ) hist on true
    where r.context = 'vestibular'
      and public.can_view_resource(r.id)
      and (p_exam_id is null or r.exam_id = p_exam_id)
      and (p_subject_catalog_id is null
           or coalesce(q.subject_catalog_id, r.subject_catalog_id) = p_subject_catalog_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct)
    order by rank_bucket, random()
    limit v_limit
  ) x;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'nenhuma questão encontrada com esses filtros' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, question_ids, exam_id, subject_catalog_id, difficulty, total_count)
  values (v_me, v_ids, p_exam_id, p_subject_catalog_id, p_difficulty, cardinality(v_ids))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_practice_session(uuid, uuid, text, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Questões da sessão — MESMO contrato de `quiz_questions`: nunca devolve
-- `is_correct`. `position` aqui é a posição dentro da sessão, não na prova.
-- ----------------------------------------------------------------------------
create or replace function public.practice_questions(p_session_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  difficulty text,
  topic_name text,
  subject_name text,
  exam_name text,
  edition_year smallint,
  options jsonb,
  my_option_id uuid,
  my_is_correct boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    ord.position::integer,
    q.statement,
    q.difficulty,
    t.name,
    coalesce(qsc.name, rsc.name),
    e.name,
    ed.year,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'body', o.body)
              order by o.position)
       from public.question_options o where o.question_id = q.id),
      '[]'::jsonb
    ),
    ans.option_id,
    case when ans.option_id is null then null else ans.is_correct end
  from public.practice_sessions s
  cross join lateral unnest(s.question_ids) with ordinality as ord(question_id, position)
  join public.questions q on q.id = ord.question_id
  join public.resources r on r.id = q.resource_id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  left join public.exams e on e.id = r.exam_id
  left join public.exam_editions ed on ed.id = r.exam_edition_id
  left join public.practice_answers ans on ans.session_id = s.id and ans.question_id = q.id
  where s.id = p_session_id and s.user_id = auth.uid()
  order by ord.position;
$$;

grant execute on function public.practice_questions(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Responder. Feedback imediato (é prática, não prova) — e por isso mesmo a
-- resposta não pode ser reescrita: a própria função acabou de contar qual
-- era a certa.
-- ----------------------------------------------------------------------------
create or replace function public.answer_practice_question(
  p_session_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_time_spent_seconds integer default 0
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_correct_option uuid;
  v_is_correct boolean;
begin
  if not exists (
    select 1 from public.practice_sessions s
    where s.id = p_session_id and s.user_id = v_me and s.finished_at is null
  ) then
    raise exception 'sessão inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.practice_sessions s
    where s.id = p_session_id and p_question_id = any (s.question_ids)
  ) then
    raise exception 'esta questão não pertence a esta sessão' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.practice_answers a
    where a.session_id = p_session_id and a.question_id = p_question_id and a.option_id is not null
  ) then
    raise exception 'esta questão já foi respondida' using errcode = '42501';
  end if;

  select o.id into v_correct_option
  from public.question_options o
  where o.question_id = p_question_id and o.is_correct
  limit 1;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  insert into public.practice_answers (session_id, question_id, option_id, is_correct, time_spent_seconds)
  values (p_session_id, p_question_id, p_option_id, v_is_correct, greatest(0, coalesce(p_time_spent_seconds, 0)))
  on conflict (session_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        time_spent_seconds = excluded.time_spent_seconds,
        answered_at = now();

  return query
  select v_is_correct, v_correct_option, q.explanation
  from public.questions q where q.id = p_question_id;
end;
$$;

grant execute on function public.answer_practice_question(uuid, uuid, uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Encerrar. XP por questão respondida (teto de 25 por sessão), dedup por
-- `source_id` = id da sessão — reabrir a mesma sessão nunca paga de novo.
-- ----------------------------------------------------------------------------
create or replace function public.finish_practice_session(p_session_id uuid)
returns table (correct_count integer, total_count integer, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_correct integer;
  v_total integer;
  v_xp integer := 0;
begin
  if not exists (
    select 1 from public.practice_sessions s where s.id = p_session_id and s.user_id = v_me
  ) then
    raise exception 'sessão não encontrada' using errcode = 'P0002';
  end if;

  select
    count(*) filter (where a.is_correct),
    (select cardinality(s.question_ids) from public.practice_sessions s where s.id = p_session_id)
  into v_correct, v_total
  from public.practice_answers a
  where a.session_id = p_session_id and a.option_id is not null;

  update public.practice_sessions s
  set finished_at = coalesce(s.finished_at, now()),
      correct_count = v_correct,
      total_count = v_total
  where s.id = p_session_id;

  v_xp := least(25, greatest(0, v_correct) * 2);
  if v_xp > 0 then
    v_xp := coalesce(
      public.award_xp(v_xp, 'Praticou questões de vestibular', 'practice', p_session_id, v_me),
      0
    );
  end if;

  return query select v_correct, v_total, v_xp;
end;
$$;

grant execute on function public.finish_practice_session(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Revisão pós-sessão: aqui o gabarito PODE aparecer, porque a sessão acabou.
-- ----------------------------------------------------------------------------
create or replace function public.practice_session_review(p_session_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  subject_name text,
  topic_name text,
  exam_name text,
  edition_year smallint,
  difficulty text,
  my_option_body text,
  correct_option_body text,
  is_correct boolean,
  explanation text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    ord.position::integer,
    q.statement,
    coalesce(qsc.name, rsc.name),
    t.name,
    e.name,
    ed.year,
    q.difficulty,
    (select o.body from public.question_options o where o.id = ans.option_id),
    (select o.body from public.question_options o where o.question_id = q.id and o.is_correct),
    coalesce(ans.is_correct, false),
    q.explanation
  from public.practice_sessions s
  cross join lateral unnest(s.question_ids) with ordinality as ord(question_id, position)
  join public.questions q on q.id = ord.question_id
  join public.resources r on r.id = q.resource_id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  left join public.exams e on e.id = r.exam_id
  left join public.exam_editions ed on ed.id = r.exam_edition_id
  left join public.practice_answers ans on ans.session_id = s.id and ans.question_id = q.id
  where s.id = p_session_id and s.user_id = auth.uid() and s.finished_at is not null
  order by ord.position;
$$;

grant execute on function public.practice_session_review(uuid) to authenticated;

-- Últimas sessões, pra tela inicial do banco de questões.
create or replace function public.list_practice_sessions(p_limit integer default 10)
returns table (
  id uuid,
  exam_name text,
  subject_name text,
  correct_count integer,
  total_count integer,
  started_at timestamptz,
  finished_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, e.name, sc.name, s.correct_count, s.total_count, s.started_at, s.finished_at
  from public.practice_sessions s
  left join public.exams e on e.id = s.exam_id
  left join public.subject_catalog sc on sc.id = s.subject_catalog_id
  where s.user_id = auth.uid()
  order by s.started_at desc
  limit greatest(1, least(50, coalesce(p_limit, 10)));
$$;

grant execute on function public.list_practice_sessions(integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- seed.sql
-- ─────────────────────────────────────────────────────────────────────

-- ============================================================================
-- Nexa — seed: shared reference data
--
-- Only catalog data lives here: never a row that belongs to one person. The
-- subject list from README Parte 1 ships as reference data so onboarding is a
-- few taps, and a student can still add anything the catalog does not have.
--
-- `color` values are palette tokens resolved by src/lib/design/subject-colors.ts,
-- not hex codes: charts, badges and dark mode stay legible by construction.
-- ============================================================================

insert into public.subject_catalog (slug, name, area, default_color, default_icon, sort_order)
values
  -- Linguagens
  ('lingua-portuguesa',       'Língua Portuguesa',        'linguagens',  'rose',    'book-open-text',   10),
  ('producao-de-texto',       'Produção de Texto',        'linguagens',  'pink',    'pen-line',         20),
  ('literatura',              'Literatura',               'linguagens',  'fuchsia', 'library-big',      30),
  ('ingles',                  'Inglês',                   'linguagens',  'violet',  'languages',        40),
  ('espanhol',                'Espanhol',                 'linguagens',  'purple',  'languages',        50),
  ('artes',                   'Artes',                    'linguagens',  'orange',  'palette',          60),
  ('educacao-fisica',         'Educação Física',          'linguagens',  'lime',    'volleyball',       70),
  -- Matemática
  ('matematica',              'Matemática',               'matematica',  'blue',    'sigma',           110),
  ('educacao-financeira',     'Educação Financeira',      'matematica',  'emerald', 'piggy-bank',      120),
  -- Ciências da natureza
  ('biologia',                'Biologia',                 'ciencias',    'green',   'leaf',            210),
  ('fisica',                  'Física',                   'ciencias',    'cyan',    'atom',            220),
  ('quimica',                 'Química',                  'ciencias',    'teal',    'flask-conical',   230),
  ('ciencias',                'Ciências',                 'ciencias',    'green',   'microscope',      240),
  ('iniciacao-cientifica',    'Iniciação Científica',     'ciencias',    'sky',     'microscope',      250),
  -- Humanas
  ('historia',                'História',                 'humanas',     'amber',   'landmark',        310),
  ('geografia',               'Geografia',                'humanas',     'yellow',  'globe-2',         320),
  ('filosofia',               'Filosofia',                'humanas',     'slate',   'brain',           330),
  ('sociologia',              'Sociologia',               'humanas',     'stone',   'users',           340),
  ('educacao-socioemocional', 'Educação Socioemocional',  'humanas',     'red',     'heart-handshake',  350),
  ('projeto-de-vida',         'Projeto de Vida',          'humanas',     'orange',  'compass',         360),
  ('ensino-religioso',        'Ensino Religioso',         'humanas',     'stone',   'hand-heart',      370),
  -- Tecnologia
  ('pensamento-computacional','Pensamento Computacional', 'tecnologia',  'indigo',  'binary',          410),
  ('robotica',                'Robótica',                 'tecnologia',  'indigo',  'bot',             420),
  ('empreendedorismo',        'Empreendedorismo',         'tecnologia',  'emerald', 'rocket',          430)
on conflict (slug) do update
  set name = excluded.name,
      area = excluded.area,
      default_color = excluded.default_color,
      default_icon = excluded.default_icon,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------- achievements --
-- Rows, not code: a new achievement ships without a deploy.
-- Tone follows README Parte 3 — every one of these rewards showing up, never
-- punishes falling behind.
-- `first_steps` tem xp_reward 0 de propósito: os 50 XP de "configurar o
-- Nexa" já são pagos direto pela função de onboarding
-- (`award_xp(50, 'Configurou o Nexa', ...)`, migração 0907_3) — o motor de
-- conquistas (0910_2) só carimba o selo no mesmo instante, sem pagar de novo.
-- `first_grade`/`ten_grades` (métrica `grades_logged`) ficam inativas: nota
-- manual não existe mais desde o boletim automático.
insert into public.achievements (id, name, description, icon, category, metric, threshold, xp_reward, rarity, is_active, sort_order)
values
  ('first_steps',    'Primeiros passos',   'Você configurou o Nexa. Bem-vindo.',                'sparkles',    'geral',        'onboarded',        1,  0,   'comum',    true,  10),
  ('first_grade',    'Primeira nota',      'Você registrou sua primeira nota.',                 'clipboard-check', 'notas',    'grades_logged',    1,  30,  'comum',    false, 20),
  ('ten_grades',     'Boletim em dia',     'Dez notas registradas.',                            'clipboard-list',  'notas',    'grades_logged',   10, 100, 'rara',     false, 30),
  ('first_session',  'Cronômetro ligado',  'Sua primeira sessão de estudo.',                    'timer',       'estudo',       'sessions',         1,  30,  'comum',    true,  40),
  ('study_10h',      '10 horas de foco',   'Dez horas estudadas no Nexa.',                      'hourglass',   'estudo',       'study_minutes',  600, 200,  'rara',     true,  50),
  ('study_50h',      '50 horas de foco',   'Cinquenta horas estudadas. Isso é constância.',     'flame',       'estudo',       'study_minutes', 3000, 500,  'epica',    true,  60),
  ('streak_3',       'Três dias seguidos', 'Você apareceu três dias em sequência.',             'flame',       'constancia',   'streak_days',      3,  60,  'comum',    true,  70),
  ('streak_7',       'Uma semana inteira', 'Sete dias seguidos de presença.',                   'flame',       'constancia',   'streak_days',      7, 150,  'rara',     true,  80),
  ('streak_30',      'Um mês de rotina',   'Trinta dias seguidos. Virou hábito.',               'trophy',      'constancia',   'streak_days',     30, 600,  'epica',    true,  90),
  ('checklist_day',  'Dia completo',       'Você concluiu todo o checklist de um dia.',         'check-check', 'organizacao',  'perfect_days',     1,  40,  'comum',    true,  100),
  ('checklist_week', 'Semana completa',    'Sete dias de checklist concluído.',                 'calendar-check', 'organizacao', 'perfect_days',   7, 250, 'rara',     true,  110),
  ('tasks_25',       'Nada esquecido',     'Vinte e cinco tarefas concluídas.',                 'list-checks', 'organizacao',  'tasks_done',      25, 200,  'rara',     true,  120),
  ('goal_reached',   'Meta batida',        'Uma disciplina alcançou a meta que você definiu.',  'target',      'notas',        'goals_reached',    1, 300,  'rara',     true,  130),
  ('all_passing',    'Tudo em ordem',      'Todas as disciplinas acima da média no bimestre.',  'shield-check','notas',        'all_passing',      1, 400,  'epica',    true,  140),
  ('first_simulado',       'Primeiro simulado',   'Você terminou seu primeiro simulado.',              'clipboard-check', 'estudo', 'simulados_done',     1,  100, 'comum',    true, 150),
  ('questions_100',        '100 questões',        'Cem questões respondidas em quizzes e simulados.',  'help-circle',     'estudo', 'questions_answered', 100, 150, 'comum',    true, 160),
  ('questions_500',        '500 questões',        'Quinhentas questões — o hábito pegou.',             'help-circle',     'estudo', 'questions_answered', 500, 400, 'rara',     true, 170),
  ('questions_1000',       '1000 questões',       'Mil questões respondidas. Sério.',                  'help-circle',     'estudo', 'questions_answered', 1000, 800, 'epica',   true, 180),
  ('first_subject_graded', 'Primeira matéria',    'Uma matéria já tem nota automática calculada.',     'graduation-cap',  'notas',  'subjects_graded',    1,  80,  'comum',    true, 190),
  ('study_100h',           '100 horas de foco',   'Cem horas estudadas no Nexa.',                      'hourglass',       'estudo', 'study_minutes',      6000, 700, 'rara',    true, 200),
  ('study_500h',           '500 horas de foco',   'Quinhentas horas. Isso é outro nível.',              'flame',           'estudo', 'study_minutes',      30000, 1500, 'lendaria', true, 210)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      metric = excluded.metric,
      threshold = excluded.threshold,
      xp_reward = excluded.xp_reward,
      rarity = excluded.rarity,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order;

-- ============================================================================
-- Biblioteca inicial · conteúdo global (school_id null)
--
-- Existe para que uma instalação nova NÃO abra a aba Estudar vazia. Um app de
-- estudo que estreia sem nada para estudar não é avaliável: não dá para saber
-- se a tela está certa, se a trilha destrava, se o simulado corrige. Isto é o
-- mínimo para que tudo isso seja verificável no primeiro minuto.
--
-- Ids fixos e `on conflict do nothing` — reaplicar o seed não duplica nada.
-- ============================================================================

insert into public.content_topics (id, subject_catalog_id, name, slug, sort_order)
select v.id, sc.id, v.name, v.slug, v.sort_order
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'fisica',    'Cinemática',       'cinematica',       1),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'fisica',    'Leis de Newton',   'leis-de-newton',   2),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'historia',  'Era Vargas',       'era-vargas',       1),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'biologia',  'Ciclos biogeoquímicos', 'ciclos',      1),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'matematica','Funções',          'funcoes',          1)
) as v(id, subject_slug, name, slug, sort_order)
join public.subject_catalog sc on sc.slug = v.subject_slug
on conflict (id) do nothing;

insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description, body,
   duration_seconds, difficulty, xp_reward, is_published, sort_order)
select v.id, sc.id, v.topic_id, v.kind, v.title, v.subtitle, v.description, v.body,
       v.duration_seconds, v.difficulty, v.xp_reward, true, v.sort_order
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'fisica', '10000000-0000-4000-8000-000000000001'::uuid,
   'resumo', 'Cinemática: movimento uniforme e uniformemente variado',
   'Física · 7 min de leitura', 'A base de tudo que cai na primeira prova do bimestre.',
   E'No **movimento uniforme** a velocidade não muda, então a posição cresce em linha reta com o tempo. É o caso mais simples e serve de base para tudo o que vem depois.\n\nNo **movimento uniformemente variado** a aceleração é constante, e a velocidade passa a variar de forma linear. Daí vêm as três equações que costumam aparecer na prova.\n\n### Equações que caem na prova\n\n- v = v₀ + a·t\n- s = s₀ + v₀·t + a·t²/2\n- v² = v₀² + 2·a·Δs\n\nNa **queda livre** a aceleração é a da gravidade, cerca de 9,8 m/s². Um corpo solto do repouso ganha 9,8 m/s de velocidade a cada segundo — e é por isso que a queda livre é só um MUV com a aceleração já conhecida.\n\n> Pegadinha clássica: massa não muda a queda. Uma pedra e uma pena caem juntas no vácuo.',
   420, 'medio', 20, 1),

  ('20000000-0000-4000-8000-000000000002'::uuid, 'historia', '10000000-0000-4000-8000-000000000003'::uuid,
   'resumo', 'Era Vargas: da Revolução de 1930 ao fim do Estado Novo',
   'História · 9 min de leitura', 'Os três períodos, sem decorar data solta.',
   E'A **Era Vargas** vai de 1930 a 1945 e se divide em três períodos.\n\n### Governo Provisório (1930–1934)\n\nVargas chega ao poder pela Revolução de 1930, que encerra a República Velha e a política do café com leite. Governa por decreto.\n\n### Governo Constitucional (1934–1937)\n\nA Constituição de 1934 traz voto feminino e legislação trabalhista. É o período mais curto e mais instável.\n\n### Estado Novo (1937–1945)\n\nO golpe de 1937 instaura a ditadura, com a Constituição outorgada — a "Polaca". Censura pelo DIP, sindicatos atrelados ao Estado e a CLT em 1943.\n\n> O que a prova cobra: ligar cada ano ao que ele significa. 1930 é a Revolução; 1937 é o Estado Novo; 1945 é a queda; 1954 é o suicídio, já no segundo governo.',
   540, 'medio', 20, 1),

  ('20000000-0000-4000-8000-000000000003'::uuid, 'biologia', '10000000-0000-4000-8000-000000000004'::uuid,
   'resumo', 'Ciclo do carbono em cinco passos',
   'Biologia · 5 min de leitura', 'Como o carbono circula entre atmosfera, seres vivos, solo e oceano.',
   E'O carbono circula entre quatro reservatórios: **atmosfera**, **seres vivos**, **solo** e **oceano**.\n\n1. A fotossíntese retira CO₂ da atmosfera e o fixa em matéria orgânica.\n2. A respiração devolve parte desse carbono como CO₂.\n3. A decomposição libera o carbono dos organismos mortos.\n4. Em condições específicas, a matéria orgânica vira combustível fóssil ao longo de milhões de anos.\n5. A queima desses combustíveis devolve à atmosfera, em décadas, o que levou eras para ser guardado.\n\nO desequilíbrio atual está no passo 5: entra mais CO₂ do que a fotossíntese e o oceano conseguem retirar.',
   300, 'facil', 15, 1)
) as v(id, subject_slug, topic_id, kind, title, subtitle, description, body, duration_seconds, difficulty, xp_reward, sort_order)
join public.subject_catalog sc on sc.slug = v.subject_slug
on conflict (id) do nothing;

-- Simulado de Cinemática · 4 questões
insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description,
   difficulty, time_limit_seconds, xp_reward, is_published, sort_order)
select '20000000-0000-4000-8000-000000000010', sc.id, '10000000-0000-4000-8000-000000000001',
       'simulado', 'Simulado de Cinemática', 'Física · 4 questões',
       'Movimento uniforme, MUV e queda livre no formato da prova.',
       'medio', 1200, 120, true, 1
from public.subject_catalog sc where sc.slug = 'fisica'
on conflict (id) do nothing;

-- Quiz rápido de Era Vargas · 3 questões
insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description,
   difficulty, xp_reward, is_published, sort_order)
select '20000000-0000-4000-8000-000000000011', sc.id, '10000000-0000-4000-8000-000000000003',
       'quiz', 'Quiz rápido · Era Vargas', 'História · 3 questões · 4 min',
       'Feedback na hora, com o porquê de cada resposta.',
       'facil', 45, true, 1
from public.subject_catalog sc where sc.slug = 'historia'
on conflict (id) do nothing;

insert into public.questions (id, resource_id, topic_id, position, statement, explanation, difficulty)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 1,
   'Um carro parte do repouso com aceleração constante de 2 m/s². Qual a velocidade após 6 segundos?',
   'v = v₀ + a·t. Com v₀ = 0, a = 2 e t = 6: v = 0 + 2 · 6 = 12 m/s.', 'facil'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 2,
   'No movimento uniforme, como a posição varia com o tempo?',
   'Velocidade constante significa que a posição cresce em taxa constante — ou seja, linearmente.', 'facil'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 3,
   'Um corpo cai do repouso. Desprezando a resistência do ar, qual a velocidade após 3 s? (g = 10 m/s²)',
   'Queda livre é MUV com a = g. v = 0 + 10 · 3 = 30 m/s.', 'medio'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 4,
   'Duas esferas de massas diferentes são soltas da mesma altura no vácuo. O que acontece?',
   'No vácuo não há resistência do ar, e a aceleração da gravidade não depende da massa: as duas chegam juntas.', 'medio'),

  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 1,
   'Em que ano começou o Estado Novo?',
   'O Estado Novo começa em 1937, com o golpe e a Constituição outorgada. 1930 é a Revolução; 1945 é o fim do período; 1954 é o suicídio de Vargas.', 'facil'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 2,
   'Qual documento consolidou a legislação trabalhista em 1943?',
   'A CLT — Consolidação das Leis do Trabalho — reuniu em um texto único a legislação trabalhista construída ao longo da Era Vargas.', 'facil'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 3,
   'O que a Revolução de 1930 encerrou?',
   'A República Velha e o arranjo do café com leite, em que São Paulo e Minas alternavam a presidência.', 'medio')
on conflict (id) do nothing;

insert into public.question_options (question_id, position, body, is_correct) values
  ('30000000-0000-4000-8000-000000000001', 1, '6 m/s', false),
  ('30000000-0000-4000-8000-000000000001', 2, '12 m/s', true),
  ('30000000-0000-4000-8000-000000000001', 3, '18 m/s', false),
  ('30000000-0000-4000-8000-000000000001', 4, '36 m/s', false),

  ('30000000-0000-4000-8000-000000000002', 1, 'Linearmente', true),
  ('30000000-0000-4000-8000-000000000002', 2, 'Exponencialmente', false),
  ('30000000-0000-4000-8000-000000000002', 3, 'De forma quadrática', false),
  ('30000000-0000-4000-8000-000000000002', 4, 'Não varia', false),

  ('30000000-0000-4000-8000-000000000003', 1, '10 m/s', false),
  ('30000000-0000-4000-8000-000000000003', 2, '20 m/s', false),
  ('30000000-0000-4000-8000-000000000003', 3, '30 m/s', true),
  ('30000000-0000-4000-8000-000000000003', 4, '45 m/s', false),

  ('30000000-0000-4000-8000-000000000004', 1, 'A mais pesada chega primeiro', false),
  ('30000000-0000-4000-8000-000000000004', 2, 'Chegam juntas', true),
  ('30000000-0000-4000-8000-000000000004', 3, 'A mais leve chega primeiro', false),
  ('30000000-0000-4000-8000-000000000004', 4, 'Depende do formato', false),

  ('30000000-0000-4000-8000-000000000010', 1, '1930', false),
  ('30000000-0000-4000-8000-000000000010', 2, '1937', true),
  ('30000000-0000-4000-8000-000000000010', 3, '1945', false),
  ('30000000-0000-4000-8000-000000000010', 4, '1954', false),

  ('30000000-0000-4000-8000-000000000011', 1, 'A Constituição de 1934', false),
  ('30000000-0000-4000-8000-000000000011', 2, 'A CLT', true),
  ('30000000-0000-4000-8000-000000000011', 3, 'O Ato Institucional nº 1', false),
  ('30000000-0000-4000-8000-000000000011', 4, 'A Lei Áurea', false),

  ('30000000-0000-4000-8000-000000000012', 1, 'O Império', false),
  ('30000000-0000-4000-8000-000000000012', 2, 'A República Velha', true),
  ('30000000-0000-4000-8000-000000000012', 3, 'A ditadura militar', false),
  ('30000000-0000-4000-8000-000000000012', 4, 'O Estado Novo', false)
on conflict do nothing;

-- Trilha de Física: três lições encadeadas, cada uma com o material dentro.
insert into public.tracks (id, subject_catalog_id, title, description, is_published, sort_order)
select '40000000-0000-4000-8000-000000000001', sc.id, 'Trilha de Física',
       'Do movimento uniforme às Leis de Newton, uma lição por vez.', true, 1
from public.subject_catalog sc where sc.slug = 'fisica'
on conflict (id) do nothing;

insert into public.track_sections (id, track_id, position, title) values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1, 'Assunto 1 · Cinemática')
on conflict (id) do nothing;

insert into public.track_lessons (id, section_id, position, title, description, estimated_minutes, xp_reward, unlock_after_lesson_id) values
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 1,
   'Movimento uniforme', 'Resumo e quiz para fixar a base.', 12, 20, null),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', 2,
   'Movimento variado (MUV)', 'As três equações que caem na prova.', 15, 20,
   '42000000-0000-4000-8000-000000000001'),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000001', 3,
   'Queda livre', 'MUV com a aceleração já conhecida.', 10, 25,
   '42000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.track_lesson_resources (lesson_id, resource_id, position) values
  ('42000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1),
  ('42000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000010', 1)
on conflict do nothing;
