-- ============================================================================
-- Nexa — suíte SQL: skill_mastery() / common_error_types()
--
-- Um aluno responde 3 questões com `skills`/`error_types` cadastrados (2 de
-- uma habilidade, 1 de outra) e finaliza a tentativa. Confere:
--   1. skill_mastery agrega por habilidade a partir da resposta mais recente
--      (responder de novo muda o resultado, igual topic_mastery()).
--   2. common_error_types só conta as respostas ERRADAS mais recentes.
--   3. RLS: outro aluno não vê nada disso (cada um só enxerga o próprio).
-- ============================================================================

\set ADMIN '32323232-0000-0000-0000-000000000001'
\set ALUNO '32323232-0000-0000-0000-000000000002'
\set OUTRO '32323232-0000-0000-0000-000000000003'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-skillm@nexa.test', '{"full_name": "Admin Skill Mastery"}'),
  (:'ALUNO', 'aluno-skillm@nexa.test', '{"full_name": "Aluno Skill Mastery"}'),
  (:'OUTRO', 'outro-skillm@nexa.test', '{"full_name": "Outro Aluno Skill Mastery"}');

update public.profiles set role = 'admin' where id = :'ADMIN';

select id from public.subject_catalog where slug = 'fisica' \gset fisica_

set "request.jwt.claim.sub" = '32323232-0000-0000-0000-000000000001';
set role authenticated;

insert into public.resources (id, subject_catalog_id, kind, title, is_published, xp_reward)
values ('32323232-0000-0000-0000-0000000000a1', :'fisica_id', 'simulado', 'Simulado skill_mastery', true, 100);

-- Q1 e Q2: habilidade "interpretação"; Q3: habilidade "cálculo". Q1 e Q3
-- também carregam um error_type, pra testar a segunda função.
insert into public.questions (id, resource_id, position, statement, explanation, skills, error_types)
values
  ('32323232-0000-0000-0000-0000000000a2', '32323232-0000-0000-0000-0000000000a1', 1, 'Questão 1', 'exp', array['interpretação'], array['distração']),
  ('32323232-0000-0000-0000-0000000000a3', '32323232-0000-0000-0000-0000000000a1', 2, 'Questão 2', 'exp', array['interpretação'], '{}'),
  ('32323232-0000-0000-0000-0000000000a4', '32323232-0000-0000-0000-0000000000a1', 3, 'Questão 3', 'exp', array['cálculo'], array['conta']);

insert into public.question_options (question_id, position, body, is_correct) values
  ('32323232-0000-0000-0000-0000000000a2', 1, 'certa', true),
  ('32323232-0000-0000-0000-0000000000a2', 2, 'errada', false),
  ('32323232-0000-0000-0000-0000000000a3', 1, 'certa', true),
  ('32323232-0000-0000-0000-0000000000a3', 2, 'errada', false),
  ('32323232-0000-0000-0000-0000000000a4', 1, 'certa', true),
  ('32323232-0000-0000-0000-0000000000a4', 2, 'errada', false);

select set_config('nexa.sk_q1_right', (select id::text from public.question_options where question_id = '32323232-0000-0000-0000-0000000000a2' and is_correct), false);
select set_config('nexa.sk_q1_wrong', (select id::text from public.question_options where question_id = '32323232-0000-0000-0000-0000000000a2' and not is_correct), false);
select set_config('nexa.sk_q2_right', (select id::text from public.question_options where question_id = '32323232-0000-0000-0000-0000000000a3' and is_correct), false);
select set_config('nexa.sk_q3_wrong', (select id::text from public.question_options where question_id = '32323232-0000-0000-0000-0000000000a4' and not is_correct), false);

-- ===========================================================================
-- aluno responde: Q1 errada→depois certa (a mais recente é o que vale), Q2
-- certa, Q3 errada — e finaliza.
-- ===========================================================================
set "request.jwt.claim.sub" = '32323232-0000-0000-0000-000000000002';
set role authenticated;

select set_config('nexa.sk_attempt', public.start_quiz_attempt('32323232-0000-0000-0000-0000000000a1')::text, false);

do $$
begin
  perform public.answer_quiz_question(current_setting('nexa.sk_attempt')::uuid, '32323232-0000-0000-0000-0000000000a2', current_setting('nexa.sk_q1_wrong')::uuid, 10);
  perform public.answer_quiz_question(current_setting('nexa.sk_attempt')::uuid, '32323232-0000-0000-0000-0000000000a2', current_setting('nexa.sk_q1_right')::uuid, 5);
  perform public.answer_quiz_question(current_setting('nexa.sk_attempt')::uuid, '32323232-0000-0000-0000-0000000000a3', current_setting('nexa.sk_q2_right')::uuid, 8);
  perform public.answer_quiz_question(current_setting('nexa.sk_attempt')::uuid, '32323232-0000-0000-0000-0000000000a4', current_setting('nexa.sk_q3_wrong')::uuid, 12);
end;
$$;

select public.finish_quiz_attempt(current_setting('nexa.sk_attempt')::uuid);

-- ===========================================================================
-- 1 · skill_mastery: "interpretação" 2/2 (Q1 acabou certa), "cálculo" 0/1
-- ===========================================================================
do $$
declare
  v_interpretacao_correct bigint;
  v_interpretacao_total bigint;
  v_calculo_correct bigint;
  v_calculo_total bigint;
begin
  select correct_count, total_count into v_interpretacao_correct, v_interpretacao_total
  from public.skill_mastery() where skill = 'interpretação';
  select correct_count, total_count into v_calculo_correct, v_calculo_total
  from public.skill_mastery() where skill = 'cálculo';

  assert v_interpretacao_total = 2, format('interpretação deveria ter 2 questões, achei %s', v_interpretacao_total);
  assert v_interpretacao_correct = 2, format('interpretação deveria ter 2 certas (Q1 corrigida), achei %s', v_interpretacao_correct);
  assert v_calculo_total = 1, format('cálculo deveria ter 1 questão, achei %s', v_calculo_total);
  assert v_calculo_correct = 0, format('cálculo deveria ter 0 certas, achei %s', v_calculo_correct);
end;
$$;

-- ===========================================================================
-- 2 · common_error_types: só Q3 está errada na resposta mais recente — "distração"
--     (de Q1) não deveria aparecer, porque a última resposta de Q1 foi certa.
-- ===========================================================================
do $$
declare
  v_count integer;
  v_conta_occurrences bigint;
begin
  select count(*) into v_count from public.common_error_types();
  assert v_count = 1, format('deveria haver só 1 tipo de erro (o de Q3), achei %s', v_count);

  select occurrences into v_conta_occurrences from public.common_error_types() where error_type = 'conta';
  assert v_conta_occurrences = 1, 'o erro "conta" (de Q3) deveria aparecer 1 vez';

  perform 1 from public.common_error_types() where error_type = 'distração';
  assert not found, 'distração (Q1) não deveria aparecer — a resposta mais recente de Q1 está certa';
end;
$$;

-- ===========================================================================
-- 3 · outro aluno não vê nada disso (nunca respondeu nada)
-- ===========================================================================
set "request.jwt.claim.sub" = '32323232-0000-0000-0000-000000000003';
set role authenticated;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.skill_mastery();
  assert v_count = 0, 'outro aluno não deveria ter nenhuma linha em skill_mastery()';

  select count(*) into v_count from public.common_error_types();
  assert v_count = 0, 'outro aluno não deveria ter nenhuma linha em common_error_types()';
end;
$$;

reset role;
