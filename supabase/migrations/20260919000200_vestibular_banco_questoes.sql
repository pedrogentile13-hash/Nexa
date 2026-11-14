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
