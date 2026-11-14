-- Administrador da plataforma não é "membro de escola": mesmo com escola no perfil, vê os planos
-- como qualquer conta do Nexa padrão (a escola é gerida pelo portal /escola, não por esta regra).
create or replace function public.is_managed_school_member(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.school_id is not null
      and p.role <> 'admin'
      and (
        p.school_login is not null
        or p.role in ('school_admin', 'teacher_admin')
        or exists (select 1 from public.school_domains d where d.school_id = p.school_id)
      )
  );
$$;

grant execute on function public.is_managed_school_member(uuid) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
