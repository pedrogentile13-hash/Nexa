-- ============================================================================
-- Nexa — 0910 (2) · Ranking de XP + motor de conquistas
--
-- Duas peças que só fazem sentido juntas:
--
--  1. `achievements`/`user_achievements` já existiam (14 linhas reais em
--     seed.sql) mas NADA nunca escrevia `unlocked_at` — nenhum trigger, cron
--     ou RPC avaliava `metric`/`threshold` contra atividade real. Todo aluno
--     via 14 conquistas permanentemente bloqueadas. `check_achievements()`
--     fecha essa lacuna, chamada ao final de `award_xp`/`touch_streak` — as
--     duas funções que TODA ação que "conta" já invoca hoje, então nenhum
--     call site em TypeScript precisa mudar.
--
--  2. Ranking de XP por escola/turma, computado ao vivo — sem tabela espelho
--     nova. `user_stats` já tem xp/level/streak; `xp_events` (ledger
--     completo) dá o XP por período; `quiz_answers`/`quiz_attempts`/
--     `resource_progress` dão as contagens. Duplicar isso numa tabela
--     `ranking` própria criaria um segundo lugar pra dessincronizar.
--
-- `first_grade`/`ten_grades` (métrica `grades_logged`) ficam inativas: nota
-- manual não existe mais desde a automatização do boletim (migração
-- 20260907000300) — não há mais o que "logar".
-- ============================================================================

-- ------------------------------------------------------------- rarity ------
alter table public.achievements
  add column if not exists rarity text not null default 'comum'
    check (rarity in ('comum', 'rara', 'epica', 'lendaria'));

update public.achievements set rarity = 'comum'
  where id in ('first_steps', 'first_session', 'checklist_day', 'first_grade');
update public.achievements set rarity = 'rara'
  where id in ('streak_7', 'study_10h', 'checklist_week', 'tasks_25', 'goal_reached', 'ten_grades');
update public.achievements set rarity = 'epica'
  where id in ('streak_30', 'study_50h', 'all_passing');

comment on column public.achievements.rarity is
  'Selo visual da conquista — não afeta a lógica de desbloqueio, só a apresentação.';

-- `first_steps` já é pago via `award_xp(50, 'Configurou o Nexa', 'system', ...)`
-- direto na função de conclusão do onboarding (20260907000300, linha ~207) —
-- o motor de conquistas agora desbloqueia o SELO no mesmo instante (mesmo
-- sinal: onboarded_at preenchido), mas sem pagar os 50 XP de novo por cima.
update public.achievements set xp_reward = 0 where id = 'first_steps';

-- Nota manual não existe mais (boletim é 100% automático) — não há como
-- "logar uma nota" hoje, então essas duas param de valer para novos alunos.
-- Quem já as tinha desbloqueado mantém (histórico não se apaga).
update public.achievements set is_active = false
  where id in ('first_grade', 'ten_grades');

-- Conquistas novas do pedido do usuário, com dado real disponível hoje.
insert into public.achievements (id, name, description, icon, category, metric, threshold, xp_reward, rarity, sort_order)
values
  ('first_simulado',       'Primeiro simulado',   'Você terminou seu primeiro simulado.',              'clipboard-check', 'estudo', 'simulados_done',     1,  100, 'comum',    150),
  ('questions_100',        '100 questões',        'Cem questões respondidas em quizzes e simulados.',  'help-circle',     'estudo', 'questions_answered', 100, 150, 'comum',    160),
  ('questions_500',        '500 questões',        'Quinhentas questões — o hábito pegou.',             'help-circle',     'estudo', 'questions_answered', 500, 400, 'rara',     170),
  ('questions_1000',       '1000 questões',       'Mil questões respondidas. Sério.',                  'help-circle',     'estudo', 'questions_answered', 1000, 800, 'epica',   180),
  ('first_subject_graded', 'Primeira matéria',    'Uma matéria já tem nota automática calculada.',     'graduation-cap',  'notas',  'subjects_graded',    1,  80,  'comum',    190),
  ('study_100h',           '100 horas de foco',   'Cem horas estudadas no Nexa.',                      'hourglass',       'estudo', 'study_minutes',      6000, 700, 'rara',    200),
  ('study_500h',           '500 horas de foco',   'Quinhentas horas. Isso é outro nível.',              'flame',           'estudo', 'study_minutes',      30000, 1500, 'lendaria', 210)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      metric = excluded.metric,
      threshold = excluded.threshold,
      xp_reward = excluded.xp_reward,
      rarity = excluded.rarity,
      sort_order = excluded.sort_order,
      is_active = true;

-- ============================================================================
-- Motor de desbloqueio
-- ============================================================================

-- Avalia toda conquista ativa contra dado real e desbloqueia as que baterem o
-- threshold. Rodar de novo para uma conquista já desbloqueada não paga XP em
-- dobro nem sobrescreve `unlocked_at` — a garantia é a transição
-- bloqueada→desbloqueada lida abaixo, não a deduplicação de `award_xp` (essa
-- não enxerga estas linhas, ver comentário mais abaixo).
create or replace function public.check_achievements(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats public.user_stats;
  v_achievement record;
  v_progress integer;
  v_questions_answered integer;
  v_simulados_done integer;
  v_subjects_graded integer;
  v_tasks_done integer;
  v_perfect_days integer;
  v_goals_reached boolean;
  v_all_passing boolean;
  v_ja_desbloqueada timestamptz;
begin
  if p_user_id is null then
    return;
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;
  if not found then
    return; -- nada pra avaliar ainda
  end if;

  select count(*) into v_questions_answered
  from public.quiz_answers qa
  join public.quiz_attempts a on a.id = qa.attempt_id
  where a.user_id = p_user_id;

  select count(*) into v_simulados_done
  from public.quiz_attempts a
  join public.resources r on r.id = a.resource_id
  where a.user_id = p_user_id and a.finished_at is not null and r.kind = 'simulado';

  select count(*) into v_tasks_done
  from public.tasks t where t.user_id = p_user_id and t.completed_at is not null;

  -- "Dia perfeito": todo hábito ativo agendado para aquele dia da semana foi
  -- concluído nele. Comparado por (dia, quantidade de rotinas daquele dia da
  -- semana) contra (dia, quantidade de rotinas concluídas naquele dia).
  select count(*) into v_perfect_days
  from (
    select rc.local_date
    from public.routine_completions rc
    join public.routines r on r.id = rc.routine_id and r.user_id = p_user_id
    group by rc.local_date
    having count(*) >= (
      select count(*) from public.routines r2
      where r2.user_id = p_user_id and r2.is_active
        and extract(dow from rc.local_date)::smallint = any (r2.days_of_week)
    )
  ) perfect;

  select
    coalesce(bool_or(s.blended_score is not null and s.target_grade is not null
      and s.blended_score >= s.target_grade), false),
    coalesce(bool_and(s.blended_score is not null and s.blended_score >= s.passing_grade)
      filter (where s.has_content), false) and count(*) filter (where s.has_content) > 0,
    count(*) filter (where s.blended_score is not null)
  into v_goals_reached, v_all_passing, v_subjects_graded
  from public.subject_scores(p_user_id) s;

  for v_achievement in
    select * from public.achievements where is_active order by sort_order
  loop
    v_progress := case v_achievement.metric
      when 'onboarded' then
        case when exists (
          select 1 from public.profiles p where p.id = p_user_id and p.onboarded_at is not null
        ) then 1 else 0 end
      when 'sessions' then (select count(*) from public.study_sessions ss where ss.user_id = p_user_id)
      when 'study_minutes' then (v_stats.total_study_seconds / 60)::integer
      when 'streak_days' then v_stats.longest_streak
      when 'perfect_days' then v_perfect_days
      when 'tasks_done' then v_tasks_done
      when 'goals_reached' then case when v_goals_reached then 1 else 0 end
      when 'all_passing' then case when v_all_passing then 1 else 0 end
      when 'simulados_done' then v_simulados_done
      when 'questions_answered' then v_questions_answered
      when 'subjects_graded' then v_subjects_graded
      else 0
    end;

    -- `achievement_id` é slug (text), não cabe em `xp_events.source_id`
    -- (uuid) — sem source_id, o índice de deduplicação de `award_xp` não
    -- enxerga esta linha, então NÃO dá pra confiar nele pra evitar pagar o
    -- xp_reward duas vezes. A garantia vem daqui: só chama `award_xp`
    -- quando a conquista está transicionando de bloqueada pra desbloqueada
    -- (ou seja, `unlocked_at` era nulo até agora) — nunca por "progresso já
    -- passou do threshold", que continuaria verdadeiro pra sempre depois.
    select ua.unlocked_at into v_ja_desbloqueada
    from public.user_achievements ua
    where ua.user_id = p_user_id and ua.achievement_id = v_achievement.id;

    insert into public.user_achievements (user_id, achievement_id, progress, unlocked_at)
    values (
      p_user_id, v_achievement.id, least(v_progress, v_achievement.threshold),
      case when v_progress >= v_achievement.threshold then now() else null end
    )
    on conflict (user_id, achievement_id) do update
    set progress = least(excluded.progress, v_achievement.threshold),
        unlocked_at = coalesce(user_achievements.unlocked_at,
          case when excluded.progress >= v_achievement.threshold then now() else null end);

    if v_ja_desbloqueada is null and v_progress >= v_achievement.threshold
       and v_achievement.xp_reward > 0 then
      perform public.award_xp(
        v_achievement.xp_reward, v_achievement.name, 'achievement', null, p_user_id
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.check_achievements(uuid) to authenticated;

-- `award_xp`/`touch_streak` redefinidas com a mesma assinatura e corpo de
-- 20260730000600_gamification.sql, só acrescentando a chamada ao motor no
-- fim. As duas chamam — não só uma — porque os pontos de chamada em
-- TypeScript disparam as duas em paralelo (`Promise.all`) e as funções SQL
-- de quiz/lição chamam `award_xp` ANTES de `touch_streak`: uma conquista de
-- sequência avaliada só dentro de `award_xp` veria o streak desatualizado
-- nesses casos. Rodar nas duas é barato (leitura, sem efeito colateral) e
-- garante que, não importa a ordem, a última a terminar sempre reavalia com
-- o dado fresco.
create or replace function public.award_xp(
  p_amount integer,
  p_reason text,
  p_source_type text default 'system',
  p_source_id uuid default null,
  p_user_id uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_today date;
begin
  if p_user_id is null then
    raise exception 'award_xp requires a user' using errcode = '28000';
  end if;
  if p_amount = 0 then
    return 0;
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);

  insert into public.xp_events (user_id, amount, reason, source_type, source_id, local_date)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id, v_today)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 0; -- already awarded for this source
  end if;

  update public.user_stats s
  set xp = greatest(0, s.xp + p_amount),
      level = public.xp_to_level(greatest(0, s.xp + p_amount))
  where s.user_id = p_user_id;

  perform public.check_achievements(p_user_id);

  return p_amount;
end;
$$;

create or replace function public.touch_streak(p_user_id uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_week date;
  v_stats public.user_stats;
  v_gap integer;
  v_new_streak integer;
  v_freezes smallint;
begin
  if p_user_id is null then
    raise exception 'touch_streak requires a user' using errcode = '28000';
  end if;

  perform public.ensure_user_stats(p_user_id);
  v_today := public.user_local_date(p_user_id);
  v_week := date_trunc('week', v_today)::date;

  select * into v_stats from public.user_stats where user_id = p_user_id for update;

  v_freezes := v_stats.streak_freezes_available;
  if v_stats.streak_freezes_granted_week is null or v_stats.streak_freezes_granted_week < v_week then
    v_freezes := 1;
  end if;

  if v_stats.last_active_local_date = v_today then
    perform public.check_achievements(p_user_id);
    return v_stats.current_streak; -- already counted today
  end if;

  if v_stats.last_active_local_date is null then
    v_new_streak := 1;
  else
    v_gap := v_today - v_stats.last_active_local_date;
    if v_gap = 1 then
      v_new_streak := v_stats.current_streak + 1;
    elsif v_gap = 2 and v_freezes > 0 then
      v_new_streak := v_stats.current_streak + 1;
      v_freezes := v_freezes - 1;
    else
      v_new_streak := 1;
    end if;
  end if;

  update public.user_stats
  set current_streak = v_new_streak,
      longest_streak = greatest(longest_streak, v_new_streak),
      last_active_local_date = v_today,
      streak_freezes_available = v_freezes,
      streak_freezes_granted_week = v_week
  where user_id = p_user_id;

  perform public.check_achievements(p_user_id);

  return v_new_streak;
end;
$$;

-- ============================================================================
-- Ranking
-- ============================================================================

-- Quem chama sem ser admin geral nunca escolhe a escola: sempre a própria.
-- Mesmo cuidado de `resolveSchoolId` (TypeScript) espelhado em SQL.
create or replace function public.school_ranking(
  p_scope text default 'escola',       -- 'escola' | 'turma'
  p_class_name text default null,
  p_period text default 'geral',       -- 'hoje' | 'semana' | 'mes' | 'geral'
  p_school_id uuid default null
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  class_name text,
  xp bigint,
  level smallint,
  current_streak integer,
  questions_answered integer,
  study_hours numeric,
  rank bigint,
  previous_rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_school_id uuid;
  v_period_start date;
  v_today date := public.user_local_date(auth.uid());
begin
  select p.role into v_caller_role from public.profiles p where p.id = auth.uid();

  if v_caller_role = 'admin' and p_school_id is not null then
    v_school_id := p_school_id;
  else
    v_school_id := public.current_school_id(auth.uid());
  end if;

  if v_school_id is null then
    return; -- sem escola vinculada, sem ranking pra mostrar
  end if;

  v_period_start := case p_period
    when 'hoje' then v_today
    when 'semana' then date_trunc('week', v_today)::date
    when 'mes' then date_trunc('month', v_today)::date
    else null -- 'geral': sem corte, usa o total acumulado
  end;

  return query
  with escopo as (
    select pr.id as user_id, pr.full_name, pr.avatar_url, pr.class_name
    from public.profiles pr
    where pr.school_id = v_school_id
      and pr.role = 'student'
      and (p_scope <> 'turma' or pr.class_name = p_class_name)
  ),
  xp_no_periodo as (
    select e.user_id, sum(e.amount) as ganho
    from public.xp_events e
    where v_period_start is not null and e.local_date >= v_period_start
    group by e.user_id
  ),
  xp_total as (
    select us.user_id, us.xp, us.level, us.current_streak, us.total_study_seconds
    from public.user_stats us
    where us.user_id in (select escopo.user_id from escopo)
  ),
  atual as (
    select
      esc.user_id, esc.full_name, esc.avatar_url, esc.class_name,
      coalesce(case when v_period_start is null then xt.xp else xnp.ganho end, 0)::bigint as xp,
      coalesce(xt.level, 1) as level,
      coalesce(xt.current_streak, 0) as current_streak,
      coalesce(xt.total_study_seconds, 0) as total_study_seconds
    from escopo esc
    left join xp_total xt on xt.user_id = esc.user_id
    left join xp_no_periodo xnp on xnp.user_id = esc.user_id
  ),
  -- XP no início do período: total de hoje menos o que foi ganho DENTRO do
  -- período — dá pra reconstruir o ranking "de antes" sem guardar snapshot.
  antes as (
    select a.user_id, greatest(0, coalesce(xt.xp, 0) - coalesce(xnp.ganho, 0)) as xp_antes
    from atual a
    left join xp_total xt on xt.user_id = a.user_id
    left join xp_no_periodo xnp on xnp.user_id = a.user_id
    where v_period_start is not null
  ),
  ranked_atual as (
    select a.*, rank() over (order by a.xp desc) as rk
    from atual a
  ),
  ranked_antes as (
    select an.user_id, rank() over (order by an.xp_antes desc) as rk
    from antes an
  ),
  contagens as (
    select
      qat.user_id,
      count(*) as questions_answered
    from public.quiz_answers qa
    join public.quiz_attempts qat on qat.id = qa.attempt_id
    where qat.user_id in (select escopo.user_id from escopo)
    group by qat.user_id
  )
  select
    r.user_id, r.full_name, r.avatar_url, r.class_name, r.xp, r.level::smallint,
    r.current_streak, coalesce(c.questions_answered, 0)::integer,
    round(r.total_study_seconds / 3600.0, 1),
    r.rk, ra.rk
  from ranked_atual r
  left join contagens c on c.user_id = r.user_id
  left join ranked_antes ra on ra.user_id = r.user_id
  order by r.rk;
end;
$$;

grant execute on function public.school_ranking(text, text, text, uuid) to authenticated;

-- Série diária de XP acumulado (últimos p_days), pra comparar "eu" × "média
-- da escola" × "1º colocado" no gráfico de evolução.
create or replace function public.ranking_evolution(p_user_id uuid default auth.uid(), p_days integer default 30)
returns table (
  day date,
  me_xp bigint,
  school_avg_xp numeric,
  top1_xp bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school_id uuid := public.current_school_id(p_user_id);
  v_start date := public.user_local_date(p_user_id) - (greatest(p_days, 1) - 1);
begin
  if v_school_id is null then
    return;
  end if;

  return query
  with dias as (
    select generate_series(v_start, public.user_local_date(p_user_id), interval '1 day')::date as day
  ),
  alunos as (
    select id as user_id from public.profiles where school_id = v_school_id and role = 'student'
  ),
  eventos as (
    select e.user_id, e.local_date, e.amount
    from public.xp_events e
    where e.user_id in (select alunos.user_id from alunos)
  ),
  acumulado as (
    select
      a.user_id, d.day,
      coalesce(sum(e.amount) filter (where e.local_date <= d.day), 0) as xp_ate_o_dia
    from alunos a
    cross join dias d
    left join eventos e on e.user_id = a.user_id
    group by a.user_id, d.day
  )
  select
    d.day,
    coalesce(max(acumulado.xp_ate_o_dia) filter (where acumulado.user_id = p_user_id), 0)::bigint,
    round(avg(acumulado.xp_ate_o_dia), 1),
    max(acumulado.xp_ate_o_dia)::bigint
  from dias d
  join acumulado on acumulado.day = d.day
  group by d.day
  order by d.day;
end;
$$;

grant execute on function public.ranking_evolution(uuid, integer) to authenticated;

-- ============================================================================
-- Cartão de perfil do aluno (modal do ranking)
-- ============================================================================

-- `profiles` só tem policy de leitura da PRÓPRIA linha (+ admin) — nenhuma
-- policy de "colega da mesma escola pode ler". Em vez de abrir essa policy
-- (vazaria e-mail/telefone se algum dia entrarem na tabela), esta função
-- `security definer` expõe só o que o cartão precisa, e só pra quem já
-- compartilha escola (ou é admin) — mesma barreira que `school_ranking` já
-- aplica. Devolve jsonb (não uma tabela) porque o cartão tem duas listas
-- aninhadas (matérias favoritas, conquistas) — o mesmo formato que
-- `bootstrap_student` já usa para o mesmo tipo de retorno composto.
create or replace function public.student_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_caller_school uuid;
  v_target record;
  v_stats public.user_stats;
  v_result jsonb;
begin
  select p.role, p.school_id into v_caller_role, v_caller_school
  from public.profiles p where p.id = auth.uid();

  select p.full_name, p.avatar_url, p.class_name, p.school_id, s.name as school_name
  into v_target
  from public.profiles p
  left join public.schools s on s.id = p.school_id
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  if v_caller_role <> 'admin' and (v_caller_school is null or v_caller_school <> v_target.school_id) then
    raise exception 'sem acesso a este perfil' using errcode = '42501';
  end if;

  select * into v_stats from public.user_stats where user_id = p_user_id;

  select jsonb_build_object(
    'fullName', v_target.full_name,
    'avatarUrl', v_target.avatar_url,
    'className', v_target.class_name,
    'schoolName', v_target.school_name,
    'xp', coalesce(v_stats.xp, 0),
    'level', coalesce(v_stats.level, 1),
    'currentStreak', coalesce(v_stats.current_streak, 0),
    'longestStreak', coalesce(v_stats.longest_streak, 0),
    'studyHours', round(coalesce(v_stats.total_study_seconds, 0) / 3600.0, 1),
    'questionsAnswered', (
      select count(*) from public.quiz_answers qa
      join public.quiz_attempts a on a.id = qa.attempt_id
      where a.user_id = p_user_id
    ),
    'lastActivity', (
      select max(x.local_date) from public.xp_events x where x.user_id = p_user_id
    ),
    'topSubjects', coalesce((
      select jsonb_agg(jsonb_build_object('name', sub.subject_name, 'count', sub.attempts) order by sub.attempts desc)
      from (
        select s.name as subject_name, count(*) as attempts
        from public.quiz_attempts a
        join public.resources r on r.id = a.resource_id
        join public.subjects s on s.catalog_id = r.subject_catalog_id and s.user_id = p_user_id
        where a.user_id = p_user_id and a.finished_at is not null
        group by s.name
        order by count(*) desc
        limit 3
      ) sub
    ), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ach.id, 'name', ach.name, 'icon', ach.icon, 'rarity', ach.rarity, 'unlockedAt', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements ach on ach.id = ua.achievement_id
      where ua.user_id = p_user_id and ua.unlocked_at is not null
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.student_profile_card(uuid) to authenticated;
