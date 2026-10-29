-- ============================================================================
-- Nexa Community — Fases 7-10: eventos, inscrição/lista de espera, check-in,
-- certificado.
--
-- O que esta suíte existe para impedir:
--   1. Aluno comum criar evento (só dono/moderador de comunidade ou quem
--      gerencia a escola).
--   2. Inscrição além da capacidade virar 'registered' em vez de 'waitlisted'.
--   3. Cancelar não promover o primeiro da fila de espera.
--   4. Check-in por código de quem não gerencia o evento.
--   5. Certificado antes do evento terminar, ou sem check-in.
-- ============================================================================

\set ADMIN   '55555555-9999-9999-9999-999999999990'
\set ALUNO_A '55555555-9999-9999-9999-999999999991'
\set ALUNO_B '55555555-9999-9999-9999-999999999992'
\set ALUNO_C '55555555-9999-9999-9999-999999999993'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN',   'admin-evt@nexa.test', '{"full_name": "Admin Evt"}'),
  (:'ALUNO_A', 'alunoa-evt@nexa.test', '{"full_name": "Aluno A"}'),
  (:'ALUNO_B', 'alunob-evt@nexa.test', '{"full_name": "Aluno B"}'),
  (:'ALUNO_C', 'alunoc-evt@nexa.test', '{"full_name": "Aluno C"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('66666666-0000-0000-0000-000000000090', 'Escola Eventos', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = '66666666-0000-0000-0000-000000000090'
  where id in (:'ALUNO_A', :'ALUNO_B', :'ALUNO_C');

-- 1 · aluno comum não cria evento fora de comunidade
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999991'; -- ALUNO_A
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.create_event('Evento pirata', now() + interval '3 days');
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'aluno comum conseguiu criar evento fora de uma comunidade';
end;
$$;

reset role;

-- Admin cria um evento de capacidade 1 (pra testar lista de espera).
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999990'; -- ADMIN
set role authenticated;

-- Admin GERAL não tem escola própria (`current_school_id()` daria null) —
-- precisa escolher explicitamente, por isso `p_school_id` aqui.
select public.create_event(
  p_title => 'Feira de Ciências', p_starts_at => now() + interval '3 days',
  p_description => 'Projetos dos alunos', p_location => 'Quadra', p_capacity => 1,
  p_school_id => '66666666-0000-0000-0000-000000000090'
) as id \gset event_
-- `:'var'` do psql não é substituído DENTRO de um bloco `do $$ ... $$` (é
-- texto dollar-quoted, psql não mexe nele) — mesma pegadinha já resolvida
-- nesta sessão com `set_config`/`current_setting` (ver `38_quiz_answer_lock`).
-- Grava aqui pra todo `do $$` abaixo ler via `current_setting`.
select set_config('nexa.event_id', :'event_id', false);

reset role;

-- 2 · ALUNO_A se inscreve primeiro — pega a vaga.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999991'; -- ALUNO_A
set role authenticated;

do $$
declare
  v_status text;
begin
  v_status := public.register_for_event(current_setting('nexa.event_id')::uuid);
  assert v_status = 'registered', format('primeira inscrição deveria confirmar vaga, veio %s', v_status);
end;
$$;

-- Task da Agenda foi criada.
do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.tasks
  where user_id = '55555555-9999-9999-9999-999999999991' and related_event_id = current_setting('nexa.event_id')::uuid and kind = 'evento';
  assert v_total = 1, 'inscrição confirmada deveria criar uma task de evento na Agenda';
end;
$$;

reset role;

-- 3 · ALUNO_B se inscreve depois — capacidade lotada, vai pra fila.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999992'; -- ALUNO_B
set role authenticated;

do $$
declare
  v_status text;
begin
  v_status := public.register_for_event(current_setting('nexa.event_id')::uuid);
  assert v_status = 'waitlisted', format('segunda inscrição com capacidade 1 deveria ir pra fila, veio %s', v_status);
end;
$$;

reset role;

-- 4 · ALUNO_A cancela — ALUNO_B é promovido automaticamente.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999991'; -- ALUNO_A
set role authenticated;
select public.cancel_registration(current_setting('nexa.event_id')::uuid);
reset role;

do $$
declare
  v_status text;
begin
  select status into v_status from public.event_registrations
  where event_id = current_setting('nexa.event_id')::uuid and user_id = '55555555-9999-9999-9999-999999999992';
  assert v_status = 'registered', format('ALUNO_B deveria ter sido promovido pra registered, está %s', v_status);
end;
$$;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.tasks
  where user_id = '55555555-9999-9999-9999-999999999992' and related_event_id = current_setting('nexa.event_id')::uuid;
  assert v_total = 1, 'ALUNO_B promovido deveria ganhar a task da Agenda';

  select count(*) into v_total from public.tasks
  where user_id = '55555555-9999-9999-9999-999999999991' and related_event_id = current_setting('nexa.event_id')::uuid;
  assert v_total = 0, 'ALUNO_A cancelado deveria perder a task da Agenda';
end;
$$;

-- 5 · check-in por código: só quem gerencia o evento pode confirmar.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999992'; -- ALUNO_B
set role authenticated;
select check_in_code from public.get_my_event_ticket(current_setting('nexa.event_id')::uuid) \gset ticket_
select set_config('nexa.ticket_code', :'ticket_check_in_code', false);
reset role;

set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999993'; -- ALUNO_C (não gerencia nada)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.check_in_by_code(current_setting('nexa.ticket_code'));
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'aluno que não gerencia o evento conseguiu confirmar check-in';
end;
$$;

reset role;

set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999990'; -- ADMIN
set role authenticated;
select public.check_in_by_code(current_setting('nexa.ticket_code'));
reset role;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.attendance
  where event_id = current_setting('nexa.event_id')::uuid and user_id = '55555555-9999-9999-9999-999999999992';
  assert v_total = 1, 'check-in por código do admin deveria gravar presença';
end;
$$;

-- 6 · certificado: sem check-in falha; ALUNO_A (cancelado, sem check-in) não consegue.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999991'; -- ALUNO_A
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.get_my_certificate(current_setting('nexa.event_id')::uuid);
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'certificado liberado sem check-in';
end;
$$;

reset role;

-- Evento no futuro — mesmo quem fez check-in (hipoteticamente) não tira certificado ainda.
set "request.jwt.claim.sub" = '55555555-9999-9999-9999-999999999992'; -- ALUNO_B (já com check-in)
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.get_my_certificate(current_setting('nexa.event_id')::uuid);
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'certificado liberado antes do evento terminar';
end;
$$;

reset role;

select 'ok' as result;
