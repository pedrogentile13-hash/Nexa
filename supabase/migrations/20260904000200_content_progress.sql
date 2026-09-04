-- ============================================================================
-- Nexa — 0200 (v2) · Progresso do aluno sobre o conteúdo
--
-- Separado da migration de conteúdo por uma razão de segurança, não de
-- organização: aqui a RLS volta a ser `user_id = auth.uid()`. Misturar as duas
-- lógicas no mesmo arquivo é como se perde de vista qual regra vale para qual
-- tabela — e uma tabela de progresso com a policy de conteúdo vazaria o
-- desempenho de um aluno para a escola inteira.
-- ============================================================================

-- --------------------------------------------------- progresso genérico ----
-- Serve resumo (percentual lido), podcast/vídeo (segundo em que parou) e
-- imagem (visto). Uma linha por aluno × recurso.
create table public.resource_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  progress_percent numeric(5, 2) not null default 0 check (progress_percent between 0 and 100),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index resource_progress_pair_uq on public.resource_progress (user_id, resource_id);
-- "Continuar de onde parou" é uma consulta por aluno ordenada por recência.
create index resource_progress_recent_idx on public.resource_progress (user_id, last_seen_at desc);

create trigger resource_progress_set_updated_at before update on public.resource_progress
  for each row execute function public.set_updated_at();

alter table public.resource_progress enable row level security;

create policy resource_progress_all_own on public.resource_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- tentativas --------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_count_sane check (correct_count <= total_count)
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, resource_id, started_at desc);

alter table public.quiz_attempts enable row level security;

create policy quiz_attempts_all_own on public.quiz_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  option_id uuid references public.question_options (id) on delete set null,
  is_correct boolean not null default false,
  answered_at timestamptz not null default now()
);

create unique index quiz_answers_pair_uq on public.quiz_answers (attempt_id, question_id);

alter table public.quiz_answers enable row level security;

-- A tentativa é do aluno, logo a resposta também é. A checagem sobe pelo
-- attempt para não repetir `user_id` numa segunda coluna que pode divergir.
create policy quiz_answers_all_own on public.quiz_answers
  for all to authenticated
  using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ------------------------------------------------ progresso na trilha ------
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.track_lessons (id) on delete cascade,
  -- Os cinco estados do nó no design. `locked` não é armazenado: é derivado da
  -- ausência de progresso na lição anterior, senão desbloquear uma lição
  -- exigiria reescrever a linha de todos os alunos.
  state text not null default 'available' check (state in ('available', 'in_progress', 'done', 'mastered')),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index lesson_progress_pair_uq on public.lesson_progress (user_id, lesson_id);

create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

create policy lesson_progress_all_own on public.lesson_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- marcações ---------
create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  quote text not null check (length(btrim(quote)) between 1 and 2000),
  note text,
  created_at timestamptz not null default now()
);

create index highlights_user_resource_idx on public.highlights (user_id, resource_id);

alter table public.highlights enable row level security;

create policy highlights_all_own on public.highlights
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------- flashcards ------------
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  knows boolean not null,
  reviewed_at timestamptz not null default now()
);

create index flashcard_reviews_user_idx on public.flashcard_reviews (user_id, resource_id, reviewed_at desc);

alter table public.flashcard_reviews enable row level security;

create policy flashcard_reviews_all_own on public.flashcard_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Views · a biblioteca como o aluno a enxerga
--
-- `security_invoker` em todas: a view roda com a RLS de quem consulta, não com
-- a de quem a criou. Sem isso uma view seria um buraco por onde o acervo de
-- outra escola sairia inteiro.
-- ============================================================================

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
  -- Contagem de questões: o card do simulado promete "20 questões" e essa
  -- promessa não pode vir de um campo digitado à mão que envelhece.
  (select count(*) from public.questions q where q.resource_id = r.id) as question_count
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published;

comment on view public.v_resource_library is
  'Biblioteca publicada e visível para quem consulta, já com matéria e assunto resolvidos.';

-- Progresso do aluno na trilha, com o estado derivado de cada lição.
create or replace view public.v_track_lessons_resolved
with (security_invoker = true) as
select
  l.id            as lesson_id,
  l.section_id,
  s.track_id,
  t.subject_catalog_id,
  t.school_id,
  s.title         as section_title,
  s.position      as section_position,
  l.position      as lesson_position,
  l.title,
  l.description,
  l.estimated_minutes,
  l.xp_reward,
  l.unlock_after_lesson_id,
  coalesce(p.state, 'available') as raw_state,
  p.correct_streak,
  p.completed_at,
  -- Uma lição está bloqueada quando a anterior exigida não foi concluída.
  case
    when l.unlock_after_lesson_id is null then false
    else not exists (
      select 1 from public.lesson_progress pp
      where pp.lesson_id = l.unlock_after_lesson_id
        and pp.user_id = auth.uid()
        and pp.state in ('done', 'mastered')
    )
  end as is_locked,
  (select count(*) from public.track_lesson_resources lr where lr.lesson_id = l.id) as resource_count
from public.track_lessons l
join public.track_sections s on s.id = l.section_id
join public.tracks t on t.id = s.track_id
left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = auth.uid();

comment on view public.v_track_lessons_resolved is
  'Lições da trilha com o estado do aluno e o bloqueio já calculado.';
