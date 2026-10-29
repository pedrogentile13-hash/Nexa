-- ============================================================================
-- Nexa — A fila de revisão se limpa sozinha
--
-- Erro que ficou 7 dias sem ser revisto, e conteúdo com revisão atrasada há mais
-- de 7 dias, saem da fila. Quem estuda de novo gera revisões novas; o que ficou
-- para trás deixa de acumular culpa.
-- ============================================================================
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
      -- Revisão atrasada há mais de uma semana também sai da fila.
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
    -- Erro que ficou uma semana sem ser revisto sai da fila sozinho.
    where e.answered_at > now() - interval '7 days'
  ),
  combined as (
    select * from error_items
    union all
    select * from content_items
  )
  -- Uma fila de "próximas" sem fim não cabe numa tela diária — atrasadas e
  -- hoje sempre entram, próximas só até duas semanas à frente.
  select * from combined
  where bucket <> 'proxima' or due_date <= current_date + 14
  order by
    case bucket when 'atrasada' then 0 when 'hoje' then 1 when 'proxima' then 2 else 3 end,
    due_date;
$$;

grant execute on function public.review_queue(uuid) to authenticated;
