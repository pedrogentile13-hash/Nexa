-- ============================================================================
-- Nexa Study — 0908 (5) · Nexa IA (estrutura, sem provedor de IA ainda)
--
-- Esta rodada entrega só a estrutura: sessões e mensagens de chat, com uma
-- resposta fixa em vez de uma chamada de LLM de verdade — falta a chave de
-- API, e decidir isso é do usuário, não do código. Quando a chave existir,
-- troca-se só a função que gera a resposta (ver `src/features/nexa-ia/
-- server/actions.ts`); o schema já fica pronto pra guardar a conversa real.
-- ============================================================================

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa' check (length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_idx on public.ai_chat_sessions (user_id, updated_at desc);

alter table public.ai_chat_sessions enable row level security;

drop policy if exists ai_chat_sessions_all_own on public.ai_chat_sessions;
create policy ai_chat_sessions_all_own on public.ai_chat_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists ai_chat_sessions_set_updated_at on public.ai_chat_sessions;
create trigger ai_chat_sessions_set_updated_at before update on public.ai_chat_sessions
  for each row execute function public.set_updated_at();

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(btrim(content)) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_session_idx on public.ai_chat_messages (session_id, created_at);

alter table public.ai_chat_messages enable row level security;

drop policy if exists ai_chat_messages_all_own on public.ai_chat_messages;
create policy ai_chat_messages_all_own on public.ai_chat_messages
  for all to authenticated
  using (exists (
    select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid()
  ));
