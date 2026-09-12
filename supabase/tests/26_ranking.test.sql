-- ============================================================================
-- Nexa — suíte SQL: motor de conquistas (check_achievements) e ranking de XP.
--
-- O que esta suíte existe para impedir:
--   1. `check_achievements` pagar o xp_reward de uma conquista mais de uma
--      vez (o bug de recursão que este motor teve durante o desenvolvimento —
--      `achievement_id` é slug, não uuid, então não cabe em
--      `xp_events.source_id` e a deduplicação normal de `award_xp` não
--      enxerga essas linhas).
--   2. `school_ranking` deixar um aluno ver ranking de outra escola, mesmo
--      forjando `p_school_id`.
--   3. `school_ranking` ranquear alunos de escolas diferentes juntos.
-- ============================================================================

\set ESCOLA_X '88888888-0000-0000-0000-000000000001'
\set ESCOLA_Y '88888888-0000-0000-0000-000000000002'
\set CARLOS   '99999999-9999-9999-9999-999999999901'
\set DIANA    '99999999-9999-9999-9999-999999999902'
\set ERIC     '99999999-9999-9999-9999-999999999903'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'CARLOS', 'carlos-ranking@nexa.test', '{"full_name": "Carlos Ranking"}'),
  (:'DIANA', 'diana-ranking@nexa.test', '{"full_name": "Diana Ranking"}'),
  (:'ERIC', 'eric-ranking@nexa.test', '{"full_name": "Eric Ranking"}');

insert into public.schools (id, name, city, state, is_verified) values
  (:'ESCOLA_X', 'Escola X (ranking fixture)', 'São Paulo', 'SP', true),
  (:'ESCOLA_Y', 'Escola Y (ranking fixture)', 'São Paulo', 'SP', true);

insert into public.classes (id, school_id, name) values
  ('99990000-0000-0000-0000-00000000ca9a', :'ESCOLA_X', '9A'),
  ('99990000-0000-0000-0000-00000000ca9b', :'ESCOLA_X', '9B'),
  ('99990000-0000-0000-0000-00000000ca9c', :'ESCOLA_Y', '9A');

\set TURMA_X9A '99990000-0000-0000-0000-00000000ca9a'
\set TURMA_X9B '99990000-0000-0000-0000-00000000ca9b'

update public.profiles set school_id = :'ESCOLA_X', class_id = :'TURMA_X9A' where id = :'CARLOS';
update public.profiles set school_id = :'ESCOLA_X', class_id = :'TURMA_X9B' where id = :'DIANA';
update public.profiles set school_id = :'ESCOLA_Y', class_id = '99990000-0000-0000-0000-00000000ca9c' where id = :'ERIC';

-- ============================================================================
-- 1 · check_achievements não paga xp_reward duas vezes (regressão da recursão)
-- ============================================================================
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999901'; -- CARLOS
set role authenticated;

do $$
declare
  v_task uuid;
  v_xp_depois_1a_chamada bigint;
  v_xp_depois_2a_chamada bigint;
  v_eventos_achievement integer;
begin
  insert into public.tasks (user_id, title) values (auth.uid(), 'Tarefa 1')
  returning id into v_task;
  perform public.award_xp(10, 'Tarefa concluída', 'task', v_task);

  select xp into v_xp_depois_1a_chamada from public.user_stats where user_id = auth.uid();

  -- Rodar de novo manualmente não deveria mudar nada — nem re-pagar uma
  -- conquista já desbloqueada, nem entrar em loop.
  perform public.check_achievements(auth.uid());
  perform public.check_achievements(auth.uid());

  select xp into v_xp_depois_2a_chamada from public.user_stats where user_id = auth.uid();

  assert v_xp_depois_2a_chamada = v_xp_depois_1a_chamada,
    format('check_achievements repetido mudou o XP: %s -> %s',
      v_xp_depois_1a_chamada, v_xp_depois_2a_chamada);

  select count(*) into v_eventos_achievement
  from public.xp_events where user_id = auth.uid() and source_type = 'achievement' and reason = 'Nada esquecido';
  assert v_eventos_achievement <= 1,
    format('conquista "Nada esquecido" pagou xp_reward %s vezes', v_eventos_achievement);
end;
$$;

reset role;

-- ============================================================================
-- 2 · school_ranking nunca deixa um aluno escolher outra escola
-- ============================================================================
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999901'; -- CARLOS (escola X)
set role authenticated;

do $$
declare
  v_linhas integer;
  v_outra_escola record;
begin
  -- Mesmo mandando a escola Y (forjada), a RPC ignora e usa a própria (X).
  select count(*) into v_linhas
  from public.school_ranking('escola', null, 'geral', '88888888-0000-0000-0000-000000000002'::uuid);

  -- Só CARLOS e DIANA são da escola X — ERIC (escola Y) não pode aparecer.
  assert v_linhas = 2, format('esperado 2 alunos da escola X, veio %s', v_linhas);

  select count(*) into v_linhas
  from public.school_ranking('escola', null, 'geral', null)
  where user_id = '99999999-9999-9999-9999-999999999903'; -- ERIC
  assert v_linhas = 0, 'aluno da escola X conseguiu ver aluno da escola Y no ranking';
end;
$$;

reset role;

-- ============================================================================
-- 3 · filtro de turma agrupa só quem tem o mesmo class_name na mesma escola
-- ============================================================================
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999901'; -- CARLOS, turma 9A
set role authenticated;

do $$
declare
  v_linhas integer;
begin
  select count(*) into v_linhas from public.school_ranking(
    'turma', '99990000-0000-0000-0000-00000000ca9a'::uuid, 'geral', null);
  assert v_linhas = 1, format('esperado só CARLOS na turma 9A da escola X, veio %s', v_linhas);

  select count(*) into v_linhas from public.school_ranking(
    'turma', '99990000-0000-0000-0000-00000000ca9b'::uuid, 'geral', null);
  assert v_linhas = 1, format('esperado só DIANA na turma 9B, veio %s', v_linhas);
end;
$$;

reset role;

-- ============================================================================
-- 4 · ranking_evolution devolve uma linha por dia, escopada à própria escola
-- ============================================================================
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999901'; -- CARLOS
set role authenticated;

do $$
declare
  v_dias integer;
begin
  select count(*) into v_dias from public.ranking_evolution(auth.uid(), 7);
  assert v_dias = 7, format('esperado 7 dias de série, veio %s', v_dias);
end;
$$;

reset role;

-- ============================================================================
-- 5 · student_profile_card só abre pra quem é da mesma escola
-- ============================================================================
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999901'; -- CARLOS (escola X)
set role authenticated;

do $$
declare
  v_card jsonb;
  v_falhou boolean := false;
begin
  -- Colega da mesma escola: ok.
  v_card := public.student_profile_card('99999999-9999-9999-9999-999999999902'); -- DIANA
  assert v_card is not null and v_card ->> 'fullName' is not null,
    'CARLOS não conseguiu ler o cartão de DIANA (mesma escola)';

  -- Aluno de outra escola: recusado.
  begin
    perform public.student_profile_card('99999999-9999-9999-9999-999999999903'); -- ERIC (escola Y)
    v_falhou := true;
  exception when others then
    null; -- esperado
  end;
  assert not v_falhou, 'CARLOS conseguiu ler o cartão de um aluno de outra escola';
end;
$$;

reset role;

select 'ok' as result;
