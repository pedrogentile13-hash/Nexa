-- ============================================================================
-- Nexa — questões DISCURSIVAS com correção por IA.
--
-- O que esta suíte existe para impedir:
--   1. Discursiva sem resposta esperada (a IA corrigiria no escuro).
--   2. O aluno ler a resposta esperada/critérios antes de encerrar (RLS e `quiz_questions`).
--   3. O aluno dar nota para si mesmo: gravar a nota só com a chave de serviço (service_role).
--   4. Reescrever a resposta depois de corrigida, ou corrigir duas vezes.
--   5. Responder discursiva em tentativa alheia ou como se fosse objetiva.
--   6. A nota não refletir no total de acertos (inclusive com a tentativa já encerrada).
-- ============================================================================

\set ADMIN '33333333-3333-3333-3333-333333333387'
\set ALUNO '44444444-4444-4444-4444-444444444487'
\set OUTRO '44444444-4444-4444-4444-444444444488'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADMIN', 'admin-disc@nexa.test', '{"full_name": "Admin Discursiva"}'),
  (:'ALUNO', 'aluno-disc@nexa.test', '{"full_name": "Aluno Discursiva"}'),
  (:'OUTRO', 'outro-disc@nexa.test', '{"full_name": "Outro Aluno"}');

update public.profiles set role = 'admin' where id = :'ADMIN';

set "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333387'; -- ADMIN
set role authenticated;

insert into public.resources (id, subject_catalog_id, kind, title, is_published)
values ('cccccccc-0000-0000-0000-000000000087', (select id from public.subject_catalog order by slug limit 1), 'simulado', 'Simulado misto de teste', true);

insert into public.questions (id, resource_id, position, statement, explanation) values
  ('dddddddd-0000-0000-0000-000000000871', 'cccccccc-0000-0000-0000-000000000087', 1, 'Questão objetiva', 'Explicação.');
insert into public.question_options (question_id, position, body, is_correct) values
  ('dddddddd-0000-0000-0000-000000000871', 1, 'errada', false),
  ('dddddddd-0000-0000-0000-000000000871', 2, 'certa', true);

do $$
begin
  -- 1 · discursiva SEM resposta esperada é recusada
  begin
    insert into public.questions (id, resource_id, position, statement, kind)
    values ('dddddddd-0000-0000-0000-000000000879', 'cccccccc-0000-0000-0000-000000000087', 9, 'Explique algo importante.', 'discursiva');
    assert false, 'discursiva sem resposta esperada foi aceita';
  exception when check_violation then null;
  end;
  -- tipo inventado também
  begin
    insert into public.questions (id, resource_id, position, statement, kind)
    values ('dddddddd-0000-0000-0000-000000000878', 'cccccccc-0000-0000-0000-000000000087', 8, 'Qualquer enunciado.', 'oral');
    assert false, 'tipo inválido foi aceito';
  exception when check_violation then null;
  end;
end $$;

insert into public.questions (id, resource_id, position, statement, explanation, kind, model_answer, rubric) values
  ('dddddddd-0000-0000-0000-000000000872', 'cccccccc-0000-0000-0000-000000000087', 2,
   'Explique duas causas da Revolução Francesa.', 'Contexto.', 'discursiva',
   'Crise financeira do Estado e desigualdade entre os estamentos (privilégios do clero e da nobreza), além do Iluminismo.',
   'Cite pelo menos duas causas e relacione-as ao Antigo Regime.');

reset role;

-- ============================================================================
-- 2 · o aluno não lê a resposta esperada
-- ============================================================================
set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444487'; -- ALUNO
set role authenticated;

do $$
declare
  v_row record;
begin
  assert (select count(*) from public.questions) = 0, 'aluno leu a tabela de questões (RLS)';
  select * into v_row from public.quiz_questions('cccccccc-0000-0000-0000-000000000087') where kind = 'discursiva';
  assert v_row.question_id is not null, 'quiz_questions deveria listar a discursiva';
  assert v_row.kind = 'discursiva', 'tipo da questão';
  assert (select count(*) from public.quiz_questions('cccccccc-0000-0000-0000-000000000087') where kind = 'objetiva') = 1, 'deveria haver 1 objetiva';
  assert (select jsonb_array_length(options) from public.quiz_questions('cccccccc-0000-0000-0000-000000000087') where kind = 'discursiva') = 0,
    'discursiva não tem alternativas';
end $$;

select set_config('nexa.disc_attempt', public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000087')::text, false);

do $$
declare
  v_att uuid := current_setting('nexa.disc_attempt')::uuid;
  v_state record;
begin
  -- 5 · como objetiva: não vale
  begin
    perform public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000871', 'texto', 1);
    assert false, 'texto salvo numa questão objetiva';
  exception when sqlstate '23514' then null;
  end;
  -- texto vazio
  begin
    perform public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000872', '   ', 1);
    assert false, 'resposta vazia foi aceita';
  exception when sqlstate '22023' then null;
  end;

  assert public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000872', 'A crise financeira do reino.', 5), 'salvar';
  -- reescrever antes de corrigir é permitido
  assert public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000872', 'A crise financeira e os privilégios da nobreza.', 7), 'reescrever';

  select * into v_state from public.quiz_attempt_state(v_att) where question_id = 'dddddddd-0000-0000-0000-000000000872';
  assert v_state.answer_text = 'A crise financeira e os privilégios da nobreza.', 'texto restaurado ao retomar';
  assert v_state.ai_score is null, 'ainda sem nota';

  -- 3 · o aluno NÃO consegue dar nota nem ler a resposta esperada pela função de serviço
  assert not has_function_privilege('authenticated', 'public.record_discursive_grade(uuid,uuid,numeric,text)', 'execute'), 'aluno pode gravar nota';
  assert not has_function_privilege('authenticated', 'public.discursive_grading_context(uuid,uuid)', 'execute'), 'aluno pode ler o contexto de correção';
  assert not has_function_privilege('anon', 'public.record_discursive_grade(uuid,uuid,numeric,text)', 'execute'), 'anon pode gravar nota';
  assert has_function_privilege('service_role', 'public.record_discursive_grade(uuid,uuid,numeric,text)', 'execute'), 'servidor deveria poder gravar nota';
  assert has_function_privilege('service_role', 'public.discursive_grading_context(uuid,uuid)', 'execute'), 'servidor deveria ler o contexto';
end $$;

-- discursiva ainda sem nota (tentativa já encerrada no fluxo do simulado) não vira "erro" nas Revisões nem no domínio
-- (a tentativa deste aluno ainda está aberta aqui; o teste abaixo cobre a encerrada)

-- 5 · outra pessoa não escreve na tentativa dela
reset role;
set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444488'; -- OUTRO
set role authenticated;
do $$
begin
  begin
    perform public.save_discursive_answer(current_setting('nexa.disc_attempt')::uuid, 'dddddddd-0000-0000-0000-000000000872', 'invasão', 1);
    assert false, 'escreveu na tentativa de outra pessoa';
  exception when sqlstate '42501' then null;
  end;
end $$;
reset role;

-- ============================================================================
-- 3/4/6 · o servidor (service_role) corrige uma vez; reescrever depois é recusado
-- ============================================================================
do $$
declare
  v_att uuid := current_setting('nexa.disc_attempt')::uuid;
  v_ctx record;
begin
  select * into v_ctx from public.discursive_grading_context(v_att, 'dddddddd-0000-0000-0000-000000000872');
  assert v_ctx.user_id = '44444444-4444-4444-4444-444444444487', 'dono da tentativa';
  assert v_ctx.model_answer like 'Crise financeira%', 'resposta esperada para a IA';
  assert v_ctx.answer_text like 'A crise financeira e os privilégios%', 'texto do aluno';
  assert v_ctx.graded_at is null, 'ainda sem correção';

  -- nota fora da faixa
  begin
    perform public.record_discursive_grade(v_att, 'dddddddd-0000-0000-0000-000000000872', 1.5, 'x');
    assert false, 'nota acima de 1 foi aceita';
  exception when sqlstate '22023' then null;
  end;

  assert public.record_discursive_grade(v_att, 'dddddddd-0000-0000-0000-000000000872', 0.75, 'Boa resposta: cita duas causas.'), 'gravar nota';
  assert not public.record_discursive_grade(v_att, 'dddddddd-0000-0000-0000-000000000872', 1, 'tentativa de corrigir de novo'), 'corrigiu duas vezes';
  assert (select ai_score from public.quiz_answers where attempt_id = v_att and question_id = 'dddddddd-0000-0000-0000-000000000872') = 0.75, 'a segunda correção sobrescreveu a primeira';
  assert (select is_correct from public.quiz_answers where attempt_id = v_att and question_id = 'dddddddd-0000-0000-0000-000000000872'), '75% deveria contar como certa';
end $$;

set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444487'; -- ALUNO
set role authenticated;
do $$
declare
  v_att uuid := current_setting('nexa.disc_attempt')::uuid;
  v_res record;
begin
  -- 4 · depois de corrigida, a resposta fica travada
  begin
    perform public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000872', 'agora escrevo a resposta perfeita', 1);
    assert false, 'reescreveu depois da correção';
  exception when sqlstate '23514' then null;
  end;

  -- antes de encerrar, o gabarito não existe
  assert (select count(*) from public.quiz_attempt_review(v_att)) = 0, 'gabarito liberado com a tentativa aberta';

  select * into v_res from public.finish_quiz_attempt(v_att);
  assert v_res.total_count = 2, 'total de questões';
  assert v_res.correct_count = 1, 'a discursiva corrigida deveria entrar nos acertos';

  -- depois de encerrar, a resposta esperada aparece no gabarito
  select * into v_res from public.quiz_attempt_review(v_att) where kind = 'discursiva';
  assert v_res.model_answer like 'Crise financeira%', 'gabarito da discursiva';
  assert v_res.ai_feedback like 'Boa resposta%', 'devolutiva da IA';
  assert v_res.ai_score = 0.75, 'nota da IA';
  assert (select model_answer from public.quiz_attempt_review(v_att) where kind = 'objetiva') is null, 'objetiva não tem resposta esperada';
end $$;
reset role;

-- ============================================================================
-- 6 · simulado: corrigir DEPOIS de encerrar atualiza o total de acertos da tentativa
-- ============================================================================
set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444488'; -- OUTRO
set role authenticated;
select set_config('nexa.disc_attempt2', public.start_quiz_attempt('cccccccc-0000-0000-0000-000000000087')::text, false);
do $$
declare
  v_att uuid := current_setting('nexa.disc_attempt2')::uuid;
begin
  perform public.save_discursive_answer(v_att, 'dddddddd-0000-0000-0000-000000000872', 'Não sei.', 3);
  perform public.finish_quiz_attempt(v_att);
  assert (select correct_count from public.quiz_attempts where id = v_att) = 0, 'sem acertos antes da correção';
  -- sem nota da IA, a discursiva não é "erro" nas Revisões nem entra no domínio por assunto
  assert (select count(*) from public.recent_errors() where question_id = 'dddddddd-0000-0000-0000-000000000872') = 0, 'discursiva sem nota virou erro';
end $$;
reset role;

do $$
declare
  v_att uuid := current_setting('nexa.disc_attempt2')::uuid;
begin
  -- nota baixa: não conta como certa
  assert public.record_discursive_grade(v_att, 'dddddddd-0000-0000-0000-000000000872', 0.2, 'Faltam as causas.'), 'gravar nota baixa';
  assert not (select is_correct from public.quiz_answers where attempt_id = v_att and question_id = 'dddddddd-0000-0000-0000-000000000872'), '20% não é certa';
  assert (select correct_count from public.quiz_attempts where id = v_att) = 0, 'total de acertos não deveria subir';
end $$;

-- limpeza dos dados do teste
delete from public.quiz_attempts where resource_id = 'cccccccc-0000-0000-0000-000000000087';
delete from public.resources where id = 'cccccccc-0000-0000-0000-000000000087';
