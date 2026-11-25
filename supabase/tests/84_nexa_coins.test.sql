-- Nexa Coin: o gasto é atômico, nunca passa do saldo, estorna e o aluno só vê o próprio extrato.
\set ALUNO 'c0c0c0c0-0000-0000-0000-000000000001'
\set OUTRO 'c0c0c0c0-0000-0000-0000-000000000002'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO','a-coin@nexa.test','{"full_name":"Aluno Coin"}'),
  (:'OUTRO','o-coin@nexa.test','{"full_name":"Outro Coin"}');

set role authenticated;
set "request.jwt.claim.sub" = 'c0c0c0c0-0000-0000-0000-000000000001';

do $$
declare r record;
begin
  select * into r from public.spend_ai_coins('essay', 8, 20);
  assert r.allowed and r.spent = 8 and r.remaining = 12, 'primeiro gasto deveria passar';
  select * into r from public.spend_ai_coins('nexa_ia', 1, 20);
  assert r.allowed and r.spent = 9 and r.remaining = 11, 'o saldo é somado entre recursos';
  select * into r from public.spend_ai_coins('essay_pro', 30, 20);
  assert not r.allowed and r.remaining = 11, 'gasto maior que o saldo deveria ser negado sem cobrar';
  select * into r from public.spend_ai_coins('essay', 8, 20);
  assert r.allowed and r.remaining = 3, 'segundo gasto cabe';
  select * into r from public.spend_ai_coins('essay', 8, 20);
  assert not r.allowed and r.remaining = 3, 'sem saldo';

  perform public.refund_ai_coins('essay', 8);
  select * into r from public.spend_ai_coins('essay', 8, 20);
  assert r.allowed and r.remaining = 3, 'estorno devolve o saldo';

  assert (select sum(coins) from public.my_ai_coin_usage()) = 17, 'extrato soma o gasto do mês';

  begin
    perform public.spend_ai_coins('essay', 0, 20);
    assert false, 'custo zero foi aceito';
  exception when sqlstate '22023' then null;
  end;
end $$;

-- Outra pessoa não vê nem mexe no saldo do aluno.
set "request.jwt.claim.sub" = 'c0c0c0c0-0000-0000-0000-000000000002';
do $$
begin
  assert (select count(*) from public.my_ai_coin_usage()) = 0, 'extrato de outra pessoa deveria vir vazio';
  assert (select count(*) from public.ai_coin_usage) = 0, 'RLS vazou o uso de outra pessoa';
  begin
    insert into public.ai_coin_usage (user_id, period, feature, coins, uses) values ('c0c0c0c0-0000-0000-0000-000000000002', current_date, 'x', 1, 1);
    assert false, 'escrita direta foi aceita';
  exception when insufficient_privilege or others then null;
  end;
end $$;

-- Redações-modelo: o aluno nunca lê direto; a calibração passa pela função e respeita a banca.
reset role;
insert into public.essay_references (banca, theme, essay, c1, c2, c3, c4, c5)
values ('ENEM', 'Tema A', repeat('texto de referência ', 20), 200, 200, 160, 200, 200),
       ('FUVEST', 'Tema B', repeat('outro texto de referência ', 20), 160, 160, 120, 160, 120);
set role authenticated;
set "request.jwt.claim.sub" = 'c0c0c0c0-0000-0000-0000-000000000001';
do $$
begin
  assert (select count(*) from public.essay_references) = 0, 'aluno leu as redações-modelo';
  assert (select count(*) from public.essay_calibration('ENEM', 2)) = 1, 'ENEM deveria devolver só a do ENEM';
  assert (select theme from public.essay_calibration('FUVEST', 2) limit 1) = 'Tema B', 'a da própria banca vem primeiro';
  assert (select count(*) from public.essay_calibration('FUVEST', 3)) = 2, 'FUVEST completa com a do ENEM';
end $$;
reset role;
