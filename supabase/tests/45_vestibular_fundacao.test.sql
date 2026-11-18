-- ============================================================================
-- Nexa Vestibular — Fase 0: fundação.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. Questão de vestibular entrar na NOTA ESCOLAR do aluno (item #69 do
--      plano). É a razão de `resources.context` existir — se este teste cair,
--      o boletim de todo aluno da plataforma passou a contar ENEM.
--   2. `vestibular_overview` contar conteúdo escolar (o espelho do item 1).
--   3. Perfil/objetivos de vestibular vazarem entre alunos.
--   4. A flag desligada não bloquear de verdade.
-- ============================================================================

\set ALUNO '11111111-9999-9999-9999-999999999990'
\set OUTRO '11111111-9999-9999-9999-999999999991'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'aluno-vest@nexa.test', '{"full_name": "Aluno Vestibular"}'),
  (:'OUTRO', 'outro-vest@nexa.test', '{"full_name": "Outro Aluno"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('22222222-0000-0000-0000-000000000090', 'Escola Vestibular', 'São Paulo', 'SP', true);

update public.profiles set school_id = '22222222-0000-0000-0000-000000000090'
  where id in (:'ALUNO', :'OUTRO');

select id from public.subject_catalog where slug = 'matematica' limit 1 \gset subject_
select set_config('nexa.subject', :'subject_id', false);
select set_config('nexa.aluno', :'ALUNO', false);

-- A matéria precisa existir na grade do aluno pra `subject_scores` devolver linha.
insert into public.subjects (user_id, catalog_id, name, color)
values (:'ALUNO', :'subject_id', 'Matemática', 'blue');

select id from public.exams where slug = 'enem' \gset enem_
select set_config('nexa.enem', :'enem_id', false);

-- ============================================================================
-- 1 · Dois conteúdos idênticos, um de cada contexto, ambos respondidos 100%.
--     Só o escolar pode aparecer na nota.
-- ============================================================================
insert into public.resources (id, subject_catalog_id, kind, title, is_published, context)
values
  ('33333333-0000-0000-0000-000000000001', :'subject_id', 'quiz', 'Quiz da escola', true, 'school'),
  ('33333333-0000-0000-0000-000000000002', :'subject_id', 'quiz', 'Quiz do ENEM', true, 'vestibular');

update public.resources set exam_id = :'enem_id' where id = '33333333-0000-0000-0000-000000000002';

insert into public.questions (id, resource_id, position, statement) values
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 1, 'Quanto é 2 + 2 na escola?'),
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 1, 'Quanto é 2 + 2 no ENEM?');

insert into public.question_options (id, question_id, position, body, is_correct) values
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 1, '4', true),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 2, '5', false),
  ('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000002', 1, '4', true),
  ('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000002', 2, '5', false);

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999990'; -- ALUNO
set role authenticated;

do $$
declare
  v_attempt uuid;
begin
  -- Escolar: acerta e finaliza.
  v_attempt := public.start_quiz_attempt('33333333-0000-0000-0000-000000000001');
  perform public.answer_quiz_question(v_attempt, '44444444-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001');
  perform public.finish_quiz_attempt(v_attempt);

  -- Vestibular: acerta e finaliza também.
  v_attempt := public.start_quiz_attempt('33333333-0000-0000-0000-000000000002');
  perform public.answer_quiz_question(v_attempt, '44444444-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000003');
  perform public.finish_quiz_attempt(v_attempt);
end;
$$;

do $$
declare
  v_quizzes integer;
begin
  select quizzes_done into v_quizzes
  from public.subject_scores(current_setting('nexa.aluno')::uuid)
  where subject_name = 'Matemática';

  assert v_quizzes = 1,
    format('a nota escolar deveria contar APENAS o quiz da escola (1), contou %s — questão de vestibular vazou pro boletim', v_quizzes);
end;
$$;

do $$
declare
  v_simulados integer;
begin
  -- `simulado_history` e `performance_evolution` compartilham o mesmo filtro;
  -- aqui basta provar que a tentativa de vestibular não entra em nenhuma das
  -- agregações de nota (nenhum simulado foi feito, escolar nem vestibular).
  select count(*) into v_simulados from public.simulado_history(current_setting('nexa.aluno')::uuid);
  assert v_simulados = 0, format('nenhum simulado foi respondido, histórico trouxe %s', v_simulados);
end;
$$;

-- ============================================================================
-- 2 · O espelho: o painel do vestibular conta só o que é do vestibular.
-- ============================================================================
select public.save_vestibular_profile(current_setting('nexa.enem')::uuid, 2026, 2026, 120);

do $$
declare
  v_answered bigint;
  v_quizzes bigint;
  v_exam text;
begin
  select questions_answered, quizzes_done, exam_name
    into v_answered, v_quizzes, v_exam
  from public.vestibular_overview();

  assert v_answered = 1, format('o painel do vestibular deveria contar 1 questão, contou %s', v_answered);
  assert v_quizzes = 1, format('o painel do vestibular deveria contar 1 quiz, contou %s', v_quizzes);
  assert v_exam = 'ENEM', format('o alvo deveria ser o ENEM, veio %s', coalesce(v_exam, 'null'));
end;
$$;

-- Listagem de conteúdo de vestibular não traz o quiz da escola.
do $$
declare
  v_total integer;
  v_title text;
begin
  select count(*), min(title) into v_total, v_title from public.list_vestibular_resources();
  assert v_total = 1, format('esperava 1 conteúdo de vestibular visível, veio %s', v_total);
  assert v_title = 'Quiz do ENEM', format('trouxe o conteúdo errado: %s', v_title);
end;
$$;

reset role;

-- ============================================================================
-- 3 · Perfil e objetivos são privados.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999991'; -- OUTRO
set role authenticated;

do $$
declare
  v_rows integer;
begin
  select count(*) into v_rows from public.get_vestibular_profile();
  assert v_rows = 0, 'OUTRO enxergou o perfil vestibular do ALUNO';

  select count(*) into v_rows from public.vestibular_profiles;
  assert v_rows = 0, 'RLS de vestibular_profiles deixou OUTRO ler a linha do ALUNO';
end;
$$;

select public.set_exam_target(current_setting('nexa.enem')::uuid, 2027, 1, 'Medicina', 780);

do $$
declare
  v_rows integer;
  v_course text;
begin
  select count(*), min(target_course) into v_rows, v_course from public.list_exam_targets();
  assert v_rows = 1, format('OUTRO deveria ver só o próprio objetivo, viu %s', v_rows);
  assert v_course = 'Medicina', format('objetivo veio errado: %s', coalesce(v_course, 'null'));
end;
$$;

reset role;

-- ============================================================================
-- 4 · Flag desligada bloqueia de verdade (não só esconde a tela).
-- ============================================================================
update public.feature_flags set enabled = false where key = 'vestibular_enabled';

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999990'; -- ALUNO
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.save_vestibular_profile(current_setting('nexa.enem')::uuid, 2026, 2026, 60);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'save_vestibular_profile funcionou com vestibular_enabled desligado';
end;
$$;

reset role;
update public.feature_flags set enabled = true where key = 'vestibular_enabled';

select 'ok' as result;
