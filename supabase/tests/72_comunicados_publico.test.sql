-- Comunicados com público: alunos escolhidos, ano, EFAF/EM; professor só nas próprias turmas.
\set DIR  'ac5e5e5e-0000-0000-0000-000000000001'
\set PROF 'ac5e5e5e-0000-0000-0000-000000000002'
\set A6   'ac5e5e5e-0000-0000-0000-000000000003'
\set A9   'ac5e5e5e-0000-0000-0000-000000000004'
\set A1EM 'ac5e5e5e-0000-0000-0000-000000000005'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'DIR','d-cp@nexa.test','{"full_name":"Dir"}'),(:'PROF','p-cp@nexa.test','{"full_name":"Prof"}'),
  (:'A6','a6-cp@nexa.test','{"full_name":"Aluno 6"}'),(:'A9','a9-cp@nexa.test','{"full_name":"Aluno 9"}'),(:'A1EM','a1-cp@nexa.test','{"full_name":"Aluno 1EM"}');
insert into public.schools (id,name,city,state,is_verified) values ('ac6e5e5e-0000-0000-0000-000000000001','Escola CP','SP','SP',true);
insert into public.classes (id,school_id,name) values
  ('ac7e5e5e-0000-0000-0000-000000000006','ac6e5e5e-0000-0000-0000-000000000001','6A'),
  ('ac7e5e5e-0000-0000-0000-000000000009','ac6e5e5e-0000-0000-0000-000000000001','9º ano B'),
  ('ac7e5e5e-0000-0000-0000-000000000001','ac6e5e5e-0000-0000-0000-000000000001','1EM A');
insert into public.subject_catalog (id,slug,name,default_color) values ('ac8e5e5e-0000-0000-0000-000000000001','mat-cp','Mat CP','#336699') on conflict do nothing;
update public.profiles set role='school_admin', school_title='direcao', school_id='ac6e5e5e-0000-0000-0000-000000000001' where id=:'DIR';
update public.profiles set role='teacher_admin', school_id='ac6e5e5e-0000-0000-0000-000000000001' where id=:'PROF';
update public.profiles set school_id='ac6e5e5e-0000-0000-0000-000000000001', class_id='ac7e5e5e-0000-0000-0000-000000000006' where id=:'A6';
update public.profiles set school_id='ac6e5e5e-0000-0000-0000-000000000001', class_id='ac7e5e5e-0000-0000-0000-000000000009' where id=:'A9';
update public.profiles set school_id='ac6e5e5e-0000-0000-0000-000000000001', class_id='ac7e5e5e-0000-0000-0000-000000000001' where id=:'A1EM';
insert into public.teacher_assignments (teacher_id,school_id,subject_catalog_id,class_id) values (:'PROF','ac6e5e5e-0000-0000-0000-000000000001','ac8e5e5e-0000-0000-0000-000000000001','ac7e5e5e-0000-0000-0000-000000000006');

do $$ begin
  assert (select grade from public.classes where name='6A') = '6', 'ano 6 não detectado';
  assert (select grade from public.classes where name='9º ano B') = '9', 'ano 9 não detectado';
  assert (select grade from public.classes where name='1EM A') = '1em', '1º EM não detectado';
end $$;

set "request.jwt.claim.sub"='ac5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ declare r record; begin
  -- EFAF: 6 ao 9 → 2 alunos, não o do EM
  select * into r from public.create_announcement('EFAF', 'Aviso fundamental', null, false, null, array['6','7','8','9'], null);
  assert array_length(r.notified_user_ids, 1) = 3, 'EFAF deveria avisar 2 alunos + 1 professor do 6A (got ' || array_length(r.notified_user_ids,1) || ')';
  assert (select audience_label from public.list_announcements() where title='EFAF') = 'Fundamental II (6º ao 9º)', 'rótulo EFAF';
  assert (select audience_size from public.list_announcements() where title='EFAF') = 2, 'público EFAF';
  -- só o 1º EM
  perform public.create_announcement('EM', 'Aviso médio', null, false, null, array['1em','2em','3em'], null);
  assert (select audience_size from public.list_announcements() where title='EM') = 1, 'público EM';
  -- alunos específicos
  perform public.create_announcement('Dois', 'Só dois', null, false, null, null, array['ac5e5e5e-0000-0000-0000-000000000003','ac5e5e5e-0000-0000-0000-000000000005']::uuid[]);
  assert (select audience_size from public.list_announcements() where title='Dois') = 2, 'público específico';
  assert (select audience_label from public.list_announcements() where title='Dois') = '2 alunos', 'rótulo específico';
end $$;
reset role;

-- aluno do 9º não vê o aviso dos 2 escolhidos; o do 6º vê
set "request.jwt.claim.sub"='ac5e5e5e-0000-0000-0000-000000000004'; set role authenticated;
do $$ begin
  assert (select count(*) from public.list_announcements() where title='Dois') = 0, 'aluno fora do público viu o aviso';
  assert (select count(*) from public.list_announcements() where title='EFAF') = 1, 'aluno do 9º deveria ver o EFAF';
  assert (select count(*) from public.list_announcements() where title='EM') = 0, 'aluno do 9º viu aviso do EM';
end $$;
reset role;
set "request.jwt.claim.sub"='ac5e5e5e-0000-0000-0000-000000000003'; set role authenticated;
do $$ begin
  assert (select count(*) from public.list_announcements() where title='Dois') = 1, 'aluno escolhido não viu';
end $$;
reset role;

-- professor: aluno da própria turma sim; ano inteiro e aluno de outra turma não
set "request.jwt.claim.sub"='ac5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ declare v_ok boolean := false; begin
  perform public.create_announcement('Meu aluno', 'ok', null, false, null, null, array['ac5e5e5e-0000-0000-0000-000000000003']::uuid[]);
  begin perform public.create_announcement('x', 'y', null, false, null, null, array['ac5e5e5e-0000-0000-0000-000000000004']::uuid[]); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'professor avisou aluno de turma que não é dele';
  begin perform public.create_announcement('x', 'y', null, false, null, array['6'], null); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'professor avisou um ano inteiro';
end $$;
reset role;
