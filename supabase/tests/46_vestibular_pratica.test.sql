-- ============================================================================
-- Nexa Vestibular — Fase 1: banco de questões avulsas.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. `practice_questions` devolver gabarito. É a mesma classe de bug que
--      `quiz_questions` evita desde o começo do projeto — só que agora por um
--      caminho novo. Se cair, o aluno lê a resposta certa no JSON da tela.
--   2. Resposta ser reescrita DEPOIS do feedback. Como a prática revela a
--      alternativa certa na hora, permitir corrigir a escolha é permitir
--      100% de acerto em qualquer sessão.
--   3. Um aluno ler/responder a sessão de outro.
--   4. Questão escolar entrar no banco de prática (o espelho do item #1 da
--      Fase 0 — contexto de novo).
--   5. XP pago duas vezes pela mesma sessão.
-- ============================================================================

\set ALUNO '11111111-8888-8888-8888-888888888880'
\set OUTRO '11111111-8888-8888-8888-888888888881'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'aluno-pratica@nexa.test', '{"full_name": "Aluno Prática"}'),
  (:'OUTRO', 'outro-pratica@nexa.test', '{"full_name": "Outro Prática"}');

select set_config('nexa.aluno', :'ALUNO', false);
select set_config('nexa.outro', :'OUTRO', false);

-- Matéria PRÓPRIA desta suíte: as outras suítes rodam no mesmo banco e já
-- deixaram questão de vestibular em Matemática, o que tornaria toda contagem
-- aqui dependente da ordem dos arquivos.
insert into public.subject_catalog (id, slug, name, area)
values ('99999999-0000-0000-0000-0000000000a1', 'pratica-teste', 'Prática Teste', 'matematica');
select set_config('nexa.subject', '99999999-0000-0000-0000-0000000000a1', false);

select id from public.exams where slug = 'enem' \gset enem_
select set_config('nexa.enem', :'enem_id', false);

-- Três questões de vestibular + uma escolar (a que NÃO pode aparecer).
insert into public.resources (id, subject_catalog_id, kind, title, is_published, context, exam_id)
values
  ('66666666-0000-0000-0000-000000000001', '99999999-0000-0000-0000-0000000000a1', 'quiz', 'Prova ENEM 2024', true, 'vestibular', :'enem_id'),
  ('66666666-0000-0000-0000-000000000002', '99999999-0000-0000-0000-0000000000a1', 'quiz', 'Quiz da escola', true, 'school', null);

insert into public.questions (id, resource_id, position, statement, difficulty, explanation) values
  ('77777777-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', 1, 'ENEM: quanto é 2 + 2?', 'medio', 'Soma simples.'),
  ('77777777-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000001', 2, 'ENEM: quanto é 3 + 3?', 'medio', 'Soma simples.'),
  ('77777777-0000-0000-0000-000000000003', '66666666-0000-0000-0000-000000000001', 3, 'ENEM: quanto é 4 + 4?', 'dificil', 'Soma simples.'),
  ('77777777-0000-0000-0000-000000000009', '66666666-0000-0000-0000-000000000002', 1, 'ESCOLA: quanto é 1 + 1?', 'facil', 'Soma simples.');

insert into public.question_options (id, question_id, position, body, is_correct) values
  ('88888888-0000-0000-0000-000000000011', '77777777-0000-0000-0000-000000000001', 1, '4', true),
  ('88888888-0000-0000-0000-000000000012', '77777777-0000-0000-0000-000000000001', 2, '5', false),
  ('88888888-0000-0000-0000-000000000021', '77777777-0000-0000-0000-000000000002', 1, '6', true),
  ('88888888-0000-0000-0000-000000000022', '77777777-0000-0000-0000-000000000002', 2, '7', false),
  ('88888888-0000-0000-0000-000000000031', '77777777-0000-0000-0000-000000000003', 1, '8', true),
  ('88888888-0000-0000-0000-000000000032', '77777777-0000-0000-0000-000000000003', 2, '9', false),
  ('88888888-0000-0000-0000-000000000091', '77777777-0000-0000-0000-000000000009', 1, '2', true),
  ('88888888-0000-0000-0000-000000000092', '77777777-0000-0000-0000-000000000009', 2, '3', false);

set "request.jwt.claim.sub" = '11111111-8888-8888-8888-888888888880'; -- ALUNO
set role authenticated;

-- ============================================================================
-- 1 · Filtros só enxergam vestibular.
-- ============================================================================
do $$
declare
  v_count bigint;
begin
  select question_count into v_count
  from public.practice_filters() where kind = 'subject' and id = current_setting('nexa.subject')::uuid;

  assert v_count = 3,
    format('o banco de prática deveria ter 3 questões de vestibular em Matemática, tem %s — a questão da ESCOLA vazou pro banco de vestibular', v_count);
end;
$$;

-- ============================================================================
-- 2 · A sessão congela o conjunto e NÃO devolve gabarito.
-- ============================================================================
do $$
declare
  v_session uuid;
  v_ids uuid[];
  v_options jsonb;
begin
  v_session := public.start_practice_session(null, current_setting('nexa.subject')::uuid, null, 10);
  perform set_config('nexa.session', v_session::text, false);

  select question_ids into v_ids from public.practice_sessions where id = v_session;
  assert cardinality(v_ids) = 3,
    format('a sessão deveria congelar as 3 questões de vestibular, congelou %s', cardinality(v_ids));
  assert not ('77777777-0000-0000-0000-000000000009'::uuid = any (v_ids)),
    'a questão da ESCOLA entrou numa sessão de prática de vestibular';

  select options into v_options from public.practice_questions(v_session) limit 1;
  assert v_options::text not like '%is_correct%',
    format('practice_questions vazou o gabarito nas alternativas: %s', v_options::text);
  assert v_options::text not like '%correct%',
    format('practice_questions vazou algo com "correct" nas alternativas: %s', v_options::text);
end;
$$;

-- Duas chamadas seguidas devolvem a MESMA ordem (conjunto congelado).
do $$
declare
  v_first uuid;
  v_again uuid;
begin
  select question_id into v_first
  from public.practice_questions(current_setting('nexa.session')::uuid) order by question_position limit 1;
  select question_id into v_again
  from public.practice_questions(current_setting('nexa.session')::uuid) order by question_position limit 1;

  assert v_first = v_again, 'a questão 1 da sessão mudou entre duas leituras — o conjunto não está congelado';
end;
$$;

-- ============================================================================
-- 3 · Responder: feedback imediato, sem reescrita.
-- ============================================================================
do $$
declare
  v_correct boolean;
  v_option uuid;
  v_explanation text;
begin
  select is_correct, correct_option_id, explanation into v_correct, v_option, v_explanation
  from public.answer_practice_question(
    current_setting('nexa.session')::uuid,
    '77777777-0000-0000-0000-000000000001',
    '88888888-0000-0000-0000-000000000012', -- errada de propósito
    30
  );

  assert v_correct = false, 'marcou a alternativa errada e a função disse que acertou';
  assert v_option = '88888888-0000-0000-0000-000000000011',
    'o feedback não apontou a alternativa correta';
  assert v_explanation = 'Soma simples.', 'a explicação não veio no feedback';
end;
$$;

do $$
declare
  v_reescreveu boolean := false;
begin
  begin
    perform public.answer_practice_question(
      current_setting('nexa.session')::uuid,
      '77777777-0000-0000-0000-000000000001',
      '88888888-0000-0000-0000-000000000011', -- agora a certa, depois de ver o feedback
      5
    );
    v_reescreveu := true;
  exception when others then
    null; -- esperado
  end;

  assert not v_reescreveu,
    'o aluno reescreveu a resposta DEPOIS de ver o gabarito — qualquer sessão vira 100%%';
end;
$$;

-- Questão de fora da sessão é recusada.
do $$
declare
  v_aceitou boolean := false;
begin
  begin
    perform public.answer_practice_question(
      current_setting('nexa.session')::uuid,
      '77777777-0000-0000-0000-000000000009', -- questão da escola, nunca esteve na sessão
      '88888888-0000-0000-0000-000000000091',
      1
    );
    v_aceitou := true;
  exception when others then
    null;
  end;
  assert not v_aceitou, 'aceitou resposta de uma questão que não pertence à sessão';
end;
$$;

-- Acerta as outras duas.
select public.answer_practice_question(current_setting('nexa.session')::uuid,
  '77777777-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000021', 20);
select public.answer_practice_question(current_setting('nexa.session')::uuid,
  '77777777-0000-0000-0000-000000000003', '88888888-0000-0000-0000-000000000031', 25);

-- ============================================================================
-- 4 · Encerrar: placar certo, XP pago UMA vez.
-- ============================================================================
do $$
declare
  v_correct integer;
  v_total integer;
  v_xp integer;
begin
  select correct_count, total_count, xp_awarded into v_correct, v_total, v_xp
  from public.finish_practice_session(current_setting('nexa.session')::uuid);

  assert v_correct = 2, format('esperava 2 acertos, veio %s', v_correct);
  assert v_total = 3, format('esperava 3 questões, veio %s', v_total);
  assert v_xp > 0, 'a sessão encerrada não pagou XP nenhum';
end;
$$;

do $$
declare
  v_xp integer;
  v_events integer;
begin
  select xp_awarded into v_xp
  from public.finish_practice_session(current_setting('nexa.session')::uuid);
  assert v_xp = 0, format('encerrar a mesma sessão de novo pagou %s de XP — dedup falhou', v_xp);

  select count(*) into v_events from public.xp_events
  where user_id = current_setting('nexa.aluno')::uuid and source_type = 'practice';
  assert v_events = 1, format('esperava 1 evento de XP de prática, tem %s', v_events);
end;
$$;

-- ============================================================================
-- 5 · A revisão (pós-sessão) PODE mostrar o gabarito.
-- ============================================================================
do $$
declare
  v_rows integer;
  v_mine text;
  v_right text;
begin
  select count(*) into v_rows from public.practice_session_review(current_setting('nexa.session')::uuid);
  assert v_rows = 3, format('a revisão deveria trazer as 3 questões, trouxe %s', v_rows);

  select my_option_body, correct_option_body into v_mine, v_right
  from public.practice_session_review(current_setting('nexa.session')::uuid)
  where question_id = '77777777-0000-0000-0000-000000000001';

  assert v_mine = '5', format('a revisão mostrou a escolha errada do aluno como %s', coalesce(v_mine, 'null'));
  assert v_right = '4', format('a revisão não mostrou a alternativa correta (veio %s)', coalesce(v_right, 'null'));
end;
$$;

-- ============================================================================
-- 6 · Seleção prioriza o que o aluno nunca respondeu.
--
--     As 3 questões já foram respondidas; peço 1 só. A que sobra em primeiro
--     lugar tem que ser a que ele ERROU, nunca uma que ele já acertou.
-- ============================================================================
do $$
declare
  v_session uuid;
  v_ids uuid[];
begin
  v_session := public.start_practice_session(null, current_setting('nexa.subject')::uuid, null, 1);
  select question_ids into v_ids from public.practice_sessions where id = v_session;

  assert v_ids[1] = '77777777-0000-0000-0000-000000000001',
    'com tudo respondido, a próxima questão deveria ser a que o aluno ERROU, veio outra';
end;
$$;

-- Filtro de dificuldade respeitado.
do $$
declare
  v_session uuid;
  v_ids uuid[];
begin
  v_session := public.start_practice_session(null, current_setting('nexa.subject')::uuid, 'dificil', 10);
  select question_ids into v_ids from public.practice_sessions where id = v_session;
  assert cardinality(v_ids) = 1 and v_ids[1] = '77777777-0000-0000-0000-000000000003',
    'o filtro de dificuldade trouxe questão fora do filtro';
end;
$$;

-- Filtro sem resultado falha em vez de abrir sessão vazia.
do $$
declare
  v_abriu boolean := false;
begin
  begin
    perform public.start_practice_session(null, current_setting('nexa.subject')::uuid, 'facil', 10);
    v_abriu := true;
  exception when others then
    null;
  end;
  assert not v_abriu, 'abriu uma sessão de prática sem nenhuma questão que atendesse ao filtro';
end;
$$;

reset role;

-- ============================================================================
-- 7 · Sessão dos outros é invisível.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-8888-8888-8888-888888888881'; -- OUTRO
set role authenticated;

do $$
declare
  v_rows integer;
begin
  select count(*) into v_rows from public.practice_questions(current_setting('nexa.session')::uuid);
  assert v_rows = 0, 'OUTRO leu as questões da sessão do ALUNO';

  select count(*) into v_rows from public.practice_session_review(current_setting('nexa.session')::uuid);
  assert v_rows = 0, 'OUTRO leu a revisão (com gabarito) da sessão do ALUNO';

  select count(*) into v_rows from public.list_practice_sessions();
  assert v_rows = 0, format('OUTRO viu %s sessões alheias na própria lista', v_rows);

  select count(*) into v_rows from public.practice_sessions;
  assert v_rows = 0, 'RLS de practice_sessions deixou OUTRO ler as sessões do ALUNO';

  select count(*) into v_rows from public.practice_answers;
  assert v_rows = 0, 'RLS de practice_answers deixou OUTRO ler as respostas do ALUNO';
end;
$$;

do $$
declare
  v_respondeu boolean := false;
begin
  begin
    perform public.answer_practice_question(current_setting('nexa.session')::uuid,
      '77777777-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000021', 1);
    v_respondeu := true;
  exception when others then
    null;
  end;
  assert not v_respondeu, 'OUTRO respondeu dentro da sessão do ALUNO';
end;
$$;

do $$
declare
  v_encerrou boolean := false;
begin
  begin
    perform public.finish_practice_session(current_setting('nexa.session')::uuid);
    v_encerrou := true;
  exception when others then
    null;
  end;
  assert not v_encerrou, 'OUTRO encerrou a sessão do ALUNO';
end;
$$;

reset role;

-- ============================================================================
-- 8 · Flag desligada bloqueia abrir sessão.
-- ============================================================================
update public.feature_flags set enabled = false where key = 'vestibular_enabled';

set "request.jwt.claim.sub" = '11111111-8888-8888-8888-888888888880'; -- ALUNO
set role authenticated;

do $$
declare
  v_abriu boolean := false;
begin
  begin
    perform public.start_practice_session(null, current_setting('nexa.subject')::uuid, null, 5);
    v_abriu := true;
  exception when others then
    null;
  end;
  assert not v_abriu, 'start_practice_session funcionou com vestibular_enabled desligado';
end;
$$;

reset role;
update public.feature_flags set enabled = true where key = 'vestibular_enabled';

select 'ok' as result;
