-- ============================================================================
-- Nexa — questões DISCURSIVAS em quizzes e simulados, com correção por IA
--
-- Uma prova pode misturar questões objetivas (alternativas) e discursivas (o aluno escreve). A resposta esperada e os
-- critérios (`model_answer`, `rubric`) são o gabarito da discursiva: ninguém além do administrador e da IA os lê, e o
-- aluno só os vê no gabarito DEPOIS de encerrar a tentativa — igual ao `is_correct` das alternativas.
--
-- A nota vem de fora (a IA corrige no servidor), então gravá-la NÃO pode ser uma função aberta ao aluno: senão qualquer
-- um daria nota máxima para si mesmo. `discursive_grading_context` e `record_discursive_grade` só rodam com a chave de
-- serviço (service_role), que fica apenas no servidor do Nexa.
-- ============================================================================

alter table public.questions
  add column if not exists kind text not null default 'objetiva',
  add column if not exists model_answer text,
  add column if not exists rubric text;

alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions add constraint questions_kind_check check (kind in ('objetiva', 'discursiva'));

-- Discursiva sem resposta esperada deixaria a IA corrigir "no escuro": o banco recusa.
alter table public.questions drop constraint if exists questions_discursive_ref_check;
alter table public.questions add constraint questions_discursive_ref_check
  check (kind = 'objetiva' or length(btrim(coalesce(model_answer, ''))) >= 10);

alter table public.quiz_answers
  add column if not exists answer_text text,
  add column if not exists ai_score numeric(4, 3),
  add column if not exists ai_feedback text,
  add column if not exists graded_at timestamptz;

alter table public.quiz_answers drop constraint if exists quiz_answers_discursive_check;
alter table public.quiz_answers add constraint quiz_answers_discursive_check
  check (
    (answer_text is null or length(answer_text) <= 6000)
    and (ai_score is null or ai_score between 0 and 1)
    and (ai_feedback is null or length(ai_feedback) <= 4000)
  );

-- ------------------------------------------------- leitura pelo aluno -------
-- `quiz_questions` ganha `kind` (sem gabarito, como sempre). Muda o tipo de retorno: precisa de `drop`.
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
  options jsonb,
  kind text
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
    -- Sem `is_correct`. A ordem é a de cadastro: embaralhar aqui faria a posição divergir entre a tela e a correção.
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'body', o.body) order by o.position)
       from public.question_options o where o.question_id = q.id),
      '[]'::jsonb
    ),
    q.kind
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
  'Questões de um quiz/simulado SEM o gabarito (nem a resposta esperada das discursivas). Única porta de leitura para o aluno.';

grant execute on function public.quiz_questions(uuid) to authenticated;

-- Restaura respostas já salvas, agora também o texto das discursivas e a correção.
drop function if exists public.quiz_attempt_state(uuid);

create or replace function public.quiz_attempt_state(p_attempt_id uuid)
returns table (question_id uuid, option_id uuid, flagged boolean, answer_text text, ai_score numeric, ai_feedback text)
language sql
stable
security definer
set search_path = public
as $$
  select qa.question_id, qa.option_id, qa.flagged, qa.answer_text, qa.ai_score, qa.ai_feedback
  from public.quiz_answers qa
  join public.quiz_attempts a on a.id = qa.attempt_id
  where qa.attempt_id = p_attempt_id and a.user_id = auth.uid();
$$;

grant execute on function public.quiz_attempt_state(uuid) to authenticated;

-- Gabarito completo (só com a tentativa encerrada): ganha o tipo, o texto escrito, a nota da IA e a resposta esperada.
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
  is_correct boolean,
  kind text,
  answer_text text,
  ai_score numeric,
  ai_feedback text,
  model_answer text
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
    coalesce(ans.is_correct, false),
    q.kind,
    ans.answer_text,
    ans.ai_score,
    ans.ai_feedback,
    case when q.kind = 'discursiva' then q.model_answer end
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

-- ------------------------------------------------ guardar o texto do aluno --
-- Autosave/envio do texto. Não corrige nada. Depois de corrigida, a resposta fica travada (não dá para reescrever e
-- pedir outra nota). Aceita também tentativa encerrada: no simulado a correção por IA é pedida depois, no gabarito.
create or replace function public.save_discursive_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_text text,
  p_time_spent_seconds integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_text text := btrim(coalesce(p_text, ''));
  v_finished timestamptz;
  v_graded timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Entre para continuar.' using errcode = '28000';
  end if;
  if length(v_text) < 1 or length(v_text) > 6000 then
    raise exception 'A resposta precisa ter de 1 a 6000 caracteres.' using errcode = '22023';
  end if;

  select a.finished_at into v_finished
  from public.quiz_attempts a
  where a.id = p_attempt_id and a.user_id = auth.uid();
  if not found then
    raise exception 'tentativa inválida' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id and q.kind = 'discursiva'
  ) then
    raise exception 'esta não é uma questão discursiva desta tentativa' using errcode = '23514';
  end if;

  -- Simulado com cronômetro: a mesma tolerância das objetivas, só enquanto a tentativa está aberta.
  if v_finished is null and exists (
    select 1
    from public.quiz_attempts a
    join public.resources r on r.id = a.resource_id
    where a.id = p_attempt_id
      and coalesce(r.time_limit_seconds, 0) > 0
      and now() > a.started_at + make_interval(secs => r.time_limit_seconds) + interval '15 seconds'
  ) then
    raise exception 'tempo esgotado' using errcode = '55000';
  end if;

  select qa.graded_at into v_graded
  from public.quiz_answers qa where qa.attempt_id = p_attempt_id and qa.question_id = p_question_id;
  if v_graded is not null then
    raise exception 'esta resposta já foi corrigida' using errcode = '23514';
  end if;

  insert into public.quiz_answers (attempt_id, question_id, answer_text, is_correct, time_spent_seconds)
  values (p_attempt_id, p_question_id, v_text, false, greatest(0, coalesce(p_time_spent_seconds, 0)))
  on conflict (attempt_id, question_id) do update
    set answer_text = excluded.answer_text,
        answered_at = now(),
        time_spent_seconds = public.quiz_answers.time_spent_seconds + greatest(0, coalesce(p_time_spent_seconds, 0));

  return true;
end;
$$;

grant execute on function public.save_discursive_answer(uuid, uuid, text, integer) to authenticated;

-- ---------------------------------------- só o servidor (chave de serviço) --
-- O que a IA precisa para corrigir: enunciado, resposta esperada, critérios e o texto do aluno.
create or replace function public.discursive_grading_context(p_attempt_id uuid, p_question_id uuid)
returns table (
  user_id uuid,
  statement text,
  model_answer text,
  rubric text,
  points numeric,
  subject_name text,
  topic_name text,
  answer_text text,
  graded_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.user_id, q.statement, q.model_answer, q.rubric, q.points,
         coalesce(qsc.name, rsc.name), t.name, qa.answer_text, qa.graded_at
  from public.quiz_attempts a
  join public.questions q on q.resource_id = a.resource_id and q.id = p_question_id and q.kind = 'discursiva'
  join public.resources r on r.id = a.resource_id
  left join public.quiz_answers qa on qa.attempt_id = a.id and qa.question_id = q.id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  where a.id = p_attempt_id;
$$;

-- Grava a nota da IA (0 a 1). Corrige UMA vez por resposta. Considera "certa" a partir de 60%, e, se a tentativa já foi
-- encerrada (simulado corrigido depois), atualiza o total de acertos dela.
create or replace function public.record_discursive_grade(
  p_attempt_id uuid,
  p_question_id uuid,
  p_score numeric,
  p_feedback text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_done integer;
begin
  if p_score is null or p_score < 0 or p_score > 1 then
    raise exception 'nota inválida' using errcode = '22023';
  end if;

  update public.quiz_answers qa
  set ai_score = round(p_score, 3),
      ai_feedback = left(btrim(coalesce(p_feedback, '')), 4000),
      graded_at = now(),
      is_correct = p_score >= 0.6
  where qa.attempt_id = p_attempt_id and qa.question_id = p_question_id
    and qa.graded_at is null and qa.answer_text is not null;
  get diagnostics v_done = row_count;

  if v_done = 0 then
    return false;
  end if;

  update public.quiz_attempts a
  set correct_count = least(
    a.total_count,
    (select count(*) from public.quiz_answers x where x.attempt_id = a.id and x.is_correct)::integer
  )
  where a.id = p_attempt_id and a.finished_at is not null;

  return true;
end;
$$;

revoke execute on function public.discursive_grading_context(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.record_discursive_grade(uuid, uuid, numeric, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.discursive_grading_context(uuid, uuid) to service_role;
    grant execute on function public.record_discursive_grade(uuid, uuid, numeric, text) to service_role;
  end if;
end;
$$;


-- ----------------------------- desempenho: discursiva sem nota não conta ------
-- Mesmo corpo de `20261002000100_desempenho_autorizacao` (com o portão de autorização), mais uma linha no `where` da CTE.

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
      -- Discursiva ainda sem correção da IA não é erro nem acerto: fica fora até a nota sair.
      and (ans.answer_text is null or ans.graded_at is not null)
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
      -- Discursiva ainda sem correção da IA não é erro nem acerto: fica fora até a nota sair.
      and (ans.answer_text is null or ans.graded_at is not null)
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
      -- Discursiva ainda sem correção da IA não é erro nem acerto: fica fora até a nota sair.
      and (ans.answer_text is null or ans.graded_at is not null)
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

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
