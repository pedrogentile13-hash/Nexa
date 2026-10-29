-- Retirar/realocar aluno: quem pode, quem não pode, e o que fica protegido.
\set ADM   'd5d5d5d5-0000-0000-0000-000000000001'
\set COORD 'd5d5d5d5-0000-0000-0000-000000000002'
\set COORDX 'd5d5d5d5-0000-0000-0000-000000000003'
\set GOOGLE 'd5d5d5d5-0000-0000-0000-000000000004'
\set GERID 'd5d5d5d5-0000-0000-0000-000000000005'
\set OUTRO 'd5d5d5d5-0000-0000-0000-000000000006'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADM', 'adm-mv@nexa.test', '{"full_name":"Adm"}'), (:'COORD', 'coord-mv@nexa.test', '{"full_name":"Coord"}'),
  (:'COORDX', 'coordx-mv@nexa.test', '{"full_name":"Coord X"}'), (:'GOOGLE', 'g-mv@nexa.test', '{"full_name":"Aluno Google"}'),
  (:'GERID', 'ger-mv@nexa.test', '{"full_name":"Aluno gerido"}'), (:'OUTRO', 'o-mv@nexa.test', '{"full_name":"Aluno de outra"}');
insert into public.schools (id, name, city, state, is_verified) values
  ('d6d6d6d6-0000-0000-0000-000000000001', 'Escola A', 'SP', 'SP', true),
  ('d6d6d6d6-0000-0000-0000-000000000002', 'Escola B', 'SP', 'SP', true);
insert into public.classes (id, school_id, name) values ('d7d7d7d7-0000-0000-0000-000000000001', 'd6d6d6d6-0000-0000-0000-000000000001', '9A');
update public.profiles set role = 'admin' where id = :'ADM';
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'd6d6d6d6-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'd6d6d6d6-0000-0000-0000-000000000002' where id = :'COORDX';
update public.profiles set school_id = 'd6d6d6d6-0000-0000-0000-000000000001', class_id = 'd7d7d7d7-0000-0000-0000-000000000001' where id = :'GOOGLE';
update public.profiles set school_id = 'd6d6d6d6-0000-0000-0000-000000000001', school_login = 'gerido.mv' where id = :'GERID';
update public.profiles set school_id = 'd6d6d6d6-0000-0000-0000-000000000002' where id = :'OUTRO';

-- coordenação de OUTRA escola não mexe; da própria escola retira
set "request.jwt.claim.sub" = 'd5d5d5d5-0000-0000-0000-000000000003'; set role authenticated;
do $$ declare ok boolean := false; begin
  begin perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000004', null); ok := true; exception when insufficient_privilege then null; end;
  assert not ok, 'coordenação de outra escola retirou aluno alheio';
end $$;
reset role;
set "request.jwt.claim.sub" = 'd5d5d5d5-0000-0000-0000-000000000002'; set role authenticated;
do $$ declare ok boolean := false; begin
  begin perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000004', 'd6d6d6d6-0000-0000-0000-000000000002'); ok := true; exception when insufficient_privilege then null; end;
  assert not ok, 'coordenação realocou para outra escola';
  begin perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000005', null); ok := true; exception when others then null; end;
  assert not ok, 'moveu conta criada pela escola';
  begin perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000002', null); ok := true; exception when others then null; end;
  assert not ok, 'moveu a própria coordenação';
  perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000004', null);
  assert (select school_id from public.profiles where id = 'd5d5d5d5-0000-0000-0000-000000000004') is null, 'não retirou';
  assert (select class_id from public.profiles where id = 'd5d5d5d5-0000-0000-0000-000000000004') is null, 'manteve a turma';
end $$;
reset role;

-- admin realoca para outra escola
set "request.jwt.claim.sub" = 'd5d5d5d5-0000-0000-0000-000000000001'; set role authenticated;
do $$ begin
  perform public.move_person_school('d5d5d5d5-0000-0000-0000-000000000004', 'd6d6d6d6-0000-0000-0000-000000000002');
  assert (select school_id from public.profiles where id = 'd5d5d5d5-0000-0000-0000-000000000004') = 'd6d6d6d6-0000-0000-0000-000000000002', 'admin não realocou';
end $$;
reset role;
