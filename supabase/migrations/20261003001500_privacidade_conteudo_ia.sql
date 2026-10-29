-- ============================================================================
-- Nexa — Conteúdo criado por IA é PRIVADO de quem criou
--
-- Brecha: a policy `resources_manage` deixava a direção, a coordenação e os
-- professores da escola LEREM (e editarem) tudo que a escola tem em `resources`,
-- inclusive os resumos e simulados que cada aluno criou com a IA. E a Biblioteca
-- (`v_resource_library`) mostrava o conteúdo privado de todos para o admin geral.
--
-- Agora: conteúdo de IA só é visto pelo dono — ou, depois que a escola aprova o
-- pedido de publicação (visibilidade 'school'), por quem pode ver pela regra
-- normal. O admin geral continua podendo APAGAR (moderação), mas não vê o
-- conteúdo privado alheio na Biblioteca.
-- ============================================================================

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

-- Biblioteca: conteúdo oficial + o SEU conteúdo de IA + conteúdo de IA que alguém
-- publicou para você (nunca o privado dos outros, nem para admin).
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
