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
