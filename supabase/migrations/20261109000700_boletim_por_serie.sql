-- ============================================================================
-- Nexa — boletim por série
--
-- A nota de cada matéria, separada pela SÉRIE do conteúdo (6º ano ao 3º ano do EM): o aluno vê o boletim do 7º ano,
-- do 8º ano etc., usando as mesmas regras do boletim geral (última tentativa de cada quiz e simulado; simulado pesa 2).
-- Conteúdo sem série marcada não entra aqui (continua só no boletim geral).
-- ============================================================================

create or replace function public.report_card_by_grade(p_user_id uuid default auth.uid())
returns table (
  grade_level text,
  subject_catalog_id uuid,
  subject_name text,
  subject_color text,
  assessment_score numeric,
  quizzes_done integer,
  simulados_done integer,
  content_completed integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_attempt as (
    select distinct on (qa.resource_id)
      qa.resource_id, qa.correct_count, qa.total_count
    from public.quiz_attempts qa
    where qa.user_id = p_user_id and qa.finished_at is not null
    order by qa.resource_id, qa.finished_at desc
  ),
  scored as (
    select
      g as grade_level,
      r.subject_catalog_id,
      r.kind,
      la.correct_count::numeric / greatest(la.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as weight
    from latest_attempt la
    join public.resources r on r.id = la.resource_id
    cross join lateral unnest(r.grade_levels) as g
    where r.kind in ('quiz', 'simulado') and r.context = 'school'
  ),
  assessment as (
    select
      grade_level,
      subject_catalog_id,
      sum(percent * weight) / nullif(sum(weight), 0) * 10 as assessment_score,
      count(*) filter (where kind = 'quiz') as quizzes_done,
      count(*) filter (where kind = 'simulado') as simulados_done
    from scored
    group by grade_level, subject_catalog_id
  ),
  content_done as (
    select g as grade_level, r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    cross join lateral unnest(r.grade_levels) as g
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem') and r.context = 'school'
    group by g, r.subject_catalog_id
  ),
  keys as (
    select grade_level, subject_catalog_id from assessment
    union
    select grade_level, subject_catalog_id from content_done
  )
  select
    k.grade_level,
    k.subject_catalog_id,
    sc.name,
    sc.default_color,
    round(a.assessment_score, 2),
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(d.content_completed, 0)::integer
  from keys k
  join public.subject_catalog sc on sc.id = k.subject_catalog_id
  left join assessment a on a.grade_level = k.grade_level and a.subject_catalog_id = k.subject_catalog_id
  left join content_done d on d.grade_level = k.grade_level and d.subject_catalog_id = k.subject_catalog_id
  order by k.grade_level, sc.name;
$$;

comment on function public.report_card_by_grade(uuid) is
  'Boletim por série: nota por matéria separada pela série do conteúdo (mesmas regras do boletim geral).';

grant execute on function public.report_card_by_grade(uuid) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
