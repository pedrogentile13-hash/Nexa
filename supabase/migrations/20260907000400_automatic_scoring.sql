-- ============================================================================
-- Nexa — 0907 (4) · Motor de avaliação automática
--
-- Substitui a nota digitada por uma nota calculada, matéria por matéria, a
-- partir do que o aluno já faz dentro do Nexa. Nenhuma tabela de snapshot,
-- nenhum cron: tudo em tempo de consulta, mesmo padrão de `topic_mastery()`
-- (migration 0907 (2)). Nenhuma das três funções abaixo precisa de
-- `security definer` — todas leem só tabelas que o próprio dono já enxerga
-- via RLS (`quiz_attempts`, `resource_progress`, `study_sessions`,
-- `subjects`, `resources` publicados) — diferente de `topic_mastery`, que
-- precisa ler o gabarito em `question_options`.
--
-- Fórmula (documentada com números redondos de propósito, pra dar pra
-- explicar ao aluno "por que essa nota"):
--
--   nota da matéria = 70% avaliativo + 30% empenho
--
--   avaliativo = média ponderada da TENTATIVA MAIS RECENTE de cada
--     quiz/simulado da matéria (simulado pesa 2, quiz pesa 1). Nula se o
--     aluno nunca fez nenhum — nunca vira nota zero por ausência de dado.
--
--   empenho (0–100) = 40% conteúdo concluído (teto em 8 itens — depois disso
--     assistir mais não aumenta o índice, é a defesa contra "maratonar vídeo
--     pra subir nota") + 30% regularidade (dias com estudo nos últimos 14) +
--     30% sequência atual (`user_stats.current_streak`, teto em 14 dias).
-- ============================================================================

-- --------------------------------------------------------------- subject_scores --
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
  content_done as (
    select r.subject_catalog_id, count(distinct rp.resource_id) as content_completed
    from public.resource_progress rp
    join public.resources r on r.id = rp.resource_id
    where rp.user_id = p_user_id and rp.completed_at is not null
      and r.kind in ('resumo', 'podcast', 'video', 'imagem')
    group by r.subject_catalog_id
  ),
  regularity as (
    select ss.subject_id, count(distinct ss.local_date) as active_days
    from public.study_sessions ss
    where ss.user_id = p_user_id
      and ss.local_date >= public.user_local_date(p_user_id) - 13
    group by ss.subject_id
  ),
  streak as (
    select coalesce(
      (select us.current_streak from public.user_stats us where us.user_id = p_user_id), 0
    ) as current_streak
  ),
  empenho as (
    select
      s.id as subject_id,
      least(1, coalesce(cd.content_completed, 0) / 8.0) * 40
      + least(1, coalesce(reg.active_days, 0) / 14.0) * 30
      + least(1, coalesce(st.current_streak, 0) / 14.0) * 30
      as empenho_index
    from public.subjects s
    left join content_done cd on cd.subject_catalog_id = s.catalog_id
    left join regularity reg on reg.subject_id = s.id
    cross join streak st
    where s.user_id = p_user_id and s.archived_at is null
  )
  select
    s.id,
    s.name,
    s.color,
    s.catalog_id is not null,
    round(a.assessment_score, 2),
    round(e.empenho_index, 1),
    case when a.assessment_score is not null
      then round(a.assessment_score * 0.7 + e.empenho_index / 10 * 0.3, 2)
    end,
    coalesce(a.quizzes_done, 0)::integer,
    coalesce(a.simulados_done, 0)::integer,
    coalesce(cd.content_completed, 0)::integer,
    s.target_grade,
    6.0
  from public.subjects s
  left join assessment a on a.subject_catalog_id = s.catalog_id
  left join content_done cd on cd.subject_catalog_id = s.catalog_id
  left join empenho e on e.subject_id = s.id
  where s.user_id = p_user_id and s.archived_at is null
  order by s.sort_order, s.name;
$$;

comment on function public.subject_scores is
  'Nota automática por matéria (70% avaliativo + 30% empenho) — substitui o boletim manual.';

grant execute on function public.subject_scores(uuid) to authenticated;

-- --------------------------------------------------------- performance_evolution --
-- Série semanal CUMULATIVA (cada ponto usa todo o histórico até o fim daquela
-- semana, não só o que aconteceu nela) — uma semana ruim isolada não vira um
-- dente falso no gráfico. A sequência de streak não entra aqui: só o valor
-- ATUAL é armazenado, não um histórico dia a dia, então reconstituir "qual
-- era o streak há 6 semanas" não é possível sem inventar dado. O empenho da
-- evolução usa só os dois sinais reconstituíveis (conteúdo concluído,
-- regularidade), com o peso redistribuído (60/40 em vez de 40/30/30) — por
-- isso o número aqui pode divergir um pouco do `subject_scores` ao vivo, e
-- está documentado assim de propósito, não por descuido.
create or replace function public.performance_evolution(
  p_user_id uuid default auth.uid(),
  p_weeks integer default 12
)
returns table (
  week_start date,
  assessment_score numeric,
  empenho_index numeric,
  blended_score numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with weeks as (
    select date_trunc('week', public.user_local_date(p_user_id))::date - (7 * gs) as week_start
    from generate_series(0, greatest(p_weeks, 1) - 1) as gs
  ),
  bucket as (
    select w.week_start, (w.week_start + 6) as week_end from weeks w
  ),
  attempts as (
    select
      b.week_start,
      qa.correct_count::numeric / greatest(qa.total_count, 1) as percent,
      case when r.kind = 'simulado' then 2 else 1 end as attempt_weight,
      row_number() over (
        partition by b.week_start, qa.resource_id
        order by qa.finished_at desc
      ) as rn
    from bucket b
    join public.quiz_attempts qa
      on qa.user_id = p_user_id and qa.finished_at is not null
      and qa.finished_at::date <= b.week_end
    join public.resources r on r.id = qa.resource_id and r.kind in ('quiz', 'simulado')
  ),
  assessment as (
    select week_start, sum(percent * attempt_weight) / nullif(sum(attempt_weight), 0) * 10 as assessment_score
    from attempts
    where rn = 1
    group by week_start
  ),
  content as (
    select b.week_start, count(distinct rp.resource_id) as content_completed
    from bucket b
    join public.resource_progress rp
      on rp.user_id = p_user_id and rp.completed_at is not null
      and rp.completed_at::date <= b.week_end
    group by b.week_start
  ),
  regularity as (
    select b.week_start, count(distinct ss.local_date) as active_days
    from bucket b
    join public.study_sessions ss
      on ss.user_id = p_user_id
      and ss.local_date between (b.week_end - 13) and b.week_end
    group by b.week_start
  )
  select
    b.week_start,
    round(a.assessment_score, 2),
    round(
      least(1, coalesce(c.content_completed, 0) / 8.0) * 60
      + least(1, coalesce(r.active_days, 0) / 14.0) * 40
    , 1),
    case when a.assessment_score is not null then
      round(
        a.assessment_score * 0.7
        + (
            least(1, coalesce(c.content_completed, 0) / 8.0) * 60
            + least(1, coalesce(r.active_days, 0) / 14.0) * 40
          ) / 10 * 0.3
      , 2)
    end
  from bucket b
  left join assessment a on a.week_start = b.week_start
  left join content c on c.week_start = b.week_start
  left join regularity r on r.week_start = b.week_start
  order by b.week_start;
$$;

comment on function public.performance_evolution is
  'Nota geral acumulada, semana a semana — alimenta o gráfico de evolução em Desempenho.';

grant execute on function public.performance_evolution(uuid, integer) to authenticated;

-- ------------------------------------------------------------- simulado_history --
-- Uma linha por TENTATIVA (não a mais recente só) — o histórico mostra a
-- evolução entre tentativas do mesmo simulado, não só o resultado atual.
create or replace function public.simulado_history(p_user_id uuid default auth.uid())
returns table (
  attempt_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  correct_count integer,
  total_count integer,
  percent numeric,
  duration_seconds integer,
  finished_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    qa.id,
    r.id,
    r.title,
    s.id,
    s.name,
    s.color,
    qa.correct_count,
    qa.total_count,
    round(qa.correct_count::numeric / greatest(qa.total_count, 1) * 100, 1),
    qa.duration_seconds,
    qa.finished_at
  from public.quiz_attempts qa
  join public.resources r on r.id = qa.resource_id and r.kind = 'simulado'
  left join public.subjects s on s.user_id = p_user_id and s.catalog_id = r.subject_catalog_id
  where qa.user_id = p_user_id and qa.finished_at is not null
  order by qa.finished_at desc;
$$;

comment on function public.simulado_history is
  'Uma linha por tentativa de simulado finalizada — alimenta o Histórico de Simulados em Desempenho.';

grant execute on function public.simulado_history(uuid) to authenticated;
