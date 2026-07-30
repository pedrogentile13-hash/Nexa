-- ============================================================================
-- Nexa — SQL suite: onboarding, grade math, RLS isolation, gamification.
--
-- Runs as the `authenticated` role (never as the superuser) so RLS is actually
-- exercised: as table owner, Postgres would skip every policy and the suite
-- would prove nothing.
--
-- The centrepiece is the worked example from README Parte 2:
--   Lista 1 · nota 8 · peso 2
--   Lista 2 · nota 10 · peso 1
--   Prova   · nota 6 · peso 7
--   → média da categoria = (8·2 + 10·1 + 6·7) / 10 = 6,8
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
  v_cats integer;
  v_links integer;
  v_routines integer;
begin
  select count(*) into v_terms from public.terms;
  select count(*) into v_subjects from public.subjects;
  select count(*) into v_cats from public.grading_scheme_categories;
  select count(*) into v_links from public.subject_terms;
  select count(*) into v_routines from public.routines;

  assert v_terms = 4, format('expected 4 terms, got %s', v_terms);
  assert v_subjects = 3, format('expected 3 subjects, got %s', v_subjects);
  assert v_cats = 3, format('expected 3 categories, got %s', v_cats);
  -- 3 subjects × 4 terms
  assert v_links = 12, format('expected 12 subject_terms, got %s', v_links);
  assert v_routines = 3, format('expected 3 starter routines, got %s', v_routines);

  assert (select onboarded_at is not null from public.profiles
          where id = auth.uid()), 'onboarded_at was not stamped';
  assert (select count(*) = 1 from public.grading_schemes where is_default),
    'exactly one default scheme expected';
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

-- ----------------------------------- 2 · README worked example → PB = 6,8 --
do $$
declare
  v_st uuid;
  v_pb uuid;
  v_avg numeric;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Matemática' and t.sequence = 1;

  select id into v_pb from public.grading_scheme_categories where short_code = 'PB';

  insert into public.activities (user_id, subject_term_id, category_id, title, score, weight, graded_at)
  values
    (auth.uid(), v_st, v_pb, 'Lista 1', 8, 2, '2026-02-20'),
    (auth.uid(), v_st, v_pb, 'Lista 2', 10, 1, '2026-03-05'),
    (auth.uid(), v_st, v_pb, 'Prova', 6, 7, '2026-03-20');

  select average into v_avg
  from public.v_category_averages
  where subject_term_id = v_st and category_id = v_pb;

  assert v_avg = 6.8, format('README example: expected 6.8, got %s', v_avg);

  assert (select counted_count from public.v_category_averages
          where subject_term_id = v_st and category_id = v_pb) = 3,
    'all three activities should count';
end;
$$;

-- --------------------------------------------- 3 · partial-term coverage ---
-- Only PB posted (35 of 100): the current average must BE the PB average, not a
-- pessimistic third of it, and coverage must say 35%.
do $$
declare
  v_st uuid;
  v_row record;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Matemática' and t.sequence = 1;

  select * into v_row from public.v_subject_term_averages where subject_term_id = v_st;

  assert v_row.average_current = 6.8,
    format('partial average should equal the only graded category, got %s', v_row.average_current);
  assert round(v_row.coverage_percent, 4) = 35.0000,
    format('coverage should be 35%%, got %s', v_row.coverage_percent);
  assert v_row.final_grade = 6.8, 'final_grade should follow average_current';
  assert v_row.is_below_passing = false,
    format('6.8 with passing_grade 6 must not be flagged below passing (got %s)',
           v_row.is_below_passing);
end;
$$;

-- --------------------------------------- 4 · final average across categories --
-- PB 6,8 (35%) · VA 7,0 (35%) · QL 9,0 (30%)
--   → (6.8·35 + 7·35 + 9·30) / 100 = 7.53
do $$
declare
  v_st uuid;
  v_va uuid;
  v_ql uuid;
  v_row record;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Matemática' and t.sequence = 1;

  select id into v_va from public.grading_scheme_categories where short_code = 'VA';
  select id into v_ql from public.grading_scheme_categories where short_code = 'QL';

  insert into public.activities (user_id, subject_term_id, category_id, title, score, weight)
  values
    (auth.uid(), v_st, v_va, 'VA 1', 7, 1),
    (auth.uid(), v_st, v_ql, 'Participação', 9, 1);

  select * into v_row from public.v_subject_term_averages where subject_term_id = v_st;

  assert v_row.average_current = 7.53,
    format('final average: expected 7.53, got %s', v_row.average_current);
  assert round(v_row.coverage_percent, 4) = 100.0000,
    format('coverage should be 100%%, got %s', v_row.coverage_percent);
  assert v_row.graded_category_count = 3, 'all three categories graded';
end;
$$;

-- ------------------------------------------ 5 · scale normalization (max_score) --
-- A test worth 20 points scored 18 must count as 9,0 on a 0–10 scheme.
do $$
declare
  v_st uuid;
  v_va uuid;
  v_avg numeric;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Química' and t.sequence = 1;

  select id into v_va from public.grading_scheme_categories where short_code = 'VA';

  insert into public.activities (user_id, subject_term_id, category_id, title, score, max_score, weight)
  values (auth.uid(), v_st, v_va, 'Prova de 20 pontos', 18, 20, 1);

  select average into v_avg
  from public.v_category_averages where subject_term_id = v_st and category_id = v_va;

  assert v_avg = 9, format('18/20 should normalize to 9 on a 0-10 scale, got %s', v_avg);
end;
$$;

-- ----------------------------------------------------- 6 · drop_lowest rule --
do $$
declare
  v_st uuid;
  v_pb uuid;
  v_avg numeric;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Química' and t.sequence = 2;

  select id into v_pb from public.grading_scheme_categories where short_code = 'PB';

  insert into public.activities (user_id, subject_term_id, category_id, title, score, weight)
  values
    (auth.uid(), v_st, v_pb, 'Lista A', 4, 1),
    (auth.uid(), v_st, v_pb, 'Lista B', 8, 1),
    (auth.uid(), v_st, v_pb, 'Lista C', 9, 1);

  -- All three counted: (4 + 8 + 9) / 3 = 7
  select average into v_avg from public.v_category_averages
  where subject_term_id = v_st and category_id = v_pb;
  assert v_avg = 7, format('expected 7 before drop_lowest, got %s', v_avg);

  update public.grading_scheme_categories set drop_lowest = 1 where id = v_pb;

  -- Lowest (4) dropped: (8 + 9) / 2 = 8.5
  select average into v_avg from public.v_category_averages
  where subject_term_id = v_st and category_id = v_pb;
  assert v_avg = 8.5, format('expected 8.5 after drop_lowest=1, got %s', v_avg);

  assert (select counted_count from public.v_category_averages
          where subject_term_id = v_st and category_id = v_pb) = 2,
    'drop_lowest should leave 2 counted activities';

  update public.grading_scheme_categories set drop_lowest = 0 where id = v_pb;
end;
$$;

-- ------------------------------------------------------- 7 · substitutiva ---
-- A graded replacement retires the activity it replaces.
do $$
declare
  v_st uuid;
  v_pb uuid;
  v_original uuid;
  v_avg numeric;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Química' and t.sequence = 3;

  select id into v_pb from public.grading_scheme_categories where short_code = 'PB';

  insert into public.activities (user_id, subject_term_id, category_id, title, score, weight)
  values (auth.uid(), v_st, v_pb, 'Prova original', 3, 1)
  returning id into v_original;

  select average into v_avg from public.v_category_averages
  where subject_term_id = v_st and category_id = v_pb;
  assert v_avg = 3, format('expected 3 before substitutiva, got %s', v_avg);

  insert into public.activities
    (user_id, subject_term_id, category_id, title, score, weight, replaces_activity_id)
  values (auth.uid(), v_st, v_pb, 'Substitutiva', 8, 1, v_original);

  select average into v_avg from public.v_category_averages
  where subject_term_id = v_st and category_id = v_pb;
  assert v_avg = 8, format('substitutiva should replace the 3 with an 8, got %s', v_avg);

  assert (select is_counted from public.v_activities_effective where id = v_original) = false,
    'the replaced activity must stop counting';
end;
$$;

-- ------------------------------ 8 · weights that do not total 100 normalize --
do $$
declare
  v_st uuid;
  v_row record;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Matemática' and t.sequence = 1;

  -- PB 40 · VA 40 · QL 30 = 110
  update public.grading_scheme_categories set weight_percent = 40 where short_code in ('PB', 'VA');

  select * into v_row from public.v_subject_term_averages where subject_term_id = v_st;

  -- (6.8·40 + 7·40 + 9·30) / 110 = 822 / 110 = 7.4727…
  assert round(v_row.average_current, 4) = 7.4727,
    format('weights summing to 110 must normalize; expected 7.4727, got %s',
           round(v_row.average_current, 4));
  assert round(v_row.weight_total, 2) = 110.00, 'weight_total should report the real sum';

  update public.grading_scheme_categories set weight_percent = 35 where short_code in ('PB', 'VA');
end;
$$;

-- --------------------------------------- 9 · final_grade_override wins -----
do $$
declare
  v_st uuid;
  v_row record;
begin
  select st.id into v_st
  from public.subject_terms st
  join public.subjects s on s.id = st.subject_id
  join public.terms t on t.id = st.term_id
  where s.name = 'Matemática' and t.sequence = 1;

  update public.subject_terms set final_grade_override = 8.0 where id = v_st;
  select * into v_row from public.v_subject_term_averages where subject_term_id = v_st;

  assert v_row.final_grade = 8.0, format('override should win, got %s', v_row.final_grade);
  assert v_row.average_current = 7.53, 'computed average must remain visible alongside the override';
  assert v_row.is_overridden, 'is_overridden flag not set';

  update public.subject_terms set final_grade_override = null where id = v_st;
end;
$$;

-- ------------------------------------- 10 · category ↔ scheme integrity ----
do $$
declare
  v_st uuid;
  v_foreign_cat uuid;
  v_other_scheme uuid;
  v_failed boolean := false;
begin
  select st.id into v_st from public.subject_terms st limit 1;

  insert into public.grading_schemes (user_id, name) values (auth.uid(), 'Outro modelo')
  returning id into v_other_scheme;

  insert into public.grading_scheme_categories (user_id, scheme_id, name, weight_percent, sequence)
  values (auth.uid(), v_other_scheme, 'Categoria alheia', 100, 1)
  returning id into v_foreign_cat;

  begin
    insert into public.activities (user_id, subject_term_id, category_id, title, score)
    values (auth.uid(), v_st, v_foreign_cat, 'Nota fora do esquema', 10);
  exception when check_violation then
    v_failed := true;
  end;

  assert v_failed, 'an activity pointing at another scheme''s category must be rejected';

  delete from public.grading_schemes where id = v_other_scheme;
end;
$$;

-- ------------------------------------------- 11 · one running timer only ---
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

  assert (select total_study_seconds from public.user_stats where user_id = auth.uid()) = 1800,
    'sync_study_total did not roll the session into user_stats';
end;
$$;

-- --------------------------------------------- 12 · XP idempotency ---------
do $$
declare
  v_task uuid;
  v_first integer;
  v_second integer;
begin
  insert into public.tasks (user_id, title) values (auth.uid(), 'Tarefa de teste')
  returning id into v_task;

  v_first := public.award_xp(10, 'Tarefa concluída', 'task', v_task);
  v_second := public.award_xp(10, 'Tarefa concluída', 'task', v_task);

  assert v_first = 10, format('first award should grant 10, got %s', v_first);
  assert v_second = 0, format('re-awarding the same source must grant 0, got %s', v_second);
  assert (select xp from public.user_stats where user_id = auth.uid()) = 60,
    'XP total should be 50 (onboarding) + 10 (task)';
end;
$$;

-- --------------------------------------------------- 13 · streak + freeze --
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

-- ---------------------------------------------------- 14 · RLS isolation ---
set "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
set role authenticated;

do $$
declare
  v_failed boolean := false;
  v_alice uuid := '11111111-1111-1111-1111-111111111111';
begin
  assert (select count(*) from public.subjects) = 0, 'Bob can see Alice''s subjects';
  assert (select count(*) from public.activities) = 0, 'Bob can see Alice''s activities';
  assert (select count(*) from public.terms) = 0, 'Bob can see Alice''s terms';
  assert (select count(*) from public.tasks) = 0, 'Bob can see Alice''s tasks';
  assert (select count(*) from public.study_sessions) = 0, 'Bob can see Alice''s study sessions';
  assert (select count(*) from public.profiles) = 1, 'Bob can see other profiles';

  -- The views are the dangerous part: without security_invoker they would run
  -- as their owner and leak every student's grades.
  assert (select count(*) from public.v_activities_effective) = 0,
    'v_activities_effective leaks across users';
  assert (select count(*) from public.v_category_averages) = 0,
    'v_category_averages leaks across users';
  assert (select count(*) from public.v_subject_term_averages) = 0,
    'v_subject_term_averages leaks across users';
  assert (select count(*) from public.v_term_summary) = 0,
    'v_term_summary leaks across users';
  assert (select count(*) from public.user_stats) = 1, 'user_stats leaks across users';
  assert (select count(*) from public.xp_events) = 0, 'xp_events leaks across users';

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
    -- An UPDATE with no matching policy affects 0 rows rather than erroring.
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
  assert (select count(*) from public.subject_terms) = 3, 'Bob should have 1 × 3 subject_terms';
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

-- --------------------------------------------------- 15 · RLS everywhere ---
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

\echo '✓ 10_grading.test.sql — all assertions passed'
