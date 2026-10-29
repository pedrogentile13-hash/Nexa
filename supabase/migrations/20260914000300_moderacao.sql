-- ============================================================================
-- Nexa Community — Fase 11 · Admin da comunidade (denúncias/moderação)
--
-- `reports` é polimórfica de propósito (`target_type` + `target_id`, sem FK)
-- — um post, comentário, mensagem, comunidade ou usuário são tabelas
-- diferentes, e uma FK por tipo (5 colunas nullable) seria pior de manter
-- que resolver o tipo em SQL na hora de exibir. Mesmo padrão RLS-sem-policy
-- do resto da Community.
--
-- `report_target_school`: quem pode RESOLVER uma denúncia é quem já
-- modera aquele conteúdo hoje (`can_manage_school`, o mesmo helper usado em
-- `delete_post`/`delete_comment`/`delete_message`/`delete_community`) — não
-- um papel novo de "moderador global". Resolve a escola do alvo polimórfico
-- uma vez só, reaproveitado tanto na listagem quanto na resolução.
-- ============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message', 'community', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'assedio', 'conteudo_impropio', 'informacao_falsa', 'outro')),
  details text check (details is null or length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
-- (Sem policies — leitura/escrita só pelas RPCs abaixo, mesmo padrão de `posts`/`communities`.)

create or replace function public.report_target_school(p_target_type text, p_target_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case p_target_type
    when 'post' then (select p.school_id from public.posts p where p.id = p_target_id)
    when 'comment' then (
      select p.school_id from public.comments c join public.posts p on p.id = c.post_id where c.id = p_target_id
    )
    when 'message' then (
      select cm.school_id from public.messages m join public.communities cm on cm.id = m.community_id where m.id = p_target_id
    )
    when 'community' then (select cm.school_id from public.communities cm where cm.id = p_target_id)
    when 'user' then (select pr.school_id from public.profiles pr where pr.id = p_target_id)
    else null
  end;
$$;

grant execute on function public.report_target_school(text, uuid) to authenticated;

create or replace function public.create_report(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_target_type not in ('post', 'comment', 'message', 'community', 'user') then
    raise exception 'tipo de denúncia inválido' using errcode = '22023';
  end if;
  if p_reason not in ('spam', 'assedio', 'conteudo_impropio', 'informacao_falsa', 'outro') then
    raise exception 'motivo inválido' using errcode = '22023';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, details)
  values (v_me, p_target_type, p_target_id, p_reason, nullif(btrim(coalesce(p_details, '')), ''))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_report(text, uuid, text, text) to authenticated;

-- `p_status` nulo lista todas; quem chama sem `can_manage_school`/`is_admin`
-- pra NENHUM alvo simplesmente recebe 0 linhas (o filtro é por linha, dentro
-- do próprio WHERE — não existe um "é moderador de algo" genérico pra
-- checar antes).
create or replace function public.list_reports(p_status text default 'pending')
returns table (
  id uuid,
  target_type text,
  target_id uuid,
  reason text,
  details text,
  status text,
  reporter_name text,
  target_preview text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    r.id, r.target_type, r.target_id, r.reason, r.details, r.status,
    coalesce(pr.full_name, 'Sem nome'),
    case r.target_type
      when 'post' then (select left(p.content, 140) from public.posts p where p.id = r.target_id)
      when 'comment' then (select left(c.content, 140) from public.comments c where c.id = r.target_id)
      when 'message' then (select left(m.content, 140) from public.messages m where m.id = r.target_id)
      when 'community' then (select cm.name from public.communities cm where cm.id = r.target_id)
      when 'user' then (select pr2.full_name from public.profiles pr2 where pr2.id = r.target_id)
    end,
    r.created_at,
    r.reviewed_at
  from public.reports r
  join public.profiles pr on pr.id = r.reporter_id
  where (p_status is null or r.status = p_status)
    and (public.is_admin() or public.can_manage_school(public.report_target_school(r.target_type, r.target_id)))
  order by r.created_at desc;
end;
$$;

grant execute on function public.list_reports(text) to authenticated;

create or replace function public.resolve_report(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if p_status not in ('reviewed', 'dismissed') then
    raise exception 'status inválido' using errcode = '22023';
  end if;

  select * into v_report from public.reports where id = p_report_id;
  if not found then
    return;
  end if;

  if not (
    public.is_admin()
    or public.can_manage_school(public.report_target_school(v_report.target_type, v_report.target_id))
  ) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;

  update public.reports
  set status = p_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;
end;
$$;

grant execute on function public.resolve_report(uuid, text) to authenticated;

-- Contagem pendente, pra um badge no nav do admin sem carregar a lista inteira.
create or replace function public.count_pending_reports()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.reports r
  where r.status = 'pending'
    and (public.is_admin() or public.can_manage_school(public.report_target_school(r.target_type, r.target_id)));
$$;

grant execute on function public.count_pending_reports() to authenticated;
