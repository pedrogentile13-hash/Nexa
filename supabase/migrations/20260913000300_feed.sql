-- ============================================================================
-- Nexa Community — Fase 2 · Feed (posts, comentários, curtidas, salvos)
--
-- Mesmo padrão de `friendships`/`admin_subject_scores`/`student_profile_card`:
-- as tabelas ficam com RLS ativa e SEM policy nenhuma — todo acesso passa por
-- função `security definer`, que decide visibilidade (private/friends/school/
-- public) uma vez só, no SQL, em vez de duplicar a mesma regra numa policy de
-- RLS por tabela E de novo em cada RPC que precisa enriquecer com
-- nome/avatar de `profiles` (que também não tem policy pra "outra pessoa").
--
-- Escopo desta fase (deliberadamente enxuto — ver comentário no fim):
--   * posts: texto (1-2000 chars) + `media` (jsonb, reservado pra Fase
--     seguinte de upload de imagem — vazio por enquanto).
--   * comments: só um nível (sem resposta a comentário ainda).
--   * post_likes / post_saves: curtir e salvar.
--   * Compartilhar/repostar fica pra depois — não tem tabela nem RPC aqui.
-- ============================================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  content text not null check (length(btrim(content)) between 1 and 2000),
  media jsonb not null default '[]'::jsonb,
  visibility text not null default 'school'
    check (visibility in ('private', 'friends', 'school', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_created_idx on public.posts (created_at desc);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;
-- (Sem policies — acesso só pelas funções abaixo, mesmo padrão de `friendships`.)

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create table if not exists public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_saves enable row level security;

-- ----------------------------------------------------------------------------
-- can_view_post: única fonte da regra de visibilidade — usada por toda RPC
-- abaixo que precisa checar "esta pessoa pode ver este post".
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
        or p.visibility = 'public'
        or (p.visibility = 'school' and public.current_school_id(p.author_id) is not null
            and public.current_school_id(p.author_id) = public.current_school_id(p_user_id))
        or (p.visibility = 'friends' and public.are_friends(p_user_id, p.author_id))
      )
  );
$$;

grant execute on function public.can_view_post(uuid, uuid) to authenticated;

create or replace function public.create_post(p_content text, p_visibility text default 'school')
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

  insert into public.posts (author_id, school_id, content, visibility)
  values (v_me, public.current_school_id(v_me), btrim(p_content), p_visibility)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text) to authenticated;

create or replace function public.update_post(p_post_id uuid, p_content text, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visibility not in ('private', 'friends', 'school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  update public.posts
  set content = btrim(p_content), visibility = p_visibility
  where id = p_post_id and author_id = auth.uid();

  if not found then
    raise exception 'post não encontrado ou sem permissão' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.update_post(uuid, text, text) to authenticated;

-- Autor apaga o próprio post; school_admin/admin também podem (moderação
-- básica de escola — mesmo corte de `can_manage_school`, sem sistema de
-- denúncia ainda, que fica pra uma fase própria de moderação).
create or replace function public.delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts;
begin
  select * into v_post from public.posts where id = p_post_id;
  if not found then
    return;
  end if;

  if not (
    v_post.author_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_post.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.posts where id = p_post_id;
end;
$$;

grant execute on function public.delete_post(uuid) to authenticated;

create or replace function public.like_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;
  insert into public.post_likes (post_id, user_id) values (p_post_id, auth.uid())
  on conflict (post_id, user_id) do nothing;
end;
$$;

grant execute on function public.like_post(uuid) to authenticated;

create or replace function public.unlike_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_likes where post_id = p_post_id and user_id = auth.uid();
end;
$$;

grant execute on function public.unlike_post(uuid) to authenticated;

create or replace function public.save_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;
  insert into public.post_saves (post_id, user_id) values (p_post_id, auth.uid())
  on conflict (post_id, user_id) do nothing;
end;
$$;

grant execute on function public.save_post(uuid) to authenticated;

create or replace function public.unsave_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_saves where post_id = p_post_id and user_id = auth.uid();
end;
$$;

grant execute on function public.unsave_post(uuid) to authenticated;

create or replace function public.create_comment(p_post_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  insert into public.comments (post_id, author_id, content)
  values (p_post_id, auth.uid(), btrim(p_content))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_comment(uuid, text) to authenticated;

-- Autor do comentário, autor do post (modera o próprio post), school_admin/admin.
create or replace function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment public.comments;
  v_post public.posts;
begin
  select * into v_comment from public.comments where id = p_comment_id;
  if not found then
    return;
  end if;
  select * into v_post from public.posts where id = v_comment.post_id;

  if not (
    v_comment.author_id = auth.uid()
    or v_post.author_id = auth.uid()
    or public.is_admin()
    or public.can_manage_school(v_post.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.comments where id = p_comment_id;
end;
$$;

grant execute on function public.delete_comment(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- list_feed: página do feed, já com nome/avatar do autor, contagens e o que o
-- próprio usuário curtiu/salvou — nenhuma outra query precisa tocar em
-- `posts`/`profiles` diretamente (não teria como: nenhuma das duas libera
-- select direto pra "outra pessoa").
-- ----------------------------------------------------------------------------
-- `drop` antes do `create or replace`: fases futuras (Fase 6, biblioteca
-- comunitária) mudam as colunas de retorno desta função — sem o drop aqui,
-- reaplicar esta migração do zero sobre um banco que já passou pela versão
-- nova quebraria com "cannot change return type of existing function".
drop function if exists public.list_feed(integer, timestamptz);
drop function if exists public.list_saved_posts(integer, timestamptz);

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
  where (p_before is null or p.created_at < p_before)
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

grant execute on function public.list_feed(integer, timestamptz) to authenticated;

-- Mesmo formato de `list_feed`, filtrado aos posts que o próprio usuário salvou.
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
    and (p_before is null or ps.created_at < p_before)
    -- Um save antigo de um post que mudou pra 'private'/'friends' depois não
    -- deve vazar — reaplica a mesma checagem de visibilidade de `list_feed`.
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

grant execute on function public.list_saved_posts(integer, timestamptz) to authenticated;

create or replace function public.list_post_comments(p_post_id uuid)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  created_at timestamptz,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_post(p_post_id) then
    raise exception 'post não encontrado' using errcode = '42501';
  end if;

  return query
  select c.id, c.author_id, pr.full_name, pr.avatar_url, c.content, c.created_at, c.author_id = auth.uid()
  from public.comments c
  join public.profiles pr on pr.id = c.author_id
  where c.post_id = p_post_id
  order by c.created_at asc;
end;
$$;

grant execute on function public.list_post_comments(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Liga o feed depois de implementado e verificado (tsc/eslint/vitest/build +
-- suíte SQL local) — mesmo princípio da Fase 0: nada fica visível até a
-- fase estar pronta de verdade.
-- ----------------------------------------------------------------------------
update public.feature_flags set enabled = true where key in ('community_enabled', 'posts_enabled');

-- ============================================================================
-- Cortes deliberados desta fase (documentados aqui, não escondidos):
--   * Sem upload de imagem em post — `media` fica reservado, vazio, até a
--     estratégia de bucket de mídia da Community ser decidida na prática.
--   * Sem resposta a comentário (thread de 1 nível só).
--   * Sem "compartilhar"/repost.
--   * Sem denúncia — moderação de posts hoje é só apagar (autor/school_admin/
--     admin); um sistema de denúncia de verdade é uma fase própria.
-- ============================================================================
