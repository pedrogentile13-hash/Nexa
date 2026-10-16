-- ============================================================================
-- Nexa Community — Fase 2: feed (posts, comentários, curtidas, salvos).
--
-- O que esta suíte existe para impedir:
--   1. Post 'private' vazar pra qualquer um além do dono.
--   2. Post 'school' vazar pra aluno de outra escola.
--   3. Post 'friends' vazar pra quem não é amigo aceito.
--   4. Editar/apagar post ou comentário de outra pessoa (exceto moderação).
--   5. Curtir/salvar/comentar um post que não se pode ver.
--   6. list_feed devolver contagens/flags erradas.
-- ============================================================================

\set ESCOLA_X '44444444-0000-0000-0000-000000000005'
\set ESCOLA_Y '44444444-0000-0000-0000-000000000006'
\set NINA     '66666666-9999-9999-9999-999999999920'
\set OTAVIO   '66666666-9999-9999-9999-999999999921'
\set PAULA    '66666666-9999-9999-9999-999999999922'
\set QUEZIA   '66666666-9999-9999-9999-999999999923'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'NINA', 'nina-feed@nexa.test', '{"full_name": "Nina Feed"}'),
  (:'OTAVIO', 'otavio-feed@nexa.test', '{"full_name": "Otavio Feed"}'),
  (:'PAULA', 'paula-feed@nexa.test', '{"full_name": "Paula Feed"}'),
  (:'QUEZIA', 'quezia-feed@nexa.test', '{"full_name": "Quezia Feed"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (feed fixture)', 'São Paulo', 'SP', true),
  (:'ESCOLA_Y', 'Escola Y (feed fixture)', 'São Paulo', 'SP', true);

update public.profiles set school_id = :'ESCOLA_X' where id in (:'NINA', :'OTAVIO', :'PAULA');
update public.profiles set school_id = :'ESCOLA_Y' where id = :'QUEZIA';

-- NINA e OTAVIO ficam amigos (aceitos) — usado no teste de visibility='friends'.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999920'; -- NINA
set role authenticated;
select public.send_friend_request('66666666-9999-9999-9999-999999999921'); -- OTAVIO
reset role;
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999921'; -- OTAVIO
set role authenticated;
select public.respond_friend_request('66666666-9999-9999-9999-999999999920', true);
reset role;

-- ============================================================================
-- 1 · create_post + visibilidade em list_feed
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999920'; -- NINA
set role authenticated;

do $$
declare
  v_id uuid;
begin
  v_id := public.create_post('post privado da Nina', 'private');
  perform set_config('nexa.post_private', v_id::text, false);

  v_id := public.create_post('post pra escola da Nina', 'school');
  perform set_config('nexa.post_school', v_id::text, false);

  v_id := public.create_post('post pra amigos da Nina', 'friends');
  perform set_config('nexa.post_friends', v_id::text, false);

  v_id := public.create_post('post publico da Nina', 'public');
  perform set_config('nexa.post_public', v_id::text, false);
end;
$$;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_feed(50, null);
  assert v_total = 4, format('NINA (autora) deveria ver os 4 próprios posts, viu %s', v_total);
end;
$$;

reset role;

-- PAULA: mesma escola de NINA, não é amiga — vê school+public, não private/friends.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999922'; -- PAULA
set role authenticated;

do $$
declare
  v_total integer;
  v_private integer;
  v_friends integer;
begin
  select count(*) into v_total from public.list_feed(50, null);
  assert v_total = 2, format('PAULA deveria ver 2 posts (school+public) de NINA, viu %s', v_total);

  select count(*) into v_private from public.list_feed(50, null)
  where id = current_setting('nexa.post_private')::uuid;
  assert v_private = 0, 'PAULA enxergou post private de NINA';

  select count(*) into v_friends from public.list_feed(50, null)
  where id = current_setting('nexa.post_friends')::uuid;
  assert v_friends = 0, 'PAULA (não amiga) enxergou post friends de NINA';
end;
$$;

reset role;

-- OTAVIO: amigo de NINA e mesma escola — vê school+friends+public (3), não private.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999921'; -- OTAVIO
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_feed(50, null);
  assert v_total = 3, format('OTAVIO (amigo, mesma escola) deveria ver 3 posts de NINA, viu %s', v_total);
end;
$$;

reset role;

-- QUEZIA: outra escola, não amiga — só vê o público.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999923'; -- QUEZIA
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_feed(50, null);
  assert v_total = 1, format('QUEZIA (outra escola) deveria ver só o post público de NINA, viu %s', v_total);
end;
$$;

reset role;

-- ============================================================================
-- 2 · editar/apagar: só o autor (exceto moderação, testada depois)
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999922'; -- PAULA
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.update_post(current_setting('nexa.post_school')::uuid, 'hackeado', 'public');
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'PAULA conseguiu editar post de NINA';
end;
$$;

reset role;

-- ============================================================================
-- 3 · curtir, salvar, comentar — só quem pode ver o post
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999923'; -- QUEZIA (outra escola)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.like_post(current_setting('nexa.post_school')::uuid); -- post que ela não vê
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'QUEZIA curtiu um post que não deveria ver';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999922'; -- PAULA (mesma escola, vê)
set role authenticated;

do $$
declare
  v_comment_id uuid;
begin
  perform public.like_post(current_setting('nexa.post_school')::uuid);
  perform public.save_post(current_setting('nexa.post_school')::uuid);
  v_comment_id := public.create_comment(current_setting('nexa.post_school')::uuid, 'ótimo post');
  perform set_config('nexa.comment_id', v_comment_id::text, false);
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999920'; -- NINA (dona do post)
set role authenticated;

do $$
declare
  v_row record;
  v_comentarios integer;
begin
  select * into v_row from public.list_feed(50, null) where id = current_setting('nexa.post_school')::uuid;
  assert v_row.like_count = 1, format('esperado 1 curtida no post school, veio %s', v_row.like_count);
  assert v_row.comment_count = 1, format('esperado 1 comentário no post school, veio %s', v_row.comment_count);
  assert v_row.viewer_has_liked = false, 'NINA não curtiu o próprio post, mas viewer_has_liked veio true';

  select count(*) into v_comentarios from public.list_post_comments(current_setting('nexa.post_school')::uuid);
  assert v_comentarios = 1, format('esperado 1 comentário listado, veio %s', v_comentarios);
end;
$$;

reset role;

-- ============================================================================
-- 4 · list_saved_posts só devolve o que a própria pessoa salvou
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999922'; -- PAULA
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_saved_posts(50, null);
  assert v_total = 1, format('PAULA deveria ter 1 post salvo, tem %s', v_total);
end;
$$;

reset role;

set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999920'; -- NINA (não salvou nada)
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_saved_posts(50, null);
  assert v_total = 0, format('NINA não salvou nada, mas list_saved_posts devolveu %s', v_total);
end;
$$;

reset role;

-- ============================================================================
-- 5 · apagar comentário/post: dono do comentário, dono do post, ou moderação
-- ============================================================================
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999921'; -- OTAVIO (nem dono do post, nem do comentário)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.delete_comment(current_setting('nexa.comment_id')::uuid);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'OTAVIO apagou comentário de PAULA sem ser dono do post nem do comentário';
end;
$$;

reset role;

-- NINA é dona do POST (não do comentário) — ainda assim pode moderar.
set "request.jwt.claim.sub" = '66666666-9999-9999-9999-999999999920'; -- NINA
set role authenticated;

do $$
begin
  perform public.delete_comment(current_setting('nexa.comment_id')::uuid);
end;
$$;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.comments where id = current_setting('nexa.comment_id')::uuid;
  assert v_total = 0, 'NINA (dona do post) não conseguiu apagar comentário de outra pessoa no próprio post';
end;
$$;

reset role;

select 'ok' as result;
