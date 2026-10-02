-- ============================================================================
-- Nexa Study — 0908 (3) · Revisões (substitui a Central de Erros)
--
-- O ADR-037 tinha juntado "Meus erros" e "Revisões de hoje" numa tela só,
-- porque na época as duas eram a mesma coisa (questão errada pra revisar).
-- Agora Revisões é mais ampla — fila de hoje/próximas/atrasadas/concluídas,
-- com repetição espaçada de verdade pra conteúdo concluído — e o usuário
-- confirmou que a tela nova SUBSTITUI /erros em vez de coexistir com ela.
--
-- `content_reviews` é um log de eventos (uma linha por confirmação), não uma
-- linha só por recurso — é o mesmo padrão de `quiz_attempts`/`study_sessions`
-- neste projeto, e é o que permite contar "quantas revisões você confirmou
-- hoje" sem perder o histórico de confirmações passadas.
-- ============================================================================

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  -- 0→3 dias, 1→7, 2→14, 3+→30. Sobe uma "confirmação de revisão" por vez;
  -- fica parado em 3 depois disso (repetição espaçada sem fim, não é uma
  -- barra que enche e acaba).
  interval_step integer not null default 0 check (interval_step >= 0),
  reviewed_at timestamptz not null default now()
);

create index if not exists content_reviews_user_resource_idx
  on public.content_reviews (user_id, resource_id, reviewed_at desc);
create index if not exists content_reviews_user_date_idx
  on public.content_reviews (user_id, reviewed_at desc);

alter table public.content_reviews enable row level security;

drop policy if exists content_reviews_all_own on public.content_reviews;
create policy content_reviews_all_own on public.content_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------- fila de revisão
-- Junta dois tipos de item na mesma fila: questões erradas (sempre "hoje",
-- igual à Central de Erros de antes) e conteúdo concluído cujo próximo
-- vencimento já chegou ou está próximo. `security definer` pelo mesmo motivo
-- de `recent_errors`/`topic_mastery`: perguntar "qual é o gabarito" e "o que
-- já foi concluído" exige ler tabelas sem policy de leitura direta pro aluno.
create or replace function public.review_queue(p_user_id uuid default auth.uid())
returns table (
  kind text,
  bucket text,
  question_id uuid,
  resource_id uuid,
  resource_title text,
  subject_id uuid,
  subject_name text,
  subject_color text,
  topic_name text,
  statement text,
  explanation text,
  chosen_body text,
  correct_body text,
  answered_at timestamptz,
  due_date date,
  next_interval_step integer,
  resource_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  with last_review as (
    select distinct on (cr.resource_id)
      cr.resource_id,
      cr.reviewed_at,
      cr.interval_step
    from public.content_reviews cr
    where cr.user_id = p_user_id
    order by cr.resource_id, cr.reviewed_at desc
  ),
  candidates as (
    select
      rp.resource_id,
      coalesce(lr.reviewed_at, rp.completed_at) as anchor_at,
      coalesce(lr.interval_step, -1) as last_step
    from public.resource_progress rp
    left join last_review lr on lr.resource_id = rp.resource_id
    where rp.user_id = p_user_id
      and rp.completed_at is not null
  ),
  scheduled as (
    select
      c.resource_id,
      (c.anchor_at + (case
        when c.last_step <= 0 then 3
        when c.last_step = 1 then 7
        when c.last_step = 2 then 14
        else 30
      end) * interval '1 day')::date as due_date,
      least(c.last_step + 1, 3) as next_interval_step
    from candidates c
  ),
  content_items as (
    select
      'conteudo'::text as kind,
      case
        when exists (
          select 1 from public.content_reviews cr2
          where cr2.user_id = p_user_id and cr2.resource_id = s.resource_id
            and cr2.reviewed_at::date = current_date
        ) then 'concluida'
        when s.due_date < current_date then 'atrasada'
        when s.due_date = current_date then 'hoje'
        else 'proxima'
      end as bucket,
      null::uuid as question_id,
      r.id as resource_id,
      r.title as resource_title,
      r.subject_catalog_id as subject_id,
      sc.name as subject_name,
      sc.default_color as subject_color,
      t.name as topic_name,
      null::text as statement,
      null::text as explanation,
      null::text as chosen_body,
      null::text as correct_body,
      null::timestamptz as answered_at,
      s.due_date,
      s.next_interval_step,
      r.kind::text as resource_kind
    from scheduled s
    join public.resources r on r.id = s.resource_id
    join public.subject_catalog sc on sc.id = r.subject_catalog_id
    left join public.content_topics t on t.id = r.topic_id
    where r.kind not in ('quiz', 'simulado')
  ),
  error_items as (
    select
      'erro'::text as kind,
      'hoje'::text as bucket,
      e.question_id,
      e.resource_id,
      e.resource_title,
      e.subject_id,
      e.subject_name,
      e.subject_color,
      e.topic_name,
      e.statement,
      e.explanation,
      e.chosen_body,
      e.correct_body,
      e.answered_at,
      current_date as due_date,
      0 as next_interval_step,
      null::text as resource_kind
    from public.recent_errors(p_user_id) e
  ),
  combined as (
    select * from error_items
    union all
    select * from content_items
  )
  -- Uma fila de "próximas" sem fim não cabe numa tela diária — atrasadas e
  -- hoje sempre entram, próximas só até duas semanas à frente.
  select * from combined
  where bucket <> 'proxima' or due_date <= current_date + 14
  order by
    case bucket when 'atrasada' then 0 when 'hoje' then 1 when 'proxima' then 2 else 3 end,
    due_date;
$$;

comment on function public.review_queue is
  'Fila de revisão: questões erradas (hoje) + conteúdo concluído vencido, hoje, próximo ou já revisado hoje.';

grant execute on function public.review_queue(uuid) to authenticated;
