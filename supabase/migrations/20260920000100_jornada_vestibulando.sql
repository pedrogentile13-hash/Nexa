-- ============================================================================
-- Nexa Vestibular — Fase 4 · A jornada do vestibulando vira uma plataforma
--
-- Até aqui o vestibular era uma SEÇÃO dentro do app da escola: quem criava
-- conta passava pelo onboarding escolar (série, disciplinas da grade, meta
-- diária), caía em `/hoje` e só depois descobria que existia uma aba de
-- vestibular. Para quem já terminou o ensino médio e está em cursinho, isso
-- é pedir uma série que ele não tem, montar uma grade que ele não segue e
-- abrir todo dia numa tela sobre lição de casa.
--
-- `profiles.journey` é a decisão tomada na criação da conta, e é ela — não o
-- prefixo da URL — que define qual app a pessoa usa:
--
--   'school'      aluno de escola. Nada muda: é o Nexa que sempre existiu.
--   'vestibular'  vestibulando puro. Abre em /vestibular, navegação própria,
--                 sem ano letivo, sem bimestre, sem turma.
--   'both'        está na escola E se prepara. Tem os dois, e a troca de
--                 contexto na navegação é a ponte entre eles.
--
-- Por que uma COLUNA em `profiles` e não uma tabela: é um atributo 1:1 do
-- usuário, lido em TODA requisição pelo middleware junto de `onboarded_at`.
-- Uma tabela à parte transformaria essa leitura única num join em cada
-- navegação do app inteiro.
--
-- Por que `bootstrap_vestibular_student` em vez de um parâmetro novo em
-- `bootstrap_student`: não é o mesmo bootstrap com um campo a mais. O
-- escolar cria ano letivo, bimestres e um checklist sobre mochila e lição;
-- nada disso existe pra quem está em cursinho. Espremer os dois na mesma
-- função significaria metade do corpo dela dentro de um `if` — e mexer no
-- caminho escolar, que hoje funciona, a cada ajuste do caminho novo.
-- ============================================================================

alter table public.profiles add column if not exists journey text not null default 'school';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_journey_check'
  ) then
    alter table public.profiles add constraint profiles_journey_check
      check (journey in ('school', 'vestibular', 'both'));
  end if;
end;
$$;

comment on column public.profiles.journey is
  'Qual Nexa esta pessoa usa: school (escola), vestibular (preparação) ou both. Escolhido na criação da conta, lido pelo middleware em toda requisição.';

-- Índice parcial: o único uso analítico é "quantos vestibulandos temos", e a
-- imensa maioria das linhas é 'school'.
create index if not exists profiles_journey_idx on public.profiles (journey)
  where journey <> 'school';

-- ----------------------------------------------------------------------------
-- Dados que só um vestibulando tem.
-- ----------------------------------------------------------------------------
alter table public.vestibular_profiles
  add column if not exists target_course text,
  add column if not exists target_institution text,
  add column if not exists study_days_per_week smallint,
  add column if not exists finished_high_school boolean not null default false,
  add column if not exists prep_context text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vestibular_profiles_days_check') then
    alter table public.vestibular_profiles add constraint vestibular_profiles_days_check
      check (study_days_per_week is null or study_days_per_week between 1 and 7);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vestibular_profiles_context_check') then
    alter table public.vestibular_profiles add constraint vestibular_profiles_context_check
      check (prep_context is null or prep_context in ('cursinho', 'escola', 'sozinho', 'outro'));
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Trocar de jornada depois (Perfil).
--
-- Só pra frente, nunca apagando nada: quem vira 'vestibular' depois de ter
-- sido 'school' mantém ano letivo, notas e histórico intactos — a jornada
-- muda o que a pessoa VÊ, não o que ela tem. É o que torna a troca segura o
-- bastante pra ficar num botão do Perfil.
-- ----------------------------------------------------------------------------
create or replace function public.set_journey(p_journey text)
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
  if p_journey not in ('school', 'vestibular', 'both') then
    raise exception 'jornada inválida' using errcode = '22023';
  end if;
  if p_journey <> 'school' and not public.is_feature_enabled('vestibular_enabled') then
    raise exception 'a área de vestibular está desativada' using errcode = '42501';
  end if;

  update public.profiles set journey = p_journey where id = v_me;
end;
$$;

grant execute on function public.set_journey(text) to authenticated;

-- ----------------------------------------------------------------------------
-- `save_vestibular_profile` passa a guardar o resto do perfil.
--
-- `drop` explícito: acrescentar parâmetro com `create or replace` cria uma
-- SEGUNDA função, e toda chamada de 4 argumentos viraria ambígua.
-- ----------------------------------------------------------------------------
drop function if exists public.save_vestibular_profile(uuid, integer, integer, integer);

create or replace function public.save_vestibular_profile(
  p_main_exam_id uuid default null,
  p_target_year integer default null,
  p_graduation_year integer default null,
  p_daily_study_minutes integer default null,
  p_target_course text default null,
  p_target_institution text default null,
  p_study_days_per_week integer default null,
  p_finished_high_school boolean default null,
  p_prep_context text default null
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
    user_id, main_exam_id, target_year, graduation_year, daily_study_minutes,
    target_course, target_institution, study_days_per_week, finished_high_school, prep_context
  ) values (
    v_me, p_main_exam_id, p_target_year::smallint, p_graduation_year::smallint, p_daily_study_minutes,
    nullif(btrim(p_target_course), ''), nullif(btrim(p_target_institution), ''),
    p_study_days_per_week::smallint, coalesce(p_finished_high_school, false), p_prep_context
  )
  on conflict (user_id) do update set
    main_exam_id = excluded.main_exam_id,
    target_year = excluded.target_year,
    graduation_year = excluded.graduation_year,
    daily_study_minutes = excluded.daily_study_minutes,
    -- `coalesce` com o valor antigo: uma tela que edita só a rotina não pode
    -- apagar o curso-alvo por não ter mandado o campo.
    target_course = coalesce(excluded.target_course, vestibular_profiles.target_course),
    target_institution = coalesce(excluded.target_institution, vestibular_profiles.target_institution),
    study_days_per_week = coalesce(excluded.study_days_per_week, vestibular_profiles.study_days_per_week),
    finished_high_school = coalesce(p_finished_high_school, vestibular_profiles.finished_high_school),
    prep_context = coalesce(excluded.prep_context, vestibular_profiles.prep_context),
    updated_at = now();
end;
$$;

grant execute on function public.save_vestibular_profile(
  uuid, integer, integer, integer, text, text, integer, boolean, text
) to authenticated;

-- `get_vestibular_profile` devolve o perfil inteiro agora.
drop function if exists public.get_vestibular_profile();

create or replace function public.get_vestibular_profile()
returns table (
  user_id uuid,
  main_exam_id uuid,
  main_exam_name text,
  main_exam_slug text,
  target_year smallint,
  graduation_year smallint,
  daily_study_minutes integer,
  target_course text,
  target_institution text,
  study_days_per_week smallint,
  finished_high_school boolean,
  prep_context text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    vp.user_id, vp.main_exam_id, e.name, e.slug,
    vp.target_year, vp.graduation_year, vp.daily_study_minutes,
    vp.target_course, vp.target_institution, vp.study_days_per_week,
    vp.finished_high_school, vp.prep_context
  from public.vestibular_profiles vp
  left join public.exams e on e.id = vp.main_exam_id
  where vp.user_id = auth.uid();
$$;

grant execute on function public.get_vestibular_profile() to authenticated;

-- ----------------------------------------------------------------------------
-- Bootstrap do vestibulando.
--
-- Uma transação só, como o escolar — mas com o que ESTE perfil precisa:
-- perfil + matérias das áreas da prova + perfil de vestibular + objetivo +
-- uma rotina que fala a língua de quem está em preparação (questões, redação,
-- revisão), não de quem tem lição de casa.
--
-- Não cria ano letivo nem bimestres de propósito: eles existem pra dividir a
-- nota escolar em períodos, e um vestibulando não tem boletim.
-- ----------------------------------------------------------------------------
create or replace function public.bootstrap_vestibular_student(
  p_full_name text,
  p_main_exam_id uuid,
  p_target_year integer,
  p_timezone text default 'America/Sao_Paulo',
  p_daily_goal_minutes integer default 120,
  p_catalog_ids uuid[] default '{}',
  p_target_course text default null,
  p_target_institution text default null,
  p_study_days_per_week integer default null,
  p_finished_high_school boolean default false,
  p_prep_context text default null,
  p_grade_level text default null,
  p_also_school boolean default false
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject_ids uuid[] := '{}';
  v_subject_id uuid;
  v_row record;
  v_journey text := case when p_also_school then 'both' else 'vestibular' end;
begin
  if v_user_id is null then
    raise exception 'bootstrap_vestibular_student requires an authenticated user'
      using errcode = '28000';
  end if;

  -- Mesma trava de dupla-execução de `bootstrap_student`, pelo mesmo motivo:
  -- um duplo toque no botão não pode criar tudo duas vezes.
  update public.profiles set onboarded_at = now()
  where id = v_user_id and onboarded_at is null;

  if not found then
    if exists (select 1 from public.profiles where id = v_user_id) then
      raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
    end if;
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  -- 1. Perfil ---------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, timezone, daily_study_goal_minutes, onboarded_at, journey
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 120), now(), v_journey
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = coalesce(p.onboarded_at, now()),
        journey = v_journey;

  -- 2. Matérias -------------------------------------------------------------
  -- Sem catálogo escolhido, cai nas matérias ativas do catálogo: um
  -- vestibulando estuda tudo o que cai na prova, então a lista cheia é um
  -- default honesto aqui (ao contrário do escolar, onde a grade é da série).
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.is_active
      and (coalesce(array_length(p_catalog_ids, 1), 0) = 0 or c.id = any (p_catalog_ids))
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

  -- 3. Perfil de vestibular + objetivo --------------------------------------
  insert into public.vestibular_profiles (
    user_id, main_exam_id, target_year, daily_study_minutes,
    target_course, target_institution, study_days_per_week, finished_high_school, prep_context
  ) values (
    v_user_id, p_main_exam_id, p_target_year::smallint, p_daily_goal_minutes,
    nullif(btrim(p_target_course), ''), nullif(btrim(p_target_institution), ''),
    p_study_days_per_week::smallint, coalesce(p_finished_high_school, false), p_prep_context
  )
  on conflict (user_id) do update set
    main_exam_id = excluded.main_exam_id,
    target_year = excluded.target_year,
    daily_study_minutes = excluded.daily_study_minutes,
    target_course = excluded.target_course,
    target_institution = excluded.target_institution,
    study_days_per_week = excluded.study_days_per_week,
    finished_high_school = excluded.finished_high_school,
    prep_context = excluded.prep_context,
    updated_at = now();

  if p_main_exam_id is not null then
    insert into public.user_exam_targets (user_id, exam_id, target_year, priority, target_course)
    values (v_user_id, p_main_exam_id, p_target_year::smallint, 1, nullif(btrim(p_target_course), ''))
    on conflict (user_id, exam_id) do update set
      target_year = excluded.target_year,
      priority = 1,
      target_course = coalesce(excluded.target_course, user_exam_targets.target_course);
  end if;

  -- 4. Rotina de quem se prepara -------------------------------------------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Resolver questões do meu vestibular', 'clipboard-check', 10),
    (v_user_id, 'Revisar os erros de ontem', 'rotate-ccw', 20),
    (v_user_id, 'Ler/escrever sobre atualidades', 'pen-line', 30);

  -- 5. Stats ----------------------------------------------------------------
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'journey', v_journey,
    'subject_ids', to_jsonb(v_subject_ids)
  );
end;
$$;

grant execute on function public.bootstrap_vestibular_student(
  text, uuid, integer, text, integer, uuid[], text, text, integer, boolean, text, text, boolean
) to authenticated;

-- ----------------------------------------------------------------------------
-- A home do vestibulando, num round-trip.
--
-- A tela abre com seis blocos que vinham de seis consultas diferentes
-- (contagem regressiva, meta do dia, sequência, foco de hoje, erro pendente,
-- acerto da semana). Seis round-trips numa tela que é a PRIMEIRA que a pessoa
-- vê todo dia é o tipo de coisa que faz o app parecer lento mesmo quando cada
-- consulta é rápida.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_home()
returns table (
  full_name text,
  exam_name text,
  exam_slug text,
  target_year smallint,
  target_course text,
  target_institution text,
  application_date date,
  days_until integer,
  daily_goal_minutes integer,
  minutes_today integer,
  streak_days integer,
  questions_today bigint,
  accuracy_week numeric,
  pending_errors bigint,
  next_topic_id uuid,
  next_topic_name text,
  next_topic_subject text,
  next_topic_reason text,
  open_session_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  today as (select public.user_local_date((select uid from me)) as d),
  prof as (
    select p.full_name, p.daily_study_goal_minutes
    from public.profiles p where p.id = (select uid from me)
  ),
  vp as (
    select v.target_year, v.target_course, v.target_institution, e.name as exam_name, e.slug as exam_slug,
           ed.application_date
    from public.vestibular_profiles v
    left join public.exams e on e.id = v.main_exam_id
    left join lateral (
      select ed2.application_date
      from public.exam_editions ed2
      where ed2.exam_id = v.main_exam_id
        and (v.target_year is null or ed2.year = v.target_year)
        and ed2.application_date >= current_date
      order by ed2.application_date
      limit 1
    ) ed on true
    where v.user_id = (select uid from me)
  ),
  latest as (select * from public.vestibular_latest_answers()),
  week as (
    select
      count(*) as total,
      count(*) filter (where is_correct) as right_count
    from latest
    where answered_at >= now() - interval '7 days'
  ),
  answered_today as (
    select count(*) as total
    from public.practice_answers pa
    join public.practice_sessions ps on ps.id = pa.session_id
    where ps.user_id = (select uid from me)
      and pa.option_id is not null
      and pa.answered_at::date = (select d from today)
  ),
  plan_top as (
    select topic_id, topic_name, subject_name, reason
    from public.vestibular_study_plan(1)
  ),
  open_session as (
    select ps.id
    from public.practice_sessions ps
    where ps.user_id = (select uid from me) and ps.finished_at is null
    order by ps.started_at desc
    limit 1
  )
  select
    (select full_name from prof),
    (select exam_name from vp),
    (select exam_slug from vp),
    (select target_year from vp),
    (select target_course from vp),
    (select target_institution from vp),
    (select application_date from vp),
    (select (application_date - current_date)::integer from vp),
    (select daily_study_goal_minutes from prof),
    coalesce((select (sum(s.duration_seconds) / 60)::integer from public.study_sessions s
              where s.user_id = (select uid from me) and s.local_date = (select d from today)), 0),
    coalesce((select st.current_streak from public.user_stats st where st.user_id = (select uid from me)), 0),
    (select total from answered_today),
    (select case when total = 0 then null else round(right_count::numeric / total * 100) end from week),
    (select count(*) from latest where not is_correct),
    (select topic_id from plan_top),
    (select topic_name from plan_top),
    (select subject_name from plan_top),
    (select reason from plan_top),
    (select id from open_session);
$$;

grant execute on function public.vestibular_home() to authenticated;
