-- ============================================================================
-- Nexa Study — 0908 (6) · Nota de atividades substitui o empenho composto
--
-- Pedido do usuário: os 30% da nota que não são prova devem refletir
-- ATIVIDADES — conteúdo publicado na matéria que o aluno concluiu ou não —
-- e nada mais. Regularidade (dias ativos) e sequência (streak) saem da conta:
-- eram um proxy de esforço, mas não são "atividade" no sentido de tarefa que
-- existe pra ser feita.
--
-- Fórmula nova dos 30%:
--
--   atividades = (conteúdo concluído / conteúdo publicado na matéria) × 10
--
-- Com 1 atividade publicada, só existem dois resultados possíveis (0 ou 10);
-- com 2, três (0, 5, 10); e assim por diante — é a tabela que o usuário
-- descreveu, sem arredondamento escondido.
--
-- Sem conteúdo publicado na matéria ainda: fica nulo (não é 0 nem 10 — não há
-- o que medir), mesma regra de "nunca fabricar nota" que já vale para
-- `assessment_score`. Nesse caso a nota da matéria usa só o avaliativo, sem
-- forçar a divisão por 30%/70% sobre um lado vazio.
--
-- `empenho_index` continua sendo o nome da coluna (0–100) — é só o cálculo
-- que muda; o rótulo "Empenho (30%)" na tela de Matérias segue correto porque
-- 30% da nota é exatamente o que essa coluna representa.
--
-- `performance_evolution()` (o gráfico de evolução semanal) mantém a fórmula
-- simplificada e independente que já tinha antes (60% conteúdo + 40%
-- regularidade, documentada de propósito como diferente) — o usuário pediu a
-- NOTA da matéria, não o gráfico histórico, e reconstituir "quantas
-- atividades existiam há 8 semanas" para cada matéria não é possível sem
-- inventar dado.
-- ============================================================================

create or replace function public.subject_scores(p_user_id uuid default auth.uid())
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  has_content boolean,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric,
  quizzes_done integer,
  simulados_done integer,
  content_completed integer,
  target_grade numeric,
  passing_grade numeric
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
  attempt_scored as (
    select
      r.subject_catalog_id,
      r.kind,
      la.correct_count::numeric / greatest(la.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight
    from latest_attempt la
    join public.resources r on r.id = la.resource_id
    where r.kind in ('quiz', 'simulado')
  ),
  assessment as (
    select
      subject_catalog_id,
      sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score,
      count(*) filter (where kind = 'quiz') as quizzes_done,
      count(*) filter (where kind = 'simulado') as simulados_done
    from attempt_scored
    group by subject_catalog_id
  ),
  -- Atividade = conteúdo (resumo/podcast/vídeo/imagem) PUBLICADO e visível
  -- para este aluno — mesma regra de visibilidade de `resource_library()`:
  -- global (sem escola) ou da escola dele.
  content_available as (
    select r.subject_catalog_id, count(*) as content_total
    from public.resources r
    where r.kind in ('resumo', 'podcast', 'video', 'imagem')
      and r.is_published
      and (r.school_id is null or r.school_id = public.current_school_id(p_user_id))
    group by r.subject_catalog_id
  ),
  content_done as (
    select r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem')
    group by r.subject_catalog_id
  ),
  atividades as (
    select
      ca.subject_catalog_id,
      case
        when ca.content_total = 0 then null
        else round(coalesce(cd.content_completed, 0)::numeric / ca.content_total * 10, 2)
      end as atividades_score
    from content_available ca
    left join content_done cd on cd.subject_catalog_id = ca.subject_catalog_id
  )
  select
    s.id,
    s.name,
    s.color,
    s.catalog_id is not null,
    round(a.assessment_score, 2),
    coalesce(act.atividades_score, 0) * 10,
    case
      when a.assessment_score is not null and act.atividades_score is not null
        then round(a.assessment_score * 0.7 + act.atividades_score * 0.3, 2)
      when a.assessment_score is not null
        then round(a.assessment_score, 2)
    end,
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(cd.content_completed, 0)::integer,
    s.target_grade,
    6.0
  from public.subjects s
  left join assessment a on a.subject_catalog_id = s.catalog_id
  left join content_done cd on cd.subject_catalog_id = s.catalog_id
  left join atividades act on act.subject_catalog_id = s.catalog_id
  where s.user_id = p_user_id and s.archived_at is null
  order by s.sort_order, s.name;
$$;

comment on function public.subject_scores(uuid) is
  'Nota automática por matéria (70% avaliativo + 30% atividades concluídas) — substitui o boletim manual.';

grant execute on function public.subject_scores(uuid) to authenticated;
