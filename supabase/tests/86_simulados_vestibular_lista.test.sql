-- Simulado de vestibular carregado pelo Admin (context vestibular + exam_id) aparece para o aluno na Biblioteca.
\set ALUNO 'ca1ca1ca-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-sim@nexa.test','{"full_name":"Aluno Simulado"}');

do $$
declare
  v_subject uuid := (select id from public.subject_catalog where slug = 'matematica');
  v_exam uuid;
  v_res uuid;
begin
  insert into public.exams (slug, name, kind) values ('sim-teste', 'SIM TESTE', 'vestibular') on conflict do nothing;
  select id into v_exam from public.exams where slug = 'sim-teste';
  -- rascunho: o aluno não vê
  insert into public.resources (school_id, subject_catalog_id, kind, context, exam_id, time_limit_seconds, title, tags, grade_levels, is_published, duration_seconds)
  values (null, v_subject, 'simulado', 'vestibular', v_exam, 3600, 'Simulado de teste', array['pacote-vestibular-v1','vestibular'], array['3º EM'], false, 3600)
  returning id into v_res;
  insert into public.questions (resource_id, position, statement, explanation, difficulty) values (v_res, 1, 'Quanto é 2 + 2?', 'Dois mais dois é quatro.', 'facil');
end $$;

set role authenticated;
set "request.jwt.claim.sub" = 'ca1ca1ca-0000-0000-0000-000000000001';
do $$
begin
  assert (select count(*) from public.list_vestibular_resources(null, null, null, 'simulado', 200) where title = 'Simulado de teste') = 0, 'rascunho apareceu para o aluno';
end $$;
reset role;

update public.resources set is_published = true where title = 'Simulado de teste';

set role authenticated;
set "request.jwt.claim.sub" = 'ca1ca1ca-0000-0000-0000-000000000001';
do $$
begin
  assert (select count(*) from public.list_vestibular_resources(null, null, null, 'simulado', 200) where title = 'Simulado de teste') = 1, 'simulado publicado não apareceu para o aluno';
  assert (select count(*) from public.list_vestibular_resources(null, null, null, null, 200) where title = 'Simulado de teste') = 1, 'sem filtro de tipo também deveria listar';
end $$;
reset role;
