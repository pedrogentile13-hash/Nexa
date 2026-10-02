-- ============================================================================
-- Nexa Community — Fase 4: chat em grupo (mensagens dentro de uma comunidade).
--
-- O que esta suíte existe para impedir:
--   1. Não-membro mandar ou ler mensagem, mesmo em comunidade 'public'.
--   2. Editar mensagem de outra pessoa.
--   3. Apagar mensagem sem ser autor/moderador/dono/admin.
--   4. list_messages devolver fora de ordem ou vazando de outro grupo.
-- ============================================================================

\set ESCOLA_X '44444444-0000-0000-0000-000000000009'
\set VITOR    '66666666-9999-9999-9999-999999999940'
\set WANDA    '66666666-9999-9999-9999-999999999941'
\set XICO     '66666666-9999-9999-9999-999999999942'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'VITOR', 'vitor-chat@nexa.test', '{"full_name": "Vitor Chat"}'),
  (:'WANDA', 'wanda-chat@nexa.test', '{"full_name": "Wanda Chat"}'),
  (:'XICO', 'xico-chat@nexa.test', '{"full_name": "Xico Chat"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (chat fixture)', 'São Paulo', 'SP', true);

update public.profiles set school_id = :'ESCOLA_X' where id in (:'VITOR', :'WANDA', :'XICO');

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999940'; -- VITOR
set role authenticated;

do $$
declare
  v_id uuid;
begin
  -- 'public': qualquer um da escola VÊ a comunidade, mas só membro conversa.
  v_id := public.create_community('Grupo de Estudo', 'Física e afins', 'public');
  perform set_config('nexa.grupo', v_id::text, false);
end;
$$;

reset role;

-- ============================================================================
-- 1 · não-membro não manda nem lê mensagem, mesmo em comunidade pública
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999942'; -- XICO (não é membro)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.send_message(current_setting('nexa.grupo')::uuid, 'entrando de penetra');
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'XICO (não-membro) conseguiu mandar mensagem no grupo';

  begin
    perform public.list_messages(current_setting('nexa.grupo')::uuid, 50, null);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'XICO (não-membro) conseguiu ler o chat do grupo';
end;
$$;

reset role;

-- ============================================================================
-- 2 · membro manda mensagem; ordem cronológica
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999941'; -- WANDA
set role authenticated;
select public.join_community(current_setting('nexa.grupo')::uuid);
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999940'; -- VITOR (dono)
set role authenticated;

-- Duas instruções separadas (não um só `do $$`): `now()` é constante dentro
-- de uma transação — as duas mensagens ficariam com o MESMO `created_at` se
-- inseridas juntas, e o teste de ordem cronológica logo abaixo dependeria
-- de sorte.
do $$
declare
  v_id1 uuid;
begin
  v_id1 := public.send_message(current_setting('nexa.grupo')::uuid, 'primeira mensagem');
  perform set_config('nexa.msg1', v_id1::text, false);
end;
$$;

do $$
declare
  v_id2 uuid;
begin
  v_id2 := public.send_message(current_setting('nexa.grupo')::uuid, 'segunda mensagem');
  perform set_config('nexa.msg2', v_id2::text, false);
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999941'; -- WANDA (agora membro)
set role authenticated;

do $$
declare
  v_total integer;
  v_primeira_content text;
begin
  select count(*) into v_total from public.list_messages(current_setting('nexa.grupo')::uuid, 50, null);
  assert v_total = 2, format('esperadas 2 mensagens, veio %s', v_total);

  -- list_messages devolve mais recente primeiro (mesmo padrão de list_feed).
  select content into v_primeira_content from public.list_messages(current_setting('nexa.grupo')::uuid, 50, null) order by created_at asc limit 1;
  assert v_primeira_content = 'primeira mensagem', format('ordem cronológica errada, veio "%s"', v_primeira_content);
end;
$$;

reset role;

-- ============================================================================
-- 3 · editar: só o próprio autor
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999941'; -- WANDA (não é autora do msg1)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.edit_message(current_setting('nexa.msg1')::uuid, 'editado por outra pessoa');
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'WANDA editou mensagem que não é dela';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999940'; -- VITOR (autor do msg1)
set role authenticated;

do $$
begin
  perform public.edit_message(current_setting('nexa.msg1')::uuid, 'primeira mensagem (editada)');
end;
$$;

reset role;

-- Mensagens não têm policy — conferência direta só como superusuário
-- (mesmo padrão de `27_friendships.test.sql`/`36_communities.test.sql`).
do $$
declare
  v_content text;
  v_edited timestamptz;
begin
  select content, edited_at into v_content, v_edited from public.messages where id = current_setting('nexa.msg1')::uuid;
  assert v_content = 'primeira mensagem (editada)', 'edit_message não alterou o conteúdo';
  assert v_edited is not null, 'edit_message não marcou edited_at';
end;
$$;

-- ============================================================================
-- 4 · apagar: autor apaga a própria; moderador apaga de outro membro
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999941'; -- WANDA (nem autora, nem moderadora)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.delete_message(current_setting('nexa.msg2')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'WANDA apagou mensagem que não é dela e não modera o grupo';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999940'; -- VITOR (dono do grupo — modera, além de ser autor do msg2)
set role authenticated;

do $$
begin
  perform public.delete_message(current_setting('nexa.msg2')::uuid);
end;
$$;

reset role;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.messages where id = current_setting('nexa.msg2')::uuid;
  assert v_total = 0, 'delete_message não apagou a mensagem';
end;
$$;

select 'ok' as result;
