# SQL pendente — Nexa

Todas as migrações que ainda **não foram aplicadas** no Supabase, na ordem em
que precisam rodar.

Gerado em 02/10/2026.

## Como rodar

1. Abra o **SQL Editor** do projeto no Supabase.
2. Rode **uma de cada vez**, na ordem desta página, conferindo que cada uma
   terminou antes de ir para a próxima.
3. A ordem importa: a 3 usa funções criadas pela 2, a 4 usa da 3, e a 5 e a 6
   alteram coisas da 1.

**Pode rodar de novo com segurança.** A suíte local testa a reaplicação sobre
um banco já povoado, que é exatamente o cenário do seu Supabase — rodar duas
vezes não estraga nada.

**Se der "API Error: happened while trying to acquire connection to the
database":** isso não é erro do SQL, é o editor não conseguindo abrir conexão.
Nada foi aplicado; espere um pouco e repita.

## O que cada uma faz

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `20260919000100_vestibular_fundacao.sql` | Cria `exams` e `exam_editions`, acrescenta `context` em `resources` (é o que impede questão de ENEM de entrar na nota escolar) e o perfil de vestibular do aluno. |
| 2 | `20260919000200_vestibular_banco_questoes.sql` | Sessões de prática que atravessam várias provas, com o conjunto de questões congelado e a mesma trava anti-cola do simulado. |
| 3 | `20260919000300_vestibular_desempenho.sql` | Junta as duas origens de resposta (prova e treino) numa leitura só e monta a central de erros em cima disso. |
| 4 | `20260919000400_vestibular_plano.sql` | Cruza o peso de cada assunto na prova com a lacuna de domínio do aluno para ordenar o que estudar. |
| 5 | `20260920000100_jornada_vestibulando.sql` | `profiles.journey` decide qual Nexa a pessoa usa. Bootstrap próprio para quem está em cursinho (sem ano letivo nem bimestre) e a home num round-trip só. |
| 6 | `20261002000100_desempenho_autorizacao.sql` | **Fecha um vazamento medido:** um aluno lia o domínio, as habilidades e os erros de outro — com enunciado e explicação — só passando o uuid dele. |
| 7 | `20261002000200_lgpd.sql` | Data de nascimento, registro append-only de consentimento de responsável (art. 14), exportação dos dados e exclusão de conta (art. 18). |
| 8 | `20261002000300_error_reports.sql` | Guarda o que quebrou para quem está usando, para ler em `/admin/erros`. Hoje essa informação se perde. |

---

## 1. Vestibular — Fundação

`20260919000100_vestibular_fundacao.sql`

Cria `exams` e `exam_editions`, acrescenta `context` em `resources` (é o que impede questão de ENEM de entrar na nota escolar) e o perfil de vestibular do aluno.

```sql
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
```

---

## 2. Vestibular — Banco de questões avulsas

`20260919000200_vestibular_banco_questoes.sql`

Sessões de prática que atravessam várias provas, com o conjunto de questões congelado e a mesma trava anti-cola do simulado.

```sql
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
```

---

## 3. Vestibular — Central de erros e desempenho

`20260919000300_vestibular_desempenho.sql`

Junta as duas origens de resposta (prova e treino) numa leitura só e monta a central de erros em cima disso.

```sql
-- ============================================================================
-- Nexa Vestibular — Fase 2 · Central de erros + desempenho da preparação
--
-- A Fase 1 criou um SEGUNDO lugar onde o aluno responde questão de
-- vestibular (`practice_answers`, ao lado de `quiz_answers`). Toda leitura
-- de desempenho que enxergasse só um dos dois passaria a mentir — inclusive
-- a `vestibular_overview` que a Fase 0 escreveu, que hoje diz "0 questões"
-- pra quem acabou de treinar 40. Esta fase conserta isso e constrói a
-- central de erros em cima do conjunto completo.
--
-- `vestibular_latest_answers` é a peça central: a resposta MAIS RECENTE de
-- cada questão, venha ela de prova ou de treino. É o mesmo critério de
-- `topic_mastery` (0907), pela mesma razão — quem errou em março e acertou
-- a mesma questão em setembro está bem HOJE, e uma média histórica
-- arrastaria o erro de março pra sempre. A diferença é só a origem dupla.
--
-- Por que UMA função e não o mesmo `with` copiado em cada uma: o critério de
-- "qual resposta vale" é exatamente o tipo de regra que, duplicada em cinco
-- lugares, diverge em três deles na primeira mudança. Aqui ela tem um dono.
--
-- Diferença deliberada entre as duas origens: resposta de prova só conta
-- depois de a tentativa ser finalizada (`finished_at is not null`, mesmo
-- critério de `topic_mastery`), mas resposta de treino conta na hora. Não é
-- inconsistência — no treino a resposta já é definitiva no instante em que é
-- dada (`answer_practice_question` recusa reescrita), então esperar o fim da
-- sessão só atrasaria a central de erros sem proteger nada.
-- ============================================================================

-- Sem parâmetro de usuário de propósito: uma função `security definer` que
-- aceita "de quem?" precisa de uma checagem de autorização própria, e não há
-- caso de uso nesta fase para ler o desempenho de outra pessoa. Sem o
-- parâmetro, não há o que autorizar.
create or replace function public.vestibular_latest_answers()
returns table (
  question_id uuid,
  is_correct boolean,
  answered_at timestamptz,
  source text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (u.question_id) u.question_id, u.is_correct, u.answered_at, u.source
  from (
    select ans.question_id, ans.is_correct, ans.answered_at, 'prova'::text as source
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    join public.resources r on r.id = a.resource_id
    where a.user_id = auth.uid()
      and a.finished_at is not null
      and ans.option_id is not null
      and r.context = 'vestibular'

    union all

    select pa.question_id, pa.is_correct, pa.answered_at, 'treino'::text
    from public.practice_answers pa
    join public.practice_sessions ps on ps.id = pa.session_id
    where ps.user_id = auth.uid() and pa.option_id is not null
  ) u
  order by u.question_id, u.answered_at desc;
$$;

comment on function public.vestibular_latest_answers is
  'Resposta mais recente de cada questão de vestibular, de prova ou de treino — base única de toda leitura de desempenho da preparação.';

grant execute on function public.vestibular_latest_answers() to authenticated;

-- ----------------------------------------------------------------------------
-- Desempenho por matéria.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_subject_performance()
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  correct_count bigint,
  total_count bigint,
  accuracy_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.id,
    sc.name,
    sc.default_color,
    count(*) filter (where la.is_correct),
    count(*),
    round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  group by sc.id, sc.name, sc.default_color
  order by round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100), sc.name;
$$;

grant execute on function public.vestibular_subject_performance() to authenticated;

-- ----------------------------------------------------------------------------
-- Desempenho por assunto — do mais fraco pro mais forte, que é a ordem em que
-- a informação é útil.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_topic_performance(
  p_subject_catalog_id uuid default null
)
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  correct_count bigint,
  total_count bigint,
  accuracy_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.id,
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
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  left join public.content_topics t on t.id = q.topic_id
  where p_subject_catalog_id is null or sc.id = p_subject_catalog_id
  group by sc.id, sc.name, sc.default_color, q.topic_id, t.name
  order by round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100), coalesce(t.name, 'Geral');
$$;

grant execute on function public.vestibular_topic_performance(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Central de erros: as questões que o aluno erra HOJE.
--
-- Aqui o gabarito e a explicação PODEM aparecer — toda questão desta lista já
-- foi respondida e corrigida. Não é um caminho novo pro gabarito: é o mesmo
-- que `practice_session_review` e `quiz_attempt_review` já abrem depois da
-- correção.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_error_list(
  p_subject_catalog_id uuid default null,
  p_limit integer default 30
)
returns table (
  question_id uuid,
  statement text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  exam_name text,
  edition_year smallint,
  difficulty text,
  correct_option_body text,
  explanation text,
  source text,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.statement,
    sc.id,
    sc.name,
    sc.default_color,
    t.name,
    e.name,
    ed.year,
    q.difficulty,
    (select o.body from public.question_options o where o.question_id = q.id and o.is_correct),
    q.explanation,
    la.source,
    la.answered_at
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  left join public.content_topics t on t.id = q.topic_id
  left join public.exams e on e.id = r.exam_id
  left join public.exam_editions ed on ed.id = r.exam_edition_id
  where not la.is_correct
    and (p_subject_catalog_id is null or sc.id = p_subject_catalog_id)
  order by la.answered_at desc
  limit greatest(1, least(100, coalesce(p_limit, 30)));
$$;

grant execute on function public.vestibular_error_list(uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Refazer os erros: abre uma sessão de prática montada só com o que o aluno
-- erra hoje.
--
-- Reaproveita `practice_sessions` inteiro em vez de inventar um "modo
-- revisão" paralelo — o player, a correção e o XP da Fase 1 valem aqui sem
-- uma linha nova de UI.
-- ----------------------------------------------------------------------------
create or replace function public.start_error_practice(
  p_subject_catalog_id uuid default null,
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

  select array_agg(x.question_id order by x.answered_at desc)
    into v_ids
  from (
    select la.question_id, la.answered_at
    from public.vestibular_latest_answers() la
    join public.questions q on q.id = la.question_id
    join public.resources r on r.id = q.resource_id
    where not la.is_correct
      and public.can_view_resource(r.id, v_me)
      and (p_subject_catalog_id is null
           or coalesce(q.subject_catalog_id, r.subject_catalog_id) = p_subject_catalog_id)
    order by la.answered_at desc
    limit v_limit
  ) x;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'nenhum erro pendente com esses filtros' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, question_ids, subject_catalog_id, total_count)
  values (v_me, v_ids, p_subject_catalog_id, cardinality(v_ids))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_error_practice(uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- `vestibular_overview` passa a enxergar o treino.
--
-- Só o bloco `answers` muda (era quiz_answers puro, agora é
-- `vestibular_latest_answers`) e um `practices_done` novo entra no retorno.
-- O resto é byte-a-byte a versão da Fase 0 — inclusive o contador regressivo,
-- que não tem nada a ver com esta mudança.
--
-- `answers` agora conta uma questão UMA vez, pela resposta mais recente, em
-- vez de contar cada tentativa. Isso baixa o número total de quem refez a
-- mesma prova duas vezes — e é a leitura certa: "acertei 68% das questões que
-- já vi" diz algo, "acertei 68% das vezes que respondi alguma coisa" não.
-- ----------------------------------------------------------------------------
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
  practices_done bigint,
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
    select la.is_correct from public.vestibular_latest_answers() la
  ),
  attempts as (
    select r.kind
    from me
    join public.quiz_attempts a on a.user_id = me.uid and a.finished_at is not null
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
  ),
  practices as (
    select count(*) as total
    from me
    join public.practice_sessions ps on ps.user_id = me.uid and ps.finished_at is not null
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
    (select total from practices),
    (select total from essays);
$$;

grant execute on function public.vestibular_overview() to authenticated;
```

---

## 4. Vestibular — Plano de estudo e Reta Final

`20260919000400_vestibular_plano.sql`

Cruza o peso de cada assunto na prova com a lacuna de domínio do aluno para ordenar o que estudar.

```sql
-- ============================================================================
-- Nexa Vestibular — Fase 3 · Plano de estudo e Reta Final
--
-- A pergunta que esta fase responde é a única que importa pra quem está a
-- oito meses da prova: "por onde eu começo?". As Fases 1 e 2 já sabem o que
-- o aluno domina; o que faltava era o outro lado da conta — o que a PROVA
-- DELE cobra. Assunto que o aluno domina mal e que cai muito é prioridade;
-- assunto que ele domina mal e que quase nunca cai, não é.
--
-- De onde sai a frequência, e por que de dois lugares:
--
--   1. Derivada do próprio acervo: quantas questões daquele vestibular, em
--      todas as edições cadastradas, são daquele assunto. Funciona no dia
--      zero, sem ninguém cadastrar nada, e melhora sozinha conforme provas
--      entram. É a fonte padrão.
--   2. `exam_topic_frequency`, cadastrada à mão: quando alguém tem o dado
--      real (relatório do INEP, levantamento de cursinho), ele VENCE o
--      derivado. Não é redundância — é a diferença entre "o que temos no
--      banco" e "o que a prova realmente cobra", que só coincidem quando o
--      acervo é grande e balanceado.
--
-- Por que "nunca respondeu" não é tratado como "domínio zero": um assunto
-- sem nenhuma resposta não tem evidência nenhuma, nem boa nem ruim. Tratá-lo
-- como zero jogaria todo o conteúdo não visto pro topo do plano e enterraria
-- os erros reais — exatamente o oposto do que o aluno precisa ver. Ele entra
-- com 50 (neutro) e sobe ou desce assim que houver a primeira resposta.
-- ============================================================================

create table if not exists public.exam_topic_frequency (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  topic_id uuid not null references public.content_topics (id) on delete cascade,
  -- Percentual da prova que esse assunto costuma ocupar.
  frequency_percent numeric not null check (frequency_percent >= 0 and frequency_percent <= 100),
  -- Quantas edições sustentam esse número. É o que separa um dado de um palpite.
  editions_counted smallint not null default 0 check (editions_counted >= 0),
  note text,
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists exam_topic_frequency_uq
  on public.exam_topic_frequency (exam_id, topic_id);

alter table public.exam_topic_frequency enable row level security;

-- Leitura livre pra autenticado (é dado público sobre a prova, não sobre o
-- aluno); escrita só admin, como o resto do catálogo de vestibulares.
drop policy if exists exam_topic_frequency_select on public.exam_topic_frequency;
create policy exam_topic_frequency_select on public.exam_topic_frequency
  for select to authenticated using (true);

drop policy if exists exam_topic_frequency_manage on public.exam_topic_frequency;
create policy exam_topic_frequency_manage on public.exam_topic_frequency
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Frequência efetiva por assunto: o cadastrado quando existe, o derivado do
-- acervo quando não.
-- ----------------------------------------------------------------------------
create or replace function public.exam_topic_weights(p_exam_id uuid)
returns table (
  topic_id uuid,
  topic_name text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  frequency_percent numeric,
  source text
)
language sql
stable
security definer
set search_path = public
as $$
  with derived as (
    select
      q.topic_id,
      count(*)::numeric as questions
    from public.questions q
    join public.resources r on r.id = q.resource_id
    where r.context = 'vestibular'
      and q.topic_id is not null
      and (p_exam_id is null or r.exam_id = p_exam_id)
    group by q.topic_id
  ),
  total as (select greatest(sum(questions), 1) as questions from derived)
  select
    t.id,
    t.name,
    sc.id,
    sc.name,
    sc.default_color,
    coalesce(f.frequency_percent, round(d.questions / (select questions from total) * 100, 1)),
    case when f.frequency_percent is not null then 'cadastrada' else 'derivada' end
  from derived d
  join public.content_topics t on t.id = d.topic_id
  join public.subject_catalog sc on sc.id = t.subject_catalog_id
  left join public.exam_topic_frequency f
    on f.topic_id = t.id and p_exam_id is not null and f.exam_id = p_exam_id
  order by 6 desc;
$$;

comment on function public.exam_topic_weights is
  'Peso de cada assunto numa prova: o valor cadastrado em exam_topic_frequency quando existe, senão a fatia que o assunto ocupa no acervo daquela prova.';

grant execute on function public.exam_topic_weights(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- O plano em si.
--
-- `priority_score = frequencia * (100 - dominio) / 100`. Os dois fatores
-- multiplicam em vez de somar de propósito: um assunto que não cai (peso ~0)
-- não deve subir no plano por mais mal que o aluno vá nele, e um assunto que
-- ele domina (100) não deve subir por mais que caia. A soma daria as duas
-- coisas erradas.
--
-- `phase`: a menos de 60 dias da prova, o plano corta a cauda longa (assuntos
-- abaixo de 3% da prova) — nessa altura, estudar o que cai uma vez a cada
-- cinco anos é tempo tirado do que cai todo ano. Acima disso, o plano mostra
-- tudo, porque ainda há tempo pra cobrir.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_study_plan(p_limit integer default 20)
returns table (
  topic_id uuid,
  topic_name text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  frequency_percent numeric,
  frequency_source text,
  mastery_percent numeric,
  answered_count bigint,
  priority_score numeric,
  reason text,
  phase text,
  days_until integer
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  target as (
    select vp.main_exam_id as exam_id, ed.application_date
    from me
    join public.vestibular_profiles vp on vp.user_id = me.uid
    left join lateral (
      select ed2.application_date
      from public.exam_editions ed2
      where ed2.exam_id = vp.main_exam_id
        and (vp.target_year is null or ed2.year = vp.target_year)
        and ed2.application_date >= current_date
      order by ed2.application_date
      limit 1
    ) ed on true
  ),
  days as (
    select (select (application_date - current_date)::integer from target) as until
  ),
  plan_phase as (
    select case
      when (select until from days) is not null and (select until from days) <= 60
        then 'reta_final' else 'base'
    end as name
  ),
  weights as (
    select * from public.exam_topic_weights((select exam_id from target))
  ),
  mine as (
    select
      q.topic_id,
      count(*) as answered,
      round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100) as mastery
    from public.vestibular_latest_answers() la
    join public.questions q on q.id = la.question_id
    where q.topic_id is not null
    group by q.topic_id
  )
  select
    w.topic_id,
    w.topic_name,
    w.subject_id,
    w.subject_name,
    w.subject_color,
    w.frequency_percent,
    w.source,
    m.mastery,
    coalesce(m.answered, 0),
    round(w.frequency_percent * (100 - coalesce(m.mastery, 50)) / 100, 2),
    case
      when w.frequency_percent >= 5 and coalesce(m.mastery, 50) < 60 then 'cai_muito_e_voce_erra'
      when w.frequency_percent >= 5 then 'cai_muito'
      when coalesce(m.mastery, 50) < 60 and m.answered is not null then 'voce_erra'
      else 'reforco'
    end,
    (select name from plan_phase),
    (select until from days)
  from weights w
  left join mine m on m.topic_id = w.topic_id
  where (select name from plan_phase) = 'base' or w.frequency_percent >= 3
  order by round(w.frequency_percent * (100 - coalesce(m.mastery, 50)) / 100, 2) desc, w.topic_name
  limit greatest(1, least(60, coalesce(p_limit, 20)));
$$;

comment on function public.vestibular_study_plan is
  'Assuntos ordenados por prioridade = peso na prova x lacuna de domínio. Na reta final (<=60 dias) corta a cauda longa.';

grant execute on function public.vestibular_study_plan(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Treinar um assunto específico.
--
-- `start_practice_session` ganha `p_topic_id` — sem isso, cada linha do plano
-- seria um conselho sem botão. Precisa de `drop` explícito: `create or
-- replace` não acrescenta parâmetro, ele cria uma SEGUNDA função, e toda
-- chamada de 4 argumentos passaria a ser ambígua (o mesmo tropeço já visto em
-- `create_post` e `bootstrap_student` neste projeto).
-- ----------------------------------------------------------------------------
drop function if exists public.start_practice_session(uuid, uuid, text, integer);

create or replace function public.start_practice_session(
  p_exam_id uuid default null,
  p_subject_catalog_id uuid default null,
  p_difficulty text default null,
  p_question_count integer default 10,
  p_topic_id uuid default null
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
      and (p_topic_id is null or q.topic_id = p_topic_id)
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

grant execute on function public.start_practice_session(uuid, uuid, text, integer, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Manutenção da frequência cadastrada (admin).
-- ----------------------------------------------------------------------------
create or replace function public.set_exam_topic_frequency(
  p_exam_id uuid,
  p_topic_id uuid,
  p_frequency_percent numeric,
  p_editions_counted smallint default 0,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'apenas administradores cadastram frequência de prova' using errcode = '42501';
  end if;

  insert into public.exam_topic_frequency
    (exam_id, topic_id, frequency_percent, editions_counted, note, created_by)
  values
    (p_exam_id, p_topic_id, p_frequency_percent, coalesce(p_editions_counted, 0), p_note, auth.uid())
  on conflict (exam_id, topic_id) do update
    set frequency_percent = excluded.frequency_percent,
        editions_counted = excluded.editions_counted,
        note = excluded.note,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.set_exam_topic_frequency(uuid, uuid, numeric, smallint, text) to authenticated;
```

---

## 5. Vestibular — Jornada do vestibulando

`20260920000100_jornada_vestibulando.sql`

`profiles.journey` decide qual Nexa a pessoa usa. Bootstrap próprio para quem está em cursinho (sem ano letivo nem bimestre) e a home num round-trip só.

```sql
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
```

---

## 6. Privacidade — Autorização nas funções de desempenho

`20261002000100_desempenho_autorizacao.sql`

**Fecha um vazamento medido:** um aluno lia o domínio, as habilidades e os erros de outro — com enunciado e explicação — só passando o uuid dele.

```sql
-- ============================================================================
-- Nexa — Autorização nas funções de desempenho
--
-- O problema, confirmado empiricamente antes deste conserto: `topic_mastery`,
-- `skill_mastery` e `recent_errors` são `security definer`, aceitam
-- `p_user_id` e não checavam NADA. Qualquer aluno logado passava o uuid de um
-- colega e recebia de volta o domínio por assunto, as habilidades e — o pior
-- caso — a lista de questões que o colega errou, COM O ENUNCIADO E A
-- EXPLICAÇÃO. Numa plataforma escolar com menores, é o erro de privacidade
-- mais caro que existe.
--
-- O que NÃO estava vazando, e por quê: `subject_scores` e `simulado_history`
-- têm a mesma forma (parâmetro de usuário, sem guard), mas são `security
-- INVOKER` — a RLS vale como o chamador, e ler `quiz_attempts` de outro aluno
-- já era bloqueado. Elas devolviam zero linhas. Ficam como estão: acrescentar
-- um portão onde a RLS já resolve seria cinto sobre suspensório, e cada
-- `security definer` a menos é um lugar a menos pra errar.
--
-- A regra de autorização não é nova: é a MESMA de `admin_subject_scores` e
-- `admin_user_stats` (0911, professor), que já são as versões autorizadas
-- destas leituras. Aqui ela ganha um nome e um dono — `can_read_performance_of`
-- — em vez de ser copiada em três lugares, porque regra de acesso duplicada é
-- regra de acesso que diverge.
--
-- Por que devolver VAZIO em vez de levantar erro: é como a RLS se comporta no
-- resto do projeto, e é como `subject_scores` já se comportava para o mesmo
-- caso. Um erro aqui também contaria ao atacante que o alvo existe; o vazio
-- não conta nada. As telas legítimas nunca caem nele, porque sempre passam o
-- próprio id.
--
-- As três funções abaixo são as definições ATUAIS, extraídas dos arquivos de
-- origem sem reescrita manual — a única diferença é a linha do portão dentro
-- do `where` da CTE. Fazer o corte ali, e não num `if` no topo, é o que
-- mantém as funções em `language sql` (sem conversão pra plpgsql) e preserva
-- a assinatura, sem `drop` nem risco de sobrecarga ambígua.
-- ============================================================================

create or replace function public.can_read_performance_of(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_target_user_id is null
    or p_target_user_id = auth.uid()
    or public.is_admin()
    or public.is_teacher_of_student(p_target_user_id)
    or public.can_manage_school(public.current_school_id(p_target_user_id));
$$;

comment on function public.can_read_performance_of is
  'Quem pode ler o desempenho de um aluno: ele mesmo, um admin, o professor da turma dele ou quem administra a escola dele. Mesma regra de admin_subject_scores.';

grant execute on function public.can_read_performance_of(uuid) to authenticated;

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
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
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
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
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
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
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
grant execute on function public.topic_mastery(uuid) to authenticated;
grant execute on function public.recent_errors(uuid) to authenticated;
grant execute on function public.skill_mastery(uuid) to authenticated;
```

---

## 7. LGPD — Consentimento, acesso e eliminação

`20261002000200_lgpd.sql`

Data de nascimento, registro append-only de consentimento de responsável (art. 14), exportação dos dados e exclusão de conta (art. 18).

```sql
-- ============================================================================
-- Nexa — LGPD: consentimento de responsável, acesso e eliminação
--
-- O Nexa trata dado de criança e adolescente: nome, escola, turma, notas,
-- erros por questão, tempo de estudo. O art. 14 §1º da LGPD exige, para
-- menores de 12 anos, consentimento ESPECÍFICO E EM DESTAQUE de pai, mãe ou
-- responsável legal. Para adolescentes a lei é menos explícita, mas o
-- entendimento da ANPD e a prática defensável é pedir também — e, de todo
-- modo, uma escola vai perguntar. O art. 18 dá ao titular direito de ACESSO
-- aos dados e de ELIMINAÇÃO.
--
-- Nada disso existia: não havia data de nascimento, nem registro de que
-- alguém consentiu, nem como sair levando (ou apagando) os próprios dados.
--
-- `consent_records` é APPEND-ONLY, e essa é a decisão central aqui.
-- Consentimento é algo que se PROVA depois, às vezes anos depois, às vezes
-- para a ANPD. Uma linha que pode ser atualizada não prova nada: não dá pra
-- saber o que foi aceito, nem quando, nem se mudou. Então revogar não apaga
-- nem edita — grava `revoked_at` na linha existente e, se houver novo
-- consentimento, ele é uma LINHA NOVA. O histórico inteiro fica legível.
--
-- `document_version` guarda QUAL texto foi aceito. Sem isso, um
-- consentimento de hoje valeria como aceite de uma política reescrita amanhã,
-- que é exatamente o que a lei não admite.
--
-- Eliminação roda em SQL, não pela API de admin: 48 tabelas têm
-- `on delete cascade` em `auth.users`, então apagar a linha do usuário apaga
-- tudo que é dele numa transação só. Fazer isso por `auth.admin.deleteUser()`
-- exigiria a chave de serviço no servidor web — uma chave que ignora RLS
-- inteira — só para esta operação. Menos chave em circulação é menos
-- superfície.
-- ============================================================================

alter table public.profiles add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'Data de nascimento. Decide se o cadastro exige consentimento de responsável (LGPD art. 14).';

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'self' = maior de idade consentindo por si; 'guardian' = responsável legal.
  kind text not null check (kind in ('self', 'guardian')),
  guardian_name text check (guardian_name is null or length(btrim(guardian_name)) between 2 and 120),
  guardian_email text check (guardian_email is null or guardian_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  guardian_relationship text,
  -- Qual versão dos Termos e da Política foi aceita.
  document_version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Consentimento de responsável sem quem é o responsável não é consentimento.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'consent_records_guardian_check') then
    alter table public.consent_records add constraint consent_records_guardian_check
      check (kind <> 'guardian' or (guardian_name is not null and guardian_email is not null));
  end if;
end;
$$;

create index if not exists consent_records_user_idx on public.consent_records (user_id, accepted_at desc);

alter table public.consent_records enable row level security;

-- Leitura: o titular vê o próprio histórico; admin vê para auditoria.
drop policy if exists consent_records_select on public.consent_records;
create policy consent_records_select on public.consent_records
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Sem policy de insert/update/delete de propósito: gravar passa pela RPC, que
-- é o que garante que ninguém insere consentimento em nome de outra pessoa
-- nem reescreve um registro antigo.

-- ----------------------------------------------------------------------------
create or replace function public.record_consent(
  p_kind text,
  p_document_version text,
  p_guardian_name text default null,
  p_guardian_email text default null,
  p_guardian_relationship text default null
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
  if p_kind not in ('self', 'guardian') then
    raise exception 'tipo de consentimento inválido' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_document_version, '')), '') is null then
    raise exception 'é preciso registrar qual versão foi aceita' using errcode = '22023';
  end if;

  insert into public.consent_records (
    user_id, kind, guardian_name, guardian_email, guardian_relationship, document_version
  ) values (
    v_me, p_kind,
    nullif(btrim(p_guardian_name), ''), nullif(btrim(lower(p_guardian_email)), ''),
    nullif(btrim(p_guardian_relationship), ''), btrim(p_document_version)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.record_consent(text, text, text, text, text) to authenticated;

-- O consentimento vigente: o mais recente que não foi revogado.
create or replace function public.my_consent()
returns table (
  id uuid,
  kind text,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  document_version text,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.kind, c.guardian_name, c.guardian_email, c.guardian_relationship,
         c.document_version, c.accepted_at
  from public.consent_records c
  where c.user_id = auth.uid() and c.revoked_at is null
  order by c.accepted_at desc
  limit 1;
$$;

grant execute on function public.my_consent() to authenticated;

-- ----------------------------------------------------------------------------
-- Art. 18: acesso aos dados.
--
-- Devolve o que o Nexa guarda SOBRE O TITULAR. Não inclui conteúdo didático
-- (prova, questão, gabarito) — aquilo é material da plataforma, não dado
-- pessoal dele, e exportar gabarito junto transformaria o direito de acesso
-- num caminho novo pro gabarito.
-- ----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'exportado_em', now(),
    'perfil', (
      select to_jsonb(p) - 'id' from public.profiles p where p.id = auth.uid()
    ),
    'consentimentos', (
      select coalesce(jsonb_agg(to_jsonb(c) - 'user_id' order by c.accepted_at), '[]'::jsonb)
      from public.consent_records c where c.user_id = auth.uid()
    ),
    'materias', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', s.name, 'cor', s.color) order by s.sort_order), '[]'::jsonb)
      from public.subjects s where s.user_id = auth.uid()
    ),
    'tarefas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'titulo', t.title, 'tipo', t.kind, 'prazo', t.due_date, 'concluida_em', t.completed_at
      ) order by t.created_at), '[]'::jsonb)
      from public.tasks t where t.user_id = auth.uid()
    ),
    'sessoes_de_estudo', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'data', ss.local_date, 'segundos', ss.duration_seconds, 'origem', ss.source
      ) order by ss.local_date), '[]'::jsonb)
      from public.study_sessions ss where ss.user_id = auth.uid()
    ),
    'tentativas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'conteudo', r.title, 'acertos', qa.correct_count, 'total', qa.total_count,
        'segundos', qa.duration_seconds, 'terminada_em', qa.finished_at
      ) order by qa.started_at), '[]'::jsonb)
      from public.quiz_attempts qa
      join public.resources r on r.id = qa.resource_id
      where qa.user_id = auth.uid()
    ),
    'pontuacao', (
      select to_jsonb(st) - 'user_id' from public.user_stats st where st.user_id = auth.uid()
    ),
    'conquistas', (
      select coalesce(jsonb_agg(jsonb_build_object('conquista', a.name, 'em', ua.unlocked_at)
             order by ua.unlocked_at), '[]'::jsonb)
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = auth.uid()
    )
  ));
$$;

grant execute on function public.export_my_data() to authenticated;

-- ----------------------------------------------------------------------------
-- Art. 18: eliminação.
--
-- Apaga a linha de `auth.users`, e os 48 `on delete cascade` que apontam pra
-- ela levam o resto junto, numa transação só. É irreversível de propósito —
-- "excluir" que deixa rastro recuperável não é exclusão.
-- ----------------------------------------------------------------------------
create or replace function public.delete_my_account()
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

  -- Um admin que apagasse a própria conta pelo botão do Perfil poderia deixar
  -- a instalação sem nenhum administrador. Quem administra sai por outro
  -- caminho, com outra pessoa confirmando.
  if public.is_admin() then
    raise exception 'contas administrativas não são excluídas por aqui' using errcode = '42501';
  end if;

  delete from auth.users where id = v_me;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
```

---

## 8. Produção — Registro de erros

`20261002000300_error_reports.sql`

Guarda o que quebrou para quem está usando, para ler em `/admin/erros`. Hoje essa informação se perde.

```sql
-- ============================================================================
-- Nexa — Registro de erros de produção
--
-- Hoje, quando o app quebra para um aluno às 22h de domingo, a informação
-- simplesmente se perde: o `error.tsx` faz `console.error`, que vive nos logs
-- de função do servidor e some do alcance de quem precisa ver. Num piloto,
-- essa informação É o produto — é ela que diz o que consertar amanhã.
--
-- Por que uma tabela no próprio Supabase e não um Sentry da vida: para um
-- piloto, o que falta é poder VER o erro, e isso uma tabela resolve sem conta
-- nova, sem chave nova em produção e sem custo. O que se perde é agrupamento
-- por stack, alerta e source map — coisas que importam com milhares de
-- usuários, não com trinta. Se o piloto virar produto, trocar isto por um
-- serviço é meia hora, e esta tabela vira o histórico anterior.
--
-- Escrita é por RPC e não por insert direto, por um motivo específico: esta é
-- a ÚNICA tabela do app em que um usuário anônimo precisa poder gravar (um
-- erro no /login acontece antes de existir sessão). Uma policy de insert
-- aberta a `anon` é um endereço para encher o banco de lixo; a RPC pode
-- limitar tamanho, recusar o que não parece erro e, no futuro, cortar
-- repetição — coisas que uma policy não sabe fazer.
-- ============================================================================

create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  -- Nulo quando o erro aconteceu antes de haver sessão (login, cadastro).
  user_id uuid references auth.users (id) on delete set null,
  -- 'client' = boundary do React no navegador; 'server' = Server Action/Component.
  origin text not null default 'client' check (origin in ('client', 'server')),
  message text not null check (length(message) between 1 and 2000),
  -- Truncado na RPC: stack inteira de produção passa de 50 KB e não acrescenta
  -- nada depois dos primeiros quadros.
  stack text,
  -- Em que tela. Sem querystring, que é onde token e e-mail costumam viajar.
  pathname text,
  -- `digest` do Next: é por ele que se casa este registro com a linha do log
  -- do servidor, que tem a stack completa.
  digest text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists error_reports_recent_idx on public.error_reports (created_at desc);

alter table public.error_reports enable row level security;

-- Leitura só admin. Mensagem de erro carrega pedaço de estado da aplicação, e
-- aluno nenhum tem o que fazer com a de outro.
drop policy if exists error_reports_select_admin on public.error_reports;
create policy error_reports_select_admin on public.error_reports
  for select to authenticated using (public.is_admin());

-- Sem policy de insert: a gravação passa pela RPC abaixo.

create or replace function public.report_error(
  p_message text,
  p_origin text default 'client',
  p_stack text default null,
  p_pathname text default null,
  p_digest text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message text := nullif(btrim(p_message), '');
begin
  -- Sem mensagem não há o que registrar, e aceitar vazio é aceitar ruído.
  if v_message is null then
    return;
  end if;

  insert into public.error_reports (
    user_id, origin, message, stack, pathname, digest, user_agent
  ) values (
    auth.uid(),
    case when p_origin = 'server' then 'server' else 'client' end,
    left(v_message, 2000),
    left(nullif(btrim(p_stack), ''), 8000),
    -- Querystring fora: é onde `next=`, token de recuperação e e-mail viajam.
    left(split_part(nullif(btrim(p_pathname), ''), '?', 1), 300),
    left(nullif(btrim(p_digest), ''), 100),
    left(nullif(btrim(p_user_agent), ''), 400)
  );
end;
$$;

-- `anon` também: um erro na tela de login acontece antes de existir sessão, e
-- é justamente esse que hoje ninguém vê.
grant execute on function public.report_error(text, text, text, text, text, text) to authenticated, anon;

-- Últimos erros, para o painel do admin.
create or replace function public.recent_error_reports(p_limit integer default 100)
returns table (
  id uuid,
  origin text,
  message text,
  stack text,
  pathname text,
  digest text,
  user_agent text,
  user_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.origin, e.message, e.stack, e.pathname, e.digest, e.user_agent,
         p.full_name, e.created_at
  from public.error_reports e
  left join public.profiles p on p.id = e.user_id
  where public.is_admin()
  order by e.created_at desc
  limit greatest(1, least(500, coalesce(p_limit, 100)));
$$;

grant execute on function public.recent_error_reports(integer) to authenticated;
```

---
