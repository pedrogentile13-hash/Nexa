-- ============================================================================
-- Nexa — setup completo do banco, em um arquivo só
--
-- COMO USAR
--   1. Abra seu projeto no Supabase
--   2. Menu lateral → SQL Editor → New query
--   3. Cole TUDO isto e clique em Run
--
-- É seguro rodar em um projeto novo e vazio. Cria as 20 tabelas, as políticas
-- de RLS, as 5 views de cálculo, as funções e os dados de catálogo
-- (disciplinas e conquistas).
--
-- Gerado a partir de supabase/migrations/ + supabase/seed.sql — não edite aqui,
-- edite os arquivos originais e gere de novo.
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
create table public.schools (
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

create index schools_name_trgm_idx on public.schools using gin (name gin_trgm_ops);
create index schools_state_idx on public.schools (state) where state is not null;

create trigger schools_set_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

alter table public.schools enable row level security;

create policy schools_select_authenticated on public.schools
  for select to authenticated using (true);

create policy schools_insert_own on public.schools
  for insert to authenticated with check (created_by = auth.uid() and is_verified = false);

create policy schools_update_own_unverified on public.schools
  for update to authenticated
  using (created_by = auth.uid() and is_verified = false)
  with check (created_by = auth.uid() and is_verified = false);

-- --------------------------------------------------------------- profiles --
create table public.profiles (
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

create index profiles_school_id_idx on public.profiles (school_id) where school_id is not null;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

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
create table public.academic_years (
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

create index academic_years_user_idx on public.academic_years (user_id);
-- At most one active year per user.
create unique index academic_years_one_active_uq
  on public.academic_years (user_id) where is_active;

create trigger academic_years_set_updated_at before update on public.academic_years
  for each row execute function public.set_updated_at();

alter table public.academic_years enable row level security;

create policy academic_years_all_own on public.academic_years
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ terms --
-- Bimestre / trimestre / semestre — the shape is data, not code.
create table public.terms (
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

create index terms_user_idx on public.terms (user_id);
create index terms_year_idx on public.terms (academic_year_id);
-- "Which term is today in?" — the single hottest calendar lookup.
create index terms_user_range_idx on public.terms (user_id, starts_on, ends_on);

create trigger terms_set_updated_at before update on public.terms
  for each row execute function public.set_updated_at();

alter table public.terms enable row level security;

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
create table public.subject_catalog (
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

create index subject_catalog_active_idx on public.subject_catalog (sort_order) where is_active;
create index subject_catalog_name_trgm_idx on public.subject_catalog using gin (name gin_trgm_ops);

alter table public.subject_catalog enable row level security;

-- Read-only reference data. Writes happen through migrations/seed only.
create policy subject_catalog_select_authenticated on public.subject_catalog
  for select to authenticated using (is_active);

-- --------------------------------------------------------------- subjects --
create table public.subjects (
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

create index subjects_user_idx on public.subjects (user_id) where archived_at is null;
create index subjects_user_sort_idx on public.subjects (user_id, sort_order);
-- No two active subjects with the same name for the same student.
create unique index subjects_user_name_active_uq
  on public.subjects (user_id, lower(btrim(name))) where archived_at is null;

create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;

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
create table public.grading_schemes (
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

create index grading_schemes_user_idx on public.grading_schemes (user_id);
create unique index grading_schemes_one_default_uq
  on public.grading_schemes (user_id) where is_default;

create trigger grading_schemes_set_updated_at before update on public.grading_schemes
  for each row execute function public.set_updated_at();

alter table public.grading_schemes enable row level security;

create policy grading_schemes_all_own on public.grading_schemes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------- grading_scheme_categories --
-- PB 35% · VA 35% · Qualitativa 30% — as data, per the spec.
create table public.grading_scheme_categories (
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

create index gsc_scheme_idx on public.grading_scheme_categories (scheme_id, sequence);
create index gsc_user_idx on public.grading_scheme_categories (user_id);

create trigger gsc_set_updated_at before update on public.grading_scheme_categories
  for each row execute function public.set_updated_at();

alter table public.grading_scheme_categories enable row level security;

create policy gsc_all_own on public.grading_scheme_categories
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------- subject_terms --
-- One row per subject per term: the unit every average is computed over.
create table public.subject_terms (
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

create index subject_terms_user_idx on public.subject_terms (user_id);
create index subject_terms_term_idx on public.subject_terms (term_id);
create index subject_terms_subject_idx on public.subject_terms (subject_id);

create trigger subject_terms_set_updated_at before update on public.subject_terms
  for each row execute function public.set_updated_at();

alter table public.subject_terms enable row level security;

create policy subject_terms_all_own on public.subject_terms
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------- activities --
-- The spec called this `assessments`; "activity" is what it actually holds —
-- one graded item (lista, trabalho, prova) inside a category.
create table public.activities (
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

create index activities_user_idx on public.activities (user_id);
create index activities_subject_term_idx on public.activities (subject_term_id);
create index activities_category_idx on public.activities (category_id);
-- Drives "próximas provas / próximas entregas" on the Hoje screen.
create index activities_user_due_pending_idx
  on public.activities (user_id, due_date)
  where score is null and due_date is not null;
create index activities_replaces_idx
  on public.activities (replaces_activity_id) where replaces_activity_id is not null;

create trigger activities_set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

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
create table public.routines (
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

create index routines_user_active_idx on public.routines (user_id, sort_order) where is_active;

create trigger routines_set_updated_at before update on public.routines
  for each row execute function public.set_updated_at();

alter table public.routines enable row level security;

create policy routines_all_own on public.routines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------- routine_completions --
create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  local_date date not null,
  count smallint not null default 1 check (count >= 1),
  completed_at timestamptz not null default now(),
  constraint routine_completions_once_per_day_uq unique (routine_id, local_date)
);

create index routine_completions_user_date_idx
  on public.routine_completions (user_id, local_date desc);

alter table public.routine_completions enable row level security;

create policy routine_completions_all_own on public.routine_completions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ tasks --
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Nullable: "levar atestado" is a real task with no subject.
  subject_id uuid references public.subjects (id) on delete set null,
  -- Links a task to what it prepares for ("estudar para a PB de Química"),
  -- which is what lets the Hoje ranking inherit the activity's weight.
  activity_id uuid references public.activities (id) on delete cascade,
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

create index tasks_user_open_due_idx
  on public.tasks (user_id, due_date) where completed_at is null;
create index tasks_user_subject_idx on public.tasks (user_id, subject_id);
create index tasks_activity_idx on public.tasks (activity_id) where activity_id is not null;

create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy tasks_all_own on public.tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------- study_sessions --
-- started_at/ended_at (not just `duration`) so the timer can be paused,
-- resumed and recovered after the app is killed — an iPhone will do that.
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  activity_id uuid references public.activities (id) on delete set null,
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

create index study_sessions_user_date_idx on public.study_sessions (user_id, local_date desc);
create index study_sessions_user_subject_idx on public.study_sessions (user_id, subject_id);
-- At most one running timer per user.
create unique index study_sessions_one_running_uq
  on public.study_sessions (user_id) where ended_at is null;

create trigger study_sessions_set_updated_at before update on public.study_sessions
  for each row execute function public.set_updated_at();

alter table public.study_sessions enable row level security;

create policy study_sessions_all_own on public.study_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------------------- timetable_slots --
-- The weekly class schedule. This is what upgrades "Hoje" from a due-date list
-- to something that knows you have Matemática today.
create table public.timetable_slots (
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

create index timetable_slots_user_day_idx
  on public.timetable_slots (user_id, day_of_week, starts_at);

create trigger timetable_slots_set_updated_at before update on public.timetable_slots
  for each row execute function public.set_updated_at();

alter table public.timetable_slots enable row level security;

create policy timetable_slots_all_own on public.timetable_slots
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ attachments --
-- Backs "Resumos / Exercícios / Arquivos" per subject. `content` exists because
-- most resumos are typed in the app, not uploaded as a file.
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete cascade,
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

create index attachments_user_subject_idx on public.attachments (user_id, subject_id, kind);
create index attachments_activity_idx on public.attachments (activity_id) where activity_id is not null;

create trigger attachments_set_updated_at before update on public.attachments
  for each row execute function public.set_updated_at();

alter table public.attachments enable row level security;

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
create table public.user_stats (
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

create trigger user_stats_set_updated_at before update on public.user_stats
  for each row execute function public.set_updated_at();

alter table public.user_stats enable row level security;

-- Read-only for the client. No INSERT/UPDATE/DELETE policy on purpose.
create policy user_stats_select_own on public.user_stats
  for select to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------------- xp_events --
create table public.xp_events (
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

create index xp_events_user_date_idx on public.xp_events (user_id, local_date desc);
-- Idempotency: awarding the same source twice is a no-op, so a double-tapped
-- checkbox or a retried Server Action cannot inflate XP.
create unique index xp_events_source_uq
  on public.xp_events (user_id, source_type, source_id, reason)
  where source_id is not null;

alter table public.xp_events enable row level security;

create policy xp_events_select_own on public.xp_events
  for select to authenticated using (user_id = auth.uid());

-- ----------------------------------------------------------- achievements --
create table public.achievements (
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

create policy achievements_select_authenticated on public.achievements
  for select to authenticated using (is_active);

-- ------------------------------------------------------ user_achievements --
create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index user_achievements_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc) where unlocked_at is not null;

create trigger user_achievements_set_updated_at before update on public.user_achievements
  for each row execute function public.set_updated_at();

alter table public.user_achievements enable row level security;

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
create view public.v_subject_terms_resolved
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
create view public.v_activities_effective
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
create view public.v_category_averages
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
create view public.v_subject_term_averages
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
create view public.v_term_summary
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
-- seed.sql — disciplinas e conquistas
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
insert into public.achievements (id, name, description, icon, category, metric, threshold, xp_reward, sort_order)
values
  ('first_steps',    'Primeiros passos',   'Você configurou o Nexa. Bem-vindo.',                'sparkles',    'geral',        'onboarded',        1,  50,  10),
  ('first_grade',    'Primeira nota',      'Você registrou sua primeira nota.',                 'clipboard-check', 'notas',    'grades_logged',    1,  30,  20),
  ('ten_grades',     'Boletim em dia',     'Dez notas registradas.',                            'clipboard-list',  'notas',    'grades_logged',   10, 100,  30),
  ('first_session',  'Cronômetro ligado',  'Sua primeira sessão de estudo.',                    'timer',       'estudo',       'sessions',         1,  30,  40),
  ('study_10h',      '10 horas de foco',   'Dez horas estudadas no Nexa.',                      'hourglass',   'estudo',       'study_minutes',  600, 200,  50),
  ('study_50h',      '50 horas de foco',   'Cinquenta horas estudadas. Isso é constância.',     'flame',       'estudo',       'study_minutes', 3000, 500,  60),
  ('streak_3',       'Três dias seguidos', 'Você apareceu três dias em sequência.',             'flame',       'constancia',   'streak_days',      3,  60,  70),
  ('streak_7',       'Uma semana inteira', 'Sete dias seguidos de presença.',                   'flame',       'constancia',   'streak_days',      7, 150,  80),
  ('streak_30',      'Um mês de rotina',   'Trinta dias seguidos. Virou hábito.',               'trophy',      'constancia',   'streak_days',     30, 600,  90),
  ('checklist_day',  'Dia completo',       'Você concluiu todo o checklist de um dia.',         'check-check', 'organizacao',  'perfect_days',     1,  40, 100),
  ('checklist_week', 'Semana completa',    'Sete dias de checklist concluído.',                 'calendar-check', 'organizacao', 'perfect_days',   7, 250, 110),
  ('tasks_25',       'Nada esquecido',     'Vinte e cinco tarefas concluídas.',                 'list-checks', 'organizacao',  'tasks_done',      25, 200, 120),
  ('goal_reached',   'Meta batida',        'Uma disciplina alcançou a meta que você definiu.',  'target',      'notas',        'goals_reached',    1, 300, 130),
  ('all_passing',    'Tudo em ordem',      'Todas as disciplinas acima da média no bimestre.',  'shield-check','notas',        'all_passing',      1, 400, 140)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      metric = excluded.metric,
      threshold = excluded.threshold,
      xp_reward = excluded.xp_reward,
      sort_order = excluded.sort_order;
