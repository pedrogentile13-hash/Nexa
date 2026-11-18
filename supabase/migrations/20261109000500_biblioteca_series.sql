-- ============================================================================
-- Nexa — Biblioteca por série (6º ano ao 3º ano do EM)
--
-- A Biblioteca passa a poder filtrar por série. Para isso a visão `v_resource_library` ganha a coluna
-- `grade_levels` (as séries a que o conteúdo se destina), no fim, sem mudar nada do resto.
-- ============================================================================

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
  r.bimestre,
  r.grade_levels
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published
  and (
    not r.ai_generated
    or r.created_by = auth.uid()
    or (r.visibility is distinct from 'private' and public.can_view_resource(r.id))
  );

grant select on public.v_resource_library to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
