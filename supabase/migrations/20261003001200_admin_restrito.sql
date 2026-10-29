-- ============================================================================
-- Nexa — Admin restrito da plataforma
--
-- A plataforma tem dois níveis de administrador:
--   * admin GERAL   (role = 'admin', admin_scope nulo)      — tudo
--   * admin RESTRITO (role = 'admin', admin_scope = 'limited') — conteúdo,
--     relatórios e moderação; NÃO muda papéis de ninguém, não mexe em escolas
--     nem em configurações. As telas escondem essas opções; esta migração faz o
--     BANCO impor o que mais importa: o restrito não consegue se promover nem
--     promover ninguém (um `update profiles set role = ...` direto também falha).
--
-- Direção, coordenação e professores NÃO são dados pela plataforma: a escola
-- cria essas contas no próprio painel (Contas da escola).
-- ============================================================================

alter table public.profiles add column if not exists admin_scope text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_admin_scope_check') then
    alter table public.profiles add constraint profiles_admin_scope_check
      check (admin_scope is null or admin_scope = 'limited');
  end if;
end;
$$;

comment on column public.profiles.admin_scope is
  'Só vale para role = admin: nulo = admin geral; limited = admin com funções bloqueadas.';

create or replace function public.is_full_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = 'admin' and p.admin_scope is null from public.profiles p where p.id = p_user_id), false);
$$;

grant execute on function public.is_full_admin(uuid) to authenticated;

-- Mesma trava de perfil de antes, agora com o degrau do admin restrito.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- SQL Editor / service_role e o admin geral podem tudo.
  if auth.uid() is null or public.is_full_admin() then
    return new;
  end if;

  -- Ninguém mais muda papel, título, login de escola nem o escopo de admin —
  -- nem o admin restrito (senão ele se promoveria com um update direto).
  if new.role is distinct from old.role
     or new.school_title is distinct from old.school_title
     or new.school_login is distinct from old.school_login
     or new.admin_scope is distinct from old.admin_scope then
    raise exception 'apenas o administrador geral pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;

  -- O admin restrito segue podendo mover alunos entre escolas e turmas (como antes).
  if public.is_admin() then
    return new;
  end if;

  if new.school_id is distinct from old.school_id or new.class_id is distinct from old.class_id then
    if (old.school_id is not null and public.can_manage_school(old.school_id))
       or (new.school_id is not null and public.can_manage_school(new.school_id)) then
      return new;
    end if;

    if old.school_login is not null then
      raise exception 'esta conta é gerenciada pela escola' using errcode = '42501';
    end if;

    if new.school_id is not null
       and new.school_id is distinct from old.school_id
       and exists (select 1 from public.school_domains d where d.school_id = new.school_id) then
      raise exception 'esta escola cadastra os próprios alunos' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
