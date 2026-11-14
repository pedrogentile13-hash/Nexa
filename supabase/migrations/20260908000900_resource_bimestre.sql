-- ============================================================================
-- Nexa Study — 0908 (9) · Bimestre no acervo
--
-- Biblioteca ganha um filtro por bimestre — enum fixo 1–4, não pasta livre —
-- mesmo padrão de `tracks.category`. `null` significa "vale o ano todo / não
-- amarrado a um bimestre específico" e é o default: nenhum recurso existente
-- fica classificado errado por causa desta migração.
--
-- Não é o mesmo `terms`/`academic_years` do calendário pessoal do aluno
-- (onboarding, `timetable_slots.term_id`) — aquilo é uma linha por aluno por
-- período; isto é uma classificação do conteúdo em si, escrita pelo admin uma
-- vez, valendo para todo mundo que enxerga o recurso.
-- ============================================================================

alter table public.resources
  add column if not exists bimestre smallint
    check (bimestre is null or bimestre between 1 and 4);

create index if not exists resources_bimestre_idx
  on public.resources (bimestre) where bimestre is not null;

-- `create or replace view` recusa mudar o conjunto de colunas de uma view
-- existente — e como esta migration é reaplicada (via setup-completo.sql)
-- por cima de um banco onde a definição ORIGINAL de `v_resource_library`
-- (sem `bimestre`, de 20260904000200) acabou de rodar de novo, `replace`
-- quebraria com "cannot drop columns from view". `drop` + `create` resolve:
-- nada mais depende desta view (é folha), então o drop é seguro.
drop view if exists public.v_resource_library;

create view public.v_resource_library
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
where r.is_published;

comment on view public.v_resource_library is
  'Biblioteca publicada e visível para quem consulta, já com matéria e assunto resolvidos.';
