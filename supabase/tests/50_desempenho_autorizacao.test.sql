-- ============================================================================
-- Autorização nas funções de desempenho.
--
-- Esta suíte existe por causa de um vazamento real, medido antes do conserto:
-- um aluno qualquer lia o domínio, as habilidades e os ERROS de outro — com
-- enunciado e explicação — só passando o uuid dele.
--
-- O que ela trava, em ordem:
--   1. Aluno não lê o desempenho de outro aluno.
--   2. O enunciado da questão errada do colega não sai por nenhuma das três.
--   3. Quem PRECISA ler continua lendo: o próprio aluno, o admin e o
--      professor da turma dele. Um portão que fecha demais quebra o painel do
--      professor, e isso só aparece em produção.
-- ============================================================================

\set ALUNO '11111111-3333-3333-3333-333333333330'
\set OUTRO '11111111-3333-3333-3333-333333333331'
\set PROF  '11111111-3333-3333-3333-333333333332'
\set ADMIN '11111111-3333-3333-3333-333333333333'
\set FORA  '11111111-3333-3333-3333-333333333334'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'alvo-autz@nexa.test', '{"full_name": "Aluno Alvo"}'),
  (:'OUTRO', 'curioso-autz@nexa.test', '{"full_name": "Outro Aluno"}'),
  (:'PROF',  'prof-autz@nexa.test', '{"full_name": "Professor"}'),
  (:'ADMIN', 'admin-autz@nexa.test', '{"full_name": "Admin"}'),
  (:'FORA',  'profora-autz@nexa.test', '{"full_name": "Professor de Outra Turma"}');

insert into public.schools (id, name, city, state, is_verified)
values ('22222222-3333-3333-3333-333333333330', 'Escola do Teste', 'São Paulo', 'SP', true);

insert into public.classes (id, school_id, name)
values
  ('33333333-3333-3333-3333-333333333330', '22222222-3333-3333-3333-333333333330', '9A'),
  ('33333333-3333-3333-3333-333333333331', '22222222-3333-3333-3333-333333333330', '9B');

-- ALUNO e OUTRO são da MESMA escola e MESMA turma: é o pior caso, porque
-- qualquer regra frouxa baseada só em escola deixaria passar.
update public.profiles set school_id = '22222222-3333-3333-3333-333333333330',
                           class_id = '33333333-3333-3333-3333-333333333330'
  where id in (:'ALUNO', :'OUTRO');

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set role = 'teacher_admin', school_id = '22222222-3333-3333-3333-333333333330'
  where id in (:'PROF', :'FORA');

select id from public.subject_catalog where slug = 'matematica' limit 1 \gset s_

-- PROF dá aula pra turma do ALUNO; FORA dá aula pra outra turma.
insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id) values
  (:'PROF', '22222222-3333-3333-3333-333333333330', :'s_id', '33333333-3333-3333-3333-333333333330'),
  (:'FORA', '22222222-3333-3333-3333-333333333330', :'s_id', '33333333-3333-3333-3333-333333333331');

insert into public.resources (id, subject_catalog_id, kind, title, is_published, context)
values ('44444444-3333-3333-3333-333333333330', :'s_id', 'simulado', 'Simulado', true, 'school');

insert into public.content_topics (id, subject_catalog_id, name, slug)
values ('55555555-3333-3333-3333-333333333330', :'s_id', 'Assunto', 'assunto-autorizacao');

insert into public.questions (id, resource_id, position, statement, topic_id, skills, explanation)
values ('66666666-3333-3333-3333-333333333330', '44444444-3333-3333-3333-333333333330', 1,
        'ENUNCIADO PRIVADO DO ALUNO', '55555555-3333-3333-3333-333333333330',
        '{"Habilidade privada"}', 'Explicação privada');

insert into public.question_options (id, question_id, position, body, is_correct) values
  ('77777777-3333-3333-3333-333333333331', '66666666-3333-3333-3333-333333333330', 1, 'certa', true),
  ('77777777-3333-3333-3333-333333333332', '66666666-3333-3333-3333-333333333330', 2, 'errada', false);

-- O ALUNO erra a questão.
set "request.jwt.claim.sub" = '11111111-3333-3333-3333-333333333330';
set role authenticated;
do $$
declare v_a uuid;
begin
  v_a := public.start_quiz_attempt('44444444-3333-3333-3333-333333333330');
  perform public.answer_quiz_question(v_a, '66666666-3333-3333-3333-333333333330', '77777777-3333-3333-3333-333333333332');
  perform public.finish_quiz_attempt(v_a);
end;
$$;

-- ============================================================================
-- 1 · O próprio aluno continua lendo o que é dele. (Se este cair, o portão
--     fechou demais e o /desempenho do aluno ficou vazio.)
-- ============================================================================
do $$
declare
  v_topics integer;
  v_skills integer;
  v_errors integer;
begin
  select count(*) into v_topics from public.topic_mastery('11111111-3333-3333-3333-333333333330');
  select count(*) into v_skills from public.skill_mastery('11111111-3333-3333-3333-333333333330');
  select count(*) into v_errors from public.recent_errors('11111111-3333-3333-3333-333333333330');

  assert v_topics = 1, format('o aluno deveria ver o próprio domínio, viu %s linhas', v_topics);
  assert v_skills = 1, format('o aluno deveria ver as próprias habilidades, viu %s', v_skills);
  assert v_errors = 1, format('o aluno deveria ver os próprios erros, viu %s', v_errors);
end;
$$;

-- Sem argumento nenhum (o caso de todo dia) também continua funcionando.
do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.topic_mastery();
  assert v_rows = 1, format('topic_mastery() sem argumento deveria trazer o próprio domínio, trouxe %s', v_rows);
end;
$$;

reset role;

-- ============================================================================
-- 2 · O VAZAMENTO: outro aluno da MESMA TURMA não lê nada.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-3333-3333-3333-333333333331'; -- OUTRO
set role authenticated;

do $$
declare
  v_topics integer;
  v_skills integer;
  v_errors integer;
begin
  select count(*) into v_topics from public.topic_mastery('11111111-3333-3333-3333-333333333330');
  select count(*) into v_skills from public.skill_mastery('11111111-3333-3333-3333-333333333330');
  select count(*) into v_errors from public.recent_errors('11111111-3333-3333-3333-333333333330');

  assert v_topics = 0, format('OUTRO leu o domínio por assunto do ALUNO (%s linhas)', v_topics);
  assert v_skills = 0, format('OUTRO leu as habilidades do ALUNO (%s linhas)', v_skills);
  assert v_errors = 0, format('OUTRO leu os ERROS do ALUNO (%s linhas)', v_errors);
end;
$$;

-- E o enunciado em si — que é o dado mais sensível das três — não sai.
do $$
declare v_leak integer;
begin
  select count(*) into v_leak from public.recent_errors('11111111-3333-3333-3333-333333333330')
  where statement like '%PRIVADO%';
  assert v_leak = 0, 'o ENUNCIADO da questão que o ALUNO errou vazou para OUTRO';
end;
$$;

reset role;

-- ============================================================================
-- 3 · Quem precisa ler continua lendo.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-3333-3333-3333-333333333332'; -- PROF da turma
set role authenticated;

do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.topic_mastery('11111111-3333-3333-3333-333333333330');
  assert v_rows = 1,
    format('o professor DA TURMA perdeu acesso ao desempenho do aluno (%s linhas) — o portão fechou demais', v_rows);

  select count(*) into v_rows from public.recent_errors('11111111-3333-3333-3333-333333333330');
  assert v_rows = 1, format('o professor da turma deveria ver os erros do aluno, viu %s', v_rows);
end;
$$;

reset role;
set "request.jwt.claim.sub" = '11111111-3333-3333-3333-333333333333'; -- ADMIN
set role authenticated;

do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.topic_mastery('11111111-3333-3333-3333-333333333330');
  assert v_rows = 1, format('o admin perdeu acesso ao desempenho do aluno (%s linhas)', v_rows);
end;
$$;

reset role;

-- Professor de OUTRA turma não lê — ser professor da escola não basta.
set "request.jwt.claim.sub" = '11111111-3333-3333-3333-333333333334'; -- FORA
set role authenticated;

do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.topic_mastery('11111111-3333-3333-3333-333333333330');
  assert v_rows = 0,
    format('professor de OUTRA turma leu o desempenho do aluno (%s linhas) — ser da escola não pode bastar', v_rows);
end;
$$;

reset role;

select 'ok' as result;
