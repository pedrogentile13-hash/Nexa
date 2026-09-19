-- ============================================================================
-- Nexa — 0909 (2) · Leituras administrativas de desempenho/estudo por aluno
--
-- `subject_scores`/`performance_evolution`/`simulado_history` são `security
-- invoker` de propósito (migration 0907 (4)): a RLS de `quiz_attempts`/
-- `resource_progress`/`study_sessions`/`subjects`/`user_stats` restringe cada
-- aluno à própria linha, e isso é o que impede a nota de um aluno vazar para
-- outro. Essas seis funções são a ÚNICA porta pela qual um admin lê o
-- desempenho de OUTRO usuário — cada uma autoriza primeiro (`is_admin()` ou
-- `can_manage_school()` da escola do ALVO, nunca de quem chama) e só então
-- lê o dado. `security definer` aqui não é um jeito de "furar" a RLS por
-- engano: é o mesmo mecanismo que já faz `is_admin()` funcionar dentro de
-- políticas de `profiles` sem recursão, e que `notify_subject_students` já
-- usa para gravar notificação para outro usuário — aplicado a leitura em vez
-- de escrita, com a MESMA disciplina de checar autorização por dentro antes
-- de tocar em qualquer linha.
-- ============================================================================

create or replace function public.admin_subject_scores(p_target_user_id uuid)
returns table (
  subject_id uuid, subject_name text, subject_color text, has_content boolean,
  assessment_score numeric, empenho_index numeric, blended_score numeric,
  quizzes_done integer, simulados_done integer, content_completed integer,
  target_grade numeric, passing_grade numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.subject_scores(p_target_user_id);
end;
$$;

create or replace function public.admin_performance_evolution(
  p_target_user_id uuid,
  p_weeks integer default 12
)
returns table (
  week_start date, assessment_score numeric, empenho_index numeric, blended_score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.performance_evolution(p_target_user_id, p_weeks);
end;
$$;

create or replace function public.admin_simulado_history(p_target_user_id uuid)
returns table (
  attempt_id uuid, resource_id uuid, resource_title text, subject_id uuid,
  subject_name text, subject_color text, correct_count integer, total_count integer,
  percent numeric, duration_seconds integer, finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.simulado_history(p_target_user_id);
end;
$$;

-- Linhas cruas, não já agrupadas por semana: o agrupamento por semana ISO já
-- existe em TypeScript (`groupByWeek`, performance/server/queries.ts) — não
-- faz sentido reescrever a mesma conta em SQL só porque quem lê mudou.
create or replace function public.admin_study_sessions(p_target_user_id uuid)
returns table (local_date date, duration_seconds integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select ss.local_date, ss.duration_seconds
    from public.study_sessions ss
    where ss.user_id = p_target_user_id and ss.ended_at is not null
    order by ss.local_date;
end;
$$;

create or replace function public.admin_user_stats(p_target_user_id uuid)
returns table (
  xp integer, level smallint, current_streak integer, longest_streak integer,
  total_study_seconds bigint, last_active_local_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
    select us.xp, us.level, us.current_streak, us.longest_streak,
           us.total_study_seconds, us.last_active_local_date
    from public.user_stats us
    where us.user_id = p_target_user_id;
end;
$$;

-- Agregado por escola (ou toda a base, só pra admin geral) — uma função só,
-- pra /admin/relatorios não precisar somar aluno por aluno no TypeScript.
-- `p_school_id is null` = "todas as escolas", liberado só quando
-- `is_admin()` (can_manage_school(null) é sempre falso por definição).
create or replace function public.admin_school_summary(p_school_id uuid default null)
returns table (
  student_count integer,
  active_last_7d_count integer,
  total_study_seconds bigint,
  avg_current_streak numeric,
  quizzes_done_30d integer,
  simulados_done_30d integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or (p_school_id is not null and public.can_manage_school(p_school_id))) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  with scope as (
    select p.id from public.profiles p
    where p.role = 'student' and (p_school_id is null or p.school_id = p_school_id)
  )
  select
    (select count(*) from scope)::integer,
    (select count(*) from public.user_stats us join scope s on s.id = us.user_id
       where us.last_active_local_date >= (current_date - interval '7 days')::date)::integer,
    coalesce((select sum(us.total_study_seconds) from public.user_stats us join scope s on s.id = us.user_id), 0)::bigint,
    coalesce((select avg(us.current_streak) from public.user_stats us join scope s on s.id = us.user_id), 0),
    (select count(*) from public.quiz_attempts qa join public.resources r on r.id = qa.resource_id
       join scope s on s.id = qa.user_id
       where r.kind = 'quiz' and qa.finished_at >= now() - interval '30 days')::integer,
    (select count(*) from public.quiz_attempts qa join public.resources r on r.id = qa.resource_id
       join scope s on s.id = qa.user_id
       where r.kind = 'simulado' and qa.finished_at >= now() - interval '30 days')::integer;
end;
$$;

grant execute on function public.admin_subject_scores(uuid) to authenticated;
grant execute on function public.admin_performance_evolution(uuid, integer) to authenticated;
grant execute on function public.admin_simulado_history(uuid) to authenticated;
grant execute on function public.admin_study_sessions(uuid) to authenticated;
grant execute on function public.admin_user_stats(uuid) to authenticated;
grant execute on function public.admin_school_summary(uuid) to authenticated;
