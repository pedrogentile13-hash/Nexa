-- ============================================================================
-- Nexa — Funções do banco só para quem está logado
--
-- No Supabase, toda função em `public` nasce executável por QUALQUER pessoa, até
-- por quem nem entrou (a chave "anon" é pública, vai no navegador). Muitas funções
-- aqui conferem o usuário por dentro, mas não dá para depender disso em todas.
-- Agora só quem está logado chama funções; visitante sem login só consegue
-- descobrir a qual escola um endereço pertence (`resolve_school_host`), que a tela
-- de login precisa. Funções novas já nascem assim.
-- ============================================================================
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on all functions in schema public to service_role;
  end if;
end;
$$;

-- As duas que o visitante precisa: a do endereço da escola (tela de login) e o
-- registro de erro da própria tela de login (acontece antes de existir sessão).
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;

-- Como `report_error` é aberta ao visitante, ganha um teto contra enchente: passou de
-- 300 registros no último minuto, descarta (o painel de erros não vira lixeira).
create or replace function public.report_error(
  p_message text,
  p_origin text default 'client',
  p_stack text default null,
  p_pathname text default null,
  p_digest text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message text := nullif(btrim(p_message), '');
begin
  if v_message is null then
    return;
  end if;

  if (select count(*) from public.error_reports where created_at > now() - interval '1 minute') >= 300 then
    return;
  end if;

  insert into public.error_reports (
    user_id, origin, message, stack, pathname, digest, user_agent
  ) values (
    auth.uid(),
    case when p_origin = 'server' then 'server' else 'client' end,
    left(v_message, 2000),
    left(nullif(btrim(p_stack), ''), 8000),
    left(split_part(nullif(btrim(p_pathname), ''), '?', 1), 300),
    left(nullif(btrim(p_digest), ''), 100),
    left(nullif(btrim(p_user_agent), ''), 400)
  );
end;
$$;
grant execute on function public.report_error(text, text, text, text, text, text) to authenticated, anon;

alter default privileges in schema public revoke execute on functions from public, anon;
