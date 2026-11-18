-- ============================================================================
-- Nexa — Selo da escola (segundo logo)
--
-- Além do logo, a escola pode ter um SELO/certificação para exibir na tela de
-- entrada (ex.: "Leader in Me — Legacy School" do Anglo Morumbi). Mesmas regras
-- do logo: só `https://` ou um arquivo local em `/brand/schools/`.
-- ============================================================================

alter table public.school_branding add column if not exists badge_url text;

alter table public.school_branding drop constraint if exists school_branding_badge_url_check;
alter table public.school_branding add constraint school_branding_badge_url_check
  check (
    badge_url is null
    or (length(badge_url) <= 500 and (badge_url ~ '^https://' or badge_url ~ '^/brand/schools/[a-z0-9._-]+$'))
  );

-- O tipo de retorno muda (ganha `badge_url`), então a função antiga sai antes.
drop function if exists public.resolve_school_host(text);

create or replace function public.resolve_school_host(p_host text)
returns table (
  school_id uuid,
  display_name text,
  logo_url text,
  brand text,
  brand_text text,
  brand_soft text,
  badge_url text
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
    b.brand_soft,
    b.badge_url
  from public.school_domains d
  join public.schools s on s.id = d.school_id
  left join public.school_branding b on b.school_id = d.school_id
  where d.host = lower(btrim(p_host))
    and d.active;
$$;

grant execute on function public.resolve_school_host(text) to anon, authenticated;
