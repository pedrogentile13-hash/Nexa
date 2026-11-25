-- ============================================================================
-- Nexa — 0912 (4) · Push notifications reais
--
-- `push_subscriptions` existe desde 0908 (8) mas nada nunca leu essa tabela —
-- o sino in-app sempre funcionou, o "aviso mesmo com o app fechado" nunca foi
-- ligado. O envio de verdade mora no lado TypeScript (`src/lib/push/send.ts`,
-- via `web-push` + a service role key, que ignora RLS de propósito pra poder
-- ler a assinatura de QUALQUER destinatário — nunca do cliente, só de uma
-- Server Action que já decidiu quem avisar).
--
-- O que falta aqui: `notify_subject_students`/`notify_class` só INSERIAM em
-- `notifications` e devolviam `void` — quem chamou não ficava sabendo QUEM
-- foi notificado, e sem isso não dá pra mandar push pra ninguém (a lista de
-- destinatários morre dentro da função). As duas passam a devolver
-- `setof uuid` com os `user_id` efetivamente notificados — mesmo INSERT de
-- sempre, só que com `returning`, sem mudar quem recebe notificação nem a
-- regra de autorização de nenhuma das duas.
--
-- `notify_user` (amizade) não precisa mudar: quem chama já sabe o
-- destinatário de antemão (é um parâmetro), então o TS de
-- `respondFriendRequest` já tem o id pra mandar push sem precisar que o
-- banco devolva nada a mais.
-- ============================================================================

drop function if exists public.notify_subject_students(uuid, text, text, text, uuid);

create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null,
  p_school_id uuid default null
)
returns setof uuid
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

  return query
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and (p_school_id is null or p.school_id = p_school_id)
  returning user_id;
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text, uuid) to authenticated;

drop function if exists public.notify_class(uuid, uuid, uuid, text, text, text);

create or replace function public.notify_class(
  p_class_id uuid,
  p_subject_catalog_id uuid,
  p_school_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and p.school_id = p_school_id
    and p.class_id = p_class_id
  returning user_id;
end;
$$;

grant execute on function public.notify_class(uuid, uuid, uuid, text, text, text) to authenticated;
