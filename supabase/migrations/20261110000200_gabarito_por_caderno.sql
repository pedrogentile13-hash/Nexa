-- ============================================================================
-- Gabarito por CADERNO (cor)
--
-- Uma mesma prova tem cadernos diferentes (ENEM: Azul, Amarelo, Branco, Rosa…), com as questões em ordem diferente
-- e portanto gabaritos diferentes. `variant` é o nome do caderno ("Azul", "1º dia · Amarelo"). Vazio = gabarito único.
-- O aluno escolhe a cor do caderno dele e é corrigido pelo gabarito daquela cor. O gabarito continua sem poder ser lido pelo aluno.
-- ============================================================================

alter table public.exam_answer_keys
  add column if not exists variant text not null default '' check (length(variant) <= 60);

alter table public.exam_answer_keys drop constraint if exists exam_answer_keys_edition_number_uq;
create unique index if not exists exam_answer_keys_edition_variant_number_uq
  on public.exam_answer_keys (exam_edition_id, variant, number);

alter table public.exam_attempts
  add column if not exists variant text not null default '' check (length(variant) <= 60);

-- Qual caderno vale: o pedido, se existir; senão o primeiro da edição (ordem alfabética).
create or replace function public.resolve_exam_key_variant(p_edition_id uuid, p_variant text)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.exam_answer_keys k where k.exam_edition_id = p_edition_id and k.variant = coalesce(p_variant, ''))
      then coalesce(p_variant, '')
    else coalesce((select min(k.variant) from public.exam_answer_keys k where k.exam_edition_id = p_edition_id), '')
  end;
$$;

-- Quantas questões cada edição tem (a maior entre os cadernos), sem revelar as letras.
create or replace function public.exam_keys_summary()
returns table (exam_edition_id uuid, total integer)
language sql stable security definer set search_path = public as $$
  select t.exam_edition_id, max(t.n)::integer
  from (select k.exam_edition_id, k.variant, count(*) as n from public.exam_answer_keys k group by k.exam_edition_id, k.variant) t
  group by t.exam_edition_id;
$$;

-- Os cadernos (cores) que a edição tem, para o aluno escolher o dele.
create or replace function public.exam_key_variants(p_edition_id uuid)
returns table (variant text, total integer)
language sql stable security definer set search_path = public as $$
  select k.variant, count(*)::integer
  from public.exam_answer_keys k
  where k.exam_edition_id = p_edition_id
  group by k.variant
  order by k.variant;
$$;

drop function if exists public.exam_key_layout(uuid);
create or replace function public.exam_key_layout(p_edition_id uuid, p_variant text default '')
returns table (number smallint, area text, annulled boolean)
language sql stable security definer set search_path = public as $$
  select k.number, coalesce(k.area, 'Geral'), k.annulled
  from public.exam_answer_keys k
  where k.exam_edition_id = p_edition_id
    and k.variant = public.resolve_exam_key_variant(p_edition_id, p_variant)
  order by k.number;
$$;

drop function if exists public.submit_exam_attempt(uuid, jsonb, integer, text);
create or replace function public.submit_exam_attempt(
  p_edition_id uuid,
  p_answers jsonb,
  p_duration_seconds integer default null,
  p_mode text default 'digital',
  p_variant text default ''
)
returns table (attempt_id uuid, total integer, correct integer, wrong integer, blank integer, score_pct numeric, by_area jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_variant text;
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

  v_variant := public.resolve_exam_key_variant(p_edition_id, p_variant);

  drop table if exists _nx_scored;
  create temporary table _nx_scored on commit drop as
  select
    k.number,
    coalesce(k.area, 'Geral') as area,
    k.annulled,
    k.correct,
    case when upper(btrim(coalesce(p_answers ->> k.number::text, ''))) ~ '^[A-E]$'
         then upper(btrim(p_answers ->> k.number::text)) end as chosen
  from public.exam_answer_keys k
  where k.exam_edition_id = p_edition_id and k.variant = v_variant;

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

  insert into public.exam_attempts (user_id, exam_edition_id, mode, answers, total, correct, wrong, blank, score_pct, by_area, duration_seconds, variant)
  values (v_me, p_edition_id, p_mode, v_clean, v_total, v_correct, v_wrong, v_blank, coalesce(v_pct, 0), v_areas, p_duration_seconds, v_variant)
  returning id into v_id;

  return query select v_id, v_total, v_correct, v_wrong, v_blank, coalesce(v_pct, 0), v_areas;
end;
$$;

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
  join public.exam_answer_keys k on k.exam_edition_id = a.exam_edition_id and k.variant = a.variant
  where a.id = p_attempt_id and a.user_id = auth.uid()
  order by k.number;
$$;

grant execute on function public.exam_keys_summary() to authenticated;
grant execute on function public.exam_key_variants(uuid) to authenticated;
grant execute on function public.exam_key_layout(uuid, text) to authenticated;
grant execute on function public.submit_exam_attempt(uuid, jsonb, integer, text, text) to authenticated;
grant execute on function public.exam_attempt_review(uuid) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
