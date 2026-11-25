-- ============================================================================
-- Nexa — NexaIA: material de estudo do aluno e pedido de publicação
--
-- 1. `study_documents`: o texto de um PDF/imagem/anotação que o aluno colocou
--    para estudar com a IA (resumo, simulado, perguntas sobre o material). Só o
--    TEXTO fica guardado, não o arquivo. Privado do aluno.
--
-- 2. Tudo que a IA cria para o aluno nasce PRIVADO (só ele vê, na Biblioteca).
--    Dentro de uma escola, ele não publica sozinho: PEDE autorização à
--    coordenação/direção, que aprova (vira conteúdo da escola) ou recusa. Isto
--    fecha a brecha da função antiga `update_ai_resource_visibility`, que
--    deixava o dono mudar a visibilidade livremente.
-- ============================================================================

-- ---------------------------------------------------------------- material --
create table if not exists public.study_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  source_kind text not null check (source_kind in ('pdf', 'image', 'text')),
  content text not null check (length(btrim(content)) between 20 and 120000),
  pages integer check (pages is null or pages > 0),
  created_at timestamptz not null default now()
);

create index if not exists study_documents_user_idx on public.study_documents (user_id, created_at desc);

alter table public.study_documents enable row level security;

drop policy if exists study_documents_select_own on public.study_documents;
create policy study_documents_select_own on public.study_documents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists study_documents_insert_own on public.study_documents;
create policy study_documents_insert_own on public.study_documents
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists study_documents_delete_own on public.study_documents;
create policy study_documents_delete_own on public.study_documents
  for delete to authenticated using (user_id = auth.uid());

-- --------------------------------------------------------------- publicação --
create table if not exists public.publication_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text check (note is null or length(note) <= 500),
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- Um pedido pendente por conteúdo.
create unique index if not exists publication_requests_one_pending
  on public.publication_requests (resource_id) where status = 'pending';
create index if not exists publication_requests_school_idx on public.publication_requests (school_id, status, created_at desc);

alter table public.publication_requests enable row level security;

-- O aluno vê os PRÓPRIOS pedidos; a coordenação lê pelas funções abaixo.
drop policy if exists publication_requests_select_own on public.publication_requests;
create policy publication_requests_select_own on public.publication_requests
  for select to authenticated using (requester_id = auth.uid());

create or replace function public.request_publication(p_resource_id uuid, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_res public.resources%rowtype;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  select * into v_res from public.resources where id = p_resource_id and ai_generated and created_by = v_me;
  if not found then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_res.school_id is null then
    raise exception 'você precisa estar ligado a uma escola para pedir publicação' using errcode = '22023';
  end if;
  if v_res.visibility is distinct from 'private' then
    raise exception 'este conteúdo já está publicado' using errcode = '22023';
  end if;
  if exists (select 1 from public.publication_requests where resource_id = p_resource_id and status = 'pending') then
    raise exception 'já existe um pedido aguardando resposta' using errcode = '23505';
  end if;

  insert into public.publication_requests (resource_id, requester_id, school_id, note)
  values (p_resource_id, v_me, v_res.school_id, nullif(left(btrim(coalesce(p_note, '')), 500), ''))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.request_publication(uuid, text) to authenticated;

-- Fila da coordenação/direção. Mostra um trecho do conteúdo para decidir.
create or replace function public.list_publication_requests(p_status text default 'pending')
returns table (
  id uuid,
  resource_id uuid,
  kind text,
  title text,
  subject_name text,
  requester_name text,
  class_name text,
  note text,
  status text,
  decision_note text,
  question_count integer,
  preview text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    pr.id, r.id, r.kind, r.title,
    sc.name,
    coalesce(p.full_name, 'Aluno'),
    c.name,
    pr.note, pr.status, pr.decision_note,
    (select count(*) from public.questions q where q.resource_id = r.id)::int,
    left(coalesce(r.body, (select string_agg(qs.statement, E'\n' order by qs.position) from (select q2.statement, q2.position from public.questions q2 where q2.resource_id = r.id order by q2.position limit 5) qs), ''), 1200),
    pr.created_at
  from public.publication_requests pr
  join public.resources r on r.id = pr.resource_id
  join public.subject_catalog sc on sc.id = r.subject_catalog_id
  join public.profiles p on p.id = pr.requester_id
  left join public.classes c on c.id = p.class_id
  where (public.is_admin() or public.school_staff_level(pr.school_id) >= 2)
    and (p_status is null or pr.status = p_status)
  order by pr.created_at desc
  limit 100;
end;
$$;

grant execute on function public.list_publication_requests(text) to authenticated;

create or replace function public.decide_publication(p_request_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_req public.publication_requests%rowtype;
  v_title text;
begin
  select * into v_req from public.publication_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'pedido não encontrado ou já decidido' using errcode = 'P0002';
  end if;
  if not (public.is_admin(v_me) or public.school_staff_level(v_req.school_id, v_me) >= 2) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  update public.publication_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      decision_note = nullif(left(btrim(coalesce(p_note, '')), 500), ''),
      decided_by = v_me,
      decided_at = now()
  where id = p_request_id;

  -- Aprovado: vira conteúdo visível a TODA a escola.
  if p_approve then
    update public.resources set visibility = 'school' where id = v_req.resource_id;
  end if;

  select title into v_title from public.resources where id = v_req.resource_id;
  insert into public.notifications (user_id, title, body, link)
  values (
    v_req.requester_id,
    case when p_approve then 'Seu conteúdo foi publicado na escola' else 'Seu pedido de publicação foi recusado' end,
    left(coalesce(v_title, 'Conteúdo') || coalesce(' — ' || nullif(btrim(coalesce(p_note, '')), ''), ''), 500),
    '/estudar'
  );
end;
$$;

grant execute on function public.decide_publication(uuid, boolean, text) to authenticated;

-- Fecha a brecha: dentro de uma escola, o dono só publica com autorização.
create or replace function public.update_ai_resource_visibility(
  p_resource_id uuid,
  p_visibility text,
  p_community_id uuid default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
  v_school uuid;
begin
  if p_visibility not in ('private', 'friends', 'school', 'community', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;

  select created_by, school_id into v_owner, v_school from public.resources where id = p_resource_id and ai_generated;
  if v_owner is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if v_owner <> v_me and not public.is_admin(v_me) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  -- Quem pertence a uma escola só TIRA do privado com autorização aprovada
  -- (ou se for coordenação/direção/plataforma). Voltar ao privado é sempre livre.
  if p_visibility <> 'private'
     and v_school is not null
     and not public.is_admin(v_me)
     and public.school_staff_level(v_school, v_me) < 2
     and not exists (
       select 1 from public.publication_requests
       where resource_id = p_resource_id and status = 'approved'
     )
  then
    raise exception 'peça autorização à coordenação da escola para publicar' using errcode = '42501';
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
