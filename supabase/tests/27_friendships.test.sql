-- ============================================================================
-- Nexa — suíte SQL: sistema de amizade (send/respond/remove/search/list).
--
-- O que esta suíte existe para impedir:
--   1. Pedido de amizade entre alunos de escolas diferentes.
--   2. Se adicionar como próprio amigo.
--   3. Pedido duplicado criar uma segunda linha em vez de reaproveitar a
--      mesma (o índice único por par já bloqueia isso a nível de banco, mas
--      a RPC precisa devolver 'already_pending' em vez de estourar erro).
--   4. Pedidos cruzados (A→B enquanto B→A já existe) não virarem amizade
--      automaticamente.
--   5. Depois de recusado, o colega ficar impedido de pedir de novo.
-- ============================================================================

\set ESCOLA_X '44444444-0000-0000-0000-000000000001'
\set ESCOLA_Y '44444444-0000-0000-0000-000000000002'
\set FELIPE   '66666666-9999-9999-9999-999999999901'
\set GABRIELA '66666666-9999-9999-9999-999999999902'
\set HELENA   '66666666-9999-9999-9999-999999999903'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'FELIPE', 'felipe-amizade@nexa.test', '{"full_name": "Felipe Amizade"}'),
  (:'GABRIELA', 'gabriela-amizade@nexa.test', '{"full_name": "Gabriela Amizade"}'),
  (:'HELENA', 'helena-amizade@nexa.test', '{"full_name": "Helena Amizade"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (amizade fixture)', 'São Paulo', 'SP', true),
  (:'ESCOLA_Y', 'Escola Y (amizade fixture)', 'São Paulo', 'SP', true);

update public.profiles set school_id = :'ESCOLA_X' where id in (:'FELIPE', :'GABRIELA');
update public.profiles set school_id = :'ESCOLA_Y' where id = :'HELENA';

-- ============================================================================
-- 1 · não dá pra pedir amizade pra si mesmo nem pra outra escola
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
declare
  v_falhou boolean;
begin
  v_falhou := false;
  begin
    perform public.send_friend_request('66666666-9999-9999-9999-999999999901'); -- ele mesmo
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'FELIPE conseguiu se adicionar como amigo';

  v_falhou := false;
  begin
    perform public.send_friend_request('66666666-9999-9999-9999-999999999903'); -- HELENA, outra escola
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'FELIPE conseguiu pedir amizade a alguém de outra escola';
end;
$$;

reset role;

-- ============================================================================
-- 2 · pedido normal, duplicado, e cruzado (auto-aceite)
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
declare
  v_resultado text;
begin
  v_resultado := public.send_friend_request('66666666-9999-9999-9999-999999999902'); -- GABRIELA
  assert v_resultado = 'pending', format('esperado pending, veio %s', v_resultado);

  -- Pedir de novo não deve criar segunda linha nem estourar erro de índice único.
  v_resultado := public.send_friend_request('66666666-9999-9999-9999-999999999902');
  assert v_resultado = 'already_pending', format('esperado already_pending, veio %s', v_resultado);
end;
$$;

reset role;

-- `friendships` não tem policy nenhuma (só as RPCs enxergam) — essa conferência
-- direta na tabela só funciona fora do papel `authenticated`, como superusuário.
do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.friendships
  where least(requester_id, addressee_id) = least('66666666-9999-9999-9999-999999999901'::uuid, '66666666-9999-9999-9999-999999999902'::uuid)
    and greatest(requester_id, addressee_id) = greatest('66666666-9999-9999-9999-999999999901'::uuid, '66666666-9999-9999-9999-999999999902'::uuid);
  assert v_linhas = 1, format('esperada 1 linha de amizade FELIPE/GABRIELA, veio %s', v_linhas);
end;
$$;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999902'; -- GABRIELA
set role authenticated;

do $$
declare
  v_resultado text;
  v_pedidos integer;
begin
  -- GABRIELA responde ao pedido pendente de FELIPE chamando send_friend_request
  -- na direção contrária — deve virar amizade na hora, sem "aceitar" redundante.
  v_resultado := public.send_friend_request('66666666-9999-9999-9999-999999999901');
  assert v_resultado = 'accepted', format('esperado accepted no pedido cruzado, veio %s', v_resultado);

  select count(*) into v_pedidos from public.list_friend_requests();
  assert v_pedidos = 0, 'GABRIELA ainda vê pedido pendente depois do auto-aceite';
end;
$$;

reset role;

-- ============================================================================
-- 3 · list_friends enxerga a amizade dos dois lados
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
declare
  v_amigos integer;
begin
  select count(*) into v_amigos from public.list_friends();
  assert v_amigos = 1, format('FELIPE deveria ter 1 amigo (GABRIELA), tem %s', v_amigos);
end;
$$;

reset role;

-- ============================================================================
-- 4 · recusar libera pedir de novo depois
-- ============================================================================
-- Precisa de um terceiro colega da escola X — FELIPE/GABRIELA já são amigos
-- (não dá pra testar recusa neles) e FELIPE/HELENA é bloqueado (outra escola).
\set IGOR '66666666-9999-9999-9999-999999999904'
insert into auth.users (id, email, raw_user_meta_data)
values (:'IGOR', 'igor-amizade@nexa.test', '{"full_name": "Igor Amizade"}');
update public.profiles set school_id = :'ESCOLA_X' where id = :'IGOR';

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
begin
  perform public.send_friend_request('66666666-9999-9999-9999-999999999904'); -- IGOR
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999904'; -- IGOR
set role authenticated;

do $$
begin
  perform public.respond_friend_request('66666666-9999-9999-9999-999999999901', false); -- recusa
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
declare
  v_resultado text;
begin
  v_resultado := public.send_friend_request('66666666-9999-9999-9999-999999999904');
  assert v_resultado = 'pending',
    format('depois de recusado, pedir de novo deveria reabrir como pending, veio %s', v_resultado);
end;
$$;

reset role;

-- ============================================================================
-- 5 · search_schoolmates: só a própria escola, nunca a própria pessoa, status certo
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
declare
  v_status text;
  v_linhas integer;
begin
  select friendship_status into v_status from public.search_schoolmates('Gabriela');
  assert v_status = 'accepted', format('esperado accepted na busca por GABRIELA, veio %s', v_status);

  select count(*) into v_linhas from public.search_schoolmates('Amizade')
  where user_id = '66666666-9999-9999-9999-999999999901'; -- ele mesmo (FELIPE)
  assert v_linhas = 0, 'busca de colegas devolveu a própria pessoa';

  select count(*) into v_linhas from public.search_schoolmates('Helena'); -- outra escola
  assert v_linhas = 0, 'busca de colegas devolveu aluno de outra escola';
end;
$$;

reset role;

-- ============================================================================
-- 6 · remove_friend desfaz dos dois lados
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999901'; -- FELIPE
set role authenticated;

do $$
begin
  perform public.remove_friend('66666666-9999-9999-9999-999999999902'); -- GABRIELA
end;
$$;

reset role;

do $$
declare
  v_amigos integer;
begin
  select count(*) into v_amigos from public.friendships
  where least(requester_id, addressee_id) = least('66666666-9999-9999-9999-999999999901'::uuid, '66666666-9999-9999-9999-999999999902'::uuid)
    and greatest(requester_id, addressee_id) = greatest('66666666-9999-9999-9999-999999999901'::uuid, '66666666-9999-9999-9999-999999999902'::uuid);
  assert v_amigos = 0, 'remove_friend não apagou a linha de amizade';
end;
$$;

select 'ok' as result;
