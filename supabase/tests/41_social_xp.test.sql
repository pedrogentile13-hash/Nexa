-- ============================================================================
-- Nexa Community — Fase 13: XP social.
--
-- O que esta suíte existe para impedir:
--   1. Publicar/comentar/entrar numa comunidade não pagar XP com a flag ligada.
--   2. Sair e reentrar na MESMA comunidade pagar XP de novo (farm de XP).
-- ============================================================================

\set ALUNO '11111111-9999-9999-9999-999999999970'

insert into auth.users (id, email, raw_user_meta_data)
values (:'ALUNO', 'aluno-socialxp@nexa.test', '{"full_name": "Aluno SocialXP"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('22222222-0000-0000-0000-000000000070', 'Escola SocialXP', 'São Paulo', 'SP', true);

update public.profiles set school_id = '22222222-0000-0000-0000-000000000070' where id = :'ALUNO';

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999970'; -- ALUNO
set role authenticated;

select public.create_community('Comunidade XP', 'teste', 'public') as id \gset community_
-- `:'var'` do psql não é substituído dentro de um bloco `do $$ ... $$`
-- (dollar-quoted, psql não mexe) — mesma pegadinha já resolvida nesta sessão
-- com `set_config`/`current_setting` (ver `38_quiz_answer_lock`).
select set_config('nexa.community_id', :'community_id', false);

do $$
declare
  v_xp_antes integer;
  v_xp_depois integer;
  v_post_id uuid;
begin
  -- `create_community` (fora deste bloco, antes) já rodou e o dono já entra
  -- automaticamente — confere o valor absoluto (aluno começa em 0 XP) em vez
  -- de comparar antes/depois, já que o "antes" de verdade já passou.
  select coalesce(xp, 0) into v_xp_depois from public.user_stats where user_id = '11111111-9999-9999-9999-999999999970';
  assert v_xp_depois = 15,
    format('criar comunidade (que já entra como dono) deveria pagar 15 XP, xp está em %s', v_xp_depois);

  v_xp_antes := v_xp_depois;
  v_post_id := public.create_post('Meu primeiro post', 'public');
  select coalesce(xp, 0) into v_xp_depois from public.user_stats where user_id = '11111111-9999-9999-9999-999999999970';
  assert v_xp_depois = v_xp_antes + 10,
    format('publicar deveria pagar 10 XP, xp foi de %s pra %s', v_xp_antes, v_xp_depois);

  v_xp_antes := v_xp_depois;
  perform public.create_comment(v_post_id, 'Comentário no meu próprio post');
  select coalesce(xp, 0) into v_xp_depois from public.user_stats where user_id = '11111111-9999-9999-9999-999999999970';
  assert v_xp_depois = v_xp_antes + 5,
    format('comentar deveria pagar 5 XP, xp foi de %s pra %s', v_xp_antes, v_xp_depois);
end;
$$;

-- Chamar join_community de novo pra uma comunidade onde já é membro (dono,
-- neste caso — `on conflict do nothing` já cobre o insert) não paga XP de
-- novo — o dedup é por `source_id` (o id da comunidade), não por "entrou de
-- fato agora".
do $$
declare
  v_xp_antes integer;
  v_xp_depois integer;
begin
  select coalesce(xp, 0) into v_xp_antes from public.user_stats where user_id = '11111111-9999-9999-9999-999999999970';
  perform public.join_community(current_setting('nexa.community_id')::uuid);
  select coalesce(xp, 0) into v_xp_depois from public.user_stats where user_id = '11111111-9999-9999-9999-999999999970';
  assert v_xp_depois = v_xp_antes,
    format('chamar join_community de novo não deveria pagar XP de novo, xp foi de %s pra %s', v_xp_antes, v_xp_depois);
end;
$$;

reset role;

select 'ok' as result;
