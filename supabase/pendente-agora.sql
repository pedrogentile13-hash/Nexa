-- ===== 20261003000300_contas_da_escola =====
alter table public.profiles add column if not exists school_login text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_school_login_check') then
    alter table public.profiles add constraint profiles_school_login_check
      check (school_login is null or school_login ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
  end if;
end;
$$;
create unique index if not exists profiles_school_login_uq
  on public.profiles (school_id, school_login)
  where school_login is not null;
comment on column public.profiles.school_login is
  'Login da conta criada pela escola (sem e-mail). Só administrador altera.';
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.school_title is distinct from old.school_title
     or new.school_login is distinct from old.school_login then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  if new.school_id is distinct from old.school_id or new.class_id is distinct from old.class_id then
    if (old.school_id is not null and public.can_manage_school(old.school_id))
       or (new.school_id is not null and public.can_manage_school(new.school_id)) then
      return new;
    end if;
    if old.school_login is not null then
      raise exception 'esta conta é gerenciada pela escola' using errcode = '42501';
    end if;
    if new.school_id is not null
       and new.school_id is distinct from old.school_id
       and exists (select 1 from public.school_domains d where d.school_id = new.school_id) then
      raise exception 'esta escola cadastra os próprios alunos' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- ===== 20261003000400_logo_local =====
alter table public.school_branding drop constraint if exists school_branding_logo_url_check;
alter table public.school_branding add constraint school_branding_logo_url_check
  check (
    logo_url is null
    or (length(logo_url) <= 500 and (logo_url ~ '^https://' or logo_url ~ '^/brand/schools/[a-z0-9._-]+$'))
  );

-- ===== 20261003000500_chat_professor =====
create table if not exists public.teacher_faq (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  question text not null check (length(btrim(question)) between 3 and 300),
  answer text not null check (length(btrim(answer)) between 1 and 2000),
  keywords text check (keywords is null or length(keywords) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teacher_faq_teacher_idx on public.teacher_faq (teacher_id, active);
drop trigger if exists teacher_faq_set_updated_at on public.teacher_faq;
create trigger teacher_faq_set_updated_at before update on public.teacher_faq
  for each row execute function public.set_updated_at();
alter table public.teacher_faq enable row level security;
create table if not exists public.bot_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);
create index if not exists bot_conversations_teacher_idx on public.bot_conversations (teacher_id);
alter table public.bot_conversations enable row level security;
create table if not exists public.bot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.bot_conversations (id) on delete cascade,
  sender text not null check (sender in ('student', 'bot', 'teacher')),
  content text not null check (length(btrim(content)) between 1 and 2000),
  faq_id uuid references public.teacher_faq (id) on delete set null,
  status text check (status is null or status in ('answered', 'unanswered', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists bot_messages_conv_idx on public.bot_messages (conversation_id, created_at);
create index if not exists bot_messages_pending_idx on public.bot_messages (conversation_id) where status = 'unanswered';
alter table public.bot_messages enable row level security;
create or replace function public.student_has_teacher(p_teacher_id uuid, p_student_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles s
    join public.teacher_assignments ta
      on ta.teacher_id = p_teacher_id and ta.school_id = s.school_id and ta.class_id = s.class_id
    where s.id = p_student_id and s.school_id is not null and s.class_id is not null
  );
$$;
grant execute on function public.student_has_teacher(uuid, uuid) to authenticated;
drop policy if exists teacher_faq_select on public.teacher_faq;
create policy teacher_faq_select on public.teacher_faq
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.school_staff_level(school_id) >= 2
    or (
      active
      and public.student_has_teacher(teacher_id)
      and (class_id is null or class_id = (select p.class_id from public.profiles p where p.id = auth.uid()))
    )
  );
drop policy if exists teacher_faq_write on public.teacher_faq;
create policy teacher_faq_write on public.teacher_faq
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and school_id = public.current_school_id()
    and public.school_staff_level(school_id) >= 1
    and (
      class_id is null
      or exists (
        select 1 from public.teacher_assignments ta
        where ta.teacher_id = auth.uid() and ta.class_id = teacher_faq.class_id
      )
    )
  );
drop policy if exists bot_conversations_select on public.bot_conversations;
create policy bot_conversations_select on public.bot_conversations
  for select to authenticated
  using (
    student_id = auth.uid()
    or teacher_id = auth.uid()
    or public.can_oversee_teacher(teacher_id)
  );
drop policy if exists bot_messages_select on public.bot_messages;
create policy bot_messages_select on public.bot_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.bot_conversations c
      where c.id = bot_messages.conversation_id
        and (c.student_id = auth.uid() or c.teacher_id = auth.uid() or public.can_oversee_teacher(c.teacher_id))
    )
  );
create or replace function public.my_teachers()
returns table (teacher_id uuid, full_name text, subjects text)
language sql stable security definer set search_path = public as $$
  select
    ta.teacher_id,
    coalesce(t.full_name, 'Professor'),
    string_agg(distinct sc.name, ', ' order by sc.name)
  from public.profiles s
  join public.teacher_assignments ta on ta.school_id = s.school_id and ta.class_id = s.class_id
  join public.profiles t on t.id = ta.teacher_id
  join public.subject_catalog sc on sc.id = ta.subject_catalog_id
  where s.id = auth.uid() and s.school_id is not null and s.class_id is not null
  group by ta.teacher_id, t.full_name
  order by 2;
$$;
grant execute on function public.my_teachers() to authenticated;
create or replace function public.ask_teacher_bot(
  p_teacher_id uuid,
  p_question text,
  p_faq_id uuid default null
)
returns table (conversation_id uuid, answered boolean, answer text, message_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_conv uuid;
  v_faq public.teacher_faq%rowtype;
  v_class uuid;
  v_recent integer;
  v_msg uuid;
  v_text text;
  v_ok boolean := false;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if length(btrim(coalesce(p_question, ''))) < 2 or length(p_question) > 1000 then
    raise exception 'pergunta inválida' using errcode = '22023';
  end if;
  if not public.student_has_teacher(p_teacher_id, v_me) then
    raise exception 'este professor não leciona na sua turma' using errcode = '42501';
  end if;
  select count(*) into v_recent
  from public.bot_messages m
  join public.bot_conversations c on c.id = m.conversation_id
  where c.student_id = v_me and m.sender = 'student' and m.created_at > now() - interval '1 hour';
  if v_recent >= 30 then
    raise exception 'muitas perguntas seguidas, tente de novo daqui a pouco' using errcode = '54000';
  end if;
  select class_id into v_class from public.profiles where id = v_me;
  insert into public.bot_conversations (student_id, teacher_id)
  values (v_me, p_teacher_id)
  on conflict (student_id, teacher_id) do update set student_id = excluded.student_id
  returning id into v_conv;
  insert into public.bot_messages (conversation_id, sender, content)
  values (v_conv, 'student', btrim(p_question));
  if p_faq_id is not null then
    select * into v_faq from public.teacher_faq
    where id = p_faq_id and teacher_id = p_teacher_id and active
      and (class_id is null or class_id = v_class);
    v_ok := found;
  end if;
  if v_ok then
    v_text := v_faq.answer;
    insert into public.bot_messages (conversation_id, sender, content, faq_id, status)
    values (v_conv, 'bot', v_text, v_faq.id, 'answered')
    returning id into v_msg;
  else
    v_text := 'Ainda não sei responder isso. Já avisei o professor — a resposta aparece aqui assim que ele responder.';
    insert into public.bot_messages (conversation_id, sender, content, status)
    values (v_conv, 'bot', v_text, 'unanswered')
    returning id into v_msg;
  end if;
  return query select v_conv, v_ok, v_text, v_msg;
end;
$$;
grant execute on function public.ask_teacher_bot(uuid, text, uuid) to authenticated;
create or replace function public.my_pending_questions()
returns table (message_id uuid, conversation_id uuid, student_name text, question text, asked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    b.id,
    c.id,
    coalesce(s.full_name, 'Aluno'),
    (select m.content from public.bot_messages m
       where m.conversation_id = c.id and m.sender = 'student' and m.created_at <= b.created_at
       order by m.created_at desc limit 1),
    b.created_at
  from public.bot_messages b
  join public.bot_conversations c on c.id = b.conversation_id
  join public.profiles s on s.id = c.student_id
  where c.teacher_id = auth.uid() and b.sender = 'bot' and b.status = 'unanswered'
  order by b.created_at;
$$;
grant execute on function public.my_pending_questions() to authenticated;
create or replace function public.reply_unanswered(
  p_message_id uuid,
  p_reply text,
  p_save_as_faq boolean default false
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_conv uuid;
  v_question text;
  v_school uuid;
begin
  if length(btrim(coalesce(p_reply, ''))) < 1 or length(p_reply) > 2000 then
    raise exception 'resposta inválida' using errcode = '22023';
  end if;
  select b.conversation_id into v_conv
  from public.bot_messages b
  join public.bot_conversations c on c.id = b.conversation_id
  where b.id = p_message_id and b.sender = 'bot' and b.status = 'unanswered' and c.teacher_id = v_me;
  if v_conv is null then
    raise exception 'pergunta não encontrada ou já respondida' using errcode = '42501';
  end if;
  insert into public.bot_messages (conversation_id, sender, content)
  values (v_conv, 'teacher', btrim(p_reply));
  update public.bot_messages set status = 'resolved' where id = p_message_id;
  if p_save_as_faq then
    select (select m.content from public.bot_messages m
              where m.conversation_id = v_conv and m.sender = 'student'
                and m.created_at <= (select created_at from public.bot_messages where id = p_message_id)
              order by m.created_at desc limit 1),
           (select school_id from public.profiles where id = v_me)
    into v_question, v_school;
    if v_question is not null and v_school is not null then
      insert into public.teacher_faq (teacher_id, school_id, question, answer)
      values (v_me, v_school, left(v_question, 300), btrim(p_reply));
    end if;
  end if;
end;
$$;
grant execute on function public.reply_unanswered(uuid, text, boolean) to authenticated;

-- ===== 20261003000600_limite_ia =====
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  feature text not null check (length(feature) between 1 and 40),
  uses integer not null default 0 check (uses >= 0),
  primary key (user_id, day, feature)
);
alter table public.ai_usage enable row level security;
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using (user_id = auth.uid());
create or replace function public.consume_ai_quota(p_feature text, p_daily_limit integer)
returns table (allowed boolean, used integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_day date := (now() at time zone 'America/Sao_Paulo')::date;
  v_used integer;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 10000 then
    raise exception 'limite inválido' using errcode = '22023';
  end if;
  insert into public.ai_usage (user_id, day, feature, uses)
  values (v_me, v_day, p_feature, 1)
  on conflict (user_id, day, feature) do update set uses = public.ai_usage.uses + 1
  returning uses into v_used;
  if v_used > p_daily_limit then
    update public.ai_usage set uses = p_daily_limit
    where user_id = v_me and day = v_day and feature = p_feature;
    return query select false, p_daily_limit, 0;
  end if;
  return query select true, v_used, p_daily_limit - v_used;
end;
$$;
grant execute on function public.consume_ai_quota(text, integer) to authenticated;

-- ===== 20261003000700_painel_escola =====
create or replace function public.school_overview(p_school_id uuid)
returns table (
  students integer,
  teachers integer,
  managed_accounts integer,
  students_without_class integer,
  active_last_7_days integer,
  never_entered integer,
  pending_questions integer,
  upcoming_events integer,
  ai_uses_today integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if public.school_staff_level(p_school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'student')::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'teacher_admin')::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.school_login is not null)::int,
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'student' and p.class_id is null)::int,
    (select count(*) from public.profiles p
       join public.user_stats u on u.user_id = p.id
      where p.school_id = p_school_id and p.role = 'student' and u.last_active_local_date >= v_today - 6)::int,
    (select count(*) from public.profiles p
       left join public.user_stats u on u.user_id = p.id
      where p.school_id = p_school_id and p.school_login is not null and p.role = 'student'
        and u.last_active_local_date is null)::int,
    (select count(*) from public.bot_messages b
       join public.bot_conversations c on c.id = b.conversation_id
       join public.profiles t on t.id = c.teacher_id
      where t.school_id = p_school_id and b.sender = 'bot' and b.status = 'unanswered')::int,
    (select count(*) from public.events e
      where e.school_id = p_school_id and e.cancelled_at is null
        and e.starts_at >= now() and e.starts_at < now() + interval '30 days')::int,
    coalesce((select sum(a.uses) from public.ai_usage a
       join public.profiles p on p.id = a.user_id
      where p.school_id = p_school_id and a.day = v_today), 0)::int;
end;
$$;
grant execute on function public.school_overview(uuid) to authenticated;
create or replace function public.school_teacher_overview(p_school_id uuid)
returns table (
  teacher_id uuid,
  full_name text,
  classes text,
  faq_count integer,
  pending_count integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.school_staff_level(p_school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
  select
    t.id,
    coalesce(t.full_name, 'Professor'),
    coalesce((select string_agg(distinct c.name, ', ' order by c.name)
                from public.teacher_assignments ta join public.classes c on c.id = ta.class_id
               where ta.teacher_id = t.id), ''),
    (select count(*) from public.teacher_faq f where f.teacher_id = t.id and f.active)::int,
    (select count(*) from public.bot_messages b
       join public.bot_conversations cv on cv.id = b.conversation_id
      where cv.teacher_id = t.id and b.sender = 'bot' and b.status = 'unanswered')::int
  from public.profiles t
  where t.school_id = p_school_id and t.role = 'teacher_admin'
  order by 5 desc, 2;
end;
$$;
grant execute on function public.school_teacher_overview(uuid) to authenticated;

-- ===== 20261003000800_planejamento =====
create table if not exists public.teacher_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  content text not null check (length(btrim(content)) between 20 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teacher_plans_teacher_idx on public.teacher_plans (teacher_id, updated_at desc);
drop trigger if exists teacher_plans_set_updated_at on public.teacher_plans;
create trigger teacher_plans_set_updated_at before update on public.teacher_plans
  for each row execute function public.set_updated_at();
alter table public.teacher_plans enable row level security;
drop policy if exists teacher_plans_select on public.teacher_plans;
create policy teacher_plans_select on public.teacher_plans
  for select to authenticated
  using (teacher_id = auth.uid() or public.can_oversee_teacher(teacher_id));
drop policy if exists teacher_plans_write on public.teacher_plans;
create policy teacher_plans_write on public.teacher_plans
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and school_id = public.current_school_id()
    and public.school_staff_level(school_id) >= 1
  );

-- ===== 20261003000900_mural =====
create table if not exists public.school_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  body text not null check (length(btrim(body)) between 1 and 4000),
  pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists school_announcements_school_idx on public.school_announcements (school_id, created_at desc);
alter table public.school_announcements enable row level security;
create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.school_announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);
alter table public.announcement_reads enable row level security;
create or replace function public.can_view_announcement(p_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.school_announcements a
    join public.profiles u on u.id = p_user_id
    where a.id = p_id
      and (
        a.author_id = p_user_id
        or public.is_admin(p_user_id)
        or public.school_staff_level(a.school_id, p_user_id) >= 2
        or (
          u.school_id = a.school_id
          and (
            a.class_id is null
            or u.class_id = a.class_id
            or exists (
              select 1 from public.teacher_assignments ta
              where ta.teacher_id = p_user_id and ta.class_id = a.class_id
            )
          )
        )
      )
  );
$$;
grant execute on function public.can_view_announcement(uuid, uuid) to authenticated;
create or replace function public.can_manage_announcement(p_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.school_announcements a
    where a.id = p_id
      and (a.author_id = p_user_id or public.is_admin(p_user_id) or public.school_staff_level(a.school_id, p_user_id) >= 2)
  );
$$;
grant execute on function public.can_manage_announcement(uuid, uuid) to authenticated;
drop policy if exists school_announcements_select on public.school_announcements;
create policy school_announcements_select on public.school_announcements
  for select to authenticated using (public.can_view_announcement(id));
drop policy if exists announcement_reads_select_own on public.announcement_reads;
create policy announcement_reads_select_own on public.announcement_reads
  for select to authenticated using (user_id = auth.uid());
create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_class_id uuid default null,
  p_pinned boolean default false,
  p_expires_at timestamptz default null
)
returns table (announcement_id uuid, notified_user_ids uuid[])
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_school uuid := public.current_school_id(v_me);
  v_class_school uuid;
  v_id uuid;
  v_users uuid[];
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if v_school is null then
    raise exception 'seu perfil não está ligado a uma escola' using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'a validade precisa ser no futuro' using errcode = '22023';
  end if;
  if p_class_id is not null then
    select school_id into v_class_school from public.classes where id = p_class_id;
    if v_class_school is distinct from v_school then
      raise exception 'turma não pertence à sua escola' using errcode = '22023';
    end if;
  end if;
  if not public.can_create_school_event(v_school, p_class_id, v_me) then
    raise exception 'só a escola publica avisos (coordenação, direção ou o professor da turma)' using errcode = '42501';
  end if;
  insert into public.school_announcements (school_id, author_id, class_id, title, body, pinned, expires_at)
  values (v_school, v_me, p_class_id, btrim(p_title), btrim(p_body), coalesce(p_pinned, false), p_expires_at)
  returning id into v_id;
  select coalesce(array_agg(distinct x.id), '{}') into v_users
  from (
    select p.id from public.profiles p
    where p.school_id = v_school and p.role = 'student'
      and (p_class_id is null or p.class_id = p_class_id)
    union
    select ta.teacher_id from public.teacher_assignments ta
    where ta.school_id = v_school and (p_class_id is null or ta.class_id = p_class_id)
  ) x
  where x.id <> v_me;
  insert into public.notifications (user_id, title, body, link)
  select u, left(btrim(p_title), 160), left(btrim(p_body), 500), '/avisos'
  from unnest(v_users) u;
  return query select v_id, v_users;
end;
$$;
grant execute on function public.create_announcement(text, text, uuid, boolean, timestamptz) to authenticated;
create or replace function public.mark_announcement_read(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.can_view_announcement(p_id) then
    raise exception 'aviso não encontrado' using errcode = '42501';
  end if;
  insert into public.announcement_reads (announcement_id, user_id)
  values (p_id, auth.uid())
  on conflict do nothing;
end;
$$;
grant execute on function public.mark_announcement_read(uuid) to authenticated;
create or replace function public.list_announcements(p_limit integer default 50)
returns table (
  id uuid,
  title text,
  body text,
  author_name text,
  class_name text,
  pinned boolean,
  created_at timestamptz,
  is_read boolean,
  can_manage boolean,
  read_count integer,
  audience_size integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    a.id,
    a.title,
    a.body,
    coalesce(au.full_name, 'Escola'),
    c.name,
    a.pinned,
    a.created_at,
    exists (select 1 from public.announcement_reads r where r.announcement_id = a.id and r.user_id = v_me),
    public.can_manage_announcement(a.id, v_me),
    case when public.can_manage_announcement(a.id, v_me) then
      (select count(*) from public.announcement_reads r
         join public.profiles s on s.id = r.user_id
        where r.announcement_id = a.id and s.role = 'student')::int
    end,
    case when public.can_manage_announcement(a.id, v_me) then
      (select count(*) from public.profiles s
        where s.school_id = a.school_id and s.role = 'student'
          and (a.class_id is null or s.class_id = a.class_id))::int
    end
  from public.school_announcements a
  left join public.profiles au on au.id = a.author_id
  left join public.classes c on c.id = a.class_id
  where public.can_view_announcement(a.id, v_me)
    and (a.expires_at is null or a.expires_at > now())
  order by a.pinned desc, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;
grant execute on function public.list_announcements(integer) to authenticated;
create or replace function public.announcement_readers(p_id uuid)
returns table (user_id uuid, full_name text, class_name text, read_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  return query
  select s.id, coalesce(s.full_name, 'Aluno'), c.name, r.read_at
  from public.school_announcements a
  join public.profiles s on s.school_id = a.school_id and s.role = 'student'
    and (a.class_id is null or s.class_id = a.class_id)
  left join public.classes c on c.id = s.class_id
  left join public.announcement_reads r on r.announcement_id = a.id and r.user_id = s.id
  where a.id = p_id
  order by (r.read_at is not null), s.full_name;
end;
$$;
grant execute on function public.announcement_readers(uuid) to authenticated;
create or replace function public.unread_announcements_count()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.school_announcements a
  where public.can_view_announcement(a.id)
    and a.author_id <> auth.uid()
    and (a.expires_at is null or a.expires_at > now())
    and not exists (select 1 from public.announcement_reads r where r.announcement_id = a.id and r.user_id = auth.uid());
$$;
grant execute on function public.unread_announcements_count() to authenticated;
create or replace function public.delete_announcement(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  delete from public.school_announcements where id = p_id;
end;
$$;
grant execute on function public.delete_announcement(uuid) to authenticated;

-- ===== 20261003001000_redacao =====
create table if not exists public.essay_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme text not null check (length(btrim(theme)) between 3 and 300),
  essay text not null check (length(btrim(essay)) between 100 and 8000),
  c1 smallint not null check (c1 between 0 and 200 and c1 % 40 = 0),
  c2 smallint not null check (c2 between 0 and 200 and c2 % 40 = 0),
  c3 smallint not null check (c3 between 0 and 200 and c3 % 40 = 0),
  c4 smallint not null check (c4 between 0 and 200 and c4 % 40 = 0),
  c5 smallint not null check (c5 between 0 and 200 and c5 % 40 = 0),
  total smallint generated always as (c1 + c2 + c3 + c4 + c5) stored,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists essay_corrections_user_idx on public.essay_corrections (user_id, created_at desc);
alter table public.essay_corrections enable row level security;
drop policy if exists essay_corrections_select_own on public.essay_corrections;
create policy essay_corrections_select_own on public.essay_corrections
  for select to authenticated using (user_id = auth.uid());
drop policy if exists essay_corrections_insert_own on public.essay_corrections;
create policy essay_corrections_insert_own on public.essay_corrections
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists essay_corrections_delete_own on public.essay_corrections;
create policy essay_corrections_delete_own on public.essay_corrections
  for delete to authenticated using (user_id = auth.uid());

-- ===== 20261003001100_selo_escola =====
alter table public.school_branding add column if not exists badge_url text;
alter table public.school_branding drop constraint if exists school_branding_badge_url_check;
alter table public.school_branding add constraint school_branding_badge_url_check
  check (
    badge_url is null
    or (length(badge_url) <= 500 and (badge_url ~ '^https://' or badge_url ~ '^/brand/schools/[a-z0-9._-]+$'))
  );
drop function if exists public.resolve_school_host(text);
create or replace function public.resolve_school_host(p_host text)
returns table (
  school_id uuid,
  display_name text,
  logo_url text,
  brand text,
  brand_text text,
  brand_soft text,
  badge_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.school_id,
    coalesce(b.display_name, s.name),
    b.logo_url,
    b.brand,
    b.brand_text,
    b.brand_soft,
    b.badge_url
  from public.school_domains d
  join public.schools s on s.id = d.school_id
  left join public.school_branding b on b.school_id = d.school_id
  where d.host = lower(btrim(p_host))
    and d.active;
$$;
grant execute on function public.resolve_school_host(text) to anon, authenticated;

-- ===== 20261003001200_admin_restrito =====
alter table public.profiles add column if not exists admin_scope text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_admin_scope_check') then
    alter table public.profiles add constraint profiles_admin_scope_check
      check (admin_scope is null or admin_scope = 'limited');
  end if;
end;
$$;
comment on column public.profiles.admin_scope is
  'Só vale para role = admin: nulo = admin geral; limited = admin com funções bloqueadas.';
create or replace function public.is_full_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = 'admin' and p.admin_scope is null from public.profiles p where p.id = p_user_id), false);
$$;
grant execute on function public.is_full_admin(uuid) to authenticated;
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_full_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.school_title is distinct from old.school_title
     or new.school_login is distinct from old.school_login
     or new.admin_scope is distinct from old.admin_scope then
    raise exception 'apenas o administrador geral pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  if public.is_admin() then
    return new;
  end if;
  if new.school_id is distinct from old.school_id or new.class_id is distinct from old.class_id then
    if (old.school_id is not null and public.can_manage_school(old.school_id))
       or (new.school_id is not null and public.can_manage_school(new.school_id)) then
      return new;
    end if;
    if old.school_login is not null then
      raise exception 'esta conta é gerenciada pela escola' using errcode = '42501';
    end if;
    if new.school_id is not null
       and new.school_id is distinct from old.school_id
       and exists (select 1 from public.school_domains d where d.school_id = new.school_id) then
      raise exception 'esta escola cadastra os próprios alunos' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- ===== 20261003001300_nexaia_material =====
create table if not exists public.study_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  source_kind text not null check (source_kind in ('pdf', 'image', 'text')),
  content text not null check (length(btrim(content)) between 20 and 120000),
  pages integer check (pages is null or pages > 0),
  created_at timestamptz not null default now()
);
create index if not exists study_documents_user_idx on public.study_documents (user_id, created_at desc);
alter table public.study_documents enable row level security;
drop policy if exists study_documents_select_own on public.study_documents;
create policy study_documents_select_own on public.study_documents
  for select to authenticated using (user_id = auth.uid());
drop policy if exists study_documents_insert_own on public.study_documents;
create policy study_documents_insert_own on public.study_documents
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists study_documents_delete_own on public.study_documents;
create policy study_documents_delete_own on public.study_documents
  for delete to authenticated using (user_id = auth.uid());
create table if not exists public.publication_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text check (note is null or length(note) <= 500),
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists publication_requests_one_pending
  on public.publication_requests (resource_id) where status = 'pending';
create index if not exists publication_requests_school_idx on public.publication_requests (school_id, status, created_at desc);
alter table public.publication_requests enable row level security;
drop policy if exists publication_requests_select_own on public.publication_requests;
create policy publication_requests_select_own on public.publication_requests
  for select to authenticated using (requester_id = auth.uid());
create or replace function public.request_publication(p_resource_id uuid, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_res public.resources%rowtype;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  select * into v_res from public.resources where id = p_resource_id and ai_generated and created_by = v_me;
  if not found then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_res.school_id is null then
    raise exception 'você precisa estar ligado a uma escola para pedir publicação' using errcode = '22023';
  end if;
  if v_res.visibility is distinct from 'private' then
    raise exception 'este conteúdo já está publicado' using errcode = '22023';
  end if;
  if exists (select 1 from public.publication_requests where resource_id = p_resource_id and status = 'pending') then
    raise exception 'já existe um pedido aguardando resposta' using errcode = '23505';
  end if;
  insert into public.publication_requests (resource_id, requester_id, school_id, note)
  values (p_resource_id, v_me, v_res.school_id, nullif(left(btrim(coalesce(p_note, '')), 500), ''))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.request_publication(uuid, text) to authenticated;
create or replace function public.list_publication_requests(p_status text default 'pending')
returns table (
  id uuid,
  resource_id uuid,
  kind text,
  title text,
  subject_name text,
  requester_name text,
  class_name text,
  note text,
  status text,
  decision_note text,
  question_count integer,
  preview text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    pr.id, r.id, r.kind, r.title,
    sc.name,
    coalesce(p.full_name, 'Aluno'),
    c.name,
    pr.note, pr.status, pr.decision_note,
    (select count(*) from public.questions q where q.resource_id = r.id)::int,
    left(coalesce(r.body, (select string_agg(qs.statement, E'\n' order by qs.position) from (select q2.statement, q2.position from public.questions q2 where q2.resource_id = r.id order by q2.position limit 5) qs), ''), 1200),
    pr.created_at
  from public.publication_requests pr
  join public.resources r on r.id = pr.resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  join public.profiles p on p.id = pr.requester_id
  left join public.classes c on c.id = p.class_id
  where (public.is_admin() or public.school_staff_level(pr.school_id) >= 2)
    and (p_status is null or pr.status = p_status)
  order by pr.created_at desc
  limit 100;
end;
$$;
grant execute on function public.list_publication_requests(text) to authenticated;
create or replace function public.decide_publication(p_request_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_req public.publication_requests%rowtype;
  v_title text;
begin
  select * into v_req from public.publication_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'pedido não encontrado ou já decidido' using errcode = 'P0002';
  end if;
  if not (public.is_admin(v_me) or public.school_staff_level(v_req.school_id, v_me) >= 2) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  update public.publication_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      decision_note = nullif(left(btrim(coalesce(p_note, '')), 500), ''),
      decided_by = v_me,
      decided_at = now()
  where id = p_request_id;
  if p_approve then
    update public.resources set visibility = 'school' where id = v_req.resource_id;
  end if;
  select title into v_title from public.resources where id = v_req.resource_id;
  insert into public.notifications (user_id, title, body, link)
  values (
    v_req.requester_id,
    case when p_approve then 'Seu conteúdo foi publicado na escola' else 'Seu pedido de publicação foi recusado' end,
    left(coalesce(v_title, 'Conteúdo') || coalesce(' — ' || nullif(btrim(coalesce(p_note, '')), ''), ''), 500),
    '/estudar'
  );
end;
$$;
grant execute on function public.decide_publication(uuid, boolean, text) to authenticated;
create or replace function public.update_ai_resource_visibility(
  p_resource_id uuid,
  p_visibility text,
  p_community_id uuid default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
  v_school uuid;
begin
  if p_visibility not in ('private', 'friends', 'school', 'community', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  select created_by, school_id into v_owner, v_school from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if p_visibility <> 'private'
     and v_school is not null
     and not public.is_admin(v_me)
     and public.school_staff_level(v_school, v_me) < 2
     and not exists (
       select 1 from public.publication_requests
       where resource_id = p_resource_id and status = 'approved'
     )
  then
    raise exception 'peça autorização à coordenação da escola para publicar' using errcode = '42501';
  end if;
  if p_visibility = 'community' then
    if p_community_id is null or not public.is_community_member(p_community_id, v_me) then
      raise exception 'escolha uma comunidade da qual você é membro' using errcode = '22023';
    end if;
  end if;
  update public.resources
  set visibility = p_visibility,
      community_id = case when p_visibility = 'community' then p_community_id else null end
  where id = p_resource_id;
end;
$$;
grant execute on function public.update_ai_resource_visibility(uuid, text, uuid) to authenticated;

-- ===== 20261003001400_eventos_no_calendario =====
alter table public.school_announcements add column if not exists event_date date;
create index if not exists school_announcements_event_idx
  on public.school_announcements (school_id, event_date) where event_date is not null;
create or replace function public.set_announcement_event_date(p_id uuid, p_date date)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id, auth.uid()) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  update public.school_announcements set event_date = p_date where id = p_id;
end;
$$;
grant execute on function public.set_announcement_event_date(uuid, date) to authenticated;
create or replace function public.list_school_events(p_from date, p_to date)
returns table (id uuid, title text, body text, event_date date, class_name text, school_wide boolean)
language sql stable security definer set search_path = public as $$
  select a.id, a.title, left(a.body, 300), a.event_date, c.name, a.class_id is null
  from public.school_announcements a
  left join public.classes c on c.id = a.class_id
  where a.event_date between p_from and p_to
    and (a.expires_at is null or a.expires_at > now() or a.event_date >= current_date)
    and public.can_view_announcement(a.id, auth.uid())
  order by a.event_date, a.title
  limit 200;
$$;
grant execute on function public.list_school_events(date, date) to authenticated;

-- ===== 20261003001500_privacidade_conteudo_ia =====
drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources
  for all to authenticated
  using (
    public.is_admin()
    or (not ai_generated and (public.can_manage_school(school_id) or public.is_teacher_of(school_id, subject_catalog_id)))
  )
  with check (
    public.is_admin()
    or (not ai_generated and (public.can_manage_school(school_id) or public.is_teacher_of(school_id, subject_catalog_id)))
  );
drop policy if exists questions_manage on public.questions;
create policy questions_manage on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ))
  with check (exists (
    select 1 from public.resources r
    where r.id = resource_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ));
drop policy if exists question_options_manage on public.question_options;
create policy question_options_manage on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ))
  with check (exists (
    select 1 from public.questions q join public.resources r on r.id = q.resource_id
    where q.id = question_id
      and (public.is_admin()
           or (not r.ai_generated and (public.can_manage_school(r.school_id) or public.is_teacher_of(r.school_id, r.subject_catalog_id))))
  ));
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
  (select count(*) from public.questions q where q.resource_id = r.id) as question_count,
  r.bimestre
from public.resources r
join public.subject_catalog sc on sc.id = r.subject_catalog_id
left join public.content_topics t on t.id = r.topic_id
where r.is_published
  and (
    not r.ai_generated
    or r.created_by = auth.uid()
    or (r.visibility is distinct from 'private' and public.can_view_resource(r.id))
  );

-- ===== 20261003001600_retirar_da_escola =====
create or replace function public.move_person_school(p_user_id uuid, p_school_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_target public.profiles%rowtype;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  select * into v_target from public.profiles where id = p_user_id;
  if not found then
    raise exception 'pessoa não encontrada' using errcode = 'P0002';
  end if;
  if v_target.role is distinct from 'student' then
    raise exception 'só alunos podem ser movidos aqui' using errcode = '22023';
  end if;
  if v_target.school_login is not null then
    raise exception 'esta conta foi criada pela escola: apague-a em Contas da escola' using errcode = '22023';
  end if;
  if not public.is_admin(v_me) then
    if v_target.school_id is null
       or p_school_id is not null
       or public.school_staff_level(v_target.school_id, v_me) < 2 then
      raise exception 'não autorizado' using errcode = '42501';
    end if;
  end if;
  if p_school_id is not null and not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'escola inválida' using errcode = '22023';
  end if;
  update public.profiles set school_id = p_school_id, class_id = null where id = p_user_id;
end;
$$;
grant execute on function public.move_person_school(uuid, uuid) to authenticated;

-- ===== 20261003001700_revisoes_expiram =====
create or replace function public.review_queue(p_user_id uuid default auth.uid())
returns table (
  kind text,
  bucket text,
  question_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  statement text,
  explanation text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz,
  due_date date,
  next_interval_step integer,
  resource_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  with last_review as (
    select distinct on (cr.resource_id)
      cr.resource_id,
      cr.reviewed_at,
      cr.interval_step
    from public.content_reviews cr
    where cr.user_id = p_user_id
    order by cr.resource_id, cr.reviewed_at desc
  ),
  candidates as (
    select
      rp.resource_id,
      coalesce(lr.reviewed_at, rp.completed_at) as anchor_at,
      coalesce(lr.interval_step, -1) as last_step
    from public.resource_progress rp
    left join last_review lr on lr.resource_id = rp.resource_id
    where rp.user_id = p_user_id
      and rp.completed_at is not null
  ),
  scheduled as (
    select
      c.resource_id,
      (c.anchor_at + (case
        when c.last_step <= 0 then 3
        when c.last_step = 1 then 7
        when c.last_step = 2 then 14
        else 30
      end) * interval '1 day')::date as due_date,
      least(c.last_step + 1, 3) as next_interval_step
    from candidates c
  ),
  content_items as (
    select
      'conteudo'::text as kind,
      case
        when exists (
          select 1 from public.content_reviews cr2
          where cr2.user_id = p_user_id and cr2.resource_id = s.resource_id
            and cr2.reviewed_at::date = current_date
        ) then 'concluida'
        when s.due_date < current_date then 'atrasada'
        when s.due_date = current_date then 'hoje'
        else 'proxima'
      end as bucket,
      null::uuid as question_id,
      r.id as resource_id,
      r.title as resource_title,
      r.subject_catalog_id as subject_id,
      sc.name as subject_name,
      sc.default_color as subject_color,
      t.name as topic_name,
      null::text as statement,
      null::text as explanation,
      null::text as chosen_body,
      null::text as correct_body,
      null::timestamptz as answered_at,
      s.due_date,
      s.next_interval_step,
      r.kind::text as resource_kind
    from scheduled s
    join public.resources r on r.id = s.resource_id
    join public.subject_catalog sc on sc.id = r.subject_catalog_id
    left join public.content_topics t on t.id = r.topic_id
    where r.kind not in ('quiz', 'simulado')
      and s.due_date >= current_date - 7
  ),
  error_items as (
    select
      'erro'::text as kind,
      'hoje'::text as bucket,
      e.question_id,
      e.resource_id,
      e.resource_title,
      e.subject_id,
      e.subject_name,
      e.subject_color,
      e.topic_name,
      e.statement,
      e.explanation,
      e.chosen_body,
      e.correct_body,
      e.answered_at,
      current_date as due_date,
      0 as next_interval_step,
      null::text as resource_kind
    from public.recent_errors(p_user_id) e
    where e.answered_at > now() - interval '7 days'
  ),
  combined as (
    select * from error_items
    union all
    select * from content_items
  )
  select * from combined
  where bucket <> 'proxima' or due_date <= current_date + 14
  order by
    case bucket when 'atrasada' then 0 when 'hoje' then 1 when 'proxima' then 2 else 3 end,
    due_date;
$$;
grant execute on function public.review_queue(uuid) to authenticated;

-- ===== 20261003001800_senhas_da_escola =====
create table if not exists public.school_account_secrets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  secret text not null,
  updated_at timestamptz not null default now()
);
alter table public.school_account_secrets enable row level security;
revoke all on public.school_account_secrets from anon, authenticated;

-- ===== 20261003001900_biblioteca_codigos =====
alter table public.study_documents add column if not exists code text;
create table if not exists public.study_document_counters (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_number integer not null default 0
);
alter table public.study_document_counters enable row level security;
revoke all on public.study_document_counters from anon, authenticated;
do $$
begin
  if exists (select 1 from public.study_documents where code is null) then
    with numbered as (
      select id, user_id, row_number() over (partition by user_id order by created_at, id) as n
      from public.study_documents
    )
    update public.study_documents d
    set code = 'B' || lpad(numbered.n::text, 2, '0')
    from numbered
    where d.id = numbered.id and d.code is null;
    insert into public.study_document_counters (user_id, last_number)
    select user_id, count(*)::int from public.study_documents group by user_id
    on conflict (user_id) do update set last_number = greatest(public.study_document_counters.last_number, excluded.last_number);
  end if;
end;
$$;
create or replace function public.assign_study_document_code()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  insert into public.study_document_counters as c (user_id, last_number)
  values (new.user_id, 1)
  on conflict (user_id) do update set last_number = c.last_number + 1
  returning last_number into v_n;
  new.code := 'B' || lpad(v_n::text, 2, '0');
  return new;
end;
$$;
drop trigger if exists study_documents_assign_code on public.study_documents;
create trigger study_documents_assign_code
  before insert on public.study_documents
  for each row execute function public.assign_study_document_code();
create unique index if not exists study_documents_user_code_uq on public.study_documents (user_id, code);
drop policy if exists study_documents_update_own on public.study_documents;
create policy study_documents_update_own on public.study_documents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 20261003002000_funcoes_so_logado =====
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on all functions in schema public to service_role;
  end if;
end;
$$;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
create or replace function public.report_error(
  p_message text,
  p_origin text default 'client',
  p_stack text default null,
  p_pathname text default null,
  p_digest text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message text := nullif(btrim(p_message), '');
begin
  if v_message is null then
    return;
  end if;
  if (select count(*) from public.error_reports where created_at > now() - interval '1 minute') >= 300 then
    return;
  end if;
  insert into public.error_reports (
    user_id, origin, message, stack, pathname, digest, user_agent
  ) values (
    auth.uid(),
    case when p_origin = 'server' then 'server' else 'client' end,
    left(v_message, 2000),
    left(nullif(btrim(p_stack), ''), 8000),
    left(split_part(nullif(btrim(p_pathname), ''), '?', 1), 300),
    left(nullif(btrim(p_digest), ''), 100),
    left(nullif(btrim(p_user_agent), ''), 400)
  );
end;
$$;
grant execute on function public.report_error(text, text, text, text, text, text) to authenticated, anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- ===== 20261003002100_fechar_funcoes_perigosas =====
revoke execute on function public.award_xp(integer, text, text, uuid, uuid) from authenticated;
revoke execute on function public.notify_user(uuid, text, text, text) from authenticated;
revoke execute on function public.touch_streak(uuid) from authenticated;
create or replace function public.award_xp_self(
  p_amount integer,
  p_reason text,
  p_source_type text default 'system',
  p_source_id uuid default null
)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_gain integer;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_amount < -10 or p_amount > 50 then
    raise exception 'valor de XP inválido' using errcode = '22023';
  end if;
  if p_source_type not in ('task', 'routine', 'study_session', 'activity', 'achievement', 'system') then
    raise exception 'origem de XP inválida' using errcode = '22023';
  end if;
  if p_amount > 0 then
    select coalesce(sum(amount), 0) into v_gain
    from public.xp_events
    where user_id = v_me and local_date = public.user_local_date(v_me) and amount > 0;
    if v_gain >= 1500 then
      return 0;
    end if;
  end if;
  return public.award_xp(p_amount, left(coalesce(p_reason, 'XP'), 120), p_source_type, p_source_id, v_me);
end;
$$;
grant execute on function public.award_xp_self(integer, text, text, uuid) to authenticated;
create or replace function public.touch_streak_self()
returns integer
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  return public.touch_streak(auth.uid());
end;
$$;
grant execute on function public.touch_streak_self() to authenticated;
do $$
declare
  f record;
begin
  for f in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('bootstrap_student', 'bootstrap_vestibular_student')
      and p.prosrc ~ 'public\.award_xp\('
  loop
    execute replace(pg_get_functiondef(f.oid), 'public.award_xp(', 'public.award_xp_self(');
  end loop;
end;
$$;
do $$
declare
  f record;
  v_name text;
  v_call text;
  v_set boolean;
begin
  for f in
    select p.oid, p.proname, p.prosrc, p.provolatile,
           pg_get_function_arguments(p.oid) as args,
           pg_get_function_result(p.oid) as res,
           pg_get_function_identity_arguments(p.oid) as ident,
           p.proargnames
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('review_queue', 'common_error_types', 'ranking_evolution')
  loop
    if f.prosrc like '%' || f.proname || '_unsafe(%' then
      continue;
    end if;
    v_name := f.proname || '_unsafe';
    execute format('drop function if exists public.%I(%s)', v_name, f.ident);
    execute format('alter function public.%I(%s) rename to %I', f.proname, f.ident, v_name);
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', v_name, f.ident);
    select string_agg(format('%1$s => %1$s', split_part(btrim(a), ' ', 1)), ', ')
      into v_call
    from unnest(string_to_array(f.ident, ',')) as a;
    v_set := f.res like 'TABLE%' or f.res like 'SETOF%';
    execute format(
      $f$create or replace function public.%I(%s)
         returns %s
         language plpgsql %s security definer set search_path = public as $b$
         begin
           if p_user_id is distinct from auth.uid() and not public.can_read_performance_of(p_user_id) then
             raise exception 'não autorizado' using errcode = '42501';
           end if;
           %s public.%I(%s);
         end;
         $b$
      $f$,
      f.proname, f.args, f.res,
      case f.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end,
      case when v_set then 'return query select * from' else 'return' end,
      v_name, v_call
    );
    execute format('revoke execute on function public.%I(%s) from public, anon', f.proname, f.ident);
    execute format('grant execute on function public.%I(%s) to authenticated', f.proname, f.ident);
  end loop;
end;
$$;

-- ===== 20261003002200_portal_equipe =====
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
    and (
      public.school_staff_level(c.school_id) >= 2
      or exists (select 1 from public.teacher_assignments ta where ta.teacher_id = me.id and ta.class_id = c.id)
    );
$$;
grant execute on function public.staff_visible_classes(uuid) to authenticated;
create or replace function public.staff_classes_overview(p_school_id uuid default null)
returns table (
  class_id uuid,
  class_name text,
  student_count integer,
  active_7d integer,
  never_active integer,
  avg_xp integer,
  teachers text
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    c.name,
    count(s.id)::int,
    count(s.id) filter (where u.last_active_local_date >= (now() at time zone 'America/Sao_Paulo')::date - 6)::int,
    count(s.id) filter (where u.last_active_local_date is null)::int,
    coalesce(round(avg(u.xp)), 0)::int,
    coalesce((
      select string_agg(distinct t.full_name, ', ' order by t.full_name)
      from public.teacher_assignments ta
      join public.profiles t on t.id = ta.teacher_id
      where ta.class_id = c.id
    ), '')
  from public.staff_visible_classes(p_school_id) v
  join public.classes c on c.id = v.class_id
  left join public.profiles s on s.class_id = c.id and s.role = 'student'
  left join public.user_stats u on u.user_id = s.id
  group by c.id, c.name
  order by c.name;
$$;
grant execute on function public.staff_classes_overview(uuid) to authenticated;
create or replace function public.staff_roster(p_class_id uuid default null, p_search text default null)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_id uuid,
  class_name text,
  school_login text,
  xp integer,
  level integer,
  current_streak integer,
  last_active date,
  week_minutes integer
)
language sql stable security definer set search_path = public as $$
  select
    s.id,
    coalesce(s.full_name, 'Sem nome'),
    s.avatar_url,
    c.id,
    c.name,
    s.school_login,
    coalesce(u.xp, 0),
    coalesce(u.level, 1)::int,
    coalesce(u.current_streak, 0),
    u.last_active_local_date,
    coalesce((
      select round(sum(ss.duration_seconds) / 60.0)
      from public.study_sessions ss
      where ss.user_id = s.id and ss.ended_at is not null
        and ss.local_date >= (now() at time zone 'America/Sao_Paulo')::date - 6
    ), 0)::int
  from public.staff_visible_classes(null) v
  join public.classes c on c.id = v.class_id
  join public.profiles s on s.class_id = c.id and s.role = 'student'
  left join public.user_stats u on u.user_id = s.id
  where (p_class_id is null or c.id = p_class_id)
    and (p_search is null or p_search = '' or s.full_name ilike '%' || p_search || '%')
  order by s.full_name
  limit 500;
$$;
grant execute on function public.staff_roster(uuid, text) to authenticated;
create or replace function public.staff_unassigned_students()
returns table (user_id uuid, full_name text, school_login text)
language sql stable security definer set search_path = public as $$
  select s.id, coalesce(s.full_name, 'Sem nome'), s.school_login
  from public.profiles me
  join public.profiles s on s.school_id = me.school_id and s.role = 'student' and s.class_id is null
  where me.id = auth.uid() and public.school_staff_level(me.school_id) >= 2
  order by s.full_name
  limit 200;
$$;
grant execute on function public.staff_unassigned_students() to authenticated;
create or replace function public.staff_set_student_class(p_user_id uuid, p_class_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_student public.profiles%rowtype;
begin
  select * into v_student from public.profiles where id = p_user_id;
  if not found or v_student.role is distinct from 'student' or v_student.school_id is null then
    raise exception 'aluno não encontrado' using errcode = 'P0002';
  end if;
  if public.school_staff_level(v_student.school_id) < 2 then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if p_class_id is not null and not exists (
    select 1 from public.classes c where c.id = p_class_id and c.school_id = v_student.school_id
  ) then
    raise exception 'turma de outra escola' using errcode = '22023';
  end if;
  update public.profiles set class_id = p_class_id where id = p_user_id;
end;
$$;
grant execute on function public.staff_set_student_class(uuid, uuid) to authenticated;

-- ===== cadastro do Anglo (logo e cores) =====
do $$
declare
  v_school uuid;
begin
  select id into v_school from public.schools where name ilike '%anglo%morumbi%' order by created_at limit 1;
  if v_school is null then
    insert into public.schools (name, city, state, is_verified)
    values ('Colégio Anglo Morumbi', 'São Paulo', 'SP', true)
    returning id into v_school;
  end if;
  insert into public.school_domains (host, school_id)
  values ('anglomorumbi.nexastudy.com.br', v_school)
  on conflict (host) do update set school_id = excluded.school_id, active = true;
  insert into public.school_branding (school_id, display_name, logo_url, brand, brand_text, brand_soft)
  values (v_school, 'Colégio Anglo Morumbi', '/brand/schools/anglomorumbi.webp', '#0a4585', '#0a3d75', '#e8f0fa')
  on conflict (school_id) do update set
    display_name = excluded.display_name,
    logo_url = excluded.logo_url,
    brand = excluded.brand,
    brand_text = excluded.brand_text,
    brand_soft = excluded.brand_soft,
    updated_at = now();
end;
$$;
