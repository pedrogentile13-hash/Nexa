-- ============================================================================
-- Biblioteca: a contagem de questões passa a funcionar para o ALUNO.
--
-- Problema: `v_resource_library` contava `public.questions` com os direitos de quem está logado, e o aluno não tem
-- (de propósito) permissão de leitura nessa tabela — o gabarito mora lá. Para o aluno, todo quiz e simulado vinha
-- com 0 questões, e o app escondia "quiz/simulado sem questões": a Biblioteca dele ficava só com resumos.
--
-- Solução: a contagem sai por uma função própria (security definer) que devolve apenas o NÚMERO de questões de um
-- conteúdo publicado — nunca o enunciado, as alternativas ou o gabarito. A visão continua com `security_invoker`,
-- então quem enxerga cada conteúdo continua sendo decidido pela RLS de `resources`.
-- Idempotente.
-- ============================================================================

create or replace function public.resource_question_count(p_resource_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.questions q
  join public.resources r on r.id = q.resource_id
  where q.resource_id = p_resource_id
    and r.is_published;
$$;

revoke execute on function public.resource_question_count(uuid) from public, anon;
grant execute on function public.resource_question_count(uuid) to authenticated;

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
  public.resource_question_count(r.id) as question_count,
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
grant execute on function public.resource_question_count(uuid) to authenticated;
