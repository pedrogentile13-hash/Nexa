-- ============================================================================
-- Painel da escola.
--
-- O que esta suíte existe para impedir:
--   1. Professor ou aluno chamarem a visão da escola (e dos colegas).
--   2. A coordenação de OUTRA escola ler os números desta.
--   3. Números errados (o painel é o que a direção usa para decidir).
-- ============================================================================

\set COORD  'c1c1c1c1-0000-0000-0000-000000000001'
\set COORDX 'c1c1c1c1-0000-0000-0000-000000000002'
\set PROF   'c1c1c1c1-0000-0000-0000-000000000003'
\set A1     'c1c1c1c1-0000-0000-0000-000000000004'
\set A2     'c1c1c1c1-0000-0000-0000-000000000005'
\set A3     'c1c1c1c1-0000-0000-0000-000000000006'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'COORD',  'coord-pn@nexa.test', '{"full_name": "Coord"}'),
  (:'COORDX', 'coordx-pn@nexa.test', '{"full_name": "Coord X"}'),
  (:'PROF',   'prof-pn@nexa.test', '{"full_name": "Prof Painel"}'),
  (:'A1',     'a1-pn@nexa.test', '{"full_name": "Aluno 1"}'),
  (:'A2',     'a2-pn@nexa.test', '{"full_name": "Aluno 2"}'),
  (:'A3',     'a3-pn@nexa.test', '{"full_name": "Aluno 3"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('c2c2c2c2-0000-0000-0000-000000000001', 'Escola Painel', 'São Paulo', 'SP', true),
  ('c2c2c2c2-0000-0000-0000-000000000002', 'Outra Escola', 'São Paulo', 'SP', true);
insert into public.classes (id, school_id, name) values
  ('c3c3c3c3-0000-0000-0000-000000000001', 'c2c2c2c2-0000-0000-0000-000000000001', '9A');
insert into public.subject_catalog (id, slug, name, default_color)
  values ('c4c4c4c4-0000-0000-0000-000000000001', 'mat-pn', 'Matemática Painel', '#336699') on conflict do nothing;

update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'c2c2c2c2-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'c2c2c2c2-0000-0000-0000-000000000002' where id = :'COORDX';
update public.profiles set role = 'teacher_admin', school_id = 'c2c2c2c2-0000-0000-0000-000000000001' where id = :'PROF';
-- A1 e A2 têm turma; A3 não. A1 e A2 têm login (conta da escola); A2 nunca estudou.
update public.profiles set school_id = 'c2c2c2c2-0000-0000-0000-000000000001', class_id = 'c3c3c3c3-0000-0000-0000-000000000001', school_login = 'aluno.um' where id = :'A1';
update public.profiles set school_id = 'c2c2c2c2-0000-0000-0000-000000000001', class_id = 'c3c3c3c3-0000-0000-0000-000000000001', school_login = 'aluno.dois' where id = :'A2';
update public.profiles set school_id = 'c2c2c2c2-0000-0000-0000-000000000001' where id = :'A3';

insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
values (:'PROF', 'c2c2c2c2-0000-0000-0000-000000000001', 'c4c4c4c4-0000-0000-0000-000000000001', 'c3c3c3c3-0000-0000-0000-000000000001');

-- A1 estudou hoje; A2 nunca estudou (sem data).
update public.user_stats set last_active_local_date = (now() at time zone 'America/Sao_Paulo')::date where user_id = :'A1';
update public.user_stats set last_active_local_date = null where user_id = :'A2';

-- 1 resposta na base + 1 pergunta sem resposta.
insert into public.teacher_faq (id, teacher_id, school_id, question, answer) values
  ('c5c5c5c5-0000-0000-0000-000000000001', :'PROF', 'c2c2c2c2-0000-0000-0000-000000000001', 'Pergunta?', 'Resposta.');
insert into public.bot_conversations (id, student_id, teacher_id) values
  ('c6c6c6c6-0000-0000-0000-000000000001', :'A1', :'PROF');
insert into public.bot_messages (conversation_id, sender, content, status) values
  ('c6c6c6c6-0000-0000-0000-000000000001', 'student', 'Quando é a prova?', null),
  ('c6c6c6c6-0000-0000-0000-000000000001', 'bot', 'Ainda não sei.', 'unanswered');

insert into public.events (school_id, created_by, title, starts_at)
values ('c2c2c2c2-0000-0000-0000-000000000001', :'COORD', 'Reunião', now() + interval '5 days'),
       ('c2c2c2c2-0000-0000-0000-000000000001', :'COORD', 'Muito longe', now() + interval '90 days');

-- 3 · a coordenação lê os números certos
set "request.jwt.claim.sub" = 'c1c1c1c1-0000-0000-0000-000000000001'; -- COORD
set role authenticated;
do $$
declare r record;
begin
  select * into r from public.school_overview('c2c2c2c2-0000-0000-0000-000000000001');
  assert r.students = 3, format('alunos: esperado 3, veio %s', r.students);
  assert r.teachers = 1, 'professores';
  assert r.managed_accounts = 2, format('contas gerenciadas: esperado 2, veio %s', r.managed_accounts);
  assert r.students_without_class = 1, 'alunos sem turma';
  assert r.active_last_7_days = 1, format('ativos: esperado 1, veio %s', r.active_last_7_days);
  assert r.never_entered = 1, format('nunca entraram: esperado 1, veio %s', r.never_entered);
  assert r.pending_questions = 1, 'perguntas pendentes';
  assert r.upcoming_events = 1, 'eventos nos próximos 30 dias (o de 90 dias não conta)';

  assert (select count(*) from public.school_teacher_overview('c2c2c2c2-0000-0000-0000-000000000001')) = 1, 'linhas de professores';
  select * into r from public.school_teacher_overview('c2c2c2c2-0000-0000-0000-000000000001');
  assert r.faq_count = 1 and r.pending_count = 1 and r.classes = '9A', 'resumo do professor errado';
end;
$$;
reset role;

-- 2 · coordenação de outra escola é barrada
set "request.jwt.claim.sub" = 'c1c1c1c1-0000-0000-0000-000000000002'; -- COORDX
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin perform * from public.school_overview('c2c2c2c2-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'coordenação de outra escola leu o painel desta';
  v_falhou := false;
  begin perform * from public.school_teacher_overview('c2c2c2c2-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'coordenação de outra escola leu os professores desta';
end;
$$;
reset role;

-- 1 · professor e aluno são barrados
set "request.jwt.claim.sub" = 'c1c1c1c1-0000-0000-0000-000000000003'; -- PROF
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin perform * from public.school_overview('c2c2c2c2-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'professor leu o painel da escola';
  v_falhou := false;
  begin perform * from public.school_teacher_overview('c2c2c2c2-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'professor viu o resumo dos colegas';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'c1c1c1c1-0000-0000-0000-000000000004'; -- A1 (aluno)
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin perform * from public.school_overview('c2c2c2c2-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno leu o painel da escola';
end;
$$;
reset role;
