-- ============================================================================
-- Nexa — suíte SQL: admin_topic_mastery() / class_subject_mastery()
--
-- Cobre, em ordem:
--   1. class_subject_mastery agrega certo (por assunto, ponderando turma) e
--      nunca mistura aluno de outra escola.
--   2. class_subject_mastery: admin vê; professor DA matéria vê; professor
--      de OUTRA matéria (mesma escola) é barrado.
--   3. admin_topic_mastery: professor da TURMA do aluno vê; professor de
--      outra turma (mesma escola) é barrado; aluno não pode chamar pra si
--      mesmo (só admin_/professor, o aluno usa topic_mastery() direto).
-- ============================================================================

\set ADMIN        '33333333-0000-0000-0000-000000000001'
\set PROF_MAT     '33333333-0000-0000-0000-000000000002'
\set PROF_HIST    '33333333-0000-0000-0000-000000000003'
\set ALUNO_A      '33333333-0000-0000-0000-000000000004'
\set ALUNO_B      '33333333-0000-0000-0000-000000000005'
\set ALUNO_OUTRA  '33333333-0000-0000-0000-000000000006'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-nexaai@nexa.test', '{"full_name": "Admin NexaAI"}'),
  (:'PROF_MAT', 'prof-mat-nexaai@nexa.test', '{"full_name": "Professor de Matemática"}'),
  (:'PROF_HIST', 'prof-hist-nexaai@nexa.test', '{"full_name": "Professor de História"}'),
  (:'ALUNO_A', 'aluno-a-nexaai@nexa.test', '{"full_name": "Aluno A"}'),
  (:'ALUNO_B', 'aluno-b-nexaai@nexa.test', '{"full_name": "Aluno B"}'),
  (:'ALUNO_OUTRA', 'aluno-outra-nexaai@nexa.test', '{"full_name": "Aluno de Outra Escola"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('93939393-0000-0000-0000-000000000001', 'Escola NexaAI 1', 'Recife', 'PE', true),
  ('93939393-0000-0000-0000-000000000002', 'Escola NexaAI 2', 'Olinda', 'PE', true);

\set TURMA_A '93939393-0000-0000-0000-0000000c1a01'
\set TURMA_B '93939393-0000-0000-0000-0000000c1a02'

insert into public.classes (id, school_id, name) values
  (:'TURMA_A', '93939393-0000-0000-0000-000000000001', 'Turma A'),
  (:'TURMA_B', '93939393-0000-0000-0000-000000000001', 'Turma B');

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set role = 'teacher_admin', school_id = '93939393-0000-0000-0000-000000000001'
  where id in (:'PROF_MAT', :'PROF_HIST');
update public.profiles set school_id = '93939393-0000-0000-0000-000000000001', class_id = :'TURMA_A' where id = :'ALUNO_A';
update public.profiles set school_id = '93939393-0000-0000-0000-000000000001', class_id = :'TURMA_B' where id = :'ALUNO_B';
update public.profiles set school_id = '93939393-0000-0000-0000-000000000002' where id = :'ALUNO_OUTRA';

select id from public.subject_catalog where slug = 'matematica' \gset mat_
select id from public.subject_catalog where slug = 'historia' \gset hist_

set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000001';
set role authenticated;

insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
values
  (:'PROF_MAT', '93939393-0000-0000-0000-000000000001', :'mat_id', :'TURMA_A'),
  (:'PROF_HIST', '93939393-0000-0000-0000-000000000001', :'hist_id', :'TURMA_A');

-- ---------------------------------------------------------------- fixture --
-- Um recurso de matemática com duas questões: Q1 tem assunto "Frações", Q2
-- não tem assunto (cai em "Geral").
insert into public.content_topics (id, subject_catalog_id, name, slug, sort_order)
values ('93939393-0000-0000-0000-0000000f0a01', :'mat_id', 'Frações NexaAI test', 'fracoes-nexaai-test', 999);

insert into public.resources (id, school_id, subject_catalog_id, kind, title, is_published, xp_reward)
values ('93939393-0000-0000-0000-000000000a01', '93939393-0000-0000-0000-000000000001', :'mat_id', 'quiz', 'Quiz NexaAI test', true, 50);

insert into public.questions (id, resource_id, position, statement, explanation, topic_id)
values
  ('93939393-0000-0000-0000-000000000a02', '93939393-0000-0000-0000-000000000a01', 1, 'Questão de frações', 'exp', '93939393-0000-0000-0000-0000000f0a01'),
  ('93939393-0000-0000-0000-000000000a03', '93939393-0000-0000-0000-000000000a01', 2, 'Questão geral', 'exp', null);

insert into public.question_options (question_id, position, body, is_correct) values
  ('93939393-0000-0000-0000-000000000a02', 1, 'certa', true),
  ('93939393-0000-0000-0000-000000000a02', 2, 'errada', false),
  ('93939393-0000-0000-0000-000000000a03', 1, 'certa', true),
  ('93939393-0000-0000-0000-000000000a03', 2, 'errada', false);

select set_config('nexa.q1_right', (select id::text from public.question_options where question_id = '93939393-0000-0000-0000-000000000a02' and is_correct), false);
select set_config('nexa.q1_wrong', (select id::text from public.question_options where question_id = '93939393-0000-0000-0000-000000000a02' and not is_correct), false);
select set_config('nexa.q2_right', (select id::text from public.question_options where question_id = '93939393-0000-0000-0000-000000000a03' and is_correct), false);

-- Aluno A (Turma A): erra Q1 (frações), acerta Q2 (geral).
set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000004';
set role authenticated;
select set_config('nexa.attempt_a', public.start_quiz_attempt('93939393-0000-0000-0000-000000000a01')::text, false);
do $$ begin
  perform public.answer_quiz_question(current_setting('nexa.attempt_a')::uuid, '93939393-0000-0000-0000-000000000a02', current_setting('nexa.q1_wrong')::uuid, 10);
  perform public.answer_quiz_question(current_setting('nexa.attempt_a')::uuid, '93939393-0000-0000-0000-000000000a03', current_setting('nexa.q2_right')::uuid, 10);
end; $$;
select public.finish_quiz_attempt(current_setting('nexa.attempt_a')::uuid);

-- Aluno B (Turma B, mesma escola): acerta Q1 (frações).
set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000005';
set role authenticated;
select set_config('nexa.attempt_b', public.start_quiz_attempt('93939393-0000-0000-0000-000000000a01')::text, false);
do $$ begin
  perform public.answer_quiz_question(current_setting('nexa.attempt_b')::uuid, '93939393-0000-0000-0000-000000000a02', current_setting('nexa.q1_right')::uuid, 10);
end; $$;
select public.finish_quiz_attempt(current_setting('nexa.attempt_b')::uuid);

-- Aluno de outra escola nem consegue tentar este recurso — `start_quiz_attempt`
-- já barra por `can_view_resource` (escola diferente da do recurso), então
-- nem é preciso testar que ele "não conta": ele não consegue nem responder.

-- ===========================================================================
-- 1 · class_subject_mastery — admin, escola inteira (sem turma): Frações
--     1/2 (Aluno A errou, Aluno B acertou), Geral 1/1.
-- ===========================================================================
set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000001';
set role authenticated;

select set_config('nexa.mat_id', :'mat_id', false);

do $$
declare
  v_correct bigint;
  v_total bigint;
  v_students bigint;
begin
  select correct_count, total_count, student_count into v_correct, v_total, v_students
  from public.class_subject_mastery('93939393-0000-0000-0000-000000000001', current_setting('nexa.mat_id')::uuid, null)
  where topic_name = 'Frações NexaAI test';

  assert v_total = 2, format('Frações (escola inteira) deveria ter 2 respostas, achei %s', v_total);
  assert v_correct = 1, format('Frações (escola inteira) deveria ter 1 certa, achei %s', v_correct);
  assert v_students = 2, format('Frações (escola inteira) deveria contar 2 alunos, achei %s', v_students);
end;
$$;

-- ===========================================================================
-- 2 · class_subject_mastery — só Turma A: Frações 0/1 (só o erro do Aluno A;
--     o acerto do Aluno B, que é da Turma B, some do recorte).
-- ===========================================================================
do $$
declare
  v_correct bigint;
  v_total bigint;
begin
  select correct_count, total_count into v_correct, v_total
  from public.class_subject_mastery(
    '93939393-0000-0000-0000-000000000001', current_setting('nexa.mat_id')::uuid, '93939393-0000-0000-0000-0000000c1a01'
  )
  where topic_name = 'Frações NexaAI test';

  assert v_total = 1, format('Frações (só Turma A) deveria ter 1 resposta, achei %s', v_total);
  assert v_correct = 0, format('Frações (só Turma A) deveria ter 0 certas (Aluno A errou), achei %s', v_correct);
end;
$$;

-- ===========================================================================
-- 3 · class_subject_mastery — professor de matéria certa vê; de outra não
-- ===========================================================================
set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000002';
set role authenticated;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.class_subject_mastery('93939393-0000-0000-0000-000000000001', current_setting('nexa.mat_id')::uuid);
  assert v_count > 0, 'professor de matemática deveria conseguir ler class_subject_mastery de matemática';
end;
$$;

set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000003';
set role authenticated;

do $$
begin
  begin
    perform 1 from public.class_subject_mastery('93939393-0000-0000-0000-000000000001', current_setting('nexa.mat_id')::uuid);
    assert false, 'professor de história NÃO deveria conseguir ler class_subject_mastery de matemática';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- ===========================================================================
-- 4 · admin_topic_mastery — professor da TURMA do aluno vê; de outra turma
--     (mesma escola) é barrado (is_teacher_of_student exige turma igual)
-- ===========================================================================
set "request.jwt.claim.sub" = '33333333-0000-0000-0000-000000000002';
set role authenticated;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.admin_topic_mastery('33333333-0000-0000-0000-000000000004');
  assert v_count > 0, 'professor da Turma A deveria conseguir ler admin_topic_mastery do Aluno A';
end;
$$;

do $$
begin
  begin
    perform 1 from public.admin_topic_mastery('33333333-0000-0000-0000-000000000005');
    assert false, 'professor da Turma A NÃO deveria conseguir ler admin_topic_mastery do Aluno B (Turma B)';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
