-- Redação: privada do aluno; só notas na régua do ENEM; total calculado pelo banco.

\set ANA  'f4f4f4f4-0000-0000-0000-000000000001'
\set BETO 'f4f4f4f4-0000-0000-0000-000000000002'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ANA',  'ana-red@nexa.test', '{"full_name": "Ana"}'),
  (:'BETO', 'beto-red@nexa.test', '{"full_name": "Beto"}');

set "request.jwt.claim.sub" = 'f4f4f4f4-0000-0000-0000-000000000001'; -- ANA
set role authenticated;
do $$
declare v_falhou boolean;
begin
  insert into public.essay_corrections (user_id, theme, essay, c1, c2, c3, c4, c5, feedback)
  values (auth.uid(), 'Desigualdade social', repeat('texto da redação ', 20), 120, 160, 120, 160, 80, '{}');
  assert (select total from public.essay_corrections) = 640, 'o banco não somou o total (120+160+120+160+80)';

  -- Nota fora do degrau de 40 / acima de 200 é recusada.
  v_falhou := false;
  begin
    insert into public.essay_corrections (user_id, theme, essay, c1, c2, c3, c4, c5, feedback)
    values (auth.uid(), 'Tema', repeat('texto da redação ', 20), 130, 160, 120, 160, 80, '{}');
    v_falhou := true;
  exception when check_violation then null; end;
  assert not v_falhou, 'nota 130 (fora do degrau de 40) foi aceita';

  v_falhou := false;
  begin
    insert into public.essay_corrections (user_id, theme, essay, c1, c2, c3, c4, c5, feedback)
    values (auth.uid(), 'Tema', repeat('texto da redação ', 20), 240, 160, 120, 160, 80, '{}');
    v_falhou := true;
  exception when check_violation then null; end;
  assert not v_falhou, 'nota 240 (acima de 200) foi aceita';

  -- Em nome de outra pessoa, não.
  v_falhou := false;
  begin
    insert into public.essay_corrections (user_id, theme, essay, c1, c2, c3, c4, c5, feedback)
    values ('f4f4f4f4-0000-0000-0000-000000000002', 'Tema', repeat('texto da redação ', 20), 120, 120, 120, 120, 120, '{}');
    v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'a Ana gravou uma redação em nome do Beto';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'f4f4f4f4-0000-0000-0000-000000000002'; -- BETO
set role authenticated;
do $$
begin
  assert (select count(*) from public.essay_corrections) = 0, 'o Beto leu a redação da Ana';
  delete from public.essay_corrections;
end;
$$;
reset role;

-- A Ana ainda tem a dela (o delete do Beto não alcançou nada) e pode apagá-la.
set "request.jwt.claim.sub" = 'f4f4f4f4-0000-0000-0000-000000000001';
set role authenticated;
do $$
begin
  assert (select count(*) from public.essay_corrections) = 1, 'o delete do Beto apagou a redação da Ana';
  delete from public.essay_corrections;
  assert (select count(*) from public.essay_corrections) = 0, 'a Ana não conseguiu apagar a própria redação';
end;
$$;
reset role;
