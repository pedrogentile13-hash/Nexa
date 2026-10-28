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
