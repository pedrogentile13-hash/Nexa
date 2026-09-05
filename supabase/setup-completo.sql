-- ============================================================================
-- Nexa — setup completo do banco, em um arquivo só
--
-- COMO USAR
--   1. Abra seu projeto no Supabase
--   2. Menu lateral → SQL Editor → New query
--   3. Cole TUDO isto e clique em Run
--
-- É seguro rodar em um projeto novo e vazio, e também em um já configurado:
-- tudo é idempotente. Cria as 35 tabelas, as políticas de RLS, as 7 views,
-- as funções e o conteúdo inicial (disciplinas, conquistas e biblioteca).
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
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Escolas passam a ser gerenciáveis pelo painel.
drop policy if exists schools_manage_admin on public.schools;
create policy schools_manage_admin on public.schools
  for all to authenticated
  using (public.can_manage_school(id)) with check (public.can_manage_school(id));

-- Catálogo de matérias também: o admin cria matérias novas pelo painel.
drop policy if exists subject_catalog_manage_admin on public.subject_catalog;
create policy subject_catalog_manage_admin on public.subject_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin precisa enxergar as linhas despublicadas/inativas que ele mesmo edita.
drop policy if exists subject_catalog_select_admin on public.subject_catalog;
create policy subject_catalog_select_admin on public.subject_catalog
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------- assuntos ----
-- "Cinemática" dentro de Física. É o que liga o erro do simulado ao resumo
-- certo na tela de resultado — sem assunto, "o que revisar" não existe.
create table public.content_topics (
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

create unique index content_topics_scope_slug_uq
  on public.content_topics (subject_catalog_id, coalesce(school_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);
create index content_topics_subject_idx on public.content_topics (subject_catalog_id, sort_order);

create trigger content_topics_set_updated_at before update on public.content_topics
  for each row execute function public.set_updated_at();

alter table public.content_topics enable row level security;

create policy content_topics_select_visible on public.content_topics
  for select to authenticated
  using (school_id is null or school_id = public.current_school_id() or public.can_manage_school(school_id));

create policy content_topics_manage on public.content_topics
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- ------------------------------------------------------------- recursos ----
create table public.resources (
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

create index resources_library_idx
  on public.resources (subject_catalog_id, kind, sort_order) where is_published;
create index resources_school_idx on public.resources (school_id) where school_id is not null;
create index resources_topic_idx on public.resources (topic_id) where topic_id is not null;
create index resources_title_trgm_idx on public.resources using gin (title gin_trgm_ops);

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

create trigger resources_stamp_published before insert or update on public.resources
  for each row execute function public.stamp_published_at();

alter table public.resources enable row level security;

create policy resources_select_visible on public.resources
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id)
    or public.is_admin()
  );

create policy resources_manage on public.resources
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- --------------------------------------------------------- capítulos -------
-- Marcadores de tempo do podcast e do vídeo ("Estado Novo · 7:40").
create table public.resource_chapters (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position >= 0),
  label text not null check (length(btrim(label)) between 1 and 160),
  starts_at_seconds integer not null check (starts_at_seconds >= 0),
  created_at timestamptz not null default now()
);

create unique index resource_chapters_pos_uq on public.resource_chapters (resource_id, position);

alter table public.resource_chapters enable row level security;

create policy resource_chapters_select_visible on public.resource_chapters
  for select to authenticated
  using (exists (select 1 from public.resources r where r.id = resource_id));

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
create table public.questions (
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

create unique index questions_position_uq on public.questions (resource_id, position);
create index questions_topic_idx on public.questions (topic_id) where topic_id is not null;

create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

-- Sem policy de SELECT para aluno, de propósito. `explanation` entrega a
-- resposta, e RLS é por linha, não por coluna: qualquer leitura direta da
-- tabela seria o gabarito disponível antes de responder. O aluno recebe as
-- questões pela função `quiz_questions()`, que devolve enunciado e
-- alternativas sem o gabarito. A policy abaixo (FOR ALL) cobre o admin.
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
create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position integer not null check (position > 0),
  body text not null check (length(btrim(body)) >= 1),
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index question_options_position_uq on public.question_options (question_id, position);
-- Uma questão de múltipla escolha tem exatamente uma resposta certa. Índice
-- parcial único: o banco recusa a segunda antes que ela vire um bug de correção.
create unique index question_options_single_correct_uq
  on public.question_options (question_id) where is_correct;

alter table public.question_options enable row level security;

-- Mesma razão: `is_correct` nesta tabela É o gabarito.
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
create table public.tracks (
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

create index tracks_subject_idx on public.tracks (subject_catalog_id) where is_published;

create trigger tracks_set_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

alter table public.tracks enable row level security;

create policy tracks_select_visible on public.tracks
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id) or public.is_admin()
  );

create policy tracks_manage on public.tracks
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

create table public.track_sections (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  created_at timestamptz not null default now()
);

create unique index track_sections_position_uq on public.track_sections (track_id, position);

alter table public.track_sections enable row level security;

create policy track_sections_select_visible on public.track_sections
  for select to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id));

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
create table public.track_lessons (
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

create unique index track_lessons_position_uq on public.track_lessons (section_id, position);

create trigger track_lessons_set_updated_at before update on public.track_lessons
  for each row execute function public.set_updated_at();

alter table public.track_lessons enable row level security;

create policy track_lessons_select_visible on public.track_lessons
  for select to authenticated
  using (exists (select 1 from public.track_sections s where s.id = section_id));

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
create table public.track_lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.track_lessons (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position > 0),
  is_required boolean not null default true
);

create unique index track_lesson_resources_position_uq on public.track_lesson_resources (lesson_id, position);
create unique index track_lesson_resources_pair_uq on public.track_lesson_resources (lesson_id, resource_id);

alter table public.track_lesson_resources enable row level security;

create policy track_lesson_resources_select_visible on public.track_lesson_resources
  for select to authenticated
  using (exists (select 1 from public.track_lessons l where l.id = lesson_id));

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
create table public.resource_progress (
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

create unique index resource_progress_pair_uq on public.resource_progress (user_id, resource_id);
-- "Continuar de onde parou" é uma consulta por aluno ordenada por recência.
create index resource_progress_recent_idx on public.resource_progress (user_id, last_seen_at desc);

create trigger resource_progress_set_updated_at before update on public.resource_progress
  for each row execute function public.set_updated_at();

alter table public.resource_progress enable row level security;

create policy resource_progress_all_own on public.resource_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- tentativas --------
create table public.quiz_attempts (
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

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, resource_id, started_at desc);

alter table public.quiz_attempts enable row level security;

create policy quiz_attempts_all_own on public.quiz_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  option_id uuid references public.question_options (id) on delete set null,
  is_correct boolean not null default false,
  answered_at timestamptz not null default now()
);

create unique index quiz_answers_pair_uq on public.quiz_answers (attempt_id, question_id);

alter table public.quiz_answers enable row level security;

-- A tentativa é do aluno, logo a resposta também é. A checagem sobe pelo
-- attempt para não repetir `user_id` numa segunda coluna que pode divergir.
create policy quiz_answers_all_own on public.quiz_answers
  for all to authenticated
  using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ------------------------------------------------ progresso na trilha ------
create table public.lesson_progress (
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

create unique index lesson_progress_pair_uq on public.lesson_progress (user_id, lesson_id);

create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

create policy lesson_progress_all_own on public.lesson_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- marcações ---------
create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  quote text not null check (length(btrim(quote)) between 1 and 2000),
  note text,
  created_at timestamptz not null default now()
);

create index highlights_user_resource_idx on public.highlights (user_id, resource_id);

alter table public.highlights enable row level security;

create policy highlights_all_own on public.highlights
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------- flashcards ------------
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  knows boolean not null,
  reviewed_at timestamptz not null default now()
);

create index flashcard_reviews_user_idx on public.flashcard_reviews (user_id, resource_id, reviewed_at desc);

alter table public.flashcard_reviews enable row level security;

create policy flashcard_reviews_all_own on public.flashcard_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Views · a biblioteca como o aluno a enxerga
--
-- `security_invoker` em todas: a view roda com a RLS de quem consulta, não com
-- a de quem a criou. Sem isso uma view seria um buraco por onde o acervo de
-- outra escola sairia inteiro.
-- ============================================================================

create or replace view public.v_resource_library
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
