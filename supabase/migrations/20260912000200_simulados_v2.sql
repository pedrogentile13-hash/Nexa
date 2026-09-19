-- ============================================================================
-- Nexa — 0912 (2) · Simulados v2 (provas estilo Anglo/ENEM)
--
-- O formato antigo de simulado é uma lista linear de questões de múltipla
-- escolha. Isso não representa uma prova real: falta texto-base
-- compartilhado entre questões, imagem/gráfico/tabela como dado
-- estruturado, seção por matéria dentro da mesma prova, e redação.
--
-- Onde cada coisa nova mora, e por quê:
--
--   * `resources.assets`/`sections`/`settings` (JSONB): conteúdo de
--     EXIBIÇÃO, polimórfico (texto/imagem/gráfico/tabela/infográfico/
--     diagrama são 6 formatos de payload diferentes) e nunca consultado
--     linha a linha — só lido inteiro e renderizado. Seis tabelas novas pra
--     isso seria estrutura sem propósito; JSONB mantém o JSON de
--     importação quase 1:1 com o que fica salvo.
--
--   * `questions.resource_refs`/`group_id`/`subject_catalog_id` (colunas
--     novas, sem tabela nova): a questão continua sendo uma linha só —
--     ganha só os campos que uma prova real precisa (a que recurso ela se
--     refere, a que grupo pertence, se é de outra matéria dentro da mesma
--     prova mista).
--
--   * `writing_tasks`/`essay_submissions` (tabelas novas de verdade):
--     redação tem dono, nota, correção — precisa de RLS por linha como
--     qualquer outro dado sensível do aluno.
--
-- Tudo aqui é aditivo: coluna nova com default inofensivo, tabela nova, ou
-- função estendida — nenhum simulado/quiz já publicado muda de
-- comportamento. O JSON legado `{"simulation": {"questions": [...]}}`
-- continua sendo aceito e importado exatamente como hoje (ver
-- `parseSimuladoCode`, que só troca de caminho quando `schemaVersion ===
-- "2.0"` explicitamente).
-- ============================================================================

-- --------------------------------------------------------------- resources --
alter table public.resources
  add column if not exists schema_version text not null default '1.0',
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists assets jsonb not null default '[]'::jsonb,
  add column if not exists sections jsonb not null default '[]'::jsonb,
  add column if not exists exam_mode text,
  add column if not exists exam_style text;

-- Postgres não tem `add constraint if not exists` — a checagem por nome via
-- `pg_constraint` é o jeito idempotente de fazer a mesma coisa.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_exam_mode_check') then
    alter table public.resources add constraint resources_exam_mode_check
      check (exam_mode is null or exam_mode in ('exam', 'practice'));
  end if;
end;
$$;

comment on column public.resources.exam_mode is
  'null = deriva de kind (quiz->practice, simulado->exam), exatamente o comportamento de hoje. Só um JSON v2 explícito sobrescreve.';
comment on column public.resources.assets is
  'Array de recursos reutilizáveis da prova (texto-base, imagem, gráfico, tabela, infográfico, diagrama), cada um com "id" único referenciado por questions.resource_refs e writing_tasks.resource_refs.';
comment on column public.resources.sections is
  'Array de {id, title, subject, type, questionIds, writingTaskIds} — reproduz a ordem/agrupamento por matéria de uma prova real. Vazio = lista única, como hoje.';

-- --------------------------------------------------------------- questions --
alter table public.questions
  add column if not exists group_id text,
  add column if not exists resource_refs text[] not null default '{}',
  add column if not exists subject_catalog_id uuid references public.subject_catalog (id) on delete set null,
  add column if not exists subtopic text,
  add column if not exists book smallint,
  add column if not exists module smallint,
  add column if not exists skills text[] not null default '{}',
  add column if not exists error_types text[] not null default '{}',
  add column if not exists estimated_time_seconds integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_estimated_time_check') then
    alter table public.questions add constraint questions_estimated_time_check
      check (estimated_time_seconds is null or estimated_time_seconds > 0);
  end if;
end;
$$;

comment on column public.questions.subject_catalog_id is
  'null = usa a matéria do resources pai. Só preenchida quando a questão pertence a outra matéria dentro da mesma prova mista (seções por matéria).';
comment on column public.questions.resource_refs is
  'IDs de resources.assets usados por esta questão (texto-base, imagem, gráfico...). String livre, sem FK — resolvido em memória contra o array de assets do recurso pai.';

create index if not exists questions_group_idx on public.questions (resource_id, group_id) where group_id is not null;
create index if not exists questions_subject_override_idx on public.questions (subject_catalog_id) where subject_catalog_id is not null;

-- ------------------------------------------------------------ quiz_answers --
alter table public.quiz_answers
  add column if not exists flagged boolean not null default false,
  add column if not exists time_spent_seconds integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quiz_answers_time_spent_check') then
    alter table public.quiz_answers add constraint quiz_answers_time_spent_check check (time_spent_seconds >= 0);
  end if;
end;
$$;

comment on column public.quiz_answers.flagged is
  '"Marcar para revisar" — independente de ter resposta escolhida ou não.';

-- ---------------------------------------------------- dificuldade "anglo" --
-- "anglo" é um NÍVEL de complexidade de raciocínio, não sinônimo de
-- "difícil" — pedido explícito do usuário. O nome da constraint original é
-- anônimo (gerado pelo Postgres na criação da tabela): achamos e derrubamos
-- pelo nome REAL em vez de adivinhar, mesma disciplina já usada nesta sessão
-- para não quebrar numa reaplicação.
do $$
declare
  v_name text;
begin
  select conname into v_name from pg_constraint
  where conrelid = 'public.resources'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%difficulty%';
  if v_name is not null then
    execute format('alter table public.resources drop constraint %I', v_name);
  end if;
end;
$$;

alter table public.resources
  add constraint resources_difficulty_check check (difficulty in ('facil', 'medio', 'anglo', 'dificil'));

do $$
declare
  v_name text;
begin
  select conname into v_name from pg_constraint
  where conrelid = 'public.questions'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%difficulty%';
  if v_name is not null then
    execute format('alter table public.questions drop constraint %I', v_name);
  end if;
end;
$$;

alter table public.questions
  add constraint questions_difficulty_check check (difficulty in ('facil', 'medio', 'anglo', 'dificil'));

-- ------------------------------------------------------------ writing_tasks --
create table if not exists public.writing_tasks (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 200),
  genre text,
  theme text,
  prompt text not null check (length(btrim(prompt)) >= 3),
  instructions text[] not null default '{}',
  resource_refs text[] not null default '{}',
  min_words integer check (min_words is null or min_words >= 0),
  max_words integer check (max_words is null or max_words >= 0),
  evaluation_criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writing_tasks_word_range check (min_words is null or max_words is null or max_words >= min_words)
);

create unique index if not exists writing_tasks_position_uq on public.writing_tasks (resource_id, position);

drop trigger if exists writing_tasks_set_updated_at on public.writing_tasks;
create trigger writing_tasks_set_updated_at before update on public.writing_tasks
  for each row execute function public.set_updated_at();

alter table public.writing_tasks enable row level security;

-- Sem "gabarito" a esconder (redação não tem resposta certa) — diferente de
-- `questions`, pode ter policy de SELECT normal em vez de função dedicada.
drop policy if exists writing_tasks_select_visible on public.writing_tasks;
create policy writing_tasks_select_visible on public.writing_tasks
  for select to authenticated
  using (public.can_view_resource(resource_id));

drop policy if exists writing_tasks_manage on public.writing_tasks;
create policy writing_tasks_manage on public.writing_tasks
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

-- --------------------------------------------------------- essay_submissions --
create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  writing_task_id uuid not null references public.writing_tasks (id) on delete cascade,
  content text not null default '',
  word_count integer not null default 0 check (word_count >= 0),
  is_submitted boolean not null default false,
  submitted_at timestamptz,
  scores jsonb,
  total_score numeric,
  corrected_by uuid references auth.users (id) on delete set null,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists essay_submissions_pair_uq on public.essay_submissions (attempt_id, writing_task_id);
create index if not exists essay_submissions_writing_task_idx on public.essay_submissions (writing_task_id);

drop trigger if exists essay_submissions_set_updated_at on public.essay_submissions;
create trigger essay_submissions_set_updated_at before update on public.essay_submissions
  for each row execute function public.set_updated_at();

alter table public.essay_submissions enable row level security;

-- Só SELECT tem policy, de propósito: nota de redação não pode depender de
-- RLS coluna-a-coluna (o Postgres não tem). Toda escrita passa pelas
-- funções SECURITY DEFINER abaixo (`save_essay_draft`, `submit_essay`,
-- `grade_essay`), rodando como dono da tabela — mesmo padrão de defesa já
-- usado em `answer_quiz_question` para o gabarito objetivo.
drop policy if exists essay_submissions_select on public.essay_submissions;
create policy essay_submissions_select on public.essay_submissions
  for select to authenticated
  using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
    or exists (
      select 1 from public.writing_tasks wt join public.resources r on r.id = wt.resource_id
      where wt.id = writing_task_id
        and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
    )
  );

-- ================================================================= RPCs ===

-- `start_quiz_attempt`: reaproveita uma tentativa aberta em vez de sempre
-- criar outra — corrige a tentativa órfã que nascia toda vez que a página
-- recarregava no meio de uma prova. Mesma assinatura/retorno de antes, não
-- precisa de drop.
create or replace function public.start_quiz_attempt(p_resource_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt uuid;
  v_total integer;
begin
  if not public.can_view_resource(p_resource_id) then
    raise exception 'recurso indisponível' using errcode = '42501';
  end if;

  select id into v_attempt from public.quiz_attempts
  where user_id = auth.uid() and resource_id = p_resource_id and finished_at is null
  order by started_at desc
  limit 1;

  if v_attempt is not null then
    return v_attempt;
  end if;

  select count(*) into v_total from public.questions where resource_id = p_resource_id;

  -- Uma prova só de redação (sem questão objetiva nenhuma) é válida — só
  -- bloqueia quando não existe absolutamente nada para responder.
  if v_total = 0 and not exists (
    select 1 from public.writing_tasks where resource_id = p_resource_id
  ) then
    raise exception 'este simulado ainda não tem questões' using errcode = '23514';
  end if;

  insert into public.quiz_attempts (user_id, resource_id, total_count)
  values (auth.uid(), p_resource_id, v_total)
  returning id into v_attempt;

  return v_attempt;
end;
$$;

-- Restaura respostas e marcações já salvas — chamada uma vez ao entrar na
-- prova, é o que permite recarregar a página ou voltar sem perder nada.
create or replace function public.quiz_attempt_state(p_attempt_id uuid)
returns table (question_id uuid, option_id uuid, flagged boolean)
language sql
stable
security definer
set search_path = public
as $$
  select qa.question_id, qa.option_id, qa.flagged
  from public.quiz_answers qa
  join public.quiz_attempts a on a.id = qa.attempt_id
  where qa.attempt_id = p_attempt_id and a.user_id = auth.uid();
$$;

grant execute on function public.quiz_attempt_state(uuid) to authenticated;

-- `answer_quiz_question` ganha `p_time_spent_seconds` — muda a lista de
-- argumentos, então precisa de `drop` explícito antes: `create or replace`
-- não troca a versão de 3 argumentos, cria uma segunda função ambígua ao
-- lado dela (mesmo bug de overload já visto nesta sessão).
drop function if exists public.answer_quiz_question(uuid, uuid, uuid);

create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_time_spent_seconds integer default 0
)
returns table (is_correct boolean, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_option uuid;
  v_is_correct boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.quiz_attempts a
    join public.resources r on r.id = a.resource_id
    where a.id = p_attempt_id
      and coalesce(r.time_limit_seconds, 0) > 0
      and now() > a.started_at + make_interval(secs => r.time_limit_seconds) + interval '15 seconds'
  ) then
    raise exception 'tempo esgotado' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  select o.id into v_correct_option
  from public.question_options o where o.question_id = p_question_id and o.is_correct;

  v_is_correct := p_option_id is not null and p_option_id = v_correct_option;

  -- `flagged` de propósito fora do `set`: responder nunca desmarca uma
  -- questão que o aluno já tinha sinalizado para revisar. O tempo se
  -- ACUMULA — o aluno pode voltar à questão mais de uma vez.
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct, time_spent_seconds)
  values (p_attempt_id, p_question_id, p_option_id, v_is_correct, greatest(0, coalesce(p_time_spent_seconds, 0)))
  on conflict (attempt_id, question_id) do update
    set option_id = excluded.option_id,
        is_correct = excluded.is_correct,
        answered_at = now(),
        time_spent_seconds = public.quiz_answers.time_spent_seconds + greatest(0, coalesce(p_time_spent_seconds, 0));

  return query
    select v_is_correct, v_correct_option, q.explanation
    from public.questions q where q.id = p_question_id;
end;
$$;

grant execute on function public.answer_quiz_question(uuid, uuid, uuid, integer) to authenticated;

-- "Marcar para revisar" — upsert que alterna só `flagged`, sem tocar em
-- resposta nenhuma (a questão pode estar sem resposta e marcada).
create or replace function public.toggle_question_flag(p_attempt_id uuid, p_question_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flagged boolean;
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.questions q join public.quiz_attempts a on a.resource_id = q.resource_id
    where q.id = p_question_id and a.id = p_attempt_id
  ) then
    raise exception 'esta questão não pertence a esta tentativa' using errcode = '23514';
  end if;

  insert into public.quiz_answers (attempt_id, question_id, flagged)
  values (p_attempt_id, p_question_id, true)
  on conflict (attempt_id, question_id) do update
    set flagged = not public.quiz_answers.flagged
  returning flagged into v_flagged;

  return v_flagged;
end;
$$;

grant execute on function public.toggle_question_flag(uuid, uuid) to authenticated;

-- `quiz_questions` ganha colunas de retorno novas (matéria efetiva, grupo,
-- recursos, subtema, habilidades) — muda a lista de colunas de
-- `returns table`, então também precisa de `drop` explícito primeiro
-- (Postgres não deixa `create or replace` mudar o tipo de retorno).
drop function if exists public.quiz_questions(uuid);

create or replace function public.quiz_questions(p_resource_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  difficulty text,
  points numeric,
  topic_name text,
  subject_name text,
  group_id text,
  resource_refs text[],
  subtopic text,
  skills text[],
  options jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.position,
    q.statement,
    q.difficulty,
    q.points,
    t.name,
    coalesce(qsc.name, rsc.name),
    q.group_id,
    q.resource_refs,
    q.subtopic,
    q.skills,
    -- Sem `is_correct`. A ordem é a de cadastro: embaralhar aqui faria a
    -- posição divergir entre a tela e a correção.
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'body', o.body)
              order by o.position)
       from public.question_options o where o.question_id = q.id),
      '[]'::jsonb
    )
  from public.questions q
  join public.resources r on r.id = q.resource_id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  where q.resource_id = p_resource_id
    and public.can_view_resource(p_resource_id)
  order by q.position;
$$;

comment on function public.quiz_questions is
  'Questões de um quiz/simulado SEM o gabarito. Única porta de leitura para o aluno.';

grant execute on function public.quiz_questions(uuid) to authenticated;

-- `quiz_attempt_review` ganha os metadados pedidos para análise posterior
-- (matéria, módulo, habilidades, tempo gasto, recursos usados) — mesmo
-- motivo do drop acima.
drop function if exists public.quiz_attempt_review(uuid);

create or replace function public.quiz_attempt_review(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_position integer,
  statement text,
  explanation text,
  topic_name text,
  subject_name text,
  subtopic text,
  book smallint,
  module smallint,
  skills text[],
  error_types text[],
  difficulty text,
  resource_refs text[],
  time_spent_seconds integer,
  chosen_option_id uuid,
  correct_option_id uuid,
  is_correct boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id, q.position, q.statement, q.explanation, t.name,
    coalesce(qsc.name, rsc.name),
    q.subtopic, q.book, q.module, q.skills, q.error_types, q.difficulty, q.resource_refs,
    coalesce(ans.time_spent_seconds, 0),
    ans.option_id,
    (select o.id from public.question_options o where o.question_id = q.id and o.is_correct),
    coalesce(ans.is_correct, false)
  from public.quiz_attempts a
  join public.questions q on q.resource_id = a.resource_id
  join public.resources r on r.id = a.resource_id
  left join public.quiz_answers ans on ans.attempt_id = a.id and ans.question_id = q.id
  left join public.content_topics t on t.id = q.topic_id
  left join public.subject_catalog qsc on qsc.id = q.subject_catalog_id
  left join public.subject_catalog rsc on rsc.id = r.subject_catalog_id
  where a.id = p_attempt_id
    and a.user_id = auth.uid()
    and a.finished_at is not null
  order by q.position;
$$;

grant execute on function public.quiz_attempt_review(uuid) to authenticated;

-- ------------------------------------------------------------ redação ------
-- Autosave: aceita reescrever o rascunho quantas vezes o aluno digitar; fica
-- mudo (não lança erro) se a redação já foi entregue — uma chamada de
-- autosave atrasada chegando depois do "Entregar" não pode reabrir o texto.
create or replace function public.save_essay_draft(
  p_attempt_id uuid,
  p_writing_task_id uuid,
  p_content text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_words integer;
  v_clean text := btrim(coalesce(p_content, ''));
begin
  if not exists (
    select 1 from public.quiz_attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid() and a.finished_at is null
  ) then
    raise exception 'tentativa inválida ou já encerrada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.writing_tasks wt join public.quiz_attempts a on a.resource_id = wt.resource_id
    where wt.id = p_writing_task_id and a.id = p_attempt_id
  ) then
    raise exception 'esta redação não pertence a esta tentativa' using errcode = '23514';
  end if;

  v_words := case when v_clean = '' then 0
    else coalesce(array_length(regexp_split_to_array(v_clean, '\s+'), 1), 0)
  end;

  insert into public.essay_submissions (attempt_id, writing_task_id, content, word_count)
  values (p_attempt_id, p_writing_task_id, coalesce(p_content, ''), v_words)
  on conflict (attempt_id, writing_task_id) do update
    set content = excluded.content, word_count = excluded.word_count, updated_at = now()
    where not public.essay_submissions.is_submitted;

  return v_words;
end;
$$;

grant execute on function public.save_essay_draft(uuid, uuid, text) to authenticated;

create or replace function public.submit_essay(p_attempt_id uuid, p_writing_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.quiz_attempts a where a.id = p_attempt_id and a.user_id = auth.uid()
  ) then
    raise exception 'tentativa inválida' using errcode = '42501';
  end if;

  update public.essay_submissions
  set is_submitted = true, submitted_at = coalesce(submitted_at, now())
  where attempt_id = p_attempt_id and writing_task_id = p_writing_task_id;

  if not found then
    insert into public.essay_submissions (attempt_id, writing_task_id, is_submitted, submitted_at)
    values (p_attempt_id, p_writing_task_id, true, now());
  end if;
end;
$$;

grant execute on function public.submit_essay(uuid, uuid) to authenticated;

-- Correção: só quem gerencia o conteúdo daquela matéria/escola (admin,
-- school_admin, ou o professor da matéria via `is_teacher_of`) pode gravar
-- nota — nunca o próprio aluno, que só tem SELECT na linha.
create or replace function public.grade_essay(
  p_essay_id uuid,
  p_scores jsonb,
  p_total_score numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.essay_submissions es
    join public.writing_tasks wt on wt.id = es.writing_task_id
    join public.resources r on r.id = wt.resource_id
    where es.id = p_essay_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  update public.essay_submissions
  set scores = p_scores, total_score = p_total_score, corrected_by = auth.uid(), corrected_at = now()
  where id = p_essay_id;
end;
$$;

grant execute on function public.grade_essay(uuid, jsonb, numeric) to authenticated;

-- Lista de redações entregues de um recurso, para a tela de correção.
-- SECURITY DEFINER pelo mesmo motivo dos `admin_*` já existentes: o
-- corretor não é dono da tentativa (`quiz_attempts`/`profiles` do aluno),
-- então um select comum com RLS não devolveria o nome de quem escreveu.
create or replace function public.list_essays_for_grading(p_resource_id uuid)
returns table (
  essay_id uuid,
  attempt_id uuid,
  writing_task_id uuid,
  writing_task_title text,
  student_name text,
  content text,
  word_count integer,
  submitted_at timestamptz,
  total_score numeric,
  scores jsonb,
  evaluation_criteria jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  return query
    select
      es.id, es.attempt_id, wt.id, wt.title,
      p.full_name,
      es.content, es.word_count, es.submitted_at, es.total_score, es.scores,
      wt.evaluation_criteria
    from public.essay_submissions es
    join public.writing_tasks wt on wt.id = es.writing_task_id
    join public.quiz_attempts a on a.id = es.attempt_id
    join public.profiles p on p.id = a.user_id
    where wt.resource_id = p_resource_id and es.is_submitted
    order by es.submitted_at;
end;
$$;

grant execute on function public.list_essays_for_grading(uuid) to authenticated;
