-- ============================================================================
-- Nexa — 0907 (2) · Loop Nexa
--
-- Conteúdo → estudo → simulado → desempenho → identificação de dificuldade →
-- recomendação → revisão → novo estudo. As peças de conteúdo e simulado já
-- existiam; o que faltava era o elo entre "resultado do simulado" e
-- "o que fazer a seguir" — e é isso que as duas funções e a tabela abaixo
-- resolvem, sem duplicar nada que `quiz_attempt_review`/`quiz_attempt_topics`
-- já fazem POR TENTATIVA (0300_content_functions.sql). A diferença aqui é o
-- agregado: não "como fui NESTA prova", e sim "como estou HOJE neste assunto",
-- através de todas as tentativas.
--
-- São FUNÇÕES, não views comuns: `questions`/`question_options` não têm
-- policy de SELECT para o aluno — é onde mora o gabarito — então uma view
-- `security_invoker` simplesmente devolveria zero linhas para quem não é
-- admin. `security definer` é o mesmo mecanismo que já autoriza
-- `quiz_attempt_review`, com o mesmo cuidado: filtro explícito por
-- `auth.uid()` no corpo, para a elevação de privilégio nunca vazar dado de
-- outro aluno.
-- ============================================================================

-- ------------------------------------------------------- domínio por assunto
-- "Dominar" é sobre a resposta MAIS RECENTE de cada questão, não a média
-- histórica: um aluno que errou uma questão em março e acertou a mesma em
-- setembro está bem HOJE, e uma média arrastaria o erro de março pra sempre.
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

comment on function public.topic_mastery is
  'Domínio por assunto a partir da resposta mais recente de cada questão — alimenta o mapa de domínio e a recomendação de revisão.';

grant execute on function public.topic_mastery(uuid) to authenticated;

-- ---------------------------------------------------- "marcar como dominado"
-- Refazer a questão e acertar já resolve o erro sozinho (a próxima consulta a
-- `recent_errors()` nem mostra mais essa questão, porque usa a resposta mais
-- recente). Esta tabela existe para o outro caminho: o aluno olha o erro,
-- decide "já sei isso, só errei por distração", e dispensa sem refazer nada.
create table if not exists public.dismissed_question_errors (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.dismissed_question_errors enable row level security;

drop policy if exists dismissed_question_errors_all_own on public.dismissed_question_errors;
create policy dismissed_question_errors_all_own on public.dismissed_question_errors
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ central de erros
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

comment on function public.recent_errors is
  'Última resposta errada de cada questão, sem as dispensadas — a Central de Erros lê daqui.';

grant execute on function public.recent_errors(uuid) to authenticated;

-- ------------------------------------------------------- marcar como dominado
create or replace function public.dismiss_question_error(p_question_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.dismissed_question_errors (user_id, question_id)
  values (auth.uid(), p_question_id)
  on conflict (user_id, question_id) do nothing;
$$;

grant execute on function public.dismiss_question_error(uuid) to authenticated;
