-- ============================================================================
-- Nexa Community — Redesign da página /comunidade · Pessoas sugeridas
--
-- Widget novo da sidebar ("Pessoas que você pode conhecer"). `search_schoolmates`
-- (20260911000100/20260912000100) não serve pra isto de propósito — ela só
-- devolve linha com uma busca de verdade (`p_query` vazio retorna nada), e
-- misturar os dois usos deixaria a função fazendo duas coisas. Esta é uma
-- segunda função, MESMO padrão de autorização (security definer, mesma
-- escola, nunca a própria pessoa) — só troca o filtro de nome por "ainda não
-- sigo e não sou amigo", que é o que faz sentido sugerir.
-- ============================================================================

create or replace function public.suggested_people(p_limit integer default 5)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
begin
  if v_me is null or v_school is null then
    return;
  end if;

  return query
  select p.id, p.full_name, p.avatar_url, c.name
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  where p.school_id = v_school
    and p.id <> v_me
    and not exists (
      select 1 from public.follows f where f.follower_id = v_me and f.following_id = p.id
    )
    and not exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and least(f.requester_id, f.addressee_id) = least(v_me, p.id)
        and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
    )
  order by random()
  limit greatest(1, least(p_limit, 20));
end;
$$;

grant execute on function public.suggested_people(integer) to authenticated;

-- ============================================================================
-- Correções de transcrição — duas migrations desta sessão (0913 (1) e (2))
-- foram coladas no chat de memória em vez de copiadas do arquivo real, e
-- saíram com uma diferença funcional em cada uma. Como o usuário já rodou a
-- versão colada, este arquivo também aplica a correção sobre o que já está
-- no banco dele (idempotente, seguro rodar de novo em qualquer ambiente):
--
-- 1. `follow_user`/`unfollow_user`: a versão colada usava o parâmetro
--    `p_user_id`; o app (`src/features/community/server/actions.ts`) chama
--    por nome com `p_target_id` (o nome real da migração no repositório).
--    PostgREST casa parâmetro por NOME, não só por tipo — com o nome
--    errado, todo clique em "Seguir"/"Deixar de seguir" falhava calado.
--    `create or replace` já resolve: mesmo tipo (uuid), troca só o nome.
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

-- 2. `social_profiles.username`: a versão colada tinha `unique check
--    (username ~ '^[a-z0-9_]{3,20}$')` direto na coluna — mais restritivo
--    (máx. 20) que a validação real do app (zod, até 24 caracteres em
--    `src/features/community/server/actions.ts`). Um username de 21-24
--    caracteres passava no app e quebrava no banco. A migração real não
--    tem esse CHECK (o formato é responsabilidade só do app) — nem um
--    índice único comum, e sim um parcial case-insensitive.
alter table public.social_profiles drop constraint if exists social_profiles_username_check;
alter table public.social_profiles drop constraint if exists social_profiles_username_key;
create unique index if not exists social_profiles_username_uq
  on public.social_profiles (lower(username)) where username is not null;
