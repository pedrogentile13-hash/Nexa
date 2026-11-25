-- ============================================================================
-- Nexa Vestibular — cartão-resposta digital
--
-- O aluno faz a prova no caderno oficial (PDF) e marca as respostas no app (ou envia a foto do cartão, que a IA lê).
-- O app corrige com o GABARITO OFICIAL, que só o administrador cadastra. O aluno nunca lê o gabarito antes de enviar:
-- a correção acontece dentro de `submit_exam_attempt` (security definer) e só depois `exam_attempt_review` mostra a certa.
-- Questão ANULADA conta como certa para todos (é o que as bancas fazem na prática).
-- ============================================================================

create table if not exists public.exam_answer_keys (
  id uuid primary key default gen_random_uuid(),
  exam_edition_id uuid not null references public.exam_editions (id) on delete cascade,
  number smallint not null check (number between 1 and 400),
  correct text check (correct is null or correct ~ '^[A-E]$'),
  annulled boolean not null default false,
  area text check (area is null or length(btrim(area)) between 1 and 60),
  created_at timestamptz not null default now(),
  constraint exam_answer_keys_letter check (annulled or correct is not null),
  constraint exam_answer_keys_edition_number_uq unique (exam_edition_id, number)
);

alter table public.exam_answer_keys enable row level security;

-- Só o administrador lê e escreve: o gabarito não pode vazar para o aluno antes da correção.
drop policy if exists exam_answer_keys_admin on public.exam_answer_keys;
create policy exam_answer_keys_admin on public.exam_answer_keys
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_edition_id uuid not null references public.exam_editions (id) on delete cascade,
  mode text not null default 'digital' check (mode in ('digital', 'foto')),
  answers jsonb not null default '{}'::jsonb,
  total smallint not null,
  correct smallint not null,
  wrong smallint not null,
  blank smallint not null,
  score_pct numeric(5, 2) not null,
  by_area jsonb not null default '[]'::jsonb,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 172800),
  created_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_idx on public.exam_attempts (user_id, exam_edition_id, created_at desc);

alter table public.exam_attempts enable row level security;

drop policy if exists exam_attempts_select_own on public.exam_attempts;
create policy exam_attempts_select_own on public.exam_attempts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists exam_attempts_delete_own on public.exam_attempts;
create policy exam_attempts_delete_own on public.exam_attempts
  for delete to authenticated using (user_id = auth.uid());
-- (Sem policy de insert/update: só `submit_exam_attempt` grava, já corrigido.)

-- Quantas questões cada edição tem (sem revelar as letras): serve para o app saber se a prova já pode ser feita.
create or replace function public.exam_keys_summary()
returns table (exam_edition_id uuid, total integer)
language sql stable security definer set search_path = public as $$
  select k.exam_edition_id, count(*)::integer from public.exam_answer_keys k group by k.exam_edition_id;
$$;

-- O "desenho" do cartão-resposta: número e área de cada questão (sem a letra certa).
create or replace function public.exam_key_layout(p_edition_id uuid)
returns table (number smallint, area text, annulled boolean)
language sql stable security definer set search_path = public as $$
  select k.number, coalesce(k.area, 'Geral'), k.annulled
  from public.exam_answer_keys k
  where k.exam_edition_id = p_edition_id
  order by k.number;
$$;

-- Corrige e guarda a tentativa. `p_answers`: {"1":"A","2":"C",...}; letra vazia ou inválida = em branco.
create or replace function public.submit_exam_attempt(
  p_edition_id uuid,
  p_answers jsonb,
  p_duration_seconds integer default null,
  p_mode text default 'digital'
)
returns table (attempt_id uuid, total integer, correct integer, wrong integer, blank integer, score_pct numeric, by_area jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_total integer;
  v_correct integer;
  v_blank integer;
  v_wrong integer;
  v_pct numeric;
  v_areas jsonb;
  v_clean jsonb;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Entre para continuar.' using errcode = '28000';
  end if;
  if p_mode is null or p_mode not in ('digital', 'foto') then
    p_mode := 'digital';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Respostas inválidas.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) > 400 then
    raise exception 'Respostas demais.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.exam_answer_keys where exam_edition_id = p_edition_id) then
    raise exception 'O gabarito desta prova ainda não foi cadastrado.' using errcode = '22023';
  end if;

  create temporary table _nx_scored on commit drop as
  select
    k.number,
    coalesce(k.area, 'Geral') as area,
    k.annulled,
    k.correct,
    case when upper(btrim(coalesce(p_answers ->> k.number::text, ''))) ~ '^[A-E]$'
         then upper(btrim(p_answers ->> k.number::text)) end as chosen
  from public.exam_answer_keys k
  where k.exam_edition_id = p_edition_id;

  select
    count(*)::integer,
    (count(*) filter (where annulled or chosen = correct))::integer,
    (count(*) filter (where not annulled and chosen is null))::integer
  into v_total, v_correct, v_blank
  from _nx_scored;

  v_wrong := v_total - v_correct - v_blank;
  v_pct := round(v_correct::numeric * 100 / nullif(v_total, 0), 2);

  select coalesce(jsonb_agg(x order by x ->> 'area'), '[]'::jsonb) into v_areas
  from (
    select jsonb_build_object(
      'area', area,
      'total', count(*),
      'correct', count(*) filter (where annulled or chosen = correct),
      'blank', count(*) filter (where not annulled and chosen is null),
      'wrong', count(*) - count(*) filter (where annulled or chosen = correct) - count(*) filter (where not annulled and chosen is null),
      'pct', round((count(*) filter (where annulled or chosen = correct))::numeric * 100 / count(*), 1)
    ) as x
    from _nx_scored group by area
  ) t;

  select coalesce(jsonb_object_agg(number::text, chosen), '{}'::jsonb) into v_clean
  from _nx_scored where chosen is not null;

  insert into public.exam_attempts (user_id, exam_edition_id, mode, answers, total, correct, wrong, blank, score_pct, by_area, duration_seconds)
  values (v_me, p_edition_id, p_mode, v_clean, v_total, v_correct, v_wrong, v_blank, coalesce(v_pct, 0), v_areas, p_duration_seconds)
  returning id into v_id;

  return query select v_id, v_total, v_correct, v_wrong, v_blank, coalesce(v_pct, 0), v_areas;
end;
$$;

-- Revisão de UMA tentativa do próprio aluno: aqui, e só aqui, a letra certa aparece.
create or replace function public.exam_attempt_review(p_attempt_id uuid)
returns table (number smallint, area text, chosen text, correct text, status text)
language sql stable security definer set search_path = public as $$
  select
    k.number,
    coalesce(k.area, 'Geral'),
    a.answers ->> k.number::text,
    case when k.annulled then null else k.correct end,
    case
      when k.annulled then 'anulada'
      when a.answers ->> k.number::text is null then 'branca'
      when a.answers ->> k.number::text = k.correct then 'certa'
      else 'errada'
    end
  from public.exam_attempts a
  join public.exam_answer_keys k on k.exam_edition_id = a.exam_edition_id
  where a.id = p_attempt_id and a.user_id = auth.uid()
  order by k.number;
$$;

grant execute on function public.exam_keys_summary() to authenticated;
grant execute on function public.exam_key_layout(uuid) to authenticated;
grant execute on function public.submit_exam_attempt(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.exam_attempt_review(uuid) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
