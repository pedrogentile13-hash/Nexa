-- ============================================================================
-- Nexa — Portal da equipe (professor, coordenação, direção)
--
-- Duas leituras para o novo portal "Nexa Escola":
--   · `staff_classes_overview` — cada turma com alunos, quantos estudaram na semana e quem leciona;
--   · `staff_roster` — os alunos, com atividade e XP.
-- Quem vê o quê: coordenação/direção (e o admin geral) veem a escola toda;
-- o professor vê SÓ as turmas em que leciona.
-- ============================================================================

-- Turmas que o usuário pode ver na escola dele (ou na informada, para o admin geral).
create or replace function public.staff_visible_classes(p_school_id uuid default null)
returns table (class_id uuid, school_id uuid)
language sql stable security definer set search_path = public as $$
  with me as (
    select p.id, p.role, coalesce(p_school_id, p.school_id) as school_id
    from public.profiles p where p.id = auth.uid()
  )
  select c.id, c.school_id
  from public.classes c, me
  where c.school_id = me.school_id
    and (
      public.school_staff_level(c.school_id) >= 2
      or exists (select 1 from public.teacher_assignments ta where ta.teacher_id = me.id and ta.class_id = c.id)
    );
$$;

grant execute on function public.staff_visible_classes(uuid) to authenticated;

create or replace function public.staff_classes_overview(p_school_id uuid default null)
returns table (
  class_id uuid,
  class_name text,
  student_count integer,
  active_7d integer,
  never_active integer,
  avg_xp integer,
  teachers text
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    c.name,
    count(s.id)::int,
    count(s.id) filter (where u.last_active_local_date >= (now() at time zone 'America/Sao_Paulo')::date - 6)::int,
    count(s.id) filter (where u.last_active_local_date is null)::int,
    coalesce(round(avg(u.xp)), 0)::int,
    coalesce((
      select string_agg(distinct t.full_name, ', ' order by t.full_name)
      from public.teacher_assignments ta
      join public.profiles t on t.id = ta.teacher_id
      where ta.class_id = c.id
    ), '')
  from public.staff_visible_classes(p_school_id) v
  join public.classes c on c.id = v.class_id
  left join public.profiles s on s.class_id = c.id and s.role = 'student'
  left join public.user_stats u on u.user_id = s.id
  group by c.id, c.name
  order by c.name;
$$;

grant execute on function public.staff_classes_overview(uuid) to authenticated;

create or replace function public.staff_roster(p_class_id uuid default null, p_search text default null)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_id uuid,
  class_name text,
  school_login text,
  xp integer,
  level integer,
  current_streak integer,
  last_active date,
  week_minutes integer
)
language sql stable security definer set search_path = public as $$
  select
    s.id,
    coalesce(s.full_name, 'Sem nome'),
    s.avatar_url,
    c.id,
    c.name,
    s.school_login,
    coalesce(u.xp, 0),
    coalesce(u.level, 1)::int,
    coalesce(u.current_streak, 0),
    u.last_active_local_date,
    coalesce((
      select round(sum(ss.duration_seconds) / 60.0)
      from public.study_sessions ss
      where ss.user_id = s.id and ss.ended_at is not null
        and ss.local_date >= (now() at time zone 'America/Sao_Paulo')::date - 6
    ), 0)::int
  from public.staff_visible_classes(null) v
  join public.classes c on c.id = v.class_id
  join public.profiles s on s.class_id = c.id and s.role = 'student'
  left join public.user_stats u on u.user_id = s.id
  where (p_class_id is null or c.id = p_class_id)
    and (p_search is null or p_search = '' or s.full_name ilike '%' || p_search || '%')
  order by s.full_name
  limit 500;
$$;

grant execute on function public.staff_roster(uuid, text) to authenticated;

-- Alunos da escola SEM turma: coordenação/direção precisam achá-los para colocar numa.
create or replace function public.staff_unassigned_students()
returns table (user_id uuid, full_name text, school_login text)
language sql stable security definer set search_path = public as $$
  select s.id, coalesce(s.full_name, 'Sem nome'), s.school_login
  from public.profiles me
  join public.profiles s on s.school_id = me.school_id and s.role = 'student' and s.class_id is null
  where me.id = auth.uid() and public.school_staff_level(me.school_id) >= 2
  order by s.full_name
  limit 200;
$$;

grant execute on function public.staff_unassigned_students() to authenticated;

-- Coordenação/direção colocam um aluno da escola numa turma da MESMA escola (ou o tiram dela).
create or replace function public.staff_set_student_class(p_user_id uuid, p_class_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_student public.profiles%rowtype;
begin
  select * into v_student from public.profiles where id = p_user_id;
  if not found or v_student.role is distinct from 'student' or v_student.school_id is null then
    raise exception 'aluno não encontrado' using errcode = 'P0002';
  end if;
  if public.school_staff_level(v_student.school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if p_class_id is not null and not exists (
    select 1 from public.classes c where c.id = p_class_id and c.school_id = v_student.school_id
  ) then
    raise exception 'turma de outra escola' using errcode = '22023';
  end if;
  update public.profiles set class_id = p_class_id where id = p_user_id;
end;
$$;

grant execute on function public.staff_set_student_class(uuid, uuid) to authenticated;
