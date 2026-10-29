-- ============================================================================
-- Nexa Vestibular — Fase 3: plano de estudo e Reta Final.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. O plano ordenar errado. É a única coisa que o plano FAZ — se a ordem
--      não é "cai muito e você erra" primeiro, a tela é decoração.
--   2. Assunto nunca respondido ser tratado como domínio ZERO e enterrar os
--      erros reais do aluno no fim da lista.
--   3. A frequência cadastrada à mão não vencer a derivada do acervo (senão
--      não havia razão pra tabela existir).
--   4. A reta final não cortar a cauda longa.
--   5. Aluno comum cadastrar frequência de prova.
-- ============================================================================

\set ALUNO '11111111-6666-6666-6666-666666666660'
\set OUTRO '11111111-6666-6666-6666-666666666661'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'aluno-plano@nexa.test', '{"full_name": "Aluno Plano"}'),
  (:'OUTRO', 'outro-plano@nexa.test', '{"full_name": "Outro Plano"}');

insert into public.subject_catalog (id, slug, name, area)
values ('99999999-0000-0000-0000-0000000000c1', 'plano-teste', 'Plano Teste', 'matematica');
select set_config('nexa.subject', '99999999-0000-0000-0000-0000000000c1', false);

select id from public.exams where slug = 'unicamp' \gset unicamp_
select set_config('nexa.exam', :'unicamp_id', false);

-- Três assuntos com pesos MUITO diferentes no acervo:
--   CAMPEÃO  — 6 questões (60% da prova)
--   MEDIANO  — 3 questões (30%)
--   RARO     — 1 questão  (10%)
-- (10 questões no total)
insert into public.content_topics (id, subject_catalog_id, name, slug) values
  ('dddddddd-0000-0000-0000-000000000001', '99999999-0000-0000-0000-0000000000c1', 'Campeão', 'campeao'),
  ('dddddddd-0000-0000-0000-000000000002', '99999999-0000-0000-0000-0000000000c1', 'Mediano', 'mediano'),
  ('dddddddd-0000-0000-0000-000000000003', '99999999-0000-0000-0000-0000000000c1', 'Raro', 'raro');

insert into public.resources (id, subject_catalog_id, kind, title, is_published, context, exam_id)
values ('eeeeeeee-0000-0000-0000-000000000001', '99999999-0000-0000-0000-0000000000c1',
        'quiz', 'UNICAMP — acervo', true, 'vestibular', :'unicamp_id');

insert into public.questions (id, resource_id, position, statement, topic_id, explanation)
select
  ('ffffffff-0000-0000-0000-00000000000' || i)::uuid,
  'eeeeeeee-0000-0000-0000-000000000001',
  i,
  'Questão ' || i,
  case when i <= 6 then 'dddddddd-0000-0000-0000-000000000001'::uuid
       when i <= 9 then 'dddddddd-0000-0000-0000-000000000002'::uuid
       else 'dddddddd-0000-0000-0000-000000000003'::uuid end,
  'Explicação.'
from generate_series(1, 9) i;

insert into public.questions (id, resource_id, position, statement, topic_id, explanation)
values ('ffffffff-0000-0000-0000-0000000000aa', 'eeeeeeee-0000-0000-0000-000000000001', 10,
        'Questão 10', 'dddddddd-0000-0000-0000-000000000003', 'Explicação.');

insert into public.question_options (question_id, position, body, is_correct)
select q.id, 1, 'certa', true from public.questions q
where q.resource_id = 'eeeeeeee-0000-0000-0000-000000000001';
insert into public.question_options (question_id, position, body, is_correct)
select q.id, 2, 'errada', false from public.questions q
where q.resource_id = 'eeeeeeee-0000-0000-0000-000000000001';

set "request.jwt.claim.sub" = '11111111-6666-6666-6666-666666666660'; -- ALUNO
set role authenticated;

select public.save_vestibular_profile(current_setting('nexa.exam')::uuid, 2027, 2027, 120);

-- ============================================================================
-- 1 · Peso derivado do acervo, sem ninguém cadastrar nada.
-- ============================================================================
do $$
declare
  v_campeao numeric;
  v_raro numeric;
  v_source text;
begin
  select frequency_percent, source into v_campeao, v_source
  from public.exam_topic_weights(current_setting('nexa.exam')::uuid)
  where topic_id = 'dddddddd-0000-0000-0000-000000000001';

  select frequency_percent into v_raro
  from public.exam_topic_weights(current_setting('nexa.exam')::uuid)
  where topic_id = 'dddddddd-0000-0000-0000-000000000003';

  assert v_source = 'derivada',
    format('sem cadastro, o peso deveria vir do acervo, veio como %s', v_source);
  assert v_campeao = 60, format('Campeão são 6 de 10 questões = 60%%, veio %s', v_campeao);
  assert v_raro = 10, format('Raro é 1 de 10 questões = 10%%, veio %s', v_raro);
end;
$$;

-- ============================================================================
-- 2 · Sem NENHUMA resposta, o plano ordena por peso puro — e assunto nunca
--     respondido NÃO é tratado como domínio zero.
-- ============================================================================
do $$
declare
  v_first text;
  v_mastery numeric;
  v_answered bigint;
begin
  select topic_name, mastery_percent, answered_count
    into v_first, v_mastery, v_answered
  from public.vestibular_study_plan(20) limit 1;

  assert v_first = 'Campeão',
    format('sem histórico, o topo do plano deveria ser o assunto que mais cai, veio %s', v_first);
  assert v_mastery is null,
    format('assunto nunca respondido não tem domínio, veio %s', v_mastery);
  assert v_answered = 0, format('assunto nunca respondido tem 0 respostas, veio %s', v_answered);
end;
$$;

-- ============================================================================
-- 3 · Agora o aluno ACERTA tudo de Campeão e ERRA tudo de Mediano.
--     Mediano tem que passar Campeão, mesmo caindo metade das vezes.
-- ============================================================================
-- `reset role` de propósito, e só neste bloco: escolher a alternativa exige
-- LER `question_options`, que não tem policy de select pra aluno — é onde
-- mora o gabarito. Sob `role authenticated` o select volta vazio e o teste
-- responderia tudo com NULL, silenciosamente. `auth.uid()` depende só do
-- claim, não do role, então `answer_practice_question` continua gravando em
-- nome do ALUNO. (Foi exatamente esse tropeço que esta linha existe pra
-- impedir na próxima vez.)
reset role;

do $$
declare
  v_session uuid;
  q record;
  v_option uuid;
begin
  v_session := public.start_practice_session(null, current_setting('nexa.subject')::uuid, null, 50);

  for q in
    select unnest(s.question_ids) as question_id from public.practice_sessions s where s.id = v_session
  loop
    select o.id into v_option
    from public.question_options o
    join public.questions qq on qq.id = o.question_id
    where o.question_id = q.question_id
      -- Acerta Campeão, erra o resto.
      and o.is_correct = (qq.topic_id = 'dddddddd-0000-0000-0000-000000000001')
    limit 1;

    perform public.answer_practice_question(v_session, q.question_id, v_option, 5);
  end loop;

  perform public.finish_practice_session(v_session);
end;
$$;

set role authenticated;

do $$
declare
  v_first text;
  v_first_score numeric;
  v_campeao_score numeric;
  v_reason text;
begin
  select topic_name, priority_score, reason into v_first, v_first_score, v_reason
  from public.vestibular_study_plan(20) limit 1;

  select priority_score into v_campeao_score
  from public.vestibular_study_plan(20) where topic_name = 'Campeão';

  assert v_first = 'Mediano',
    format('quem erra Mediano e acerta Campeão deveria estudar Mediano primeiro, o plano mandou %s', v_first);
  assert v_first_score > v_campeao_score,
    format('a prioridade de Mediano (%s) deveria superar a de Campeão (%s)', v_first_score, v_campeao_score);
  assert v_reason = 'cai_muito_e_voce_erra',
    format('o motivo deveria ser "cai_muito_e_voce_erra", veio %s', v_reason);
end;
$$;

-- Domínio 100% derruba o assunto, mas não o zera (ele ainda cai).
do $$
declare
  v_mastery numeric;
begin
  select mastery_percent into v_mastery
  from public.vestibular_study_plan(20) where topic_name = 'Campeão';
  assert v_mastery = 100, format('o aluno acertou tudo de Campeão, domínio veio %s', v_mastery);
end;
$$;

reset role;

-- ============================================================================
-- 4 · Frequência cadastrada VENCE a derivada.
-- ============================================================================
do $$
declare
  v_aluno_conseguiu boolean := false;
begin
  -- Antes: aluno comum não pode cadastrar.
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '11111111-6666-6666-6666-666666666660', true);
  begin
    perform public.set_exam_topic_frequency(
      current_setting('nexa.exam')::uuid, 'dddddddd-0000-0000-0000-000000000003', 90, 5, 'chute');
    v_aluno_conseguiu := true;
  exception when others then
    null;
  end;
  assert not v_aluno_conseguiu, 'um aluno comum cadastrou frequência de prova';
end;
$$;

-- Admin cadastra: Raro passa a valer 90% (dado de fora do acervo).
insert into public.exam_topic_frequency (exam_id, topic_id, frequency_percent, editions_counted, note)
values (current_setting('nexa.exam')::uuid, 'dddddddd-0000-0000-0000-000000000003', 90, 5, 'levantamento');

set "request.jwt.claim.sub" = '11111111-6666-6666-6666-666666666660'; -- ALUNO
set role authenticated;

do $$
declare
  v_percent numeric;
  v_source text;
begin
  select frequency_percent, source into v_percent, v_source
  from public.exam_topic_weights(current_setting('nexa.exam')::uuid)
  where topic_id = 'dddddddd-0000-0000-0000-000000000003';

  assert v_source = 'cadastrada',
    format('com cadastro, a origem deveria ser "cadastrada", veio %s', v_source);
  assert v_percent = 90,
    format('o valor cadastrado (90) deveria vencer o derivado (20), veio %s', v_percent);
end;
$$;

-- ============================================================================
-- 5 · Reta final corta a cauda longa; fase "base" mostra tudo.
-- ============================================================================
do $$
declare
  v_phase text;
  v_rows integer;
begin
  select phase into v_phase from public.vestibular_study_plan(20) limit 1;
  assert v_phase = 'base',
    format('sem data de prova cadastrada não há reta final, veio %s', v_phase);

  select count(*) into v_rows from public.vestibular_study_plan(20);
  assert v_rows = 3, format('a fase base deveria mostrar os 3 assuntos, mostrou %s', v_rows);
end;
$$;

reset role;

-- Uma edição daqui a 10 dias liga a reta final.
insert into public.exam_editions (exam_id, year, application_date)
values (current_setting('nexa.exam')::uuid, 2027, current_date + 10);

-- Um quarto assunto, insignificante (1 questão entre muitas), pra a reta
-- final ter o que cortar.
insert into public.content_topics (id, subject_catalog_id, name, slug)
values ('dddddddd-0000-0000-0000-000000000004', '99999999-0000-0000-0000-0000000000c1', 'Cauda longa', 'cauda-longa');

insert into public.questions (id, resource_id, position, statement, topic_id, explanation)
select ('ffffffff-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid,
       'eeeeeeee-0000-0000-0000-000000000001', 100 + i, 'Enchimento ' || i,
       'dddddddd-0000-0000-0000-000000000001', 'Explicação.'
from generate_series(1, 40) i;

insert into public.questions (id, resource_id, position, statement, topic_id, explanation)
values ('ffffffff-0000-0000-0000-0000000002aa', 'eeeeeeee-0000-0000-0000-000000000001', 200,
        'Cauda longa', 'dddddddd-0000-0000-0000-000000000004', 'Explicação.');

set "request.jwt.claim.sub" = '11111111-6666-6666-6666-666666666660'; -- ALUNO
set role authenticated;

do $$
declare
  v_phase text;
  v_cauda integer;
  v_peso numeric;
begin
  select phase into v_phase from public.vestibular_study_plan(60) limit 1;
  assert v_phase = 'reta_final',
    format('a 10 dias da prova o plano deveria estar em reta final, veio %s', v_phase);

  select frequency_percent into v_peso
  from public.exam_topic_weights(current_setting('nexa.exam')::uuid)
  where topic_id = 'dddddddd-0000-0000-0000-000000000004';
  assert v_peso < 3, format('o assunto de enchimento deveria pesar menos de 3%%, pesou %s', v_peso);

  select count(*) into v_cauda from public.vestibular_study_plan(60)
  where topic_name = 'Cauda longa';
  assert v_cauda = 0,
    'a reta final deveria cortar o assunto que quase nunca cai, e ele continuou no plano';
end;
$$;

-- ============================================================================
-- 6 · Treinar um assunto específico traz só questões dele.
-- ============================================================================
do $$
declare
  v_session uuid;
  v_fora integer;
begin
  v_session := public.start_practice_session(
    null, null, null, 5, 'dddddddd-0000-0000-0000-000000000002');

  select count(*) into v_fora
  from public.practice_sessions s
  cross join lateral unnest(s.question_ids) as qid
  join public.questions q on q.id = qid
  where s.id = v_session and q.topic_id <> 'dddddddd-0000-0000-0000-000000000002';

  assert v_fora = 0, format('%s questões de outro assunto entraram no treino filtrado', v_fora);
end;
$$;

-- ============================================================================
-- 7 · O plano é de cada um: quem nunca respondeu nada não herda o domínio
--     do vizinho.
-- ============================================================================
reset role;
set "request.jwt.claim.sub" = '11111111-6666-6666-6666-666666666661'; -- OUTRO
set role authenticated;

select public.save_vestibular_profile(current_setting('nexa.exam')::uuid, 2027, 2027, 60);

do $$
declare
  v_answered bigint;
begin
  select sum(answered_count) into v_answered from public.vestibular_study_plan(60);
  assert coalesce(v_answered, 0) = 0,
    format('OUTRO nunca respondeu nada, mas o plano dele contou %s respostas', v_answered);
end;
$$;

reset role;

select 'ok' as result;
