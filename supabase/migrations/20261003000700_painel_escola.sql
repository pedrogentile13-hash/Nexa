-- ============================================================================
-- Nexa — Painel da escola (direção e coordenação)
--
-- Duas leituras agregadas para a visão geral de quem gerencia uma escola:
--   * `school_overview`          — números da escola de relance
--   * `school_teacher_overview`  — uma linha por professor (o que a coordenação
--                                  supervisiona: respostas cadastradas e
--                                  perguntas de alunos esperando)
--
-- Só nível de coordenação para cima (`school_staff_level >= 2`) da PRÓPRIA
-- escola, ou a plataforma. Professor não chama (não enxerga os colegas) e
-- coordenação de outra escola também não.
--
-- Devolvem NÚMEROS, nunca linhas de alunos: o painel mostra quantos nunca
-- entraram, não quem — a lista nominal já existe em /admin/contas, onde a
-- coordenação a vê porque administra aquelas contas.
-- ============================================================================

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
       left join public.user_stats u on u.user_id = p.id
      where p.school_id = p_school_id and p.school_login is not null and p.role = 'student'
        and u.last_active_local_date is null)::int,
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

create or replace function public.school_teacher_overview(p_school_id uuid)
returns table (
  teacher_id uuid,
  full_name text,
  classes text,
  faq_count integer,
  pending_count integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.school_staff_level(p_school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  select
    t.id,
    coalesce(t.full_name, 'Professor'),
    coalesce((select string_agg(distinct c.name, ', ' order by c.name)
                from public.teacher_assignments ta join public.classes c on c.id = ta.class_id
               where ta.teacher_id = t.id), ''),
    (select count(*) from public.teacher_faq f where f.teacher_id = t.id and f.active)::int,
    (select count(*) from public.bot_messages b
       join public.bot_conversations cv on cv.id = b.conversation_id
      where cv.teacher_id = t.id and b.sender = 'bot' and b.status = 'unanswered')::int
  from public.profiles t
  where t.school_id = p_school_id and t.role = 'teacher_admin'
  order by 5 desc, 2;
end;
$$;

grant execute on function public.school_teacher_overview(uuid) to authenticated;
