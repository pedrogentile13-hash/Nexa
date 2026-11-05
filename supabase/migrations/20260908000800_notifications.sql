-- ============================================================================
-- Nexa Study — 0908 (8) · Notificações (central no app + push no aparelho)
--
-- Duas tabelas, dois propósitos diferentes:
--
--   • `notifications`      — o que aparece no sininho dentro do app. Sempre
--     existe, independente do aluno ter aceitado push ou não.
--   • `push_subscriptions` — o "endereço" do navegador/aparelho pra onde o
--     servidor pode empurrar um aviso mesmo com o app fechado. Um usuário
--     pode ter mais de uma (celular + computador), por isso é tabela própria
--     em vez de uma coluna em `profiles`.
--
-- Gatilho real, não fabricado: por enquanto só um evento cria notificação —
-- um admin publica conteúdo novo numa matéria que o aluno cursa
-- (`notify_subject_students`, chamada por `saveResource`/
-- `toggleResourcePublished`). Mais gatilhos entram conforme o produto pedir;
-- não inventamos uma central cheia de avisos que nada dispara de verdade.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  body text check (body is null or length(btrim(body)) <= 500),
  -- Caminho relativo do app pra onde o toque leva (ex.: '/estudar/<id>').
  -- Nulo quando o aviso não tem destino próprio.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

-- Só marcar como lida — o conteúdo do aviso não é do aluno editar.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------- push_subscriptions --
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_all_own on public.push_subscriptions;
create policy push_subscriptions_all_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --------------------------------------------------- notify_subject_students --
-- `security definer` porque isto grava notificação PARA OUTRO usuário — RLS
-- de `notifications` só deixa cada um escrever a própria. Só admin/
-- school_admin pode chamar, checado aqui dentro, não só pela grant.
create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'school_admin')
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null;
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text) to authenticated;
