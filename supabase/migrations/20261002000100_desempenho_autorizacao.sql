-- ============================================================================
-- Nexa — Autorização nas funções de desempenho
--
-- O problema, confirmado empiricamente antes deste conserto: `topic_mastery`,
-- `skill_mastery` e `recent_errors` são `security definer`, aceitam
-- `p_user_id` e não checavam NADA. Qualquer aluno logado passava o uuid de um
-- colega e recebia de volta o domínio por assunto, as habilidades e — o pior
-- caso — a lista de questões que o colega errou, COM O ENUNCIADO E A
-- EXPLICAÇÃO. Numa plataforma escolar com menores, é o erro de privacidade
-- mais caro que existe.
--
-- O que NÃO estava vazando, e por quê: `subject_scores` e `simulado_history`
-- têm a mesma forma (parâmetro de usuário, sem guard), mas são `security
-- INVOKER` — a RLS vale como o chamador, e ler `quiz_attempts` de outro aluno
-- já era bloqueado. Elas devolviam zero linhas. Ficam como estão: acrescentar
-- um portão onde a RLS já resolve seria cinto sobre suspensório, e cada
-- `security definer` a menos é um lugar a menos pra errar.
--
-- A regra de autorização não é nova: é a MESMA de `admin_subject_scores` e
-- `admin_user_stats` (0911, professor), que já são as versões autorizadas
-- destas leituras. Aqui ela ganha um nome e um dono — `can_read_performance_of`
-- — em vez de ser copiada em três lugares, porque regra de acesso duplicada é
-- regra de acesso que diverge.
--
-- Por que devolver VAZIO em vez de levantar erro: é como a RLS se comporta no
-- resto do projeto, e é como `subject_scores` já se comportava para o mesmo
-- caso. Um erro aqui também contaria ao atacante que o alvo existe; o vazio
-- não conta nada. As telas legítimas nunca caem nele, porque sempre passam o
-- próprio id.
--
-- As três funções abaixo são as definições ATUAIS, extraídas dos arquivos de
-- origem sem reescrita manual — a única diferença é a linha do portão dentro
-- do `where` da CTE. Fazer o corte ali, e não num `if` no topo, é o que
-- mantém as funções em `language sql` (sem conversão pra plpgsql) e preserva
-- a assinatura, sem `drop` nem risco de sobrecarga ambígua.
-- ============================================================================

create or replace function public.can_read_performance_of(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_target_user_id is null
    or p_target_user_id = auth.uid()
    or public.is_admin()
    or public.is_teacher_of_student(p_target_user_id)
    or public.can_manage_school(public.current_school_id(p_target_user_id));
$$;

comment on function public.can_read_performance_of is
  'Quem pode ler o desempenho de um aluno: ele mesmo, um admin, o professor da turma dele ou quem administra a escola dele. Mesma regra de admin_subject_scores.';

grant execute on function public.can_read_performance_of(uuid) to authenticated;

create or replace function public.topic_mastery(p_user_id uuid default auth.uid())
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
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
    order by ans.question_id, ans.answered_at desc
  )
  select
    r.subject_catalog_id,
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
  from latest_answer la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = q.resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.content_topics t on t.id = q.topic_id
  group by r.subject_catalog_id, sc.name, sc.default_color, q.topic_id, t.name;
$$;

create or replace function public.recent_errors(p_user_id uuid default auth.uid())
returns table (
  question_id uuid,
  statement text,
  explanation text,
  difficulty text,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_id uuid,
  topic_name text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_answer as (
    select distinct on (ans.question_id)
      ans.question_id,
      ans.option_id,
      ans.is_correct,
      ans.answered_at,
      a.resource_id as attempt_resource_id
    from public.quiz_answers ans
    join public.quiz_attempts a on a.id = ans.attempt_id
    where a.user_id = p_user_id and a.finished_at is not null
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
    order by ans.question_id, ans.answered_at desc
  )
  select
    q.id,
    q.statement,
    q.explanation,
    q.difficulty,
    r.id,
    r.title,
    r.subject_catalog_id,
    sc.name,
    sc.default_color,
    q.topic_id,
    t.name,
    (select o.body from public.question_options o where o.id = la.option_id),
    (select o.body from public.question_options o where o.question_id = q.id and o.is_correct),
    la.answered_at
  from latest_answer la
  join public.questions q on q.id = la.question_id
  join public.resources r on r.id = la.attempt_resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.content_topics t on t.id = q.topic_id
  where la.is_correct = false
    and not exists (
      select 1 from public.dismissed_question_errors d
      where d.user_id = p_user_id and d.question_id = q.id
    )
  order by la.answered_at desc;
$$;

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
      -- Portão de autorização (ver comentário no topo desta migração).
      and public.can_read_performance_of(p_user_id)
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
grant execute on function public.topic_mastery(uuid) to authenticated;
grant execute on function public.recent_errors(uuid) to authenticated;
grant execute on function public.skill_mastery(uuid) to authenticated;
