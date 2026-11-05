-- ============================================================================
-- Nexa — suíte SQL: Simulados v2 (retomada de tentativa, marcação, tempo por
-- questão, matéria por questão, redação).
--
-- Cobre, em ordem:
--   1. `start_quiz_attempt` reaproveita a tentativa aberta (não cria órfã).
--   2. `answer_quiz_question` acumula tempo e preserva `flagged`;
--      `toggle_question_flag` alterna sem mexer na resposta.
--   3. `quiz_questions`/`quiz_attempt_review` resolvem a matéria por questão
--      (override) e devolvem os metadados novos.
--   4. Redação: aluno grava rascunho e entrega; só quem gerencia a matéria
--      do recurso corrige (nunca o próprio aluno, nunca professor de outra
--      matéria); RLS de `essay_submissions` esconde a linha de terceiros.
-- ============================================================================

\set ADMIN    '31313131-0000-0000-0000-000000000001'
\set ALUNO    '31313131-0000-0000-0000-000000000002'
\set OUTRO    '31313131-0000-0000-0000-000000000003'
\set PROF_OK  '31313131-0000-0000-0000-000000000004'
\set PROF_NO  '31313131-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-simv2@nexa.test', '{"full_name": "Admin Simulados v2"}'),
  (:'ALUNO', 'aluno-simv2@nexa.test', '{"full_name": "Aluno Simulados v2"}'),
  (:'OUTRO', 'outro-simv2@nexa.test', '{"full_name": "Outro Aluno"}'),
  (:'PROF_OK', 'prof-ok-simv2@nexa.test', '{"full_name": "Professor da Matéria"}'),
  (:'PROF_NO', 'prof-no-simv2@nexa.test', '{"full_name": "Professor de Outra Matéria"}');

insert into public.schools (id, name, city, state, is_verified)
values ('31313131-0000-0000-0000-0000000000f1', 'Colégio Simulados v2', 'Recife', 'PE', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = '31313131-0000-0000-0000-0000000000f1' where id in (:'ALUNO', :'OUTRO', :'PROF_OK', :'PROF_NO');
update public.profiles set role = 'teacher_admin' where id in (:'PROF_OK', :'PROF_NO');

select id from public.subject_catalog where slug = 'fisica' \gset fisica_
select id from public.subject_catalog where slug = 'historia' \gset historia_

insert into public.classes (id, school_id, name)
values ('31313131-0000-0000-0000-0000000000c1', '31313131-0000-0000-0000-0000000000f1', 'Turma v2');

set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000001';
set role authenticated;

insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
values
  (:'PROF_OK', '31313131-0000-0000-0000-0000000000f1', :'fisica_id', '31313131-0000-0000-0000-0000000000c1'),
  (:'PROF_NO', '31313131-0000-0000-0000-0000000000f1', :'historia_id', '31313131-0000-0000-0000-0000000000c1');

-- ---------------------------------------------------------------- fixture --
-- Simulado de Física com uma questão de Física (sem override) e uma questão
-- de História (override — prova mista, seção 14 do pedido) + uma redação.
insert into public.resources (id, school_id, subject_catalog_id, kind, title, is_published, xp_reward)
values ('31313131-0000-0000-0000-0000000000a1', '31313131-0000-0000-0000-0000000000f1', :'fisica_id', 'simulado', 'Simulado misto v2', true, 100);

insert into public.questions (id, resource_id, position, statement, explanation, subject_catalog_id, subtopic, book, module, skills, error_types, group_id, resource_refs)
values
  ('31313131-0000-0000-0000-0000000000a2', '31313131-0000-0000-0000-0000000000a1', 1, 'Questão de Física', 'Explicação 1.', null, 'Cinemática', 3, 27, array['interpretação'], array['content'], 'G1', array['TXT01']),
  ('31313131-0000-0000-0000-0000000000a3', '31313131-0000-0000-0000-0000000000a1', 2, 'Questão de História', 'Explicação 2.', :'historia_id', null, null, null, '{}', '{}', null, '{}');

insert into public.question_options (question_id, position, body, is_correct) values
  ('31313131-0000-0000-0000-0000000000a2', 1, 'A', true),
  ('31313131-0000-0000-0000-0000000000a2', 2, 'B', false),
  ('31313131-0000-0000-0000-0000000000a3', 1, 'A', false),
  ('31313131-0000-0000-0000-0000000000a3', 2, 'B', true);

insert into public.writing_tasks (id, resource_id, position, title, genre, theme, prompt, min_words, max_words)
values ('31313131-0000-0000-0000-0000000000a4', '31313131-0000-0000-0000-0000000000a1', 1, 'Produção de Texto', 'artigo_de_opiniao', 'Tema v2', 'Escreva um artigo de opinião.', 10, 500);

-- `question_options` não tem policy de SELECT para aluno (de propósito — é o
-- gabarito). Resolve os IDs enquanto ainda somos o admin, e leva pra frente
-- em GUCs — o aluno nunca lê a tabela direto, nem aqui no teste.
select set_config('nexa.v2_right',
  (select id::text from public.question_options where question_id = '31313131-0000-0000-0000-0000000000a2' and is_correct), false);
select set_config('nexa.v2_wrong',
  (select id::text from public.question_options where question_id = '31313131-0000-0000-0000-0000000000a2' and not is_correct), false);

-- ===========================================================================
-- 1 · start_quiz_attempt reaproveita a tentativa aberta
-- ===========================================================================
set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000002';
set role authenticated;

select set_config('nexa.v2_attempt', public.start_quiz_attempt('31313131-0000-0000-0000-0000000000a1')::text, false);

do $$
declare
  v_second uuid;
begin
  v_second := public.start_quiz_attempt('31313131-0000-0000-0000-0000000000a1');
  assert v_second::text = current_setting('nexa.v2_attempt'), 'uma segunda chamada com tentativa aberta deveria devolver a MESMA tentativa';
end;
$$;

-- ===========================================================================
-- 2 · tempo acumulado + flag preservada ao responder de novo
-- ===========================================================================
do $$
begin
  perform public.answer_quiz_question(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a2', current_setting('nexa.v2_wrong')::uuid, 20);
  perform public.toggle_question_flag(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a2');
  perform public.answer_quiz_question(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a2', current_setting('nexa.v2_right')::uuid, 15);
end;
$$;

do $$
declare
  v_time integer;
  v_flag boolean;
  v_option uuid;
begin
  select time_spent_seconds, flagged, option_id into v_time, v_flag, v_option
  from public.quiz_answers
  where attempt_id = current_setting('nexa.v2_attempt')::uuid and question_id = '31313131-0000-0000-0000-0000000000a2';

  assert v_time = 35, format('tempo deveria acumular 20+15=35, achei %s', v_time);
  assert v_flag, 'responder de novo NÃO deveria desmarcar a bandeira de revisão';
  assert v_option = current_setting('nexa.v2_right')::uuid, 'a última resposta é a que vale';
end;
$$;

-- `quiz_attempt_state` devolve exatamente o que foi salvo.
do $$
declare
  v_flag boolean;
begin
  select flagged into v_flag from public.quiz_attempt_state(current_setting('nexa.v2_attempt')::uuid)
  where question_id = '31313131-0000-0000-0000-0000000000a2';
  assert v_flag, 'quiz_attempt_state deveria refletir a marcação salva';
end;
$$;

-- ===========================================================================
-- 3 · matéria por questão (override) chega em quiz_questions
-- ===========================================================================
do $$
declare
  v_fisica_name text;
  v_historia_name text;
begin
  select subject_name into v_fisica_name from public.quiz_questions('31313131-0000-0000-0000-0000000000a1')
  where question_id = '31313131-0000-0000-0000-0000000000a2';
  select subject_name into v_historia_name from public.quiz_questions('31313131-0000-0000-0000-0000000000a1')
  where question_id = '31313131-0000-0000-0000-0000000000a3';

  assert v_fisica_name = 'Física', format('questão sem override deveria herdar a matéria do recurso (Física), achei %s', v_fisica_name);
  assert v_historia_name = 'História', format('questão com override deveria mostrar História, achei %s', v_historia_name);
end;
$$;

-- ===========================================================================
-- 4 · redação: rascunho, entrega, e RLS de essay_submissions
-- ===========================================================================
select public.save_essay_draft(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a4', 'Um rascunho inicial curto.');
select public.save_essay_draft(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a4', 'Um rascunho maior, com mais de dez palavras contadas de verdade agora.');
select public.submit_essay(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a4');

do $$
declare
  v_submitted boolean;
  v_words integer;
begin
  select is_submitted, word_count into v_submitted, v_words
  from public.essay_submissions
  where attempt_id = current_setting('nexa.v2_attempt')::uuid and writing_task_id = '31313131-0000-0000-0000-0000000000a4';
  assert v_submitted, 'a redação deveria estar marcada como entregue';
  assert v_words > 5, format('contagem de palavras deveria refletir o texto final, achei %s', v_words);
end;
$$;

-- Autosave depois de entregue não reabre o texto (silencioso, não erro).
select public.save_essay_draft(current_setting('nexa.v2_attempt')::uuid, '31313131-0000-0000-0000-0000000000a4', 'Isso não deveria substituir o texto entregue.');

do $$
declare
  v_content text;
begin
  select content into v_content from public.essay_submissions
  where attempt_id = current_setting('nexa.v2_attempt')::uuid and writing_task_id = '31313131-0000-0000-0000-0000000000a4';
  assert v_content <> 'Isso não deveria substituir o texto entregue.', 'autosave depois de entregue NÃO deveria sobrescrever o texto';
end;
$$;

-- O próprio aluno não corrige a própria redação.
do $$
declare
  v_id uuid;
  v_falhou boolean := false;
begin
  select id into v_id from public.essay_submissions
  where attempt_id = current_setting('nexa.v2_attempt')::uuid and writing_task_id = '31313131-0000-0000-0000-0000000000a4';
  perform set_config('nexa.v2_essay', v_id::text, false);

  begin
    perform public.grade_essay(v_id, '{"C1": 2}'::jsonb, 8);
    v_falhou := true;
  exception when insufficient_privilege then null;
  end;
  assert not v_falhou, 'o próprio aluno NÃO deveria conseguir corrigir a própria redação';
end;
$$;

reset role;
reset "request.jwt.claim.sub";

-- Um segundo aluno não enxerga a redação alheia (RLS de essay_submissions).
set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000003';
set role authenticated;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.essay_submissions
  where id = current_setting('nexa.v2_essay')::uuid;
  assert v_count = 0, 'outro aluno NÃO deveria enxergar a redação de quem não é ele';
end;
$$;

reset role;
reset "request.jwt.claim.sub";

-- Professor de OUTRA matéria (História) não corrige a redação de um
-- simulado cuja matéria do recurso é Física.
set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000005';
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.grade_essay(current_setting('nexa.v2_essay')::uuid, '{"C1": 2}'::jsonb, 8);
    v_falhou := true;
  exception when insufficient_privilege then null;
  end;
  assert not v_falhou, 'professor de História NÃO deveria corrigir redação de um simulado de Física';
end;
$$;

reset role;
reset "request.jwt.claim.sub";

-- Professor DA matéria do recurso (Física) corrige normalmente.
set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000004';
set role authenticated;

select public.grade_essay(current_setting('nexa.v2_essay')::uuid, '{"C1": 2, "C2": 2}'::jsonb, 9);

reset role;
reset "request.jwt.claim.sub";

do $$
declare
  v_total numeric;
  v_by uuid;
begin
  select total_score, corrected_by into v_total, v_by from public.essay_submissions
  where id = current_setting('nexa.v2_essay')::uuid;
  assert v_total = 9, format('nota deveria ser 9, achei %s', v_total);
  assert v_by = '31313131-0000-0000-0000-000000000004', 'corrected_by deveria ser o professor da matéria';
end;
$$;

-- ===========================================================================
-- 5 · quiz_attempt_review devolve os metadados novos, depois de finalizar
-- ===========================================================================
set "request.jwt.claim.sub" = '31313131-0000-0000-0000-000000000002';
set role authenticated;

select public.finish_quiz_attempt(current_setting('nexa.v2_attempt')::uuid);

do $$
declare
  v_subtopic text;
  v_book smallint;
  v_time integer;
  v_skills text[];
begin
  select subtopic, book, time_spent_seconds, skills into v_subtopic, v_book, v_time, v_skills
  from public.quiz_attempt_review(current_setting('nexa.v2_attempt')::uuid)
  where question_id = '31313131-0000-0000-0000-0000000000a2';

  assert v_subtopic = 'Cinemática', 'quiz_attempt_review deveria devolver o subtópico da questão';
  assert v_book = 3, 'quiz_attempt_review deveria devolver o número da apostila';
  assert v_time = 35, 'quiz_attempt_review deveria devolver o tempo acumulado';
  assert v_skills = array['interpretação'], 'quiz_attempt_review deveria devolver as habilidades da questão';
end;
$$;

reset role;
reset "request.jwt.claim.sub";

select 'ok' as result;
