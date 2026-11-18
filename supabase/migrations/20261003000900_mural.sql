-- ============================================================================
-- Nexa — Mural de avisos oficiais da escola, com confirmação de leitura
--
-- O problema que isto resolve: aviso da escola se perde em grupo de WhatsApp,
-- e ninguém sabe quem viu. Aqui o aviso é OFICIAL (só a escola publica), fica
-- guardado, chega no sino do aluno, e quem publicou vê quantos leram e QUEM
-- ainda não leu.
--
-- Quem publica: coordenação/direção (escola toda ou qualquer turma) e
-- professor (só turma em que leciona) — mesma regra dos eventos. Quem lê:
-- membros da escola dentro da audiência. Escrita só por função.
-- ============================================================================

create table if not exists public.school_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- Nulo = escola toda.
  class_id uuid references public.classes (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  body text not null check (length(btrim(body)) between 1 and 4000),
  pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists school_announcements_school_idx on public.school_announcements (school_id, created_at desc);

alter table public.school_announcements enable row level security;

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.school_announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

alter table public.announcement_reads enable row level security;

-- --------------------------------------------------------------- visibilidade --
create or replace function public.can_view_announcement(p_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.school_announcements a
    join public.profiles u on u.id = p_user_id
    where a.id = p_id
      and (
        a.author_id = p_user_id
        or public.is_admin(p_user_id)
        or public.school_staff_level(a.school_id, p_user_id) >= 2
        or (
          u.school_id = a.school_id
          and (
            a.class_id is null
            or u.class_id = a.class_id
            or exists (
              select 1 from public.teacher_assignments ta
              where ta.teacher_id = p_user_id and ta.class_id = a.class_id
            )
          )
        )
      )
  );
$$;

grant execute on function public.can_view_announcement(uuid, uuid) to authenticated;

create or replace function public.can_manage_announcement(p_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.school_announcements a
    where a.id = p_id
      and (a.author_id = p_user_id or public.is_admin(p_user_id) or public.school_staff_level(a.school_id, p_user_id) >= 2)
  );
$$;

grant execute on function public.can_manage_announcement(uuid, uuid) to authenticated;

drop policy if exists school_announcements_select on public.school_announcements;
create policy school_announcements_select on public.school_announcements
  for select to authenticated using (public.can_view_announcement(id));

drop policy if exists announcement_reads_select_own on public.announcement_reads;
create policy announcement_reads_select_own on public.announcement_reads
  for select to authenticated using (user_id = auth.uid());
-- (Sem policy de escrita: tudo passa pelas funções abaixo.)

-- ---------------------------------------------------------------- publicar --
create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_class_id uuid default null,
  p_pinned boolean default false,
  p_expires_at timestamptz default null
)
returns table (announcement_id uuid, notified_user_ids uuid[])
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
  v_class_school uuid;
  v_id uuid;
  v_users uuid[];
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if v_school is null then
    raise exception 'seu perfil não está ligado a uma escola' using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'a validade precisa ser no futuro' using errcode = '22023';
  end if;

  if p_class_id is not null then
    select school_id into v_class_school from public.classes where id = p_class_id;
    if v_class_school is distinct from v_school then
      raise exception 'turma não pertence à sua escola' using errcode = '22023';
    end if;
  end if;

  -- Mesma regra dos eventos: gestão da escola publica para qualquer turma ou
  -- para a escola toda; professor só para turma em que leciona.
  if not public.can_create_school_event(v_school, p_class_id, v_me) then
    raise exception 'só a escola publica avisos (coordenação, direção ou o professor da turma)' using errcode = '42501';
  end if;

  insert into public.school_announcements (school_id, author_id, class_id, title, body, pinned, expires_at)
  values (v_school, v_me, p_class_id, btrim(p_title), btrim(p_body), coalesce(p_pinned, false), p_expires_at)
  returning id into v_id;

  -- Quem recebe no sino: alunos da audiência + professores (da turma, ou da escola toda).
  select coalesce(array_agg(distinct x.id), '{}') into v_users
  from (
    select p.id from public.profiles p
    where p.school_id = v_school and p.role = 'student'
      and (p_class_id is null or p.class_id = p_class_id)
    union
    select ta.teacher_id from public.teacher_assignments ta
    where ta.school_id = v_school and (p_class_id is null or ta.class_id = p_class_id)
  ) x
  where x.id <> v_me;

  insert into public.notifications (user_id, title, body, link)
  select u, left(btrim(p_title), 160), left(btrim(p_body), 500), '/avisos'
  from unnest(v_users) u;

  return query select v_id, v_users;
end;
$$;

grant execute on function public.create_announcement(text, text, uuid, boolean, timestamptz) to authenticated;

-- ------------------------------------------------------------------- ler --
create or replace function public.mark_announcement_read(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.can_view_announcement(p_id) then
    raise exception 'aviso não encontrado' using errcode = '42501';
  end if;
  insert into public.announcement_reads (announcement_id, user_id)
  values (p_id, auth.uid())
  on conflict do nothing;
end;
$$;

grant execute on function public.mark_announcement_read(uuid) to authenticated;

-- (reaplicar por cima de um banco já atualizado: a versão nova devolve mais colunas)
drop function if exists public.list_announcements(integer);

create or replace function public.list_announcements(p_limit integer default 50)
returns table (
  id uuid,
  title text,
  body text,
  author_name text,
  class_name text,
  pinned boolean,
  created_at timestamptz,
  is_read boolean,
  can_manage boolean,
  read_count integer,
  audience_size integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    a.id,
    a.title,
    a.body,
    coalesce(au.full_name, 'Escola'),
    c.name,
    a.pinned,
    a.created_at,
    exists (select 1 from public.announcement_reads r where r.announcement_id = a.id and r.user_id = v_me),
    public.can_manage_announcement(a.id, v_me),
    case when public.can_manage_announcement(a.id, v_me) then
      (select count(*) from public.announcement_reads r
         join public.profiles s on s.id = r.user_id
        where r.announcement_id = a.id and s.role = 'student')::int
    end,
    case when public.can_manage_announcement(a.id, v_me) then
      (select count(*) from public.profiles s
        where s.school_id = a.school_id and s.role = 'student'
          and (a.class_id is null or s.class_id = a.class_id))::int
    end
  from public.school_announcements a
  left join public.profiles au on au.id = a.author_id
  left join public.classes c on c.id = a.class_id
  where public.can_view_announcement(a.id, v_me)
    and (a.expires_at is null or a.expires_at > now())
  order by a.pinned desc, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

grant execute on function public.list_announcements(integer) to authenticated;

-- Quem leu e quem não leu — só para quem gerencia o aviso.
create or replace function public.announcement_readers(p_id uuid)
returns table (user_id uuid, full_name text, class_name text, read_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  select s.id, coalesce(s.full_name, 'Aluno'), c.name, r.read_at
  from public.school_announcements a
  join public.profiles s on s.school_id = a.school_id and s.role = 'student'
    and (a.class_id is null or s.class_id = a.class_id)
  left join public.classes c on c.id = s.class_id
  left join public.announcement_reads r on r.announcement_id = a.id and r.user_id = s.id
  where a.id = p_id
  order by (r.read_at is not null), s.full_name;
end;
$$;

grant execute on function public.announcement_readers(uuid) to authenticated;

create or replace function public.unread_announcements_count()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.school_announcements a
  where public.can_view_announcement(a.id)
    and a.author_id <> auth.uid()
    and (a.expires_at is null or a.expires_at > now())
    and not exists (select 1 from public.announcement_reads r where r.announcement_id = a.id and r.user_id = auth.uid());
$$;

grant execute on function public.unread_announcements_count() to authenticated;

create or replace function public.delete_announcement(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  delete from public.school_announcements where id = p_id;
end;
$$;

grant execute on function public.delete_announcement(uuid) to authenticated;
