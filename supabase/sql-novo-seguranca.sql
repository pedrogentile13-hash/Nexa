revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on all functions in schema public to service_role;
  end if;
end;
$$;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
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
