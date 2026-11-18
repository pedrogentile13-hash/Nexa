-- ============================================================================
-- Nexa Vestibular — Fase 3 · Plano de estudo e Reta Final
--
-- A pergunta que esta fase responde é a única que importa pra quem está a
-- oito meses da prova: "por onde eu começo?". As Fases 1 e 2 já sabem o que
-- o aluno domina; o que faltava era o outro lado da conta — o que a PROVA
-- DELE cobra. Assunto que o aluno domina mal e que cai muito é prioridade;
-- assunto que ele domina mal e que quase nunca cai, não é.
--
-- De onde sai a frequência, e por que de dois lugares:
--
--   1. Derivada do próprio acervo: quantas questões daquele vestibular, em
--      todas as edições cadastradas, são daquele assunto. Funciona no dia
--      zero, sem ninguém cadastrar nada, e melhora sozinha conforme provas
--      entram. É a fonte padrão.
--   2. `exam_topic_frequency`, cadastrada à mão: quando alguém tem o dado
--      real (relatório do INEP, levantamento de cursinho), ele VENCE o
--      derivado. Não é redundância — é a diferença entre "o que temos no
--      banco" e "o que a prova realmente cobra", que só coincidem quando o
--      acervo é grande e balanceado.
--
-- Por que "nunca respondeu" não é tratado como "domínio zero": um assunto
-- sem nenhuma resposta não tem evidência nenhuma, nem boa nem ruim. Tratá-lo
-- como zero jogaria todo o conteúdo não visto pro topo do plano e enterraria
-- os erros reais — exatamente o oposto do que o aluno precisa ver. Ele entra
-- com 50 (neutro) e sobe ou desce assim que houver a primeira resposta.
-- ============================================================================

create table if not exists public.exam_topic_frequency (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  topic_id uuid not null references public.content_topics (id) on delete cascade,
  -- Percentual da prova que esse assunto costuma ocupar.
  frequency_percent numeric not null check (frequency_percent >= 0 and frequency_percent <= 100),
  -- Quantas edições sustentam esse número. É o que separa um dado de um palpite.
  editions_counted smallint not null default 0 check (editions_counted >= 0),
  note text,
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists exam_topic_frequency_uq
  on public.exam_topic_frequency (exam_id, topic_id);

alter table public.exam_topic_frequency enable row level security;

-- Leitura livre pra autenticado (é dado público sobre a prova, não sobre o
-- aluno); escrita só admin, como o resto do catálogo de vestibulares.
drop policy if exists exam_topic_frequency_select on public.exam_topic_frequency;
create policy exam_topic_frequency_select on public.exam_topic_frequency
  for select to authenticated using (true);

drop policy if exists exam_topic_frequency_manage on public.exam_topic_frequency;
create policy exam_topic_frequency_manage on public.exam_topic_frequency
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Frequência efetiva por assunto: o cadastrado quando existe, o derivado do
-- acervo quando não.
-- ----------------------------------------------------------------------------
create or replace function public.exam_topic_weights(p_exam_id uuid)
returns table (
  topic_id uuid,
  topic_name text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  frequency_percent numeric,
  source text
)
language sql
stable
security definer
set search_path = public
as $$
  with derived as (
    select
      q.topic_id,
      count(*)::numeric as questions
    from public.questions q
    join public.resources r on r.id = q.resource_id
    where r.context = 'vestibular'
      and q.topic_id is not null
      and (p_exam_id is null or r.exam_id = p_exam_id)
    group by q.topic_id
  ),
  total as (select greatest(sum(questions), 1) as questions from derived)
  select
    t.id,
    t.name,
    sc.id,
    sc.name,
    sc.default_color,
    coalesce(f.frequency_percent, round(d.questions / (select questions from total) * 100, 1)),
    case when f.frequency_percent is not null then 'cadastrada' else 'derivada' end
  from derived d
  join public.content_topics t on t.id = d.topic_id
  join public.subject_catalog sc on sc.id = t.subject_catalog_id
  left join public.exam_topic_frequency f
    on f.topic_id = t.id and p_exam_id is not null and f.exam_id = p_exam_id
  order by 6 desc;
$$;

comment on function public.exam_topic_weights is
  'Peso de cada assunto numa prova: o valor cadastrado em exam_topic_frequency quando existe, senão a fatia que o assunto ocupa no acervo daquela prova.';

grant execute on function public.exam_topic_weights(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- O plano em si.
--
-- `priority_score = frequencia * (100 - dominio) / 100`. Os dois fatores
-- multiplicam em vez de somar de propósito: um assunto que não cai (peso ~0)
-- não deve subir no plano por mais mal que o aluno vá nele, e um assunto que
-- ele domina (100) não deve subir por mais que caia. A soma daria as duas
-- coisas erradas.
--
-- `phase`: a menos de 60 dias da prova, o plano corta a cauda longa (assuntos
-- abaixo de 3% da prova) — nessa altura, estudar o que cai uma vez a cada
-- cinco anos é tempo tirado do que cai todo ano. Acima disso, o plano mostra
-- tudo, porque ainda há tempo pra cobrir.
-- ----------------------------------------------------------------------------
create or replace function public.vestibular_study_plan(p_limit integer default 20)
returns table (
  topic_id uuid,
  topic_name text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  frequency_percent numeric,
  frequency_source text,
  mastery_percent numeric,
  answered_count bigint,
  priority_score numeric,
  reason text,
  phase text,
  days_until integer
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  target as (
    select vp.main_exam_id as exam_id, ed.application_date
    from me
    join public.vestibular_profiles vp on vp.user_id = me.uid
    left join lateral (
      select ed2.application_date
      from public.exam_editions ed2
      where ed2.exam_id = vp.main_exam_id
        and (vp.target_year is null or ed2.year = vp.target_year)
        and ed2.application_date >= current_date
      order by ed2.application_date
      limit 1
    ) ed on true
  ),
  days as (
    select (select (application_date - current_date)::integer from target) as until
  ),
  plan_phase as (
    select case
      when (select until from days) is not null and (select until from days) <= 60
        then 'reta_final' else 'base'
    end as name
  ),
  weights as (
    select * from public.exam_topic_weights((select exam_id from target))
  ),
  mine as (
    select
      q.topic_id,
      count(*) as answered,
      round(count(*) filter (where la.is_correct)::numeric / greatest(count(*), 1) * 100) as mastery
    from public.vestibular_latest_answers() la
    join public.questions q on q.id = la.question_id
    where q.topic_id is not null
    group by q.topic_id
  )
  select
    w.topic_id,
    w.topic_name,
    w.subject_id,
    w.subject_name,
    w.subject_color,
    w.frequency_percent,
    w.source,
    m.mastery,
    coalesce(m.answered, 0),
    round(w.frequency_percent * (100 - coalesce(m.mastery, 50)) / 100, 2),
    case
      when w.frequency_percent >= 5 and coalesce(m.mastery, 50) < 60 then 'cai_muito_e_voce_erra'
      when w.frequency_percent >= 5 then 'cai_muito'
      when coalesce(m.mastery, 50) < 60 and m.answered is not null then 'voce_erra'
      else 'reforco'
    end,
    (select name from plan_phase),
    (select until from days)
  from weights w
  left join mine m on m.topic_id = w.topic_id
  where (select name from plan_phase) = 'base' or w.frequency_percent >= 3
  order by round(w.frequency_percent * (100 - coalesce(m.mastery, 50)) / 100, 2) desc, w.topic_name
  limit greatest(1, least(60, coalesce(p_limit, 20)));
$$;

comment on function public.vestibular_study_plan is
  'Assuntos ordenados por prioridade = peso na prova x lacuna de domínio. Na reta final (<=60 dias) corta a cauda longa.';

grant execute on function public.vestibular_study_plan(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- Treinar um assunto específico.
--
-- `start_practice_session` ganha `p_topic_id` — sem isso, cada linha do plano
-- seria um conselho sem botão. Precisa de `drop` explícito: `create or
-- replace` não acrescenta parâmetro, ele cria uma SEGUNDA função, e toda
-- chamada de 4 argumentos passaria a ser ambígua (o mesmo tropeço já visto em
-- `create_post` e `bootstrap_student` neste projeto).
-- ----------------------------------------------------------------------------
drop function if exists public.start_practice_session(uuid, uuid, text, integer);

create or replace function public.start_practice_session(
  p_exam_id uuid default null,
  p_subject_catalog_id uuid default null,
  p_difficulty text default null,
  p_question_count integer default 10,
  p_topic_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_ids uuid[];
  v_id uuid;
  v_limit integer := greatest(1, least(50, coalesce(p_question_count, 10)));
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('vestibular_enabled') then
    raise exception 'a área de vestibular está desativada' using errcode = '42501';
  end if;

  select array_agg(x.question_id order by x.rank_bucket, random())
    into v_ids
  from (
    select
      q.id as question_id,
      case
        when hist.last_answer is null then 0          -- nunca respondida
        when hist.last_answer is false then 1         -- errou
        else 2                                        -- já acertou
      end as rank_bucket
    from public.questions q
    join public.resources r on r.id = q.resource_id
    left join lateral (
      select a.is_correct as last_answer
      from public.practice_answers a
      join public.practice_sessions s on s.id = a.session_id
      where a.question_id = q.id and s.user_id = v_me and a.option_id is not null
      order by a.answered_at desc
      limit 1
    ) hist on true
    where r.context = 'vestibular'
      and public.can_view_resource(r.id)
      and (p_exam_id is null or r.exam_id = p_exam_id)
      and (p_subject_catalog_id is null
           or coalesce(q.subject_catalog_id, r.subject_catalog_id) = p_subject_catalog_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct)
    order by rank_bucket, random()
    limit v_limit
  ) x;

  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception 'nenhuma questão encontrada com esses filtros' using errcode = 'P0002';
  end if;

  insert into public.practice_sessions (user_id, question_ids, exam_id, subject_catalog_id, difficulty, total_count)
  values (v_me, v_ids, p_exam_id, p_subject_catalog_id, p_difficulty, cardinality(v_ids))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_practice_session(uuid, uuid, text, integer, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Manutenção da frequência cadastrada (admin).
-- ----------------------------------------------------------------------------
create or replace function public.set_exam_topic_frequency(
  p_exam_id uuid,
  p_topic_id uuid,
  p_frequency_percent numeric,
  p_editions_counted smallint default 0,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'apenas administradores cadastram frequência de prova' using errcode = '42501';
  end if;

  insert into public.exam_topic_frequency
    (exam_id, topic_id, frequency_percent, editions_counted, note, created_by)
  values
    (p_exam_id, p_topic_id, p_frequency_percent, coalesce(p_editions_counted, 0), p_note, auth.uid())
  on conflict (exam_id, topic_id) do update
    set frequency_percent = excluded.frequency_percent,
        editions_counted = excluded.editions_counted,
        note = excluded.note,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.set_exam_topic_frequency(uuid, uuid, numeric, smallint, text) to authenticated;
