-- ============================================================================
-- Nexa — suíte SQL: papel de professor (teacher_admin).
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. um professor sem atribuição enxergando ou editando qualquer coisa
--   2. um professor lendo desempenho de aluno de outra escola/turma
--   3. um professor publicando conteúdo fora da própria escola/matéria
--   4. `notify_class` avisando aluno fora da turma/matéria certas
-- ============================================================================

\set ADMIN    '66666666-6666-6666-6666-666666666666'
\set PROF_ANA '77777777-7777-7777-7777-777777777701'
\set PROF_BIA '77777777-7777-7777-7777-777777777702'
\set ALUNO_A  '77777777-7777-7777-7777-777777777703'
\set ALUNO_B  '77777777-7777-7777-7777-777777777704'
\set ALUNO_C  '77777777-7777-7777-7777-777777777705'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-teacher-test@nexa.test', '{"full_name": "Admin Nexa"}'),
  (:'PROF_ANA', 'ana-prof@nexa.test', '{"full_name": "Ana Professora"}'),
  (:'PROF_BIA', 'bia-prof@nexa.test', '{"full_name": "Bia Professora"}'),
  (:'ALUNO_A', 'aluno-a-teacher@nexa.test', '{"full_name": "Aluno A"}'),
  (:'ALUNO_B', 'aluno-b-teacher@nexa.test', '{"full_name": "Aluno B"}'),
  (:'ALUNO_C', 'aluno-c-teacher@nexa.test', '{"full_name": "Aluno C"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('90909090-0000-0000-0000-000000000001', 'Colégio Gama (professor fixture)', 'Recife', 'PE', true),
  ('90909090-0000-0000-0000-000000000002', 'Colégio Delta (professor fixture)', 'Olinda', 'PE', true);

-- "9A" do Gama e "9A" do Delta são turmas DIFERENTES (escolas diferentes) —
-- cada uma com seu próprio id, mesmo nome.
\set GAMA_9A  '90909090-0000-0000-0000-0000000c9a01'
\set GAMA_9B  '90909090-0000-0000-0000-0000000c9a02'
\set DELTA_9A '90909090-0000-0000-0000-0000000c9a03'

insert into public.classes (id, school_id, name) values
  (:'GAMA_9A', '90909090-0000-0000-0000-000000000001', '9A'),
  (:'GAMA_9B', '90909090-0000-0000-0000-000000000001', '9B'),
  (:'DELTA_9A', '90909090-0000-0000-0000-000000000002', '9A');

update public.profiles set role = 'admin' where id = :'ADMIN';

-- Ana leciona Física na turma "9A" do Gama. Bia não tem atribuição nenhuma.
update public.profiles set role = 'teacher_admin', school_id = '90909090-0000-0000-0000-000000000001'
  where id = :'PROF_ANA';
update public.profiles set role = 'teacher_admin', school_id = '90909090-0000-0000-0000-000000000001'
  where id = :'PROF_BIA';

-- Aluno A: 9A do Gama (na turma da Ana). Aluno B: 9B do Gama (fora da turma
-- da Ana, mesma escola). Aluno C: 9A do Delta (mesmo NOME de turma, mas é
-- uma linha de `classes` diferente — escola diferente).
update public.profiles set school_id = '90909090-0000-0000-0000-000000000001', class_id = :'GAMA_9A'
  where id = :'ALUNO_A';
update public.profiles set school_id = '90909090-0000-0000-0000-000000000001', class_id = :'GAMA_9B'
  where id = :'ALUNO_B';
update public.profiles set school_id = '90909090-0000-0000-0000-000000000002', class_id = :'DELTA_9A'
  where id = :'ALUNO_C';

select id from public.subject_catalog where slug = 'fisica' \gset fisica_
select id from public.subject_catalog where slug = 'quimica' \gset quimica_

-- Matérias dos alunos (fixture), pra virarem alvo de notificação na seção 5
-- — inserido como superusuário, junto do resto do setup, porque a RLS de
-- `subjects` só libera o dono da linha (nenhum papel, nem admin, escreve na
-- matéria de outra pessoa).
insert into public.subjects (user_id, catalog_id, name)
values
  (:'ALUNO_A', :'fisica_id', 'Física'),
  (:'ALUNO_B', :'fisica_id', 'Física'),
  (:'ALUNO_C', :'fisica_id', 'Física');

-- ===========================================================================
-- 1 · admin atribui Ana a Física/9A do Gama
-- ===========================================================================
set "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666666';
set role authenticated;

insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
values (:'PROF_ANA', '90909090-0000-0000-0000-000000000001', :'fisica_id', :'GAMA_9A');

-- Bia não recebe atribuição nenhuma — cobre o caso "professor sem vínculo".

-- ===========================================================================
-- 2 · is_teacher_of / is_teacher_of_student
-- ===========================================================================
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777701';
set role authenticated;

do $$
begin
  assert public.is_teacher_of('90909090-0000-0000-0000-000000000001', (select id from public.subject_catalog where slug = 'fisica')),
    'Ana deveria ser professora de Física no Gama';
  assert not public.is_teacher_of('90909090-0000-0000-0000-000000000001', (select id from public.subject_catalog where slug = 'quimica')),
    'Ana NÃO leciona Química — não deveria autorizar';
  assert not public.is_teacher_of('90909090-0000-0000-0000-000000000002', (select id from public.subject_catalog where slug = 'fisica')),
    'Ana NÃO é do Delta — não deveria autorizar outra escola';

  assert public.is_teacher_of_student('77777777-7777-7777-7777-777777777703'),
    'Ana deveria enxergar o Aluno A (mesma escola+turma)';
  assert not public.is_teacher_of_student('77777777-7777-7777-7777-777777777704'),
    'Ana NÃO deveria enxergar o Aluno B (turma diferente, mesma escola)';
  assert not public.is_teacher_of_student('77777777-7777-7777-7777-777777777705'),
    'Ana NÃO deveria enxergar o Aluno C (turma igual, escola diferente)';
end;
$$;

set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777702';
set role authenticated;

do $$
begin
  assert not public.is_teacher_of('90909090-0000-0000-0000-000000000001', (select id from public.subject_catalog where slug = 'fisica')),
    'Bia não tem atribuição nenhuma — não deveria autorizar nada';
  assert not public.is_teacher_of_student('77777777-7777-7777-7777-777777777703'),
    'Bia sem atribuição não deveria enxergar nenhum aluno';
end;
$$;

-- ===========================================================================
-- 3 · admin_subject_scores aceita a professora vinculada, rejeita a que não é
-- ===========================================================================
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777701';
set role authenticated;

do $$
begin
  perform public.admin_subject_scores('77777777-7777-7777-7777-777777777703');
end;
$$;

do $$
begin
  begin
    perform public.admin_subject_scores('77777777-7777-7777-7777-777777777704');
    assert false, 'Ana NÃO deveria poder ler o desempenho do Aluno B (turma diferente)';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777702';
set role authenticated;

do $$
begin
  begin
    perform public.admin_subject_scores('77777777-7777-7777-7777-777777777703');
    assert false, 'Bia (sem atribuição) NÃO deveria poder ler o desempenho de ninguém';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- ===========================================================================
-- 4 · escrita de conteúdo: Ana publica Física no Gama, não em outra escola
--     nem em outra matéria
-- ===========================================================================
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777701';
set role authenticated;

insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, is_published)
values ('88888888-0000-0000-0000-000000000101', '90909090-0000-0000-0000-000000000001',
        :'fisica_id', 'resumo', 'Resumo de Física (Ana)', 'Conteúdo da Ana.', true);

do $$
begin
  begin
    insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, is_published)
    values ('88888888-0000-0000-0000-000000000102', '90909090-0000-0000-0000-000000000002',
            (select id from public.subject_catalog where slug = 'fisica'), 'resumo', 'Fora da escola', 'x', true);
    assert false, 'Ana NÃO deveria conseguir publicar num colégio que não é o dela';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, is_published)
    values ('88888888-0000-0000-0000-000000000103', '90909090-0000-0000-0000-000000000001',
            (select id from public.subject_catalog where slug = 'quimica'), 'resumo', 'Fora da matéria', 'x', true);
    assert false, 'Ana NÃO deveria conseguir publicar Química — ela só leciona Física';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- Sem atribuição, Bia não publica nada.
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777702';
set role authenticated;

do $$
begin
  begin
    insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, is_published)
    values ('88888888-0000-0000-0000-000000000104', '90909090-0000-0000-0000-000000000001',
            (select id from public.subject_catalog where slug = 'fisica'), 'resumo', 'Bia sem vínculo', 'x', true);
    assert false, 'Bia (sem atribuição) NÃO deveria conseguir publicar nada';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- ===========================================================================
-- 5 · notify_class só avisa a turma+matéria certas, mesma escola
-- ===========================================================================
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777701';
set role authenticated;

select public.notify_class(:'GAMA_9A', :'fisica_id', '90909090-0000-0000-0000-000000000001', 'Prova amanhã', 'Não esqueça a calculadora.');

-- `notifications` só é legível pelo próprio dono (RLS) — checar como
-- superusuário, não como Ana, senão a query filtraria tudo que não é dela
-- antes mesmo do teste avaliar o que `notify_class` gravou.
reset role;
reset "request.jwt.claim.sub";

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.notifications
  where user_id = '77777777-7777-7777-7777-777777777703' and title = 'Prova amanhã';
  assert v_count = 1, 'Aluno A (9A do Gama) deveria ter recebido o aviso';

  select count(*) into v_count from public.notifications
  where user_id = '77777777-7777-7777-7777-777777777704' and title = 'Prova amanhã';
  assert v_count = 0, 'Aluno B (9B do Gama) NÃO deveria ter recebido o aviso';

  select count(*) into v_count from public.notifications
  where user_id = '77777777-7777-7777-7777-777777777705' and title = 'Prova amanhã';
  assert v_count = 0, 'Aluno C (9A do Delta) NÃO deveria ter recebido o aviso — escola errada';
end;
$$;

-- Bia (sem atribuição) não consegue mandar aviso nenhum.
set "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777702';
set role authenticated;

do $$
begin
  begin
    perform public.notify_class('90909090-0000-0000-0000-0000000c9a01'::uuid,
      (select id from public.subject_catalog where slug = 'fisica'),
      '90909090-0000-0000-0000-000000000001', 'Não deveria enviar', null);
    assert false, 'Bia (sem atribuição) NÃO deveria conseguir chamar notify_class';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
reset "request.jwt.claim.sub";
