-- ============================================================================
-- Nexa — trava de resposta em modo quiz (evita manipular a própria nota).
--
-- O que esta suíte existe para impedir:
--   1. Em modo quiz/practice (onde a resposta certa é revelada na hora),
--      responder de novo a mesma questão depois de já ter respondido —
--      isso deixaria o aluno errar de propósito, ver o gabarito no retorno
--      da própria função, e corrigir a resposta antes de finalizar.
--   2. Que a trava acima quebre o fluxo legítimo de simulado/exame, onde
--      nada é revelado durante a prova e voltar pra mudar de resposta é
--      esperado.
--   3. Que "marcar para revisar" antes de responder conte como resposta já
--      dada (a linha que `toggle_question_flag` cria tem `option_id` nulo).
-- ============================================================================

\set ADMIN '33333333-3333-3333-3333-333333333340'
\set ALUNO '44444444-4444-4444-4444-444444444440'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-quizlock@nexa.test', '{"full_name": "Admin QuizLock"}'),
  (:'ALUNO', 'aluno-quizlock@nexa.test', '{"full_name": "Aluno QuizLock"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('aaaaaaaa-0000-0000-0000-000000000040', 'Escola QuizLock', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = 'aaaaaaaa-0000-0000-0000-000000000040' where id = :'ALUNO';

set "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333340'; -- ADMIN
set role authenticated;

select id from public.subject_catalog where slug = 'fisica' \gset fisica_

-- Um QUIZ (não simulado) — kind='quiz' deriva exam_mode='practice', que é o
-- modo que revela a resposta certa na hora.
insert into public.resources (id, subject_catalog_id, kind, title, is_published)
values ('cccccccc-0000-0000-0000-000000000040', :'fisica_id', 'quiz', 'Quiz de trava de resposta', true);

-- E um SIMULADO — kind='simulado' deriva exam_mode='exam', onde reescrever
-- a resposta antes de finalizar continua legítimo.
insert into public.resources (id, subject_catalog_id, kind, title, is_published)
values ('cccccccc-0000-0000-0000-000000000041', :'fisica_id', 'simulado', 'Simulado de trava de resposta', true);

insert into public.questions (id, resource_id, position, statement, explanation) values
  ('dddddddd-0000-0000-0000-000000000040', 'cccccccc-0000-0000-0000-000000000040', 1, 'Questão do quiz', 'Explicação.'),
  ('dddddddd-0000-0000-0000-000000000041', 'cccccccc-0000-0000-0000-000000000041', 1, 'Questão do simulado', 'Explicação.');

insert into public.question_options (question_id, position, body, is_correct) values
  ('dddddddd-0000-0000-0000-000000000040', 1, 'errada', false),
  ('dddddddd-0000-0000-0000-000000000040', 2, 'certa', true),
  ('dddddddd-0000-0000-0000-000000000041', 1, 'errada', false),
  ('dddddddd-0000-0000-0000-000000000041', 2, 'certa', true);

select set_config('nexa.quiz_wrong',
  (select id::text from public.question_options where question_id = 'dddddddd-0000-0000-0000-000000000040' and position = 1), false);
select set_config('nexa.quiz_right',
  (select id::text from public.question_options where question_id = 'dddddddd-0000-0000-0000-000000000040' and is_correct), false);
select set_config('nexa.sim_wrong',
  (select id::text from public.question_options where question_id = 'dddddddd-0000-0000-0000-000000000041' and position = 1), false);
select set_config('nexa.sim_right',
  (select id::text from public.question_options where question_id = 'dddddddd-0000-0000-0000-000000000041' and is_correct), false);

reset role;

set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444440'; -- ALUNO
set role authenticated;

-- ============================================================================
-- 1 · modo quiz: responder de novo (mesmo com a certa) é bloqueado
-- ============================================================================
select set_config('nexa.quiz_attempt',
  public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000040')::text, false);

do $$
declare
  v_correct boolean;
begin
  select is_correct into v_correct from public.answer_quiz_question(
    current_setting('nexa.quiz_attempt')::uuid,
    'dddddddd-0000-0000-0000-000000000040',
    current_setting('nexa.quiz_wrong')::uuid
  );
  assert v_correct = false, 'primeira resposta (errada) não deveria vir certa';
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.answer_quiz_question(
      current_setting('nexa.quiz_attempt')::uuid,
      'dddddddd-0000-0000-0000-000000000040',
      current_setting('nexa.quiz_right')::uuid
    );
    v_falhou := true;
  exception when others then
    null; -- esperado: modo quiz não deixa responder de novo
  end;
  assert not v_falhou, 'consegui corrigir a resposta em modo quiz depois de ver o gabarito — nota manipulável';
end;
$$;

-- A resposta registrada continua sendo a ERRADA original — não foi
-- sobrescrita por baixo dos panos.
do $$
declare
  v_stored_correct boolean;
begin
  select is_correct into v_stored_correct from public.quiz_answers
  where attempt_id = current_setting('nexa.quiz_attempt')::uuid
    and question_id = 'dddddddd-0000-0000-0000-000000000040';
  assert v_stored_correct = false, 'a resposta errada original foi sobrescrita mesmo com a trava';
end;
$$;

-- ============================================================================
-- 2 · modo simulado/exame: reescrever a resposta continua permitido
-- ============================================================================
select set_config('nexa.sim_attempt',
  public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000041')::text, false);

do $$
declare
  v_correct boolean;
begin
  select is_correct into v_correct from public.answer_quiz_question(
    current_setting('nexa.sim_attempt')::uuid,
    'dddddddd-0000-0000-0000-000000000041',
    current_setting('nexa.sim_wrong')::uuid
  );
  assert v_correct = false, 'primeira resposta do simulado (errada) não deveria vir certa';

  -- Muda de ideia antes de finalizar — legítimo em modo exame, sem gabarito revelado.
  select is_correct into v_correct from public.answer_quiz_question(
    current_setting('nexa.sim_attempt')::uuid,
    'dddddddd-0000-0000-0000-000000000041',
    current_setting('nexa.sim_right')::uuid
  );
  assert v_correct = true, 'simulado deveria continuar permitindo reescrever a resposta antes de finalizar';
end;
$$;

-- ============================================================================
-- 3 · marcar para revisar ANTES de responder não conta como resposta dada
-- ============================================================================
-- `start_quiz_attempt` reaproveita a tentativa aberta do mesmo recurso —
-- precisa encerrar a de cima primeiro pra este passo valer como caso novo.
do $$
begin
  perform public.finish_quiz_attempt(current_setting('nexa.quiz_attempt')::uuid);
end;
$$;

select set_config('nexa.quiz_attempt3',
  public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000040')::text, false);

do $$
declare
  v_correct boolean;
begin
  perform public.toggle_question_flag(current_setting('nexa.quiz_attempt3')::uuid, 'dddddddd-0000-0000-0000-000000000040');

  select is_correct into v_correct from public.answer_quiz_question(
    current_setting('nexa.quiz_attempt3')::uuid,
    'dddddddd-0000-0000-0000-000000000040',
    current_setting('nexa.quiz_right')::uuid
  );
  assert v_correct = true, 'marcar pra revisar antes de responder bloqueou a primeira resposta de verdade';
end;
$$;

reset role;

select 'ok' as result;
