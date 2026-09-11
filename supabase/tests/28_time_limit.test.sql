-- ============================================================================
-- Nexa — suíte SQL: tempo limite do simulado é aplicado de verdade.
--
-- `time_limit_seconds` era só decorativo no cliente — nada no banco recusava
-- resposta depois do prazo. Esta suíte prova que `answer_quiz_question`
-- agora recusa (e que dentro do prazo continua funcionando normalmente).
--
-- psql não substitui variáveis dentro de blocos $$...$$, então tentativa e
-- alternativa viajam por GUCs de sessão (mesmo padrão de 20_content.test.sql).
-- ============================================================================

\set FELIPE '11111111-9999-9999-9999-999999999901'

insert into auth.users (id, email, raw_user_meta_data)
values (:'FELIPE', 'felipe-tempo@nexa.test', '{"full_name": "Felipe Tempo"}');

select id from public.subject_catalog limit 1 \gset subj_

insert into public.resources (id, subject_catalog_id, kind, title, is_published, xp_reward, time_limit_seconds)
values ('22222222-0000-0000-0000-000000000001', :'subj_id', 'simulado', 'Simulado com prazo', true, 100, 60);

insert into public.questions (id, resource_id, position, statement, explanation)
values ('22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 1, '1+1?', '2.');

insert into public.question_options (question_id, position, body, is_correct) values
  ('22222222-0000-0000-0000-000000000002', 1, '2', true),
  ('22222222-0000-0000-0000-000000000002', 2, '3', false);

select set_config('nexa.tl_right',
  (select id::text from public.question_options
   where question_id = '22222222-0000-0000-0000-000000000002' and is_correct), false);

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999901';
set role authenticated;

-- Dentro do prazo: responde normalmente.
select set_config('nexa.tl_attempt', public.start_quiz_attempt('22222222-0000-0000-0000-000000000001')::text, false);

do $$
begin
  perform public.answer_quiz_question(
    current_setting('nexa.tl_attempt')::uuid,
    '22222222-0000-0000-0000-000000000002',
    current_setting('nexa.tl_right')::uuid
  );
end;
$$;

reset role;

-- Volta o relógio da tentativa pra "há muito tempo" — simula o prazo de 60s
-- (+ 15s de folga) estourado, sem precisar esperar de verdade.
update public.quiz_attempts
set started_at = now() - interval '10 minutes'
where id = current_setting('nexa.tl_attempt')::uuid;

set "request.jwt.claim.sub" = '11111111-9999-9999-9999-999999999901';
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.answer_quiz_question(
      current_setting('nexa.tl_attempt')::uuid,
      '22222222-0000-0000-0000-000000000002',
      current_setting('nexa.tl_right')::uuid
    );
    v_falhou := true;
  exception when others then
    null; -- esperado: tempo esgotado
  end;
  assert not v_falhou, 'answer_quiz_question aceitou resposta depois do prazo';
end;
$$;

reset role;

select 'ok' as result;
