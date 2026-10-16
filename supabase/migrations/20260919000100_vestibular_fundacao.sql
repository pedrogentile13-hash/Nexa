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

-- Mesmo motivo do `drop` de `vestibular_overview` logo abaixo: `create or
-- replace` não muda tipo de retorno, e uma fase seguinte que acrescente uma
-- coluna aqui tornaria esta migração impossível de reaplicar.
drop function if exists public.get_vestibular_profile();

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
-- `drop` explícito antes do `create or replace`: `create or replace` NÃO
-- consegue mudar o tipo de retorno de uma função, e uma fase seguinte que
-- acrescente uma coluna a este retorno tornaria esta migração impossível de
-- reaplicar (o teste de idempotência pega isso na hora). Com o drop aqui, a
-- ordem de reaplicação volta a funcionar em qualquer estado do banco.
drop function if exists public.vestibular_overview();

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
