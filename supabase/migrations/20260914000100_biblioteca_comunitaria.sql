-- ============================================================================
-- Nexa Community — Fase 6 · Biblioteca comunitária
--
-- Escopo real (adaptado do plano): a Fase 5 (IA Creator — aluno virando dono
-- de `resources`) foi propositalmente adiada por ser a de maior risco de
-- regressão (RLS de gabarito). Sem ela, ainda não existe "conteúdo gerado
-- por aluno" pra compartilhar — então "biblioteca comunitária" aqui vira:
--   1. Avaliar (nota de 1 a 5) qualquer conteúdo já publicado na Biblioteca
--      oficial (`content_ratings`, tabela nova).
--   2. Compartilhar um item da Biblioteca oficial dentro de um post do feed
--      (`posts.shared_resource_id`, nullable) — é exatamente o que o mockup
--      mostrava ("Resumo — Funções (Módulo 4)... Visualizar").
--
-- Quando a Fase 5 for feita, `content_ratings`/`shared_resource_id` continuam
-- funcionando sem alteração — passam a valer também pra conteúdo de aluno,
-- não só de admin/professor.
-- ============================================================================

create table if not exists public.content_ratings (
  resource_id uuid not null references public.resources (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

drop trigger if exists content_ratings_set_updated_at on public.content_ratings;
create trigger content_ratings_set_updated_at before update on public.content_ratings
  for each row execute function public.set_updated_at();

alter table public.content_ratings enable row level security;
-- Mesmo padrão de RLS-sem-policy do resto da Community: `resources` não
-- libera SELECT pra quem só está de passagem (RLS depende de `is_published`
-- E escola), então uma policy direta em `content_ratings` duplicaria essa
-- regra. Toda leitura/escrita passa pelas RPCs abaixo.

-- `can_view_resource` já existe (20260904000300, usada por quiz/leitura) —
-- esta reaproveita o MESMO nome/assinatura em vez de criar uma segunda
-- função de visibilidade de recurso; só soma `is_admin()` (que faltava ali)
-- pra ficar consistente com todo `can_view_*` novo da Community.
create or replace function public.can_view_resource(p_resource_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (
        (r.is_published and (r.school_id is null or r.school_id = public.current_school_id(p_user_id)))
        or public.can_manage_school(r.school_id, p_user_id)
        or public.is_admin(p_user_id)
      )
  );
$$;

grant execute on function public.can_view_resource(uuid, uuid) to authenticated;

create or replace function public.rate_resource(p_resource_id uuid, p_rating integer, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if p_rating not between 1 and 5 then
    raise exception 'nota precisa ser de 1 a 5' using errcode = '22023';
  end if;

  insert into public.content_ratings (resource_id, user_id, rating, comment)
  values (p_resource_id, auth.uid(), p_rating, nullif(btrim(coalesce(p_comment, '')), ''))
  on conflict (resource_id, user_id) do update
    set rating = excluded.rating, comment = excluded.comment, updated_at = now();
end;
$$;

grant execute on function public.rate_resource(uuid, integer, text) to authenticated;

create or replace function public.remove_resource_rating(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.content_ratings where resource_id = p_resource_id and user_id = auth.uid();
end;
$$;

grant execute on function public.remove_resource_rating(uuid) to authenticated;

-- Resumo agregado + a nota do próprio chamador — um SELECT só cobre o card
-- inteiro (média, contagem, "eu dei tal nota"), sem o cliente juntar duas
-- respostas.
create or replace function public.get_resource_rating(p_resource_id uuid)
returns table (average numeric, rating_count bigint, my_rating smallint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;

  return query
  select
    round(avg(cr.rating), 1),
    count(*),
    (select cr2.rating from public.content_ratings cr2
      where cr2.resource_id = p_resource_id and cr2.user_id = auth.uid())
  from public.content_ratings cr
  where cr.resource_id = p_resource_id;
end;
$$;

grant execute on function public.get_resource_rating(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Compartilhar um item da Biblioteca num post.
-- ----------------------------------------------------------------------------
alter table public.posts add column if not exists shared_resource_id uuid references public.resources (id) on delete set null;

drop function if exists public.create_post(text, text, uuid);

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

  return v_id;
end;
$$;

grant execute on function public.create_post(text, text, uuid, uuid) to authenticated;

-- `list_feed`/`list_saved_posts`/`list_community_feed` (Fases 2-3) passam a
-- devolver o recurso compartilhado (quando houver) já resolvido — mesmo
-- princípio de `list_feed` já resolver autor via join, pra ninguém no
-- cliente precisar de uma segunda chamada só pra saber o título/tipo do
-- recurso citado no post.
-- `create or replace` não troca o tipo de retorno de uma função existente
-- (as 3 colunas novas do recurso compartilhado mudam a assinatura de saída)
-- — precisa apagar as 3 versões antigas antes de recriar.
drop function if exists public.list_feed(integer, timestamptz);
drop function if exists public.list_saved_posts(integer, timestamptz);
drop function if exists public.list_community_feed(uuid, integer, timestamptz);

create or replace function public.list_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
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
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
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
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
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
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.post_saves ps
  join public.posts p on p.id = ps.post_id
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
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

create or replace function public.list_community_feed(
  p_community_id uuid, p_limit integer default 20, p_before timestamptz default null
)
returns table (
  id uuid, author_id uuid, author_name text, author_avatar_url text, content text, media jsonb,
  visibility text, created_at timestamptz, like_count bigint, comment_count bigint,
  viewer_has_liked boolean, viewer_has_saved boolean, is_own boolean,
  shared_resource_id uuid, shared_resource_title text, shared_resource_kind text
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
    p.author_id = v_me,
    sr.id, sr.title, sr.kind::text
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.resources sr on sr.id = p.shared_resource_id
  where p.community_id = p_community_id
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit greatest(1, least(p_limit, 50));
end;
$$;
