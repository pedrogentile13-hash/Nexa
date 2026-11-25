-- "Nunca entrou" passa a medir LOGIN de verdade (auth.users.last_sign_in_at),
-- não atividade de estudo. Antes usava user_stats.last_active_local_date, que só
-- é preenchido quando o aluno faz uma ação que dá XP/streak: quem logava e só
-- olhava a tela continuava aparecendo como "nunca entrou".
-- "Parados há 7+ dias" continua baseado em atividade (last_active_local_date).

-- 1) Lista de alunos: ganha last_sign_in_at (muda o tipo de retorno, por isso drop + create).
drop function if exists public.staff_roster(uuid, text);

create function public.staff_roster(p_class_id uuid default null, p_search text default null)
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
  week_minutes integer,
  last_sign_in_at timestamptz
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
    ), 0)::int,
    au.last_sign_in_at
  from public.staff_visible_classes(null) v
  join public.classes c on c.id = v.class_id
  join public.profiles s on s.class_id = c.id and s.role = 'student'
  left join public.user_stats u on u.user_id = s.id
  left join auth.users au on au.id = s.id
  where (p_class_id is null or c.id = p_class_id)
    and (p_search is null or p_search = '' or s.full_name ilike '%' || p_search || '%')
  order by s.full_name
  limit 500;
$$;

grant execute on function public.staff_roster(uuid, text) to authenticated;

-- 2) Cards das turmas: "nunca entraram" pelo login.
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
    count(s.id) filter (where au.last_sign_in_at is null)::int,
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
  left join auth.users au on au.id = s.id
  group by c.id, c.name
  order by c.name;
$$;

grant execute on function public.staff_classes_overview(uuid) to authenticated;

-- 3) Painel da escola: "nunca entraram" pelo login (o resto da função fica igual).
create or replace function public.school_overview(p_school_id uuid)
returns table (
  students integer,
  teachers integer,
  managed_accounts integer,
  students_without_class integer,
  active_last_7_days integer,
  never_entered integer,
  pending_questions integer,
  upcoming_events integer,
  ai_uses_today integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if public.school_staff_level(p_school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'student')::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'teacher_admin')::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.school_login is not null)::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'student' and p.class_id is null)::int,
    (select count(*) from public.profiles p
       join public.user_stats u on u.user_id = p.id
      where p.school_id = p_school_id and p.role = 'student' and u.last_active_local_date >= v_today - 6)::int,
    (select count(*) from public.profiles p
       left join auth.users au on au.id = p.id
      where p.school_id = p_school_id and p.school_login is not null and p.role = 'student'
        and au.last_sign_in_at is null)::int,
    (select count(*) from public.bot_messages b
       join public.bot_conversations c on c.id = b.conversation_id
       join public.profiles t on t.id = c.teacher_id
      where t.school_id = p_school_id and b.sender = 'bot' and b.status = 'unanswered')::int,
    (select count(*) from public.events e
      where e.school_id = p_school_id and e.cancelled_at is null
        and e.starts_at >= now() and e.starts_at < now() + interval '30 days')::int,
    coalesce((select sum(a.uses) from public.ai_usage a
       join public.profiles p on p.id = a.user_id
      where p.school_id = p_school_id and a.day = v_today), 0)::int;
end;
$$;

grant execute on function public.school_overview(uuid) to authenticated;

-- Nunca expor a função a anon.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
