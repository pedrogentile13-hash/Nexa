-- ============================================================================
-- Nexa Vestibular — Fase 2 · Central de erros + desempenho da preparação
--
-- A Fase 1 criou um SEGUNDO lugar onde o aluno responde questão de
-- vestibular (`practice_answers`, ao lado de `quiz_answers`). Toda leitura
-- de desempenho que enxergasse só um dos dois passaria a mentir — inclusive
-- a `vestibular_overview` que a Fase 0 escreveu, que hoje diz "0 questões"
-- pra quem acabou de treinar 40. Esta fase conserta isso e constrói a
-- central de erros em cima do conjunto completo.
--
-- `vestibular_latest_answers` é a peça central: a resposta MAIS RECENTE de
-- cada questão, venha ela de prova ou de treino. É o mesmo critério de
-- `topic_mastery` (0907), pela mesma razão — quem errou em março e acertou
-- a mesma questão em setembro está bem HOJE, e uma média histórica
-- arrastaria o erro de março pra sempre. A diferença é só a origem dupla.
--
-- Por que UMA função e não o mesmo `with` copiado em cada uma: o critério de
-- "qual resposta vale" é exatamente o tipo de regra que, duplicada em cinco
-- lugares, diverge em três deles na primeira mudança. Aqui ela tem um dono.
--
-- Diferença deliberada entre as duas origens: resposta de prova só conta
-- depois de a tentativa ser finalizada (`finished_at is not null`, mesmo
-- critério de `topic_mastery`), mas resposta de treino conta na hora. Não é
-- inconsistência — no treino a resposta já é definitiva no instante em que é
-- dada (`answer_practice_question` recusa reescrita), então esperar o fim da
-- sessão só atrasaria a central de erros sem proteger nada.
-- ============================================================================

-- Sem parâmetro de usuário de propósito: uma função `security definer` que
-- aceita "de quem?" precisa de uma checagem de autorização própria, e não há
-- caso de uso nesta fase para ler o desempenho de outra pessoa. Sem o
-- parâmetro, não há o que autorizar.
create or replace function public.vestibular_latest_answers()
returns table (
  question_id uuid,
  is_correct boolean,
  answered_at timestamptz,
  source text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (u.question_id) u.question_id, u.is_correct, u.answered_at, u.source
  from (
    select ans.question_id, ans.is_correct, ans.answered_at, 'prova'::text as source
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    join public.resources r on r.id = a.resource_id
    where a.user_id = auth.uid()
      and a.finished_at is not null
      and ans.option_id is not null
      and r.context = 'vestibular'

    union all

    select pa.question_id, pa.is_correct, pa.answered_at, 'treino'::text
    from public.practice_answers pa
    join public.practice_sessions ps on ps.id = pa.session_id
    where ps.user_id = auth.uid() and pa.option_id is not null
  ) u
  order by u.question_id, u.answered_at desc;
$$;

comment on function public.vestibular_latest_answers is
  'Resposta mais recente de cada questão de vestibular, de prova ou de treino — base única de toda leitura de desempenho da preparação.';

grant execute on function public.vestibular_latest_answers() to authenticated;

-- ----------------------------------------------------------------------------
-- Desempenho por matéria.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_subject_performance()
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  correct_count bigint,
  total_count bigint,
  accuracy_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.id,
    sc.name,
    sc.default_color,
    count(*) filter (where la.is_correct),
    count(*),
    round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  group by sc.id, sc.name, sc.default_color
  order by round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100), sc.name;
$$;

grant execute on function public.vestibular_subject_performance() to authenticated;

-- ----------------------------------------------------------------------------
-- Desempenho por assunto — do mais fraco pro mais forte, que é a ordem em que
-- a informação é útil.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_topic_performance(
  p_subject_catalog_id uuid default null
)
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  correct_count bigint,
  total_count bigint,
  accuracy_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.id,
    sc.name,
    sc.default_color,
    q.topic_id,
    coalesce(t.name, 'Geral'),
    count(*) filter (where la.is_correct),
    count(*),
    round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  left join public.content_topics t on t.id = q.topic_id
  where p_subject_catalog_id is null or sc.id = p_subject_catalog_id
  group by sc.id, sc.name, sc.default_color, q.topic_id, t.name
  order by round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100), coalesce(t.name, 'Geral');
$$;

grant execute on function public.vestibular_topic_performance(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Central de erros: as questões que o aluno erra HOJE.
--
-- Aqui o gabarito e a explicação PODEM aparecer — toda questão desta lista já
-- foi respondida e corrigida. Não é um caminho novo pro gabarito: é o mesmo
-- que `practice_session_review` e `quiz_attempt_review` já abrem depois da
-- correção.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_error_list(
  p_subject_catalog_id uuid default null,
  p_limit integer default 30
)
returns table (
  question_id uuid,
  statement text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  exam_name text,
  edition_year smallint,
  difficulty text,
  correct_option_body text,
  explanation text,
  source text,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.statement,
    sc.id,
    sc.name,
    sc.default_color,
    t.name,
    e.name,
    ed.year,
    q.difficulty,
    (select o.body from public.question_options o where o.question_id = q.id and o.is_correct),
    q.explanation,
    la.source,
    la.answered_at
  from public.vestibular_latest_answers() la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = coalesce(q.subject_catalog_id, r.subject_catalog_id)
  left join public.content_topics t on t.id = q.topic_id
  left join public.exams e on e.id = r.exam_id
  left join public.exam_editions ed on ed.id = r.exam_edition_id
  where not la.is_correct
    and (p_subject_catalog_id is null or sc.id = p_subject_catalog_id)
  order by la.answered_at desc
  limit greatest(1, least(100, coalesce(p_limit, 30)));
$$;

grant execute on function public.vestibular_error_list(uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Refazer os erros: abre uma sessão de prática montada só com o que o aluno
-- erra hoje.
--
-- Reaproveita `practice_sessions` inteiro em vez de inventar um "modo
-- revisão" paralelo — o player, a correção e o XP da Fase 1 valem aqui sem
-- uma linha nova de UI.
-- ----------------------------------------------------------------------------
create or replace function public.start_error_practice(
  p_subject_catalog_id uuid default null,
  p_question_count integer default 10
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_ids uuid[];
  v_id uuid;
  v_limit integer := greatest(1, least(50, coalesce(p_question_count, 10)));
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('vestibular_enabled') then
    raise exception 'a área de vestibular está desativada' using errcode = '42501';
  end if;

  select array_agg(x.question_id order by x.answered_at desc)
    into v_ids
  from (
    select la.question_id, la.answered_at
    from public.vestibular_latest_answers() la
    join public.questions q on q.id = la.question_id
    join public.resources r on r.id = q.resource_id
    where not la.is_correct
      and public.can_view_resource(r.id, v_me)
      and (p_subject_catalog_id is null
           or coalesce(q.subject_catalog_id, r.subject_catalog_id) = p_subject_catalog_id)
    order by la.answered_at desc
    limit v_limit
  ) x;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'nenhum erro pendente com esses filtros' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, question_ids, subject_catalog_id, total_count)
  values (v_me, v_ids, p_subject_catalog_id, cardinality(v_ids))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_error_practice(uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- `vestibular_overview` passa a enxergar o treino.
--
-- Só o bloco `answers` muda (era quiz_answers puro, agora é
-- `vestibular_latest_answers`) e um `practices_done` novo entra no retorno.
-- O resto é byte-a-byte a versão da Fase 0 — inclusive o contador regressivo,
-- que não tem nada a ver com esta mudança.
--
-- `answers` agora conta uma questão UMA vez, pela resposta mais recente, em
-- vez de contar cada tentativa. Isso baixa o número total de quem refez a
-- mesma prova duas vezes — e é a leitura certa: "acertei 68% das questões que
-- já vi" diz algo, "acertei 68% das vezes que respondi alguma coisa" não.
-- ----------------------------------------------------------------------------
drop function if exists public.vestibular_overview();

create or replace function public.vestibular_overview()
returns table (
  exam_name text,
  edition_year smallint,
  application_date date,
  days_until integer,
  questions_answered bigint,
  correct_answers bigint,
  accuracy_percent numeric,
  quizzes_done bigint,
  simulados_done bigint,
  practices_done bigint,
  essays_submitted bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  target as (
    select e.name, ed.year, ed.application_date
    from me
    join public.vestibular_profiles vp on vp.user_id = me.uid
    join public.exams e on e.id = vp.main_exam_id
    left join lateral (
      select ed2.year, ed2.application_date
      from public.exam_editions ed2
      where ed2.exam_id = e.id
        and (vp.target_year is null or ed2.year = vp.target_year)
        and ed2.application_date >= current_date
      order by ed2.application_date
      limit 1
    ) ed on true
  ),
  answers as (
    select la.is_correct from public.vestibular_latest_answers() la
  ),
  attempts as (
    select r.kind
    from me
    join public.quiz_attempts a on a.user_id = me.uid and a.finished_at is not null
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
  ),
  practices as (
    select count(*) as total
    from me
    join public.practice_sessions ps on ps.user_id = me.uid and ps.finished_at is not null
  ),
  essays as (
    select count(*) as total
    from me
    join public.quiz_attempts a on a.user_id = me.uid
    join public.resources r on r.id = a.resource_id and r.context = 'vestibular'
    join public.essay_submissions es on es.attempt_id = a.id and es.is_submitted
  )
  select
    (select name from target),
    (select year from target),
    (select application_date from target),
    (select (application_date - current_date)::integer from target),
    (select count(*) from answers),
    (select count(*) filter (where is_correct) from answers),
    (select case when count(*) = 0 then null
            else round(count(*) filter (where is_correct)::numeric / count(*) * 100, 1) end
     from answers),
    (select count(*) filter (where kind = 'quiz') from attempts),
    (select count(*) filter (where kind = 'simulado') from attempts),
    (select total from practices),
    (select total from essays);
$$;

grant execute on function public.vestibular_overview() to authenticated;
