create or replace function public.profile_is_managed_school(p_school_id uuid, p_role text, p_school_login text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_school_id is not null
    and p_role <> 'admin'
    and (
      p_school_login is not null
      or p_role in ('school_admin', 'teacher_admin')
      or exists (select 1 from public.school_domains d where d.school_id = p_school_id)
    );
$$;
revoke execute on function public.profile_is_managed_school(uuid, text, text) from public, anon;
create or replace function public.profiles_school_journey()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.journey is distinct from 'school'
     and public.profile_is_managed_school(new.school_id, new.role::text, new.school_login) then
    new.journey := 'school';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_school_journey on public.profiles;
create trigger profiles_school_journey before insert or update on public.profiles
  for each row execute function public.profiles_school_journey();
update public.profiles p
set journey = 'school'
where p.journey is distinct from 'school'
  and public.profile_is_managed_school(p.school_id, p.role::text, p.school_login);
revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
