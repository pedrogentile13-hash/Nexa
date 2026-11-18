-- ============================================================================
-- Nexa Community — Fase 13 · XP social
--
-- `social_xp_enabled` (Fase 0) nasceu desligado — esta migração liga a
-- primeira leva de eventos que pagam XP, todos por AÇÃO PRÓPRIA de quem
-- ganha (publicar, comentar, entrar numa comunidade), nunca por reação de
-- terceiro (curtida recebida) — reduz de propósito o risco de dois amigos
-- combinarem de ficar curtindo um ao outro pra farmar XP. Sem tabela nova:
-- reaproveita 100% o motor já existente (`award_xp`/`xp_events`), que já
-- alimenta ranking e conquistas — uma ação social vira XP no MESMO lugar que
-- terminar um simulado, sem um "ranking social" separado pra manter em
-- sincronia.
--
-- Dedup: `xp_events_source_uq (user_id, source_type, source_id, reason)` já
-- existe (migração 20260730000600) — usar o id do post/comentário/comunidade
-- como `source_id` garante que RE-ENTRAR na mesma comunidade ou o cliente
-- reenviar a mesma ação nunca paga duas vezes.
-- ============================================================================

alter table public.xp_events drop constraint if exists xp_events_source_type_check;
alter table public.xp_events add constraint xp_events_source_type_check
  check (source_type in (
    'task', 'routine', 'study_session', 'activity', 'achievement', 'system', 'quiz', 'lesson', 'resource', 'social'
  ));

-- Espelha `src/lib/feature-flags.ts` em SQL — evita cada função nova repetir
-- o mesmo `exists (select ... from feature_flags ...)`.
create or replace function public.is_feature_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select enabled from public.feature_flags where key = p_key), false);
$$;

grant execute on function public.is_feature_enabled(text) to authenticated;

create or replace function public.create_post(
  p_content text,
  p_visibility text default 'school',
  p_community_id uuid default null,
  p_shared_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_community_id is not null and not public.is_community_member(p_community_id, v_me) then
    raise exception 'só membros publicam na comunidade' using errcode = '42501';
  end if;
  if p_shared_resource_id is not null and not public.can_view_resource(p_shared_resource_id, v_me) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;

  insert into public.posts (author_id, school_id, content, visibility, community_id, shared_resource_id)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility, p_community_id, p_shared_resource_id)
  returning id into v_id;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(10, 'Publicou na Comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.create_comment(p_post_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if not public.can_view_post(p_post_id, v_me) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  insert into public.comments (post_id, author_id, content)
  values (p_post_id, v_me, btrim(p_content))
  returning id into v_id;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(5, 'Comentou na Comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.create_community(
  p_name text,
  p_description text default null,
  p_visibility text default 'school'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_slug text;
  v_suffix int := 0;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('public', 'school', 'private') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  v_slug := lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if length(v_slug) < 3 then
    v_slug := v_slug || '-comunidade';
  end if;
  while exists (select 1 from public.communities where slug = v_slug || case when v_suffix = 0 then '' else '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 0 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into public.communities (owner_id, school_id, name, slug, description, visibility)
  values (v_me, public.current_school_id(v_me), btrim(p_name), v_slug, nullif(btrim(coalesce(p_description, '')), ''), p_visibility)
  returning id into v_id;

  insert into public.community_members (community_id, user_id, role) values (v_id, v_me, 'owner');

  -- Mesmo prêmio de `join_community` — criar já inclui "entrar" (o dono
  -- não passa por `join_community` separadamente), e o dedup por
  -- `source_id` = id da comunidade impede pagar de novo se algum dia a
  -- pessoa também chamar `join_community` pra ela mesma (o `on conflict do
  -- nothing` do insert de membro já tornaria isso um no-op de qualquer forma).
  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(15, 'Entrou numa comunidade', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

create or replace function public.join_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_community public.communities;
begin
  select * into v_community from public.communities where id = p_community_id;
  if not found then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  if v_community.visibility = 'private' then
    raise exception 'esta comunidade é só por convite — peça pra um moderador te adicionar' using errcode = '42501';
  end if;
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, v_me, 'member')
  on conflict (community_id, user_id) do nothing;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(15, 'Entrou numa comunidade', 'social', p_community_id, v_me);
  end if;
end;
$$;

update public.feature_flags set enabled = true where key = 'social_xp_enabled';
