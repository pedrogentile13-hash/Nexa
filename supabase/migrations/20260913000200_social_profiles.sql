-- ============================================================================
-- Nexa Community — Fase 0 (2) · Perfil social + seguir
--
-- `social_profiles` é uma EXTENSÃO 1:1 de `profiles` (mesmo `id`), não uma
-- segunda identidade de usuário — `profiles` continua sendo a fonte de
-- verdade de nome/avatar/escola/turma; aqui mora só o que é genuinamente
-- social e opcional (usuário público, bio, banner, visibilidade do
-- perfil). Ninguém tem uma linha aqui até salvar o perfil social pela
-- primeira vez — leitura sem linha equivale a "perfil social não
-- configurado ainda", tratado como default na camada de aplicação.
--
-- `follows` é o caso ASSIMÉTRICO que `friendships` (20260911000100) não
-- cobre — amizade precisa dos dois lados aceitarem, seguir não. As duas
-- tabelas coexistem de propósito: seguir alguém não implica amizade, e
-- aceitar amizade não implica seguir.
-- ============================================================================

create table if not exists public.social_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  username text,
  bio text check (bio is null or length(bio) <= 280),
  banner_url text,
  visibility text not null default 'school'
    check (visibility in ('private', 'friends', 'school', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.social_profiles is
  'Extensão social opcional de profiles (mesmo id) — username/bio/banner/visibilidade do Nexa Community.';
comment on column public.social_profiles.visibility is
  'Quem enxerga este perfil social: private (só o dono), friends, school (mesma escola) ou public.';

create unique index if not exists social_profiles_username_uq
  on public.social_profiles (lower(username)) where username is not null;

drop trigger if exists social_profiles_set_updated_at on public.social_profiles;
create trigger social_profiles_set_updated_at before update on public.social_profiles
  for each row execute function public.set_updated_at();

alter table public.social_profiles enable row level security;

-- `are_friends`: extraída aqui porque `social_profiles` (visibility =
-- 'friends') é o primeiro lugar que precisa checar amizade dentro de uma
-- policy de RLS — até agora só RPCs (`student_profile_card`) faziam essa
-- checagem, cada uma com a própria query inline. Fases futuras (feed,
-- comentário) vão reaproveitar esta função em vez de repetir a consulta.
create or replace function public.are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(p_a, p_b)
      and greatest(f.requester_id, f.addressee_id) = greatest(p_a, p_b)
  );
$$;

drop policy if exists social_profiles_select on public.social_profiles;
create policy social_profiles_select on public.social_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (visibility = 'public')
    or (visibility = 'school' and public.current_school_id(id) is not null
        and public.current_school_id(id) = public.current_school_id(auth.uid()))
    or (visibility = 'friends' and public.are_friends(auth.uid(), id))
  );

drop policy if exists social_profiles_insert_own on public.social_profiles;
create policy social_profiles_insert_own on public.social_profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists social_profiles_update_own on public.social_profiles;
create policy social_profiles_update_own on public.social_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------------ follows --
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

-- Sem policy de escrita direta (mesma decisão de `friendships`): as duas
-- pontas do relacionamento (contagem de seguidores no perfil de outra
-- pessoa) exigiriam ler uma linha que não é sua, então toda escrita passa
-- pelas RPCs abaixo. Leitura liberada pra qualquer autenticado — ao
-- contrário de amizade, "quem segue quem" não é um dado sensível (é
-- exibido publicamente em qualquer rede social), então não precisa da
-- mesma cautela de `friendships`.
drop policy if exists follows_select_authenticated on public.follows;
create policy follows_select_authenticated on public.follows
  for select to authenticated using (true);

create or replace function public.follow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'não dá pra seguir a si mesmo' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_target_id) then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;

  insert into public.follows (follower_id, following_id)
  values (auth.uid(), p_target_id)
  on conflict (follower_id, following_id) do nothing;
end;
$$;

grant execute on function public.follow_user(uuid) to authenticated;

create or replace function public.unfollow_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where follower_id = auth.uid() and following_id = p_target_id;
end;
$$;

grant execute on function public.unfollow_user(uuid) to authenticated;

grant execute on function public.are_friends(uuid, uuid) to authenticated;
