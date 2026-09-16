-- ============================================================================
-- Nexa Community — Fases 7-10 · Eventos escolares
--
-- As quatro fases do plano original (criar evento, inscrição/lista de
-- espera, check-in por QR, certificado) viram uma migração só — são a
-- mesma tabela de ponta a ponta (`events` → `event_registrations` →
-- `attendance` → `certificates`), sem peça independente o bastante pra
-- valer a pena separar em 4 migrações e 4 fases de feature flag.
--
-- Quem CRIA evento: dono/moderador da comunidade (quando o evento nasce
-- dentro de uma) ou quem já gerencia a escola/admin (fora de uma comunidade)
-- — igual à criação de comunidade, evento não é aberto a qualquer aluno.
-- Depois de criado, inscrição é livre pra quem enxerga o evento.
--
-- Check-in por QR "assinado no servidor": o código (`check_in_code`) nunca é
-- validado no cliente — o QR só carrega o código, um organizador com o
-- celular (câmera nativa, sem scanner dentro do app) abre o link, e
-- `check_in_by_code` confere no banco se quem está logado pode gerenciar
-- AQUELE evento antes de gravar presença. Sem lib de QR-scan nova; só
-- geração (`qrcode`, adicionada ao projeto).
--
-- Certificado não é um arquivo gerado e guardado — é uma PÁGINA que só abre
-- pra quem tem presença confirmada, impressa/exportada como PDF pelo
-- diálogo nativo do navegador (mesmo padrão já usado pros relatórios do
-- admin, ADR-044). `certificates` só registra QUE foi emitido, não o
-- conteúdo.
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 120),
  description text check (description is null or length(description) <= 2000),
  location text check (location is null or length(location) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  capacity integer check (capacity is null or capacity > 0),
  -- Só vale quando `community_id` é nulo — evento de comunidade herda a
  -- visibilidade da própria comunidade, mesmo desenho de `posts.community_id`.
  visibility text not null default 'school' check (visibility in ('school', 'public')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_school_starts_idx on public.events (school_id, starts_at);
create index if not exists events_community_idx on public.events (community_id) where community_id is not null;

alter table public.events enable row level security;

create table if not exists public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  check_in_code text not null,
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  primary key (event_id, user_id)
);

create unique index if not exists event_registrations_code_uq on public.event_registrations (check_in_code);
create index if not exists event_registrations_status_idx on public.event_registrations (event_id, status, registered_at);

alter table public.event_registrations enable row level security;

create table if not exists public.attendance (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users (id) on delete set null,
  primary key (event_id, user_id)
);

alter table public.attendance enable row level security;

create table if not exists public.certificates (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  issued_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.certificates enable row level security;
-- (As 4 tabelas acima: RLS ativa, sem policy — mesmo padrão RPC-only do resto da Community.)

-- `tasks` ganha o valor 'evento' (só pra Agenda já existente reconhecer a
-- linha) e uma referência de volta pro evento, pra `cancel_registration`/
-- `cancel_event` saberem qual task apagar sem adivinhar por título.
alter table public.tasks drop constraint if exists tasks_kind_check;
alter table public.tasks add constraint tasks_kind_check
  check (kind in ('task', 'homework', 'reading', 'review', 'exercise', 'project', 'custom', 'prova', 'evento'));
alter table public.tasks add column if not exists related_event_id uuid references public.events (id) on delete cascade;
create unique index if not exists tasks_related_event_uq
  on public.tasks (user_id, related_event_id) where related_event_id is not null;

-- ----------------------------------------------------------------------------
-- Visibilidade e gerência
-- ----------------------------------------------------------------------------
create or replace function public.can_view_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        public.is_admin(p_user_id)
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and public.can_view_community(e.community_id, p_user_id))
        or (e.community_id is null and (
          e.visibility = 'public'
          or (e.visibility = 'school' and e.school_id = public.current_school_id(p_user_id))
        ))
      )
  );
$$;

grant execute on function public.can_view_event(uuid, uuid) to authenticated;

create or replace function public.can_manage_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        e.created_by = p_user_id
        or public.is_admin(p_user_id)
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and exists (
          select 1 from public.community_members m
          where m.community_id = e.community_id and m.user_id = p_user_id and m.role in ('owner', 'moderator')
        ))
      )
  );
$$;

grant execute on function public.can_manage_event(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Criar / editar / cancelar
-- ----------------------------------------------------------------------------
create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null,
  p_visibility text default 'school',
  p_community_id uuid default null,
  -- Só usado quando quem cria é admin GERAL fora de uma comunidade — admin
  -- geral não tem `current_school_id()` (não é aluno de escola nenhuma),
  -- então precisa escolher explicitamente, mesmo padrão de `resolveSchoolId`
  -- já usado no resto do admin (`admin/server/queries.ts`). school_admin e
  -- aluno-dono-de-comunidade continuam presos à própria escola, ignoram este
  -- argumento.
  p_school_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'o fim precisa ser depois do início' using errcode = '22023';
  end if;
  if p_capacity is not null and p_capacity <= 0 then
    raise exception 'capacidade precisa ser maior que zero' using errcode = '22023';
  end if;

  if p_community_id is not null then
    if not (
      public.is_admin(v_me)
      or exists (
        select 1 from public.community_members
        where community_id = p_community_id and user_id = v_me and role in ('owner', 'moderator')
      )
    ) then
      raise exception 'só dono/moderador da comunidade cria evento nela' using errcode = '42501';
    end if;
    select school_id into v_school from public.communities where id = p_community_id;
  elsif public.is_admin(v_me) then
    v_school := coalesce(p_school_id, public.current_school_id(v_me));
  else
    v_school := public.current_school_id(v_me);
    if not public.can_manage_school(v_school, v_me) then
      raise exception 'só quem gerencia a escola cria evento fora de uma comunidade' using errcode = '42501';
    end if;
  end if;

  if v_school is null then
    raise exception 'informe a escola do evento' using errcode = '22023';
  end if;

  insert into public.events (school_id, community_id, created_by, title, description, location, starts_at, ends_at, capacity, visibility)
  values (
    v_school, p_community_id, v_me, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), nullif(btrim(coalesce(p_location, '')), ''),
    p_starts_at, p_ends_at, p_capacity, p_visibility
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid) to authenticated;

create or replace function public.update_event(
  p_event_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'o fim precisa ser depois do início' using errcode = '22023';
  end if;

  update public.events
  set title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      location = nullif(btrim(coalesce(p_location, '')), ''),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      capacity = p_capacity
  where id = p_event_id;
end;
$$;

grant execute on function public.update_event(uuid, text, timestamptz, text, text, timestamptz, integer) to authenticated;

-- Cancelar avisa todo mundo que estava de dentro (registrado ou na fila) e
-- limpa a tarefa correspondente da Agenda de cada um.
create or replace function public.cancel_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_reg record;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  select title into v_title from public.events where id = p_event_id;

  update public.events set cancelled_at = now() where id = p_event_id and cancelled_at is null;

  for v_reg in
    select user_id from public.event_registrations where event_id = p_event_id and status in ('registered', 'waitlisted')
  loop
    delete from public.tasks where user_id = v_reg.user_id and related_event_id = p_event_id;
    perform public.notify_user(v_reg.user_id, 'Evento cancelado', v_title || ' foi cancelado.', null);
  end loop;
end;
$$;

grant execute on function public.cancel_event(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Inscrição / lista de espera
-- ----------------------------------------------------------------------------
create or replace function public.register_for_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_event public.events;
  v_existing public.event_registrations;
  v_registered_count integer;
  v_status text;
  v_code text;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.cancelled_at is not null then
    raise exception 'evento não encontrado ou cancelado' using errcode = 'P0002';
  end if;
  if not public.can_view_event(p_event_id, v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if v_event.starts_at < now() then
    raise exception 'este evento já aconteceu' using errcode = '22023';
  end if;

  select * into v_existing from public.event_registrations where event_id = p_event_id and user_id = v_me;
  if found and v_existing.status in ('registered', 'waitlisted') then
    return v_existing.status; -- já inscrito, idempotente
  end if;

  select count(*) into v_registered_count
  from public.event_registrations where event_id = p_event_id and status = 'registered';

  v_status := case when v_event.capacity is null or v_registered_count < v_event.capacity
    then 'registered' else 'waitlisted' end;
  v_code := encode(gen_random_bytes(6), 'hex');

  insert into public.event_registrations (event_id, user_id, status, check_in_code, registered_at, cancelled_at)
  values (p_event_id, v_me, v_status, v_code, now(), null)
  on conflict (event_id, user_id) do update
    set status = excluded.status, check_in_code = excluded.check_in_code,
        registered_at = now(), cancelled_at = null;

  if v_status = 'registered' then
    insert into public.tasks (user_id, title, kind, due_date, related_event_id)
    values (v_me, v_event.title, 'evento', v_event.starts_at::date, p_event_id)
    on conflict (user_id, related_event_id) where related_event_id is not null do nothing;
  end if;

  return v_status;
end;
$$;

grant execute on function public.register_for_event(uuid) to authenticated;

-- Cancelar a própria inscrição libera vaga pra quem está na frente da fila
-- de espera — promovido ganha a task na Agenda e uma notificação.
create or replace function public.cancel_registration(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_existing public.event_registrations;
  v_promoted_user uuid;
  v_title text;
begin
  select * into v_existing from public.event_registrations where event_id = p_event_id and user_id = v_me;
  if not found or v_existing.status = 'cancelled' then
    return;
  end if;

  update public.event_registrations
  set status = 'cancelled', cancelled_at = now()
  where event_id = p_event_id and user_id = v_me;

  delete from public.tasks where user_id = v_me and related_event_id = p_event_id;

  if v_existing.status = 'registered' then
    select user_id into v_promoted_user
    from public.event_registrations
    where event_id = p_event_id and status = 'waitlisted'
    order by registered_at asc
    limit 1;

    if v_promoted_user is not null then
      update public.event_registrations set status = 'registered'
      where event_id = p_event_id and user_id = v_promoted_user;

      select title into v_title from public.events where id = p_event_id;

      insert into public.tasks (user_id, title, kind, due_date, related_event_id)
      select v_promoted_user, e.title, 'evento', e.starts_at::date, p_event_id
      from public.events e where e.id = p_event_id
      on conflict (user_id, related_event_id) where related_event_id is not null do nothing;

      perform public.notify_user(
        v_promoted_user, 'Vaga liberada!',
        'Abriu uma vaga em "' || v_title || '" e você saiu da lista de espera.',
        '/comunidade/eventos/' || p_event_id::text
      );
    end if;
  end if;
end;
$$;

grant execute on function public.cancel_registration(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Listagem
-- ----------------------------------------------------------------------------
create or replace function public.list_events(p_upcoming_only boolean default true)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  community_id uuid,
  community_name text,
  cancelled_at timestamptz,
  registered_count bigint,
  my_status text,
  can_manage boolean
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
    e.id, e.title, e.description, e.location, e.starts_at, e.ends_at, e.capacity,
    e.community_id, cm.name, e.cancelled_at,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    (select r2.status from public.event_registrations r2 where r2.event_id = e.id and r2.user_id = v_me),
    public.can_manage_event(e.id, v_me)
  from public.events e
  left join public.communities cm on cm.id = e.community_id
  where (
      public.is_admin(v_me)
      or public.can_manage_school(e.school_id, v_me)
      or (e.community_id is not null and public.can_view_community(e.community_id, v_me))
      or (e.community_id is null and (
        e.visibility = 'public'
        or (e.visibility = 'school' and e.school_id = public.current_school_id(v_me))
      ))
    )
    and (not p_upcoming_only or e.starts_at >= now() - interval '1 day')
  order by e.starts_at asc;
end;
$$;

grant execute on function public.list_events(boolean) to authenticated;

create or replace function public.get_event(p_event_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  community_id uuid,
  community_name text,
  cancelled_at timestamptz,
  registered_count bigint,
  waitlisted_count bigint,
  my_status text,
  can_manage boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if not public.can_view_event(p_event_id, v_me) then
    raise exception 'evento não encontrado' using errcode = 'P0002';
  end if;

  return query
  select
    e.id, e.title, e.description, e.location, e.starts_at, e.ends_at, e.capacity,
    e.community_id, cm.name, e.cancelled_at,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'waitlisted'),
    (select r2.status from public.event_registrations r2 where r2.event_id = e.id and r2.user_id = v_me),
    public.can_manage_event(e.id, v_me)
  from public.events e
  left join public.communities cm on cm.id = e.community_id
  where e.id = p_event_id;
end;
$$;

grant execute on function public.get_event(uuid) to authenticated;

create or replace function public.list_event_registrants(p_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  status text,
  registered_at timestamptz,
  checked_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  select r.user_id, pr.full_name, pr.avatar_url, r.status, r.registered_at, a.checked_in_at
  from public.event_registrations r
  join public.profiles pr on pr.id = r.user_id
  left join public.attendance a on a.event_id = r.event_id and a.user_id = r.user_id
  where r.event_id = p_event_id and r.status in ('registered', 'waitlisted')
  order by (r.status = 'waitlisted'), r.registered_at asc;
end;
$$;

grant execute on function public.list_event_registrants(uuid) to authenticated;

-- O próprio ingresso (pra desenhar o QR) — só o código de quem chama, nunca
-- de outra pessoa, e só quando confirmado (nunca revela código de quem está
-- só na lista de espera, que ainda nem tem vaga garantida).
create or replace function public.get_my_event_ticket(p_event_id uuid)
returns table (status text, check_in_code text, checked_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select r.status, case when r.status = 'registered' then r.check_in_code else null end, a.checked_in_at
  from public.event_registrations r
  left join public.attendance a on a.event_id = r.event_id and a.user_id = r.user_id
  where r.event_id = p_event_id and r.user_id = auth.uid();
end;
$$;

grant execute on function public.get_my_event_ticket(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Check-in
-- ----------------------------------------------------------------------------
-- `check_in_code` é único em toda a tabela (não só por evento) — o QR só
-- precisa carregar o código, sem precisar saber de quem é nem de qual
-- evento antes de escanear.
create or replace function public.check_in_by_code(p_code text)
returns table (user_id uuid, full_name text, event_id uuid, event_title text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_reg public.event_registrations;
begin
  select * into v_reg from public.event_registrations where check_in_code = p_code and status = 'registered';
  if not found then
    raise exception 'código inválido ou inscrição não confirmada' using errcode = 'P0002';
  end if;
  if not public.can_manage_event(v_reg.event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  insert into public.attendance (event_id, user_id, checked_in_at, checked_in_by)
  values (v_reg.event_id, v_reg.user_id, now(), auth.uid())
  on conflict (event_id, user_id) do nothing;

  return query
  select pr.id, pr.full_name, e.id, e.title
  from public.profiles pr, public.events e
  where pr.id = v_reg.user_id and e.id = v_reg.event_id;
end;
$$;

grant execute on function public.check_in_by_code(text) to authenticated;

-- Fallback sem QR (celular sem câmera à mão, ou o organizador prefere
-- marcar direto na lista de presença).
create or replace function public.check_in_manually(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and user_id = p_user_id and status = 'registered'
  ) then
    raise exception 'esta pessoa não está inscrita' using errcode = '22023';
  end if;

  insert into public.attendance (event_id, user_id, checked_in_at, checked_in_by)
  values (p_event_id, p_user_id, now(), auth.uid())
  on conflict (event_id, user_id) do nothing;
end;
$$;

grant execute on function public.check_in_manually(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Certificado — emitido (uma vez) na primeira vez que quem fez check-in
-- abre a própria página de certificado, depois do evento ter terminado.
-- ----------------------------------------------------------------------------
create or replace function public.get_my_certificate(p_event_id uuid)
returns table (issued_at timestamptz, event_title text, full_name text, event_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'evento não encontrado' using errcode = 'P0002';
  end if;
  if coalesce(v_event.ends_at, v_event.starts_at) > now() then
    raise exception 'o evento ainda não terminou' using errcode = '22023';
  end if;
  if not exists (select 1 from public.attendance a where a.event_id = p_event_id and a.user_id = v_me) then
    raise exception 'certificado só pra quem fez check-in no evento' using errcode = '42501';
  end if;

  insert into public.certificates (event_id, user_id) values (p_event_id, v_me)
  on conflict (event_id, user_id) do nothing;

  return query
  select c.issued_at, v_event.title, pr.full_name, v_event.starts_at::date
  from public.certificates c
  join public.profiles pr on pr.id = c.user_id
  where c.event_id = p_event_id and c.user_id = v_me;
end;
$$;

grant execute on function public.get_my_certificate(uuid) to authenticated;

update public.feature_flags set enabled = true where key in ('events_enabled', 'certificates_enabled');
