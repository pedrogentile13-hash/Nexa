-- ============================================================================
-- Limite diário de uso da IA.
--
-- O que esta suíte existe para impedir:
--   1. Passar do limite (inclusive com chamadas seguidas).
--   2. Um aluno gastar a cota de outro, ou de outro recurso.
--   3. O contador crescer com tentativas negadas.
--   4. Escrever o contador direto, zerando o próprio uso.
-- ============================================================================

\set ANA  'b1b1b1b1-0000-0000-0000-000000000001'
\set BETO 'b1b1b1b1-0000-0000-0000-000000000002'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ANA',  'ana-ia@nexa.test', '{"full_name": "Ana"}'),
  (:'BETO', 'beto-ia@nexa.test', '{"full_name": "Beto"}');

set "request.jwt.claim.sub" = 'b1b1b1b1-0000-0000-0000-000000000001'; -- ANA
set role authenticated;

do $$
declare
  r record;
  i integer;
  v_falhou boolean;
begin
  -- 1 · três usos liberados, o quarto negado
  for i in 1..3 loop
    select * into r from public.consume_ai_quota('chat', 3);
    assert r.allowed, format('uso %s deveria ser liberado', i);
    assert r.remaining = 3 - i, 'restante errado';
  end loop;
  select * into r from public.consume_ai_quota('chat', 3);
  assert not r.allowed, 'passou do limite diário';
  assert r.remaining = 0, 'restante deveria ser 0';

  -- 3 · tentativas negadas não aumentam o contador
  for i in 1..5 loop perform public.consume_ai_quota('chat', 3); end loop;
  assert (select uses from public.ai_usage where feature = 'chat') = 3, 'o contador cresceu com tentativas negadas';

  -- 2 · outro recurso tem a própria cota
  select * into r from public.consume_ai_quota('resumo', 3);
  assert r.allowed, 'o limite de um recurso bloqueou outro';

  -- 4 · escrita direta é negada
  v_falhou := false;
  begin
    update public.ai_usage set uses = 0;
    v_falhou := true;
  exception when others then null;
  end;
  -- (update sem policy não lança: afeta 0 linhas — o contador não pode ter zerado)
  assert (select uses from public.ai_usage where feature = 'chat') = 3, 'o aluno zerou o próprio contador';

  v_falhou := false;
  begin
    insert into public.ai_usage (user_id, day, feature, uses) values (auth.uid(), current_date, 'forja', 0);
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'o aluno inseriu no contador direto';

  -- limite absurdo é recusado
  v_falhou := false;
  begin
    perform public.consume_ai_quota('x', 0);
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'limite zero foi aceito';
end;
$$;

reset role;

-- 2 · outro aluno não é afetado pelo uso da Ana
set "request.jwt.claim.sub" = 'b1b1b1b1-0000-0000-0000-000000000002'; -- BETO
set role authenticated;

do $$
declare r record;
begin
  select * into r from public.consume_ai_quota('chat', 3);
  assert r.allowed and r.used = 1, 'o uso da Ana afetou o Beto';
  assert (select count(*) from public.ai_usage) = 1, 'o Beto enxerga o uso de outro aluno';
end;
$$;

reset role;
