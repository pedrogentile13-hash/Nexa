-- Gabarito por caderno (cor): cada cor corrige pelo seu gabarito; o aluno nunca lê as letras.
\set ALUNO 'ca0ca0ca-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-cad@nexa.test','{"full_name":"Aluno Caderno"}');

do $$
declare
  v_edition uuid;
begin
  insert into public.exams (slug, name, kind) values ('prova-cad', 'Prova Cad', 'vestibular') on conflict do nothing;
  insert into public.exam_editions (exam_id, year, label)
  select id, 2032, 'Prova Cad 2032' from public.exams where slug = 'prova-cad' returning id into v_edition;
  -- Azul: 1-A 2-B | Amarelo: 1-B 2-A (mesmas questões, outra ordem)
  insert into public.exam_answer_keys (exam_edition_id, variant, number, correct, area) values
    (v_edition, 'Azul', 1, 'A', 'Geral'), (v_edition, 'Azul', 2, 'B', 'Geral'),
    (v_edition, 'Amarelo', 1, 'B', 'Geral'), (v_edition, 'Amarelo', 2, 'A', 'Geral');
  begin
    insert into public.exam_answer_keys (exam_edition_id, variant, number, correct) values (v_edition, 'Azul', 1, 'C');
    assert false, 'número repetido no mesmo caderno foi aceito';
  exception when unique_violation then null;
  end;
end $$;

set role authenticated;
set "request.jwt.claim.sub" = 'ca0ca0ca-0000-0000-0000-000000000001';

do $$
declare
  v_edition uuid := (select id from public.exam_editions where label = 'Prova Cad 2032');
  v_res record;
  v_att uuid;
begin
  assert (select count(*) from public.exam_key_variants(v_edition)) = 2, 'deveria listar 2 cadernos';
  assert (select max(total) from public.exam_keys_summary() where exam_edition_id = v_edition) = 2, 'resumo conta a maior prova, não a soma dos cadernos';
  assert (select count(*) from public.exam_key_layout(v_edition, 'Azul')) = 2, 'layout do Azul';
  assert (select count(*) from public.exam_key_layout(v_edition)) = 2, 'sem caderno: usa o primeiro, não mistura os dois';

  -- mesmas respostas, cadernos diferentes: notas diferentes
  select * into v_res from public.submit_exam_attempt(v_edition, '{"1":"A","2":"B"}'::jsonb, 60, 'digital', 'Azul');
  assert v_res.correct = 2, 'Azul deveria acertar as 2';
  select * into v_res from public.submit_exam_attempt(v_edition, '{"1":"A","2":"B"}'::jsonb, 60, 'digital', 'Amarelo');
  assert v_res.correct = 0, 'as mesmas respostas no Amarelo deveriam errar as 2';
  v_att := v_res.attempt_id;
  assert (select variant from public.exam_attempts where id = v_att) = 'Amarelo', 'a tentativa guarda o caderno';

  -- a revisão usa o gabarito do caderno da tentativa
  assert (select correct from public.exam_attempt_review(v_att) where number = 1) = 'B', 'revisão do Amarelo: 1 é B';

  -- caderno inexistente cai no primeiro (Amarelo, ordem alfabética), sem quebrar
  select * into v_res from public.submit_exam_attempt(v_edition, '{"1":"B","2":"A"}'::jsonb, 60, 'digital', 'Roxo');
  assert v_res.correct = 2, 'caderno inexistente usa o primeiro (Amarelo)';

  -- aluno não lê o gabarito
  assert (select count(*) from public.exam_answer_keys) = 0, 'aluno leu o gabarito';
end $$;
reset role;
