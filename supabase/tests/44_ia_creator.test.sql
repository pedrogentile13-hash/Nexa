-- ============================================================================
-- Nexa Community — Fase 5: IA Creator (aluno gera quiz/resumo com IA).
--
-- O que esta suíte existe para impedir:
--   1. Regressão no conteúdo de admin/professor (o ramo `not ai_generated` de
--      `can_view_resource` precisa continuar IDÊNTICO ao de antes).
--   2. Vazamento de gabarito — mesmo o próprio autor do quiz só pode ver a
--      resposta certa através de `quiz_questions`/`answer_quiz_question`,
--      nunca direto da tabela.
--   3. As 5 regras de visibilidade (private/friends/school/community/public)
--      funcionando cada uma isoladamente, sem vazar pra quem não deveria ver.
--   4. `creator_enabled` desligado realmente bloqueia a criação (não só
--      esconde botão no client).
-- ============================================================================

\set CREATOR '11111111-9999-9999-9999-999999999980'
\set FRIEND '11111111-9999-9999-9999-999999999981'
\set SCHOOLMATE '11111111-9999-9999-9999-999999999982'
\set STRANGER '11111111-9999-9999-9999-999999999983'
\set ADMIN_ID '11111111-9999-9999-9999-999999999984'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'CREATOR', 'creator-ia@nexa.test', '{"full_name": "Criador IA"}'),
  (:'FRIEND', 'friend-ia@nexa.test', '{"full_name": "Amigo IA"}'),
  (:'SCHOOLMATE', 'schoolmate-ia@nexa.test', '{"full_name": "Colega IA"}'),
  (:'STRANGER', 'stranger-ia@nexa.test', '{"full_name": "Estranho IA"}'),
  (:'ADMIN_ID', 'admin-ia@nexa.test', '{"full_name": "Admin IA"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('22222222-0000-0000-0000-000000000080', 'Escola IA A', 'São Paulo', 'SP', true),
  ('22222222-0000-0000-0000-000000000081', 'Escola IA B', 'São Paulo', 'SP', true);

update public.profiles set school_id = '22222222-0000-0000-0000-000000000080'
  where id in (:'CREATOR', :'FRIEND', :'SCHOOLMATE');
update public.profiles set school_id = '22222222-0000-0000-0000-000000000081' where id = :'STRANGER';
update public.profiles set role = 'admin' where id = :'ADMIN_ID';

insert into public.friendships (requester_id, addressee_id, status)
values (:'CREATOR', :'FRIEND', 'accepted');

select id from public.subject_catalog where is_active limit 1 \gset subject_

select set_config('nexa.creator', :'CREATOR', false);
select set_config('nexa.friend', :'FRIEND', false);
select set_config('nexa.schoolmate', :'SCHOOLMATE', false);
select set_config('nexa.stranger', :'STRANGER', false);
select set_config('nexa.admin', :'ADMIN_ID', false);
select set_config('nexa.subject', :'subject_id', false);

-- ============================================================================
-- 1 · flag desligada bloqueia a criação de verdade (não só a UI)
-- ============================================================================
update public.feature_flags set enabled = false where key = 'creator_enabled';

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.create_ai_resource('resumo', current_setting('nexa.subject')::uuid, 'Não deveria criar', null, 'corpo', '[]'::jsonb);
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'create_ai_resource funcionou com creator_enabled desligado';
end;
$$;

reset role;
update public.feature_flags set enabled = true where key = 'creator_enabled';

-- ============================================================================
-- 2 · criação de verdade — um quiz (2 questões) e um resumo
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;

select public.create_ai_resource(
  'quiz',
  current_setting('nexa.subject')::uuid,
  'Quiz gerado por IA',
  'descrição do quiz',
  null,
  '[
    {"statement":"2 + 2 = ?","explanation":"soma básica","difficulty":"facil",
     "options":[{"body":"3","is_correct":false},{"body":"4","is_correct":true},{"body":"5","is_correct":false},{"body":"6","is_correct":false}]},
    {"statement":"Capital da França?","explanation":"geografia","difficulty":"facil",
     "options":[{"body":"Paris","is_correct":true},{"body":"Roma","is_correct":false},{"body":"Berlim","is_correct":false},{"body":"Madri","is_correct":false}]}
  ]'::jsonb
) as id \gset quiz_

select public.create_ai_resource(
  'resumo',
  current_setting('nexa.subject')::uuid,
  'Resumo gerado por IA',
  'descrição do resumo',
  '# Título\n\nConteúdo gerado.',
  '[]'::jsonb
) as id \gset resumo_

select set_config('nexa.quiz_id', :'quiz_id', false);
select set_config('nexa.resumo_id', :'resumo_id', false);

do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'o próprio criador deveria ver o quiz';
end;
$$;

reset role;

-- ============================================================================
-- 3 · default é 'private' — ninguém além do dono/admin vê
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;

do $$
begin
  assert not public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'STRANGER via quiz privado';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999984'; -- ADMIN
set role authenticated;

do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'admin deveria ver qualquer conteúdo, mesmo privado';
end;
$$;

reset role;

-- ============================================================================
-- 4 · visibilidade 'friends'
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
select public.update_ai_resource_visibility(current_setting('nexa.quiz_id')::uuid, 'friends');
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999981'; -- FRIEND
set role authenticated;
do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'FRIEND deveria ver quiz visível a amigos';
end;
$$;
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;
do $$
begin
  assert not public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'STRANGER via quiz visível só a amigos';
end;
$$;
reset role;

-- ============================================================================
-- 5 · visibilidade 'school'
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
select public.update_ai_resource_visibility(current_setting('nexa.quiz_id')::uuid, 'school');
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999982'; -- SCHOOLMATE
set role authenticated;
do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'SCHOOLMATE (mesma escola) deveria ver';
end;
$$;
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER (outra escola)
set role authenticated;
do $$
begin
  assert not public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'STRANGER (outra escola) via quiz de escola';
end;
$$;
reset role;

-- ============================================================================
-- 6 · visibilidade 'community' — precisa ser membro
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
select public.create_community('Comunidade IA Creator', 'teste', 'private') as id \gset community_
select set_config('nexa.community_id', :'community_id', false);
select public.update_ai_resource_visibility(
  current_setting('nexa.quiz_id')::uuid, 'community', current_setting('nexa.community_id')::uuid
);
reset role;

-- STRANGER não é membro da comunidade privada nem vê o post
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;
do $$
begin
  assert not public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'STRANGER (não-membro) via quiz de comunidade';
end;
$$;
reset role;

-- Adiciona SCHOOLMATE como membro e confere que passa a ver
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR (dono da comunidade)
set role authenticated;
select public.add_member(current_setting('nexa.community_id')::uuid, current_setting('nexa.schoolmate')::uuid);
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999982'; -- SCHOOLMATE
set role authenticated;
do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'SCHOOLMATE (membro) deveria ver quiz de comunidade';
end;
$$;
reset role;

-- ============================================================================
-- 7 · visibilidade 'public' — qualquer um vê
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
select public.update_ai_resource_visibility(current_setting('nexa.quiz_id')::uuid, 'public');
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;
do $$
begin
  assert public.can_view_resource(current_setting('nexa.quiz_id')::uuid), 'STRANGER via quiz público';
end;
$$;
reset role;

-- ============================================================================
-- 8 · só o dono (ou admin) muda a visibilidade
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;
do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.update_ai_resource_visibility(current_setting('nexa.quiz_id')::uuid, 'private');
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'STRANGER conseguiu mudar a visibilidade de um quiz que não é dele';
end;
$$;
reset role;

-- ============================================================================
-- 9 · quiz-taking de ponta a ponta — mesmo pipeline de quiz de admin, sem
-- vazar gabarito nem pro próprio autor (quiz_questions nunca devolve
-- is_correct; a resposta certa só é lida direto da tabela aqui no setup, como
-- superusuário, pra montar a asserção — não é o fluxo do aluno).
-- ============================================================================
select id from public.question_options
  where question_id = (select id from public.questions where resource_id = current_setting('nexa.quiz_id')::uuid order by position limit 1)
  and is_correct = true
  \gset q1_

select id from public.question_options
  where question_id = (select id from public.questions where resource_id = current_setting('nexa.quiz_id')::uuid order by position offset 1 limit 1)
  and is_correct = true
  \gset q2_

select set_config('nexa.q1_correct', :'q1_id', false);
select set_config('nexa.q2_correct', :'q2_id', false);

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;

select public.start_quiz_attempt(current_setting('nexa.quiz_id')::uuid) as id \gset attempt_
select set_config('nexa.attempt_id', :'attempt_id', false);

do $$
declare
  v_q1 uuid;
  v_q2 uuid;
  v_result record;
begin
  select question_id into v_q1 from public.quiz_questions(current_setting('nexa.quiz_id')::uuid) order by question_position limit 1;
  select question_id into v_q2 from public.quiz_questions(current_setting('nexa.quiz_id')::uuid) order by question_position offset 1 limit 1;

  perform public.answer_quiz_question(current_setting('nexa.attempt_id')::uuid, v_q1, current_setting('nexa.q1_correct')::uuid);
  perform public.answer_quiz_question(current_setting('nexa.attempt_id')::uuid, v_q2, current_setting('nexa.q2_correct')::uuid);

  select * into v_result from public.finish_quiz_attempt(current_setting('nexa.attempt_id')::uuid);
  assert v_result.correct_count = 2, format('esperava 2 acertos, veio %s', v_result.correct_count);
  assert v_result.total_count = 2, format('esperava 2 questões, veio %s', v_result.total_count);
end;
$$;

reset role;

-- ============================================================================
-- 10 · list_my_ai_resources só lista o que é seu
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.list_my_ai_resources();
  assert v_count = 2, format('CREATOR deveria ver 2 conteúdos próprios (quiz+resumo), veio %s', v_count);
end;
$$;
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999982'; -- SCHOOLMATE
set role authenticated;
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.list_my_ai_resources();
  assert v_count = 0, format('SCHOOLMATE não deveria ter conteúdo próprio nenhum, veio %s', v_count);
end;
$$;
reset role;

-- ============================================================================
-- 11 · delete: só dono (ou admin) apaga; cascade remove questions/options
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER
set role authenticated;
do $$
begin
  perform public.delete_ai_resource(current_setting('nexa.resumo_id')::uuid);
exception when others then
  null; -- esperado
end;
$$;
reset role;

do $$
declare
  v_still_exists boolean;
begin
  select exists(select 1 from public.resources where id = current_setting('nexa.resumo_id')::uuid) into v_still_exists;
  assert v_still_exists, 'STRANGER conseguiu apagar resumo que não é dele';
end;
$$;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999980'; -- CREATOR
set role authenticated;
select public.delete_ai_resource(current_setting('nexa.resumo_id')::uuid);
reset role;

do $$
declare
  v_still_exists boolean;
  v_question_count integer;
begin
  select exists(select 1 from public.resources where id = current_setting('nexa.resumo_id')::uuid) into v_still_exists;
  assert not v_still_exists, 'dono não conseguiu apagar o próprio resumo';

  select count(*) into v_question_count from public.questions where resource_id = current_setting('nexa.quiz_id')::uuid;
  assert v_question_count = 2, 'apagar o resumo não deveria ter afetado as questões do quiz';
end;
$$;

-- ============================================================================
-- 12 · regressão: conteúdo de admin/professor continua com as regras antigas
-- (not ai_generated) — publicado + mesma escola (ou global) ainda é o único
-- critério, exatamente como antes desta migração.
-- ============================================================================
insert into public.resources (school_id, subject_catalog_id, kind, title, body, is_published, created_by)
values ('22222222-0000-0000-0000-000000000080', current_setting('nexa.subject')::uuid, 'resumo', 'Resumo do admin', 'corpo', true, current_setting('nexa.admin')::uuid)
returning id as id \gset admin_resource_

select set_config('nexa.admin_resource_id', :'admin_resource_id', false);

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999982'; -- SCHOOLMATE (mesma escola)
set role authenticated;
do $$
begin
  assert public.can_view_resource(current_setting('nexa.admin_resource_id')::uuid), 'SCHOOLMATE deveria ver recurso publicado de admin da mesma escola (regressão)';
end;
$$;
reset role;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999983'; -- STRANGER (outra escola)
set role authenticated;
do $$
begin
  assert not public.can_view_resource(current_setting('nexa.admin_resource_id')::uuid), 'STRANGER (outra escola) via recurso de admin de outra escola (regressão)';
end;
$$;
reset role;

select 'ok' as result;
