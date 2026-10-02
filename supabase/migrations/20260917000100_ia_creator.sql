-- ============================================================================
-- Nexa Community — Fase 5 · IA Creator (aluno gera quiz/resumo com IA)
--
-- Decisão central, pelo motivo já documentado em `20260914000100_biblioteca_
-- comunitaria.sql` ("a Fase 5 foi propositalmente adiada por ser a de maior
-- risco de regressão — RLS de gabarito"): NUNCA tocar em `resources_manage`
-- (a policy que hoje protege escrita de admin/professor) nem em
-- `questions_manage`/`question_options_manage`. Aluno nunca ganha INSERT/
-- UPDATE direto nessas 3 tabelas — toda escrita de conteúdo de aluno passa
-- pelas RPCs `security definer` abaixo, que fazem exatamente as mesmas
-- inserções que `importSimulado` já faz hoje (mesma forma de linha), só que
-- de dentro de uma função em vez de várias chamadas do client.
--
-- Leitura é onde a mudança de verdade acontece: `can_view_resource()` ganha
-- os únicos dois ramos novos (dono sempre vê o próprio; e visibilidade nova
-- pra conteúdo de aluno), e a policy `resources_select_visible` passa a
-- CHAMAR essa mesma função em vez de duplicar a lógica — as duas nunca podem
-- divergir porque são literalmente o mesmo código. `questions`/
-- `question_options` continuam SEM policy de select nenhuma (só managers) —
-- todo mundo, inclusive quem criou o próprio quiz por IA, só vê as questões
-- (sem gabarito) através de `quiz_questions()`, que já filtra `is_correct` e
-- já é gated por `can_view_resource()`. Resultado: zero mudança de
-- comportamento pra conteúdo de admin/professor (o ramo antigo da função e
-- da policy fica byte-a-byte igual), e o mesmo runner/scoring/XP que já
-- existe passa a funcionar pra conteúdo de aluno sem precisar duplicar nada.
--
-- `visibility`/`community_id`/`ai_generated` só existem em linhas geradas
-- pela IA — conteúdo de admin/professor nunca grava essas colunas (ficam
-- `null`/`false`), que é o que faz o ramo `not ai_generated` do
-- `can_view_resource` ser, de propósito, IDÊNTICO ao de antes.
-- ============================================================================

alter table public.resources
  add column if not exists visibility text
    check (visibility is null or visibility in ('private', 'friends', 'school', 'community', 'public')),
  add column if not exists community_id uuid references public.communities (id) on delete set null,
  add column if not exists ai_generated boolean not null default false;

comment on column public.resources.visibility is
  'Só usado por conteúdo gerado pelo IA Creator (ai_generated = true). Null = conteúdo de admin/professor, rege-se pelas regras antigas (is_published + escola).';

-- ----------------------------------------------------------------------------
-- can_view_resource — estendida. O ramo `not r.ai_generated` é EXATAMENTE a
-- condição original (is_published + escola, ou can_manage_school, ou admin);
-- só foi reescrita como sub-bloco pra caber ao lado do ramo novo.
-- ----------------------------------------------------------------------------
create or replace function public.can_view_resource(p_resource_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and (
        r.created_by = p_user_id
        or public.is_admin(p_user_id)
        or (
          not r.ai_generated
          and (
            (r.is_published and (r.school_id is null or r.school_id = public.current_school_id(p_user_id)))
            or public.can_manage_school(r.school_id, p_user_id)
          )
        )
        or (
          r.ai_generated and r.visibility is not null and (
            r.visibility = 'public'
            or (r.visibility = 'school' and r.school_id is not null and r.school_id = public.current_school_id(p_user_id))
            or (r.visibility = 'friends' and r.created_by is not null and public.are_friends(p_user_id, r.created_by))
            or (r.visibility = 'community' and r.community_id is not null and public.can_view_community(r.community_id, p_user_id))
          )
        )
      )
  );
$$;

grant execute on function public.can_view_resource(uuid, uuid) to authenticated;

-- Policy passa a delegar pra `can_view_resource` — mesma regra, um lugar só.
drop policy if exists resources_select_visible on public.resources;
create policy resources_select_visible on public.resources
  for select to authenticated
  using (public.can_view_resource(id, auth.uid()));

-- `resources_manage`, `questions_manage`, `question_options_manage`: intocadas.

-- ----------------------------------------------------------------------------
-- create_ai_resource — única forma de um aluno inserir em resources/questions/
-- question_options. `p_questions` já vem VALIDADO pelo mesmo parser v2
-- (`parseSimuladoCode`) que o importador do admin usa — esta função só grava,
-- não valida formato de simulado (isso já rodou em TypeScript antes de
-- chegar aqui, puro, sem banco, testável isoladamente).
-- ----------------------------------------------------------------------------
create or replace function public.create_ai_resource(
  p_kind text,
  p_subject_catalog_id uuid,
  p_title text,
  p_description text default null,
  p_body text default null,
  p_questions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_question_id uuid;
  v_school uuid;
  v_qpos integer := 0;
  v_opos integer;
  q jsonb;
  o jsonb;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if not public.is_feature_enabled('creator_enabled') then
    raise exception 'o IA Creator está desativado' using errcode = '42501';
  end if;
  if p_kind not in ('quiz', 'resumo') then
    raise exception 'tipo de conteúdo inválido' using errcode = '22023';
  end if;
  if not exists (select 1 from public.subject_catalog where id = p_subject_catalog_id and is_active) then
    raise exception 'matéria inválida' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_title, ''))) < 2 then
    raise exception 'título muito curto' using errcode = '22023';
  end if;
  if p_kind = 'resumo' and length(btrim(coalesce(p_body, ''))) < 1 then
    raise exception 'conteúdo do resumo vazio' using errcode = '22023';
  end if;
  if p_kind = 'quiz' then
    if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) = 0 then
      raise exception 'sem questões' using errcode = '22023';
    end if;
    if jsonb_array_length(p_questions) > 20 then
      raise exception 'no máximo 20 questões por vez' using errcode = '22023';
    end if;
  end if;

  v_school := public.current_school_id(v_me);

  insert into public.resources (
    school_id, subject_catalog_id, kind, title, description, body,
    difficulty, is_published, created_by, visibility, ai_generated, schema_version
  ) values (
    v_school, p_subject_catalog_id, p_kind, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), p_body,
    'medio', true, v_me, 'private', true,
    case when p_kind = 'quiz' then '2.0' else '1.0' end
  )
  returning id into v_id;

  if p_kind = 'quiz' then
    for q in select * from jsonb_array_elements(p_questions) loop
      v_qpos := v_qpos + 1;

      if not exists (
        select 1 from jsonb_array_elements(coalesce(q -> 'options', '[]'::jsonb)) opt
        where (opt ->> 'is_correct')::boolean
      ) then
        raise exception 'questão % sem resposta correta marcada', v_qpos using errcode = '22023';
      end if;

      insert into public.questions (resource_id, position, statement, explanation, difficulty)
      values (
        v_id, v_qpos,
        btrim(q ->> 'statement'),
        nullif(btrim(coalesce(q ->> 'explanation', '')), ''),
        coalesce(nullif(q ->> 'difficulty', ''), 'medio')
      )
      returning id into v_question_id;

      v_opos := 0;
      for o in select * from jsonb_array_elements(q -> 'options') loop
        v_opos := v_opos + 1;
        insert into public.question_options (question_id, position, body, is_correct)
        values (v_question_id, v_opos, btrim(o ->> 'body'), coalesce((o ->> 'is_correct')::boolean, false));
      end loop;
    end loop;
  end if;

  if public.is_feature_enabled('social_xp_enabled') then
    perform public.award_xp(10, 'Criou conteúdo com a IA', 'social', v_id, v_me);
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_ai_resource(text, uuid, text, text, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- Listagem/gerência do próprio conteúdo gerado.
-- ----------------------------------------------------------------------------
create or replace function public.list_my_ai_resources()
returns table (
  id uuid,
  kind text,
  title text,
  description text,
  subject_name text,
  visibility text,
  community_id uuid,
  community_name text,
  question_count bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id, r.kind, r.title, r.description,
    sc.name,
    r.visibility, r.community_id, cm.name,
    (select count(*) from public.questions q where q.resource_id = r.id),
    r.created_at
  from public.resources r
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  left join public.communities cm on cm.id = r.community_id
  where r.ai_generated and r.created_by = auth.uid()
  order by r.created_at desc;
$$;

grant execute on function public.list_my_ai_resources() to authenticated;

create or replace function public.update_ai_resource_visibility(
  p_resource_id uuid,
  p_visibility text,
  p_community_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
begin
  if p_visibility not in ('private', 'friends', 'school', 'community', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  select created_by into v_owner from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  if p_visibility = 'community' then
    if p_community_id is null or not public.is_community_member(p_community_id, v_me) then
      raise exception 'escolha uma comunidade da qual você é membro' using errcode = '22023';
    end if;
  end if;

  update public.resources
  set visibility = p_visibility,
      community_id = case when p_visibility = 'community' then p_community_id else null end
  where id = p_resource_id;
end;
$$;

grant execute on function public.update_ai_resource_visibility(uuid, text, uuid) to authenticated;

create or replace function public.delete_ai_resource(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
begin
  select created_by into v_owner from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    return;
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  delete from public.resources where id = p_resource_id;
end;
$$;

grant execute on function public.delete_ai_resource(uuid) to authenticated;

update public.feature_flags set enabled = true where key = 'creator_enabled';
