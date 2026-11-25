-- ============================================================================
-- Nexa — Contas criadas pela escola (login + senha, sem e-mail)
--
-- No endereço de uma escola (ex.: anglomorumbi.nexastudy.com.br) ninguém se
-- cadastra, não há Google nem "esqueci a senha": a coordenação/direção cria a
-- conta no painel, com um login definido e uma senha aleatória.
--
-- Por baixo, o Supabase Auth exige um e-mail, então o app fabrica um a partir
-- do login e do endereço da escola (`ana.silva@anglomorumbi.nexastudy.com.br`).
-- Ele nunca é usado para enviar nada. O que o aluno enxerga é só o LOGIN.
--
-- Esta migração guarda o login no perfil e FECHA UM BURACO: até aqui qualquer
-- aluno podia escolher a própria escola no Perfil (a policy de update libera a
-- linha toda), ou seja, podia se vincular a uma escola cliente sozinho e ver o
-- que é restrito a ela (eventos, comunidades da escola).
-- ============================================================================

alter table public.profiles add column if not exists school_login text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_school_login_check') then
    alter table public.profiles add constraint profiles_school_login_check
      check (school_login is null or school_login ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
  end if;
end;
$$;

-- Um login por escola; o mesmo login pode existir em escolas diferentes.
create unique index if not exists profiles_school_login_uq
  on public.profiles (school_id, school_login)
  where school_login is not null;

comment on column public.profiles.school_login is
  'Login da conta criada pela escola (sem e-mail). Só administrador altera.';

-- ------------------------------------------------------------------ trava --
-- Substitui `guard_profile_role` (já estendida na migração de hierarquia) com
-- as regras novas. `auth.uid() is null` continua sendo o SQL Editor/service_role.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.school_title is distinct from old.school_title
     or new.school_login is distinct from old.school_login then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;

  if new.school_id is distinct from old.school_id or new.class_id is distinct from old.class_id then
    -- Quem gerencia a escola (a de origem ou a de destino) vincula e move alunos.
    if (old.school_id is not null and public.can_manage_school(old.school_id))
       or (new.school_id is not null and public.can_manage_school(new.school_id)) then
      return new;
    end if;

    -- Conta criada pela escola: o aluno não troca de escola nem de turma.
    if old.school_login is not null then
      raise exception 'esta conta é gerenciada pela escola' using errcode = '42501';
    end if;

    -- Escola com endereço próprio só tem alunos cadastrados por ela mesma.
    if new.school_id is not null
       and new.school_id is distinct from old.school_id
       and exists (select 1 from public.school_domains d where d.school_id = new.school_id) then
      raise exception 'esta escola cadastra os próprios alunos' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
