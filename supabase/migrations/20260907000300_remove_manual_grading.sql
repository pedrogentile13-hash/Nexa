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
