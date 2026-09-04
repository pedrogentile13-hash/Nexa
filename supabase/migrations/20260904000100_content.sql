-- ============================================================================
-- Nexa — 0100 (v2) · Conteúdo de estudo, escolas e papéis administrativos
--
-- O que muda de conceito aqui
--
--  * Até agora todo dado do Nexa era do ALUNO: as notas dele, a rotina dele.
--    Conteúdo de estudo é o oposto — é escrito uma vez pela administração e
--    lido por milhares. Isso inverte a RLS: em vez de `user_id = auth.uid()`,
--    a regra passa a ser "publicado E (global OU da minha escola)".
--
--  * O conteúdo se prende ao `subject_catalog`, NUNCA à tabela `subjects`.
--    `subjects` é a instância do aluno; um resumo preso a ela serviria a um
--    aluno só. Preso ao catálogo, o mesmo resumo de Física alcança todo mundo
--    que tem Física — que é a razão de o catálogo existir.
--
--  * `school_id NULL` significa GLOBAL. Uma escola pode ter a própria
--    biblioteca sem perder a biblioteca compartilhada: o aluno enxerga a união
--    das duas. É o requisito de "cada escola pode ter o próprio sistema de
--    resumo" sem duplicar o acervo comum para cada escola nova.
--
--  * Um tipo só de recurso (`resources`) com `kind`, em vez de seis tabelas.
--    Resumo, podcast, vídeo, imagem, música, quiz e simulado compartilham
--    título, matéria, assunto, escola, publicação e ordenação; o que muda é a
--    carga útil. Seis tabelas significariam seis telas de admin, seis
--    consultas de biblioteca e seis lugares para esquecer a mesma regra de RLS.
-- ============================================================================

-- ------------------------------------------------------------------ papéis --
alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'school_admin', 'admin'));

comment on column public.profiles.role is
  'student = aluno; school_admin = gerencia o conteúdo da própria escola; admin = gerencia tudo.';

-- SECURITY DEFINER de propósito: chamada de dentro das policies de `profiles`,
-- uma função normal reentraria na própria policy e recursionaria para sempre.
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = p_user_id), false);
$$;

create or replace function public.current_school_id(p_user_id uuid default auth.uid())
returns uuid language sql stable security definer set search_path = public as $$
  select p.school_id from public.profiles p where p.id = p_user_id;
$$;

-- Admin global gerencia qualquer escola; school_admin só a sua.
create or replace function public.can_manage_school(p_school_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (p.role = 'admin' or (p.role = 'school_admin' and p_school_id is not null and p.school_id = p_school_id))
  );
$$;

/**
 * Ninguém promove a si mesmo.
 *
 * A policy `profiles_update_own` libera a linha inteira, e escrever uma policy
 * por coluna não é possível no Postgres. Sem esta trava, qualquer aluno faria
 * `update profiles set role = 'admin'` com a chave anon e ganharia o painel.
 *
 * A exceção é `auth.uid() is null`: ninguém autenticado, ou seja, SQL Editor e
 * `service_role`. É por ali que o PRIMEIRO admin é nomeado — não haveria como,
 * de outro modo, existir um admin para nomear o primeiro. E quem tem essas
 * duas portas já tem o banco inteiro; a trava não perde nada por abri-las.
 */
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Escolas passam a ser gerenciáveis pelo painel.
drop policy if exists schools_manage_admin on public.schools;
create policy schools_manage_admin on public.schools
  for all to authenticated
  using (public.can_manage_school(id)) with check (public.can_manage_school(id));

-- Catálogo de matérias também: o admin cria matérias novas pelo painel.
drop policy if exists subject_catalog_manage_admin on public.subject_catalog;
create policy subject_catalog_manage_admin on public.subject_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin precisa enxergar as linhas despublicadas/inativas que ele mesmo edita.
drop policy if exists subject_catalog_select_admin on public.subject_catalog;
create policy subject_catalog_select_admin on public.subject_catalog
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------- assuntos ----
-- "Cinemática" dentro de Física. É o que liga o erro do simulado ao resumo
-- certo na tela de resultado — sem assunto, "o que revisar" não existe.
create table public.content_topics (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  description text,
  grade_levels text[] not null default '{}',
  sort_order integer not null default 100,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index content_topics_scope_slug_uq
  on public.content_topics (subject_catalog_id, coalesce(school_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);
create index content_topics_subject_idx on public.content_topics (subject_catalog_id, sort_order);

create trigger content_topics_set_updated_at before update on public.content_topics
  for each row execute function public.set_updated_at();

alter table public.content_topics enable row level security;

create policy content_topics_select_visible on public.content_topics
  for select to authenticated
  using (school_id is null or school_id = public.current_school_id() or public.can_manage_school(school_id));

create policy content_topics_manage on public.content_topics
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- ------------------------------------------------------------- recursos ----
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  topic_id uuid references public.content_topics (id) on delete set null,

  kind text not null check (kind in ('resumo', 'podcast', 'video', 'imagem', 'musica', 'quiz', 'simulado')),

  title text not null check (length(btrim(title)) between 2 and 200),
  subtitle text,
  description text,

  -- Resumo: markdown. Nos demais é opcional (transcrição, legenda, enunciado).
  body text,

  -- Mídia: caminho no bucket `nexa-content` OU URL externa (YouTube, RSS).
  storage_path text,
  external_url text,
  thumbnail_url text,

  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  difficulty text not null default 'medio' check (difficulty in ('facil', 'medio', 'dificil')),
  grade_levels text[] not null default '{}',
  tags text[] not null default '{}',

  -- Quiz e simulado: limite de tempo e nota de corte.
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  xp_reward integer not null default 0 check (xp_reward between 0 and 1000),

  is_published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 100,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Um recurso precisa ter de onde tirar o conteúdo. Quiz e simulado carregam
  -- as questões em outra tabela, então são a exceção legítima.
  constraint resources_has_payload check (
    kind in ('quiz', 'simulado')
    or body is not null
    or storage_path is not null
    or external_url is not null
  )
);

create index resources_library_idx
  on public.resources (subject_catalog_id, kind, sort_order) where is_published;
create index resources_school_idx on public.resources (school_id) where school_id is not null;
create index resources_topic_idx on public.resources (topic_id) where topic_id is not null;
create index resources_title_trgm_idx on public.resources using gin (title gin_trgm_ops);

create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

-- `published_at` acompanha o botão de publicar sozinho: uma data preenchida à
-- mão no painel é uma data que vai divergir do estado real.
create or replace function public.stamp_published_at()
returns trigger language plpgsql as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at := coalesce(new.published_at, now());
  elsif not new.is_published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger resources_stamp_published before insert or update on public.resources
  for each row execute function public.stamp_published_at();

alter table public.resources enable row level security;

create policy resources_select_visible on public.resources
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id)
    or public.is_admin()
  );

create policy resources_manage on public.resources
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- --------------------------------------------------------- capítulos -------
-- Marcadores de tempo do podcast e do vídeo ("Estado Novo · 7:40").
create table public.resource_chapters (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position >= 0),
  label text not null check (length(btrim(label)) between 1 and 160),
  starts_at_seconds integer not null check (starts_at_seconds >= 0),
  created_at timestamptz not null default now()
);

create unique index resource_chapters_pos_uq on public.resource_chapters (resource_id, position);

alter table public.resource_chapters enable row level security;

create policy resource_chapters_select_visible on public.resource_chapters
  for select to authenticated
  using (exists (select 1 from public.resources r where r.id = resource_id));

create policy resource_chapters_manage on public.resource_chapters
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- --------------------------------------------------------- questões --------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  topic_id uuid references public.content_topics (id) on delete set null,
  position integer not null check (position > 0),
  statement text not null check (length(btrim(statement)) >= 3),
  -- Aparece DEPOIS de responder. É o que transforma erro em aprendizado.
  explanation text,
  difficulty text not null default 'medio' check (difficulty in ('facil', 'medio', 'dificil')),
  points numeric(5, 2) not null default 1 check (points > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index questions_position_uq on public.questions (resource_id, position);
create index questions_topic_idx on public.questions (topic_id) where topic_id is not null;

create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

-- Sem policy de SELECT para aluno, de propósito. `explanation` entrega a
-- resposta, e RLS é por linha, não por coluna: qualquer leitura direta da
-- tabela seria o gabarito disponível antes de responder. O aluno recebe as
-- questões pela função `quiz_questions()`, que devolve enunciado e
-- alternativas sem o gabarito. A policy abaixo (FOR ALL) cobre o admin.
create policy questions_manage on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- ------------------------------------------------------- alternativas ------
create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position integer not null check (position > 0),
  body text not null check (length(btrim(body)) >= 1),
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index question_options_position_uq on public.question_options (question_id, position);
-- Uma questão de múltipla escolha tem exatamente uma resposta certa. Índice
-- parcial único: o banco recusa a segunda antes que ela vire um bug de correção.
create unique index question_options_single_correct_uq
  on public.question_options (question_id) where is_correct;

alter table public.question_options enable row level security;

-- Mesma razão: `is_correct` nesta tabela É o gabarito.
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id and (public.can_manage_school(r.school_id) or public.is_admin())
  ));

-- --------------------------------------------------------- trilhas ---------
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  description text,
  grade_levels text[] not null default '{}',
  is_published boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tracks_subject_idx on public.tracks (subject_catalog_id) where is_published;

create trigger tracks_set_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

alter table public.tracks enable row level security;

create policy tracks_select_visible on public.tracks
  for select to authenticated
  using (
    (is_published and (school_id is null or school_id = public.current_school_id()))
    or public.can_manage_school(school_id) or public.is_admin()
  );

create policy tracks_manage on public.tracks
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

create table public.track_sections (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  created_at timestamptz not null default now()
);

create unique index track_sections_position_uq on public.track_sections (track_id, position);

alter table public.track_sections enable row level security;

create policy track_sections_select_visible on public.track_sections
  for select to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id));

create policy track_sections_manage on public.track_sections
  for all to authenticated
  using (exists (
    select 1 from public.tracks t
    where t.id = track_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.tracks t
    where t.id = track_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));

-- O nó da trilha. `unlock_after_lesson_id` é o que desenha o caminho: sem ele
-- a trilha vira uma lista, e "bloqueado · conclua MUV antes" não tem como ser
-- calculado.
create table public.track_lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.track_sections (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 600),
  xp_reward integer not null default 20 check (xp_reward between 0 and 1000),
  unlock_after_lesson_id uuid references public.track_lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index track_lessons_position_uq on public.track_lessons (section_id, position);

create trigger track_lessons_set_updated_at before update on public.track_lessons
  for each row execute function public.set_updated_at();

alter table public.track_lessons enable row level security;

create policy track_lessons_select_visible on public.track_lessons
  for select to authenticated
  using (exists (select 1 from public.track_sections s where s.id = section_id));

create policy track_lessons_manage on public.track_lessons
  for all to authenticated
  using (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));

-- A lição é uma sequência de recursos: resumo → vídeo → quiz.
create table public.track_lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.track_lessons (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  position integer not null check (position > 0),
  is_required boolean not null default true
);

create unique index track_lesson_resources_position_uq on public.track_lesson_resources (lesson_id, position);
create unique index track_lesson_resources_pair_uq on public.track_lesson_resources (lesson_id, resource_id);

alter table public.track_lesson_resources enable row level security;

create policy track_lesson_resources_select_visible on public.track_lesson_resources
  for select to authenticated
  using (exists (select 1 from public.track_lessons l where l.id = lesson_id));

create policy track_lesson_resources_manage on public.track_lesson_resources
  for all to authenticated
  using (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id and (public.can_manage_school(t.school_id) or public.is_admin())
  ));
