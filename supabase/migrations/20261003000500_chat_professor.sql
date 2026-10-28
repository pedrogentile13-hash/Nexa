-- ============================================================================
-- Nexa — Chat da escola com o bot de cada professor
--
-- Cada professor cadastra a própria BASE DE RESPOSTAS (`teacher_faq`): "quando
-- é a entrega?", "o que cai na prova?"... O aluno conversa com o bot do
-- professor; o bot só devolve o que o professor escreveu. Quando não sabe,
-- avisa o aluno e a pergunta cai numa fila do professor, que responde e pode
-- transformar a resposta numa entrada da base.
--
-- Princípios:
--   * O bot NÃO inventa. A resposta é copiada da tabela pelo banco
--     (`ask_teacher_bot`), não aceita texto vindo do cliente — ninguém
--     consegue fazer o "bot" dizer o que não foi cadastrado.
--   * Conversa é entre o aluno e o bot/professor DELE, e a coordenação
--     supervisiona. Nenhum outro aluno ou professor lê.
--   * Escritas só por função (RPC): as tabelas de mensagem não têm policy de
--     insert/update/delete, então o histórico é append-only para o cliente.
--   * Limite de perguntas por hora, para o chat não virar spam.
-- ============================================================================

-- ---------------------------------------------------------------- base --
create table if not exists public.teacher_faq (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  -- Nulo = vale para todas as turmas do professor.
  class_id uuid references public.classes (id) on delete cascade,
  question text not null check (length(btrim(question)) between 3 and 300),
  answer text not null check (length(btrim(answer)) between 1 and 2000),
  -- Palavras extras para encontrar a pergunta ("prazo, data, entregar").
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

-- ------------------------------------------------------------- conversas --
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
  -- Só nas mensagens do bot: answered | unanswered (na fila do professor) | resolved.
  status text check (status is null or status in ('answered', 'unanswered', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists bot_messages_conv_idx on public.bot_messages (conversation_id, created_at);
create index if not exists bot_messages_pending_idx on public.bot_messages (conversation_id) where status = 'unanswered';

alter table public.bot_messages enable row level security;

-- --------------------------------------------------------------- ajudantes --
-- O professor leciona na turma deste aluno?
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

-- ---------------------------------------------------------------- policies --
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
-- (Sem policy de insert/update/delete: a escrita é só pelas funções abaixo.)

-- ----------------------------------------------------------------- funções --
-- Os professores da turma do aluno (para a lista do chat).
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

-- O aluno pergunta. O TEXTO da resposta vem da tabela, nunca do cliente.
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

  -- Limite: 30 perguntas por hora por aluno.
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

-- Fila do professor: perguntas que o bot não soube responder.
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

-- O professor responde uma pergunta da fila — e pode guardá-la na base.
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
