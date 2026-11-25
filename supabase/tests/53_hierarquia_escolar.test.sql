-- ============================================================================
-- Hierarquia escolar e eventos exclusivos da escola.
--
-- O que esta suíte existe para impedir:
--   1. Coordenação/direção de uma escola gerenciarem OUTRA escola.
--   2. Professor enxergar a coordenação, ou outro professor, como "supervisionado".
--   3. Dono de comunidade (aluno) criar evento — evento oficial é da escola.
--   4. Professor criar evento da escola toda, ou de turma em que não leciona.
--   5. Evento de uma turma aparecer para aluno de outra turma.
-- ============================================================================

\set ADMIN   'd3d3d3d3-0000-0000-0000-000000000001'
\set DIRECAO 'd3d3d3d3-0000-0000-0000-000000000002'
\set COORD   'd3d3d3d3-0000-0000-0000-000000000003'
\set PROF    'd3d3d3d3-0000-0000-0000-000000000004'
\set PROF2   'd3d3d3d3-0000-0000-0000-000000000005'
\set ALUNO_A 'd3d3d3d3-0000-0000-0000-000000000006'
\set ALUNO_B 'd3d3d3d3-0000-0000-0000-000000000007'
\set COORD_X 'd3d3d3d3-0000-0000-0000-000000000008'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADMIN',   'admin-hier@nexa.test', '{"full_name": "Admin"}'),
  (:'DIRECAO', 'dir-hier@nexa.test', '{"full_name": "Direção"}'),
  (:'COORD',   'coord-hier@nexa.test', '{"full_name": "Coordenação"}'),
  (:'PROF',    'prof-hier@nexa.test', '{"full_name": "Professor"}'),
  (:'PROF2',   'prof2-hier@nexa.test', '{"full_name": "Professor 2"}'),
  (:'ALUNO_A', 'alunoa-hier@nexa.test', '{"full_name": "Aluno A"}'),
  (:'ALUNO_B', 'alunob-hier@nexa.test', '{"full_name": "Aluno B"}'),
  (:'COORD_X', 'coordx-hier@nexa.test', '{"full_name": "Coord Outra Escola"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('d1d1d1d1-0000-0000-0000-000000000001', 'Escola Hier A', 'São Paulo', 'SP', true),
  ('d1d1d1d1-0000-0000-0000-000000000002', 'Escola Hier B', 'São Paulo', 'SP', true);

insert into public.classes (id, school_id, name) values
  ('d2d2d2d2-0000-0000-0000-000000000001', 'd1d1d1d1-0000-0000-0000-000000000001', '9A'),
  ('d2d2d2d2-0000-0000-0000-000000000002', 'd1d1d1d1-0000-0000-0000-000000000001', '9B');

-- Papéis e títulos são atribuídos pelo SQL Editor / service_role (auth.uid() nulo).
update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set role = 'school_admin', school_title = 'direcao', school_id = 'd1d1d1d1-0000-0000-0000-000000000001' where id = :'DIRECAO';
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'd1d1d1d1-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'teacher_admin',      school_id = 'd1d1d1d1-0000-0000-0000-000000000001' where id in (:'PROF', :'PROF2');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'd1d1d1d1-0000-0000-0000-000000000002' where id = :'COORD_X';
update public.profiles set school_id = 'd1d1d1d1-0000-0000-0000-000000000001', class_id = 'd2d2d2d2-0000-0000-0000-000000000001' where id = :'ALUNO_A';
update public.profiles set school_id = 'd1d1d1d1-0000-0000-0000-000000000001', class_id = 'd2d2d2d2-0000-0000-0000-000000000002' where id = :'ALUNO_B';

insert into public.subject_catalog (id, slug, name, default_color)
  values ('d4d4d4d4-0000-0000-0000-000000000001', 'materia-hier', 'Matéria Hier', '#336699')
  on conflict do nothing;

-- PROF leciona só na 9A.
insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id) values
  (:'PROF', 'd1d1d1d1-0000-0000-0000-000000000001', 'd4d4d4d4-0000-0000-0000-000000000001', 'd2d2d2d2-0000-0000-0000-000000000001');

-- 1 + 2 · níveis e supervisão
do $$
begin
  assert public.school_staff_level('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000002') = 3, 'direção deveria ser nível 3';
  assert public.school_staff_level('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000003') = 2, 'coordenação deveria ser nível 2';
  assert public.school_staff_level('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000004') = 1, 'professor deveria ser nível 1';
  assert public.school_staff_level('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000006') = 0, 'aluno deveria ser nível 0';
  assert public.school_staff_level('d1d1d1d1-0000-0000-0000-000000000002', 'd3d3d3d3-0000-0000-0000-000000000003') = 0, 'coordenação da escola A não tem nível na escola B';

  assert public.can_manage_school('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000003'), 'coordenação não gerencia a própria escola';
  assert not public.can_manage_school('d1d1d1d1-0000-0000-0000-000000000002', 'd3d3d3d3-0000-0000-0000-000000000003'), 'coordenação gerenciou OUTRA escola';
  assert not public.can_manage_school('d1d1d1d1-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000004'), 'professor virou gestor da escola';

  assert public.can_oversee_teacher('d3d3d3d3-0000-0000-0000-000000000004', 'd3d3d3d3-0000-0000-0000-000000000003'), 'coordenação não supervisiona o professor';
  assert public.can_oversee_teacher('d3d3d3d3-0000-0000-0000-000000000004', 'd3d3d3d3-0000-0000-0000-000000000002'), 'direção não supervisiona o professor';
  assert not public.can_oversee_teacher('d3d3d3d3-0000-0000-0000-000000000004', 'd3d3d3d3-0000-0000-0000-000000000005'), 'professor supervisionou outro professor';
  assert not public.can_oversee_teacher('d3d3d3d3-0000-0000-0000-000000000004', 'd3d3d3d3-0000-0000-0000-000000000008'), 'coordenação de outra escola supervisionou o professor';
  assert not public.can_oversee_teacher('d3d3d3d3-0000-0000-0000-000000000003', 'd3d3d3d3-0000-0000-0000-000000000004'), 'professor supervisionou a coordenação';
end;
$$;

-- 3 · aluno que é dono de comunidade NÃO cria evento
-- (comunidade inserida direto, como superusuário: o foco aqui é o evento).
insert into public.communities (id, owner_id, school_id, name, slug, visibility) values
  ('d5d5d5d5-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000006',
   'd1d1d1d1-0000-0000-0000-000000000001', 'Clube Hier', 'clube-hier', 'school');
insert into public.community_members (community_id, user_id, role) values
  ('d5d5d5d5-0000-0000-0000-000000000001', 'd3d3d3d3-0000-0000-0000-000000000006', 'owner');

set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000006'; -- ALUNO_A
set role authenticated;

do $$
declare
  v_comm uuid := 'd5d5d5d5-0000-0000-0000-000000000001';
  v_falhou boolean := false;
begin
  begin
    perform public.create_event('Evento do clube', now() + interval '2 days', p_community_id => v_comm);
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'dono de comunidade criou evento — evento é exclusivo da escola';

  assert not public.can_create_any_event(), 'aluno deveria não poder criar evento';
end;
$$;

reset role;

-- 4 · professor: só turma em que leciona
set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000004'; -- PROF
set role authenticated;

do $$
declare
  v_ok uuid;
  v_falhou boolean;
begin
  v_ok := public.create_event('Revisão 9A', now() + interval '2 days', p_class_id => 'd2d2d2d2-0000-0000-0000-000000000001');
  assert v_ok is not null, 'professor não criou evento da própria turma';

  v_falhou := false;
  begin
    perform public.create_event('Revisão 9B', now() + interval '2 days', p_class_id => 'd2d2d2d2-0000-0000-0000-000000000002');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor criou evento de turma em que não leciona';

  v_falhou := false;
  begin
    perform public.create_event('Evento geral', now() + interval '2 days');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor criou evento da escola toda';
end;
$$;

reset role;

-- Coordenação cria evento da escola toda.
set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000003'; -- COORD
set role authenticated;

do $$
declare v_id uuid;
begin
  v_id := public.create_event('Reunião de pais', now() + interval '5 days');
  assert v_id is not null, 'coordenação não criou evento da escola';
end;
$$;

reset role;

-- 5 · evento de turma: aluno da 9A vê, aluno da 9B não; evento geral todos veem
do $$
declare
  v_turma uuid := (select id from public.events where title = 'Revisão 9A');
  v_geral uuid := (select id from public.events where title = 'Reunião de pais');
begin
  assert public.can_view_event(v_turma, 'd3d3d3d3-0000-0000-0000-000000000006'), 'aluno da 9A não vê evento da 9A';
  assert not public.can_view_event(v_turma, 'd3d3d3d3-0000-0000-0000-000000000007'), 'aluno da 9B viu evento da 9A';
  assert public.can_view_event(v_geral, 'd3d3d3d3-0000-0000-0000-000000000006'), 'aluno não vê evento geral da escola';
  assert public.can_view_event(v_geral, 'd3d3d3d3-0000-0000-0000-000000000007'), 'aluno da 9B não vê evento geral';
  assert not public.can_view_event(v_turma, 'd3d3d3d3-0000-0000-0000-000000000008'), 'coordenação de OUTRA escola viu evento da turma';
  assert public.can_view_event(v_turma, 'd3d3d3d3-0000-0000-0000-000000000004'), 'professor da turma não vê o evento';
end;
$$;

-- 6 · a coordenação NÃO consegue se promover a direção (nem trocar o próprio título)
set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000003'; -- COORD
set role authenticated;

do $$
declare v_falhou boolean := false;
begin
  begin
    update public.profiles set school_title = 'direcao' where id = 'd3d3d3d3-0000-0000-0000-000000000003';
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'coordenação se promoveu a direção sozinha';

  v_falhou := false;
  begin
    update public.profiles set school_title = null where id = 'd3d3d3d3-0000-0000-0000-000000000003';
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'coordenação removeu o próprio título (viraria nível de direção)';
end;
$$;

reset role;

-- E o título continua o mesmo depois das tentativas.
do $$
begin
  assert (select school_title from public.profiles where id = 'd3d3d3d3-0000-0000-0000-000000000003') = 'coordenacao',
    'o título da coordenação mudou';
end;
$$;

-- 7 · a LISTA de eventos respeita a turma (não só can_view_event)
set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000007'; -- ALUNO_B (9B)
set role authenticated;

do $$
begin
  assert not exists (select 1 from public.list_events() where title = 'Revisão 9A'),
    'aluno da 9B recebeu na lista o evento da 9A';
  assert exists (select 1 from public.list_events() where title = 'Reunião de pais'),
    'aluno da 9B não recebeu o evento geral da escola';
end;
$$;

reset role;

set "request.jwt.claim.sub" = 'd3d3d3d3-0000-0000-0000-000000000006'; -- ALUNO_A (9A)
set role authenticated;

do $$
begin
  assert exists (select 1 from public.list_events() where title = 'Revisão 9A'),
    'aluno da 9A não recebeu o evento da própria turma';
end;
$$;

reset role;
