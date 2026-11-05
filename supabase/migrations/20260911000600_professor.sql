-- ============================================================================
-- Nexa — 0911 (6) · Papel de professor (teacher_admin)
--
-- Pedido do usuário: um professor vinculado a matéria+turma que vê
-- desempenho/notas dos próprios alunos, manda avisos e cria/edita conteúdo
-- da própria matéria — com área própria no app, não o painel admin.
--
-- Não existe entidade "turma" no schema (profiles.class_name é texto livre,
-- sem FK) — o vínculo professor→matéria+turma precisa de uma tabela nova,
-- já que nada hoje liga um professor a um recorte de alunos. `teacher_
-- assignments` é esse vínculo: um professor pode ter várias linhas (uma por
-- matéria+turma que leciona).
--
-- Autorização segue o MESMO padrão já usado em todo o schema — nunca
-- reescrevo `can_manage_school` (usada por gestão de escola, matérias,
-- contextos sem noção de matéria); em vez disso, cada policy/RPC que hoje
-- só aceita admin/school_admin ganha um branch adicional `or is_teacher_of*`.
-- ============================================================================

-- ------------------------------------------------------------------ papel --
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'school_admin', 'admin', 'teacher_admin'));

comment on column public.profiles.role is
  'student = aluno; school_admin = gerencia o conteúdo da própria escola; '
  'admin = gerencia tudo; teacher_admin = professor, vinculado a matéria+turma via teacher_assignments.';

-- ------------------------------------------------------- vínculo professor --
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  class_name text not null check (length(btrim(class_name)) between 1 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (teacher_id, school_id, subject_catalog_id, class_name)
);

create index if not exists teacher_assignments_teacher_idx on public.teacher_assignments (teacher_id);

-- `class_name` foi substituída por `class_id` (FK) em 20260912000100 — num
-- reaplicar do zero, esta linha roda ANTES daquela migração, mas já sobre
-- um banco onde a coluna já não existe mais (idempotência do
-- setup-completo.sql). O índice em si é recriado lá, sobre `class_id`.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_assignments' and column_name = 'class_name'
  ) then
    execute 'create index if not exists teacher_assignments_scope_idx
      on public.teacher_assignments (school_id, subject_catalog_id, class_name)';
  end if;
end;
$$;

alter table public.teacher_assignments enable row level security;

-- O próprio professor precisa ler as próprias atribuições (pra montar a
-- navegação e escopar as próprias consultas); admin/school_admin da escola
-- gerenciam quem leciona o quê.
drop policy if exists teacher_assignments_select on public.teacher_assignments;
create policy teacher_assignments_select on public.teacher_assignments
  for select to authenticated
  using (teacher_id = auth.uid() or public.can_manage_school(school_id) or public.is_admin());

drop policy if exists teacher_assignments_manage on public.teacher_assignments;
create policy teacher_assignments_manage on public.teacher_assignments
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin())
  with check (public.can_manage_school(school_id) or public.is_admin());

-- --------------------------------------------------------- autorização -----
-- Professor pode gerenciar CONTEÚDO desta escola+matéria (turma não importa
-- aqui — conteúdo de uma matéria vale pra qualquer turma que a tenha).
create or replace function public.is_teacher_of(
  p_school_id uuid,
  p_subject_catalog_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments ta
    join public.profiles p on p.id = ta.teacher_id
    where ta.teacher_id = p_user_id
      and p.role = 'teacher_admin'
      and ta.school_id = p_school_id
      and ta.subject_catalog_id = p_subject_catalog_id
  );
$$;

-- Professor pode ver o DESEMPENHO de um aluno específico: existe uma
-- atribuição do professor cuja escola+turma batem com a escola+turma atuais
-- do aluno alvo. (A matéria não restringe aqui, de propósito — ver Fase D
-- do plano: relatório do aluno mostrado por inteiro, não filtrado por
-- matéria, pra reaproveitar o mesmo relatório do admin sem lógica nova.)
-- `class_name` foi substituída por `class_id` (FK) em 20260912000100 — a
-- versão de baixo (comparando por nome de turma) só existe pra funcionar
-- entre esta migração e aquela, numa instalação do zero. Numa reaplicação
-- (`class_name` já não existe mais), a linguagem `sql` desta função
-- validaria as colunas NA HORA de criar — por isso o guarda: sem ele, a
-- própria reaplicação do setup quebraria antes de chegar na versão nova.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_assignments' and column_name = 'class_name'
  ) then
    execute $ddl$
      create or replace function public.is_teacher_of_student(
        p_target_user_id uuid,
        p_user_id uuid default auth.uid()
      )
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $inner$
        select exists (
          select 1 from public.teacher_assignments ta
          join public.profiles p on p.id = ta.teacher_id
          join public.profiles target on target.id = p_target_user_id
          where ta.teacher_id = p_user_id
            and p.role = 'teacher_admin'
            and ta.school_id = target.school_id
            and ta.class_name = target.class_name
        );
      $inner$;
    $ddl$;
  end if;
end;
$$;

-- ---------------------------------------------- leitura: RPCs admin_* ------
-- As seis únicas portas de leitura de desempenho de outro usuário ganham o
-- branch de professor, sem duplicar RPC nem mudar o shape de retorno.
create or replace function public.admin_subject_scores(p_target_user_id uuid)
returns table (
  subject_id uuid, subject_name text, subject_color text, has_content boolean,
  assessment_score numeric, empenho_index numeric, blended_score numeric,
  quizzes_done integer, simulados_done integer, content_completed integer,
  target_grade numeric, passing_grade numeric
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
  return query select * from public.subject_scores(p_target_user_id);
end;
$$;

create or replace function public.admin_performance_evolution(
  p_target_user_id uuid,
  p_weeks integer default 12
)
returns table (
  week_start date, assessment_score numeric, empenho_index numeric, blended_score numeric
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
  return query select * from public.performance_evolution(p_target_user_id, p_weeks);
end;
$$;

create or replace function public.admin_simulado_history(p_target_user_id uuid)
returns table (
  attempt_id uuid, resource_id uuid, resource_title text, subject_id uuid,
  subject_name text, subject_color text, correct_count integer, total_count integer,
  percent numeric, duration_seconds integer, finished_at timestamptz
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
  return query select * from public.simulado_history(p_target_user_id);
end;
$$;

create or replace function public.admin_study_sessions(p_target_user_id uuid)
returns table (local_date date, duration_seconds integer)
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
  return query
    select ss.local_date, ss.duration_seconds
    from public.study_sessions ss
    where ss.user_id = p_target_user_id and ss.ended_at is not null
    order by ss.local_date;
end;
$$;

create or replace function public.admin_user_stats(p_target_user_id uuid)
returns table (
  xp integer, level smallint, current_streak integer, longest_streak integer,
  total_study_seconds bigint, last_active_local_date date
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
  return query
    select us.xp, us.level, us.current_streak, us.longest_streak,
           us.total_study_seconds, us.last_active_local_date
    from public.user_stats us
    where us.user_id = p_target_user_id;
end;
$$;

-- `admin_school_summary` fica de fora: é um agregado da ESCOLA inteira
-- (p_school_id, sem p_target_user_id), usado só em /admin/relatorios — não
-- se encaixa no recorte matéria+turma do professor, que enxerga só o
-- próprio roster (Fase B, `getTeacherRoster`), não a escola toda.

-- --------------------------------------------- escrita: conteúdo de matéria --
-- Cada policy de gerenciamento de conteúdo ganha `or is_teacher_of(...)`,
-- resolvendo escola+matéria da própria linha (ou via join até `resources`/
-- `tracks`, seguindo exatamente o padrão que essas policies já usam para
-- `can_manage_school`).
drop policy if exists content_topics_manage on public.content_topics;
create policy content_topics_manage on public.content_topics
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists resource_chapters_manage on public.resource_chapters;
create policy resource_chapters_manage on public.resource_chapters
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

drop policy if exists questions_manage on public.questions;
create policy questions_manage on public.questions
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

drop policy if exists question_options_manage on public.question_options;
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.can_manage_school(r.school_id) or public.is_admin() or public.is_teacher_of(r.school_id, r.subject_catalog_id))
  ));

drop policy if exists tracks_manage on public.tracks;
create policy tracks_manage on public.tracks
  for all to authenticated
  using (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id))
  with check (public.can_manage_school(school_id) or public.is_admin() or public.is_teacher_of(school_id, subject_catalog_id));

drop policy if exists track_sections_manage on public.track_sections;
create policy track_sections_manage on public.track_sections
  for all to authenticated
  using (exists (
    select 1 from public.tracks t
    where t.id = track_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.tracks t
    where t.id = track_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

drop policy if exists track_lessons_manage on public.track_lessons;
create policy track_lessons_manage on public.track_lessons
  for all to authenticated
  using (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.track_sections s join public.tracks t on t.id = s.track_id
    where s.id = section_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

drop policy if exists track_lesson_resources_manage on public.track_lesson_resources;
create policy track_lesson_resources_manage on public.track_lesson_resources
  for all to authenticated
  using (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ))
  with check (exists (
    select 1 from public.track_lessons l
    join public.track_sections s on s.id = l.section_id
    join public.tracks t on t.id = s.track_id
    where l.id = lesson_id
      and (public.can_manage_school(t.school_id) or public.is_admin() or public.is_teacher_of(t.school_id, t.subject_catalog_id))
  ));

-- ------------------------------------------------- leitura de perfis ------
-- `getPersonById`/`getAdminStudentReport` (reaproveitados pelo professor,
-- Fase B/D do plano) leem `profiles` diretamente ANTES de chegar nas RPCs
-- `admin_*` — sem este branch aqui, a policy `profiles_select_admin`
-- (0909 (3)) devolveria zero linhas pra um professor mesmo autorizado, e o
-- relatório quebraria antes mesmo de rodar a checagem de dentro da RPC.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (
    public.is_admin()
    or public.can_manage_school(school_id)
    or public.is_teacher_of_student(id)
  );

-- --------------------------------------------------- storage: nexa-content --
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket policy fix';
    return;
  end if;

  execute $ddl$
    create or replace function public.can_write_content_object(p_object_name text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $inner$
      select
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin', 'school_admin', 'teacher_admin')
        )
        and (
          not exists (select 1 from public.resources r where r.storage_path = p_object_name)
          or exists (
            select 1 from public.resources r
            where r.storage_path = p_object_name
              and (
                public.can_manage_school(r.school_id)
                or public.is_teacher_of(r.school_id, r.subject_catalog_id)
              )
          )
        );
    $inner$;
  $ddl$;
end;
$$;

-- ------------------------------------------------------- avisos de turma ---
-- `notify_subject_students` (escola+matéria, sem turma) já existe; a
-- capacidade "avisar minha turma" do professor precisa de recorte por turma,
-- que aquela função nunca teve.
create or replace function public.notify_class(
  p_class_name text,
  p_subject_catalog_id uuid,
  p_school_id uuid,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
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

  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and p.school_id = p_school_id
    and p.class_name = p_class_name;
end;
$$;

grant execute on function public.is_teacher_of(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_teacher_of_student(uuid, uuid) to authenticated;
grant execute on function public.notify_class(text, uuid, uuid, text, text, text) to authenticated;
