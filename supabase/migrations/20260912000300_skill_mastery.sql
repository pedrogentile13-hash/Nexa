-- ============================================================================
-- Nexa — 0912 (3) · Domínio por habilidade e tipo de erro
--
-- `questions.skills`/`error_types` são gravados desde a v2 (0912 (2)) mas
-- nenhuma tela lia esses dados ainda. Mesmo critério de `topic_mastery()`
-- (0907 (2)): resposta MAIS RECENTE de cada questão, `security definer`
-- porque `questions`/`quiz_answers` não têm policy de SELECT direta para o
-- aluno (é onde mora o gabarito), com o mesmo cuidado de filtrar por
-- `auth.uid()` no corpo — a elevação de privilégio nunca vaza dado de outro
-- aluno.
-- ============================================================================

create or replace function public.skill_mastery(p_user_id uuid default auth.uid())
returns table (
  skill text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  ),
  per_skill as (
    select unnest(q.skills) as skill, la.is_correct
    from latest_answer la
    join public.questions q on q.id = la.question_id
    where array_length(q.skills, 1) > 0
  )
  select
    skill,
    count(*) filter (where is_correct),
    count(*),
    round(count(*) filter (where is_correct)::numeric / greatest(count(*), 1) * 100),
    case
      when count(*) filter (where is_correct)::numeric / greatest(count(*), 1) >= 0.8 then 'dominado'
      when count(*) filter (where is_correct)::numeric / greatest(count(*), 1) >= 0.6 then 'desenvolvimento'
      else 'revisar'
    end
  from per_skill
  group by skill;
$$;

comment on function public.skill_mastery is
  'Domínio por habilidade (questions.skills) a partir da resposta mais recente de cada questão — mesmo critério de topic_mastery(), só que agrupado por habilidade em vez de assunto.';

grant execute on function public.skill_mastery(uuid) to authenticated;

-- --------------------------------------------------------- tipos de erro
-- Só das respostas ERRADAS mais recentes — "seu erro mais comum é X" não
-- faz sentido contando questões que o aluno já acertou depois.
create or replace function public.common_error_types(p_user_id uuid default auth.uid())
returns table (
  error_type text,
  occurrences bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
    order by ans.question_id, ans.answered_at desc
  ),
  wrong_error_types as (
    select unnest(q.error_types) as error_type
    from latest_answer la
    join public.questions q on q.id = la.question_id
    where la.is_correct = false and array_length(q.error_types, 1) > 0
  )
  select error_type, count(*)
  from wrong_error_types
  group by error_type
  order by count(*) desc;
$$;

comment on function public.common_error_types is
  'Tipos de erro (questions.error_types) mais frequentes entre as respostas erradas mais recentes do aluno.';

grant execute on function public.common_error_types(uuid) to authenticated;
