-- ============================================================================
-- Nexa — Hierarquia escolar e eventos exclusivos da escola
--
-- Dois pedidos num só movimento, porque um depende do outro:
--
--   1. Direção > coordenação > professor. Até aqui só existia `school_admin`
--      (gerencia a escola), `teacher_admin` (professor) e `admin` (plataforma).
--      Painel escolar, eventos e o chat com bot por professor precisam saber
--      QUEM é direção e QUEM é coordenação — a coordenação enxerga os
--      professores; o professor não enxerga a coordenação.
--
--   2. Evento oficial é exclusivo da escola. Comunidades continuam livres
--      (posts, chat, membros), mas dono/moderador de comunidade deixa de
--      poder criar evento: "o evento da escola" não pode ser algo que
--      qualquer aluno que abriu uma comunidade consiga publicar.
--
-- Decisão de compatibilidade: direção e coordenação são `school_admin` com um
-- título (`profiles.school_title`). Assim passam por `can_manage_school` e por
-- toda checagem `role in ('admin','school_admin')` que já existe, ganhando a
-- gestão da PRÓPRIA escola sem reescrever nenhuma policy — presos a `school_id`.
-- ============================================================================

-- ------------------------------------------------------------------ papéis --
-- Direção e coordenação NÃO são papéis novos: continuam `school_admin`, com um
-- título. Motivo: ao menos seis pontos do schema (upload de arquivo, avisos,
-- push, escrita de conteúdo) checam `role in ('admin', 'school_admin')`, e
-- reescrever cada um é arriscar divergir da versão atual de cada função. Com
-- o título, tudo que já aceita `school_admin` passa a aceitar os dois, e o
-- que importa para a hierarquia (quem vê quem) lê o título.
--
--   school_title = null          → administrador da escola (nível de direção)
--   school_title = 'direcao'     → direção
--   school_title = 'coordenacao' → coordenação (enxerga os professores)
alter table public.profiles add column if not exists school_title text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_school_title_check') then
    alter table public.profiles add constraint profiles_school_title_check
      check (school_title is null or school_title in ('direcao', 'coordenacao'));
  end if;
end;
$$;

comment on column public.profiles.school_title is
  'Só vale para role = school_admin: direcao | coordenacao | null (administrador da escola).';

-- A trava de papel agora cobre o título também: sem isso, uma coordenadora
-- faria `update profiles set school_title = 'direcao'` e subiria de nível
-- (profiles_update_own libera a linha inteira).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.school_title is distinct from old.school_title)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Nível hierárquico DENTRO de uma escola: 4 plataforma, 3 direção/admin da
-- escola, 2 coordenação, 1 professor da escola, 0 nenhum. Comparar números é
-- mais difícil de errar do que repetir listas de papéis em cada policy.
create or replace function public.school_staff_level(p_school_id uuid, p_user_id uuid default auth.uid())
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when p.role = 'admin' then 4
      when p.school_id is distinct from p_school_id then 0
      when p.role = 'school_admin' and p.school_title = 'coordenacao' then 2
      when p.role = 'school_admin' then 3
      when p.role = 'teacher_admin' then 1
      else 0
    end
    from public.profiles p where p.id = p_user_id
  ), 0);
$$;

grant execute on function public.school_staff_level(uuid, uuid) to authenticated;

-- A coordenação (ou acima) enxerga o professor; um professor NÃO enxerga outro
-- professor nem a coordenação. Base do painel da escola.
create or replace function public.can_oversee_teacher(p_teacher_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles t
    where t.id = p_teacher_id
      and t.role = 'teacher_admin'
      and t.school_id is not null
      and public.school_staff_level(t.school_id, p_user_id) >= 2
  );
$$;

grant execute on function public.can_oversee_teacher(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------- eventos --
-- Evento pode ser da escola toda (class_id nulo) ou de UMA turma.
alter table public.events add column if not exists class_id uuid references public.classes (id) on delete cascade;
create index if not exists events_class_idx on public.events (class_id) where class_id is not null;

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
        or e.created_by = p_user_id
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and public.can_view_community(e.community_id, p_user_id))
        or (e.community_id is null and e.class_id is null and e.visibility = 'public')
        or (e.community_id is null and e.visibility = 'school' and e.school_id = public.current_school_id(p_user_id) and (
          e.class_id is null
          or e.class_id = (select p.class_id from public.profiles p where p.id = p_user_id)
          or exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = p_user_id and ta.class_id = e.class_id
          )
        ))
      )
  );
$$;

-- Quem pode criar evento oficial na escola: gestão da escola (qualquer turma)
-- ou professor (só turmas em que leciona).
create or replace function public.can_create_school_event(p_school_id uuid, p_class_id uuid default null, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.can_manage_school(p_school_id, p_user_id)
    or (
      p_class_id is not null
      and public.school_staff_level(p_school_id, p_user_id) = 1
      and exists (
        select 1 from public.teacher_assignments ta
        where ta.teacher_id = p_user_id and ta.school_id = p_school_id and ta.class_id = p_class_id
      )
    );
$$;

grant execute on function public.can_create_school_event(uuid, uuid, uuid) to authenticated;

-- A UI usa isto só para decidir se mostra o botão "Criar evento".
create or replace function public.can_create_any_event(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (
        p.role = 'admin'
        or (p.school_id is not null and p.role in ('school_admin', 'teacher_admin'))
      )
  );
$$;

grant execute on function public.can_create_any_event(uuid) to authenticated;

-- `create_event` ganha `p_class_id` — assinatura nova, então a antiga precisa
-- sair (CREATE OR REPLACE com parâmetro a mais cria uma SOBRECARGA e o RPC
-- ficaria ambíguo).
drop function if exists public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid);

create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null,
  p_visibility text default 'school',
  p_community_id uuid default null,
  p_school_id uuid default null,
  p_class_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid;
  v_class_school uuid;
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

  -- Escola do evento: a da comunidade (se houver), a escolhida pelo admin da
  -- plataforma, ou a do próprio usuário.
  if p_community_id is not null then
    select school_id into v_school from public.communities where id = p_community_id;
  elsif public.is_admin(v_me) then
    v_school := coalesce(p_school_id, public.current_school_id(v_me));
  else
    v_school := public.current_school_id(v_me);
  end if;

  if v_school is null then
    raise exception 'informe a escola do evento' using errcode = '22023';
  end if;

  if p_class_id is not null then
    select school_id into v_class_school from public.classes where id = p_class_id;
    if v_class_school is distinct from v_school then
      raise exception 'turma não pertence à escola do evento' using errcode = '22023';
    end if;
  end if;

  -- Regra do produto: evento é da ESCOLA. Dono/moderador de comunidade não
  -- basta — comunidade é livre, evento oficial não.
  if not public.can_create_school_event(v_school, p_class_id, v_me) then
    raise exception 'só a escola cria evento (coordenação, direção ou o professor da turma)' using errcode = '42501';
  end if;

  insert into public.events (school_id, community_id, class_id, created_by, title, description, location, starts_at, ends_at, capacity, visibility)
  values (
    v_school, p_community_id, p_class_id, v_me, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), nullif(btrim(coalesce(p_location, '')), ''),
    p_starts_at, p_ends_at, p_capacity, p_visibility
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid, uuid) to authenticated;

-- `list_events` tinha o PRÓPRIO filtro de visibilidade (copiado de
-- `can_view_event` antes de existir turma) e mostraria o evento de uma turma
-- para a escola inteira. Passa a usar a mesma função, uma régua só.
-- Mesma assinatura de retorno, então `create or replace` basta.
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
  where public.can_view_event(e.id, v_me)
    and (not p_upcoming_only or e.starts_at >= now() - interval '1 day')
  order by e.starts_at asc;
end;
$$;

grant execute on function public.list_events(boolean) to authenticated;
