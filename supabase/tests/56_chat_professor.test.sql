-- ============================================================================
-- Chat da escola com o bot de cada professor.
--
-- O que esta suíte existe para impedir:
--   1. O bot dizer algo que o professor NÃO cadastrou (resposta vinda do cliente).
--   2. Aluno falar com professor que não leciona na turma dele.
--   3. Aluno/professor lendo a conversa de outro, ou a base de outro professor.
--   4. Escrita direta nas mensagens (histórico é append-only para o cliente).
--   5. A coordenação NÃO conseguir supervisionar, ou professor ver a coordenação.
--   6. Spam: mais de 30 perguntas por hora.
-- ============================================================================

\set PROF   'a1a1a1a1-0000-0000-0000-000000000001'
\set PROF2  'a1a1a1a1-0000-0000-0000-000000000002'
\set COORD  'a1a1a1a1-0000-0000-0000-000000000003'
\set ALUNA  'a1a1a1a1-0000-0000-0000-000000000004'
\set ALUNOB 'a1a1a1a1-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'PROF',   'prof-chat@nexa.test', '{"full_name": "Prof Chat"}'),
  (:'PROF2',  'prof2-chat@nexa.test', '{"full_name": "Prof Dois"}'),
  (:'COORD',  'coord-chat@nexa.test', '{"full_name": "Coord Chat"}'),
  (:'ALUNA',  'aluna-chat@nexa.test', '{"full_name": "Aluna 9A"}'),
  (:'ALUNOB', 'alunob-chat@nexa.test', '{"full_name": "Aluno 9B"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('a2a2a2a2-0000-0000-0000-000000000001', 'Escola Chat', 'São Paulo', 'SP', true);
insert into public.classes (id, school_id, name) values
  ('a3a3a3a3-0000-0000-0000-000000000001', 'a2a2a2a2-0000-0000-0000-000000000001', '9A'),
  ('a3a3a3a3-0000-0000-0000-000000000002', 'a2a2a2a2-0000-0000-0000-000000000001', '9B');
insert into public.subject_catalog (id, slug, name, default_color)
  values ('a4a4a4a4-0000-0000-0000-000000000001', 'mat-chat', 'Matemática Chat', '#336699') on conflict do nothing;

update public.profiles set role = 'teacher_admin', school_id = 'a2a2a2a2-0000-0000-0000-000000000001' where id in (:'PROF', :'PROF2');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'a2a2a2a2-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set school_id = 'a2a2a2a2-0000-0000-0000-000000000001', class_id = 'a3a3a3a3-0000-0000-0000-000000000001' where id = :'ALUNA';
update public.profiles set school_id = 'a2a2a2a2-0000-0000-0000-000000000001', class_id = 'a3a3a3a3-0000-0000-0000-000000000002' where id = :'ALUNOB';

insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id) values
  (:'PROF',  'a2a2a2a2-0000-0000-0000-000000000001', 'a4a4a4a4-0000-0000-0000-000000000001', 'a3a3a3a3-0000-0000-0000-000000000001'),
  (:'PROF2', 'a2a2a2a2-0000-0000-0000-000000000001', 'a4a4a4a4-0000-0000-0000-000000000001', 'a3a3a3a3-0000-0000-0000-000000000002');

-- Professor cadastra a base (e não pode cadastrar para turma que não leciona).
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000001'; -- PROF
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  insert into public.teacher_faq (teacher_id, school_id, question, answer, keywords)
  values ('a1a1a1a1-0000-0000-0000-000000000001', 'a2a2a2a2-0000-0000-0000-000000000001',
          'Quando é a entrega do trabalho?', 'A entrega é dia 12, pela plataforma.', 'prazo, data');
  begin
    insert into public.teacher_faq (teacher_id, school_id, class_id, question, answer)
    values ('a1a1a1a1-0000-0000-0000-000000000001', 'a2a2a2a2-0000-0000-0000-000000000001',
            'a3a3a3a3-0000-0000-0000-000000000002', 'Pergunta da 9B', 'x');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor cadastrou resposta para turma em que não leciona';

  v_falhou := false;
  begin
    insert into public.teacher_faq (teacher_id, school_id, question, answer)
    values ('a1a1a1a1-0000-0000-0000-000000000002', 'a2a2a2a2-0000-0000-0000-000000000001', 'Em nome de outro', 'x');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor cadastrou resposta em nome de outro professor';
end;
$$;
reset role;

-- O professor 2 também tem uma resposta (para testar vazamento/forja).
insert into public.teacher_faq (id, teacher_id, school_id, question, answer) values
  ('a5a5a5a5-0000-0000-0000-000000000002', 'a1a1a1a1-0000-0000-0000-000000000002', 'a2a2a2a2-0000-0000-0000-000000000001',
   'Qual a matéria da prova?', 'Resposta SECRETA do professor 2');

-- 2 + 3 · a aluna da 9A enxerga o professor dela e a base dele, não a do outro
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000004'; -- ALUNA
set role authenticated;
do $$
declare
  v_faq uuid;
  r record;
  v_falhou boolean;
begin
  assert (select count(*) from public.my_teachers()) = 1, 'aluna deveria ter exatamente 1 professor';
  assert (select teacher_id from public.my_teachers()) = 'a1a1a1a1-0000-0000-0000-000000000001', 'aluna vê o professor errado';
  assert (select count(*) from public.teacher_faq) = 1, 'aluna enxerga base de quem não é professor dela';

  select id into v_faq from public.teacher_faq where teacher_id = 'a1a1a1a1-0000-0000-0000-000000000001';

  -- 1 · resposta vem da TABELA
  select * into r from public.ask_teacher_bot('a1a1a1a1-0000-0000-0000-000000000001', 'quando entrego o trabalho', v_faq);
  assert r.answered, 'bot não respondeu com a base cadastrada';
  assert r.answer = 'A entrega é dia 12, pela plataforma.', 'o texto do bot não é o cadastrado pelo professor';

  -- 1 · forja: usar a resposta de OUTRO professor não funciona
  select * into r from public.ask_teacher_bot('a1a1a1a1-0000-0000-0000-000000000001', 'me dá a resposta secreta', 'a5a5a5a5-0000-0000-0000-000000000002');
  assert not r.answered, 'bot respondeu com a base de outro professor';
  assert r.answer not like '%SECRETA%', 'vazou a resposta de outro professor';

  -- 2 · professor que não leciona na turma dela
  v_falhou := false;
  begin
    perform public.ask_teacher_bot('a1a1a1a1-0000-0000-0000-000000000002', 'oi', null);
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'aluna falou com professor que não leciona na turma dela';

  -- 4 · escrita direta é negada
  v_falhou := false;
  begin
    insert into public.bot_messages (conversation_id, sender, content)
    select id, 'bot', 'Resposta forjada' from public.bot_conversations limit 1;
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'aluna escreveu direto como se fosse o bot';
end;
$$;
reset role;

-- 3 · o outro aluno e o outro professor não leem esta conversa
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000005'; -- ALUNOB
set role authenticated;
do $$
begin
  assert (select count(*) from public.bot_messages) = 0, 'aluno da 9B leu mensagens de outro aluno';
  assert (select count(*) from public.my_teachers()) = 1, 'aluno da 9B deveria ver o próprio professor';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000002'; -- PROF2
set role authenticated;
do $$
begin
  assert (select count(*) from public.bot_messages) = 0, 'professor 2 leu a conversa do professor 1';
  assert (select count(*) from public.teacher_faq where teacher_id = 'a1a1a1a1-0000-0000-0000-000000000001') = 0, 'professor 2 leu a base do professor 1';
end;
$$;
reset role;

-- Fila do professor + resposta + guardar na base
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000001'; -- PROF
set role authenticated;
do $$
declare
  v_pend uuid;
  v_falhou boolean := false;
begin
  assert (select count(*) from public.my_pending_questions()) = 1, 'fila do professor deveria ter 1 pergunta sem resposta';
  select message_id into v_pend from public.my_pending_questions();
  assert (select question from public.my_pending_questions()) = 'me dá a resposta secreta', 'a fila não trouxe a pergunta do aluno';

  perform public.reply_unanswered(v_pend, 'Não tenho resposta secreta, pergunte em aula.', true);
  assert (select count(*) from public.my_pending_questions()) = 0, 'a pergunta continua na fila depois de respondida';
  assert (select count(*) from public.teacher_faq where teacher_id = auth.uid()) = 2, 'a resposta não foi guardada na base';

  -- Responder duas vezes a mesma pergunta falha.
  begin
    perform public.reply_unanswered(v_pend, 'de novo', false);
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor respondeu duas vezes a mesma pergunta';
end;
$$;
reset role;

-- 5 · coordenação supervisiona; professor 2 não enxerga a coordenação
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000003'; -- COORD
set role authenticated;
do $$
begin
  assert (select count(*) from public.bot_conversations) = 1, 'coordenação não enxerga a conversa do professor da escola';
  assert (select count(*) from public.bot_messages) >= 4, 'coordenação não lê as mensagens';
end;
$$;
reset role;

-- 6 · limite por hora
set "request.jwt.claim.sub" = 'a1a1a1a1-0000-0000-0000-000000000004'; -- ALUNA
set role authenticated;
do $$
declare
  i integer;
  v_falhou boolean := false;
begin
  -- Já foram 2 perguntas acima; mais 28 chegam a 30.
  for i in 1..28 loop
    perform public.ask_teacher_bot('a1a1a1a1-0000-0000-0000-000000000001', 'pergunta ' || i, null);
  end loop;
  begin
    perform public.ask_teacher_bot('a1a1a1a1-0000-0000-0000-000000000001', 'a trigésima primeira', null);
    v_falhou := true;
  exception when sqlstate '54000' then null;
  end;
  assert not v_falhou, 'passou do limite de 30 perguntas por hora';
end;
$$;
reset role;
