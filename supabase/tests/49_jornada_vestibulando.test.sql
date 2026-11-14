-- ============================================================================
-- Nexa Vestibular — Fase 4: a jornada escolhida na criação da conta.
--
-- O que esta suíte existe para impedir, em ordem de gravidade:
--   1. O bootstrap do vestibulando criar as coisas do aluno de escola (ano
--      letivo, bimestres). Se cair, o vestibulando abre o app com um boletim
--      dividido em bimestres que ele nunca vai usar.
--   2. O bootstrap do ALUNO DE ESCOLA mudar. É a regressão cara desta fase —
--      o caminho que já funciona não pode ter sido tocado.
--   3. Jornada de um vazar/ser alterada por outro.
--   4. `save_vestibular_profile` apagar campo que a tela não mandou.
-- ============================================================================

\set VEST '11111111-5555-5555-5555-555555555550'
\set ESCOLA '11111111-5555-5555-5555-555555555551'
\set AMBOS '11111111-5555-5555-5555-555555555552'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'VEST', 'vestibulando@nexa.test', '{"full_name": "Vestibulando"}'),
  (:'ESCOLA', 'escolar@nexa.test', '{"full_name": "Escolar"}'),
  (:'AMBOS', 'ambos@nexa.test', '{"full_name": "Ambos"}');

-- O trigger de auth já cria `profiles`; o bootstrap precisa de `onboarded_at`
-- nulo pra rodar, que é o estado de quem acabou de criar a conta.
update public.profiles set onboarded_at = null
where id in (:'VEST', :'ESCOLA', :'AMBOS');

select id from public.exams where slug = 'enem' \gset enem_
select set_config('nexa.enem', :'enem_id', false);

-- ============================================================================
-- 1 · Jornada padrão é 'school' — ninguém vira vestibulando por acidente.
-- ============================================================================
do $$
declare
  v_journey text;
begin
  select journey into v_journey from public.profiles where id = '11111111-5555-5555-5555-555555555551';
  assert v_journey = 'school',
    format('a jornada padrão tem que ser school (senão contas antigas mudariam de app sozinhas), veio %s', v_journey);
end;
$$;

-- ============================================================================
-- 2 · Bootstrap do vestibulando: perfil, matérias, objetivo, rotina —
--     e NADA de ano letivo/bimestre.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555550'; -- VEST
set role authenticated;

select public.bootstrap_vestibular_student(
  'Vestibulando Silva',
  current_setting('nexa.enem')::uuid,
  2027,
  'America/Sao_Paulo',
  180,
  '{}',
  'Medicina',
  'USP',
  6,
  true,
  'cursinho'
);

reset role;

do $$
declare
  v_journey text;
  v_years integer;
  v_terms integer;
  v_subjects integer;
  v_routines integer;
  v_goal integer;
begin
  select journey, daily_study_goal_minutes into v_journey, v_goal
  from public.profiles where id = '11111111-5555-5555-5555-555555555550';
  assert v_journey = 'vestibular', format('a jornada deveria ser vestibular, veio %s', v_journey);
  assert v_goal = 180, format('a meta diária deveria ser 180, veio %s', v_goal);

  select count(*) into v_years from public.academic_years where user_id = '11111111-5555-5555-5555-555555555550';
  assert v_years = 0,
    format('o vestibulando não tem ano letivo, mas o bootstrap criou %s', v_years);

  select count(*) into v_terms from public.terms where user_id = '11111111-5555-5555-5555-555555555550';
  assert v_terms = 0, format('o vestibulando não tem bimestre, mas o bootstrap criou %s', v_terms);

  select count(*) into v_subjects from public.subjects where user_id = '11111111-5555-5555-5555-555555555550';
  assert v_subjects > 0, 'sem catálogo escolhido, o vestibulando deveria receber as matérias ativas';

  select count(*) into v_routines from public.routines where user_id = '11111111-5555-5555-5555-555555555550';
  assert v_routines = 3, format('a rotina inicial tem 3 itens, veio %s', v_routines);

  -- E a rotina fala a língua certa: nada de mochila.
  select count(*) into v_routines from public.routines
  where user_id = '11111111-5555-5555-5555-555555555550' and title ilike '%mochila%';
  assert v_routines = 0, 'a rotina do vestibulando veio com o checklist escolar (mochila)';
end;
$$;

-- Perfil de vestibular e objetivo ficaram gravados.
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555550';
set role authenticated;

do $$
declare
  v_course text;
  v_inst text;
  v_finished boolean;
  v_context text;
  v_days smallint;
  v_targets integer;
begin
  select target_course, target_institution, finished_high_school, prep_context, study_days_per_week
    into v_course, v_inst, v_finished, v_context, v_days
  from public.get_vestibular_profile();

  assert v_course = 'Medicina', format('curso-alvo veio %s', coalesce(v_course, 'null'));
  assert v_inst = 'USP', format('instituição veio %s', coalesce(v_inst, 'null'));
  assert v_finished, 'quem já terminou o ensino médio foi gravado como se não tivesse';
  assert v_context = 'cursinho', format('contexto de preparo veio %s', coalesce(v_context, 'null'));
  assert v_days = 6, format('dias por semana veio %s', v_days);

  select count(*) into v_targets from public.list_exam_targets();
  assert v_targets = 1, format('o bootstrap deveria ter criado 1 objetivo, criou %s', v_targets);
end;
$$;

-- ============================================================================
-- 3 · `save_vestibular_profile` não apaga o que a tela não mandou.
-- ============================================================================
select public.save_vestibular_profile(
  current_setting('nexa.enem')::uuid, 2027, null, 90
);

do $$
declare
  v_course text;
  v_minutes integer;
begin
  select target_course, daily_study_minutes into v_course, v_minutes
  from public.get_vestibular_profile();

  assert v_minutes = 90, format('a rotina deveria ter mudado pra 90, veio %s', v_minutes);
  assert v_course = 'Medicina',
    'salvar só a rotina apagou o curso-alvo — um formulário parcial não pode zerar campo que não editou';
end;
$$;

-- ============================================================================
-- 4 · A home do vestibulando responde de uma vez só, com o dado certo.
-- ============================================================================
do $$
declare
  v_name text;
  v_exam text;
  v_course text;
  v_streak integer;
begin
  select full_name, exam_name, target_course, streak_days
    into v_name, v_exam, v_course, v_streak
  from public.vestibular_home();

  assert v_name = 'Vestibulando Silva', format('nome veio %s', coalesce(v_name, 'null'));
  assert v_exam = 'ENEM', format('prova-alvo veio %s', coalesce(v_exam, 'null'));
  assert v_course = 'Medicina', format('curso-alvo veio %s', coalesce(v_course, 'null'));
  assert v_streak is not null, 'a sequência deveria vir 0, não nulo';
end;
$$;

reset role;

-- ============================================================================
-- 5 · REGRESSÃO: o bootstrap do aluno de escola continua igual.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555551'; -- ESCOLA
set role authenticated;

select public.bootstrap_student('Escolar Souza', '9º ano');

reset role;

do $$
declare
  v_journey text;
  v_years integer;
  v_terms integer;
  v_routines integer;
begin
  select journey into v_journey from public.profiles where id = '11111111-5555-5555-5555-555555555551';
  assert v_journey = 'school',
    format('o aluno de escola tem que continuar school, veio %s', v_journey);

  select count(*) into v_years from public.academic_years where user_id = '11111111-5555-5555-5555-555555555551';
  assert v_years = 1, format('o aluno de escola tem 1 ano letivo, veio %s', v_years);

  select count(*) into v_terms from public.terms where user_id = '11111111-5555-5555-5555-555555555551';
  assert v_terms = 4, format('o aluno de escola tem 4 bimestres, veio %s', v_terms);

  select count(*) into v_routines from public.routines
  where user_id = '11111111-5555-5555-5555-555555555551' and title ilike '%mochila%';
  assert v_routines = 1, 'o checklist escolar sumiu — o caminho da escola foi alterado por esta fase';
end;
$$;

-- ============================================================================
-- 6 · 'both': quem está na escola E se prepara tem os dois.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555552'; -- AMBOS
set role authenticated;

select public.bootstrap_vestibular_student(
  'Ambos Costa',
  current_setting('nexa.enem')::uuid,
  2026,
  'America/Sao_Paulo',
  90,
  '{}',
  null, null, null, false, 'escola',
  '3ª série EM',
  true
);

reset role;

do $$
declare
  v_journey text;
  v_grade text;
begin
  select journey, grade_level into v_journey, v_grade
  from public.profiles where id = '11111111-5555-5555-5555-555555555552';
  assert v_journey = 'both', format('a jornada deveria ser both, veio %s', v_journey);
  assert v_grade = '3ª série EM', format('a série deveria ter sido guardada, veio %s', coalesce(v_grade, 'null'));
end;
$$;

-- ============================================================================
-- 7 · Trocar de jornada: só a própria, e só pra valor válido.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555551'; -- ESCOLA
set role authenticated;

select public.set_journey('both');

do $$
declare
  v_journey text;
  v_aceitou boolean := false;
begin
  select journey into v_journey from public.profiles where id = '11111111-5555-5555-5555-555555555551';
  assert v_journey = 'both', format('a troca de jornada não pegou, ficou %s', v_journey);

  begin
    perform public.set_journey('astronauta');
    v_aceitou := true;
  exception when others then
    null;
  end;
  assert not v_aceitou, 'set_journey aceitou uma jornada que não existe';
end;
$$;

reset role;

-- Trocar a própria jornada não toca na de mais ninguém. Lido sem `role
-- authenticated`: sob RLS, um aluno nem enxerga a linha do outro, e o select
-- voltaria vazio por falta de permissão em vez de provar o que interessa.
do $$
declare
  v_outro text;
begin
  select journey into v_outro from public.profiles where id = '11111111-5555-5555-5555-555555555550';
  assert v_outro = 'vestibular',
    format('a jornada do VEST mudou quando o ESCOLA trocou a dele, virou %s', v_outro);
end;
$$;

-- ============================================================================
-- 8 · Flag desligada bloqueia virar vestibulando.
-- ============================================================================
update public.feature_flags set enabled = false where key = 'vestibular_enabled';

set "request.jwt.claim.sub" = '11111111-5555-5555-5555-555555555551';
set role authenticated;

do $$
declare
  v_trocou boolean := false;
begin
  begin
    perform public.set_journey('vestibular');
    v_trocou := true;
  exception when others then
    null;
  end;
  assert not v_trocou, 'virou vestibulando com vestibular_enabled desligado';
end;
$$;

-- Mas voltar pra escola continua possível — senão a flag prenderia quem já
-- tinha trocado numa área desligada.
select public.set_journey('school');

reset role;
update public.feature_flags set enabled = true where key = 'vestibular_enabled';

select 'ok' as result;
