drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources
  for all to authenticated
  using (
    public.is_admin()
    or (not ai_generated and (public.can_manage_school(school_id) or public.is_teacher_of(school_id, subject_catalog_id)))
  )
  with check (
    public.is_admin()
    or (not ai_generated and (public.can_manage_school(school_id) or public.is_teacher_of(school_id, subject_catalog_id)))
  );
drop policy if exists questions_manage on public.questions;
create policy questions_manage on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ));
drop policy if exists question_options_manage on public.question_options;
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ));
create or replace view public.v_resource_library
with (security_invoker = true) as
select
  r.id,
  r.kind,
  r.title,
  r.subtitle,
  r.description,
  r.thumbnail_url,
  r.duration_seconds,
  r.difficulty,
  r.xp_reward,
  r.school_id,
  r.subject_catalog_id,
  sc.name  as subject_name,
  sc.slug  as subject_slug,
  sc.default_color as subject_color,
  r.topic_id,
  t.name   as topic_name,
  r.sort_order,
  r.published_at,
  (select count(*) from public.questions q where q.resource_id = r.id) as question_count,
  r.bimestre
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published
  and (
    not r.ai_generated
    or r.created_by = auth.uid()
    or (r.visibility is distinct from 'private' and public.can_view_resource(r.id))
  );
create or replace function public.move_person_school(p_user_id uuid, p_school_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_target public.profiles%rowtype;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  select * into v_target from public.profiles where id = p_user_id;
  if not found then
    raise exception 'pessoa não encontrada' using errcode = 'P0002';
  end if;
  if v_target.role is distinct from 'student' then
    raise exception 'só alunos podem ser movidos aqui' using errcode = '22023';
  end if;
  if v_target.school_login is not null then
    raise exception 'esta conta foi criada pela escola: apague-a em Contas da escola' using errcode = '22023';
  end if;
  if not public.is_admin(v_me) then
    if v_target.school_id is null
       or p_school_id is not null
       or public.school_staff_level(v_target.school_id, v_me) < 2 then
      raise exception 'não autorizado' using errcode = '42501';
    end if;
  end if;
  if p_school_id is not null and not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'escola inválida' using errcode = '22023';
  end if;
  update public.profiles set school_id = p_school_id, class_id = null where id = p_user_id;
end;
$$;
grant execute on function public.move_person_school(uuid, uuid) to authenticated;
create or replace function public.review_queue(p_user_id uuid default auth.uid())
returns table (
  kind text,
  bucket text,
  question_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  statement text,
  explanation text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz,
  due_date date,
  next_interval_step integer,
  resource_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  with last_review as (
    select distinct on (cr.resource_id)
      cr.resource_id,
      cr.reviewed_at,
      cr.interval_step
    from public.content_reviews cr
    where cr.user_id = p_user_id
    order by cr.resource_id, cr.reviewed_at desc
  ),
  candidates as (
    select
      rp.resource_id,
      coalesce(lr.reviewed_at, rp.completed_at) as anchor_at,
      coalesce(lr.interval_step, -1) as last_step
    from public.resource_progress rp
    left join last_review lr on lr.resource_id = rp.resource_id
    where rp.user_id = p_user_id
      and rp.completed_at is not null
  ),
  scheduled as (
    select
      c.resource_id,
      (c.anchor_at + (case
        when c.last_step <= 0 then 3
        when c.last_step = 1 then 7
        when c.last_step = 2 then 14
        else 30
      end) * interval '1 day')::date as due_date,
      least(c.last_step + 1, 3) as next_interval_step
    from candidates c
  ),
  content_items as (
    select
      'conteudo'::text as kind,
      case
        when exists (
          select 1 from public.content_reviews cr2
          where cr2.user_id = p_user_id and cr2.resource_id = s.resource_id
            and cr2.reviewed_at::date = current_date
        ) then 'concluida'
        when s.due_date < current_date then 'atrasada'
        when s.due_date = current_date then 'hoje'
        else 'proxima'
      end as bucket,
      null::uuid as question_id,
      r.id as resource_id,
      r.title as resource_title,
      r.subject_catalog_id as subject_id,
      sc.name as subject_name,
      sc.default_color as subject_color,
      t.name as topic_name,
      null::text as statement,
      null::text as explanation,
      null::text as chosen_body,
      null::text as correct_body,
      null::timestamptz as answered_at,
      s.due_date,
      s.next_interval_step,
      r.kind::text as resource_kind
    from scheduled s
    join public.resources r on r.id = s.resource_id
    join public.subject_catalog sc on sc.id = r.subject_catalog_id
    left join public.content_topics t on t.id = r.topic_id
    where r.kind not in ('quiz', 'simulado')
      and s.due_date >= current_date - 7
  ),
  error_items as (
    select
      'erro'::text as kind,
      'hoje'::text as bucket,
      e.question_id,
      e.resource_id,
      e.resource_title,
      e.subject_id,
      e.subject_name,
      e.subject_color,
      e.topic_name,
      e.statement,
      e.explanation,
      e.chosen_body,
      e.correct_body,
      e.answered_at,
      current_date as due_date,
      0 as next_interval_step,
      null::text as resource_kind
    from public.recent_errors(p_user_id) e
    where e.answered_at > now() - interval '7 days'
  ),
  combined as (
    select * from error_items
    union all
    select * from content_items
  )
  select * from combined
  where bucket <> 'proxima' or due_date <= current_date + 14
  order by
    case bucket when 'atrasada' then 0 when 'hoje' then 1 when 'proxima' then 2 else 3 end,
    due_date;
$$;
grant execute on function public.review_queue(uuid) to authenticated;
