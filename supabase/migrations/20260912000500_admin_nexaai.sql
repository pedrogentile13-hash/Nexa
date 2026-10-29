-- ============================================================================
-- Nexa — 0912 (5) · NexaAI exclusiva para admin/professor
--
-- Duas funções de leitura novas pra alimentar as "funções rápidas" da nova
-- tela `/admin/nexaai` · `/professor/nexaai` — nenhuma escreve nada, os
-- textos que a IA gera a partir delas nunca voltam sozinhos pro banco.
--
--   * `admin_topic_mastery`: mesmo padrão de `admin_subject_scores`/
--     `admin_user_stats` (0911 (6)) — devolve `topic_mastery()` de UM aluno
--     específico, autorizado pra admin, admin da escola dele, ou professor
--     que dá aula pra ele (`is_teacher_of_student`). Faltava esta — as
--     outras duas já existiam, esta nunca tinha sido pedida antes.
--
--   * `class_subject_mastery`: agregado que não existia — hoje só há
--     domínio por ALUNO (`topic_mastery`) ou por ESCOLA INTEIRA
--     (`admin_school_summary`, que o comentário da migração do professor já
--     deixa de fora do escopo dele de propósito). Aqui o corte é
--     escola+matéria(+turma opcional): pega a resposta mais recente de
--     cada PAR (questão, aluno) dentro do recorte, agrupa por assunto.
--     Autorização no mesmo nível de `notify_class` (escola+matéria, não
--     desce a turma específica) — consistente com o que já existe, não um
--     relaxamento novo.
-- ============================================================================

create or replace function public.admin_topic_mastery(p_target_user_id uuid)
returns table (
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_target_user_id;
  if not (public.is_admin() or public.can_manage_school(v_school) or public.is_teacher_of_student(p_target_user_id)) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query select * from public.topic_mastery(p_target_user_id);
end;
$$;

comment on function public.admin_topic_mastery is
  'topic_mastery() de UM aluno específico, para admin/professor — mesma autorização de admin_subject_scores/admin_user_stats.';

grant execute on function public.admin_topic_mastery(uuid) to authenticated;

create or replace function public.class_subject_mastery(
  p_school_id uuid,
  p_subject_catalog_id uuid,
  p_class_id uuid default null
)
returns table (
  topic_name text,
  correct_count bigint,
  total_count bigint,
  mastery_percent numeric,
  student_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or public.can_manage_school(p_school_id)
    or public.is_teacher_of(p_school_id, p_subject_catalog_id)
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
  with roster as (
    select p.id as user_id
    from public.profiles p
    where p.school_id = p_school_id
      and p.role = 'student'
      and (p_class_id is null or p.class_id = p_class_id)
  ),
  latest_answer as (
    select distinct on (ans.question_id, a.user_id)
      ans.question_id,
      a.user_id,
      ans.is_correct
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    join roster r2 on r2.user_id = a.user_id
    where a.finished_at is not null
    order by ans.question_id, a.user_id, ans.answered_at desc
  ),
  scoped as (
    select la.user_id, la.is_correct, q.topic_id
    from latest_answer la
    join public.questions q on q.id = la.question_id
    join public.resources res on res.id = q.resource_id
    where coalesce(q.subject_catalog_id, res.subject_catalog_id) = p_subject_catalog_id
  )
  select
    coalesce(t.name, 'Geral'),
    count(*) filter (where scoped.is_correct),
    count(*),
    round(count(*) filter (where scoped.is_correct)::numeric / greatest(count(*), 1) * 100),
    count(distinct scoped.user_id)
  from scoped
  left join public.content_topics t on t.id = scoped.topic_id
  group by t.name
  order by round(count(*) filter (where scoped.is_correct)::numeric / greatest(count(*), 1) * 100) asc;
end;
$$;

comment on function public.class_subject_mastery is
  'Domínio por assunto agregado entre os alunos de uma escola+matéria(+turma opcional) — alimenta o "resumo de turma" da NexaAI de admin/professor.';

grant execute on function public.class_subject_mastery(uuid, uuid, uuid) to authenticated;
