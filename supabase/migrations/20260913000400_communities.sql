-- ============================================================================
-- Nexa Community — Fase 3 · Comunidades
--
-- Mesmo padrão security-definer das fases anteriores: `communities`/
-- `community_members` com RLS ativa e sem policy — toda leitura/escrita
-- passa por RPC.
--
-- `posts.community_id` (nova coluna, nullable): um post de comunidade
-- continua sendo um `post` normal, só que associado a uma comunidade — não
-- duplica a tabela. Quando presente, a visibilidade do post deixa de olhar
-- `posts.visibility` (private/friends/school/public) e passa a ser "quem
-- pode ver a comunidade" — os dois conceitos não se somam, pra não criar
-- uma combinação confusa tipo "post friends dentro de comunidade pública".
--
-- `list_feed`/`list_saved_posts` (Fase 2) passam a filtrar
-- `community_id is null` — o feed pessoal continua sendo só posts
-- pessoais; o feed de uma comunidade é `list_community_feed`, à parte.
-- Isso não muda o comportamento de nenhum post já existente (todos têm
-- `community_id null` hoje).
-- ============================================================================

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  name text not null check (length(btrim(name)) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  description text check (description is null or length(description) <= 500),
  rules text check (rules is null or length(rules) <= 2000),
  visibility text not null default 'school'
    check (visibility in ('public', 'school', 'private')),
  created_at timestamptz not null default now()
);

create index if not exists communities_school_idx on public.communities (school_id);

alter table public.communities enable row level security;

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_user_idx on public.community_members (user_id);

alter table public.community_members enable row level security;

alter table public.posts add column if not exists community_id uuid references public.communities (id) on delete cascade;
create index if not exists posts_community_idx on public.posts (community_id) where community_id is not null;

-- ----------------------------------------------------------------------------
-- can_view_community / is_community_member: fonte única das duas checagens
-- que toda RPC de comunidade (e o post dentro dela) precisa.
-- ----------------------------------------------------------------------------
create or replace function public.is_community_member(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = p_user_id
  );
$$;

grant execute on function public.is_community_member(uuid, uuid) to authenticated;

create or replace function public.can_view_community(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id
      and (
        public.is_admin(p_user_id)
        or public.is_community_member(p_community_id, p_user_id)
        or c.visibility = 'public'
        or (c.visibility = 'school' and c.school_id is not null
            and c.school_id = public.current_school_id(p_user_id))
      )
  );
$$;

grant execute on function public.can_view_community(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- can_view_post (Fase 2) estendida: post com `community_id` é regido pela
-- comunidade, não mais por `posts.visibility`.
-- ----------------------------------------------------------------------------
create or replace function public.can_view_post(p_post_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = p_user_id
        or public.is_admin(p_user_id)
        or (p.community_id is not null and public.can_view_community(p.community_id, p_user_id))
        or (p.community_id is null and (
          p.visibility = 'public'
          or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
              and public.current_school_id(p.author_id) = public.current_school_id(p_user_id))
          or (p.visibility = 'friends' and public.are_friends(p_user_id, p.author_id))
        ))
      )
  );
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

  -- Slug a partir do nome (minúsculo, hífen no lugar de espaço/acentuação
  -- simples) — com sufixo numérico se já existir, pra `create_community`
  -- nunca estourar erro de unicidade por coincidência de nome.
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

  return v_id;
end;
$$;

grant execute on function public.create_community(text, text, text) to authenticated;

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
end;
$$;

grant execute on function public.join_community(uuid) to authenticated;

-- Dono não sai — ou apaga a comunidade, ou (fase futura) transfere a
-- titularidade. Sem isso, uma comunidade ficaria sem ninguém em 'owner'.
create or replace function public.leave_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'o dono não pode sair — apague a comunidade se quiser encerrá-la' using errcode = '42501';
  end if;

  delete from public.community_members where community_id = p_community_id and user_id = auth.uid();
end;
$$;

grant execute on function public.leave_community(uuid) to authenticated;

create or replace function public.delete_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community public.communities;
begin
  select * into v_community from public.communities where id = p_community_id;
  if not found then
    return;
  end if;

  if not (
    v_community.owner_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_community.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.communities where id = p_community_id;
end;
$$;

grant execute on function public.delete_community(uuid) to authenticated;

-- Só o dono promove/rebaixa moderador — evita moderador promovendo aliados
-- pra escapar de ser removido por quem criou a comunidade.
create or replace function public.set_member_role(p_community_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('member', 'moderator') then
    raise exception 'papel inválido' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.communities where id = p_community_id and owner_id = auth.uid()
  ) then
    raise exception 'só o dono da comunidade muda papéis' using errcode = '42501';
  end if;

  update public.community_members
  set role = p_role
  where community_id = p_community_id and user_id = p_user_id and role <> 'owner';
end;
$$;

grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- Dono ou moderador removem um membro comum (nunca o dono, nunca outro moderador).
create or replace function public.remove_member(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role in ('owner', 'moderator')
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.community_members
  where community_id = p_community_id and user_id = p_user_id and role = 'member';
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- Único jeito de entrar numa comunidade 'private' (sem convite por link
-- ainda) — dono ou moderador adiciona diretamente.
create or replace function public.add_member(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role in ('owner', 'moderator')
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, p_user_id, 'member')
  on conflict (community_id, user_id) do nothing;
end;
$$;

grant execute on function public.add_member(uuid, uuid) to authenticated;

-- `create or replace` NÃO troca a assinatura de 2 argumentos da Fase 2 por
-- esta de 3 — Postgres trata parâmetros a mais como uma função SEPARADA
-- (mesmo bug já visto em `bootstrap_student` nesta sessão), e as duas
-- coexistindo tornam toda chamada com 2 argumentos ambígua. Precisa
-- apagar a versão antiga antes de criar a nova.
drop function if exists public.create_post(text, text);

create or replace function public.create_post(
  p_content text,
  p_visibility text default 'school',
  p_community_id uuid default null
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

  insert into public.posts (author_id, school_id, content, visibility, community_id)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility, p_community_id)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text, uuid) to authenticated;

create or replace function public.list_communities(p_query text default null)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  visibility text,
  member_count bigint,
  is_member boolean,
  my_role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.name, c.slug, c.description, c.visibility,
    (select count(*) from public.community_members m where m.community_id = c.id),
    public.is_community_member(c.id, auth.uid()),
    (select m2.role from public.community_members m2 where m2.community_id = c.id and m2.user_id = auth.uid())
  from public.communities c
  where (
    c.visibility = 'public'
    or public.is_admin()
    or public.is_community_member(c.id, auth.uid())
    or (c.visibility = 'school' and c.school_id is not null and c.school_id = public.current_school_id(auth.uid()))
  )
  and (p_query is null or c.name ilike '%' || p_query || '%')
  order by c.created_at desc;
$$;

grant execute on function public.list_communities(text) to authenticated;

create or replace function public.get_community(p_community_id uuid)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  rules text,
  visibility text,
  member_count bigint,
  is_member boolean,
  my_role text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_community(p_community_id) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select
    c.id, c.name, c.slug, c.description, c.rules, c.visibility,
    (select count(*) from public.community_members m where m.community_id = c.id),
    public.is_community_member(c.id, auth.uid()),
    (select m2.role from public.community_members m2 where m2.community_id = c.id and m2.user_id = auth.uid())
  from public.communities c
  where c.id = p_community_id;
end;
$$;

grant execute on function public.get_community(uuid) to authenticated;

create or replace function public.list_community_members(p_community_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_community(p_community_id) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select m.user_id, pr.full_name, pr.avatar_url, m.role, m.joined_at
  from public.community_members m
  join public.profiles pr on pr.id = m.user_id
  where m.community_id = p_community_id
  order by (m.role = 'owner') desc, (m.role = 'moderator') desc, m.joined_at asc;
end;
$$;

grant execute on function public.list_community_members(uuid) to authenticated;

-- Mesmo motivo do drop em `list_feed`/`list_saved_posts` (Fase 2): a Fase 6
-- muda as colunas de retorno desta função.
drop function if exists public.list_community_feed(uuid, integer, timestamptz);

create or replace function public.list_community_feed(
  p_community_id uuid,
  p_limit integer default 20,
  p_before timestamptz default null
)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if not public.can_view_community(p_community_id, v_me) then
    raise exception 'comunidade não encontrada' using errcode = 'P0002';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where p.community_id = p_community_id
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

grant execute on function public.list_community_feed(uuid, integer, timestamptz) to authenticated;

-- `list_feed`/`list_saved_posts` (Fase 2) passam a ignorar posts de
-- comunidade — o feed pessoal continua sendo só posts pessoais.
create or replace function public.list_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    exists (select 1 from public.post_saves ps where ps.post_id = p.id and ps.user_id = v_me),
    p.author_id = v_me
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where p.community_id is null
    and (p_before is null or p.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

create or replace function public.list_saved_posts(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  media jsonb,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  viewer_has_saved boolean,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, pr.full_name, pr.avatar_url, p.content, p.media, p.visibility, p.created_at,
    (select count(*) from public.post_likes pl where pl.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id),
    exists (select 1 from public.post_likes pl2 where pl2.post_id = p.id and pl2.user_id = v_me),
    true,
    p.author_id = v_me
  from public.post_saves ps
  join public.posts p on p.id = ps.post_id
  join public.profiles pr on pr.id = p.author_id
  where ps.user_id = v_me
    and p.community_id is null
    and (p_before is null or ps.created_at < p_before)
    and (
      p.author_id = v_me
      or public.is_admin(v_me)
      or p.visibility = 'public'
      or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
          and public.current_school_id(p.author_id) = public.current_school_id(v_me))
      or (p.visibility = 'friends' and public.are_friends(v_me, p.author_id))
    )
  order by ps.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;

update public.feature_flags set enabled = true where key = 'community_enabled';

-- ============================================================================
-- Cortes deliberados desta fase:
--   * Sem convite por link/token pra comunidade 'private' — hoje só dono/
--     moderador adiciona diretamente (`add_member`), sem um link/código
--     pra compartilhar; fica pra quando o convite de verdade for pedido.
--   * Sem transferência de titularidade — dono só sai apagando a comunidade.
--   * Sem avatar/banner de comunidade (mesma decisão de posts: mídia fica
--     pra quando o bucket for definido).
-- ============================================================================
