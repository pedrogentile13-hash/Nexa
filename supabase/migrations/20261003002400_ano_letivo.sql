-- ============================================================================
-- Nexa — Ano letivo
--
-- A escola muda todo ano: o 9º vira 1º EM, as salas mudam, professores trocam de
-- turma. Aqui o ano passa a ser uma coisa de verdade:
--   · `school_years`: 2026 (atual), 2027 (em preparação), anos encerrados.
--   · Cada turma pertence a um ano (`classes.school_year_id`); ao virar o ano, as
--     turmas antigas são ENCERRADAS (não apagadas) e nascem as novas.
--   · `class_enrollments`: em qual turma cada aluno esteve em cada ano.
--   · `student_year_results`: as notas finais de cada aluno, congeladas ao encerrar o ano.
--   · Preparação (começo do ano): a direção/coordenação monta as turmas e a lista de
--     alunos do ano seguinte sem mexer em nada do ano que ainda está rodando, e só então
--     "vira o ano" de uma vez.
-- Nada é apagado: resumos, simulados, tentativas, notas e atribuições ficam guardados com a
-- turma e a data de cada ano.
-- ============================================================================

-- ------------------------------------------------------------------ anos --
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  status text not null default 'planning' check (status in ('planning', 'current', 'closed')),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, year)
);

create unique index if not exists school_years_one_current on public.school_years (school_id) where status = 'current';

alter table public.school_years enable row level security;

drop policy if exists school_years_select on public.school_years;
create policy school_years_select on public.school_years
  for select to authenticated
  using (school_id = public.current_school_id() or public.can_manage_school(school_id));

-- Interna: o ano atual da escola (cria o do ano corrente se a escola ainda não tem nenhum).
create or replace function public.ensure_current_year(p_school_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from public.school_years where school_id = p_school_id and status = 'current';
  if v_id is null then
    insert into public.school_years (school_id, year, status)
    values (p_school_id, extract(year from (now() at time zone 'America/Sao_Paulo'))::int, 'current')
    on conflict (school_id, year) do update set status = 'current'
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

revoke execute on function public.ensure_current_year(uuid) from public, anon, authenticated;

insert into public.school_years (school_id, year, status)
select s.id, extract(year from (now() at time zone 'America/Sao_Paulo'))::int, 'current'
from public.schools s
where not exists (select 1 from public.school_years y where y.school_id = s.id and y.status = 'current')
on conflict (school_id, year) do nothing;

create or replace function public.schools_first_year()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.ensure_current_year(new.id);
  return new;
end;
$$;

drop trigger if exists schools_first_year on public.schools;
create trigger schools_first_year after insert on public.schools
  for each row execute function public.schools_first_year();

-- ---------------------------------------------------------------- turmas --
alter table public.classes add column if not exists school_year_id uuid references public.school_years (id) on delete restrict;
alter table public.classes add column if not exists closed_at timestamptz;
alter table public.classes add column if not exists grade text;

update public.classes c
set school_year_id = (select y.id from public.school_years y where y.school_id = c.school_id and y.status = 'current')
where c.school_year_id is null;

create or replace function public.classes_set_year()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.school_year_id is null then new.school_year_id := public.ensure_current_year(new.school_id); end if;
  return new;
end;
$$;

drop trigger if exists classes_set_year on public.classes;
create trigger classes_set_year before insert on public.classes
  for each row execute function public.classes_set_year();

-- O nome da turma só precisa ser único dentro do ANO ("9A" existe em 2026 e em 2027).
drop index if exists public.classes_school_name_uq;
create unique index if not exists classes_year_name_uq on public.classes (school_id, school_year_id, lower(btrim(name)));

drop policy if exists classes_select_visible on public.classes;
create policy classes_select_visible on public.classes
  for select to authenticated
  using ((school_id = public.current_school_id() and closed_at is null) or public.can_manage_school(school_id));

alter table public.profiles add column if not exists graduated_at date;

-- Turmas encerradas não aparecem para o dia a dia.
create or replace function public.staff_visible_classes(p_school_id uuid default null)
returns table (class_id uuid, school_id uuid)
language sql stable security definer set search_path = public as $$
  with me as (
    select p.id, p.role, coalesce(p_school_id, p.school_id) as school_id
    from public.profiles p where p.id = auth.uid()
  )
  select c.id, c.school_id
  from public.classes c, me
  where c.school_id = me.school_id
    and c.closed_at is null
    and (
      public.school_staff_level(c.school_id) >= 2
      or exists (select 1 from public.teacher_assignments ta where ta.teacher_id = me.id and ta.class_id = c.id)
    );
$$;

grant execute on function public.staff_visible_classes(uuid) to authenticated;

-- Quem se formou não é "aluno sem turma".
create or replace function public.staff_unassigned_students()
returns table (user_id uuid, full_name text, school_login text)
language sql stable security definer set search_path = public as $$
  select s.id, coalesce(s.full_name, 'Sem nome'), s.school_login
  from public.profiles me
  join public.profiles s on s.school_id = me.school_id and s.role = 'student' and s.class_id is null and s.graduated_at is null
  where me.id = auth.uid() and public.school_staff_level(me.school_id) >= 2
  order by s.full_name
  limit 200;
$$;

grant execute on function public.staff_unassigned_students() to authenticated;

-- ------------------------------------------------------------ matrículas --
create table if not exists public.class_enrollments (
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (school_year_id, student_id)
);

create index if not exists class_enrollments_class_idx on public.class_enrollments (class_id);

alter table public.class_enrollments enable row level security;

drop policy if exists class_enrollments_select on public.class_enrollments;
create policy class_enrollments_select on public.class_enrollments
  for select to authenticated
  using (student_id = auth.uid() or public.school_staff_level(school_id) >= 2);

insert into public.class_enrollments (school_year_id, school_id, student_id, class_id)
select c.school_year_id, c.school_id, p.id, c.id
from public.profiles p
join public.classes c on c.id = p.class_id
where p.role = 'student' and c.school_year_id is not null
on conflict (school_year_id, student_id) do nothing;

-- A turma ATUAL do aluno (`profiles.class_id`) continua mandando no app; este gatilho
-- só guarda o histórico de ano em ano.
create or replace function public.sync_enrollment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from 'student' then return new; end if;
  if new.class_id is not null then
    insert into public.class_enrollments (school_year_id, school_id, student_id, class_id)
    select c.school_year_id, c.school_id, new.id, c.id
    from public.classes c
    where c.id = new.class_id and c.school_year_id is not null
    on conflict (school_year_id, student_id) do update set class_id = excluded.class_id;
  elsif tg_op = 'UPDATE' and old.class_id is not null then
    -- Sair de uma turma ABERTA apaga a matrícula dela; a de turma encerrada é história e fica.
    delete from public.class_enrollments e
    using public.classes c
    where e.student_id = new.id and e.class_id = old.class_id and c.id = old.class_id and c.closed_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_enrollment on public.profiles;
create trigger profiles_sync_enrollment after insert or update of class_id on public.profiles
  for each row execute function public.sync_enrollment();

-- ------------------------------------------------------- notas do ano --
create table if not exists public.student_year_results (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  class_name text not null,
  class_grade text,
  subject_name text not null,
  score numeric(4, 2),
  quizzes_done integer not null default 0,
  simulados_done integer not null default 0,
  content_completed integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists student_year_results_year_idx on public.student_year_results (school_year_id, class_id);
create index if not exists student_year_results_student_idx on public.student_year_results (student_id);

alter table public.student_year_results enable row level security;

drop policy if exists student_year_results_select on public.student_year_results;
create policy student_year_results_select on public.student_year_results
  for select to authenticated
  using (student_id = auth.uid() or public.school_staff_level(school_id) >= 2);

-- --------------------------------------------------- planejamento do ano --
create table if not exists public.year_plan_classes (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 40),
  grade text check (grade is null or grade in ('6', '7', '8', '9', '1em', '2em', '3em')),
  promoted_from uuid references public.classes (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists year_plan_classes_name_uq on public.year_plan_classes (school_year_id, lower(btrim(name)));

create table if not exists public.year_plan_students (
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  plan_class_id uuid references public.year_plan_classes (id) on delete set null,
  primary key (school_year_id, student_id)
);

create table if not exists public.year_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  subject_catalog_id uuid not null references public.subject_catalog (id) on delete cascade,
  plan_class_id uuid not null references public.year_plan_classes (id) on delete cascade,
  unique (teacher_id, subject_catalog_id, plan_class_id)
);

alter table public.year_plan_classes enable row level security;
alter table public.year_plan_students enable row level security;
alter table public.year_plan_assignments enable row level security;
-- (Sem policy: tudo passa pelas funções abaixo.)

create or replace function public.next_grade(p_grade text)
returns text language sql immutable set search_path = public as $$
  select case p_grade
    when '6' then '7' when '7' then '8' when '8' then '9' when '9' then '1em'
    when '1em' then '2em' when '2em' then '3em' else null end;
$$;

-- "9º ano B" no 9º vira "1º EM B"; sem letra no fim, só o nome do ano.
create or replace function public.suggest_class_name(p_old text, p_new_grade text)
returns text language sql immutable set search_path = public as $$
  select case when p_new_grade is null then btrim(p_old)
    else public.grade_label(p_new_grade)
      || coalesce(' ' || upper(substring(btrim(p_old) from '(?:^|[\s0-9ºª°.-])([A-Za-z])$')), '')
  end;
$$;

-- Porta das funções de gestão do ano: coordenação ou direção da escola.
create or replace function public.require_year_manager(p_school_id uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in required' using errcode = '28000'; end if;
  if p_school_id is null or public.school_staff_level(p_school_id) < 2 then
    raise exception 'só coordenação e direção cuidam do ano letivo' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.require_year_manager(uuid) from public, anon, authenticated;

create or replace function public.school_years_overview()
returns table (year_id uuid, year integer, status text, classes integer, students integer, results integer)
language sql stable security definer set search_path = public as $$
  select y.id, y.year, y.status,
    case when y.status = 'planning' then (select count(*)::int from public.year_plan_classes pc where pc.school_year_id = y.id)
         else (select count(*)::int from public.classes c where c.school_year_id = y.id) end,
    case when y.status = 'planning' then (select count(*)::int from public.year_plan_students ps where ps.school_year_id = y.id and ps.plan_class_id is not null)
         else (select count(*)::int from public.class_enrollments e where e.school_year_id = y.id) end,
    (select count(*)::int from public.student_year_results r where r.school_year_id = y.id)
  from public.school_years y
  where y.school_id = public.current_school_id() and public.school_staff_level(y.school_id) >= 2
  order by y.year desc;
$$;

grant execute on function public.school_years_overview() to authenticated;

-- Cria o ano seguinte já com tudo "promovido": cada turma vira a do ano seguinte, os alunos vão junto,
-- os professores mantêm as matérias. A direção ajusta o que mudar e só depois vira o ano.
create or replace function public.prepare_school_year(p_year integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_school uuid := public.current_school_id();
  v_cur public.school_years%rowtype;
  v_new uuid;
  r record;
  v_grade text;
  v_name text;
  v_n integer;
  v_pc uuid;
begin
  perform public.require_year_manager(v_school);
  select * into v_cur from public.school_years where school_id = v_school and status = 'current';
  if not found then raise exception 'a escola não tem ano atual' using errcode = 'P0002'; end if;
  if p_year <= v_cur.year then raise exception 'o novo ano precisa ser depois de %', v_cur.year using errcode = '22023'; end if;
  if exists (select 1 from public.school_years where school_id = v_school and status = 'planning') then
    raise exception 'já existe um ano em preparação' using errcode = '23505';
  end if;
  if exists (select 1 from public.school_years where school_id = v_school and year = p_year) then
    raise exception 'esse ano já existe' using errcode = '23505';
  end if;

  insert into public.school_years (school_id, year, status) values (v_school, p_year, 'planning') returning id into v_new;

  for r in select c.id, c.name, c.grade from public.classes c
           where c.school_year_id = v_cur.id and c.closed_at is null and c.grade is distinct from '3em' order by c.name loop
    v_grade := public.next_grade(r.grade);
    v_name := public.suggest_class_name(r.name, v_grade);
    v_n := 1;
    while exists (select 1 from public.year_plan_classes where school_year_id = v_new and lower(btrim(name)) = lower(btrim(v_name))) loop
      v_n := v_n + 1;
      v_name := public.suggest_class_name(r.name, v_grade) || ' (' || v_n || ')';
    end loop;
    insert into public.year_plan_classes (school_year_id, name, grade, promoted_from)
    values (v_new, left(v_name, 40), v_grade, r.id);
  end loop;

  insert into public.year_plan_students (school_year_id, student_id, plan_class_id)
  select v_new, s.id, pc.id
  from public.profiles s
  join public.classes c on c.id = s.class_id and c.school_year_id = v_cur.id
  left join public.year_plan_classes pc on pc.school_year_id = v_new and pc.promoted_from = c.id
  where s.role = 'student' and s.school_id = v_school
  on conflict do nothing;

  insert into public.year_plan_assignments (school_year_id, teacher_id, subject_catalog_id, plan_class_id)
  select v_new, ta.teacher_id, ta.subject_catalog_id, pc.id
  from public.teacher_assignments ta
  join public.year_plan_classes pc on pc.school_year_id = v_new and pc.promoted_from = ta.class_id
  on conflict do nothing;

  return v_new;
end;
$$;

grant execute on function public.prepare_school_year(integer) to authenticated;

-- Tudo do ano em preparação numa chamada só (turmas, alunos, professores).
create or replace function public.year_plan_overview(p_year_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_year public.school_years%rowtype;
begin
  select * into v_year from public.school_years where id = p_year_id;
  if not found then raise exception 'ano não encontrado' using errcode = 'P0002'; end if;
  perform public.require_year_manager(v_year.school_id);

  return jsonb_build_object(
    'year', v_year.year,
    'status', v_year.status,
    'classes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pc.id, 'name', pc.name, 'grade', pc.grade,
        'from', (select c.name from public.classes c where c.id = pc.promoted_from),
        'students', (select count(*) from public.year_plan_students ps where ps.plan_class_id = pc.id),
        'teachers', coalesce((
          select jsonb_agg(jsonb_build_object('id', a.id, 'teacher', t.full_name, 'subject', sc.name) order by t.full_name)
          from public.year_plan_assignments a
          join public.profiles t on t.id = a.teacher_id
          join public.subject_catalog sc on sc.id = a.subject_catalog_id
          where a.plan_class_id = pc.id), '[]'::jsonb)
      ) order by pc.grade nulls last, pc.name)
      from public.year_plan_classes pc where pc.school_year_id = p_year_id), '[]'::jsonb),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', coalesce(s.full_name, 'Sem nome'), 'planClassId', ps.plan_class_id,
        'fromClass', (select c.name from public.classes c where c.id = s.class_id),
        'graduating', coalesce((select c.grade = '3em' from public.classes c where c.id = s.class_id), false)
      ) order by s.full_name)
      from public.year_plan_students ps join public.profiles s on s.id = ps.student_id
      where ps.school_year_id = p_year_id), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.year_plan_overview(uuid) to authenticated;

-- Dono do ano (e da escola) ou erro: usado pelas funções de edição do plano.
create or replace function public.plan_year_of(p_year_id uuid)
returns public.school_years language plpgsql stable security definer set search_path = public as $$
declare
  v_year public.school_years%rowtype;
begin
  select * into v_year from public.school_years where id = p_year_id;
  if not found then raise exception 'ano não encontrado' using errcode = 'P0002'; end if;
  perform public.require_year_manager(v_year.school_id);
  if v_year.status <> 'planning' then raise exception 'esse ano não está em preparação' using errcode = '22023'; end if;
  return v_year;
end;
$$;

revoke execute on function public.plan_year_of(uuid) from public, anon, authenticated;

create or replace function public.plan_save_class(p_year_id uuid, p_class_id uuid, p_name text, p_grade text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform public.plan_year_of(p_year_id);
  if p_grade is not null and p_grade not in ('6', '7', '8', '9', '1em', '2em', '3em') then
    raise exception 'ano inválido' using errcode = '22023';
  end if;
  if p_class_id is null then
    insert into public.year_plan_classes (school_year_id, name, grade) values (p_year_id, btrim(p_name), p_grade) returning id into v_id;
  else
    update public.year_plan_classes set name = btrim(p_name), grade = p_grade
    where id = p_class_id and school_year_id = p_year_id returning id into v_id;
    if v_id is null then raise exception 'turma não encontrada' using errcode = 'P0002'; end if;
  end if;
  return v_id;
end;
$$;

grant execute on function public.plan_save_class(uuid, uuid, text, text) to authenticated;

create or replace function public.plan_delete_class(p_year_id uuid, p_class_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.plan_year_of(p_year_id);
  delete from public.year_plan_classes where id = p_class_id and school_year_id = p_year_id;
end;
$$;

grant execute on function public.plan_delete_class(uuid, uuid) to authenticated;

-- Põe um aluno numa turma do ano em preparação (ou tira: p_plan_class_id nulo).
create or replace function public.plan_move_student(p_year_id uuid, p_student_id uuid, p_plan_class_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_year public.school_years%rowtype;
begin
  v_year := public.plan_year_of(p_year_id);
  if not exists (select 1 from public.profiles s where s.id = p_student_id and s.school_id = v_year.school_id and s.role = 'student') then
    raise exception 'aluno não encontrado' using errcode = 'P0002';
  end if;
  if p_plan_class_id is not null and not exists (
    select 1 from public.year_plan_classes pc where pc.id = p_plan_class_id and pc.school_year_id = p_year_id
  ) then
    raise exception 'turma não encontrada' using errcode = 'P0002';
  end if;
  insert into public.year_plan_students (school_year_id, student_id, plan_class_id)
  values (p_year_id, p_student_id, p_plan_class_id)
  on conflict (school_year_id, student_id) do update set plan_class_id = excluded.plan_class_id;
end;
$$;

grant execute on function public.plan_move_student(uuid, uuid, uuid) to authenticated;

create or replace function public.plan_remove_assignment(p_year_id uuid, p_assignment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.plan_year_of(p_year_id);
  delete from public.year_plan_assignments where id = p_assignment_id and school_year_id = p_year_id;
end;
$$;

grant execute on function public.plan_remove_assignment(uuid, uuid) to authenticated;

create or replace function public.cancel_school_year_plan(p_year_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.plan_year_of(p_year_id);
  delete from public.school_years where id = p_year_id and status = 'planning';
end;
$$;

grant execute on function public.cancel_school_year_plan(uuid) to authenticated;

-- VIRAR O ANO: congela as notas do ano que acaba, encerra as turmas dele e abre as novas.
create or replace function public.activate_school_year(p_year_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_year public.school_years%rowtype;
  v_cur public.school_years%rowtype;
  v_snapshots integer := 0;
  v_moved integer := 0;
  v_graduated integer := 0;
begin
  v_year := public.plan_year_of(p_year_id);
  select * into v_cur from public.school_years where school_id = v_year.school_id and status = 'current';

  if found then
    -- 1) notas finais de cada aluno, do jeito que estavam hoje
    insert into public.student_year_results (school_year_id, school_id, student_id, class_id, class_name, class_grade, subject_name, score, quizzes_done, simulados_done, content_completed)
    select v_cur.id, v_cur.school_id, s.id, c.id, c.name, c.grade, ss.subject_name, round(ss.blended_score, 2), coalesce(ss.quizzes_done, 0), coalesce(ss.simulados_done, 0), coalesce(ss.content_completed, 0)
    from public.profiles s
    join public.classes c on c.id = s.class_id and c.school_year_id = v_cur.id
    cross join lateral public.subject_scores(s.id) ss
    where s.role = 'student' and s.school_id = v_cur.school_id and ss.blended_score is not null;
    get diagnostics v_snapshots = row_count;

    -- 2) o ano que acaba vira história
    update public.classes set closed_at = now() where school_year_id = v_cur.id and closed_at is null;
    update public.school_years set status = 'closed', closed_at = now() where id = v_cur.id;
  end if;

  -- 3) nascem as turmas do novo ano
  insert into public.classes (school_id, name, grade, school_year_id, created_by)
  select v_year.school_id, pc.name, pc.grade, v_year.id, auth.uid()
  from public.year_plan_classes pc where pc.school_year_id = v_year.id;

  update public.school_years set status = 'current' where id = v_year.id;

  -- 4) cada aluno vai para a turma planejada
  update public.profiles p
  set class_id = nc.id, graduated_at = null
  from public.year_plan_students ps
  join public.year_plan_classes pc on pc.id = ps.plan_class_id
  join public.classes nc on nc.school_year_id = v_year.id and lower(btrim(nc.name)) = lower(btrim(pc.name))
  where ps.school_year_id = v_year.id and p.id = ps.student_id;
  get diagnostics v_moved = row_count;

  -- quem ficou numa turma antiga sem destino: se era do 3º EM, formou; senão fica sem turma para a direção encaixar
  with leaving as (
    select p.id, oc.grade
    from public.profiles p
    join public.classes oc on oc.id = p.class_id and oc.closed_at is not null and oc.school_id = v_year.school_id
    where p.role = 'student'
  ), upd as (
    update public.profiles p
    set class_id = null, graduated_at = case when l.grade = '3em' then current_date end
    from leaving l where p.id = l.id
    returning l.grade
  )
  select count(*) filter (where grade = '3em') into v_graduated from upd;

  -- 5) professores nas turmas novas
  insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id, created_by)
  select a.teacher_id, v_year.school_id, a.subject_catalog_id, nc.id, auth.uid()
  from public.year_plan_assignments a
  join public.year_plan_classes pc on pc.id = a.plan_class_id
  join public.classes nc on nc.school_year_id = v_year.id and lower(btrim(nc.name)) = lower(btrim(pc.name))
  where a.school_year_id = v_year.id
  on conflict do nothing;

  delete from public.year_plan_assignments where school_year_id = v_year.id;
  delete from public.year_plan_students where school_year_id = v_year.id;
  delete from public.year_plan_classes where school_year_id = v_year.id;

  return jsonb_build_object('year', v_year.year, 'moved', v_moved, 'graduated', v_graduated, 'results', v_snapshots);
end;
$$;

grant execute on function public.activate_school_year(uuid) to authenticated;

-- A história de um ano: turmas, alunos e (se já encerrado) a média final de cada um.
create or replace function public.year_history(p_year_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_year public.school_years%rowtype;
begin
  select * into v_year from public.school_years where id = p_year_id;
  if not found then raise exception 'ano não encontrado' using errcode = 'P0002'; end if;
  perform public.require_year_manager(v_year.school_id);

  return jsonb_build_object(
    'year', v_year.year,
    'status', v_year.status,
    'classes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'grade', c.grade,
        'teachers', coalesce((
          select string_agg(distinct t.full_name, ', ')
          from public.teacher_assignments ta join public.profiles t on t.id = ta.teacher_id
          where ta.class_id = c.id), ''),
        'students', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'name', coalesce(s.full_name, 'Sem nome'),
            'average', (select round(avg(r.score), 1) from public.student_year_results r where r.school_year_id = v_year.id and r.student_id = s.id)
          ) order by s.full_name)
          from public.class_enrollments e join public.profiles s on s.id = e.student_id
          where e.class_id = c.id), '[]'::jsonb)
      ) order by c.grade nulls last, c.name)
      from public.classes c where c.school_year_id = v_year.id), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.year_history(uuid) to authenticated;

-- Funções novas nascem executáveis por todos; fecha de novo para quem não entrou.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
