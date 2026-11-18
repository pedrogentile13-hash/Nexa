-- Cartão-resposta: o aluno nunca lê o gabarito antes de enviar; a correção usa o gabarito oficial.
\set ALUNO 'ef5e5e5e-0000-0000-0000-000000000001'
\set OUTRO 'ef5e5e5e-0000-0000-0000-000000000002'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO','a-cr@nexa.test','{"full_name":"Aluno Cartão"}'),
  (:'OUTRO','o-cr@nexa.test','{"full_name":"Outro Aluno"}');

do $$
declare
  v_edition uuid;
  v_res record;
  v_att uuid;
begin
  insert into public.exams (slug, name, kind) values ('prova-cr', 'Prova CR', 'vestibular') on conflict do nothing;
  insert into public.exam_editions (exam_id, year, label)
  select id, 2031, 'Prova CR 2031' from public.exams where slug = 'prova-cr' returning id into v_edition;

  -- gabarito: 1 A (Linguagens), 2 B (Linguagens), 3 C (Matemática), 4 anulada (Matemática), 5 D (Matemática)
  insert into public.exam_answer_keys (exam_edition_id, number, correct, annulled, area) values
    (v_edition, 1, 'A', false, 'Linguagens'), (v_edition, 2, 'B', false, 'Linguagens'),
    (v_edition, 3, 'C', false, 'Matemática'), (v_edition, 4, null, true, 'Matemática'), (v_edition, 5, 'D', false, 'Matemática');

  begin
    insert into public.exam_answer_keys (exam_edition_id, number) values (v_edition, 6);
    assert false, 'questão sem letra e não anulada foi aceita';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', 'ef5e5e5e-0000-0000-0000-000000000001', true);
  perform set_config('role', 'authenticated', true);

  assert (select count(*) from public.exam_answer_keys) = 0, 'aluno leu o gabarito direto da tabela';
  assert (select count(*) from public.exam_key_layout(v_edition)) = 5, 'o desenho do cartão deveria ter 5 questões';
  assert (select total from public.exam_keys_summary() where exam_edition_id = v_edition) = 5, 'resumo de gabaritos errado';

  -- 1 certa, 2 errada (C), 3 certa, 4 qualquer (anulada conta), 5 em branco
  select * into v_res from public.submit_exam_attempt(v_edition, '{"1":"a","2":"C","3":"C","4":"E"}'::jsonb, 600, 'digital');
  v_att := v_res.attempt_id;
  assert v_res.total = 5, 'total errado';
  assert v_res.correct = 3, format('certas erradas: %s', v_res.correct);
  assert v_res.wrong = 1, format('erradas erradas: %s', v_res.wrong);
  assert v_res.blank = 1, format('em branco errado: %s', v_res.blank);
  assert v_res.score_pct = 60.00, format('percentual errado: %s', v_res.score_pct);
  assert jsonb_array_length(v_res.by_area) = 2, 'deveria ter 2 áreas';
  assert (select (x ->> 'correct')::int from jsonb_array_elements(v_res.by_area) x where x ->> 'area' = 'Matemática') = 2, 'Matemática: 3 e a anulada';

  -- revisão mostra as letras só da própria tentativa
  assert (select count(*) from public.exam_attempt_review(v_att)) = 5, 'revisão deveria ter 5 linhas';
  assert (select correct from public.exam_attempt_review(v_att) where number = 2) = 'B', 'a revisão deveria mostrar a certa';
  assert (select status from public.exam_attempt_review(v_att) where number = 5) = 'branca', 'questão 5 em branco';
  assert (select status from public.exam_attempt_review(v_att) where number = 4) = 'anulada', 'questão 4 anulada';

  -- entradas inválidas
  begin
    perform * from public.submit_exam_attempt(v_edition, '[1,2]'::jsonb);
    assert false, 'respostas que não são objeto foram aceitas';
  exception when sqlstate '22023' then null;
  end;

  -- não escreve direto nem lê a tentativa de outro
  begin
    insert into public.exam_attempts (user_id, exam_edition_id, total, correct, wrong, blank, score_pct)
    values (auth.uid(), v_edition, 1, 1, 0, 0, 100);
    assert false, 'aluno inseriu tentativa direto na tabela';
  exception when insufficient_privilege or others then
    if sqlerrm like 'aluno inseriu%' then raise; end if;
  end;

  perform set_config('request.jwt.claim.sub', 'ef5e5e5e-0000-0000-0000-000000000002', true);
  assert (select count(*) from public.exam_attempts) = 0, 'outro aluno viu a tentativa';
  assert (select count(*) from public.exam_attempt_review(v_att)) = 0, 'outro aluno viu a revisão';

  -- sem gabarito cadastrado, não corrige
  perform set_config('role', 'postgres', true);
  insert into public.exam_editions (exam_id, year, label)
  select id, 2032, 'Prova CR 2032' from public.exams where slug = 'prova-cr';
  perform set_config('role', 'authenticated', true);
  begin
    perform * from public.submit_exam_attempt((select id from public.exam_editions where year = 2032 and label = 'Prova CR 2032'), '{"1":"A"}'::jsonb);
    assert false, 'corrigiu sem gabarito';
  exception when sqlstate '22023' then null;
  end;
  perform set_config('role', 'postgres', true);
end $$;
