-- ============================================================================
-- Nexa — 0912 (1) · Turma vira entidade de verdade (tabela `classes`)
--
-- Até aqui `class_name` era texto livre digitado pelo próprio aluno no
-- onboarding — e três peças construídas nesta mesma sessão (`school_ranking`
-- turma, `is_teacher_of_student`, `notify_class`) dependem de IGUALDADE
-- EXATA de string pra funcionar. "9A" e "9°A" são turmas diferentes pro
-- sistema hoje, silenciosamente: o aluno some do ranking da própria turma,
-- ou nunca aparece pro professor que deveria enxergá-lo.
--
-- A partir de agora `classes` é cadastrada por admin geral/da escola —
-- mesmo padrão de `schools`/`subject_catalog` — e tanto `profiles` quanto
-- `teacher_assignments` passam a guardar `class_id` (FK), não mais texto.
-- Turma sai do onboarding (que também nunca perguntou escola — só liga
-- `school_id` quem cadastra pelo Perfil, depois) e vira uma escolha no
-- Perfil, logo após vincular a escola.
--
-- O backfill funde variações de maiúsculo/espaço da MESMA turma na MESMA
-- linha nova (compara por `lower(btrim(...))`) — sem isso, o próprio
-- backfill recriaria o problema que está sendo corrigido.
-- ============================================================================

-- ------------------------------------------------------------------ tabela --
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 40),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists classes_school_name_uq
  on public.classes (school_id, lower(btrim(name)));

alter table public.classes enable row level security;

-- Aluno/professor da escola leem (pra popular seletor no Perfil e no
-- roster do professor); admin geral e admin da escola gerenciam.
drop policy if exists classes_select_visible on public.classes;
create policy classes_select_visible on public.classes
  for select to authenticated
  using (school_id = public.current_school_id() or public.can_manage_school(school_id));

drop policy if exists classes_manage on public.classes;
create policy classes_manage on public.classes
  for all to authenticated
  using (public.can_manage_school(school_id))
  with check (public.can_manage_school(school_id));

-- --------------------------------------------------------------- backfill --
-- Backfill + troca de coluna são, por natureza, uma operação de uma vez só
-- (leem `class_name` e depois APAGAM essa mesma coluna) — o guarda abaixo é
-- o que torna isso seguro reaplicar: numa reaplicação do setup inteiro
-- sobre um banco já migrado (`scripts/test-db.sh` faz isso de propósito,
-- pra provar que instalar por cima de uma versão antiga não quebra nada),
-- `profiles.class_name` já não existe mais na segunda passada, e o bloco
-- inteiro é pulado.
do $$
declare
  v_uq_name text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'class_name'
  ) then
    -- Uma turma nova por combinação distinta (escola, nome-normalizado) já
    -- existente em profiles OU em teacher_assignments — cobre também a
    -- turma que já tem professor atribuído mas zero aluno ainda.
    insert into public.classes (school_id, name)
    select distinct p.school_id, btrim(p.class_name)
    from public.profiles p
    where p.school_id is not null and btrim(coalesce(p.class_name, '')) <> ''
    on conflict (school_id, lower(btrim(name))) do nothing;

    insert into public.classes (school_id, name)
    select distinct ta.school_id, btrim(ta.class_name)
    from public.teacher_assignments ta
    where btrim(coalesce(ta.class_name, '')) <> ''
    on conflict (school_id, lower(btrim(name))) do nothing;

    alter table public.profiles add column class_id uuid references public.classes (id) on delete set null;

    update public.profiles p
    set class_id = c.id
    from public.classes c
    where p.school_id = c.school_id
      and p.class_name is not null
      and lower(btrim(p.class_name)) = lower(btrim(c.name));

    alter table public.profiles drop column class_name;

    alter table public.teacher_assignments add column class_id uuid references public.classes (id) on delete cascade;

    update public.teacher_assignments ta
    set class_id = c.id
    from public.classes c
    where ta.school_id = c.school_id
      and lower(btrim(ta.class_name)) = lower(btrim(c.name));

    -- Toda linha de teacher_assignments tinha class_name not null (check
    -- constraint da migração anterior), então o backfill acima cobre
    -- 100% — seguro travar not null agora.
    alter table public.teacher_assignments alter column class_id set not null;

    -- A unique constraint original (teacher_id, school_id,
    -- subject_catalog_id, class_name) foi criada sem nome explícito — o
    -- Postgres escolheu o nome sozinho (e pode ter truncado, o nome
    -- ficaria longo demais pro limite de 63 bytes). Acha e derruba pelo
    -- nome REAL em vez de adivinhar.
    select conname into v_uq_name
    from pg_constraint
    where conrelid = 'public.teacher_assignments'::regclass and contype = 'u';
    if v_uq_name is not null then
      execute format('alter table public.teacher_assignments drop constraint %I', v_uq_name);
    end if;

    alter table public.teacher_assignments drop column class_name;
    alter table public.teacher_assignments
      add constraint teacher_assignments_scope_uq
      unique (teacher_id, school_id, subject_catalog_id, class_id);
  end if;
end;
$$;

create index if not exists profiles_class_idx on public.profiles (class_id) where class_id is not null;
create index if not exists teacher_assignments_scope_idx
  on public.teacher_assignments (school_id, subject_catalog_id, class_id);

-- ------------------------------------------------------ funções que filtram --
-- `school_ranking`: turma agora é `p_class_id` (posição diferente do
-- `p_class_name` antigo — `create or replace` não bastaria mesmo se a
-- posição fosse igual, já que o TIPO do 2º argumento muda de text pra uuid;
-- derruba a assinatura antiga primeiro pra não coexistirem duas versões).
drop function if exists public.school_ranking(text, text, text, uuid);

create or replace function public.school_ranking(
  p_scope text default 'escola',
  p_class_id uuid default null,
  p_period text default 'geral',
  p_school_id uuid default null
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  xp bigint,
  level smallint,
  current_streak integer,
  questions_answered integer,
  study_hours numeric,
  rank bigint,
  previous_rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_school_id uuid;
  v_period_start date;
  v_today date := public.user_local_date(auth.uid());
begin
  select p.role into v_caller_role from public.profiles p where p.id = auth.uid();

  if v_caller_role = 'admin' and p_school_id is not null then
    v_school_id := p_school_id;
  else
    v_school_id := public.current_school_id(auth.uid());
  end if;

  if v_school_id is null then
    return;
  end if;

  v_period_start := case p_period
    when 'hoje' then v_today
    when 'semana' then date_trunc('week', v_today)::date
    when 'mes' then date_trunc('month', v_today)::date
    else null
  end;

  return query
  with escopo as (
    select pr.id as user_id, pr.full_name, pr.avatar_url, c.name as class_name
    from public.profiles pr
    left join public.classes c on c.id = pr.class_id
    where pr.school_id = v_school_id
      and pr.role = 'student'
      and (p_scope <> 'turma' or pr.class_id = p_class_id)
  ),
  xp_no_periodo as (
    select e.user_id, sum(e.amount) as ganho
    from public.xp_events e
    where v_period_start is not null and e.local_date >= v_period_start
    group by e.user_id
  ),
  xp_total as (
    select us.user_id, us.xp, us.level, us.current_streak, us.total_study_seconds
    from public.user_stats us
    where us.user_id in (select escopo.user_id from escopo)
  ),
  atual as (
    select
      esc.user_id, esc.full_name, esc.avatar_url, esc.class_name,
      coalesce(case when v_period_start is null then xt.xp else xnp.ganho end, 0)::bigint as xp,
      coalesce(xt.level, 1) as level,
      coalesce(xt.current_streak, 0) as current_streak,
      coalesce(xt.total_study_seconds, 0) as total_study_seconds
    from escopo esc
    left join xp_total xt on xt.user_id = esc.user_id
    left join xp_no_periodo xnp on xnp.user_id = esc.user_id
  ),
  antes as (
    select a.user_id, greatest(0, coalesce(xt.xp, 0) - coalesce(xnp.ganho, 0)) as xp_antes
    from atual a
    left join xp_total xt on xt.user_id = a.user_id
    left join xp_no_periodo xnp on xnp.user_id = a.user_id
    where v_period_start is not null
  ),
  ranked_atual as (
    select a.*, rank() over (order by a.xp desc) as rk
    from atual a
  ),
  ranked_antes as (
    select an.user_id, rank() over (order by an.xp_antes desc) as rk
    from antes an
  ),
  contagens as (
    select
      qat.user_id,
      count(*) as questions_answered
    from public.quiz_answers qa
    join public.quiz_attempts qat on qat.id = qa.attempt_id
    where qat.user_id in (select escopo.user_id from escopo)
    group by qat.user_id
  )
  select
    r.user_id, r.full_name, r.avatar_url, r.class_name, r.xp, r.level::smallint,
    r.current_streak, coalesce(c.questions_answered, 0)::integer,
    round(r.total_study_seconds / 3600.0, 1),
    r.rk, ra.rk
  from ranked_atual r
  left join contagens c on c.user_id = r.user_id
  left join ranked_antes ra on ra.user_id = r.user_id
  order by r.rk;
end;
$$;

grant execute on function public.school_ranking(text, uuid, text, uuid) to authenticated;

-- `is_teacher_of_student`: compara class_id direto (FK contra FK).
create or replace function public.is_teacher_of_student(
  p_target_user_id uuid,
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
    join public.profiles target on target.id = p_target_user_id
    where ta.teacher_id = p_user_id
      and p.role = 'teacher_admin'
      and ta.school_id = target.school_id
      and ta.class_id = target.class_id
  );
$$;

-- `notify_class`: turma agora é `p_class_id` (mesmo motivo acima — tipo do
-- 1º argumento muda de text pra uuid, derruba a assinatura antiga primeiro).
drop function if exists public.notify_class(text, uuid, uuid, text, text, text);
-- Idem ao guard equivalente em notify_subject_students (0911 (2)): sem isto,
-- reaplicar por cima de um banco já em 0912 (4) (retorno `setof uuid`) falha
-- com "cannot change return type of existing function". Só importa pro
-- replay local — na ordem real das migrações, 0912 (4) roda depois desta.
drop function if exists public.notify_class(uuid, uuid, uuid, text, text, text);

create or replace function public.notify_class(
  p_class_id uuid,
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
    and p.class_id = p_class_id;
end;
$$;

grant execute on function public.notify_class(uuid, uuid, uuid, text, text, text) to authenticated;

-- `search_schoolmates`/`list_friends`/`list_friend_requests`/
-- `student_profile_card`: só EXIBEM a turma (nunca filtram por ela) — troca
-- de `p.class_name` pra `c.name` via join, sem mudar formato de retorno.
create or replace function public.search_schoolmates(p_query text)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  friendship_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
begin
  if v_school is null or btrim(coalesce(p_query, '')) = '' then
    return;
  end if;

  return query
  select
    p.id, p.full_name, p.avatar_url, c.name,
    coalesce(
      case
        when f.status = 'accepted' then 'accepted'
        when f.status = 'pending' and f.requester_id = v_me then 'pending_sent'
        when f.status = 'pending' and f.addressee_id = v_me then 'pending_received'
      end,
      'none'
    )
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(v_me, p.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p.id)
   and f.status <> 'declined'
  where p.school_id = v_school
    and p.id <> v_me
    and p.full_name ilike '%' || btrim(p_query) || '%'
  order by p.full_name
  limit 8;
end;
$$;

create or replace function public.list_friends()
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  level smallint,
  xp bigint,
  current_streak integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    p.id, p.full_name, p.avatar_url, c.name,
    coalesce(us.level, 1)::smallint, coalesce(us.xp, 0)::bigint, coalesce(us.current_streak, 0)
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = v_me then f.addressee_id else f.requester_id end
  left join public.classes c on c.id = p.class_id
  left join public.user_stats us on us.user_id = p.id
  where f.status = 'accepted' and (f.requester_id = v_me or f.addressee_id = v_me)
  order by coalesce(us.xp, 0) desc;
end;
$$;

create or replace function public.list_friend_requests()
returns table (
  requester_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.requester_id, p.full_name, p.avatar_url, c.name, f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  left join public.classes c on c.id = p.class_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
  v_friendship_status text;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, c.name as class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.classes c on c.id = p.class_id
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  if p_user_id = auth.uid() then
    v_friendship_status := 'self';
  else
    select
      coalesce(
        case
          when f.status = 'accepted' then 'accepted'
          when f.status = 'pending' and f.requester_id = auth.uid() then 'pending_sent'
          when f.status = 'pending' and f.addressee_id = auth.uid() then 'pending_received'
        end,
        'none'
      )
    into v_friendship_status
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id)
      and f.status <> 'declined';
    v_friendship_status := coalesce(v_friendship_status, 'none');
  end if;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'friendshipStatus', v_friendship_status,
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts qa
        join public.resources r on r.id = qa.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where qa.user_id = p_user_id and qa.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------- bootstrap_student --
-- Turma sai do onboarding — não é mais perguntada ali (a escola também não
-- era). `create or replace` só substitui uma função de MESMA assinatura:
-- como a contagem de parâmetros muda (perde `p_class_name`), a versão
-- antiga de 12 argumentos precisa ser derrubada primeiro, senão as duas
-- coexistem (o mesmo bug "function ... is not unique" já visto nesta sessão).
drop function if exists public.bootstrap_student(
  text, text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
);

create or replace function public.bootstrap_student(
  p_full_name text,
  p_grade_level text default null,
  p_school_id uuid default null,
  p_timezone text default 'America/Sao_Paulo',
  p_year_label text default null,
  p_year_starts_on date default null,
  p_year_ends_on date default null,
  p_term_count smallint default 4,
  p_catalog_ids uuid[] default '{}',
  p_custom_subjects text[] default '{}',
  p_daily_goal_minutes integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_year_id uuid;
  v_term_ids uuid[] := '{}';
  v_subject_ids uuid[] := '{}';
  v_starts date;
  v_ends date;
  v_label text;
  v_segment integer;
  v_term_word text;
  v_seg_start date;
  v_seg_end date;
  v_subject_id uuid;
  v_term_id uuid;
  v_idx integer;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'bootstrap_student requires an authenticated user'
      using errcode = '28000';
  end if;

  update public.profiles set onboarded_at = now()
  where id = v_user_id and onboarded_at is null;

  if not found then
    if exists (select 1 from public.profiles where id = v_user_id) then
      raise exception 'user % is already onboarded', v_user_id using errcode = '23505';
    end if;
  end if;

  if p_term_count not between 1 and 12 then
    raise exception 'p_term_count must be between 1 and 12' using errcode = '22023';
  end if;

  if p_daily_goal_minutes is not null and p_daily_goal_minutes not between 0 and 1440 then
    raise exception 'p_daily_goal_minutes must be between 0 and 1440' using errcode = '22023';
  end if;

  v_starts := coalesce(p_year_starts_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 2, 1));
  v_ends := coalesce(p_year_ends_on, make_date(extract(year from public.user_local_date(v_user_id))::int, 12, 15));
  v_label := coalesce(p_year_label, extract(year from v_starts)::text);

  if v_ends <= v_starts then
    raise exception 'academic year must end after it starts' using errcode = '22023';
  end if;

  -- 1. Profile ------------------------------------------------------------
  insert into public.profiles as p (
    id, full_name, grade_level, school_id, timezone, daily_study_goal_minutes, onboarded_at
  )
  values (
    v_user_id, nullif(btrim(p_full_name), ''), p_grade_level, p_school_id,
    coalesce(nullif(btrim(p_timezone), ''), 'America/Sao_Paulo'),
    coalesce(p_daily_goal_minutes, 45), now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(excluded.full_name), ''), p.full_name),
        grade_level = coalesce(excluded.grade_level, p.grade_level),
        school_id = coalesce(excluded.school_id, p.school_id),
        timezone = excluded.timezone,
        daily_study_goal_minutes = coalesce(p_daily_goal_minutes, p.daily_study_goal_minutes),
        onboarded_at = coalesce(p.onboarded_at, now());

  -- 2. Academic year --------------------------------------------------------
  insert into public.academic_years (user_id, label, starts_on, ends_on, is_active)
  values (v_user_id, v_label, v_starts, v_ends, true)
  returning id into v_year_id;

  -- 3. Terms ------------------------------------------------------------
  v_term_word := case p_term_count
    when 2 then 'Semestre'
    when 3 then 'Trimestre'
    when 4 then 'Bimestre'
    else 'Período'
  end;
  v_segment := greatest(1, ((v_ends - v_starts + 1) / p_term_count)::integer);

  for v_idx in 1..p_term_count loop
    v_seg_start := v_starts + (v_idx - 1) * v_segment;
    v_seg_end := case
      when v_idx = p_term_count then v_ends
      else least(v_ends, v_starts + v_idx * v_segment - 1)
    end;

    insert into public.terms (user_id, academic_year_id, name, sequence, starts_on, ends_on)
    values (v_user_id, v_year_id, v_idx || 'º ' || v_term_word, v_idx::smallint,
            v_seg_start, greatest(v_seg_end, v_seg_start))
    returning id into v_term_id;

    v_term_ids := v_term_ids || v_term_id;
  end loop;

  -- 4. Subjects -----------------------------------------------------------
  for v_row in
    select c.id as catalog_id, c.name, c.default_color, c.default_icon, c.sort_order
    from public.subject_catalog c
    where c.id = any (coalesce(p_catalog_ids, '{}'))
    order by c.sort_order, c.name
  loop
    insert into public.subjects (user_id, catalog_id, name, color, icon, sort_order)
    values (v_user_id, v_row.catalog_id, v_row.name, v_row.default_color, v_row.default_icon, v_row.sort_order)
    on conflict do nothing
    returning id into v_subject_id;

    if v_subject_id is not null then
      v_subject_ids := v_subject_ids || v_subject_id;
      v_subject_id := null;
    end if;
  end loop;

  for v_idx in 1..coalesce(array_length(p_custom_subjects, 1), 0) loop
    if nullif(btrim(p_custom_subjects[v_idx]), '') is not null then
      insert into public.subjects (user_id, name, sort_order)
      values (v_user_id, btrim(p_custom_subjects[v_idx]), 500 + v_idx)
      on conflict do nothing
      returning id into v_subject_id;

      if v_subject_id is not null then
        v_subject_ids := v_subject_ids || v_subject_id;
        v_subject_id := null;
      end if;
    end if;
  end loop;

  -- 5. Checklist inicial ---------------------------------------------------
  insert into public.routines (user_id, title, icon, sort_order)
  values
    (v_user_id, 'Revisar o que vi hoje na aula', 'notebook-pen', 10),
    (v_user_id, 'Fazer as lições do dia', 'list-checks', 20),
    (v_user_id, 'Organizar a mochila para amanhã', 'backpack', 30);

  -- 6. Stats row ------------------------------------------------------------
  perform public.ensure_user_stats(v_user_id);
  perform public.award_xp(50, 'Configurou o Nexa', 'system', v_user_id);

  return jsonb_build_object(
    'user_id', v_user_id,
    'academic_year_id', v_year_id,
    'term_ids', to_jsonb(v_term_ids),
    'subject_ids', to_jsonb(v_subject_ids)
  );
end;
$$;

grant execute on function public.bootstrap_student(
  text, text, uuid, text, text, date, date, smallint, uuid[], text[], integer
) to authenticated;
