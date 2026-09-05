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
