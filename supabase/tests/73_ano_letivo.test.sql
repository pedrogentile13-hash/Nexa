-- Ano letivo: preparar 2027, ajustar, virar o ano; história preservada; formandos; permissões.
\set DIR  'ad5e5e5e-0000-0000-0000-000000000001'
\set PROF 'ad5e5e5e-0000-0000-0000-000000000002'
\set A9   'ad5e5e5e-0000-0000-0000-000000000003'
\set A3   'ad5e5e5e-0000-0000-0000-000000000004'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'DIR','d-al@nexa.test','{"full_name":"Dir"}'),(:'PROF','p-al@nexa.test','{"full_name":"Prof"}'),
  (:'A9','a9-al@nexa.test','{"full_name":"Aluno do 9"}'),(:'A3','a3-al@nexa.test','{"full_name":"Aluno do 3EM"}');
insert into public.schools (id,name,city,state,is_verified) values ('ad6e5e5e-0000-0000-0000-000000000001','Escola AL','SP','SP',true);
insert into public.subject_catalog (id,slug,name,default_color) values ('ad8e5e5e-0000-0000-0000-000000000001','mat-al','Mat AL','#336699') on conflict do nothing;
update public.profiles set role='school_admin', school_title='direcao', school_id='ad6e5e5e-0000-0000-0000-000000000001' where id=:'DIR';
update public.profiles set role='teacher_admin', school_id='ad6e5e5e-0000-0000-0000-000000000001' where id=:'PROF';

do $$ begin
  assert (select count(*) from public.school_years where school_id='ad6e5e5e-0000-0000-0000-000000000001' and status='current') = 1, 'escola nova deveria ter ano atual';
end $$;

insert into public.classes (id,school_id,name) values
  ('ad7e5e5e-0000-0000-0000-000000000009','ad6e5e5e-0000-0000-0000-000000000001','9º ano B'),
  ('ad7e5e5e-0000-0000-0000-000000000003','ad6e5e5e-0000-0000-0000-000000000001','3EM A');
update public.profiles set school_id='ad6e5e5e-0000-0000-0000-000000000001', class_id='ad7e5e5e-0000-0000-0000-000000000009' where id=:'A9';
update public.profiles set school_id='ad6e5e5e-0000-0000-0000-000000000001', class_id='ad7e5e5e-0000-0000-0000-000000000003' where id=:'A3';
insert into public.teacher_assignments (teacher_id,school_id,subject_catalog_id,class_id) values (:'PROF','ad6e5e5e-0000-0000-0000-000000000001','ad8e5e5e-0000-0000-0000-000000000001','ad7e5e5e-0000-0000-0000-000000000009');

do $$ begin
  assert (select count(*) from public.class_enrollments where school_id='ad6e5e5e-0000-0000-0000-000000000001') = 2, 'matrículas do ano atual não registradas';
end $$;

-- professor e aluno não preparam o ano
set "request.jwt.claim.sub"='ad5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ declare v_ok boolean := false; begin
  begin perform public.prepare_school_year(2099); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'professor preparou o ano';
end $$;
reset role;

set "request.jwt.claim.sub"='ad5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ declare v_new uuid; v_ov jsonb; v_cur int := extract(year from now())::int; v_c1 uuid; begin
  v_new := public.prepare_school_year(v_cur + 1);
  v_ov := public.year_plan_overview(v_new);
  assert jsonb_array_length(v_ov->'classes') = 1, 'só o 9º tem sucessora (3EM forma)';
  assert v_ov->'classes'->0->>'name' = '1º EM B', 'nome sugerido errado: ' || (v_ov->'classes'->0->>'name');
  assert v_ov->'classes'->0->>'grade' = '1em', 'ano sucessor errado';
  assert jsonb_array_length(v_ov->'classes'->0->'teachers') = 1, 'professor não foi copiado';
  assert (select count(*) from jsonb_array_elements(v_ov->'students') x where x->>'planClassId' is not null) = 1, 'só o aluno do 9º tem turma planejada';
  -- ajuste: renomear a turma e criar outra
  v_c1 := (v_ov->'classes'->0->>'id')::uuid;
  perform public.plan_save_class(v_new, v_c1, '1º EM Azul', '1em');
  perform public.plan_save_class(v_new, null, '1º EM Verde', '1em');
  -- esconde o ano em preparação das turmas de hoje
  assert (select count(*) from public.staff_classes_overview()) = 2, 'o planejamento vazou para as turmas atuais';
  -- vira o ano
  perform public.activate_school_year(v_new);
  assert (select status from public.school_years where id = v_new) = 'current', 'novo ano não ficou atual';
  assert (select count(*) from public.school_years where school_id='ad6e5e5e-0000-0000-0000-000000000001' and status='current') = 1, 'deveria haver um único ano atual';
  assert (select count(*) from public.staff_classes_overview()) = 2, 'turmas do ano novo: esperadas 2 (Azul e Verde)';
  assert (select c.name from public.profiles p join public.classes c on c.id = p.class_id where p.id = 'ad5e5e5e-0000-0000-0000-000000000003') = '1º EM Azul', 'aluno do 9º não foi para o 1º EM';
  assert (select class_id from public.profiles where id = 'ad5e5e5e-0000-0000-0000-000000000004') is null, 'formando ainda tem turma';
  assert (select graduated_at from public.profiles where id = 'ad5e5e5e-0000-0000-0000-000000000004') is not null, 'formando não foi marcado';
  assert (select count(*) from public.staff_unassigned_students()) = 0, 'formando apareceu como sem turma';
  assert (select count(*) from public.teacher_assignments ta join public.classes c on c.id = ta.class_id where c.name = '1º EM Azul') = 1, 'professor não foi para a turma nova';
end $$;
reset role;

do $$ begin
  -- história: o ano antigo ficou fechado, com as turmas e as matrículas dele
  assert (select count(*) from public.school_years where school_id='ad6e5e5e-0000-0000-0000-000000000001' and status='closed') = 1, 'ano antigo deveria estar fechado';
  assert (select count(*) from public.classes where school_id='ad6e5e5e-0000-0000-0000-000000000001' and closed_at is not null) = 2, 'turmas antigas deveriam estar encerradas, não apagadas';
  assert (select count(*) from public.class_enrollments e join public.school_years y on y.id = e.school_year_id where y.status='closed') = 2, 'a matrícula do ano antigo se perdeu';
  assert (select count(*) from public.class_enrollments e join public.school_years y on y.id = e.school_year_id where y.status='current' and e.student_id='ad5e5e5e-0000-0000-0000-000000000003') = 1, 'sem matrícula no ano novo';
end $$;

-- o professor não enxerga a turma encerrada
set "request.jwt.claim.sub"='ad5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ begin
  assert (select count(*) from public.staff_classes_overview()) = 1, 'professor deveria ver só a turma do ano novo';
end $$;
reset role;
