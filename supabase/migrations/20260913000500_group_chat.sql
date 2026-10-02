-- ============================================================================
-- Nexa Community — Fase 4 · Chat em grupo
--
-- Decisão de escopo: o plano original separa "Grupos" (Fase 4 — criar,
-- membros, convites, permissões) de "Chat" (Fase 5 — mensagens, reações,
-- presença). Na prática, o que diferencia um "grupo" de uma "comunidade"
-- (Fase 3) é só o chat — as duas já compartilham a MESMA mecânica de
-- membro/moderador/dono. Criar `groups`/`group_members` do zero duplicaria
-- `communities`/`community_members` linha por linha. Em vez disso: chat
-- mora dentro de uma comunidade já existente — uma comunidade "vira" um
-- grupo de estudo simplesmente por ter conversa ativa, sem precisar de uma
-- segunda hierarquia de tabelas pra chegar no mesmo lugar.
--
-- Tecnologia: polling curto no cliente (decisão já tomada na Fase 0 — o
-- projeto nunca usou Supabase Realtime, e não é este chat que introduz a
-- exceção). `messages` é só a tabela; quem periodicamente busca mensagem
-- nova é o componente React, chamando `list_messages` a cada poucos
-- segundos enquanto a tela de chat está aberta.
--
-- Diferente do feed da comunidade (que pode ser visível a quem só pode VER
-- a comunidade, mesmo sem ser membro, dependendo da visibilidade): mandar e
-- ler mensagem exige ser MEMBRO sempre, em qualquer visibilidade — chat é
-- espaço de quem já entrou, não de quem só está espiando de fora.
-- ============================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists messages_community_idx on public.messages (community_id, created_at);

alter table public.messages enable row level security;
-- (Sem policies — acesso só pelas funções abaixo, mesmo padrão de `posts`/`communities`.)

create or replace function public.send_message(p_community_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_community_member(p_community_id) then
    raise exception 'só membros conversam no grupo' using errcode = '42501';
  end if;

  insert into public.messages (community_id, author_id, content)
  values (p_community_id, auth.uid(), btrim(p_content))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.send_message(uuid, text) to authenticated;

create or replace function public.edit_message(p_message_id uuid, p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set content = btrim(p_content), edited_at = now()
  where id = p_message_id and author_id = auth.uid();

  if not found then
    raise exception 'mensagem não encontrada ou sem permissão' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.edit_message(uuid, text) to authenticated;

-- Autor da mensagem, ou quem modera o grupo (dono/moderador), ou admin/school_admin.
create or replace function public.delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.messages;
  v_community public.communities;
begin
  select * into v_message from public.messages where id = p_message_id;
  if not found then
    return;
  end if;
  select * into v_community from public.communities where id = v_message.community_id;

  if not (
    v_message.author_id = auth.uid()
    or exists (
      select 1 from public.community_members
      where community_id = v_message.community_id and user_id = auth.uid() and role in ('owner', 'moderator')
    )
    or public.is_admin()
    or public.can_manage_school(v_community.school_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.messages where id = p_message_id;
end;
$$;

grant execute on function public.delete_message(uuid) to authenticated;

create or replace function public.list_messages(
  p_community_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  id uuid,
  community_id uuid,
  author_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  created_at timestamptz,
  edited_at timestamptz,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_community_member(p_community_id) then
    raise exception 'só membros veem a conversa do grupo' using errcode = '42501';
  end if;

  return query
  select
    m.id, m.community_id, m.author_id, pr.full_name, pr.avatar_url, m.content, m.created_at, m.edited_at,
    m.author_id = auth.uid()
  from public.messages m
  join public.profiles pr on pr.id = m.author_id
  where m.community_id = p_community_id
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit greatest(1, least(p_limit, 100));
end;
$$;

grant execute on function public.list_messages(uuid, integer, timestamptz) to authenticated;

update public.feature_flags set enabled = true where key = 'chat_enabled';

-- ============================================================================
-- Cortes deliberados desta fase:
--   * Sem reações, anexo, indicador de "digitando" ou presença online —
--     texto simples só, igual ao chat da NexaAI já existente.
--   * Sem resposta citando outra mensagem (thread) — lista linear, como
--     qualquer chat de grupo simples.
--   * Polling, não Supabase Realtime — decisão da Fase 0 mantida.
-- ============================================================================
