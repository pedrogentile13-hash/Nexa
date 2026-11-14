-- Conteúdo de IA é privado: direção, professor, colega e até admin (na Biblioteca)
-- não veem o que o aluno criou, até a escola aprovar a publicação.
\set ANA   'c5c5c5c5-0000-0000-0000-000000000001'
\set BETO  'c5c5c5c5-0000-0000-0000-000000000002'
\set COORD 'c5c5c5c5-0000-0000-0000-000000000003'
\set PROF  'c5c5c5c5-0000-0000-0000-000000000004'
\set ADM   'c5c5c5c5-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ANA', 'ana-pv@nexa.test', '{"full_name": "Ana"}'),
  (:'BETO', 'beto-pv@nexa.test', '{"full_name": "Beto"}'),
  (:'COORD', 'coord-pv@nexa.test', '{"full_name": "Coord"}'),
  (:'PROF', 'prof-pv@nexa.test', '{"full_name": "Prof"}'),
  (:'ADM', 'adm-pv@nexa.test', '{"full_name": "Admin"}');
insert into public.schools (id, name, city, state, is_verified)
  values ('c6c6c6c6-0000-0000-0000-000000000001', 'Escola Privada', 'São Paulo', 'SP', true);
insert into public.subject_catalog (id, slug, name, default_color)
  values ('c7c7c7c7-0000-0000-0000-000000000001', 'mat-pv', 'Matéria PV', '#336699') on conflict do nothing;
update public.profiles set school_id = 'c6c6c6c6-0000-0000-0000-000000000001' where id in (:'ANA', :'BETO');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'c6c6c6c6-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'teacher_admin', school_id = 'c6c6c6c6-0000-0000-0000-000000000001' where id = :'PROF';
update public.profiles set role = 'admin' where id = :'ADM';
insert into public.classes (id, school_id, name) values ('c9c9c9c9-0000-0000-0000-000000000001', 'c6c6c6c6-0000-0000-0000-000000000001', '9A');
insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
  values (:'PROF', 'c6c6c6c6-0000-0000-0000-000000000001', 'c7c7c7c7-0000-0000-0000-000000000001', 'c9c9c9c9-0000-0000-0000-000000000001');

insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, difficulty, is_published, created_by, visibility, ai_generated, schema_version) values
  ('c8c8c8c8-0000-0000-0000-000000000001', 'c6c6c6c6-0000-0000-0000-000000000001', 'c7c7c7c7-0000-0000-0000-000000000001', 'resumo', 'Resumo privado da Ana', 'Texto longo o bastante.', 'medio', true, :'ANA', 'private', true, '1.0'),
  ('c8c8c8c8-0000-0000-0000-000000000002', 'c6c6c6c6-0000-0000-0000-000000000001', 'c7c7c7c7-0000-0000-0000-000000000001', 'resumo', 'Resumo oficial', 'Conteúdo da escola.', 'medio', true, :'COORD', null, false, '1.0');

-- a dona vê os dois na Biblioteca
set "request.jwt.claim.sub" = 'c5c5c5c5-0000-0000-0000-000000000001'; set role authenticated;
do $$ begin assert (select count(*) from public.v_resource_library where id::text like 'c8c8c8c8%') = 2, 'Ana deveria ver o oficial e o dela'; end $$;
reset role;

-- colega, direção, professor e admin NÃO veem o privado (nem na Biblioteca, nem direto)
do $$
declare u text; n int;
begin
  foreach u in array array['c5c5c5c5-0000-0000-0000-000000000002','c5c5c5c5-0000-0000-0000-000000000003','c5c5c5c5-0000-0000-0000-000000000004','c5c5c5c5-0000-0000-0000-000000000005'] loop
    perform set_config('request.jwt.claim.sub', u, true);
    set local role authenticated;
    select count(*) into n from public.v_resource_library where title = 'Resumo privado da Ana';
    assert n = 0, format('%s viu o resumo privado na Biblioteca', u);
    if u <> 'c5c5c5c5-0000-0000-0000-000000000005' then
      select count(*) into n from public.resources where id = 'c8c8c8c8-0000-0000-0000-000000000001';
      assert n = 0, format('%s leu o resumo privado direto', u);
      select count(*) into n from public.resources where id = 'c8c8c8c8-0000-0000-0000-000000000002';
      assert n = 1, format('%s deveria ver o conteúdo oficial', u);
    end if;
    reset role;
  end loop;
end $$;

-- depois de aprovado, a escola vê
update public.resources set visibility = 'school' where id = 'c8c8c8c8-0000-0000-0000-000000000001';
set "request.jwt.claim.sub" = 'c5c5c5c5-0000-0000-0000-000000000002'; set role authenticated;
do $$ begin assert (select count(*) from public.v_resource_library where title = 'Resumo privado da Ana') = 1, 'colega deveria ver depois de aprovado'; end $$;
reset role;
