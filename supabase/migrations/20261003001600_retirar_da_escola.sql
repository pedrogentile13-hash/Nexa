-- ============================================================================
-- Nexa — Retirar (ou realocar) uma pessoa da escola
--
-- Um aluno que entrou por conta própria (Google, e-mail) e foi parar na escola
-- errada precisa sair sem apagar a conta. Quem pode:
--   · admin geral / admin: retira ou realoca para outra escola;
--   · direção/coordenação: só RETIRA gente da própria escola.
-- Só vale para ALUNO com conta própria: contas criadas pela escola (login e
-- senha) são apagadas no painel de Contas, e equipe/admin não é movida aqui.
-- ============================================================================
create or replace function public.move_person_school(p_user_id uuid, p_school_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_target public.profiles%rowtype;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  select * into v_target from public.profiles where id = p_user_id;
  if not found then
    raise exception 'pessoa não encontrada' using errcode = 'P0002';
  end if;
  if v_target.role is distinct from 'student' then
    raise exception 'só alunos podem ser movidos aqui' using errcode = '22023';
  end if;
  if v_target.school_login is not null then
    raise exception 'esta conta foi criada pela escola: apague-a em Contas da escola' using errcode = '22023';
  end if;

  if not public.is_admin(v_me) then
    if v_target.school_id is null
       or p_school_id is not null
       or public.school_staff_level(v_target.school_id, v_me) < 2 then
      raise exception 'não autorizado' using errcode = '42501';
    end if;
  end if;

  if p_school_id is not null and not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'escola inválida' using errcode = '22023';
  end if;

  update public.profiles set school_id = p_school_id, class_id = null where id = p_user_id;
end;
$$;

grant execute on function public.move_person_school(uuid, uuid) to authenticated;
