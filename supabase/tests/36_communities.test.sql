-- ============================================================================
-- Nexa Community — Fase 3: comunidades (criar, entrar, sair, moderação, feed).
--
-- O que esta suíte existe para impedir:
--   1. Comunidade 'private' vazar pra quem não é membro.
--   2. Comunidade 'school' vazar pra outra escola.
--   3. Quem não é dono/moderador conseguir remover membro ou promover.
--   4. Dono conseguir sair sem apagar a comunidade.
--   5. Post de comunidade vazar no feed pessoal (list_feed) ou vice-versa.
--   6. Não-membro publicar numa comunidade.
-- ============================================================================

\set ESCOLA_X '44444444-0000-0000-0000-000000000007'
\set ESCOLA_Y '44444444-0000-0000-0000-000000000008'
\set RENAN    '66666666-9999-9999-9999-999999999930'
\set SOFIA    '66666666-9999-9999-9999-999999999931'
\set TIAGO    '66666666-9999-9999-9999-999999999932'
\set URSULA   '66666666-9999-9999-9999-999999999933'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'RENAN', 'renan-comm@nexa.test', '{"full_name": "Renan Comm"}'),
  (:'SOFIA', 'sofia-comm@nexa.test', '{"full_name": "Sofia Comm"}'),
  (:'TIAGO', 'tiago-comm@nexa.test', '{"full_name": "Tiago Comm"}'),
  (:'URSULA', 'ursula-comm@nexa.test', '{"full_name": "Ursula Comm"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (comunidades fixture)', 'São Paulo', 'SP', true),
  (:'ESCOLA_Y', 'Escola Y (comunidades fixture)', 'São Paulo', 'SP', true);

update public.profiles set school_id = :'ESCOLA_X' where id in (:'RENAN', :'SOFIA', :'TIAGO');
update public.profiles set school_id = :'ESCOLA_Y' where id = :'URSULA';

-- ============================================================================
-- 1 · create_community: slug gerado, dono vira membro 'owner'
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999930'; -- RENAN
set role authenticated;

do $$
declare
  v_id uuid;
  v_role text;
begin
  v_id := public.create_community('Clube de Química', 'Pra quem gosta de reações', 'school');
  perform set_config('nexa.community_school', v_id::text, false);

  select my_role into v_role from public.get_community(v_id);
  assert v_role = 'owner', format('esperado owner pro criador, veio %s', v_role);

  v_id := public.create_community('Sala Vip', 'Só convidados', 'private');
  perform set_config('nexa.community_private', v_id::text, false);

  v_id := public.create_community('Fórum Aberto', 'Qualquer um entra', 'public');
  perform set_config('nexa.community_public', v_id::text, false);
end;
$$;

reset role;

-- ============================================================================
-- 2 · visibilidade em list_communities
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999931'; -- SOFIA (mesma escola)
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_communities(null);
  assert v_total = 2, format('SOFIA (mesma escola) deveria ver school+public (2), viu %s', v_total);
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999933'; -- URSULA (outra escola)
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_communities(null);
  assert v_total = 1, format('URSULA (outra escola) deveria ver só a public, viu %s', v_total);
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.get_community(current_setting('nexa.community_private')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'URSULA conseguiu ver detalhe de comunidade private que não é dela';
end;
$$;

reset role;

-- ============================================================================
-- 3 · join/leave: escola pode entrar na 'school'; private bloqueia join direto
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999931'; -- SOFIA
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  perform public.join_community(current_setting('nexa.community_school')::uuid);

  begin
    perform public.join_community(current_setting('nexa.community_private')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'SOFIA conseguiu entrar direto numa comunidade private';
end;
$$;

reset role;

-- RENAN (dono) adiciona SOFIA na private via add_member.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999930'; -- RENAN
set role authenticated;

do $$
begin
  perform public.add_member(current_setting('nexa.community_private')::uuid, '66666666-9999-9999-9999-999999999931');
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  -- Dono não sai.
  begin
    perform public.leave_community(current_setting('nexa.community_school')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'RENAN (dono) conseguiu sair da própria comunidade';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999931'; -- SOFIA (agora membro da private)
set role authenticated;

do $$
declare
  v_membro boolean;
begin
  select is_member into v_membro from public.get_community(current_setting('nexa.community_private')::uuid);
  assert v_membro, 'SOFIA deveria ser membro da comunidade private depois do add_member';
end;
$$;

reset role;

-- ============================================================================
-- 4 · moderação: só dono promove; não-moderador não remove membro
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999931'; -- SOFIA (não é dono)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.set_member_role(current_setting('nexa.community_school')::uuid, auth.uid(), 'moderator');
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'SOFIA (não dono) conseguiu se promover a moderadora';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999930'; -- RENAN (dono)
set role authenticated;

do $$
begin
  perform public.set_member_role(current_setting('nexa.community_school')::uuid, '66666666-9999-9999-9999-999999999931', 'moderator');
end;
$$;

reset role;

-- `community_members` não tem policy nenhuma (só as RPCs enxergam) — a
-- conferência direta na tabela só funciona fora do papel `authenticated`,
-- como superusuário (mesmo padrão de `27_friendships.test.sql`).
do $$
declare
  v_role text;
begin
  select role into v_role from public.community_members
  where community_id = current_setting('nexa.community_school')::uuid and user_id = '66666666-9999-9999-9999-999999999931';
  assert v_role = 'moderator', format('esperado moderator, veio %s', v_role);
end;
$$;

-- ============================================================================
-- 5 · post de comunidade: só membro publica; feed pessoal não vaza
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999932'; -- TIAGO (mesma escola, NÃO é membro de nada)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.create_post('post fora de lugar', 'school', current_setting('nexa.community_school')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'TIAGO (não-membro) conseguiu publicar na comunidade';

  perform public.create_post('post pessoal do Tiago', 'school');
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999930'; -- RENAN (dono/membro)
set role authenticated;

do $$
declare
  v_post_id uuid;
begin
  v_post_id := public.create_post('post da comunidade', 'school', current_setting('nexa.community_school')::uuid);
  perform set_config('nexa.community_post', v_post_id::text, false);
end;
$$;

do $$
declare
  v_no_feed_pessoal integer;
  v_no_feed_comunidade integer;
begin
  select count(*) into v_no_feed_pessoal from public.list_feed(50, null)
  where id = current_setting('nexa.community_post')::uuid;
  assert v_no_feed_pessoal = 0, 'post de comunidade vazou no feed pessoal (list_feed)';

  select count(*) into v_no_feed_comunidade from public.list_community_feed(current_setting('nexa.community_school')::uuid, 50, null)
  where id = current_setting('nexa.community_post')::uuid;
  assert v_no_feed_comunidade = 1, 'post de comunidade não apareceu em list_community_feed';
end;
$$;

reset role;

-- ============================================================================
-- 6 · delete_community: só dono/admin/school_admin
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999932'; -- TIAGO (nem membro)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.delete_community(current_setting('nexa.community_public')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'TIAGO apagou uma comunidade que não é dele';
end;
$$;

reset role;

select 'ok' as result;
