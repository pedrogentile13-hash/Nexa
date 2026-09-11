-- ============================================================================
-- Nexa — 0911 (1) · Sistema de amizade (Fase 2 do Ranking de XP)
--
-- Fase 1 (20260910000200) deixou de fora, de propósito, "amigos" e
-- "atualização em tempo real" — não existia tabela de relação entre dois
-- usuários em lugar nenhum do schema, e o pedido original já tinha sido
-- reduzido pra "atualiza sozinho ao voltar pra tela" (sem Supabase Realtime,
-- que este projeto não usa em nenhum outro lugar). Esta migração fecha a
-- primeira parte; a segunda continua resolvida do mesmo jeito de sempre — o
-- sino de notificações já existente (20260908000800) já recarrega a cada
-- navegação, então um pedido de amizade vira notificação normal ali, sem
-- inventar um canal novo.
--
-- Nenhuma policy de RLS pra leitura/escrita direta de `friendships`: não dá
-- pra expressar "a OUTRA pessoa da amizade" numa policy sem uma função
-- auxiliar de qualquer jeito — e as RPCs abaixo já precisam enriquecer com
-- nome/avatar de `profiles` (que também não tem policy de leitura entre
-- colegas, mesma razão de `student_profile_card`). Mesmo padrão de
-- `notifications`: toda escrita passa por função `security definer`.
-- ============================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- Uma linha só por par de pessoas, não importa quem pediu — pedido A→B e B→A
-- são a mesma relação. `least`/`greatest` de uuid é imutável, então dá pra
-- indexar a expressão direto.
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_addressee_pending_idx
  on public.friendships (addressee_id) where status = 'pending';

alter table public.friendships enable row level security;
-- (Sem policies — acesso só pelas funções abaixo. Ver comentário no topo.)

-- ----------------------------------------------------------------------------
-- notify_user: única função nesta migração sem `grant execute to authenticated`
-- de propósito — é usada só internamente por `send_friend_request`/
-- `respond_friend_request` (chamada direta de função pra função não passa
-- pelo PostgREST, não precisa de grant). Expor isso pra qualquer usuário
-- autenticado viraria uma forma de mandar notificação com título/corpo livre
-- pra qualquer outro id de usuário — igual ao motivo de `notify_subject_students`
-- checar o papel de quem chama, só que aqui nem exponho a chamada direta.
-- ----------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, link)
  values (p_user_id, p_title, p_body, p_link);
end;
$$;

-- ----------------------------------------------------------------------------
-- send_friend_request: pedir amizade a um colega da mesma escola.
--
--   • Já existe pedido seu pendente pro mesmo colega → não faz nada de novo
--     ('already_pending').
--   • Já são amigos → não faz nada ('already_friends').
--   • O colega já tinha te chamado (pedido pendente na direção contrária) →
--     vira amizade na hora, sem precisar de um "aceitar" redundante pros dois
--     lados ('accepted').
--   • Pedido anterior tinha sido recusado → deixa pedir de novo, reabrindo a
--     mesma linha como pendente (não acumula lixo de linhas recusadas).
-- ----------------------------------------------------------------------------
create or replace function public.send_friend_request(p_addressee_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.friendships;
  v_name text;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_addressee_id = v_me then
    raise exception 'não dá pra se adicionar como amigo' using errcode = '22023';
  end if;
  if public.current_school_id(v_me) is null
     or public.current_school_id(v_me) <> public.current_school_id(p_addressee_id) then
    raise exception 'só dá pra adicionar colegas da mesma escola' using errcode = '42501';
  end if;

  -- `FOUND` reflete o resultado do último comando executado — precisa ser
  -- checado ANTES de qualquer outro select (inclusive o do nome, abaixo),
  -- senão ele reflete a busca errada.
  select * into v_row from public.friendships
  where least(requester_id, addressee_id) = least(v_me, p_addressee_id)
    and greatest(requester_id, addressee_id) = greatest(v_me, p_addressee_id);

  if not found then
    select full_name into v_name from public.profiles where id = v_me;
    insert into public.friendships (requester_id, addressee_id, status)
    values (v_me, p_addressee_id, 'pending');
    perform public.notify_user(
      p_addressee_id, 'Novo pedido de amizade',
      coalesce(v_name, 'Um colega') || ' quer ser seu amigo no ranking.', '/ranking'
    );
    return 'pending';
  end if;

  select full_name into v_name from public.profiles where id = v_me;

  if v_row.status = 'accepted' then
    return 'already_friends';
  end if;

  if v_row.status = 'pending' then
    if v_row.requester_id = v_me then
      return 'already_pending';
    end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
    perform public.notify_user(
      v_row.requester_id, 'Pedido de amizade aceito',
      coalesce(v_name, 'Um colega') || ' aceitou seu pedido de amizade.', '/ranking'
    );
    return 'accepted';
  end if;

  -- status = 'declined': reabre como pendente, com você como remetente atual.
  update public.friendships
  set requester_id = v_me, addressee_id = p_addressee_id, status = 'pending',
      created_at = now(), responded_at = null
  where id = v_row.id;
  perform public.notify_user(
    p_addressee_id, 'Novo pedido de amizade',
    coalesce(v_name, 'Um colega') || ' quer ser seu amigo no ranking.', '/ranking'
  );
  return 'pending';
end;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- respond_friend_request: só quem recebeu o pedido responde.
-- ----------------------------------------------------------------------------
create or replace function public.respond_friend_request(p_requester_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_row public.friendships;
  v_name text;
begin
  select * into v_row from public.friendships
  where requester_id = p_requester_id and addressee_id = v_me and status = 'pending';

  if not found then
    raise exception 'pedido não encontrado' using errcode = 'P0002';
  end if;

  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = v_row.id;

  if p_accept then
    select full_name into v_name from public.profiles where id = v_me;
    perform public.notify_user(
      p_requester_id, 'Pedido de amizade aceito',
      coalesce(v_name, 'Um colega') || ' aceitou seu pedido de amizade.', '/ranking'
    );
  end if;
end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- remove_friend: desfaz a amizade OU cancela um pedido pendente (seu ou do
-- outro lado) — mesma ação de "some com essa linha", já que os dois casos
-- (desfazer amizade, cancelar pedido enviado, cancelar pedido recebido sem
-- responder) têm o mesmo efeito esperado do lado de quem chama.
-- ----------------------------------------------------------------------------
create or replace function public.remove_friend(p_other_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  delete from public.friendships
  where least(requester_id, addressee_id) = least(v_me, p_other_id)
    and greatest(requester_id, addressee_id) = greatest(v_me, p_other_id);
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- search_schoolmates: busca pra adicionar amigo — só colegas da MESMA escola,
-- nunca a própria pessoa. `security definer` pela mesma razão de
-- `student_profile_card`: `profiles` não tem policy de leitura entre colegas.
-- ----------------------------------------------------------------------------
create or replace function public.search_schoolmates(p_query text)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  friendship_status text
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
  if v_school is null or btrim(coalesce(p_query, '')) = '' then
    return;
  end if;

  return query
  select
    p.id, p.full_name, p.avatar_url, p.class_name,
    coalesce(
      case
        when f.status = 'accepted' then 'accepted'
        when f.status = 'pending' and f.requester_id = v_me then 'pending_sent'
        when f.status = 'pending' and f.addressee_id = v_me then 'pending_received'
      end,
      'none'
    )
  from public.profiles p
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(v_me, p.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
   and f.status <> 'declined'
  where p.school_id = v_school
    and p.id <> v_me
    and p.full_name ilike '%' || btrim(p_query) || '%'
  order by p.full_name
  limit 8;
end;
$$;

grant execute on function public.search_schoolmates(text) to authenticated;

-- ----------------------------------------------------------------------------
-- list_friends / list_friend_requests: pra sidebar de Amigos do /ranking.
-- ----------------------------------------------------------------------------
create or replace function public.list_friends()
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  level smallint,
  xp bigint,
  current_streak integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    p.id, p.full_name, p.avatar_url, p.class_name,
    coalesce(us.level, 1)::smallint, coalesce(us.xp, 0)::bigint, coalesce(us.current_streak, 0)
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = v_me then f.addressee_id else f.requester_id end
  left join public.user_stats us on us.user_id = p.id
  where f.status = 'accepted' and (f.requester_id = v_me or f.addressee_id = v_me)
  order by coalesce(us.xp, 0) desc;
end;
$$;

grant execute on function public.list_friends() to authenticated;

create or replace function public.list_friend_requests()
returns table (
  requester_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.requester_id, p.full_name, p.avatar_url, p.class_name, f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

grant execute on function public.list_friend_requests() to authenticated;

-- ----------------------------------------------------------------------------
-- student_profile_card ganha `friendshipStatus` — o modal de perfil do
-- ranking usa isso pra decidir entre "Adicionar amigo" / "Pedido enviado" /
-- "Aceitar e recusar" / "Amigos" / nada (perfil próprio). Redefinida por
-- inteiro (mesmo corpo de 20260910000200), só acrescentando o campo novo.
-- ----------------------------------------------------------------------------
create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
  v_friendship_status text;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, p.class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  if p_user_id = auth.uid() then
    v_friendship_status := 'self';
  else
    select
      coalesce(
        case
          when f.status = 'accepted' then 'accepted'
          when f.status = 'pending' and f.requester_id = auth.uid() then 'pending_sent'
          when f.status = 'pending' and f.addressee_id = auth.uid() then 'pending_received'
        end,
        'none'
      )
    into v_friendship_status
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id)
      and f.status <> 'declined';
    v_friendship_status := coalesce(v_friendship_status, 'none');
  end if;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'friendshipStatus', v_friendship_status,
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts a
        join public.resources r on r.id = a.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where a.user_id = p_user_id and a.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ach.id, 'name', ach.name, 'icon', ach.icon, 'rarity', ach.rarity, 'unlockedAt', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements ach on ach.id = ua.achievement_id
      where ua.user_id = p_user_id and ua.unlocked_at is not null
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.student_profile_card(uuid) to authenticated;
