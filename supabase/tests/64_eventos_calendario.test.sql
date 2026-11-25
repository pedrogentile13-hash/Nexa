-- Eventos da escola no calendário: só quem pode ver o aviso vê o evento; só quem
-- gerencia o aviso define a data.
\set COORD  'f3f3f3f3-0000-0000-0000-000000000001'
\set ALUNA  'f3f3f3f3-0000-0000-0000-000000000003'
\set ALUNOB 'f3f3f3f3-0000-0000-0000-000000000004'
\set FORA   'f3f3f3f3-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'COORD',  'coord-ev@nexa.test', '{"full_name": "Coord Ev"}'),
  (:'ALUNA',  'aluna-ev@nexa.test', '{"full_name": "Aluna 9A"}'),
  (:'ALUNOB', 'alunob-ev@nexa.test', '{"full_name": "Aluno 9B"}'),
  (:'FORA',   'fora-ev@nexa.test', '{"full_name": "Aluno de fora"}');
insert into public.schools (id, name, city, state, is_verified) values
  ('f4f4f4f4-0000-0000-0000-000000000001', 'Escola Ev', 'São Paulo', 'SP', true),
  ('f4f4f4f4-0000-0000-0000-000000000002', 'Escola Ev Fora', 'São Paulo', 'SP', true);
insert into public.classes (id, school_id, name) values
  ('f5f5f5f5-0000-0000-0000-000000000001', 'f4f4f4f4-0000-0000-0000-000000000001', '9A'),
  ('f5f5f5f5-0000-0000-0000-000000000002', 'f4f4f4f4-0000-0000-0000-000000000001', '9B');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'f4f4f4f4-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set school_id = 'f4f4f4f4-0000-0000-0000-000000000001', class_id = 'f5f5f5f5-0000-0000-0000-000000000001' where id = :'ALUNA';
update public.profiles set school_id = 'f4f4f4f4-0000-0000-0000-000000000001', class_id = 'f5f5f5f5-0000-0000-0000-000000000002' where id = :'ALUNOB';
update public.profiles set school_id = 'f4f4f4f4-0000-0000-0000-000000000002' where id = :'FORA';

set "request.jwt.claim.sub" = 'f3f3f3f3-0000-0000-0000-000000000001';
set role authenticated;
do $$
declare r record;
begin
  select * into r from public.create_announcement('Feira de ciências', 'Sábado, quadra.', null, false);
  perform public.set_announcement_event_date(r.announcement_id, current_date + 3);
  select * into r from public.create_announcement('Passeio da 9A', 'Museu.', 'f5f5f5f5-0000-0000-0000-000000000001', false);
  perform public.set_announcement_event_date(r.announcement_id, current_date + 5);
  assert (select count(*) from public.list_school_events(current_date, current_date + 30)) = 2, 'coordenação deveria ver os 2';
end $$;

reset role;
set "request.jwt.claim.sub" = 'f3f3f3f3-0000-0000-0000-000000000003';
set role authenticated;
do $$
begin
  assert (select count(*) from public.list_school_events(current_date, current_date + 30)) = 2, 'aluna da 9A vê os 2';
  begin
    perform public.set_announcement_event_date((select id from public.school_announcements limit 1), current_date);
    raise exception 'aluna não deveria definir data';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
set "request.jwt.claim.sub" = 'f3f3f3f3-0000-0000-0000-000000000004';
set role authenticated;
do $$
begin
  assert (select count(*) from public.list_school_events(current_date, current_date + 30)) = 1, '9B vê só o evento da escola toda';
end $$;

reset role;
set "request.jwt.claim.sub" = 'f3f3f3f3-0000-0000-0000-000000000005';
set role authenticated;
do $$
begin
  assert (select count(*) from public.list_school_events(current_date, current_date + 30)) = 0, 'aluno de fora não vê nada';
end $$;
reset role;
