-- ============================================================================
-- Nexa Community — Fase 0: feature_flags, social_profiles, follows.
--
-- O que esta suíte existe para impedir:
--   1. Um usuário comum ligar/desligar feature flag (só is_admin()).
--   2. Perfil social 'private' vazar pra qualquer um além do dono/admin.
--   3. Perfil social 'school' vazar pra aluno de outra escola.
--   4. Perfil social 'friends' vazar pra quem não é amigo aceito.
--   5. Seguir a si mesmo, ou follow_user duplicado criar 2ª linha.
-- ============================================================================

\set ESCOLA_X '44444444-0000-0000-0000-000000000003'
\set ESCOLA_Y '44444444-0000-0000-0000-000000000004'
\set ADMIN    '66666666-9999-9999-9999-999999999910'
\set JULIA    '66666666-9999-9999-9999-999999999911'
\set KAUAN    '66666666-9999-9999-9999-999999999912'
\set LUCAS    '66666666-9999-9999-9999-999999999913'
\set MARIA    '66666666-9999-9999-9999-999999999914'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-fase0@nexa.test', '{"full_name": "Admin Fase0"}'),
  (:'JULIA', 'julia-fase0@nexa.test', '{"full_name": "Julia Fase0"}'),
  (:'KAUAN', 'kauan-fase0@nexa.test', '{"full_name": "Kauan Fase0"}'),
  (:'LUCAS', 'lucas-fase0@nexa.test', '{"full_name": "Lucas Fase0"}'),
  (:'MARIA', 'maria-fase0@nexa.test', '{"full_name": "Maria Fase0"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (fase0 fixture)', 'São Paulo', 'SP', true),
  (:'ESCOLA_Y', 'Escola Y (fase0 fixture)', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = :'ESCOLA_X' where id in (:'JULIA', :'KAUAN', :'LUCAS');
update public.profiles set school_id = :'ESCOLA_Y' where id = :'MARIA';

-- JULIA e KAUAN ficam amigos (aceitos) — usado no teste de visibility='friends'.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999911'; -- JULIA
set role authenticated;
select public.send_friend_request('66666666-9999-9999-9999-999999999912'); -- KAUAN
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999912'; -- KAUAN
set role authenticated;
select public.respond_friend_request('66666666-9999-9999-9999-999999999911', true);
reset role;

-- ============================================================================
-- 1 · feature_flags: leitura geral, escrita só admin
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS (student)
set role authenticated;

do $$
declare
  v_total integer;
  v_afetadas integer;
begin
  select count(*) into v_total from public.feature_flags;
  assert v_total = 8, format('esperava 8 feature flags legíveis por qualquer autenticado, veio %s', v_total);

  -- RLS não estoura erro num update que não bate na policy: só afeta 0 linhas.
  update public.feature_flags set enabled = true where key = 'posts_enabled';
  get diagnostics v_afetadas = row_count;
  assert v_afetadas = 0, 'LUCAS (student) conseguiu alterar feature_flags';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999910'; -- ADMIN
set role authenticated;

do $$
declare
  v_enabled boolean;
begin
  update public.feature_flags set enabled = true where key = 'posts_enabled';
  select enabled into v_enabled from public.feature_flags where key = 'posts_enabled';
  assert v_enabled = true, 'admin não conseguiu ligar feature flag';
  -- devolve ao estado padrão pra não vazar estado entre testes
  update public.feature_flags set enabled = false where key = 'posts_enabled';
end;
$$;

reset role;

-- ============================================================================
-- 2 · social_profiles: dono sempre edita o próprio; visibilidade respeitada
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999911'; -- JULIA
set role authenticated;

do $$
begin
  insert into public.social_profiles (id, username, bio, visibility)
  values (auth.uid(), 'julia_fase0', 'Perfil de teste da Julia', 'private');
end;
$$;

reset role;

-- LUCAS (mesma escola de JULIA, mas não é amigo) não deve ver o perfil 'private' dela.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS
set role authenticated;

do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 0, 'LUCAS enxergou perfil social private de JULIA';
end;
$$;

reset role;

-- ADMIN sempre enxerga, mesmo 'private' (moderação).
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999910'; -- ADMIN
set role authenticated;

do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 1, 'admin não enxergou perfil social private (deveria, é moderação)';
end;
$$;

reset role;

-- JULIA muda pra visibility='school' — LUCAS (mesma escola) passa a ver, MARIA (outra escola) não.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999911'; -- JULIA
set role authenticated;
update public.social_profiles set visibility = 'school' where id = auth.uid();
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS (mesma escola)
set role authenticated;
do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 1, 'LUCAS (mesma escola) não enxergou perfil social visibility=school de JULIA';
end;
$$;
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999914'; -- MARIA (outra escola)
set role authenticated;
do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 0, 'MARIA (outra escola) enxergou perfil social visibility=school de JULIA';
end;
$$;
reset role;

-- JULIA muda pra visibility='friends' — KAUAN (amigo aceito) vê, LUCAS (mesma escola, não amigo) não vê mais.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999911'; -- JULIA
set role authenticated;
update public.social_profiles set visibility = 'friends' where id = auth.uid();
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999912'; -- KAUAN (amigo)
set role authenticated;
do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 1, 'KAUAN (amigo aceito) não enxergou perfil social visibility=friends de JULIA';
end;
$$;
reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS (mesma escola, não amigo)
set role authenticated;
do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.social_profiles where id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 0, 'LUCAS (não amigo) enxergou perfil social visibility=friends de JULIA';
end;
$$;
reset role;

-- LUCAS não pode editar o perfil social de JULIA.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS
set role authenticated;
do $$
declare
  v_afetadas integer;
begin
  update public.social_profiles set bio = 'hackeado' where id = '66666666-9999-9999-9999-999999999911';
  get diagnostics v_afetadas = row_count;
  assert v_afetadas = 0, 'LUCAS conseguiu editar perfil social de outra pessoa';
end;
$$;
reset role;

-- ============================================================================
-- 3 · follows: RPCs, autoexclusão, idempotência
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999913'; -- LUCAS
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.follow_user('66666666-9999-9999-9999-999999999913'); -- ele mesmo
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'LUCAS conseguiu seguir a si mesmo';

  perform public.follow_user('66666666-9999-9999-9999-999999999911'); -- JULIA
  perform public.follow_user('66666666-9999-9999-9999-999999999911'); -- de novo, idempotente
end;
$$;

do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.follows
  where follower_id = '66666666-9999-9999-9999-999999999913'
    and following_id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 1, format('esperada 1 linha de follow LUCAS->JULIA, veio %s', v_linhas);
end;
$$;

do $$
begin
  perform public.unfollow_user('66666666-9999-9999-9999-999999999911');
end;
$$;

do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.follows
  where follower_id = '66666666-9999-9999-9999-999999999913'
    and following_id = '66666666-9999-9999-9999-999999999911';
  assert v_linhas = 0, 'unfollow_user não removeu a linha';
end;
$$;

reset role;

select 'ok' as result;
