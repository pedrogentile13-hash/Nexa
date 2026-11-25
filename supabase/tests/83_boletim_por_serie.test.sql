-- Boletim por série: nota por matéria separada pela série do conteúdo; só conteúdo escolar.
\set ALUNO 'f05e5e5e-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-bs@nexa.test','{"full_name":"Aluno Boletim"}');

do $$
declare
  v_mat uuid;
  v_q7 uuid := 'f05e5e5e-0000-0000-0000-0000000000a7';
  v_q8 uuid := 'f05e5e5e-0000-0000-0000-0000000000a8';
  v_qv uuid := 'f05e5e5e-0000-0000-0000-0000000000a9';
  v_r7 uuid := 'f05e5e5e-0000-0000-0000-0000000000b7';
begin
  select id into v_mat from public.subject_catalog where slug = 'matematica';
  insert into public.resources (id, subject_catalog_id, kind, title, body, grade_levels, is_published) values
    (v_q7, v_mat, 'quiz', 'Quiz do 7º', null, array['7º ano'], true),
    (v_q8, v_mat, 'quiz', 'Quiz do 8º', null, array['8º ano'], true),
    (v_qv, v_mat, 'quiz', 'Quiz de vestibular 7º', null, array['7º ano'], true),
    (v_r7, v_mat, 'resumo', 'Resumo do 7º', 'texto', array['7º ano'], true);
  update public.resources set context = 'vestibular' where id = v_qv;

  insert into public.quiz_attempts (user_id, resource_id, finished_at, correct_count, total_count) values
    ('f05e5e5e-0000-0000-0000-000000000001', v_q7, now(), 8, 10),
    ('f05e5e5e-0000-0000-0000-000000000001', v_q8, now(), 5, 10),
    ('f05e5e5e-0000-0000-0000-000000000001', v_qv, now(), 10, 10);
  insert into public.resource_progress (user_id, resource_id, progress_percent, completed_at)
  values ('f05e5e5e-0000-0000-0000-000000000001', v_r7, 100, now());

  perform set_config('request.jwt.claim.sub', 'f05e5e5e-0000-0000-0000-000000000001', true);
  perform set_config('role', 'authenticated', true);

  assert (select count(*) from public.report_card_by_grade()) = 2, 'deveria haver 2 linhas: matemática no 7º e no 8º';
  assert (select assessment_score from public.report_card_by_grade() where grade_level = '7º ano') = 8.00, 'nota do 7º deveria ser 8,0 (vestibular não conta)';
  assert (select assessment_score from public.report_card_by_grade() where grade_level = '8º ano') = 5.00, 'nota do 8º deveria ser 5,0';
  assert (select quizzes_done from public.report_card_by_grade() where grade_level = '7º ano') = 1, 'só o quiz escolar conta';
  assert (select content_completed from public.report_card_by_grade() where grade_level = '7º ano') = 1, 'o resumo concluído do 7º conta';
  perform set_config('role', 'postgres', true);
end $$;
