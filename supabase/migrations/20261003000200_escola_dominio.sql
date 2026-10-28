-- ============================================================================
-- Nexa — Escola por endereço (anglomorumbi.nexastudy.com.br)
--
-- Um único Nexa, vários endereços. Cada escola tem um ou mais endereços
-- (`school_domains`) e uma marca (`school_branding`: nome, logo, cores).
--
-- O app descobre a escola ANTES do login (a tela de entrada já mostra a marca
-- da escola), então a consulta precisa funcionar para quem não está logado.
-- Mas as tabelas NÃO são abertas ao `anon`: quem abre é uma função
-- `security definer` que devolve só o que é público (nome, logo, cores) para
-- um endereço específico — não dá para listar as escolas clientes.
-- ============================================================================

-- ---------------------------------------------------------------- endereços --
create table if not exists public.school_domains (
  host text primary key
    check (host = lower(host) and host ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  school_id uuid not null references public.schools (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists school_domains_school_idx on public.school_domains (school_id);

alter table public.school_domains enable row level security;

-- Registrar um endereço é decisão da plataforma, não da escola: um
-- school_admin apontando `qualquer.coisa` para a própria escola seria
-- sequestro de endereço.
drop policy if exists school_domains_admin on public.school_domains;
create policy school_domains_admin on public.school_domains
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Quem gerencia a escola enxerga os endereços dela (só leitura).
drop policy if exists school_domains_select_manager on public.school_domains;
create policy school_domains_select_manager on public.school_domains
  for select to authenticated
  using (public.can_manage_school(school_id));

-- ------------------------------------------------------------------- marca --
create table if not exists public.school_branding (
  school_id uuid primary key references public.schools (id) on delete cascade,
  display_name text check (display_name is null or length(btrim(display_name)) between 2 and 80),
  logo_url text check (logo_url is null or (length(logo_url) <= 500 and logo_url ~ '^https://')),
  brand text check (brand is null or brand ~ '^#[0-9a-fA-F]{6}$'),
  brand_text text check (brand_text is null or brand_text ~ '^#[0-9a-fA-F]{6}$'),
  brand_soft text check (brand_soft is null or brand_soft ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

alter table public.school_branding enable row level security;

drop policy if exists school_branding_select on public.school_branding;
create policy school_branding_select on public.school_branding
  for select to authenticated
  using (school_id = public.current_school_id() or public.can_manage_school(school_id));

drop policy if exists school_branding_manage on public.school_branding;
create policy school_branding_manage on public.school_branding
  for all to authenticated
  using (public.can_manage_school(school_id))
  with check (public.can_manage_school(school_id));

-- --------------------------------------------------------- resolver endereço --
-- Pública (anon): devolve só nome, logo e cores de UM endereço ativo. Endereço
-- desconhecido ou desativado devolve zero linhas.
create or replace function public.resolve_school_host(p_host text)
returns table (
  school_id uuid,
  display_name text,
  logo_url text,
  brand text,
  brand_text text,
  brand_soft text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.school_id,
    coalesce(b.display_name, s.name),
    b.logo_url,
    b.brand,
    b.brand_text,
    b.brand_soft
  from public.school_domains d
  join public.schools s on s.id = d.school_id
  left join public.school_branding b on b.school_id = d.school_id
  where d.host = lower(btrim(p_host))
    and d.active;
$$;

grant execute on function public.resolve_school_host(text) to anon, authenticated;
