-- ============================================================================
-- Nexa Vestibular — Fase 2: central de erros + desempenho da preparação.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. O desempenho de vestibular enxergar só UMA das duas origens de
--      resposta (prova ou treino). É o bug que a própria Fase 1 criou ao
--      abrir a segunda origem — se cair, o painel diz "0 questões" pra quem
--      acabou de treinar 40.
--   2. Questão ESCOLAR entrar no desempenho de vestibular (o espelho do
--      item #1 da Fase 0).
--   3. Uma questão já corrigida continuar na central de erros.
--   4. Desempenho vazar entre alunos.
-- ============================================================================

\set ALUNO '11111111-7777-7777-7777-777777777770'
\set OUTRO '11111111-7777-7777-7777-777777777771'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'aluno-desemp@nexa.test', '{"full_name": "Aluno Desempenho"}'),
  (:'OUTRO', 'outro-desemp@nexa.test', '{"full_name": "Outro Desempenho"}');

select set_config('nexa.aluno', :'ALUNO', false);

insert into public.subject_catalog (id, slug, name, area)
values ('99999999-0000-0000-0000-0000000000b1', 'desemp-teste', 'Desempenho Teste', 'matematica');
select set_config('nexa.subject', '99999999-0000-0000-0000-0000000000b1', false);

select id from public.exams where slug = 'fuvest' \gset fuvest_

-- Duas questões de vestibular (uma vai pra prova, outra pro treino) e uma
-- escolar, que não pode aparecer em lugar nenhum desta suíte.
insert into public.resources (id, subject_catalog_id, kind, title, is_published, context, exam_id)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-0000000000b1', 'quiz', 'FUVEST — prova', true, 'vestibular', :'fuvest_id'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '99999999-0000-0000-0000-0000000000b1', 'quiz', 'FUVEST — avulsas', true, 'vestibular', :'fuvest_id'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '99999999-0000-0000-0000-0000000000b1', 'quiz', 'Quiz da escola', true, 'school', null);

insert into public.questions (id, resource_id, position, statement, difficulty, explanation) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'PROVA: 2 + 2?', 'medio', 'Soma.'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 1, 'TREINO: 3 + 3?', 'medio', 'Soma.'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 1, 'ESCOLA: 1 + 1?', 'facil', 'Soma.');

insert into public.question_options (id, question_id, position, body, is_correct) values
  ('cccccccc-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000001', 1, '4', true),
  ('cccccccc-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000001', 2, '5', false),
  ('cccccccc-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000002', 1, '6', true),
  ('cccccccc-0000-0000-0000-000000000022', 'bbbbbbbb-0000-0000-0000-000000000002', 2, '7', false),
  ('cccccccc-0000-0000-0000-000000000031', 'bbbbbbbb-0000-0000-0000-000000000003', 1, '2', true),
  ('cccccccc-0000-0000-0000-000000000032', 'bbbbbbbb-0000-0000-0000-000000000003', 2, '3', false);

set "request.jwt.claim.sub" = '11111111-7777-7777-7777-777777777770'; -- ALUNO
set role authenticated;

-- ============================================================================
-- 1 · Uma resposta de PROVA (errada) + uma de TREINO (errada) + uma ESCOLAR
--     (certa). O desempenho de vestibular tem que ver exatamente as duas
--     primeiras.
-- ============================================================================
do $$
declare
  v_attempt uuid;
  v_session uuid;
begin
  -- Prova de vestibular: erra.
  v_attempt := public.start_quiz_attempt('aaaaaaaa-0000-0000-0000-000000000001');
  perform public.answer_quiz_question(v_attempt, 'bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000012');
  perform public.finish_quiz_attempt(v_attempt);

  -- Quiz da escola: acerta (não pode contar aqui).
  v_attempt := public.start_quiz_attempt('aaaaaaaa-0000-0000-0000-000000000003');
  perform public.answer_quiz_question(v_attempt, 'bbbbbbbb-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000031');
  perform public.finish_quiz_attempt(v_attempt);

  -- Treino avulso: erra.
  v_session := public.start_practice_session(null, current_setting('nexa.subject')::uuid, null, 10);
  perform set_config('nexa.session', v_session::text, false);
  perform public.answer_practice_question(v_session, 'bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000022', 10);
end;
$$;

do $$
declare
  v_total integer;
  v_sources text;
begin
  select count(*), string_agg(distinct source, ',' order by source)
    into v_total, v_sources
  from public.vestibular_latest_answers();

  assert v_total = 2,
    format('o desempenho de vestibular deveria ver 2 respostas (1 de prova + 1 de treino), viu %s', v_total);
  assert v_sources = 'prova,treino',
    format('as duas origens de resposta deveriam aparecer, vieram: %s', coalesce(v_sources, 'nenhuma'));
end;
$$;

-- A questão da escola não entrou por nenhum caminho.
do $$
declare
  v_leak integer;
begin
  select count(*) into v_leak from public.vestibular_latest_answers()
  where question_id = 'bbbbbbbb-0000-0000-0000-000000000003';
  assert v_leak = 0, 'a questão ESCOLAR entrou no desempenho de vestibular';
end;
$$;

-- ============================================================================
-- 2 · Desempenho por matéria e por assunto somam as duas origens.
-- ============================================================================
do $$
declare
  v_total bigint;
  v_correct bigint;
  v_status text;
begin
  select total_count, correct_count, status into v_total, v_correct, v_status
  from public.vestibular_subject_performance()
  where subject_id = current_setting('nexa.subject')::uuid;

  assert v_total = 2, format('a matéria deveria somar 2 questões (prova + treino), somou %s', v_total);
  assert v_correct = 0, format('as duas foram erradas, mas contou %s acerto(s)', v_correct);
  assert v_status = 'revisar', format('0%% de acerto deveria virar status "revisar", virou %s', v_status);
end;
$$;

do $$
declare
  v_total bigint;
begin
  select sum(total_count) into v_total
  from public.vestibular_topic_performance(current_setting('nexa.subject')::uuid);
  assert v_total = 2, format('o desempenho por assunto deveria somar 2 questões, somou %s', v_total);
end;
$$;

-- E o painel geral também.
do $$
declare
  v_answered bigint;
  v_practices bigint;
begin
  select questions_answered, practices_done into v_answered, v_practices
  from public.vestibular_overview();
  assert v_answered = 2, format('o painel deveria contar 2 questões respondidas, contou %s', v_answered);
  assert v_practices = 0, format('nenhum treino foi ENCERRADO ainda, o painel contou %s', v_practices);
end;
$$;

select public.finish_practice_session(current_setting('nexa.session')::uuid);

do $$
declare
  v_practices bigint;
begin
  select practices_done into v_practices from public.vestibular_overview();
  assert v_practices = 1, format('depois de encerrar, o painel deveria contar 1 treino, contou %s', v_practices);
end;
$$;

-- ============================================================================
-- 3 · Central de erros lista as duas, com gabarito (a sessão já foi corrigida).
-- ============================================================================
do $$
declare
  v_total integer;
  v_gabarito text;
begin
  select count(*) into v_total from public.vestibular_error_list();
  assert v_total = 2, format('a central de erros deveria listar 2 questões, listou %s', v_total);

  select correct_option_body into v_gabarito from public.vestibular_error_list()
  where question_id = 'bbbbbbbb-0000-0000-0000-000000000001';
  assert v_gabarito = '4', format('a central de erros não mostrou a alternativa correta (veio %s)', coalesce(v_gabarito, 'null'));
end;
$$;

-- ============================================================================
-- 4 · Refazer os erros abre uma sessão só com eles — e acertar tira a questão
--     da lista.
-- ============================================================================
do $$
declare
  v_session uuid;
  v_ids uuid[];
begin
  v_session := public.start_error_practice(current_setting('nexa.subject')::uuid, 10);
  perform set_config('nexa.retry', v_session::text, false);

  select question_ids into v_ids from public.practice_sessions where id = v_session;
  assert cardinality(v_ids) = 2,
    format('a sessão de erros deveria ter as 2 questões erradas, teve %s', cardinality(v_ids));
  assert not ('bbbbbbbb-0000-0000-0000-000000000003'::uuid = any (v_ids)),
    'a questão ESCOLAR entrou na sessão de refazer erros';
end;
$$;

select public.answer_practice_question(current_setting('nexa.retry')::uuid,
  'bbbbbbbb-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000011', 5);

do $$
declare
  v_total integer;
  v_still integer;
begin
  select count(*) into v_total from public.vestibular_error_list();
  select count(*) into v_still from public.vestibular_error_list()
  where question_id = 'bbbbbbbb-0000-0000-0000-000000000001';

  assert v_still = 0,
    'a questão foi refeita e ACERTADA, mas continua na central de erros — o critério não é a resposta mais recente';
  assert v_total = 1, format('deveria sobrar 1 erro pendente, sobraram %s', v_total);
end;
$$;

-- Sem erro pendente no filtro, a função recusa em vez de abrir sessão vazia.
do $$
declare
  v_abriu boolean := false;
begin
  begin
    -- Matéria sem nenhuma resposta do aluno.
    perform public.start_error_practice('00000000-0000-0000-0000-0000000000ff', 10);
    v_abriu := true;
  exception when others then
    null;
  end;
  assert not v_abriu, 'abriu uma sessão de refazer erros sem nenhum erro pendente';
end;
$$;

reset role;

-- ============================================================================
-- 5 · Nada disso vaza pra outro aluno.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-7777-7777-7777-777777777771'; -- OUTRO
set role authenticated;

do $$
declare
  v_rows integer;
  v_answered bigint;
begin
  select count(*) into v_rows from public.vestibular_latest_answers();
  assert v_rows = 0, format('OUTRO viu %s resposta(s) do ALUNO', v_rows);

  select count(*) into v_rows from public.vestibular_error_list();
  assert v_rows = 0, 'OUTRO viu a central de erros do ALUNO (com gabarito junto)';

  select count(*) into v_rows from public.vestibular_subject_performance();
  assert v_rows = 0, 'OUTRO viu o desempenho por matéria do ALUNO';

  select questions_answered into v_answered from public.vestibular_overview();
  assert coalesce(v_answered, 0) = 0, format('o painel de OUTRO contou %s questões do ALUNO', v_answered);
end;
$$;

reset role;

select 'ok' as result;
