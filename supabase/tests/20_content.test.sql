-- ============================================================================
-- Nexa — suíte SQL: conteúdo, escolas, papéis e trilha.
--
-- Roda como `authenticated`, nunca como superusuário: como dono das tabelas o
-- Postgres pularia toda policy e a suíte não provaria nada.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. o aluno lendo o gabarito antes de responder
--   2. o aluno se promovendo a admin
--   3. o acervo de uma escola aparecendo para aluno de outra
--   4. conteúdo despublicado vazando
--   5. XP pago duas vezes pela mesma tentativa
-- ============================================================================

\set ADMIN  '33333333-3333-3333-3333-333333333333'
\set CARLA  '44444444-4444-4444-4444-444444444444'
\set DIEGO  '55555555-5555-5555-5555-555555555555'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin@nexa.test', '{"full_name": "Admin Nexa"}'),
  (:'CARLA', 'carla@nexa.test', '{"full_name": "Carla Aluna"}'),
  (:'DIEGO', 'diego@nexa.test', '{"full_name": "Diego Aluno"}');

-- Duas escolas e o papel de admin: preparado como superusuário porque é
-- exatamente o que o painel do Supabase faz uma vez, na instalação.
insert into public.schools (id, name, city, state, is_verified) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Colégio Alfa', 'São Paulo', 'SP', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Colégio Beta', 'Campinas', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = 'aaaaaaaa-0000-0000-0000-000000000001' where id = :'CARLA';
update public.profiles set school_id = 'aaaaaaaa-0000-0000-0000-000000000002' where id = :'DIEGO';

-- ===========================================================================
-- 1 · O admin cria conteúdo pelo painel
-- ===========================================================================
set "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';
set role authenticated;

do $$
begin
  assert public.is_admin(), 'is_admin() não reconheceu o papel admin';
end;
$$;

select id from public.subject_catalog where slug = 'fisica' \gset fisica_

insert into public.content_topics (id, subject_catalog_id, name, slug, sort_order)
values ('bbbbbbbb-0000-0000-0000-000000000001', :'fisica_id', 'Cinemática (fixture)', 'cinematica-fixture', 1);

-- Um resumo global, um da escola Alfa e um despublicado.
insert into public.resources (id, subject_catalog_id, topic_id, kind, title, body, is_published)
values ('cccccccc-0000-0000-0000-000000000001', :'fisica_id',
        'bbbbbbbb-0000-0000-0000-000000000001', 'resumo',
        'Movimento uniforme', 'A velocidade não muda.', true);

insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, is_published)
values ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
        :'fisica_id', 'resumo', 'Apostila do Alfa', 'Só para o Alfa.', true);

insert into public.resources (id, subject_catalog_id, kind, title, body, is_published)
values ('cccccccc-0000-0000-0000-000000000003', :'fisica_id', 'resumo',
        'Rascunho', 'Ainda não revisado.', false);

do $$
begin
  assert (select published_at is not null from public.resources
          where id = 'cccccccc-0000-0000-0000-000000000001'),
    'publicar não carimbou published_at';
  assert (select published_at is null from public.resources
          where id = 'cccccccc-0000-0000-0000-000000000003'),
    'rascunho não deveria ter published_at';
end;
$$;

-- Um simulado com duas questões.
insert into public.resources (id, subject_catalog_id, topic_id, kind, title, is_published, xp_reward)
values ('cccccccc-0000-0000-0000-000000000010', :'fisica_id',
        'bbbbbbbb-0000-0000-0000-000000000001', 'simulado', 'Simulado de Cinemática', true, 100);

insert into public.questions (id, resource_id, topic_id, position, statement, explanation)
values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000010',
   'bbbbbbbb-0000-0000-0000-000000000001', 1, 'v = v0 + a·t. Com v0=0, a=2 e t=6?', 'Basta substituir.'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000010',
   'bbbbbbbb-0000-0000-0000-000000000001', 2, 'No MU a posição cresce como?', 'Linha reta.');

insert into public.question_options (question_id, position, body, is_correct) values
  ('dddddddd-0000-0000-0000-000000000001', 1, '6 m/s', false),
  ('dddddddd-0000-0000-0000-000000000001', 2, '12 m/s', true),
  ('dddddddd-0000-0000-0000-000000000001', 3, '18 m/s', false),
  ('dddddddd-0000-0000-0000-000000000002', 1, 'Linearmente', true),
  ('dddddddd-0000-0000-0000-000000000002', 2, 'Exponencialmente', false);

-- Duas respostas certas na mesma questão é erro de correção esperando
-- acontecer. O índice parcial único recusa antes disso.
do $$
begin
  begin
    insert into public.question_options (question_id, position, body, is_correct)
    values ('dddddddd-0000-0000-0000-000000000001', 4, 'Outra certa', true);
    assert false, 'o banco aceitou duas alternativas corretas na mesma questão';
  exception when unique_violation then null;
  end;
end;
$$;

-- Os ids das alternativas ficam guardados agora, ainda como admin. A aluna não
-- consegue lê-los — é exatamente o que a suíte prova adiante — então nem o
-- teste pode montar a resposta consultando a tabela do gabarito.
select set_config('nexa.q1_wrong',
  (select id::text from public.question_options
   where question_id = 'dddddddd-0000-0000-0000-000000000001' and position = 1), false);
select set_config('nexa.q2_right',
  (select id::text from public.question_options
   where question_id = 'dddddddd-0000-0000-0000-000000000002' and is_correct), false);

-- Trilha: duas lições, a segunda travada pela primeira.
insert into public.tracks (id, subject_catalog_id, title, is_published)
values ('eeeeeeee-0000-0000-0000-000000000001', :'fisica_id', 'Trilha de Física', true);

insert into public.track_sections (id, track_id, position, title)
values ('eeeeeeee-0000-0000-0000-000000000010', 'eeeeeeee-0000-0000-0000-000000000001', 1, 'Cinemática');

insert into public.track_lessons (id, section_id, position, title, xp_reward)
values ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000010', 1, 'Movimento uniforme', 20);

insert into public.track_lessons (id, section_id, position, title, xp_reward, unlock_after_lesson_id)
values ('ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000010', 2, 'MUV', 20,
        'ffffffff-0000-0000-0000-000000000001');

reset role;

-- ===========================================================================
-- 2 · Carla (escola Alfa) — o que ela pode e o que não pode ver
-- ===========================================================================
set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444444';
set role authenticated;

do $$
declare
  v_ids uuid[];
begin
  select array_agg(id order by id) into v_ids from public.v_resource_library where kind = 'resumo';

  assert 'cccccccc-0000-0000-0000-000000000001' = any(v_ids), 'resumo global não apareceu para a aluna';
  assert 'cccccccc-0000-0000-0000-000000000002' = any(v_ids), 'resumo da própria escola não apareceu';
  assert not ('cccccccc-0000-0000-0000-000000000003' = any(v_ids)), 'rascunho vazou para a aluna';
end;
$$;

-- ---------------------------------------------- o gabarito não sai do banco --
do $$
declare
  v_leak integer;
begin
  select count(*) into v_leak from public.question_options;
  assert v_leak = 0, format('aluna leu %s alternativas direto da tabela — gabarito exposto', v_leak);

  select count(*) into v_leak from public.questions;
  assert v_leak = 0, 'aluna leu questões direto da tabela — explicação expõe a resposta';
end;
$$;

-- ...mas ela recebe as questões pela função, sem o gabarito junto.
do $$
declare
  v_count integer;
  v_opts jsonb;
begin
  select count(*) into v_count from public.quiz_questions('cccccccc-0000-0000-0000-000000000010');
  assert v_count = 2, format('quiz_questions devolveu %s questões, esperado 2', v_count);

  select options into v_opts from public.quiz_questions('cccccccc-0000-0000-0000-000000000010')
  where question_position = 1;

  assert jsonb_array_length(v_opts) = 3, 'alternativas não vieram completas';
  assert not (v_opts::text like '%is_correct%'), 'quiz_questions vazou is_correct';
end;
$$;

-- ------------------------------------------------- ninguém se promove -------
do $$
begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    assert false, 'a aluna conseguiu se promover a admin';
  exception when insufficient_privilege then null;
  end;

  assert (select role from public.profiles where id = auth.uid()) = 'student',
    'o papel da aluna mudou apesar da trava';
end;
$$;

-- ------------------------------------------------------ fazer o simulado ----
-- psql não substitui variáveis dentro de blocos $$...$$, então a tentativa
-- viaja por um GUC de sessão em vez de por uma variável de psql.
select set_config('nexa.attempt',
  public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000010')::text, false);

do $$
declare
  v_correct boolean;
  v_right uuid;
  v_expl text;
begin
  -- Erra a primeira de propósito.
  select is_correct, correct_option_id, explanation into v_correct, v_right, v_expl
  from public.answer_quiz_question(
    current_setting('nexa.attempt')::uuid,
    'dddddddd-0000-0000-0000-000000000001',
    current_setting('nexa.q1_wrong')::uuid
  );

  assert v_correct = false, 'resposta errada foi marcada como certa';
  assert v_right is not null, 'a alternativa certa não voltou depois de responder';
  assert v_expl = 'Basta substituir.', 'a explicação não voltou depois de responder';

  -- Acerta a segunda.
  select is_correct into v_correct
  from public.answer_quiz_question(
    current_setting('nexa.attempt')::uuid,
    'dddddddd-0000-0000-0000-000000000002',
    current_setting('nexa.q2_right')::uuid
  );
  assert v_correct = true, 'resposta certa foi marcada como errada';
end;
$$;

do $$
declare
  v_correct integer; v_total integer; v_xp integer;
  v_xp2 integer;
begin
  select f.correct_count, f.total_count, f.xp_awarded into v_correct, v_total, v_xp
  from public.finish_quiz_attempt(current_setting('nexa.attempt')::uuid) f;

  assert v_correct = 1, format('acertos = %s, esperado 1', v_correct);
  assert v_total = 2, format('total = %s, esperado 2', v_total);
  -- 100 XP × 1/2 acertos = 50
  assert v_xp = 50, format('XP = %s, esperado 50 (metade de 100 por 1 de 2)', v_xp);

  -- Encerrar de novo não pode pagar de novo.
  select f.xp_awarded into v_xp2 from public.finish_quiz_attempt(current_setting('nexa.attempt')::uuid) f;
  assert v_xp2 = 0, format('encerrar duas vezes pagou %s XP de novo', v_xp2);
end;
$$;

-- Gabarito completo só depois de encerrar — e agora ele aparece.
do $$
declare
  v_rows integer;
  v_wrong integer;
begin
  select count(*) into v_rows from public.quiz_attempt_review(current_setting('nexa.attempt')::uuid);
  assert v_rows = 2, format('revisão devolveu %s linhas, esperado 2', v_rows);

  select count(*) into v_wrong from public.quiz_attempt_review(current_setting('nexa.attempt')::uuid) where not is_correct;
  assert v_wrong = 1, 'a revisão não marcou a questão errada';

  assert (select count(*) from public.quiz_attempt_topics(current_setting('nexa.attempt')::uuid)) = 1,
    'desempenho por assunto não agrupou pelo assunto';
end;
$$;

-- --------------------------------------------------------- trilha -----------
do $$
declare
  v_locked boolean;
begin
  select is_locked into v_locked from public.v_track_lessons_resolved
  where lesson_id = 'ffffffff-0000-0000-0000-000000000001';
  assert v_locked = false, 'a primeira lição nasceu bloqueada';

  select is_locked into v_locked from public.v_track_lessons_resolved
  where lesson_id = 'ffffffff-0000-0000-0000-000000000002';
  assert v_locked = true, 'a segunda lição não estava bloqueada antes da primeira';
end;
$$;

do $$
declare
  v_state text;
  v_locked boolean;
begin
  select c.state into v_state from public.complete_lesson('ffffffff-0000-0000-0000-000000000001', false) c;
  assert v_state = 'done', format('estado = %s, esperado done', v_state);

  select is_locked into v_locked from public.v_track_lessons_resolved
  where lesson_id = 'ffffffff-0000-0000-0000-000000000002';
  assert v_locked = false, 'concluir a primeira não destravou a segunda';
end;
$$;

-- `mastered` exige três conclusões seguidas sem erro.
do $$
declare
  v_state text;
begin
  select c.state into v_state from public.complete_lesson('ffffffff-0000-0000-0000-000000000001', true) c;
  assert v_state = 'done', 'uma conclusão perfeita não pode virar dominado sozinha';
  select c.state into v_state from public.complete_lesson('ffffffff-0000-0000-0000-000000000001', true) c;
  select c.state into v_state from public.complete_lesson('ffffffff-0000-0000-0000-000000000001', true) c;
  assert v_state = 'mastered', format('três acertos seguidos deram %s, esperado mastered', v_state);
end;
$$;

-- ----------------------------------------------------- progresso ------------
do $$
declare
  v_pct numeric;
begin
  perform public.mark_resource_progress('cccccccc-0000-0000-0000-000000000001', 62, null, false);
  select progress_percent into v_pct from public.resource_progress
  where resource_id = 'cccccccc-0000-0000-0000-000000000001' and user_id = auth.uid();
  assert v_pct = 62, format('progresso = %s, esperado 62', v_pct);

  -- Reabrir no começo não pode apagar o que já foi lido.
  perform public.mark_resource_progress('cccccccc-0000-0000-0000-000000000001', 5, null, false);
  select progress_percent into v_pct from public.resource_progress
  where resource_id = 'cccccccc-0000-0000-0000-000000000001' and user_id = auth.uid();
  assert v_pct = 62, format('progresso andou para trás: %s', v_pct);
end;
$$;

reset role;

-- ===========================================================================
-- 3 · Diego (escola Beta) — o acervo do Alfa não é dele
-- ===========================================================================
set "request.jwt.claim.sub" = '55555555-5555-5555-5555-555555555555';
set role authenticated;

do $$
declare
  v_ids uuid[];
begin
  select array_agg(id) into v_ids from public.v_resource_library;

  assert 'cccccccc-0000-0000-0000-000000000001' = any(v_ids),
    'o conteúdo global sumiu para o aluno de outra escola';
  assert not ('cccccccc-0000-0000-0000-000000000002' = any(v_ids)),
    'VAZAMENTO: aluno do Beta enxergou a apostila do Alfa';
end;
$$;

-- E também não consegue publicar nada.
do $$
begin
  begin
    insert into public.resources (subject_catalog_id, kind, title, body, is_published)
    values ((select id from public.subject_catalog where slug = 'fisica'),
            'resumo', 'Conteúdo pirata', 'texto', true);
    assert false, 'um aluno conseguiu publicar conteúdo';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- Nem enxergar a tentativa da Carla.
do $$
begin
  assert (select count(*) from public.quiz_attempts) = 0,
    'aluno enxergou a tentativa de simulado de outro aluno';
end;
$$;

reset role;

-- ===========================================================================
-- 4 · Invariantes estruturais das tabelas novas
-- ===========================================================================
do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ') into v_missing
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  assert v_missing is null, format('tabelas sem RLS: %s', v_missing);
end;
$$;

do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ') into v_missing
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v'
    and coalesce((c.reloptions::text like '%security_invoker=true%'), false) = false;

  assert v_missing is null, format('views sem security_invoker: %s', v_missing);
end;
$$;

select '✓ 20_content.test.sql — all assertions passed' as result;
