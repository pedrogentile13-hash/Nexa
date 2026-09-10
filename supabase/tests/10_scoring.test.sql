-- ============================================================================
-- Nexa — SQL suite: onboarding, avaliação automática, streak, gamificação.
--
-- Roda como `authenticated` (nunca como superusuário) sempre que o teste
-- depende de RLS de verdade — como dono das tabelas o Postgres pularia toda
-- policy e a suíte não provaria nada.
--
-- O motor de nota automática (migration automatic_scoring.sql) substitui o
-- boletim manual: aqui montamos um cenário fechado — 1 quiz, 1 simulado, 1
-- resumo concluído, 1 sessão de estudo — e conferimos que `subject_scores()`
-- chega no número exato esperado, contas na mão.
-- ============================================================================

\set ALICE '11111111-1111-1111-1111-111111111111'
\set BOB   '22222222-2222-2222-2222-222222222222'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ALICE', 'alice@nexa.test', '{"full_name": "Alice Aluna"}'),
  (:'BOB', 'bob@nexa.test', '{"full_name": "Bob Aluno"}');

-- The signup trigger must have produced a profile + stats row for each.
do $$
begin
  assert (select count(*) from public.profiles) = 2, 'handle_new_user did not create profiles';
  assert (select count(*) from public.user_stats) = 2, 'handle_new_user did not create user_stats';
  assert (select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111')
         = 'Alice Aluna', 'full_name not taken from user metadata';
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixture de conteúdo (como superusuário — é o que uma migration/seed faz).
-- Um quiz, um simulado e um resumo, todos em Matemática.
-- ---------------------------------------------------------------------------
select id from public.subject_catalog where slug = 'matematica' \gset matematica_

insert into public.resources (id, subject_catalog_id, kind, title, is_published, xp_reward)
values ('99990000-0000-0000-0000-000000000001', :'matematica_id', 'quiz', 'Quiz de Frações', true, 100);

insert into public.questions (id, resource_id, position, statement, explanation)
values
  ('99990000-0000-0000-0000-000000000011', '99990000-0000-0000-0000-000000000001', 1, '1/2 + 1/2 = ?', '= 1.'),
  ('99990000-0000-0000-0000-000000000012', '99990000-0000-0000-0000-000000000001', 2, '1/4 + 1/4 = ?', '= 1/2.');

insert into public.question_options (question_id, position, body, is_correct) values
  ('99990000-0000-0000-0000-000000000011', 1, '1', true),
  ('99990000-0000-0000-0000-000000000011', 2, '2', false),
  ('99990000-0000-0000-0000-000000000012', 1, '1/2', true),
  ('99990000-0000-0000-0000-000000000012', 2, '1', false);

insert into public.resources (id, subject_catalog_id, kind, title, is_published, xp_reward)
values ('99990000-0000-0000-0000-000000000002', :'matematica_id', 'simulado', 'Simulado de Álgebra', true, 100);

insert into public.questions (id, resource_id, position, statement, explanation)
values
  ('99990000-0000-0000-0000-000000000021', '99990000-0000-0000-0000-000000000002', 1, '2x = 6, x = ?', '= 3.'),
  ('99990000-0000-0000-0000-000000000022', '99990000-0000-0000-0000-000000000002', 2, 'x + 1 = 5, x = ?', '= 4.');

insert into public.question_options (question_id, position, body, is_correct) values
  ('99990000-0000-0000-0000-000000000021', 1, '3', true),
  ('99990000-0000-0000-0000-000000000021', 2, '6', false),
  ('99990000-0000-0000-0000-000000000022', 1, '4', true),
  ('99990000-0000-0000-0000-000000000022', 2, '5', false);

insert into public.resources (id, subject_catalog_id, kind, title, body, is_published)
values ('99990000-0000-0000-0000-000000000003', :'matematica_id', 'resumo', 'Resumo de Frações', 'Texto.', true);

-- `question_options` não tem policy de SELECT para `authenticated` — é onde
-- mora o gabarito. Os ids das alternativas certas/erradas ficam guardados
-- AGORA, como superusuário, em GUCs de sessão — a mesma técnica de
-- `20_content.test.sql`, porque Alice não vai conseguir consultar essa
-- tabela depois de trocar de papel.
select set_config('nexa.q11_wrong',
  (select id::text from public.question_options
   where question_id = '99990000-0000-0000-0000-000000000011' and not is_correct), false);
select set_config('nexa.q12_right',
  (select id::text from public.question_options
   where question_id = '99990000-0000-0000-0000-000000000012' and is_correct), false);
select set_config('nexa.q21_right',
  (select id::text from public.question_options
   where question_id = '99990000-0000-0000-0000-000000000021' and is_correct), false);
select set_config('nexa.q22_right',
  (select id::text from public.question_options
   where question_id = '99990000-0000-0000-0000-000000000022' and is_correct), false);

-- ---------------------------------------------------------------------------
-- Act as Alice, exactly like PostgREST would.
-- ---------------------------------------------------------------------------
set "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
set role authenticated;

-- ------------------------------------------------- 1 · onboarding bootstrap --
select public.bootstrap_student(
  p_full_name => 'Alice Aluna',
  p_grade_level => '9º ano',
  p_class_name => '9A',
  p_school_id => null,
  p_timezone => 'America/Sao_Paulo',
  p_year_label => '2026',
  p_year_starts_on => '2026-02-02',
  p_year_ends_on => '2026-12-15',
  p_term_count => 4::smallint,
  p_catalog_ids => (
    select array_agg(id) from public.subject_catalog
    where slug in ('matematica', 'quimica')
  ),
  p_custom_subjects => array['Xadrez']
) as bootstrap_result \gset

do $$
declare
  v_terms integer;
  v_subjects integer;
  v_routines integer;
begin
  select count(*) into v_terms from public.terms;
  select count(*) into v_subjects from public.subjects;
  select count(*) into v_routines from public.routines;

  assert v_terms = 4, format('expected 4 terms, got %s', v_terms);
  assert v_subjects = 3, format('expected 3 subjects, got %s', v_subjects);
  assert v_routines = 3, format('expected 3 starter routines, got %s', v_routines);

  assert (select onboarded_at is not null from public.profiles
          where id = auth.uid()), 'onboarded_at was not stamped';
  -- Terms must tile the whole year with no gap and no overlap.
  assert (select min(starts_on) from public.terms) = '2026-02-02', 'first term start wrong';
  assert (select max(ends_on) from public.terms) = '2026-12-15', 'last term end wrong';
  assert (select count(*) from public.terms t1 join public.terms t2
          on t1.id <> t2.id and t1.starts_on <= t2.ends_on and t2.starts_on <= t1.ends_on) = 0,
    'terms overlap';
end;
$$;

-- 50 XP for onboarding should be in the ledger and reflected in the stats.
do $$
begin
  assert (select xp from public.user_stats where user_id = auth.uid()) = 50,
    'onboarding XP not applied';
  assert (select count(*) from public.xp_events where user_id = auth.uid()) = 1,
    'onboarding XP not recorded in the ledger';
end;
$$;

-- --------------------------------------------------------- 2 · nota automática --
-- Quiz: 1 de 2 (50%). Simulado: 2 de 2 (100%, pesa 2). Resumo concluído: 1 de 1
-- publicado em Matemática (então atividades = 100%). A sessão de estudo abaixo
-- não entra mais na nota — fica só como fixture usada por outros testes
-- (sync do timer, isolamento entre alunos) mais adiante neste arquivo.
do $$
declare
  v_matematica uuid;
  v_attempt uuid;
begin
  select id into v_matematica from public.subjects where name = 'Matemática';

  -- Quiz: erra a primeira, acerta a segunda.
  v_attempt := public.start_quiz_attempt('99990000-0000-0000-0000-000000000001');
  perform public.answer_quiz_question(v_attempt, '99990000-0000-0000-0000-000000000011',
    current_setting('nexa.q11_wrong')::uuid);
  perform public.answer_quiz_question(v_attempt, '99990000-0000-0000-0000-000000000012',
    current_setting('nexa.q12_right')::uuid);
  perform public.finish_quiz_attempt(v_attempt);

  -- Simulado: acerta as duas.
  v_attempt := public.start_quiz_attempt('99990000-0000-0000-0000-000000000002');
  perform public.answer_quiz_question(v_attempt, '99990000-0000-0000-0000-000000000021',
    current_setting('nexa.q21_right')::uuid);
  perform public.answer_quiz_question(v_attempt, '99990000-0000-0000-0000-000000000022',
    current_setting('nexa.q22_right')::uuid);
  perform public.finish_quiz_attempt(v_attempt);

  -- Conteúdo concluído.
  perform public.mark_resource_progress('99990000-0000-0000-0000-000000000003', 100, null, true);

  -- Sessão de estudo já encerrada (não deve colidir com o teste do timer
  -- único, mais abaixo, que exige zero sessões "rodando").
  insert into public.study_sessions (user_id, subject_id, started_at, ended_at, local_date, duration_seconds)
  values (auth.uid(), v_matematica, now() - interval '20 minutes', now(),
          public.user_local_date(), 1200);
end;
$$;

-- Nota: `v_row is not null` NÃO serve pra testar "a busca achou uma linha" —
-- em SQL, um valor composto só é "IS NOT NULL" quando TODOS os campos são
-- não nulos, e `target_grade` é legitimamente nulo (Alice não definiu meta).
-- Por isso os testes abaixo checam uma coluna específica sempre presente
-- (`subject_id`/`attempt_id`), não a linha inteira.
do $$
declare
  v_row record;
begin
  select * into v_row from public.subject_scores() t where t.subject_name = 'Matemática';

  assert v_row.subject_id is not null, 'Matemática não apareceu em subject_scores()';
  assert v_row.has_content, 'Matemática deveria ter catalog_id (tem conteúdo do Nexa)';
  assert v_row.quizzes_done = 1, format('quizzes_done: esperado 1, veio %s', v_row.quizzes_done);
  assert v_row.simulados_done = 1, format('simulados_done: esperado 1, veio %s', v_row.simulados_done);
  assert v_row.content_completed = 1, format('content_completed: esperado 1, veio %s', v_row.content_completed);

  -- avaliativo = (0.5·1 + 1.0·2) / 3 · 10 = 8,3333…
  assert round(v_row.assessment_score, 2) = 8.33,
    format('assessment_score: esperado 8.33, veio %s', v_row.assessment_score);

  -- atividades = conteúdo concluído / conteúdo publicado = 1/1 · 10 = 10 → empenho_index 100.0
  -- (só existe 1 resumo publicado em Matemática na fixture, e está concluído)
  assert round(v_row.empenho_index, 1) = 100.0,
    format('empenho_index: esperado 100.0, veio %s', v_row.empenho_index);

  -- final = 8,3333·0.7 + 10·0.3 = 5,8333 + 3 = 8,8333 → 8.83
  assert round(v_row.blended_score, 2) = 8.83,
    format('blended_score: esperado 8.83, veio %s', v_row.blended_score);

  assert v_row.passing_grade = 6.0, 'passing_grade deve ser a constante 6,0';
  assert v_row.target_grade is null, 'Alice não definiu meta nenhuma ainda';
end;
$$;

-- Matéria custom ("Xadrez", sem catalog_id) nunca tem nota — não inventa dado.
do $$
declare
  v_row record;
begin
  select * into v_row from public.subject_scores() t where t.subject_name = 'Xadrez';
  assert v_row.subject_id is not null, 'Xadrez deveria aparecer (aluna tem a matéria, só sem conteúdo)';
  assert not v_row.has_content, 'Xadrez não tem catalog_id — has_content deveria ser falso';
  assert v_row.assessment_score is null, 'matéria sem conteúdo do Nexa não pode ter nota avaliativa';
  assert v_row.blended_score is null, 'matéria sem nenhuma tentativa não pode ter nota final';
end;
$$;

do $$
declare
  v_row record;
begin
  select * into v_row from public.simulado_history() limit 1;
  assert v_row.attempt_id is not null, 'simulado_history() veio vazio';
  assert v_row.resource_title = 'Simulado de Álgebra', 'título do simulado errado no histórico';
  assert v_row.correct_count = 2 and v_row.total_count = 2, 'contagem de acertos errada no histórico';
  assert v_row.percent = 100.0, format('percent: esperado 100.0, veio %s', v_row.percent);
  assert (select count(*) from public.simulado_history()) = 1,
    'histórico deveria ter exatamente 1 simulado (o quiz não entra aqui)';
end;
$$;

do $$
declare
  v_count integer;
  v_last record;
begin
  select count(*) into v_count from public.performance_evolution();
  assert v_count = 12, format('performance_evolution: esperado 12 semanas, veio %s', v_count);

  select * into v_last from public.performance_evolution() t order by t.week_start desc limit 1;
  assert v_last.week_start = date_trunc('week', public.user_local_date())::date,
    'a última semana da evolução deveria ser a semana atual';
  assert v_last.assessment_score is not null,
    'a semana atual deveria ter nota avaliativa (as tentativas foram hoje)';
end;
$$;

-- --------------------------------------------------- 3 · timer único --------
do $$
declare
  v_subject uuid;
  v_failed boolean := false;
begin
  select id into v_subject from public.subjects limit 1;

  insert into public.study_sessions (user_id, subject_id, started_at, local_date, duration_seconds)
  values (auth.uid(), v_subject, now(), public.user_local_date(), 0);

  begin
    insert into public.study_sessions (user_id, subject_id, started_at, local_date, duration_seconds)
    values (auth.uid(), v_subject, now(), public.user_local_date(), 0);
  exception when unique_violation then
    v_failed := true;
  end;

  assert v_failed, 'a second running timer must be rejected';

  update public.study_sessions
  set ended_at = now(), duration_seconds = 1800
  where user_id = auth.uid() and ended_at is null;

  -- 1200 (fixture da nota) + 1800 (este teste) = 3000
  assert (select total_study_seconds from public.user_stats where user_id = auth.uid()) = 3000,
    format('sync_study_total: esperado 3000, veio %s',
      (select total_study_seconds from public.user_stats where user_id = auth.uid()));
end;
$$;

-- --------------------------------------------------- 4 · XP idempotency ----
-- `v_after_first`, não `v_before + 10`: `award_xp` agora dispara
-- `check_achievements` ao final, e o fixture acima (sessão de estudo) pode
-- muito bem cruzar o threshold de alguma conquista na primeira chamada —
-- comportamento novo e correto. O que este teste prova continua o mesmo:
-- reawardar a MESMA fonte não soma nada, nem XP direto nem de conquista.
do $$
declare
  v_task uuid;
  v_first integer;
  v_second integer;
  v_after_first integer;
begin
  insert into public.tasks (user_id, title) values (auth.uid(), 'Tarefa de teste')
  returning id into v_task;

  v_first := public.award_xp(10, 'Tarefa concluída', 'task', v_task);
  assert v_first = 10, format('first award should grant 10, got %s', v_first);

  select xp into v_after_first from public.user_stats where user_id = auth.uid();

  v_second := public.award_xp(10, 'Tarefa concluída', 'task', v_task);
  assert v_second = 0, format('re-awarding the same source must grant 0, got %s', v_second);
  assert (select xp from public.user_stats where user_id = auth.uid()) = v_after_first,
    're-awarding the same source must not change XP, directly or via achievements';
end;
$$;

-- --------------------------------------------------- 5 · streak + freeze ---
reset role;
do $$
declare
  v_alice uuid := '11111111-1111-1111-1111-111111111111';
  v_today date := public.user_local_date(v_alice);
  v_streak integer;
begin
  -- Day 1
  update public.user_stats
  set current_streak = 0, longest_streak = 0, last_active_local_date = null,
      streak_freezes_available = 1, streak_freezes_granted_week = null
  where user_id = v_alice;

  v_streak := public.touch_streak(v_alice);
  assert v_streak = 1, format('first activity should start the streak at 1, got %s', v_streak);

  -- Same day again → unchanged
  v_streak := public.touch_streak(v_alice);
  assert v_streak = 1, format('same-day activity must not bump the streak, got %s', v_streak);

  -- Consecutive day → 2
  update public.user_stats set last_active_local_date = v_today - 1 where user_id = v_alice;
  v_streak := public.touch_streak(v_alice);
  assert v_streak = 2, format('consecutive day should give 2, got %s', v_streak);

  -- Exactly one day missed, freeze available → streak survives and freeze spent
  update public.user_stats
  set last_active_local_date = v_today - 2, current_streak = 5,
      streak_freezes_available = 1, streak_freezes_granted_week = date_trunc('week', v_today)::date
  where user_id = v_alice;
  v_streak := public.touch_streak(v_alice);
  assert v_streak = 6, format('a freeze should carry the streak to 6, got %s', v_streak);
  assert (select streak_freezes_available from public.user_stats where user_id = v_alice) = 0,
    'the freeze should have been spent';

  -- Two days missed, no freeze → reset
  update public.user_stats
  set last_active_local_date = v_today - 3, current_streak = 9, longest_streak = 9,
      streak_freezes_available = 0, streak_freezes_granted_week = date_trunc('week', v_today)::date
  where user_id = v_alice;
  v_streak := public.touch_streak(v_alice);
  assert v_streak = 1, format('a real gap should reset the streak to 1, got %s', v_streak);
  assert (select longest_streak from public.user_stats where user_id = v_alice) = 9,
    'longest_streak must survive a reset — the record is the part worth keeping';
end;
$$;

-- ---------------------------------------------------- 6 · RLS isolation ----
set "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
set role authenticated;

do $$
declare
  v_failed boolean := false;
  v_alice uuid := '11111111-1111-1111-1111-111111111111';
begin
  assert (select count(*) from public.subjects) = 0, 'Bob can see Alice''s subjects';
  assert (select count(*) from public.terms) = 0, 'Bob can see Alice''s terms';
  assert (select count(*) from public.tasks) = 0, 'Bob can see Alice''s tasks';
  assert (select count(*) from public.study_sessions) = 0, 'Bob can see Alice''s study sessions';
  assert (select count(*) from public.quiz_attempts) = 0, 'Bob can see Alice''s quiz attempts';
  assert (select count(*) from public.profiles) = 1, 'Bob can see other profiles';
  assert (select count(*) from public.user_stats) = 1, 'user_stats leaks across users';
  assert (select count(*) from public.xp_events) = 0, 'xp_events leaks across users';

  -- `subject_scores`/`simulado_history`/`performance_evolution` são
  -- `security invoker` — nenhuma delas eleva privilégio. Mesmo passando o
  -- id da Alice explicitamente, a RLS de baixo (subjects/quiz_attempts/
  -- study_sessions, todas "user_id = auth.uid()") continua restringindo à
  -- própria Bob, então o parâmetro não vaza nada.
  assert (select count(*) from public.subject_scores(v_alice)) = 0,
    'subject_scores(ALICE) vazou dado da Alice pro Bob';
  assert (select count(*) from public.simulado_history(v_alice)) = 0,
    'simulado_history(ALICE) vazou dado da Alice pro Bob';

  -- `performance_evolution` sempre devolve as 12 semanas (o gerador de
  -- baldes não depende de nenhuma tabela com RLS) — o que não pode vazar é
  -- o CONTEÚDO de cada balde, não a contagem de linhas.
  assert (select count(*) from public.performance_evolution(v_alice)) = 12,
    'performance_evolution deveria sempre devolver 12 semanas, mesmo vazias';
  assert (select count(*) from public.performance_evolution(v_alice) where assessment_score is not null) = 0,
    'performance_evolution(ALICE) vazou nota avaliativa da Alice pro Bob';
  assert (select count(*) from public.performance_evolution(v_alice) where blended_score is not null) = 0,
    'performance_evolution(ALICE) vazou nota final da Alice pro Bob';

  -- Writing a row that belongs to someone else must be impossible.
  begin
    insert into public.subjects (user_id, name) values (v_alice, 'Invasão');
  exception when insufficient_privilege then
    v_failed := true;
  end;
  assert v_failed, 'Bob was able to insert a subject owned by Alice';

  -- user_stats is client-read-only: no UPDATE policy exists.
  v_failed := false;
  begin
    update public.user_stats set xp = 999999 where user_id = auth.uid();
    if (select xp from public.user_stats where user_id = auth.uid()) = 999999 then
      v_failed := false;
    else
      v_failed := true;
    end if;
  exception when insufficient_privilege then
    v_failed := true;
  end;
  assert v_failed, 'a client was able to set its own XP';

  -- Shared catalogs stay readable.
  assert (select count(*) from public.subject_catalog) > 10, 'subject catalog not readable';
  assert (select count(*) from public.achievements) > 10, 'achievements not readable';
end;
$$;

-- Bob must be able to onboard independently.
select public.bootstrap_student(
  p_full_name => 'Bob Aluno',
  p_term_count => 3::smallint,
  p_catalog_ids => (select array_agg(id) from public.subject_catalog where slug = 'historia')
) as bob_bootstrap \gset

do $$
begin
  assert (select count(*) from public.terms) = 3, 'Bob should have 3 trimesters';
  assert (select name from public.terms where sequence = 1) = '1º Trimestre',
    'term naming should follow the term count';
  assert (select count(*) from public.subjects) = 1, 'Bob should have exactly 1 subject';
end;
$$;

-- Re-onboarding must be refused rather than duplicating a calendar.
do $$
declare
  v_failed boolean := false;
begin
  begin
    perform public.bootstrap_student(p_full_name => 'Bob de novo');
  exception when unique_violation then
    v_failed := true;
  end;
  assert v_failed, 'bootstrap_student must refuse to run twice';
end;
$$;

reset role;

-- --------------------------------------------------- 7 · RLS everywhere ----
-- A table added later without RLS is a silent data leak, so assert the
-- invariant instead of trusting review.
do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ') into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  assert v_missing is null, format('tables without RLS enabled: %s', v_missing);
end;
$$;

-- Every view that touches user data must be security_invoker.
do $$
declare
  v_bad text;
begin
  select string_agg(c.relname, ', ') into v_bad
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
    and not coalesce(
      (select option_value::boolean
       from pg_options_to_table(c.reloptions)
       where option_name = 'security_invoker'), false);

  assert v_bad is null, format('views missing security_invoker: %s', v_bad);
end;
$$;

\echo '✓ 10_scoring.test.sql — all assertions passed'
