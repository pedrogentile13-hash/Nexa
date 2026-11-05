-- Portal da equipe: professor vê só as próprias turmas; coordenação a escola toda; aluno e gente de fora, nada.
\set COORD 'ab5e5e5e-0000-0000-0000-000000000001'
\set PROF  'ab5e5e5e-0000-0000-0000-000000000002'
\set ALUNO 'ab5e5e5e-0000-0000-0000-000000000003'
\set FORA  'ab5e5e5e-0000-0000-0000-000000000004'
\set ALUNO2 'ab5e5e5e-0000-0000-0000-000000000005'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'COORD','c-pe@nexa.test','{"full_name":"Coord"}'),(:'PROF','p-pe@nexa.test','{"full_name":"Prof"}'),
  (:'ALUNO','a-pe@nexa.test','{"full_name":"Aluno 9A"}'),(:'ALUNO2','a2-pe@nexa.test','{"full_name":"Aluno 9B"}'),(:'FORA','f-pe@nexa.test','{"full_name":"Fora"}');
insert into public.schools (id,name,city,state,is_verified) values
  ('ab6e5e5e-0000-0000-0000-000000000001','Escola PE','SP','SP',true),('ab6e5e5e-0000-0000-0000-000000000002','Escola PE2','SP','SP',true);
insert into public.classes (id,school_id,name) values
  ('ab7e5e5e-0000-0000-0000-000000000001','ab6e5e5e-0000-0000-0000-000000000001','9A'),
  ('ab7e5e5e-0000-0000-0000-000000000002','ab6e5e5e-0000-0000-0000-000000000001','9B');
insert into public.subject_catalog (id,slug,name,default_color) values ('ab8e5e5e-0000-0000-0000-000000000001','mat-pe','Mat PE','#336699') on conflict do nothing;
update public.profiles set role='school_admin', school_title='coordenacao', school_id='ab6e5e5e-0000-0000-0000-000000000001' where id=:'COORD';
update public.profiles set role='teacher_admin', school_id='ab6e5e5e-0000-0000-0000-000000000001' where id=:'PROF';
update public.profiles set school_id='ab6e5e5e-0000-0000-0000-000000000001', class_id='ab7e5e5e-0000-0000-0000-000000000001' where id=:'ALUNO';
update public.profiles set school_id='ab6e5e5e-0000-0000-0000-000000000001', class_id='ab7e5e5e-0000-0000-0000-000000000002' where id=:'ALUNO2';
update public.profiles set school_id='ab6e5e5e-0000-0000-0000-000000000002' where id=:'FORA';
insert into public.teacher_assignments (teacher_id,school_id,subject_catalog_id,class_id) values (:'PROF','ab6e5e5e-0000-0000-0000-000000000001','ab8e5e5e-0000-0000-0000-000000000001','ab7e5e5e-0000-0000-0000-000000000001');

set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ begin
  assert (select count(*) from public.staff_classes_overview()) = 2, 'coordenação deveria ver as 2 turmas';
  assert (select count(*) from public.staff_roster()) = 2, 'coordenação deveria ver os 2 alunos';
  assert (select string_agg(teachers, '|') from public.staff_classes_overview() where class_name='9A') = 'Prof', 'professor da turma não apareceu';
end $$;
reset role;
set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ begin
  assert (select count(*) from public.staff_classes_overview()) = 1, 'professor deveria ver só a turma dele';
  assert (select full_name from public.staff_roster()) = 'Aluno 9A', 'professor viu aluno de outra turma';
  assert (select count(*) from public.staff_unassigned_students()) = 0, 'professor não vê alunos sem turma da escola';
end $$;
reset role;
set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000003'; set role authenticated;
do $$ begin
  assert (select count(*) from public.staff_classes_overview()) = 0, 'aluno viu turmas';
  assert (select count(*) from public.staff_roster()) = 0, 'aluno viu a lista de alunos';
end $$;
reset role;
set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000004'; set role authenticated;
do $$ begin
  assert (select count(*) from public.staff_roster()) = 0, 'gente de fora viu alunos';
end $$;
reset role;

-- coordenação põe aluno em turma da própria escola; professor não; turma de outra escola não
set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ declare v_ok boolean := false; begin
  perform public.staff_set_student_class('ab5e5e5e-0000-0000-0000-000000000003', 'ab7e5e5e-0000-0000-0000-000000000002');
  assert (select class_id from public.profiles where id='ab5e5e5e-0000-0000-0000-000000000003') = 'ab7e5e5e-0000-0000-0000-000000000002', 'não mudou de turma';
  begin perform public.staff_set_student_class('ab5e5e5e-0000-0000-0000-000000000003', gen_random_uuid()); v_ok := true; exception when others then null; end;
  assert not v_ok, 'aceitou turma que não existe/é de outra escola';
end $$;
reset role;
set "request.jwt.claim.sub"='ab5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ declare v_ok boolean := false; begin
  begin perform public.staff_set_student_class('ab5e5e5e-0000-0000-0000-000000000003', null); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'professor mexeu na turma de aluno';
end $$;
reset role;
