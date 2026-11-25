-- ============================================================================
-- Nexa — 0911 (4) · Tempo limite do simulado, hoje só decorativo
--
-- `quiz-runner.tsx` mostra o cronômetro regressivo (fica vermelho abaixo de
-- 60s) mas nada — nem cliente, nem servidor — parava de aceitar resposta
-- depois de zerar. Um simulado com limite de 20 minutos podia ser respondido
-- por tempo indeterminado sem nenhuma consequência.
--
-- A resposta não é travar a NAVEGAÇÃO do aluno (o componente já tem uma regra
-- deliberada de nunca bloquear o avanço numa falha de rede — ver comentário
-- em `submitAnswer`, `quiz-runner.tsx`) — é fazer a resposta enviada depois
-- do prazo simplesmente não contar pra nota, do mesmo jeito que já acontece
-- hoje quando a chamada falha por qualquer outro motivo (rede, RLS...): o
-- aluno consegue clicar, mas a resposta não é gravada. Uma folga de 15s
-- absorve latência de rede normal sem abrir brecha de verdade.
-- ============================================================================

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

grant execute on function public.answer_quiz_question(uuid, uuid, uuid) to authenticated;
