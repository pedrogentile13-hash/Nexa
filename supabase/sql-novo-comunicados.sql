alter table public.classes add column if not exists grade text;
create or replace function public.parse_class_grade(p_name text)
returns text language plpgsql immutable set search_path = public as $$
declare
  n text := lower(btrim(coalesce(p_name, '')));
  d text := substring(n from '([0-9])');
begin
  if d is null then return null; end if;
  if n ~ '(^|[^a-z])em([^a-z]|$)' or n ~ 'm[ée]dio' or n ~ 's[ée]rie' then
    return case when d in ('1', '2', '3') then d || 'em' end;
  end if;
  return case when d in ('6', '7', '8', '9') then d end;
end;
$$;
alter table public.classes drop constraint if exists classes_grade_check;
alter table public.classes add constraint classes_grade_check
  check (grade is null or grade in ('6', '7', '8', '9', '1em', '2em', '3em'));
update public.classes set grade = public.parse_class_grade(name) where grade is null;
create or replace function public.classes_set_grade()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.grade is null then new.grade := public.parse_class_grade(new.name); end if;
  return new;
end;
$$;
drop trigger if exists classes_set_grade on public.classes;
create trigger classes_set_grade before insert on public.classes
  for each row execute function public.classes_set_grade();
create or replace function public.grade_label(p_grade text)
returns text language sql immutable set search_path = public as $$
  select case p_grade
    when '1em' then '1º EM' when '2em' then '2º EM' when '3em' then '3º EM'
    else p_grade || 'º ano' end;
$$;
alter table public.school_announcements add column if not exists audience text not null default 'school';
alter table public.school_announcements add column if not exists grades text[];
alter table public.school_announcements drop constraint if exists school_announcements_audience_check;
alter table public.school_announcements add constraint school_announcements_audience_check
  check (audience in ('school', 'class', 'grades', 'students'));
update public.school_announcements set audience = 'class' where class_id is not null and audience = 'school';
create table if not exists public.announcement_targets (
  announcement_id uuid not null references public.school_announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (announcement_id, user_id)
);
alter table public.announcement_targets enable row level security;
create or replace function public.announcement_student_ids(p_id uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select s.id
  from public.school_announcements a
  join public.profiles s on s.school_id = a.school_id and s.role = 'student'
  where a.id = p_id
    and case a.audience
      when 'students' then exists (select 1 from public.announcement_targets t where t.announcement_id = a.id and t.user_id = s.id)
      when 'grades' then exists (select 1 from public.classes c where c.id = s.class_id and c.grade = any (a.grades))
      when 'class' then s.class_id = a.class_id
      else true
    end;
$$;
revoke execute on function public.announcement_student_ids(uuid) from public, anon, authenticated;
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
          and case a.audience
            when 'school' then true
            when 'class' then u.class_id = a.class_id
              or exists (select 1 from public.teacher_assignments ta where ta.teacher_id = p_user_id and ta.class_id = a.class_id)
            when 'grades' then exists (select 1 from public.classes c where c.id = u.class_id and c.grade = any (a.grades))
              or exists (select 1 from public.teacher_assignments ta join public.classes c on c.id = ta.class_id
                         where ta.teacher_id = p_user_id and c.grade = any (a.grades))
            else exists (select 1 from public.announcement_targets t where t.announcement_id = a.id and t.user_id = p_user_id)
          end
        )
      )
  );
$$;
drop function if exists public.create_announcement(text, text, uuid, boolean, timestamptz);
create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_class_id uuid default null,
  p_pinned boolean default false,
  p_expires_at timestamptz default null,
  p_grades text[] default null,
  p_student_ids uuid[] default null
)
returns table (announcement_id uuid, notified_user_ids uuid[])
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
  v_class_school uuid;
  v_id uuid;
  v_users uuid[];
  v_audience text := 'school';
  v_manager boolean;
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
  v_manager := public.can_manage_school(v_school, v_me);
  if coalesce(array_length(p_student_ids, 1), 0) > 0 then
    v_audience := 'students';
    if (select count(*) from public.profiles s where s.id = any (p_student_ids) and s.school_id = v_school and s.role = 'student')
       <> (select count(distinct x) from unnest(p_student_ids) x) then
      raise exception 'há aluno que não é da sua escola' using errcode = '22023';
    end if;
    if not v_manager then
      if public.school_staff_level(v_school, v_me) <> 1 or exists (
        select 1 from public.profiles s
        where s.id = any (p_student_ids)
          and not exists (select 1 from public.teacher_assignments ta where ta.teacher_id = v_me and ta.class_id = s.class_id)
      ) then
        raise exception 'você só avisa alunos das suas turmas' using errcode = '42501';
      end if;
    end if;
    p_class_id := null;
    p_grades := null;
  elsif coalesce(array_length(p_grades, 1), 0) > 0 then
    v_audience := 'grades';
    if exists (select 1 from unnest(p_grades) g where g not in ('6', '7', '8', '9', '1em', '2em', '3em')) then
      raise exception 'ano inválido' using errcode = '22023';
    end if;
    if not v_manager then
      raise exception 'só coordenação e direção avisam por ano' using errcode = '42501';
    end if;
    p_class_id := null;
  else
    p_grades := null;
    if p_class_id is not null then
      v_audience := 'class';
      select school_id into v_class_school from public.classes where id = p_class_id;
      if v_class_school is distinct from v_school then
        raise exception 'turma não pertence à sua escola' using errcode = '22023';
      end if;
    end if;
    if not public.can_create_school_event(v_school, p_class_id, v_me) then
      raise exception 'só a escola publica avisos (coordenação, direção ou o professor da turma)' using errcode = '42501';
    end if;
  end if;
  insert into public.school_announcements (school_id, author_id, class_id, title, body, pinned, expires_at, audience, grades)
  values (v_school, v_me, p_class_id, btrim(p_title), btrim(p_body), coalesce(p_pinned, false), p_expires_at, v_audience, p_grades)
  returning id into v_id;
  if v_audience = 'students' then
    insert into public.announcement_targets (announcement_id, user_id)
    select v_id, x from unnest(p_student_ids) x on conflict do nothing;
  end if;
  select coalesce(array_agg(distinct x.id), '{}') into v_users
  from (
    select public.announcement_student_ids(v_id) as id
    union
    select ta.teacher_id from public.teacher_assignments ta
    left join public.classes c on c.id = ta.class_id
    where v_audience <> 'students' and ta.school_id = v_school
      and case v_audience
        when 'class' then ta.class_id = p_class_id
        when 'grades' then c.grade = any (p_grades)
        else true
      end
  ) x
  where x.id <> v_me;
  insert into public.notifications (user_id, title, body, link)
  select u, left(btrim(p_title), 160), left(btrim(p_body), 500), '/avisos'
  from unnest(v_users) u;
  return query select v_id, v_users;
end;
$$;
grant execute on function public.create_announcement(text, text, uuid, boolean, timestamptz, text[], uuid[]) to authenticated;
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
  audience_size integer,
  audience_label text
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
        where r.announcement_id = a.id and r.user_id in (select public.announcement_student_ids(a.id)))::int
    end,
    case when public.can_manage_announcement(a.id, v_me) then
      (select count(*) from public.announcement_student_ids(a.id))::int
    end,
    case a.audience
      when 'class' then 'Turma ' || coalesce(c.name, '')
      when 'students' then (select count(*) from public.announcement_targets t where t.announcement_id = a.id)::text
        || case when (select count(*) from public.announcement_targets t where t.announcement_id = a.id) = 1 then ' aluno' else ' alunos' end
      when 'grades' then case
        when a.grades @> array['6','7','8','9'] and cardinality(a.grades) = 4 then 'Fundamental II (6º ao 9º)'
        when a.grades @> array['1em','2em','3em'] and cardinality(a.grades) = 3 then 'Ensino Médio (1º ao 3º)'
        else (select string_agg(public.grade_label(g), ', ' order by g) from unnest(a.grades) g)
      end
      else 'Toda a escola'
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
create or replace function public.announcement_readers(p_id uuid)
returns table (user_id uuid, full_name text, class_name text, read_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
  select s.id, coalesce(s.full_name, 'Aluno'), c.name, r.read_at
  from public.announcement_student_ids(p_id) sid
  join public.profiles s on s.id = sid
  left join public.classes c on c.id = s.class_id
  left join public.announcement_reads r on r.announcement_id = p_id and r.user_id = s.id
  order by (r.read_at is not null), s.full_name;
end;
$$;
grant execute on function public.announcement_readers(uuid) to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
